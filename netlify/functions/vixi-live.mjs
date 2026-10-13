const API_BASE = "https://api.vixisuite.thefamousgroup.com";
const IMAGE_HOSTS = new Set(["storage.googleapis.com"]);

export default async (req) => {
  if (req.method === "OPTIONS") return json({}, 204);
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = new URL(req.url);
  const image = url.searchParams.get("image") || "";
  if (image) {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
    return proxyImage(image);
  }
  const key = await readApiKey(req);
  if (!key) return json({ error: "Enter an API key." }, 401);
  if (["key", "apikey", "api-key", "api_key", "password", "token"].some((name) => url.searchParams.has(name))) {
    return json({ error: "Send the API key in the Authorization header." }, 400);
  }
  const part = url.searchParams.get("part") === "mosaic" ? "mosaic" : "playlist";
  try {
    const photos = await mosaicEntries(key);
    if (part === "mosaic") return json({ photos });
    const captures = await playlistCaptures(key);
    return json({ captures, photos });
  } catch (err) {
    const status = Number(err && err.status) || 502;
    const message = status === 401 ? "That API key was not accepted." : "Could not read the Vixi feed.";
    return json({ error: message }, status === 401 ? 401 : 502);
  }
};

export const config = {
  path: "/api/vixi-live",
};

async function readApiKey(req) {
  const custom = cleanKey(req.headers.get("x-vixi-key"));
  if (custom) return custom;
  const header = String(req.headers.get("authorization") || "");
  const match = header.match(/^ApiKey\s+(\S+)$/);
  if (match) return cleanKey(match[1]);
  if (req.method !== "POST") return "";
  const text = await req.text();
  return cleanKey(new URLSearchParams(text).get("key"));
}

function cleanKey(value) {
  return String(value || "").replace(/[\s\u200B-\u200D\uFEFF]/g, "");
}

async function vixiGet(key, path, params) {
  const target = new URL(API_BASE + path);
  if (params) {
    params.forEach((value, name) => target.searchParams.append(name, value));
  }
  const response = await fetch(target, {
    headers: {
      Authorization: "ApiKey " + key,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    const error = new Error("Vixi " + response.status);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function mosaicEntries(key) {
  const body = await vixiGet(key, "/playlist/v1/mosaic-entries");
  return uniquePhotos(photoUrls(body));
}

async function playlistCaptures(key) {
  const params = new URLSearchParams();
  params.append("format", "json");
  [
    "id:::id",
    "message:::userData.mes00",
    "name:::userData.nam00",
    "original:::imageWithOverlayUrl",
    "image:::imageUrl",
    "photo_ai:::appsProcessData.photo_ai.processedAssetsUrls",
    "updated:::updatedAt",
    "tags:::tags",
  ].forEach((column) => params.append("column", column));
  params.append("filter", 'tags=in=("In Playlist")');
  const body = await vixiGet(key, "/capture/v1/captures/export", params);
  return unwrapList(body).map(normalizeCapture).filter((row) => row.id || row.src);
}

function normalizeCapture(row) {
  const tags = Array.isArray(row && row.tags) ? row.tags.map((tag) => String(tag)) : [];
  const lowered = tags.map((tag) => tag.toLowerCase());
  const kind = lowered.some((tag) => tag.includes("mosaic"))
    ? "mosaic"
    : lowered.some((tag) => tag.includes("message"))
      ? "message"
      : "other";
  return {
    id: String((row && row.id) || "").trim(),
    kind,
    updated: String((row && row.updated) || "").trim(),
    message: String((row && row.message) || "").trim(),
    name: String((row && row.name) || "").trim(),
    src: imageUrl(row),
    tags,
  };
}

function imageUrl(row) {
  if (!row || typeof row !== "object") return "";
  const processed = asUrl(row.photo_ai);
  if (processed) return processed;
  return asUrl(row.original) || asUrl(row.image) || asUrl(row.src) || asUrl(row.url);
}

function asUrl(value) {
  if (Array.isArray(value)) {
    const found = value.find((item) => typeof item === "string" && item.trim());
    return found ? httpsUrl(found) : "";
  }
  if (typeof value === "string") return httpsUrl(value);
  if (value && typeof value === "object" && value.processedAssetsUrls) return asUrl(value.processedAssetsUrls);
  return "";
}

function httpsUrl(value) {
  const text = String(value || "").trim();
  if (!/^https:\/\//i.test(text)) return "";
  if (/\/config\//i.test(text) || /output_logo|layers__logo|default_am_output_logo/i.test(text)) return "";
  return text;
}

function photoUrls(body) {
  return unwrapList(body).map((item) => {
    if (typeof item === "string") return httpsUrl(item);
    if (!item || typeof item !== "object") return "";
    return httpsUrl(item.url || item.src || item.image || item.imageUrl || item.original || "");
  });
}

function uniquePhotos(list) {
  const out = [];
  const seen = new Set();
  list.forEach((src) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    out.push(src);
  });
  return out;
}

function unwrapList(body) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  const keys = ["entries", "items", "data", "captures", "results", "mosaicEntries", "playlist"];
  for (const key of keys) {
    if (Array.isArray(body[key])) return body[key];
  }
  return [];
}

async function proxyImage(raw) {
  let target;
  try {
    target = new URL(raw);
  } catch {
    return json({ error: "Missing image." }, 400);
  }
  if (target.protocol !== "https:" || !IMAGE_HOSTS.has(target.hostname)) {
    return json({ error: "That image host is not allowed." }, 400);
  }
  const upstream = await fetch(target, { signal: AbortSignal.timeout(20000) });
  if (!upstream.ok) return json({ error: "Could not load that image." }, 502);
  const headers = new Headers();
  const type = upstream.headers.get("content-type");
  if (type) headers.set("content-type", type);
  headers.set("cache-control", "public, max-age=86400");
  return new Response(upstream.body, { status: 200, headers });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization",
      "access-control-allow-methods": "GET, OPTIONS",
    },
  });
}
