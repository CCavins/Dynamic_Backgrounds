import crypto from "node:crypto";
import tls from "node:tls";

const PLAYLIST_WS = "wss://api.vixisuite.thefamousgroup.com/playlist/ws/engine";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return json({}, 204);
  }
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }
  const pageUrl = new URL(req.url).searchParams.get("url") || "";
  try {
    const session = await readOutput(pageUrl);
    return json(session);
  } catch (err) {
    const message = err && err.message ? err.message : "Could not read that output";
    return json({ error: message }, 400);
  }
};

export const config = {
  path: "/api/output-session",
};

export async function readOutput(pageUrl) {
  const start = validatePageUrl(pageUrl);
  const finalUrl = await followOutput(start.href);
  const token = new URL(finalUrl).searchParams.get("token");
  if (!token) {
    throw new Error("That output link did not include a live playlist.");
  }
  const wsUrl = PLAYLIST_WS + "?token=" + encodeURIComponent(token);
  const htmlPromise = fetch(finalUrl, {
    headers: { accept: "text/html" },
    signal: AbortSignal.timeout(6000),
  })
    .then((res) => (res.ok ? res.text() : ""))
    .catch(() => "");
  const live = await listen(wsUrl);
  const stage = stageFromHtml(await htmlPromise);
  const forced = forcedKind(start.href);
  const application = forced || live.application || "";
  return {
    scene: application || "other",
    application,
    photos: live.photos,
    capture: live.capture,
    native: live.native,
    stage,
    wsUrl,
  };
}

function stageFromHtml(html) {
  const match = String(html || "").match(/\b(\d{3,4})x(\d{3,4})\b/);
  const w = match ? Number(match[1]) : 1920;
  const h = match ? Number(match[2]) : 1080;
  if (w < 320 || h < 240) return { w: 1920, h: 1080 };
  return { w, h };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "cache-control": "no-store",
    },
  });
}

function validatePageUrl(raw) {
  let url;
  try {
    url = new URL(String(raw || "").trim());
  } catch {
    throw new Error("Enter a full output URL.");
  }
  if (url.protocol !== "https:") {
    throw new Error("The output URL needs to start with https.");
  }
  if (!allowedHost(url.hostname)) {
    throw new Error("Use a Vixi output URL.");
  }
  return url;
}

function allowedHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return host === "thefamousgroup.com" || host.endsWith(".thefamousgroup.com") || host.includes("vixisuite");
}

function forcedKind(url) {
  if (/[?&]standalone=mosaic(?:&|$)/i.test(url)) return "mosaic";
  if (/[?&]standalone=message(?:&|$)/i.test(url)) return "message";
  return "";
}

async function followOutput(start) {
  let current = start;
  const cookies = new Map();
  for (let hop = 0; hop < 6; hop += 1) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: {
        accept: "text/html",
        "user-agent": "Mozilla/5.0",
        cookie: cookieHeader(cookies),
      },
    });
    collectCookies(res, cookies);
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) break;
      const next = new URL(location, current);
      if (!allowedHost(next.hostname)) {
        throw new Error("That output link redirected away from Vixi.");
      }
      current = next.href;
      continue;
    }
    return current;
  }
  return current;
}

function collectCookies(res, cookies) {
  const list = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  list.forEach((line) => {
    const pair = String(line || "").split(";")[0];
    const eq = pair.indexOf("=");
    if (eq <= 0) return;
    cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  });
}

function cookieHeader(cookies) {
  return [...cookies.entries()].map(([key, value]) => key + "=" + value).join("; ");
}

function listen(wsUrl) {
  return new Promise((resolve, reject) => {
    const state = { photos: [], application: "", capture: null, native: null };
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        /* already closed */
      }
      resolve(state);
    };
    const timer = setTimeout(finish, 4500);
    const socket = openWebSocket(wsUrl);
    socket.onmessage = (text) => {
      ingest(state, text);
      if (state.photos.length && state.application) finish();
    };
    socket.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error("Could not reach the live output."));
    };
  });
}

