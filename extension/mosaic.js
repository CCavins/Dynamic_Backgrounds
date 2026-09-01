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
  let pendingRebuild = false;
  let rebuildGen = 0;
  let dealIndex = 0;
  let mountedTheme = "";
  let mountedAspect = "";
  let mountedEmpty = true;
  let lastSettingsKey = "";
  let lastThemeSettings = null;
  let active = null;
  const liveSet = new Set();
  const retiring = new Set();
  const incoming = [];
  const pool = [];
  const remembered = [];
  const rememberedSet = new Set();
  const missingCounts = new Map();
  const FORGET_AFTER = 4;
  const EMPTY_CONFIRM_MS = 1600;
  let emptySince = 0;
  let lastShown = "";
  let feedHoldoffUntil = 0;
  let ignoreResizeUntil = 0;
  let mountedHostKey = "";
  let rebuildRunning = false;
  let lastConfirmed = [];
  let drainTimer = 0;
  let mosaicNeedsFreshMount = false;

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

  function canonSrc(src) {
    const raw = String(src || "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw, location.href);
      return (url.origin + url.pathname).replace(/\/+$/, "");
    } catch {
      return raw.split("?")[0].split("#")[0];
    }
  }

  function srcSetHas(set, src) {
    if (!set || !src) return false;
    if (set.has(src)) return true;
    const key = canonSrc(src);
    if (!key) return false;
    for (const item of set) {
      if (item === src || canonSrc(item) === key) return true;
    }
    return false;
  }

  function collectImgUrls() {
    const fromImgs = [];
    const laidOut = [];
    rules.mosaicImages().forEach((img) => {
      const src = imageSrc(img);
      if (!src) return;
      if (rules.isSkippedMosaicImage(img)) return;
      fromImgs.push(src);
      const tile =
        (img.closest && img.closest(".mosaic-asset, .mosaic-tile-slot, .v2-asset-tile, .v2-mosaic-swap-tile")) ||
        img;
      const box = tile.getBoundingClientRect ? tile.getBoundingClientRect() : null;
      if (box && box.width >= 8 && box.height >= 8) laidOut.push(src);
    });
    return fromImgs.length ? fromImgs : laidOut;
  }

  function collectUrls() {
    const urls = [];
    const seenNow = new Set();
    function add(src) {
      if (!src || isBrandSrc(src)) return;
      const key = canonSrc(src) || src;
      if (seenNow.has(key)) return;
      seenNow.add(key);
      urls.push(src);
    }
    const classUrls =
      typeof rules.mosaicAssetClassUrls === "function" ? rules.mosaicAssetClassUrls() : [];
    const backUrls =
      typeof rules.mosaicAssetBackUrls === "function" ? rules.mosaicAssetBackUrls() : [];
    const imgUrls = collectImgUrls();
    const classSet = new Set(classUrls);
    const confirmedSet = new Set(lastConfirmed);

    // front-* tokens are the live mosaic, but a newly added shot often
    // paints as an <img> before Vixi writes the matching front-* class.
    classUrls.forEach(add);
    imgUrls.forEach((src) => {
      if (srcSetHas(classSet, src)) return;
      if (srcSetHas(retiring, src)) return;
      if (backUrls.length && srcSetHas(new Set(backUrls), src) && !srcSetHas(classSet, src)) return;
      if (
        classUrls.length &&
        confirmedSet.size &&
        srcSetHas(confirmedSet, src) &&
        !srcSetHas(classSet, src)
      ) {
        return;
      }
      add(src);
    });
    if (urls.length) return urls;
    imgUrls.forEach(add);
    return urls;
  }

  function snapshotOverlayPool() {
    const root = document.getElementById(OVERLAY_ID);
    if (!root) return;
    const urls = [];
    const seen = new Set();
    overlayFeedImgs(root).forEach((img) => {
      const src = feedImgUrl(img);
      if (!src || isBrandSrc(src)) return;
      const key = canonSrc(src) || src;
      if (seen.has(key)) return;
      seen.add(key);
      urls.push(src);
    });
    if (!urls.length) return;
    lastConfirmed = urls.slice();
    rememberUrls(urls);
    if (!pool.length) {
      urls.forEach((src) => {
        liveSet.add(src);
        pool.push(src);
      });
    }
  }

  function restoreRemembered() {
    if (pool.length) return;
    const source = lastConfirmed.length ? lastConfirmed : remembered;
    if (!source.length) return;
    source.forEach((src) => {
      if (srcSetHas(retiring, src)) return;
      if (!srcSetHas(liveSet, src)) incoming.push(src);
      liveSet.add(src);
      pool.push(src);
    });
  }

  function syncFeed() {
    forgetBrandUrls();
    const now = collectUrls();
    if (now.length) rememberUrls(now);

    // A flaky collect (covers on, Vue swap, srcset-only) must not wipe photos
    // we already have. While a mosaic theme is on, Vixi often removes or hides
    // the live mosaic tiles entirely — keep the last confirmed pool.
    if (!now.length) {
      const themeOn =
        Boolean(mountedTheme) ||
        rebuildRunning ||
        document.documentElement.classList.contains("dyn-mosaic-on");
      if (themeOn) {
        restoreRemembered();
        return { added: [], removed: [] };
      }
      if (!emptySince) emptySince = Date.now();
      const settling = Boolean(mountedTheme && mountedAt && performance.now() - mountedAt < 2800);
      const holdoff = performance.now() < feedHoldoffUntil;
      if (holdoff || settling || Date.now() - emptySince < EMPTY_CONFIRM_MS) {
        restoreRemembered();
        return { added: [], removed: [] };
      }
      const removed = [];
      const leftover = new Set([...liveSet, ...remembered, ...pool]);
      leftover.forEach((src) => {
        if (!src) return;
        removed.push(src);
        retiring.add(src);
      });
      remembered.length = 0;
      rememberedSet.clear();
      // Keep lastConfirmed so a later remount can still show photos.
      incoming.length = 0;
      liveSet.clear();
      pool.length = 0;
      missingCounts.clear();
      dealIndex = 0;
      return { added: [], removed };
    }
    emptySince = 0;
    lastConfirmed = now.slice();

    const nowSet = new Set(now);
    const added = [];
    now.forEach((src) => {
      missingCounts.delete(src);
      if (!srcSetHas(liveSet, src)) {
        added.push(src);
        incoming.push(src);
      }
      [...retiring].forEach((item) => {
        if (item === src || canonSrc(item) === canonSrc(src)) retiring.delete(item);
      });
    });
    const removed = [];
    liveSet.forEach((src) => {
      if (srcSetHas(nowSet, src)) return;
      removed.push(src);
      retiring.add(src);
    });
    const tracked = new Set([...remembered, ...liveSet]);
    tracked.forEach((src) => {
      if (srcSetHas(nowSet, src)) return;
      const misses = (missingCounts.get(src) || 0) + 1;
      missingCounts.set(src, misses);
      if (misses >= FORGET_AFTER) {
        rememberedSet.delete(src);
        const rememberedAt = remembered.indexOf(src);
        if (rememberedAt >= 0) remembered.splice(rememberedAt, 1);
      }
    });
    liveSet.clear();
    now.forEach((src) => liveSet.add(src));
    pool.length = 0;
    now.forEach((src) => pool.push(src));
    if (dealIndex >= pool.length) dealIndex = 0;
    for (let i = incoming.length - 1; i >= 0; i -= 1) {
      if (!srcSetHas(liveSet, incoming[i])) incoming.splice(i, 1);
    }
    return { added, removed };
  }

  function layoutReady(el) {
    if (!el) return false;
    return el.clientWidth >= 8 && el.clientHeight >= 8;
  }

  function overlayCount(src) {
    if (!src) return 0;
    const root = document.getElementById(OVERLAY_ID);
    if (!root) return 0;
    let n = 0;
    root.querySelectorAll(".dyn-card img").forEach((img) => {
      const url = img.currentSrc || img.src;
      if (url && (url === src || canonSrc(url) === canonSrc(src))) n += 1;
    });
    return n;
  }

  function nextUrl(avoid) {
    const blocked = visibleOverlaySrcs();
    addAvoid(blocked, avoid);
    if (lastShown) blocked.add(lastShown);

    function takeIncoming(filter) {
      for (let i = 0; i < incoming.length; i += 1) {
        const src = incoming[i];
        if (!src || !srcSetHas(liveSet, src) || srcSetHas(retiring, src)) continue;
        if (filter && srcSetHas(filter, src)) continue;
        incoming.splice(i, 1);
        return src;
      }
      return "";
    }

    function takePool(filter) {
      if (!pool.length) return "";
      const ranked = [];
      for (let step = 0; step < pool.length; step += 1) {
        const src = pool[(dealIndex + step) % pool.length];
        if (!src || srcSetHas(retiring, src)) continue;
        if (filter && srcSetHas(filter, src)) continue;
        ranked.push({ src, step, rare: overlayCount(src) });
      }
      if (!ranked.length) return "";
      ranked.sort((a, b) => a.rare - b.rare || a.step - b.step);
      const picked = ranked[0];
      dealIndex = (dealIndex + picked.step + 1) % pool.length;
      return picked.src;
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
        return Boolean(src && (srcSetHas(retiring, src) || (pool.length && !srcSetHas(liveSet, src))));
      },
      hasIncoming() {
        return incoming.some((src) => srcSetHas(liveSet, src));
      },
    };
  }

  function mosaicSettingsKey(theme, themeSettings) {
    return theme + ":" + JSON.stringify(themeSettings || {});
  }

  function mosaicScaleOf(themeSettings) {
    const n = Number(themeSettings && themeSettings.scale);
    return isFinite(n) ? n : 1;
  }

  function resolveLiveMosaicSettings(settings, theme) {
    if (typeof rules.resolveMosaicThemeSettings === "function") {
      return rules.resolveMosaicThemeSettings(settings, theme) || { scale: 1 };
    }
    return { scale: 1 };
  }

  function applyMosaicSettingsLive(theme, themeSettings) {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay || !active || mountedTheme !== theme) return false;
    const nextKey = mosaicSettingsKey(theme, themeSettings);
    if (nextKey === lastSettingsKey) return true;
    if (Math.abs(mosaicScaleOf(lastThemeSettings) - mosaicScaleOf(themeSettings)) > 0.001) {
      return false;
    }
    if (typeof active.def.applySettings === "function") {
      active.def.applySettings(overlay, active.state, themeSettings);
    }
    lastSettingsKey = nextKey;
    lastThemeSettings = themeSettings;
    active.settings = themeSettings;
    return true;
  }

  const FEED_CSS =
    "#" +
    OVERLAY_ID +
    " .dyn-card:not(.dyn-feed-ready){opacity:0!important}" +
    "#" +
    OVERLAY_ID +
    " img.dyn-feed-out{opacity:0!important;transition:opacity .75s ease}";

  function overlayFeedImgs(root) {
    if (!root) return [];
    return [...root.querySelectorAll(".dyn-card img:not(.dyn-reveal)")].filter((img) => {
      if (img.closest(".dyn-brand-chrome, [data-qr], [data-logo], .dyn-brand-logo, .dyn-brand-qr")) {
        return false;
      }
      return true;
    });
  }

  function feedImgUrl(img) {
    return img ? String(img.currentSrc || img.src || "").trim() : "";
  }

  function imgIsReady(img) {
    return Boolean(img && feedImgUrl(img) && img.complete && img.naturalWidth > 0);
  }

  function syncImgPending(img) {
    if (!img) return;
    const ready = imgIsReady(img);
    img.classList.toggle("dyn-feed-pending", !ready);
    const card = img.closest(".dyn-card");
    if (!card) return;
    const imgs = [...card.querySelectorAll("img:not(.dyn-reveal)")];
    const cardReady = imgs.some((item) => imgIsReady(item));
    card.classList.toggle("dyn-feed-ready", cardReady);
    card.classList.toggle("dyn-feed-pending", !cardReady);
  }

  function armImgReveal(img) {
    if (!img || img.tagName !== "IMG") return;
    if (!img.closest(".dyn-card") || img.classList.contains("dyn-reveal")) return;
    syncImgPending(img);
    if (imgIsReady(img) || img.dataset.dynFeedArm === feedImgUrl(img)) return;
    img.dataset.dynFeedArm = feedImgUrl(img);
    const onReady = () => syncImgPending(img);
    img.addEventListener("load", onReady, { once: true });
    img.addEventListener("error", onReady, { once: true });
  }

  let imgWatch = null;
  function watchFeedImgs(root) {
    if (!root) return;
    overlayFeedImgs(root).forEach(armImgReveal);
    if (imgWatch) imgWatch.disconnect();
    imgWatch = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === "attributes" && record.target && record.target.tagName === "IMG") {
          armImgReveal(record.target);
          return;
        }
        record.addedNodes &&
          record.addedNodes.forEach((node) => {
            if (node.tagName === "IMG") armImgReveal(node);
            if (node.querySelectorAll) node.querySelectorAll("img").forEach(armImgReveal);
          });
      });
    });
    imgWatch.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
  }

  function fadeClearImg(img) {
    if (!img || img.classList.contains("dyn-feed-out")) return;
    img.classList.add("dyn-feed-out");
    window.setTimeout(() => {
      img.removeAttribute("src");
      img.src = "";
      img.classList.remove("dyn-feed-out");
      syncImgPending(img);
    }, 760);
  }

  function fadeSetImg(img, src) {
    if (!img || !src) return;
    img.classList.add("dyn-feed-pending");
    const probe = new Image();
    probe.onload = () => {
      img.src = src;
      img.classList.remove("dyn-feed-out");
      const show = () => syncImgPending(img);
      img.addEventListener("load", show, { once: true });
      if (img.complete) show();
    };
    probe.onerror = () => syncImgPending(img);
    probe.src = src;
  }

  let feedLockUntil = 0;
  let mountedAt = 0;
  function themeManagesFeed(theme) {
    // These themes own card enter/exit animations. mosaic.js must not fadeSetImg
    // their imgs — that flashes without the theme transition.
    if (
      theme === "polaroid" ||
      theme === "polaroid-brand" ||
      theme === "flipwall" ||
      theme === "flipwall-brand" ||
      theme === "cubes" ||
      theme === "cubes-brand" ||
      theme === "fan" ||
      theme === "fan-brand" ||
      theme === "decks" ||
      theme === "decks-brand" ||
      theme === "cascade" ||
      theme === "depthfield"
    ) {
      return true;
    }
    // Engine-driven custom mosaics (Orbit Swap, etc.) own their photo swaps.
    const def = (themeApi && themeApi.themes && themeApi.themes[theme]) || (active && active.def);
    return Boolean(def && def.engine);
  }

  function reconcileOverlay(root) {
    if (!root || !active) return;
    const theme = root.dataset ? root.dataset.theme : "";
    if (themeManagesFeed(theme)) return;
    if (performance.now() - mountedAt < 1200) return;
    if (performance.now() < feedLockUntil) return;
    const imgs = leftoverOverlayImgs(root);
    if (!imgs.length) return;
    const batch = pool.length <= 2 ? Math.min(4, imgs.length) : 1;
    feedLockUntil = performance.now() + (batch > 1 ? 220 : 400);
    imgs.slice(0, batch).forEach((img) => {
      if (pool.length) {
        const next = nextUrl(feedImgUrl(img));
        if (next) {
          fadeSetImg(img, next);
          return;
        }
      }
      fadeClearImg(img);
    });
    armDrain();
  }

  function leftoverOverlayImgs(root) {
    if (!root) return [];
    return overlayFeedImgs(root).filter((img) => {
      if (img.classList.contains("dyn-feed-out")) return false;
      const src = feedImgUrl(img);
      if (!src) return false;
      if (srcSetHas(retiring, src)) return true;
      return Boolean(pool.length && !srcSetHas(liveSet, src));
    });
  }

  function armDrain() {
    if (drainTimer) return;
    drainTimer = setInterval(() => {
      const root = document.getElementById(OVERLAY_ID);
      if (!root || !active) {
        clearInterval(drainTimer);
        drainTimer = 0;
        return;
      }
      if (!leftoverOverlayImgs(root).length && !retiring.size) {
        clearInterval(drainTimer);
        drainTimer = 0;
        return;
      }
      reconcileOverlay(root);
    }, 240);
  }

  function runThemeTick(added) {
    const root = document.getElementById(OVERLAY_ID);
    if (!root || !active) return;
    const theme = root.dataset ? root.dataset.theme : "";
    const managed = themeManagesFeed(theme);
    if (managed) {
      // Pool already updated in syncFeed. Drop placement queues so add/remove
      // never rewrite on-screen cards for self-animated themes.
      incoming.length = 0;
      retiring.clear();
    } else {
      placeIncoming(root);
      placeAdded(root, added);
      placeMissingLive(root);
    }
    if (typeof active.def.tick === "function") {
      active.def.tick(root, pool, active.state, makeApi());
    }
    watchFeedImgs(root);
    if (!managed) {
      placeIncoming(root);
      placeAdded(root, added);
      placeMissingLive(root);
      reconcileOverlay(root);
      if (leftoverOverlayImgs(root).length || retiring.size) armDrain();
    }
  }

  function pickDuplicateCard(root, avoidSrc, used) {
    const imgs = overlayFeedImgs(root).filter((img) => {
      if (used && used.has(img)) return false;
      if (img.classList.contains("dyn-feed-out")) return false;
      const src = feedImgUrl(img);
      if (!src) return false;
      if (avoidSrc && srcSetHas(new Set([avoidSrc]), src)) return false;
      return true;
    });
    if (!imgs.length) return null;
    const counts = new Map();
    overlayFeedImgs(root).forEach((img) => {
      const key = canonSrc(feedImgUrl(img)) || feedImgUrl(img);
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    });
    imgs.sort((a, b) => {
      const ca = counts.get(canonSrc(feedImgUrl(a)) || feedImgUrl(a)) || 0;
      const cb = counts.get(canonSrc(feedImgUrl(b)) || feedImgUrl(b)) || 0;
      return cb - ca;
    });
    return imgs[0] || null;
  }

  function placeAdded(root, added) {
    if (!root || !added || !added.length) return;
    const theme = root.dataset ? root.dataset.theme : "";
    if (themeManagesFeed(theme)) return;
    const used = new Set();
    added.forEach((src) => {
      if (!src) return;
      [...retiring].forEach((item) => {
        if (item === src || canonSrc(item) === canonSrc(src)) retiring.delete(item);
      });
      if (overlayCount(src)) return;
      const target = pickDuplicateCard(root, src, used);
      if (!target) return;
      used.add(target);
      target.src = src;
      fadeSetImg(target, src);
    });
  }

  function placeMissingLive(root) {
    if (!root || !pool.length) return;
    const theme = root.dataset ? root.dataset.theme : "";
    if (themeManagesFeed(theme)) return;
    // Only fill blank cards. Never rewrite existing photos to chase the full
    // pool — that mass-swapped Polaroid/fan cards whenever Vixi churned membership.
    const empties = overlayFeedImgs(root).filter((img) => {
      if (img.classList.contains("dyn-feed-out")) return false;
      return !feedImgUrl(img);
    });
    if (!empties.length) return;
    let filled = 0;
    pool.forEach((src) => {
      if (!src || filled >= empties.length) return;
      [...retiring].forEach((item) => {
        if (item === src || canonSrc(item) === canonSrc(src)) retiring.delete(item);
      });
      if (overlayCount(src)) return;
      const target = empties[filled];
      filled += 1;
      target.src = src;
      fadeSetImg(target, src);
    });
  }

  function placeIncoming(root) {
    if (!root || !incoming.length) return;
    const theme = root.dataset ? root.dataset.theme : "";
    if (themeManagesFeed(theme)) return;
    let placed = 0;
    const used = new Set();
    while (incoming.length && placed < 1) {
      const imgs = overlayFeedImgs(root).filter((img) => {
        if (used.has(img)) return false;
        if (img.classList.contains("dyn-feed-out")) return false;
        return Boolean(feedImgUrl(img));
      });
      if (!imgs.length) return;
      const next = incoming.find((src) => srcSetHas(liveSet, src) && !srcSetHas(retiring, src));
      if (!next) return;
      const counts = new Map();
      imgs.forEach((img) => {
        const key = canonSrc(feedImgUrl(img)) || feedImgUrl(img);
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      const target = imgs
        .filter((img) => !srcSetHas(new Set([next]), feedImgUrl(img)))
        .sort((a, b) => {
          const ca = counts.get(canonSrc(feedImgUrl(a)) || feedImgUrl(a)) || 0;
          const cb = counts.get(canonSrc(feedImgUrl(b)) || feedImgUrl(b)) || 0;
          return cb - ca;
        })[0] || imgs[0];
      const picked = nextUrl(feedImgUrl(target));
      if (!picked) return;
      used.add(target);
      target.src = picked;
      fadeSetImg(target, picked);
      placed += 1;
    }
  }

  function ensureStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }
    const next = String((themeApi && themeApi.STYLE) || "") + FEED_CSS;
    if (style.textContent !== next) style.textContent = next;
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
      if (!active) return;
      if (!document.getElementById(OVERLAY_ID)) return;
      // Vixi often updates mosaic membership via front-* class tokens, not
      // img src. Sync on every tick so adds/removes are not missed.
      const { added, removed } = syncFeed();
      runThemeTick(added);
      if (!added.length && !removed.length && retiring.size) {
        const root = document.getElementById(OVERLAY_ID);
        const theme = root && root.dataset ? root.dataset.theme : "";
        if (root && !themeManagesFeed(theme)) reconcileOverlay(root);
      }
    }, interval || 2500);
  }

  function requestRebuild() {
    pendingRebuild = true;
    rebuildGen += 1;
  }

  function suppressResizeRebuild(ms) {
    ignoreResizeUntil = Math.max(ignoreResizeUntil, performance.now() + (ms || 1200));
  }

  function hostSizeKey(host) {
    if (!host) return "";
    return host.clientWidth + "x" + host.clientHeight;
  }

  function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  async function waitHostStable() {
    await nextFrame();
    await nextFrame();
    const start = performance.now();
    let last = "";
    let hits = 0;
    while (performance.now() - start < 800) {
      const host = rules.findOverlayHost && rules.findOverlayHost();
      if (layoutReady(host)) {
        const key = host.clientWidth + "x" + host.clientHeight;
        if (key === last) {
          hits += 1;
          if (hits >= 2) return host;
        } else {
          hits = 0;
          last = key;
        }
      }
      await nextFrame();
    }
    return rules.findOverlayHost && rules.findOverlayHost();
  }

  function disposeMounted() {
    stopTick();
    if (drainTimer) {
      clearInterval(drainTimer);
      drainTimer = 0;
    }
    if (imgWatch) {
      imgWatch.disconnect();
      imgWatch = null;
    }
    const root = document.getElementById(OVERLAY_ID);
    if (active && active.def && typeof active.def.unmount === "function" && root) {
      try {
        active.def.unmount(root, active.state);
      } catch {
        /* a 0-size remount can leave the theme in a bad state */
      }
    }
    if (root) root.remove();
    active = null;
    mountedTheme = "";
    mountedAspect = "";
    mountedEmpty = true;
    lastSettingsKey = "";
    lastThemeSettings = null;
    lastShown = "";
    retiring.clear();
    incoming.length = 0;
    feedLockUntil = 0;
    dealIndex = 0;
    emptySince = 0;
    feedHoldoffUntil = performance.now() + 3200;
    mountedHostKey = "";
  }

  function unmountTheme(opts) {
    const resetFeed = Boolean(opts && opts.resetFeed);
    disposeMounted();
    if (resetFeed) {
      liveSet.clear();
      incoming.length = 0;
      dealIndex = 0;
      pool.length = 0;
      missingCounts.clear();
      emptySince = 0;
      remembered.length = 0;
      rememberedSet.clear();
    }
  }

  async function rebuildNow(id) {
    if (rebuildRunning) {
      pendingRebuild = true;
      return false;
    }
    rebuildRunning = true;
    let ok = false;
    try {
      // Theme/aspect changes bump rebuildGen while we await. Never abort after
      // dispose — remount, and if another rebuild was requested, loop again.
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const token = rebuildGen;
        pendingRebuild = false;
        let target = id;
        let loadedSettings = null;
        try {
          loadedSettings = await rules.loadSettings();
          if (loadedSettings && loadedSettings.enabled !== false) {
            target = rules.normalizeMosaicTheme(loadedSettings.mosaicTheme) || id;
          }
        } catch {
          /* use id */
        }
        if (!target || target === "off" || !themeApi.themes[target]) {
          ok = false;
          break;
        }
        const prevHostKey = mountedHostKey;
        snapshotOverlayPool();
        disposeMounted();
        suppressResizeRebuild(4000);
        ensureStyle();
        document.documentElement.classList.add("dyn-mosaic-on");
        if (typeof rules.applyOutputCanvas === "function") rules.applyOutputCanvas();
        if (typeof rules.findOverlayHost === "function") rules.findOverlayHost();
        suppressResizeRebuild(4000);
        const hostNow = rules.findOverlayHost && rules.findOverlayHost();
        if (layoutReady(hostNow) && prevHostKey && hostSizeKey(hostNow) === prevHostKey) {
          await nextFrame();
          await nextFrame();
        } else {
          await waitHostStable();
        }
        syncFeed();
        if (!pool.length) restoreRemembered();
        if (!pool.length && lastConfirmed.length) {
          lastConfirmed.forEach((src) => {
            if (!src || srcSetHas(liveSet, src)) return;
            liveSet.add(src);
            pool.push(src);
          });
        }
        await decodeUrls(pool);
        ok = await mountTheme(target, resolveLiveMosaicSettings(loadedSettings, target));
        const host = rules.findOverlayHost && rules.findOverlayHost();
        if (ok) mountedHostKey = hostSizeKey(host);
        if (ok && token === rebuildGen && !pendingRebuild) {
          pendingRebuild = false;
          return true;
        }
        if (!ok) break;
        // Another rebuild was requested mid-flight — remount once more.
      }
      if (!ok) {
        pendingRebuild = true;
        watchSettle();
      }
      return ok && Boolean(document.getElementById(OVERLAY_ID));
    } finally {
      rebuildRunning = false;
      if (!document.getElementById(OVERLAY_ID) || pendingRebuild) scheduleApply(60);
    }
  }

  async function mountTheme(id, themeSettings) {
    const def = themeApi.themes[id];
    if (!def) return false;
    const host = rules.findOverlayHost();
    if (!host) return false;
    if (!layoutReady(host)) return false;
    rememberUrls(pool);
    if (active || document.getElementById(OVERLAY_ID)) disposeMounted();
    const root = ensureOverlay();
    if (!root) return false;
    root.dataset.theme = id;
    if (def.engine) root.dataset.engine = def.engine;
    else root.removeAttribute("data-engine");
    // Brand-aware themes need chrome classes before mount so the content frame sizes correctly.
    if (/-brand$/.test(id) && typeof rules.ensureBrandChrome === "function") {
      rules.ensureBrandChrome(root, "mosaic");
    }
    try {
      const mounted = def.mount(root, pool, makeApi(), themeSettings);
      const state =
        mounted && typeof mounted.then === "function" ? await mounted : mounted || {};
      if (typeof def.applySettings === "function") {
        def.applySettings(root, state, themeSettings);
      }
      active = { id, def, state, settings: themeSettings };
      mountedTheme = id;
      lastSettingsKey = mosaicSettingsKey(id, themeSettings);
      lastThemeSettings = themeSettings;
      mountedAspect = rules.currentStageAspect ? rules.currentStageAspect() : "auto";
      mountedEmpty = pool.length === 0;
      if (typeof rules.ensureBrandChrome === "function") rules.ensureBrandChrome(root, "mosaic");
      mountedAt = performance.now();
      mosaicNeedsFreshMount = false;
      watchFeedImgs(root);
      startTick(def.interval);
      return true;
    } catch (err) {
      console.warn("[Dynamic Backgrounds] mosaic mount failed:", err);
      try {
        disposeMounted();
      } catch {
        /* overlay may already be gone */
      }
      return false;
    }
  }

  function overlayIsStale(root) {
    if (mosaicNeedsFreshMount || pendingRebuild || !active || !mountedTheme) return true;
    if (!root) return true;
    return (
      root.classList.contains("is-parked") || root.classList.contains("dyn-awaiting-show")
    );
  }

  function parkOverlay() {
    stopTick();
    const root = document.getElementById(OVERLAY_ID);
    if (active && active.def && typeof active.def.unmount === "function" && root) {
      try {
        active.def.unmount(root, active.state);
      } catch {
        /* theme may already be gone */
      }
    }
    if (root) {
      while (root.firstChild) root.removeChild(root.firstChild);
      root.classList.add("is-leaving", "is-parked", "dyn-awaiting-show");
    }
    active = null;
    mountedTheme = "";
    mosaicNeedsFreshMount = true;
    document.documentElement.classList.remove("dyn-mosaic-on");
  }

  function unparkOverlay(root) {
    if (root) root.classList.remove("is-leaving", "is-parked", "dyn-awaiting-show");
    if (typeof handoff.applyCovers === "function") handoff.applyCovers();
  }

  function destroyOverlay() {
    unmountTheme({ resetFeed: true });
    document.documentElement.classList.remove("dyn-mosaic-on");
    const root = document.getElementById(OVERLAY_ID);
    if (root) root.remove();
  }

  function teardownSoft() {
    parkOverlay();
  }

  function teardownHard() {
    destroyOverlay();
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
    handoff.clearMode("mosaic");
  }

  async function releaseForMessage() {
    stopTick();
    const root = document.getElementById(OVERLAY_ID);
    const wasOn =
      Boolean(root) ||
      document.documentElement.classList.contains("dyn-mosaic-on") ||
      handoff.currentMode() === "mosaic";
    if (!wasOn) {
      teardownHard();
      return;
    }
    if (root) {
      root.classList.add("is-leaving");
      await wait(420);
    }
    teardownHard();
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
      // Imported message packs must not remount a live mosaic stage.
      const kind = handoff.liveKind();
      const mode = handoff.currentMode();
      if (kind === "message" || kind === "native" || (kind === "" && mode === "message")) return;
      requestRebuild();
      scheduleApply();
    });
  }

  let applyingSince = 0;

  async function ensureMosaicMounted(theme, themeSettings) {
    if (!theme || theme === "off" || !themeApi.themes[theme]) return false;
    const live = handoff.liveKind();
    if (live === "message" || live === "native") return false;
    const overlay = document.getElementById(OVERLAY_ID);
    const settings = themeSettings || lastThemeSettings || { scale: 1 };
    if (
      overlay &&
      active &&
      mountedTheme === theme &&
      !overlayIsStale(overlay) &&
      layoutReady(overlay)
    ) {
      if (applyMosaicSettingsLive(theme, settings)) return true;
    }
    const ok = await rebuildNow(theme);
    const liveEl = document.getElementById(OVERLAY_ID);
    unparkOverlay(liveEl);
    if (liveEl) {
      document.documentElement.classList.add("dyn-mosaic-on");
      if (typeof handoff.endHold === "function") handoff.endHold();
    }
    return Boolean(ok && liveEl);
  }

  function watchSettle() {
    if (settleTimer) return;
    let emptyPasses = 0;
    settleTimer = setInterval(() => {
      if (applying && applyingSince && Date.now() - applyingSince > 5000) {
        applying = false;
      }
      const live = handoff.liveKind();
      if (live === "native" || live === "message") {
        emptyPasses = 0;
        if (settleTimer) {
          clearInterval(settleTimer);
          settleTimer = 0;
        }
        return;
      }
      const overlay = document.getElementById(OVERLAY_ID);
      if (live === "mosaic" && (!overlay || !active || !layoutReady(overlay))) {
        emptyPasses = 0;
        rules.loadSettings().then((settings) => {
          const theme = settings.enabled ? rules.normalizeMosaicTheme(settings.mosaicTheme) : "off";
          if (theme !== "off") ensureMosaicMounted(theme).catch(() => {});
        });
        return;
      }
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
    if (applying) {
      scheduleApply(80);
      return;
    }
    const gen = ++applyGen;
    applying = true;
    applyingSince = Date.now();
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
      if (pendingRebuild) suppressResizeRebuild(1600);
      handoff.applyCovers(settings);
      if (pendingRebuild) suppressResizeRebuild(1600);
      const theme = settings.enabled ? rules.normalizeMosaicTheme(settings.mosaicTheme) : "off";
      const aspect = rules.normalizeStageAspect
        ? rules.normalizeStageAspect(settings.stageAspect)
        : "auto";
      const def = themeApi.themes[theme];
      const themeSettings = resolveLiveMosaicSettings(settings, theme);

      if (theme === "off" || !def) {
        if (settleTimer) {
          clearInterval(settleTimer);
          settleTimer = 0;
        }
        const needsTear =
          Boolean(document.getElementById(OVERLAY_ID)) ||
          Boolean(document.getElementById(STYLE_ID)) ||
          handoff.currentMode() === "mosaic" ||
          document.documentElement.classList.contains("dyn-mosaic-on");
        if (needsTear) teardownHard();
        handoff.applyCovers(settings);
        return;
      }

      let kind = handoff.liveKind();
      const mosaicPage = Boolean(rules.pageLooksLikeMosaic && rules.pageLooksLikeMosaic());
      const mode = handoff.currentMode();
      const msgThemeOn =
        settings.enabled !== false && rules.normalizeMessageTheme(settings.messageTheme) !== "off";
      // Stream / live / CTA / video / URL — anything that is not mosaic or
      // message. Drop our overlay and let Vixi show through.
      // After covers hide the stock mosaic, leftover native nodes can look
      // "live". If this is still a mosaic page, remount instead of parking.
      if (kind === "native") {
        const reallyNative = Boolean(
          rules.pageLooksLikeNative && rules.pageLooksLikeNative()
        );
        if (reallyNative || !mosaicPage) {
          if (settleTimer) {
            clearInterval(settleTimer);
            settleTimer = 0;
          }
          parkOverlay();
          handoff.applyCovers(settings);
          return;
        }
        kind = "mosaic";
      }
      // Never keep mosaic cards over a live message beat — even if we still owe
      // a remount or Vixi left .mosaic-layout in the DOM.
      if (kind === "message") {
        stopTick();
        parkOverlay();
        if (settleTimer) {
          clearInterval(settleTimer);
          settleTimer = 0;
        }
        if (!msgThemeOn) await releaseForMessage();
        return;
      }
      watchSettle();
      if (kind === "mosaic" || (rules.pageLooksLikeMosaic && rules.pageLooksLikeMosaic())) {
        const overlay = document.getElementById(OVERLAY_ID);
        const settingsChanged =
          overlay &&
          active &&
          mountedTheme === theme &&
          mosaicSettingsKey(theme, themeSettings) !== lastSettingsKey;
        if (
          !overlay ||
          !active ||
          pendingRebuild ||
          overlayIsStale(overlay) ||
          mountedTheme !== theme ||
          (settingsChanged && !applyMosaicSettingsLive(theme, themeSettings))
        ) {
          await ensureMosaicMounted(theme, themeSettings);
        } else {
          unparkOverlay(overlay);
          if (settingsChanged) applyMosaicSettingsLive(theme, themeSettings);
        }
      }
      const hasMsg =
        typeof rules.hasMessage === "function"
          ? rules.hasMessage()
          : Boolean((rules.messageCapture() || {}).src);
      const oweMosaic =
        pendingRebuild ||
        document.documentElement.classList.contains("dyn-mosaic-on");
      if (kind !== "mosaic") {
        // Ambiguous "" with message content: never remount mosaic over it just
        // because a hidden .mosaic-layout shell is still in the DOM.
        if (hasMsg && kind === "") {
          parkOverlay();
          if (!msgThemeOn) await releaseForMessage();
          return;
        }
        if (mosaicPage || oweMosaic || (kind === "" && (!mode || mode === "mosaic"))) {
          kind = "mosaic";
        } else {
          return;
        }
      }
      await handoff.activate("mosaic", {
        async prepare() {
          // Mount mosaic under the cover before the message theme fades out.
          const html = document.documentElement;
          html.classList.add("dyn-mosaic-on", "dyn-cover-message", "dyn-cover-mosaic");
          syncFeed();
          await decodeUrls(pool);
          const overlay = document.getElementById(OVERLAY_ID);
          const scaleChanged =
            Math.abs(mosaicScaleOf(lastThemeSettings) - mosaicScaleOf(themeSettings)) > 0.001;
          const needsMount =
            pendingRebuild ||
            mosaicNeedsFreshMount ||
            overlayIsStale(overlay) ||
            mountedTheme !== theme ||
            mountedAspect !== aspect ||
            (scaleChanged && mosaicSettingsKey(theme, themeSettings) !== lastSettingsKey) ||
            !overlay ||
            !active;
          if (needsMount) {
            pendingRebuild = false;
            suppressResizeRebuild(1600);
            await rebuildNow(theme);
            suppressResizeRebuild(1600);
          }
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
          const cubeField =
            theme === "cubes" ||
            theme === "cubes-brand" ||
            theme === "depthfield";
          const cubeBroken =
            cubeField &&
            globalThis.THREE &&
            globalThis.BGTileField &&
            (!active ||
              !active.state ||
              active.state.waiting ||
              (active.state.field && active.state.field.stopped));
          const sizeChanged =
            performance.now() >= ignoreResizeUntil &&
            Boolean(mountedHostKey && host && hostSizeKey(host) !== mountedHostKey);
          const stale = overlayIsStale(overlay);
          // Prefer feed updates over a second remount — prepare already mounted.
          if (
            overlay &&
            active &&
            !stale &&
            mountedTheme === theme &&
            mountedAspect === aspect &&
            !hostMisplaced &&
            !cubeBroken &&
            !(mountedEmpty && pool.length > 0) &&
            !sizeChanged
          ) {
            pendingRebuild = false;
          }
          const doRebuild =
            stale ||
            !overlay ||
            !active ||
            mountedTheme !== theme ||
            mountedAspect !== aspect ||
            hostMisplaced ||
            cubeBroken ||
            (mountedEmpty && pool.length > 0) ||
            sizeChanged ||
            Math.abs(mosaicScaleOf(lastThemeSettings) - mosaicScaleOf(themeSettings)) > 0.001;
          if (doRebuild) {
            const ok = await rebuildNow(theme);
            unparkOverlay(document.getElementById(OVERLAY_ID));
            if (ok && !pendingRebuild) pendingRebuild = false;
            else {
              pendingRebuild = true;
              if (!document.getElementById(OVERLAY_ID)) scheduleApply(60);
            }
            return;
          }
          unparkOverlay(overlay);
          const live = document.getElementById(OVERLAY_ID);
          if (live && typeof rules.ensureBrandChrome === "function") {
            rules.ensureBrandChrome(live, "mosaic");
          }
          if (!live || !active) {
            watchSettle();
            return;
          }
          applyMosaicSettingsLive(theme, themeSettings);
          watchFeedImgs(live);
          const liveTheme = live.dataset ? live.dataset.theme : "";
          if (added.length || removed.length) runThemeTick(added);
          else if (retiring.size) {
            if (themeManagesFeed(liveTheme)) runThemeTick([]);
            else reconcileOverlay(live);
          }
        },
      });
    } finally {
      applying = false;
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
      if (target === document.documentElement || target === document.body) return false;
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
    // Vixi encodes live mosaic membership in front-* / back-* class tokens.
    attributeFilter: ["src", "srcset", "class"],
  });

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      // Changing the message theme (or its colors) must not interrupt a live mosaic.
      const touchesMosaic = Boolean(
        changes.mosaicTheme ||
          changes.mosaicThemeSettings ||
          changes.mosaicShowBackground ||
          changes.mosaicShowQr ||
          changes.mosaicShowLogo ||
          changes.enabled ||
          changes.stageAspect ||
          changes.showBackground ||
          changes.showQr ||
          changes.showLogo ||
          changes.customThemes ||
          changes.customEngines
      );
      if (!touchesMosaic) return;
      if (
        changes.mosaicTheme ||
        changes.enabled ||
        changes.stageAspect ||
        changes.mosaicThemeSettings ||
        changes.customThemes ||
        changes.customEngines
      ) {
        requestRebuild();
      }
      if (
        changes.mosaicShowQr ||
        changes.mosaicShowLogo ||
        changes.mosaicShowBackground ||
        changes.showQr ||
        changes.showLogo ||
        changes.showBackground
      ) {
        const live = document.getElementById(OVERLAY_ID);
        if (live && typeof rules.ensureBrandChrome === "function") {
          rules.ensureBrandChrome(live, "mosaic");
        }
        if (typeof handoff.applyCovers === "function") handoff.applyCovers();
      }
      scheduleApply(0);
    });
  } catch {
    /* extension reloaded */
  }

  // Mosaic layouts are computed at mount from the canvas size. Rebuild so
  // every tile re-lays out against the new canvas instead of patching.
  let resizeRemountTimer = 0;
  window.addEventListener("resize", () => {
    if (resizeRemountTimer) clearTimeout(resizeRemountTimer);
    resizeRemountTimer = setTimeout(() => {
      resizeRemountTimer = 0;
      if (performance.now() < ignoreResizeUntil) return;
      const host =
        (rules.findOverlayHost && rules.findOverlayHost()) ||
        document.getElementById(handoff.HOST_ID);
      const key = hostSizeKey(host);
      if (key && key === mountedHostKey) return;
      requestRebuild();
      scheduleApply(0);
    }, 250);
  });

  if (typeof handoff.onLiveKind === "function") {
    handoff.onLiveKind((kind) => {
      if (kind !== "mosaic") return;
      watchSettle();
      pendingRebuild = true;
      scheduleApply(0);
    });
  }

  apply().catch(() => {});
})();
