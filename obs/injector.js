#!/usr/bin/env node
/**
 * Dynamic Themes for OBS.
 *
 * Injects the Chrome extension's theming scripts (read live from ../extension)
 * into OBS Browser Sources via the Chrome DevTools Protocol, so Vixi output
 * pages inside OBS get the exact same message/mosaic themes as in Chrome.
 *
 * Requirements: Node 22+ (built-in WebSocket), OBS launched with
 *   --remote-debugging-port=9223
 *
 * Usage:
 *   node injector.js
 *
 * Themes are configured in settings.json next to this file; edits apply live.
 */
"use strict";

const fs = require("fs");
const path = require("path");

if (typeof WebSocket === "undefined") {
  console.error("Node 22 or newer is required (this script uses the built-in WebSocket).");
  process.exit(1);
}

const HOST = process.env.OBS_DEBUG_HOST || "127.0.0.1";
const PORT = Number(process.env.OBS_DEBUG_PORT || 9223);
const POLL_MS = 2500;
// Same gate as the extension: only Vixi output pages get themed.
const PAGE_MATCH = /\/go\/(output|o)\//i;

const EXT_DIR = path.join(__dirname, "..", "extension");
const SETTINGS_PATH = path.join(__dirname, "settings.json");
const ENGINE_MANIFEST = path.join(EXT_DIR, "engines.json");

function listedEngineFiles() {
  const files = ["engines/api.js"];
  try {
    const data = JSON.parse(fs.readFileSync(ENGINE_MANIFEST, "utf8"));
    (data.engines || []).forEach((name) => {
      const file = String(name).replace(/^engines\//, "").replace(/^.*[/\\]/, "");
      if (file && !file.includes("..") && file.endsWith(".js")) files.push("engines/" + file);
    });
  } catch {
    /* engines.json optional */
  }
  return files;
}

// Same order as the extension manifest (early.js first, then document_idle set).
const FILES = [
  "early.js",
  "rules.js",
  "handoff.js",
  "content.js",
  "mosaic-themes.js",
  "message-themes.js",
  ...listedEngineFiles(),
  "custom-themes.js",
  "mosaic.js",
  "message.js",
  "vendor/three.min.js",
  "vendor/RoundedBoxGeometry.js",
  "vendor/tile-field.js",
];

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
  } catch (err) {
    console.error(`[injector] could not read settings.json: ${err.message}`);
    return {};
  }
}

function buildBundle() {
  const settings = JSON.stringify(readSettings());
  const src = FILES.map((f) => fs.readFileSync(path.join(EXT_DIR, f), "utf8")).join("\n;\n");
  return [
    "(() => {",
    // Re-running the bundle (reload or settings change) only refreshes settings.
    `if (globalThis.__VIXI_OBS__) { globalThis.__VIXI_OBS__.applySettings(${settings}); return; }`,
    "const listeners = [];",
    `let current = ${settings};`,
    "globalThis.__VIXI_OBS__ = {",
    "  applySettings(next) {",
    "    current = next;",
    "    listeners.forEach((fn) => { try { fn({}, 'local'); } catch {} });",
    "  },",
    "};",
    // Minimal chrome.* shim so the extension scripts run unmodified.
    "globalThis.chrome = {",
    "  runtime: { id: 'obs-inject', lastError: null },",
    "  storage: {",
    "    local: {",
    "      get(defaults, cb) { cb(Object.assign({}, defaults, current)); },",
    "      set(values, cb) { Object.assign(current, values); if (cb) cb(); },",
    "    },",
    "    onChanged: { addListener(fn) { listeners.push(fn); } },",
    "  },",
    "};",
    "const boot = () => {",
    src,
    "};",
    // New-document scripts can run before <html> exists; wait for it so the
    // early cover style has somewhere to attach.
    "const start = () => { if (document.documentElement) boot(); else setTimeout(start, 0); };",
    "start();",
    "})();",
  ].join("\n");
}

// One connection per browser source page, keyed by its debugger URL.
const attached = new Map();

async function listPages() {
  const res = await fetch(`http://${HOST}:${PORT}/json/list`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function rpc(conn, method, params) {
  return new Promise((resolve, reject) => {
    const id = conn.nextId++;
    conn.pending.set(id, { resolve, reject });
    conn.ws.send(JSON.stringify({ id, method, params: params || {} }));
  });
}

async function injectInto(conn) {
  const bundle = buildBundle();
  await rpc(conn, "Page.enable");
  // Replace the reload-persistent script so future navigations get the
  // latest code and settings, then apply to the already-loaded page.
  if (conn.scriptId) {
    await rpc(conn, "Page.removeScriptToEvaluateOnNewDocument", { identifier: conn.scriptId }).catch(() => {});
    conn.scriptId = null;
  }
  const added = await rpc(conn, "Page.addScriptToEvaluateOnNewDocument", { source: bundle });
  conn.scriptId = added.identifier;
  await rpc(conn, "Runtime.evaluate", { expression: bundle });
}

function attach(page) {
  const url = page.webSocketDebuggerUrl;
  if (!url || attached.has(url)) return;
  const ws = new WebSocket(url);
  const conn = { ws, nextId: 1, pending: new Map(), scriptId: null, pageUrl: page.url };
  attached.set(url, conn);

  ws.addEventListener("open", async () => {
    try {
      await injectInto(conn);
      console.log(`[injector] themed browser source: ${page.url}`);
    } catch (err) {
      console.error(`[injector] inject failed for ${page.url}: ${err.message}`);
    }
  });

  ws.addEventListener("message", (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    if (msg.id && conn.pending.has(msg.id)) {
      const { resolve, reject } = conn.pending.get(msg.id);
      conn.pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });

  const drop = () => attached.delete(url);
  ws.addEventListener("close", drop);
  ws.addEventListener("error", drop);
}

let warnedDown = false;
async function tick() {
  let pages;
  try {
    pages = await listPages();
  } catch {
    if (!warnedDown) {
      warnedDown = true;
      console.log(
        `[injector] waiting for OBS on ${HOST}:${PORT} ` +
          `(launch OBS with --remote-debugging-port=${PORT})`
      );
    }
    return;
  }
  if (warnedDown) {
    warnedDown = false;
    console.log("[injector] connected to OBS");
  }
  pages.filter((p) => p.type === "page" && PAGE_MATCH.test(p.url || "")).forEach(attach);
}

let reapplyTimer = 0;
fs.watchFile(SETTINGS_PATH, { interval: 800 }, () => {
  clearTimeout(reapplyTimer);
  reapplyTimer = setTimeout(async () => {
    console.log("[injector] settings.json changed, re-applying themes");
    for (const conn of attached.values()) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        try {
          await injectInto(conn);
        } catch (err) {
          console.error(`[injector] re-apply failed: ${err.message}`);
        }
      }
    }
  }, 250);
});

console.log(`[injector] Dynamic Themes for OBS — polling ${HOST}:${PORT} every ${POLL_MS}ms`);
tick();
setInterval(tick, POLL_MS);
