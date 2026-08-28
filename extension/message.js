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
    const ok = mountTheme(id, themeSettings);
    if (ok) {
      const host = rules.findOverlayHost && rules.findOverlayHost();
      mountedHostKey = hostSizeKey(host);
    }
    return ok;
  }

  function mountTheme(id, themeSettings) {
    const def = themeApi.themes[id];
    if (!def) return false;
    const host = rules.findOverlayHost && rules.findOverlayHost();
    if (host && !layoutReady(host)) return false;
    if (active || document.getElementById(OVERLAY_ID)) unmountTheme();
    const root = ensureOverlay();
    if (!root) return false;
    root.dataset.theme = id;
    if (def.engine) root.dataset.engine = def.engine;
    else delete root.dataset.engine;
    const state = def.mount(root, themeSettings) || {};
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

  function teardownSoft() {
    unmountTheme();
    document.documentElement.classList.remove("dyn-message-on");
    const root = document.getElementById(OVERLAY_ID);
    if (root) root.remove();
  }

  function teardownHard() {
    teardownSoft();
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

  async function present(capture, themeSettings, shouldHide) {
    if (!active || !capture) return;
    const token = ++cycle;
    const root = document.getElementById(OVERLAY_ID);
    if (!root) return;
    await decodeImage(capture.src);
    if (token !== cycle) return;
    const latest = rules.messageCapture();
    const next = latest.src || latest.message || latest.name ? latest : capture;
    if (shouldHide && typeof active.def.hide === "function") {
      await active.def.hide(root, active.state, themeSettings);
    }
    if (token !== cycle) return;
    try {
      if (typeof active.def.show === "function") {
        await active.def.show(root, next, active.state, themeSettings);
      }
    } finally {
      // Reveal after show (or after a failed show) so we never leave QR/logo alone
      // on a cold load, and never stick on a black stage forever.
      root.classList.remove("dyn-awaiting-show");
    }
  }

  handoff.register("message", {
    hide() {
      const root = document.getElementById(OVERLAY_ID);
      if (!active || !root || typeof active.def.hide !== "function") return Promise.resolve();
      return active.def.hide(root, active.state, lastThemeSettings);
    },
    teardown: teardownSoft,
  });

  const customApi = globalThis.BGCustomThemes;
  if (customApi && typeof customApi.onChange === "function") {
    customApi.onChange(() => {
      // Imported mosaic packs must not remount a live message beat.
      const kind = handoff.liveKind();
      const mode = handoff.currentMode();
      if (kind === "mosaic" || (kind === "" && mode === "mosaic")) return;
      requestRebuild();
      lastKey = "";
      scheduleApply();
    });
  }

  async function apply() {
    // Sideloaded engines compile from storage after this file starts. Wait so
    // the first paint does not treat the selected theme as missing.
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
    handoff.applyCovers(settings);
    const theme = settings.enabled ? rules.normalizeMessageTheme(settings.messageTheme) : "off";
    const themeSettings = rules.resolveMessageThemeSettings(settings, theme);
    const aspect = rules.normalizeStageAspect
      ? rules.normalizeStageAspect(settings.stageAspect)
      : "auto";
    const def = themeApi.themes[theme];

    if (theme === "off" || !def) {
      // If a message beat is live and mosaic theme is also off, still clear any
      // leftover message chrome. Mosaic handles its own yield separately.
      if (handoff.liveKind() === "mosaic") await releaseForMosaic();
      else teardownHard();
      return;
    }

    const kind = handoff.liveKind();
    const mode = handoff.currentMode();
    const mosaicPage = rules.pageLooksLikeMosaic && rules.pageLooksLikeMosaic();
    const cap = rules.messageCapture();
    const hasMsg = Boolean(cap.src || cap.message || cap.name);
    const mosaicOn =
      settings.enabled !== false && rules.normalizeMosaicTheme(settings.mosaicTheme) !== "off";
    // Yield cleanly when Vixi is on a mosaic beat.
    if (kind === "mosaic") {
      document.documentElement.classList.add("dyn-cover-message", "dyn-cover-mosaic");
      if (!mosaicOn) await releaseForMosaic();
      return;
    }
    // Do not steal a pure mosaic page with no message content.
    if (kind !== "message" && mosaicPage && !hasMsg) return;
    if (kind === "" && mosaicOn && !hasMsg) return;
    if (kind !== "message" && !(kind === "" && (!mode || mode === "message" || hasMsg))) return;

    ensureStyle();
    ensureFonts();
    lastThemeSettings = themeSettings;

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
        if (key === lastKey) {
          if (live) live.classList.remove("dyn-awaiting-show");
          return;
        }
        lastKey = key;
        await present(capture, themeSettings, false);
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
        if (key === lastKey) {
          if (live) live.classList.remove("dyn-awaiting-show");
          return;
        }
        const shouldHide = Boolean(lastKey);
        lastKey = key;
        await present(capture, themeSettings, shouldHide);
      },
    });
  }

  function scheduleApply() {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      applyTimer = 0;
      apply().catch(() => {});
    }, 90);
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
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
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
      if (
        changes.messageTheme ||
        changes.enabled ||
        changes.stageAspect ||
        changes.messageThemeSettings ||
        changes.messageShowBackground ||
        changes.messageShowQr ||
        changes.messageShowLogo
      ) {
        requestRebuild();
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

  apply().catch(() => {});
})();
