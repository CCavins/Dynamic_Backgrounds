(() => {
  const rules = globalThis.BGExtensionRules;
  const themeApi = globalThis.BGMosaicThemes;
  if (!rules || !themeApi) return;

  const OVERLAY_ID = "dyn-mosaic-theme";
  const STYLE_ID = "dyn-mosaic-theme-style";
  const WRAPPER_SELECTOR = ".v2-app-wrapper";

  let applyTimer = 0;
  let tickTimer = 0;
  let dealIndex = 0;
  let mountedTheme = "";
  let mountedEmpty = true;
  let active = null;
  const liveSet = new Set();
  const retiring = new Set();
  const incoming = [];
  const pool = [];
  let lastShown = "";

  function collectUrls() {
    const urls = [];
    const seenNow = new Set();
    document.querySelectorAll(".v2-asset-tile img, .v2-mosaic-face img").forEach((img) => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith("data:")) return;
      if (img.closest(".v2-qr-tile")) return;
      if (img.classList.contains("v2-app-wrapper__bg-image")) return;
      if (seenNow.has(src)) return;
      seenNow.add(src);
      urls.push(src);
    });
    return urls;
  }

  function syncFeed() {
    const now = collectUrls();
    const nowSet = new Set(now);
    const added = [];
    now.forEach((src) => {
      if (!liveSet.has(src)) {
        added.push(src);
        incoming.push(src);
      }
      retiring.delete(src);
    });
    const removed = [];
    liveSet.forEach((src) => {
      if (nowSet.has(src)) return;
      removed.push(src);
      retiring.add(src);
    });
    liveSet.clear();
    now.forEach((src) => liveSet.add(src));
    pool.length = 0;
    now.forEach((src) => pool.push(src));
    if (dealIndex >= pool.length) dealIndex = 0;
    for (let i = incoming.length - 1; i >= 0; i -= 1) {
      if (!liveSet.has(incoming[i])) incoming.splice(i, 1);
    }
    return { added, removed };
  }

  function nextUrl(avoid) {
    const blocked = visibleOverlaySrcs();
    addAvoid(blocked, avoid);
    if (lastShown) blocked.add(lastShown);

    function takeIncoming(filter) {
      for (let i = 0; i < incoming.length; i += 1) {
        const src = incoming[i];
        if (!src || !liveSet.has(src) || retiring.has(src)) continue;
        if (filter && filter.has(src)) continue;
        incoming.splice(i, 1);
        return src;
      }
      return "";
    }

    function takePool(filter) {
      if (!pool.length) return "";
      for (let step = 0; step < pool.length; step += 1) {
        const src = pool[(dealIndex + step) % pool.length];
        if (!src || retiring.has(src)) continue;
        if (filter && filter.has(src)) continue;
        dealIndex = (dealIndex + step + 1) % pool.length;
        return src;
      }
      return "";
    }

    const picked = takeIncoming(blocked) || takePool(blocked);
    if (picked) {
      lastShown = picked;
      return picked;
    }

    const soft = new Set();
    addAvoid(soft, avoid);
    if (lastShown) soft.add(lastShown);
    const fallback = takeIncoming(soft) || takePool(soft);
    if (fallback) {
      lastShown = fallback;
      return fallback;
    }
    const recycle = takePool(null);
    if (recycle) {
      lastShown = recycle;
      return recycle;
    }
    return pool[0] || "";
  }

  function visibleOverlaySrcs() {
    const blocked = new Set();
    const root = document.getElementById(OVERLAY_ID);
    if (!root) return blocked;
    root.querySelectorAll(".dyn-card img").forEach((img) => {
      const src = img.currentSrc || img.src;
      if (src) blocked.add(src);
    });
    return blocked;
  }

  function addAvoid(set, avoid) {
    if (!avoid) return;
    if (typeof avoid === "string") {
      if (avoid) set.add(avoid);
      return;
    }
    if (typeof avoid[Symbol.iterator] === "function") {
      for (const src of avoid) {
        if (src) set.add(src);
      }
    }
  }

  function makeApi() {
    return {
      nextUrl,
      isRetiring(src) {
        return Boolean(src && retiring.has(src));
      },
      hasIncoming() {
        return incoming.some((src) => liveSet.has(src));
      },
    };
  }

  function ensureStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }
    if (style.textContent !== themeApi.STYLE) {
      style.textContent = themeApi.STYLE;
    }
  }

  function ensureOverlay() {
    const wrapper = document.querySelector(WRAPPER_SELECTOR);
    if (!wrapper) return null;
    let root = document.getElementById(OVERLAY_ID);
    if (!root || root.parentElement !== wrapper) {
      if (root) root.remove();
      root = document.createElement("div");
      root.id = OVERLAY_ID;
      wrapper.appendChild(root);
    }
    return root;
  }

  function stopTick() {
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = 0;
    }
  }

  function startTick(interval) {
    stopTick();
    tickTimer = setInterval(() => {
      if (!active || pool.length < 1) return;
      const root = document.getElementById(OVERLAY_ID);
      if (!root || typeof active.def.tick !== "function") return;
      active.def.tick(root, pool, active.state, makeApi());
    }, interval || 2500);
  }

  function unmountTheme() {
    stopTick();
    const root = document.getElementById(OVERLAY_ID);
    if (active && active.def && typeof active.def.unmount === "function" && root) {
      active.def.unmount(root, active.state);
    }
    if (root) root.replaceChildren();
    active = null;
    mountedTheme = "";
    lastShown = "";
  }

  function mountTheme(id) {
    const def = themeApi.themes[id];
    if (!def) return false;
    unmountTheme();
    const root = ensureOverlay();
    if (!root) return false;
    root.dataset.theme = id;
    const state = def.mount(root, pool, makeApi()) || {};
    active = { id, def, state };
    mountedTheme = id;
    mountedEmpty = pool.length === 0;
    startTick(def.interval);
    return true;
  }

  function teardown() {
    unmountTheme();
    document.documentElement.classList.remove("dyn-mosaic-on");
    const root = document.getElementById(OVERLAY_ID);
    if (root) root.remove();
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  async function apply() {
    if (typeof rules.extensionAlive === "function" && !rules.extensionAlive()) {
      stopTick();
      observer.disconnect();
      return;
    }
    const settings = await rules.loadSettings();
    const theme = settings.enabled ? rules.normalizeMosaicTheme(settings.mosaicTheme) : "off";
    const hasMosaic = Boolean(document.querySelector(".mosaic-tile-slot"));
    const def = themeApi.themes[theme];

    if (theme === "off" || !def || !hasMosaic) {
      teardown();
      return;
    }

    ensureStyle();
    document.documentElement.classList.add("dyn-mosaic-on");
    const { added, removed } = syncFeed();

    const overlay = document.getElementById(OVERLAY_ID);
    if (mountedTheme !== theme || !overlay) {
      mountTheme(theme);
      return;
    }

    if (pool.length && mountedEmpty) {
      mountTheme(theme);
      return;
    }

    if (active && (added.length || removed.length) && typeof active.def.tick === "function") {
      const bursts = Math.min(Math.max(added.length, removed.length ? 1 : 0), 3);
      for (let i = 0; i < bursts; i += 1) {
        active.def.tick(overlay, pool, active.state, makeApi());
      }
    }
  }

  function scheduleApply() {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      applyTimer = 0;
      apply().catch(() => {});
    }, 50);
  }

  const observer = new MutationObserver((records) => {
    const relevant = records.some((record) => {
      const target = record.target;
      if (!target) return true;
      if (target.id === OVERLAY_ID) return false;
      if (typeof target.closest === "function" && target.closest("#" + OVERLAY_ID)) return false;
      return true;
    });
    if (relevant) scheduleApply();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") scheduleApply();
    });
  } catch {
    /* extension reloaded */
  }

  apply().catch(() => {});
})();
