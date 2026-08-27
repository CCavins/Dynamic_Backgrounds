(() => {
  const rules = globalThis.BGExtensionRules;
  const themeApi = globalThis.BGMessageThemes;
  const handoff = globalThis.BGThemeHandoff;
  if (!rules || !themeApi || !handoff) return;

  const OVERLAY_ID = "dyn-message-theme";
  const STYLE_ID = "dyn-message-theme-style";
  const FONTS_ID = "dyn-message-fonts";

  let applyTimer = 0;
  let mountedTheme = "";
  let active = null;
  let lastKey = "";
  let lastSettingsKey = "";
  let lastThemeSettings = null;
  let cycle = 0;

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
    return root;
  }

  function unmountTheme() {
    const root = document.getElementById(OVERLAY_ID);
    if (active && active.def && typeof active.def.unmount === "function" && root) {
      active.def.unmount(root, active.state);
    }
    if (root) root.replaceChildren();
    active = null;
    mountedTheme = "";
    lastKey = "";
    lastSettingsKey = "";
  }

  function mountTheme(id, themeSettings) {
    const def = themeApi.themes[id];
    if (!def) return false;
    unmountTheme();
    const root = ensureOverlay();
    if (!root) return false;
    root.dataset.theme = id;
    const state = def.mount(root, themeSettings) || {};
    if (typeof def.applySettings === "function") {
      def.applySettings(root, state, themeSettings);
    }
    active = { id, def, state };
    mountedTheme = id;
    lastSettingsKey = settingsKey(id, themeSettings);
    lastThemeSettings = themeSettings;
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
    if (typeof active.def.show === "function") {
      await active.def.show(root, next, active.state, themeSettings);
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

  async function apply() {
    if (typeof rules.extensionAlive === "function" && !rules.extensionAlive()) {
      teardownHard();
      observer.disconnect();
      return;
    }
    const settings = await rules.loadSettings();
    handoff.applyCovers(settings);
    const theme = settings.enabled ? rules.normalizeMessageTheme(settings.messageTheme) : "off";
    const themeSettings = rules.resolveMessageThemeSettings(settings, theme);
    const def = themeApi.themes[theme];

    if (theme === "off" || !def) {
      teardownHard();
      return;
    }

    const kind = handoff.liveKind();
    if (kind !== "message") return;

    ensureStyle();
    ensureFonts();
    lastThemeSettings = themeSettings;

    await handoff.activate("message", {
      prepare() {
        return decodeImage(rules.messageCapture().src);
      },
      async reveal() {
        document.documentElement.classList.add("dyn-message-on");
        const overlay = document.getElementById(OVERLAY_ID);
        if (mountedTheme !== theme || !overlay) {
          if (!mountTheme(theme, themeSettings)) return;
        } else if (lastSettingsKey !== settingsKey(theme, themeSettings)) {
          lastSettingsKey = settingsKey(theme, themeSettings);
          if (typeof active.def.applySettings === "function") {
            active.def.applySettings(overlay, active.state, themeSettings);
          }
        }

        const capture = rules.messageCapture();
        if (!capture.src && !capture.message && !capture.name) return;
        const key = captureKey(capture);
        if (key === lastKey) return;
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