function ingest(state, raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }
  const event = data && data.event;
  const payload = (data && data.data) || {};
  if (event === "mosaic.entries" && Array.isArray(payload.entries)) {
    state.photos = uniquePhotos(payload.entries);
  } else if (event === "mosaic.changed") {
    const next = state.photos.slice();
    (payload.added || []).forEach((src) => {
      if (typeof src === "string" && src && !next.includes(src)) next.push(src);
    });
    (payload.removed || []).forEach((src) => {
      const at = next.indexOf(src);
      if (at >= 0) next.splice(at, 1);
    });
    state.photos = uniquePhotos(next);
  }
  const scene = payload.currentScene;
  if (!scene || !scene.application) return;
  state.application = String(scene.application);
  const meta = scene.metadata || {};
  state.native = {
    application: state.application,
    metadata: {
      type: meta.type || "",
      assetUrl: meta.assetUrl || "",
      videoUrl: meta.videoUrl || "",
      processedVideoUrl: meta.processedVideoUrl || "",
      processedAssetUrl: meta.processedAssetUrl || "",
      imageUrl: meta.imageUrl || "",
    },
  };
  if (scene.application === "message") {
    const capture = captureFromScene(scene);
    if (capture) state.capture = capture;
  }
}

function uniquePhotos(list) {
  const out = [];
  const seen = new Set();
  (list || []).forEach((src) => {
    if (typeof src !== "string" || !/^https?:/i.test(src)) return;
    if (/\/config\//i.test(src) || /output_logo|layers__logo|default_am_output_logo/i.test(src)) return;
    if (seen.has(src)) return;
    seen.add(src);
    out.push(src);
  });
  return out;
}

function captureFromScene(scene) {
  const meta = scene.metadata || {};
  const userData = meta.userData && typeof meta.userData === "object" ? meta.userData : {};
  const message = textValue(userData.mes00 || userData.message || userData.Message);
  const name = textValue(userData.nam00 || userData.name || userData.Name);
  const fields = { message, name };
  const questions = [];
  Object.keys(userData).forEach((key) => {
    if (key === "mes00" || key === "nam00" || key === "ema00") return;
    if (/email/i.test(key)) return;
    const text = textValue(userData[key]);
    if (!text || text === message || text === name) return;
    questions.push(text);
    const n = questions.length;
    fields["question" + n] = text;
    fields["question_" + n] = text;
    fields["q" + n] = text;
  });
  fields.questions = questions;
  let src = textValue(meta.assetUrl || meta.imageUrl || "");
  if (!/^https?:/i.test(src) || /\/config\//i.test(src)) src = "";
  if (!src && !message && !name) return null;
  return { src, message, name, fields };
}

function textValue(value) {
  return String(value || "").trim();
}

function openWebSocket(wsUrl) {
  const url = new URL(wsUrl);
  const key = crypto.randomBytes(16).toString("base64");
  const socket = tls.connect(443, url.hostname, { servername: url.hostname });
  const client = { onmessage: null, onerror: null, close() { socket.end(); } };
  let upgraded = false;
  let pending = Buffer.alloc(0);
  socket.on("error", () => {
    if (client.onerror) client.onerror();
  });
  socket.on("secureConnect", () => {
    socket.write(
      "GET " + url.pathname + url.search + " HTTP/1.1\r\n" +
        "Host: " + url.hostname + "\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        "Sec-WebSocket-Key: " + key + "\r\n" +
        "Sec-WebSocket-Version: 13\r\n\r\n"
    );
  });
  socket.on("data", (chunk) => {
    pending = Buffer.concat([pending, chunk]);
    if (!upgraded) {
      const sep = pending.indexOf("\r\n\r\n");
      if (sep < 0) return;
      const head = pending.slice(0, sep).toString("utf8");
      pending = pending.slice(sep + 4);
      if (!/^HTTP\/1\.[01] 101/.test(head)) {
        if (client.onerror) client.onerror();
        socket.end();
        return;
      }
      upgraded = true;
    }
    const parsed = takeFrames(pending);
    pending = parsed.rest;
    parsed.texts.forEach((text) => {
      if (client.onmessage) client.onmessage(text);
    });
  });
  return client;
}

function takeFrames(buffer) {
  const texts = [];
  let pending = buffer;
  while (pending.length >= 2) {
    const opcode = pending[0] & 0x0f;
    let length = pending[1] & 0x7f;
    let offset = 2;
    if (length === 126) {
      if (pending.length < 4) break;
      length = pending.readUInt16BE(2);
      offset = 4;
    } else if (length === 127) {
      if (pending.length < 10) break;
      const big = pending.readBigUInt64BE(2);
      if (big > BigInt(1024 * 1024)) return { rest: Buffer.alloc(0), texts };
      length = Number(big);
      offset = 10;
    }
    if (pending.length < offset + length) break;
    const payload = pending.slice(offset, offset + length);
    pending = pending.slice(offset + length);
    if (opcode === 0x1) texts.push(payload.toString("utf8"));
  }
  return { rest: pending, texts };
}
