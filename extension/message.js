(() => {
  const rules = globalThis.BGExtensionRules;
  const themeApi = globalThis.BGMessageThemes;
  const handoff = globalThis.BGThemeHandoff;
  if (!rules || !themeApi || !handoff) return;
  // Skip non-output pages entirely: no observers, no apply loop.
  if (!rules.isOutputPage(location.href)) return;

  const OVERLAY_ID = "dyn-message-theme";
  const STYLE_ID = "dyn-message-theme-style";
  const FONTS_ID = "dyn-message-fonts";

  let applyTimer = 0;
  let mountedTheme = "";
  let mountedAspect = "";
  let active = null;
  let lastKey = "";
  let lastSettingsKey = "";
  let lastThemeSettings = null;
  let cycle = 0;
  let pendingRebuild = false;
  let rebuildGen = 0;
  let ignoreResizeUntil = 0;
  let mountedHostKey = "";
  let parkedFromNative = false;
  let parkedAt = 0;

  function captureKey(capture) {
    if (!capture) return "";
    return `${capture.src}\n${capture.message}\n${capture.name}`;
  }

  function settingsKey(theme, themeSettings) {
    return theme + ":" + JSON.stringify(themeSettings || {});
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

  function ensureFonts() {
    if (document.getElementById(FONTS_ID) || !themeApi.FONTS) return;
    const link = document.createElement("link");
    link.id = FONTS_ID;
    link.rel = "stylesheet";
    link.href = themeApi.FONTS;
    document.head.appendChild(link);
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
    if (typeof rules.applyStageFrame === "function") rules.applyStageFrame(root);
    return root;
  }

  function requestRebuild() {
    pendingRebuild = true;
    rebuildGen += 1;
    mountedTheme = "";
    mountedAspect = "";
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

  function layoutReady(el) {
    return Boolean(el && el.clientWidth >= 8 && el.clientHeight >= 8);
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

  function unmountTheme() {
    const root = document.getElementById(OVERLAY_ID);
    if (active && active.def && typeof active.def.unmount === "function" && root) {
      active.def.unmount(root, active.state);
    }
    if (root) root.remove();
    active = null;
    mountedTheme = "";
    mountedAspect = "";
    lastKey = "";
    lastSettingsKey = "";
  }

  async function rebuildNow(id, themeSettings) {
    const token = rebuildGen;
    unmountTheme();
    suppressResizeRebuild(1600);
    document.documentElement.classList.add("dyn-message-on");
    if (typeof rules.applyOutputCanvas === "function") rules.applyOutputCanvas();
    if (typeof rules.findOverlayHost === "function") rules.findOverlayHost();
    suppressResizeRebuild(1600);
    await waitHostStable();
    if (token !== rebuildGen) {
      pendingRebuild = true;
      scheduleApply(80);
      return false;
    }
    const ok = await mountTheme(id, themeSettings);
    if (ok) {
      const host = rules.findOverlayHost && rules.findOverlayHost();
      mountedHostKey = hostSizeKey(host);
    }
    return ok;
  }

  async function mountTheme(id, themeSettings) {
    const def = themeApi.themes[id];
    if (!def) return false;
    const host = rules.findOverlayHost && rules.findOverlayHost();
    if (host && !layoutReady(host)) return false;
    if (active || document.getElementById(OVERLAY_ID)) unmountTheme();
    const root = ensureOverlay();
    if (!root) return false;
    root.dataset.theme = id;
    if (def.engine) root.dataset.engine = def.engine;
    else root.removeAttribute("data-engine");
    const mounted = def.mount(root, themeSettings);
    const state =
      mounted && typeof mounted.then === "function" ? await mounted : mounted || {};
    if (typeof def.applySettings === "function") {
      def.applySettings(root, state, themeSettings);
    }
    active = { id, def, state };
    mountedTheme = id;
    mountedAspect = rules.currentStageAspect ? rules.currentStageAspect() : "auto";
    lastSettingsKey = settingsKey(id, themeSettings);
    lastThemeSettings = themeSettings;
    root.classList.add("dyn-awaiting-show");
    if (typeof rules.ensureBrandChrome === "function") rules.ensureBrandChrome(root, "message");
    return true;
  }

  function parkOverlay(reason) {
    const root = document.getElementById(OVERLAY_ID);
    if (root) {
      root.classList.add("is-parked");
      root.classList.remove("on", "off", "idle", "held", "dyn-keep-chrome");
      delete root.dataset.keepChrome;
      if (reason === "native") {
        root.classList.add("dyn-awaiting-show");
        const img =
          (themeApi && themeApi.findMessagePhoto && themeApi.findMessagePhoto(root)) ||
          root.querySelector(".well img, [data-photo]");
        if (img && !(themeApi && themeApi.isBackgroundMediaNode && themeApi.isBackgroundMediaNode(img))) {
          img.removeAttribute("src");
          img.removeAttribute("srcset");
        }
      } else {
        root.classList.remove("dyn-awaiting-show");
      }
    }
    document.documentElement.classList.remove("dyn-message-on");
    if (reason === "native") {
      parkedFromNative = true;
      parkedAt = performance.now();
    }
  }

  function unparkOverlay(root) {
    if (root) {
      root.classList.remove("is-parked", "is-leaving");
      if (root.classList.contains("on")) root.classList.remove("dyn-awaiting-show");
    }
    document.documentElement.classList.add("dyn-message-on");
    if (typeof handoff.applyCovers === "function") handoff.applyCovers();
  }

  function overlayIsStale(root) {
    if (!root || !active || !mountedTheme) return true;
    if (
      root.classList.contains("is-parked") ||
      root.classList.contains("dyn-awaiting-show") ||
      !root.classList.contains("on")
    ) {
      return true;
    }
    if (!document.documentElement.classList.contains("dyn-message-on")) return true;
    if (handoff.currentMode() === "mosaic") return true;
    return false;
  }

  function applyMessageThemeSettings(root, themeSettings) {
    if (!root || !themeSettings) return;
    const def = (active && active.def) || themeApi.themes[root.dataset.theme];
    if (def && typeof def.applySettings === "function") {
      def.applySettings(root, active && active.state, themeSettings);
    } else if (themeApi.applyVars) {
      themeApi.applyVars(root, themeSettings);
    }
  }

  async function restoreMessageVisible(root, capture, themeSettings) {
    if (!root || !active) return;
    unparkOverlay(root);
    applyMessageThemeSettings(root, themeSettings);
    if (root.classList.contains("on") && !root.classList.contains("off")) {
      if (themeApi.ensurePosterPasteVisible) themeApi.ensurePosterPasteVisible(root);
      return;
    }
    if (typeof active.def.show === "function") {
      await active.def.show(root, capture, active.state, themeSettings);
    } else {
      root.classList.add("on");
    }
    if (themeApi.ensurePosterPasteVisible) themeApi.ensurePosterPasteVisible(root);
  }

  function leftoverAfterNative(key) {
    if (!parkedFromNative || !lastKey || key !== lastKey) return false;
    // Vixi often leaves the previous capture in the DOM for a beat after CTA.
    return performance.now() - parkedAt < 1400;
  }

  function destroyOverlay() {
    unmountTheme();
    document.documentElement.classList.remove("dyn-message-on");
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
    handoff.clearMode("message");
  }

  async function releaseForMosaic() {
    const root = document.getElementById(OVERLAY_ID);
    const wasOn =
      Boolean(root) ||
      document.documentElement.classList.contains("dyn-message-on") ||
      handoff.currentMode() === "message";
    if (!wasOn) {
      teardownHard();
      return;
    }
    if (active && root && typeof active.def.hide === "function") {
      try {
        await active.def.hide(root, active.state, lastThemeSettings);
      } catch {
        /* ignore */
      }
    }
    teardownHard();
  }

  function decodeImage(src) {
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
        if (typeof img.decode === "function") {
          img.decode().then(done).catch(done);
        } else {
          done();
        }
      };
      img.onerror = done;
      img.src = src;
      setTimeout(done, 1100);
    });
  }

  async function present(capture, themeSettings, shouldHide, hideStage) {
    if (!active || !capture) return;
    const token = ++cycle;
    const root = document.getElementById(OVERLAY_ID);
    if (!root) return;
    // First mount / CTA return: hide guest layers until the card is ready.
    // Back-to-back: keep wall / TV / scraps and only cover photo + copy.
    const keepChrome = Boolean(shouldHide && !hideStage);
    if (keepChrome) {
      root.dataset.keepChrome = "1";
      root.classList.add("dyn-keep-chrome");
    } else {
      delete root.dataset.keepChrome;
      root.classList.remove("dyn-keep-chrome");
    }
    if (hideStage) root.classList.add("dyn-awaiting-show");
    else if (!keepChrome) root.classList.remove("dyn-awaiting-show");
    try {
      await decodeImage(capture.src);
      if (token !== cycle) return;
      const latest = rules.messageCapture();
      const next = latest.src || latest.message || latest.name ? latest : capture;
      if (shouldHide && typeof active.def.hide === "function") {
        await active.def.hide(root, active.state, themeSettings);
      }
      if (token !== cycle) return;
      // Full leave / first paint: cover guest layers while swapping.
      // Back-to-back keep-chrome: leave the wall up and swap in place.
      if (shouldHide && !keepChrome) root.classList.add("dyn-awaiting-show");
      // Swap the photo while hidden so a CTA return cannot flash the
      // previous card, then reveal for the entrance of the new capture.
      // Never target #dyn-bg-media (selected Show-background asset) — a bare
      // `img` query matches that first when it is mounted inside the theme root.
      const img =
        (themeApi && themeApi.findMessagePhoto && themeApi.findMessagePhoto(root)) ||
        root.querySelector(".well img, [data-photo]");
      if (
        img &&
        next.src &&
        !(themeApi && themeApi.isBackgroundMediaNode && themeApi.isBackgroundMediaNode(img))
      ) {
        img.src = next.src;
      }
      unparkOverlay(root);
      // Theme root is mountable now — pull #dyn-bg-media out of the host/wrapper
      // into this theme before show() paints (avoids a late overlay flash).
      if (typeof handoff.applyCovers === "function") handoff.applyCovers();
      if (typeof active.def.show === "function") {
        await active.def.show(root, next, active.state, themeSettings);
      }
    } finally {
      if (token === cycle) {
        if (root.classList.contains("on")) root.classList.remove("dyn-awaiting-show");
        unparkOverlay(root);
        if (typeof handoff.applyCovers === "function") handoff.applyCovers();
      }
    }
  }

  handoff.register("message", {
    hide() {
      const root = document.getElementById(OVERLAY_ID);
      if (!active || !root || typeof active.def.hide !== "function") return Promise.resolve();
      return active.def.hide(root, active.state, lastThemeSettings);
    },
    teardown: teardownSoft,
    standDown: teardownHard,
  });

  const customApi = globalThis.BGCustomThemes;
  if (customApi && typeof customApi.onChange === "function") {
    customApi.onChange(() => {
      // Imported mosaic packs must not remount a live message beat.
      const kind = handoff.liveKind();
      const mode = handoff.currentMode();
      if (kind === "mosaic" || kind === "native" || (kind === "" && mode === "mosaic")) return;
      if (rules.peekSettings) applyMessageSettingsFromStorage(rules.peekSettings());
      requestRebuild();
      lastKey = "";
      scheduleApply();
    });
  }

  async function apply() {
    // Sideloaded engines compile from storage after this file starts. Wait so
    // the first paint does not treat the selected theme as missing.
    let polling = Boolean(rules.pageLooksLikePolling && rules.pageLooksLikePolling());
    const passthroughEarly = Boolean(
      polling || (rules.pageLooksLikePassthrough && rules.pageLooksLikePassthrough())
    );
    if (passthroughEarly && !polling) {
      const transitioning =
        handoff.themeTransitionActive && handoff.themeTransitionActive();
      const leaked = Boolean(
        document.getElementById(OVERLAY_ID) ||
        document.getElementById(handoff.HOST_ID) ||
        document.documentElement.classList.contains("dyn-message-on")
      );
      if (!transitioning && handoff.isStandingDown && handoff.isStandingDown() && !leaked) return;
    }

    if (customApi && typeof customApi.whenReady === "function") {
      await Promise.race([
        customApi.whenReady(),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    }
    // If the extension was reloaded, chrome APIs are gone but the page keeps
    // running this script. loadSettings falls back to the cached settings, so
    // theming continues instead of dropping back to the stock Vixi look.
    const settings = await rules.loadSettings();
    if (rules.leaderboardBeatActive && rules.leaderboardBeatActive(settings)) {
      const needsTear =
        Boolean(document.getElementById(OVERLAY_ID)) ||
        Boolean(document.getElementById(STYLE_ID)) ||
        Boolean(document.getElementById(handoff.HOST_ID)) ||
        handoff.currentMode() === "message" ||
        document.documentElement.classList.contains("dyn-message-on");
      if (handoff.liveKind() === "mosaic") await releaseForMosaic();
      else if (needsTear) teardownHard();
      handoff.clearMode("message");
      if (typeof handoff.endHold === "function") handoff.endHold();
      return;
    }
    polling = Boolean(rules.pageLooksLikePolling && rules.pageLooksLikePolling());
    const passthrough = Boolean(
      polling || (rules.pageLooksLikePassthrough && rules.pageLooksLikePassthrough())
    );
    if (polling || (passthrough && !(handoff.themeTransitionActive && handoff.themeTransitionActive()))) {
      const needsTear =
        Boolean(document.getElementById(OVERLAY_ID)) ||
        Boolean(document.getElementById(STYLE_ID)) ||
        Boolean(document.getElementById(handoff.HOST_ID)) ||
        handoff.currentMode() === "message" ||
        document.documentElement.classList.contains("dyn-message-on");
      if (handoff.liveKind() === "mosaic") await releaseForMosaic();
      else if (needsTear) teardownHard();
      handoff.clearMode("message");
      if (typeof handoff.endHold === "function") handoff.endHold();
      handoff.applyCovers(settings);
      return;
    }
    handoff.applyCovers(settings);
    const theme = settings.enabled ? rules.normalizeMessageTheme(settings.messageTheme) : "off";
    const themeSettings = rules.resolveMessageThemeSettings(settings, theme);
    const aspect = rules.normalizeStageAspect
      ? rules.normalizeStageAspect(settings.stageAspect)
      : "auto";
    const def = themeApi.themes[theme];

    if (theme === "off" || !def) {
      const needsTear =
        Boolean(document.getElementById(OVERLAY_ID)) ||
        Boolean(document.getElementById(STYLE_ID)) ||
        handoff.currentMode() === "message" ||
        document.documentElement.classList.contains("dyn-message-on");
      if (handoff.liveKind() === "mosaic") await releaseForMosaic();
      else if (needsTear) teardownHard();
      handoff.applyCovers(settings);
      return;
    }

    let kind = handoff.liveKind();
    const cap = rules.messageCapture();
    const hasMsg = Boolean(cap.src || cap.message || cap.name);
    const mosaicOn =
      settings.enabled !== false && rules.normalizeMosaicTheme(settings.mosaicTheme) !== "off";
    // Yield cleanly when Vixi is on a mosaic beat.
    if (kind === "mosaic") {
      parkOverlay();
      if (!mosaicOn) await releaseForMosaic();
      handoff.applyCovers(settings);
      return;
    }
    if (kind === "native") {
      if (rules.v2MessageHoldActive && rules.v2MessageHoldActive()) {
        kind = "message";
      } else {
        parkOverlay("native");
        handoff.applyCovers(settings);
        return;
      }
    }
    if (kind === "leaderboard") {
      parkOverlay();
      handoff.applyCovers(settings);
      return;
    }
    // Boot / unknown: keep black covers. Do not mount message over leftover mosaic.
    if (kind !== "message") return;

    ensureStyle();
    ensureFonts();
    lastThemeSettings = themeSettings;

    const liveOverlay = document.getElementById(OVERLAY_ID);
    const msgKey = hasMsg ? captureKey(cap) : lastKey;
    // Settings-only fast path — never skip when playlist content changed.
    if (
      !pendingRebuild &&
      !overlayIsStale(liveOverlay) &&
      mountedTheme === theme &&
      liveOverlay &&
      hasMsg &&
      msgKey === lastKey &&
      applyMessageSettingsLive(theme, themeSettings)
    ) {
      handoff.applyCovers(settings);
      if (typeof handoff.endHold === "function") handoff.endHold();
      return;
    }

    if (!document.getElementById(OVERLAY_ID) || pendingRebuild || mountedTheme !== theme) {
      pendingRebuild = false;
      await rebuildNow(theme, themeSettings);
      const live = document.getElementById(OVERLAY_ID);
      unparkOverlay(live);
      if (live && typeof handoff.endHold === "function") handoff.endHold();
    }

    await handoff.activate("message", {
      async prepare() {
        // Build our message theme while mosaic is still covering the stage, so
        // the fade never reveals Vixi's stock capture/message layers.
        const html = document.documentElement;
        html.classList.add("dyn-message-on", "dyn-cover-message", "dyn-cover-mosaic");
        await decodeImage(rules.messageCapture().src);
        const overlay = document.getElementById(OVERLAY_ID);
        const needsMount =
          pendingRebuild || mountedTheme !== theme || mountedAspect !== aspect || !overlay;
        if (needsMount) {
          pendingRebuild = false;
          if (!(await rebuildNow(theme, themeSettings))) return;
        } else if (lastSettingsKey !== settingsKey(theme, themeSettings)) {
          lastSettingsKey = settingsKey(theme, themeSettings);
          if (overlay && active && typeof active.def.applySettings === "function") {
            active.def.applySettings(overlay, active.state, themeSettings);
          }
        }
        const live = document.getElementById(OVERLAY_ID);
        if (live && typeof rules.ensureBrandChrome === "function") {
          rules.ensureBrandChrome(live, "message");
        }
        const capture = rules.messageCapture();
        if (!capture.src && !capture.message && !capture.name) return;
        const key = captureKey(capture);
        if (leftoverAfterNative(key)) {
          scheduleApply();
          return;
        }
        const fromNative = parkedFromNative;
        const hideStage =
          fromNative ||
          !lastKey ||
          Boolean(
            live &&
              (live.classList.contains("is-parked") ||
                live.classList.contains("dyn-awaiting-show"))
          );
        if (key === lastKey) {
          if (fromNative) {
            scheduleApply();
            return;
          }
          parkedFromNative = false;
          // Stay hidden under mosaic until reveal — avoid playing enter twice.
          applyMessageThemeSettings(live, themeSettings);
          return;
        }
        const shouldHide = Boolean(lastKey) && !fromNative;
        lastKey = key;
        await present(capture, themeSettings, shouldHide, hideStage);
        parkedFromNative = false;
        unparkOverlay(document.getElementById(OVERLAY_ID));
      },
      async reveal() {
        document.documentElement.classList.add("dyn-message-on");
        const overlay = document.getElementById(OVERLAY_ID);
        // prepare already mounted — only remount if that failed.
        if (!overlay || !active || mountedTheme !== theme) {
          pendingRebuild = true;
          if (!(await rebuildNow(theme, themeSettings))) return;
        }
        const live = document.getElementById(OVERLAY_ID);
        if (live && typeof rules.ensureBrandChrome === "function") {
          rules.ensureBrandChrome(live, "message");
        }
        const capture = rules.messageCapture();
        if (!capture.src && !capture.message && !capture.name) return;
        const key = captureKey(capture);
        if (leftoverAfterNative(key)) {
          scheduleApply();
          return;
        }
        const fromNative = parkedFromNative;
        const hideStage =
          fromNative ||
          !lastKey ||
          Boolean(
            live &&
              (live.classList.contains("is-parked") ||
                live.classList.contains("dyn-awaiting-show"))
          );
        if (key === lastKey && !fromNative) {
          parkedFromNative = false;
          if (live && live.classList.contains("on") && !live.classList.contains("off")) {
            unparkOverlay(live);
            applyMessageThemeSettings(live, themeSettings);
            return;
          }
          await restoreMessageVisible(live, capture, themeSettings);
          return;
        }
        // After CTA the parked overlay still holds the previous card. Never
        // unpark that and play hide() — just enter the new capture.
        const shouldHide = Boolean(lastKey) && !fromNative;
        lastKey = key;
        await present(capture, themeSettings, shouldHide, hideStage);
        parkedFromNative = false;
        unparkOverlay(document.getElementById(OVERLAY_ID));
      },
    });
  }

  function pushMessageVars(overlay, themeSettings) {
    if (!overlay || !themeSettings) return;
    const def = (active && active.def) || themeApi.themes[overlay.dataset.theme];
    if (def && typeof def.applySettings === "function") {
      def.applySettings(overlay, active && active.state, themeSettings);
    } else if (themeApi.applyVars) {
      themeApi.applyVars(overlay, themeSettings);
    }
  }

  function applyMessageSettingsLive(theme, themeSettings, force) {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay || overlay.dataset.theme !== theme) return false;
    const resolved =
      themeSettings &&
      (themeSettings.primary != null ||
        themeSettings.secondary != null ||
        themeSettings.background != null ||
        themeSettings.motion != null ||
        themeSettings.photoStyle != null ||
        themeSettings.revealMs != null)
        ? themeSettings
        : rules.resolveMessageThemeSettings
          ? rules.resolveMessageThemeSettings(
              {
                messageTheme: theme,
                messageThemeSettings: { [theme]: themeSettings || lastThemeSettings || {} },
              },
              theme
            )
          : themeSettings;
    const nextKey = settingsKey(theme, resolved);
    if (!force && nextKey === lastSettingsKey) return true;
    pushMessageVars(overlay, resolved);
    lastSettingsKey = nextKey;
    lastThemeSettings = resolved;
    return true;
  }

  function applyMessageSettingsFromStorage(settings, force) {
    const resolved =
      settings ||
      (rules.peekSettings ? rules.peekSettings() : null);
    if (!resolved || resolved.enabled === false) return;
    const theme = rules.normalizeMessageTheme(resolved.messageTheme);
    if (theme === "off") return;
    const themeSettings = rules.resolveMessageThemeSettings(resolved, theme);
    if (!themeSettings) return;
    if (!applyMessageSettingsLive(theme, themeSettings, force)) {
      const overlay = document.getElementById(OVERLAY_ID);
      if (overlay && overlay.dataset.theme === theme) pushMessageVars(overlay, themeSettings);
      else if (overlay) scheduleApply(0);
      return;
    }
    handoff.applyCovers(resolved);
  }

  function passthroughIsQuiet() {
    return (
      handoff.passthroughIsQuiet &&
      typeof handoff.passthroughIsQuiet === "function" &&
      handoff.passthroughIsQuiet()
    );
  }

  function scheduleApply(delay) {
    if (
      !(rules.pageLooksLikePolling && rules.pageLooksLikePolling()) &&
      passthroughIsQuiet()
    ) {
      return;
    }
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      applyTimer = 0;
      apply().catch(() => {});
    }, delay == null ? 90 : delay);
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
    characterData: true,
    attributes: true,
    attributeFilter: ["src", "srcset"],
  });

  try {
    chrome.runtime.onMessage.addListener((message) => {
      if (!message || message.type !== "dyn-bg-apply-settings" || !message.settings) return;
      if (rules.applyStorageDelta) {
        rules.applyStorageDelta({
          messageThemeSettings: { newValue: message.settings.messageThemeSettings },
          mosaicThemeSettings: { newValue: message.settings.mosaicThemeSettings },
          messageTheme: { newValue: message.settings.messageTheme },
          mosaicTheme: { newValue: message.settings.mosaicTheme },
          enabled: { newValue: message.settings.enabled },
        });
      }
      lastSettingsKey = "";
      applyMessageSettingsFromStorage(message.settings, true);
    });
  } catch {
    /* dead runtime */
  }

  try {
    document.documentElement.addEventListener("dyn-bg-theme-settings", (event) => {
      lastSettingsKey = "";
      applyMessageSettingsFromStorage(event && event.detail, true);
    });
  } catch {
    /* no document */
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (rules.applyStorageDelta) rules.applyStorageDelta(changes);
      // Changing the mosaic theme must not interrupt a live message.
      const touchesMessage = Boolean(
        changes.messageTheme ||
          changes.messageThemeSettings ||
          changes.messageShowBackground ||
          changes.messageShowQr ||
          changes.messageShowLogo ||
          changes.enabled ||
          changes.stageAspect ||
          changes.showBackground ||
          changes.showQr ||
          changes.showLogo ||
          changes.customThemes ||
          changes.customEngines
      );
      if (!touchesMessage) return;
      if (changes.messageThemeSettings) {
        lastSettingsKey = "";
        applyMessageSettingsFromStorage(rules.peekSettings ? rules.peekSettings() : null, true);
      }
      if (
        changes.messageTheme ||
        changes.enabled ||
        changes.stageAspect ||
        changes.customThemes ||
        changes.customEngines
      ) {
        requestRebuild();
      }
      // Chrome toggles only — refresh slots without remounting (remount was
      // racing Vixi’s message DOM and losing the live QR source).
      if (
        changes.messageShowQr ||
        changes.messageShowLogo ||
        changes.messageShowBackground ||
        changes.showQr ||
        changes.showLogo ||
        changes.showBackground
      ) {
        const live = document.getElementById(OVERLAY_ID);
        if (live && typeof rules.ensureBrandChrome === "function") {
          rules.ensureBrandChrome(live, "message");
        }
        if (typeof handoff.applyCovers === "function") handoff.applyCovers();
      }
      scheduleApply();
    });
  } catch {
    /* extension reloaded */
  }

  let resizeRebuildTimer = 0;
  window.addEventListener("resize", () => {
    if (resizeRebuildTimer) clearTimeout(resizeRebuildTimer);
    resizeRebuildTimer = setTimeout(() => {
      resizeRebuildTimer = 0;
      if (performance.now() < ignoreResizeUntil) return;
      const host = rules.findOverlayHost && rules.findOverlayHost();
      const key = hostSizeKey(host);
      if (key && key === mountedHostKey) return;
      requestRebuild();
      scheduleApply();
    }, 250);
  });

  if (typeof handoff.onLiveKind === "function") {
    handoff.onLiveKind((kind) => {
      if (kind === "native" || kind === "mosaic") {
        scheduleApply(0);
        return;
      }
      if (kind !== "message") return;
      if (!document.getElementById(OVERLAY_ID)) pendingRebuild = true;
      scheduleApply(0);
    });
  }

  apply().catch(() => {});
})();
