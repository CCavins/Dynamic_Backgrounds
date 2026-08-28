(() => {
  const rules = globalThis.BGExtensionRules;
  const themeApi = globalThis.BGMosaicThemes;
  const handoff = globalThis.BGThemeHandoff;
  if (!rules || !themeApi || !handoff) return;
  // Skip non-output pages entirely: no observers, no apply loop.
  if (!rules.isOutputPage(location.href)) return;

  const OVERLAY_ID = "dyn-mosaic-theme";
  const STYLE_ID = "dyn-mosaic-theme-style";

  let applyTimer = 0;
  let tickTimer = 0;
  let settleTimer = 0;
  let applyGen = 0;
  let applying = false;
  let dealIndex = 0;
  let mountedTheme = "";
  let mountedAspect = "";
  let mountedEmpty = true;
  let active = null;
  const liveSet = new Set();
  const retiring = new Set();
  const incoming = [];
  const pool = [];
  const remembered = [];
  const rememberedSet = new Set();
  let lastShown = "";

  function imageSrc(img) {
    if (typeof rules.mosaicImageSrc === "function") return rules.mosaicImageSrc(img);
    if (!img) return "";
    const src = img.currentSrc || img.src || "";
    if (src && !src.startsWith("data:")) return src;
    const srcset = img.getAttribute && img.getAttribute("srcset");
    if (!srcset) return "";
    const first = srcset.split(",")[0].trim().split(/\s+/)[0];
    return first && !first.startsWith("data:") ? first : "";
  }

  function isBrandSrc(src) {
    if (typeof rules.isBrandMosaicSrc === "function") return rules.isBrandMosaicSrc(src);
    return !src || /\/config\//i.test(src) || /output_logo|layers__logo/i.test(src);
  }

  function rememberUrls(urls) {
    (urls || []).forEach((src) => {
      if (!src || isBrandSrc(src) || rememberedSet.has(src)) return;
      rememberedSet.add(src);
      remembered.push(src);
    });
  }

  function forgetBrandUrls() {
    for (let i = remembered.length - 1; i >= 0; i -= 1) {
      if (!isBrandSrc(remembered[i])) continue;
      rememberedSet.delete(remembered[i]);
      remembered.splice(i, 1);
    }
    for (let i = pool.length - 1; i >= 0; i -= 1) {
      if (!isBrandSrc(pool[i])) continue;
      liveSet.delete(pool[i]);
      pool.splice(i, 1);
    }
  }

  function harvestOverlayUrls() {
    const urls = [];
    const seen = new Set();
    const root = document.getElementById(OVERLAY_ID);
    if (!root) return urls;
    root.querySelectorAll(".dyn-card img").forEach((img) => {
      if (img.closest(".dyn-brand-chrome, [data-qr], [data-logo], .dyn-brand-logo, .dyn-brand-qr")) {
        return;
      }
      const src = imageSrc(img);
      if (!src || isBrandSrc(src) || src.startsWith("chrome-extension:") || seen.has(src)) return;
      seen.add(src);
      urls.push(src);
    });
    return urls;
  }

  function collectUrls() {
    const urls = [];
    const seenNow = new Set();
    function add(src) {
      if (!src || isBrandSrc(src) || seenNow.has(src)) return;
      seenNow.add(src);
      urls.push(src);
    }
    rules.mosaicImages().forEach((img) => {
      const src = imageSrc(img);
      if (!src) return;
      if (rules.isSkippedMosaicImage(img)) return;
      add(src);
    });
    if (typeof rules.mosaicAssetClassUrls === "function") {
      rules.mosaicAssetClassUrls().forEach(add);
    }
    return urls;
  }

  function restoreRemembered() {
    if (pool.length || !remembered.length) return;
    remembered.forEach((src) => {
      if (!liveSet.has(src)) incoming.push(src);
      liveSet.add(src);
      pool.push(src);
    });
  }

  function overlayNeedsPhotos() {
    const root = document.getElementById(OVERLAY_ID);
    if (!root) return true;
    const cards = [...root.querySelectorAll(".dyn-card img")];
    if (!cards.length) return false;
    return cards.every((img) => {
      const src = imageSrc(img);
      return !src || isBrandSrc(src);
    });
  }

  function syncFeed() {
    forgetBrandUrls();
    rememberUrls(harvestOverlayUrls());
    const now = collectUrls();
    if (now.length) rememberUrls(now);

    // A flaky collect (covers on, Vue swap, srcset-only) must not wipe photos
    // we already have. Empty frames are only for a session that never had any.
    if (!now.length) {
      restoreRemembered();
      return { added: [], removed: [] };
    }

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

  function layoutReady(el) {
    if (!el) return false;
    return el.clientWidth >= 8 && el.clientHeight >= 8;
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
    const host = rules.findOverlayHost();
    if (!host) return null;
    let root = document.getElementById(OVERLAY_ID);
    if (!root || root.parentElement !== host) {
      if (root) host.appendChild(root);
      else {
        root = document.createElement("div");
        root.id = OVERLAY_ID;
        host.appendChild(root);
      }
    }
    root.classList.remove("is-leaving");
    if (typeof rules.applyStageFrame === "function") rules.applyStageFrame(root);
    return root;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function decodeUrl(src) {
    if (!src) return Promise.resolve();
    return new Promise((resolve) => {
      const img = new Image();
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      img.onload = () => {
        if (typeof img.decode === "function") img.decode().then(done).catch(done);
        else done();
      };
      img.onerror = done;
      img.src = src;
      setTimeout(done, 1200);
    });
  }

  function decodeUrls(urls) {
    const unique = [];
    const seen = new Set();
    (urls || []).forEach((src) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      unique.push(src);
    });
    return Promise.all(unique.slice(0, 16).map(decodeUrl));
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
      // No point churning the DOM while the display isn't visible.
      if (document.hidden) return;
      if (!active || pool.length < 1) return;
      const root = document.getElementById(OVERLAY_ID);
      if (!root || typeof active.def.tick !== "function") return;
      active.def.tick(root, pool, active.state, makeApi());
    }, interval || 2500);
  }

  function unmountTheme(opts) {
    const resetFeed = Boolean(opts && opts.resetFeed);
    stopTick();
    const root = document.getElementById(OVERLAY_ID);
    if (active && active.def && typeof active.def.unmount === "function" && root) {
      try {
        active.def.unmount(root, active.state);
      } catch {
        /* a 0-size remount can leave the theme in a bad state */
      }
    }
    if (root) root.replaceChildren();
    active = null;
    mountedTheme = "";
    mountedAspect = "";
    mountedEmpty = true;
    lastShown = "";
    if (resetFeed) {
      liveSet.clear();
      retiring.clear();
      incoming.length = 0;
      dealIndex = 0;
      pool.length = 0;
    }
  }

  function mountTheme(id) {
    const def = themeApi.themes[id];
    if (!def) return false;
    const host = rules.findOverlayHost();
    if (!host) return false;
    if (!layoutReady(host)) {
      if (active && mountedTheme === id) return true;
      return false;
    }
    rememberUrls(harvestOverlayUrls());
    rememberUrls(pool);
    unmountTheme({ resetFeed: false });
    const root = ensureOverlay();
    if (!root) return false;
    root.dataset.theme = id;
    if (def.engine) root.dataset.engine = def.engine;
    else delete root.dataset.engine;
    const state = def.mount(root, pool, makeApi()) || {};
    active = { id, def, state };
    mountedTheme = id;
    mountedAspect = rules.currentStageAspect ? rules.currentStageAspect() : "auto";
    mountedEmpty = pool.length === 0;
    if (typeof rules.ensureBrandChrome === "function") rules.ensureBrandChrome(root, "mosaic");
    startTick(def.interval);
    return true;
  }

  function teardownSoft() {
    unmountTheme({ resetFeed: true });
    document.documentElement.classList.remove("dyn-mosaic-on");
    const root = document.getElementById(OVERLAY_ID);
    if (root) root.remove();
  }

  function teardownHard() {
    teardownSoft();
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
    handoff.clearMode("mosaic");
  }

  handoff.register("mosaic", {
    hide() {
      stopTick();
      const root = document.getElementById(OVERLAY_ID);
      if (!root) return Promise.resolve();
      root.classList.add("is-leaving");
      return wait(420);
    },
    teardown: teardownSoft,
  });

  const customApi = globalThis.BGCustomThemes;
  if (customApi && typeof customApi.onChange === "function") {
    customApi.onChange(() => {
      mountedTheme = "";
      scheduleApply();
    });
  }

  function watchSettle() {
    if (settleTimer) return;
    let emptyPasses = 0;
    settleTimer = setInterval(() => {
      const overlay = document.getElementById(OVERLAY_ID);
      const host = document.getElementById(handoff.HOST_ID);
      const sized = layoutReady(overlay || host);
      if (!active || !overlay || !sized) {
        emptyPasses = 0;
        scheduleApply();
        return;
      }
      if (mountedEmpty && emptyPasses < 16) {
        emptyPasses += 1;
        scheduleApply();
        return;
      }
      clearInterval(settleTimer);
      settleTimer = 0;
    }, 300);
  }

  async function apply() {
    const gen = ++applyGen;
    applying = true;
    try {
      if (customApi && typeof customApi.whenReady === "function") {
        await Promise.race([
          customApi.whenReady(),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      }
      // Keep theming with cached settings even after an extension reload kills
      // the chrome APIs; only a page refresh swaps in the new script.
      const settings = await rules.loadSettings();
      if (gen !== applyGen) return;
      handoff.applyCovers(settings);
      const theme = settings.enabled ? rules.normalizeMosaicTheme(settings.mosaicTheme) : "off";
      const aspect = rules.normalizeStageAspect
        ? rules.normalizeStageAspect(settings.stageAspect)
        : "auto";
      const def = themeApi.themes[theme];

      if (theme === "off" || !def) {
        teardownHard();
        return;
      }

      watchSettle();
      let kind = handoff.liveKind();
      const mosaicPage = Boolean(rules.pageLooksLikeMosaic && rules.pageLooksLikeMosaic());
      const mode = handoff.currentMode();
      if (kind === "message" && !mosaicPage) return;
      if (kind !== "mosaic") {
        if (mosaicPage || (kind === "" && (!mode || mode === "mosaic"))) {
          kind = "mosaic";
        } else {
          return;
        }
      }
      await handoff.activate("mosaic", {
        prepare() {
          syncFeed();
          return decodeUrls(pool);
        },
        async reveal() {
          if (gen !== applyGen) return;
          ensureStyle();
          document.documentElement.classList.add("dyn-mosaic-on");
          const { added, removed } = syncFeed();
          const overlay = document.getElementById(OVERLAY_ID);
          const wrapper = rules.findWrapper && rules.findWrapper();
          const host = document.getElementById(handoff.HOST_ID);
          const hostMisplaced = Boolean(wrapper && host && host.parentElement !== wrapper);
          const needMount =
            mountedTheme !== theme ||
            mountedAspect !== aspect ||
            !overlay ||
            hostMisplaced ||
            (pool.length && mountedEmpty) ||
            (pool.length && overlayNeedsPhotos()) ||
            ((theme === "cubes" || theme === "depthfield") &&
              globalThis.THREE &&
              globalThis.BGTileField &&
              (!active || !active.state || active.state.waiting || (active.state.field && active.state.field.stopped)));
          if (needMount && !mountTheme(theme)) watchSettle();
          const live = document.getElementById(OVERLAY_ID);
          if (live && typeof rules.ensureBrandChrome === "function") {
            rules.ensureBrandChrome(live, "mosaic");
          }
          if (!live || !active) {
            watchSettle();
            return;
          }
          if (active && (added.length || removed.length) && typeof active.def.tick === "function") {
            const bursts = Math.min(Math.max(added.length, removed.length ? 1 : 0), 3);
            for (let i = 0; i < bursts; i += 1) {
              active.def.tick(live, pool, active.state, makeApi());
            }
          }
        },
      });
    } finally {
      if (gen === applyGen) applying = false;
    }
  }

  function scheduleApply(delay) {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      applyTimer = 0;
      apply().catch(() => {});
    }, delay == null ? 50 : delay);
  }

  const observer = new MutationObserver((records) => {
    const relevant = records.some((record) => {
      const target = record.target;
      if (!target) return true;
      if (target.id === OVERLAY_ID || target.id === handoff.HOST_ID) return false;
      if (typeof target.closest === "function" && target.closest("#" + OVERLAY_ID + ", #" + handoff.HOST_ID)) {
        return false;
      }
      return true;
    });
    if (relevant) scheduleApply();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "srcset"],
  });

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.mosaicTheme || changes.enabled || changes.stageAspect) {
        mountedTheme = "";
      }
      scheduleApply(0);
    });
  } catch {
    /* extension reloaded */
  }

  // Mosaic layouts are computed at mount from the canvas size. When the
  // window is resized, remount so every tile re-lays out proportionally to
  // the new canvas (stage-based themes also self-fit via ResizeObserver).
  let resizeRemountTimer = 0;
  window.addEventListener("resize", () => {
    if (resizeRemountTimer) clearTimeout(resizeRemountTimer);
    resizeRemountTimer = setTimeout(() => {
      resizeRemountTimer = 0;
      if (applying) {
        scheduleApply();
        return;
      }
      if (!mountedTheme) {
        scheduleApply();
        return;
      }
      const host = document.getElementById(handoff.HOST_ID);
      if (!layoutReady(host)) {
        watchSettle();
        return;
      }
      syncFeed();
      mountTheme(mountedTheme);
    }, 250);
  });

  apply().catch(() => {});
})();
