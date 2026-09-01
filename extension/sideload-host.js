/**
 * Runs in the USER_SCRIPT world (via chrome.userScripts).
 * Sideloaded engines register on BGThemeEngines here; content scripts call
 * them through window.postMessage + CustomEvents.
 */
(function () {
  const CALL = "dyn-bg-us-call";
  const RESULT = "dyn-bg-us-result";
  const READY = "data-dyn-sideload";

  function signalReady() {
    document.documentElement.setAttribute(READY, "1");
    document.documentElement.dispatchEvent(new CustomEvent("dyn-bg-sideload-ready"));
    window.postMessage({ source: "dyn-bg-sideload", type: "ready" }, "*");
  }

  // Hot re-inject after Import packs… — keep one listener set, re-signal ready.
  if (globalThis.__DYN_SIDELOAD_HOST__) {
    signalReady();
    return;
  }
  globalThis.__DYN_SIDELOAD_HOST__ = true;

  const states = new Map();
  let seq = 0;

  // Content-script mosaic helpers are not visible here — provide a minimal makeCard.
  if (!globalThis.BGMosaicThemes || typeof globalThis.BGMosaicThemes.makeCard !== "function") {
    globalThis.BGMosaicThemes = globalThis.BGMosaicThemes || {};
    globalThis.BGMosaicThemes.makeCard = function makeCard(src, className) {
      const card = document.createElement("div");
      card.className = className ? "dyn-card " + className : "dyn-card";
      const img = document.createElement("img");
      img.alt = "";
      const markReady = () => {
        if (!img.naturalWidth) return;
        img.classList.remove("dyn-feed-pending");
        card.classList.add("dyn-feed-ready");
        card.classList.remove("dyn-feed-pending");
      };
      img.addEventListener("load", markReady);
      img.addEventListener("error", () => {
        img.classList.add("dyn-feed-pending");
        card.classList.remove("dyn-feed-ready");
        card.classList.add("dyn-feed-pending");
      });
      if (src) {
        img.classList.add("dyn-feed-pending");
        card.classList.add("dyn-feed-pending");
        img.src = src;
        if (img.complete && img.naturalWidth) markReady();
      } else {
        card.classList.add("dyn-feed-pending");
      }
      card.appendChild(img);
      return card;
    };
  }

  function reply(requestId, payload) {
    const detail = Object.assign({ requestId }, payload || {});
    window.postMessage(
      Object.assign({ source: "dyn-bg-sideload", type: "result" }, detail),
      "*"
    );
    document.documentElement.dispatchEvent(new CustomEvent(RESULT, { detail }));
  }

  function makeApi(pool) {
    const list = Array.isArray(pool) ? pool.filter(Boolean) : [];
    let cursor = 0;
    return {
      nextUrl(avoid) {
        if (!list.length) return "";
        const blocked =
          avoid instanceof Set
            ? avoid
            : new Set(
                avoid == null
                  ? []
                  : typeof avoid === "string"
                    ? [avoid]
                    : [...avoid]
              );
        for (let n = 0; n < list.length; n += 1) {
          const src = list[cursor % list.length];
          cursor += 1;
          if (src && !blocked.has(src)) return src;
        }
        return list[0] || "";
      },
      isRetiring() {
        return false;
      },
      hasIncoming() {
        return false;
      },
    };
  }

  function findRoot(rootId) {
    const id = String(rootId || "").trim();
    if (id) {
      const byId = document.getElementById(id);
      if (byId) return byId;
    }
    return (
      document.getElementById("dyn-mosaic-theme") ||
      document.getElementById("dyn-message-theme") ||
      null
    );
  }

  function getDef(engineId) {
    const api = globalThis.BGThemeEngines;
    if (!api || typeof api.get !== "function") {
      throw new Error("BGThemeEngines is not available in the sideload host.");
    }
    const def = api.get(engineId);
    if (!def || typeof def.mount !== "function") {
      throw new Error('Sideload engine "' + engineId + '" is not registered.');
    }
    return def;
  }

  function handleCall(detail) {
    if (!detail || !detail.requestId) return;
    const requestId = detail.requestId;
    try {
      const method = String(detail.method || "");
      const engineId = String(detail.engineId || "");
      if (method === "ping") {
        reply(requestId, {
          ok: true,
          engines: globalThis.BGThemeEngines
            ? globalThis.BGThemeEngines.list().map((d) => d.id)
            : [],
        });
        return;
      }
      if (method === "has") {
        reply(requestId, {
          ok: true,
          has: Boolean(globalThis.BGThemeEngines && globalThis.BGThemeEngines.has(engineId)),
        });
        return;
      }

      const def = getDef(engineId);
      const root = findRoot(detail.rootId);

      if (method === "mount") {
        if (!root) throw new Error("Theme root not found for sideload mount.");
        const pool = Array.isArray(detail.pool) ? detail.pool.slice() : [];
        const settings =
          detail.settings && typeof detail.settings === "object" ? detail.settings : {};
        const state = def.mount(root, pool, makeApi(pool), settings) || {};
        seq += 1;
        const handle = "s" + seq;
        states.set(handle, { def, state, engineId, pool });
        reply(requestId, { ok: true, handle });
        return;
      }

      if (method === "mountMessage") {
        if (!root) throw new Error("Theme root not found for sideload mount.");
        const settings =
          detail.settings && typeof detail.settings === "object" ? detail.settings : {};
        const state = def.mount(root, settings) || {};
        seq += 1;
        const handle = "s" + seq;
        states.set(handle, { def, state, engineId, kind: "message" });
        reply(requestId, { ok: true, handle });
        return;
      }

      const handle = String(detail.handle || "");
      const entry = states.get(handle);
      if (!entry) throw new Error("Sideload engine state is gone. Reload the page.");

      if (method === "tick") {
        const pool = Array.isArray(detail.pool) ? detail.pool.slice() : entry.pool || [];
        entry.pool = pool;
        if (typeof entry.def.tick === "function") {
          entry.def.tick(root || findRoot(detail.rootId), pool, entry.state, makeApi(pool));
        }
        reply(requestId, { ok: true });
        return;
      }

      if (method === "applySettings") {
        const settings =
          detail.settings && typeof detail.settings === "object" ? detail.settings : {};
        if (typeof entry.def.applySettings === "function") {
          entry.def.applySettings(root || findRoot(detail.rootId), entry.state, settings);
        }
        reply(requestId, { ok: true });
        return;
      }

      if (method === "show") {
        const capture = detail.capture && typeof detail.capture === "object" ? detail.capture : {};
        const settings =
          detail.settings && typeof detail.settings === "object" ? detail.settings : {};
        const out = entry.def.show
          ? entry.def.show(root || findRoot(detail.rootId), capture, entry.state, settings)
          : undefined;
        Promise.resolve(out)
          .then(() => reply(requestId, { ok: true }))
          .catch((err) =>
            reply(requestId, {
              ok: false,
              error: String((err && err.message) || err || "show failed"),
            })
          );
        return;
      }

      if (method === "hide") {
        const out = entry.def.hide
          ? entry.def.hide(root || findRoot(detail.rootId), entry.state)
          : undefined;
        Promise.resolve(out)
          .then(() => reply(requestId, { ok: true }))
          .catch((err) =>
            reply(requestId, {
              ok: false,
              error: String((err && err.message) || err || "hide failed"),
            })
          );
        return;
      }

      if (method === "unmount") {
        const liveRoot = root || findRoot(detail.rootId);
        if (typeof entry.def.unmount === "function") {
          entry.def.unmount(liveRoot, entry.state);
        }
        states.delete(handle);
        reply(requestId, { ok: true });
        return;
      }

      throw new Error('Unknown sideload method "' + method + '".');
    } catch (err) {
      reply(requestId, {
        ok: false,
        error: String((err && err.message) || err || "sideload call failed"),
      });
    }
  }

  document.documentElement.addEventListener(CALL, (event) => {
    handleCall(event && event.detail);
  });

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== "dyn-bg-sideload" || data.type !== "call") return;
    handleCall(data);
  });

  signalReady();
})();
