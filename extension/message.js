(() => {
  const rules = globalThis.BGExtensionRules;
  const themeApi = globalThis.BGMessageThemes;
  if (!rules || !themeApi) return;

  const OVERLAY_ID = "dyn-message-theme";
  const STYLE_ID = "dyn-message-theme-style";
  const FONTS_ID = "dyn-message-fonts";

  let applyTimer = 0;
  let mountedTheme = "";
  let active = null;
  let lastKey = "";
  let lastSettingsKey = "";
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
      if (root) root.remove();
      root = document.createElement("div");
      root.id = OVERLAY_ID;
      host.appendChild(root);
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
    return true;
  }

  function teardown() {
    unmountTheme();
    document.documentElement.classList.remove("dyn-message-on");
    const root = document.getElementById(OVERLAY_ID);
    if (root) root.remove();
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  async function present(capture, themeSettings, shouldHide) {
    if (!active || !capture) return;
    const token = ++cycle;
    const root = document.getElementById(OVERLAY_ID);
    if (!root) return;
    if (shouldHide && typeof active.def.hide === "function") {
      await active.def.hide(root, active.state, themeSettings);
    }
    if (token !== cycle) return;
    if (typeof active.def.show === "function") {
      await active.def.show(root, capture, active.state, themeSettings);
    }
  }

  async function apply() {
    if (typeof rules.extensionAlive === "function" && !rules.extensionAlive()) {
      teardown();
      observer.disconnect();
      return;
    }
    const settings = await rules.loadSettings();
    const theme = settings.enabled ? rules.normalizeMessageTheme(settings.messageTheme) : "off";
    const themeSettings = rules.resolveMessageThemeSettings(settings, theme);
    const hasMessage = rules.hasMessage();
    const def = themeApi.themes[theme];

    if (theme === "off" || !def || !hasMessage) {
      teardown();
      return;
    }

    ensureStyle();
    ensureFonts();
    document.documentElement.classList.add("dyn-message-on");

    const overlay = document.getElementById(OVERLAY_ID);
    if (mountedTheme !== theme || !overlay) {
      mountTheme(theme, themeSettings);
    } else if (lastSettingsKey !== settingsKey(theme, themeSettings)) {
      lastSettingsKey = settingsKey(theme, themeSettings);
      if (typeof active.def.applySettings === "function") {
        active.def.applySettings(overlay, active.state, themeSettings);
      }
    }

    const capture = rules.messageCapture();
    const key = captureKey(capture);
    if (!capture.src && !capture.message && !capture.name) return;
    if (key === lastKey) return;
    const shouldHide = Boolean(lastKey);
    lastKey = key;
    present(capture, themeSettings, shouldHide).catch(() => {});
  }

  function scheduleApply() {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      applyTimer = 0;
      apply().catch(() => {});
    }, 40);
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
