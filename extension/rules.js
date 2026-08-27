(function (root) {
  const STORAGE_KEYS = {
    enabled: "enabled",
    anyOutputIframeHtml: "anyOutputIframeHtml",
    rules: "rules",
    mosaicTheme: "mosaicTheme",
    messageTheme: "messageTheme",
    messageThemeSettings: "messageThemeSettings",
  };

  const DEFAULTS = {
    enabled: true,
    anyOutputIframeHtml: "",
    rules: [],
    mosaicTheme: "off",
    messageTheme: "off",
    messageThemeSettings: {},
  };

  const MOTION_MODES = ["slow", "drift", "fizz"];

  const MESSAGE_THEME_META = {
    "led-scoreboard": {
      label: "LED Scoreboard",
      labels: { primary: "Primary", secondary: "Secondary" },
      defaults: { primary: "#ffb300", secondary: "#22ff55", revealMs: 1200 },
    },
    "neon-nightclub": {
      label: "Neon Nightclub",
      labels: { primary: "Primary", secondary: "Secondary" },
      defaults: { primary: "#35e0ff", secondary: "#ff3fa4", revealMs: 1400 },
    },
    "ultras-tifo": {
      label: "Ultras Tifo",
      labels: { primary: "Primary", secondary: "Secondary" },
      defaults: { primary: "#a2121f", secondary: "#ffffff", revealMs: 900 },
    },
    "holo-card": {
      label: "Holo Card",
      labels: { primary: "Primary", secondary: "Secondary" },
      defaults: { primary: "#8b5cff", secondary: "#3de0ff", revealMs: 1200 },
    },
    "broadcast-tv": {
      label: "Broadcast TV",
      labels: { primary: "Primary", secondary: "Secondary" },
      defaults: { primary: "#ff2d3a", secondary: "#f0c14b", revealMs: 1100 },
    },
    "liquid-glass": {
      label: "Liquid Glass",
      labels: {
        primary: "Bubbles",
        secondary: "Highlight",
        background: "Background",
        motion: "Motion",
      },
      defaults: {
        primary: "#7ee8ff",
        secondary: "#4dffc3",
        background: "#061014",
        motion: "drift",
        revealMs: 1300,
      },
    },
    "parallax-drift": {
      label: "Parallax Drift",
      labels: { primary: "Primary", secondary: "Secondary" },
      defaults: { primary: "#ff4d8d", secondary: "#7a86ff", revealMs: 1250 },
    },
  };

  const MESSAGE_THEMES = ["off", ...Object.keys(MESSAGE_THEME_META)];

  const MOSAIC_THEMES = [
    "off",
    "decks",
    "spotlight",
    "coverflow",
    "fan",
    "filmstrip",
    "scatter",
    "cascade",
    "orbit",
    "billboard",
    "reels",
    "polaroid",
    "flipwall",
    "livewall",
    "cubes",
    "pedestals",
  ];

  function envKey(hostname) {
    const match = String(hostname || "").toLowerCase().match(/vixisuite(?:-[a-z0-9]+)?/);
    return match ? match[0] : String(hostname || "").toLowerCase();
  }

  function extractIds(urlString) {
    try {
      const url = new URL(urlString);
      const ids = new Set();
      const shortId = url.pathname.match(/\/go\/o\/([^/]+)/);
      if (shortId && shortId[1]) ids.add(decodeURIComponent(shortId[1]));
      const outputId = url.pathname.match(/\/go\/output\/([^/]+)/);
      if (outputId && outputId[1]) ids.add(decodeURIComponent(outputId[1]));
      const sid = url.searchParams.get("sid");
      if (sid) ids.add(sid);
      return {
        hostname: url.hostname.toLowerCase(),
        env: envKey(url.hostname),
        ids,
      };
    } catch {
      return null;
    }
  }

  function isOutputPage(urlString) {
    try {
      const url = new URL(urlString);
      if (!/vixisuite/i.test(url.hostname)) return false;
      return /\/go\/output(?:\/|$)/.test(url.pathname) || /\/go\/o\//.test(url.pathname);
    } catch {
      return false;
    }
  }

  function urlsMatch(pageUrl, ruleUrl) {
    const page = extractIds(pageUrl);
    const rule = extractIds(ruleUrl);
    if (!page || !rule) return false;
    if (page.env !== rule.env) return false;
    if (page.ids.size === 0 || rule.ids.size === 0) return false;
    for (const id of page.ids) {
      if (rule.ids.has(id)) return true;
    }
    return false;
  }

  function parseIframeSrc(htmlOrUrl) {
    const raw = String(htmlOrUrl || "").trim();
    if (!raw) return "";
    const quoted = raw.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
    if (quoted) return quoted[1].trim();
    const unquoted = raw.match(/<iframe\b[^>]*\bsrc\s*=\s*([^\s>]+)/i);
    if (unquoted) return unquoted[1].replace(/["']/g, "").trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    return "";
  }

  function normalizeMosaicTheme(value) {
    return MOSAIC_THEMES.includes(value) ? value : "off";
  }

  function normalizeMessageTheme(value) {
    return MESSAGE_THEMES.includes(value) ? value : "off";
  }

  function isHexColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || ""));
  }

  function normalizeOneThemeSettings(themeId, raw) {
    const meta = MESSAGE_THEME_META[themeId];
    if (!meta) return {};
    const defaults = meta.defaults;
    const src = raw && typeof raw === "object" ? raw : {};
    const next = {
      primary: isHexColor(src.primary) ? src.primary.toLowerCase() : defaults.primary,
      secondary: isHexColor(src.secondary) ? src.secondary.toLowerCase() : defaults.secondary,
    };
    if (defaults.background) {
      next.background = isHexColor(src.background)
        ? src.background.toLowerCase()
        : defaults.background;
    }
    if (defaults.motion) {
      next.motion = MOTION_MODES.includes(src.motion) ? src.motion : defaults.motion;
    }
    return next;
  }

  function normalizeMessageThemeSettings(value) {
    const src = value && typeof value === "object" ? value : {};
    const next = {};
    Object.keys(MESSAGE_THEME_META).forEach((id) => {
      next[id] = normalizeOneThemeSettings(id, src[id]);
    });
    return next;
  }

  function resolveMessageThemeSettings(settings, themeId) {
    const id = normalizeMessageTheme(themeId || (settings && settings.messageTheme));
    if (id === "off") return null;
    const meta = MESSAGE_THEME_META[id];
    const stored = settings && settings.messageThemeSettings && settings.messageThemeSettings[id];
    return {
      ...normalizeOneThemeSettings(id, stored),
      revealMs: meta && meta.defaults ? meta.defaults.revealMs : 1000,
    };
  }

  function normalizeSettings(value) {
    const next = value || {};
    const rules = Array.isArray(next.rules) ? next.rules : [];
    return {
      enabled: next.enabled !== false,
      anyOutputIframeHtml: String(next.anyOutputIframeHtml || ""),
      mosaicTheme: normalizeMosaicTheme(next.mosaicTheme),
      messageTheme: normalizeMessageTheme(next.messageTheme),
      messageThemeSettings: normalizeMessageThemeSettings(next.messageThemeSettings),
      rules: rules
        .map((rule) => ({
          outputUrl: String(rule && rule.outputUrl ? rule.outputUrl : "").trim(),
          iframeHtml: String(rule && rule.iframeHtml ? rule.iframeHtml : "").trim(),
        }))
        .filter((rule) => rule.outputUrl || rule.iframeHtml),
    };
  }

  function resolveIframeSrc(settings, pageUrl) {
    const state = normalizeSettings(settings);
    if (!state.enabled) return "";

    for (const rule of state.rules) {
      if (!rule.outputUrl || !rule.iframeHtml) continue;
      if (!urlsMatch(pageUrl, rule.outputUrl)) continue;
      const src = parseIframeSrc(rule.iframeHtml);
      if (src) return src;
    }

    if (isOutputPage(pageUrl)) {
      return parseIframeSrc(state.anyOutputIframeHtml);
    }

    return "";
  }

  function findWrapper() {
    return document.querySelector(".v2-app-wrapper") || document.querySelector(".output-wrapper");
  }

  function findOverlayHost() {
    const wrapper =
      document.querySelector(".v2-app-wrapper") ||
      document.querySelector(".output-wrapper") ||
      document.querySelector(".output-page");
    if (!wrapper) return document.querySelector(".mosaic-layout");

    const hostId = (root.BGThemeHandoff && root.BGThemeHandoff.HOST_ID) || "dyn-theme-host";
    let host = document.getElementById(hostId);
    const app =
      wrapper.querySelector(":scope > .output-app") || wrapper.querySelector(".output-app");
    if (!host || host.parentElement !== wrapper) {
      if (host) host.remove();
      host = document.createElement("div");
      host.id = hostId;
      host.setAttribute("aria-hidden", "true");
      if (app && app.parentElement === wrapper) wrapper.insertBefore(host, app);
      else wrapper.appendChild(host);
    } else if (
      app &&
      app.parentElement === wrapper &&
      host.compareDocumentPosition(app) & Node.DOCUMENT_POSITION_PRECEDING
    ) {
      wrapper.insertBefore(host, app);
    }
    return host;
  }

  function hasMosaic() {
    return mosaicContentCount() > 0;
  }

  function hasMessage() {
    const cap = messageCapture();
    return Boolean(cap.src || cap.message || cap.name);
  }

  function mosaicContentCount() {
    let count = 0;
    mosaicImages().forEach((img) => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith("data:")) return;
      if (isSkippedMosaicImage(img)) return;
      count += 1;
    });
    return count;
  }

  function messageCapture() {
    const img = document.querySelector(".capture-content-layer img");
    const src = img && (img.currentSrc || img.src) ? img.currentSrc || img.src : "";
    if (src && src.startsWith("data:")) return { src: "", message: "", name: "" };
    const texts = [...document.querySelectorAll(".message-layer .message-content-text, .message-content-text")];
    return {
      src: src && !src.startsWith("data:") ? src : "",
      message: texts[0] ? String(texts[0].textContent || "").trim() : "",
      name: texts[1] ? String(texts[1].textContent || "").trim() : "",
    };
  }

  function mosaicImages() {
    return document.querySelectorAll(".v2-asset-tile img, .v2-mosaic-face img, .mosaic-asset img");
  }

  function backgroundLayers(root) {
    const found = [];
    const scope = root || document;
    scope.querySelectorAll(".v2-app-wrapper__bg-image").forEach((el) => found.push(el));
    const wrapper =
      root && root.classList && root.classList.contains("output-wrapper")
        ? root
        : (root && root.querySelector ? root.querySelector(".output-wrapper") : null) ||
          document.querySelector(".output-wrapper");
    if (wrapper) {
      [...wrapper.children].forEach((child) => {
        if (child.classList.contains("asset-view")) found.push(child);
      });
    }
    return found;
  }

  function isSkippedMosaicImage(img) {
    if (!img || !img.closest) return true;
    if (img.closest(".v2-qr-tile, .qr-tile")) return true;
    if (img.classList.contains("v2-app-wrapper__bg-image")) return true;
    if (img.closest(".output-wrapper > .asset-view")) return true;
    if (img.closest(".mosaic-layout > .asset-view")) return true;
    return false;
  }

  function extensionAlive() {
    try {
      return Boolean(chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  let lastGoodSettings = null;
  let settingsFresh = false;
  let watchingSettings = false;

  function watchSettings() {
    if (watchingSettings || !extensionAlive()) return;
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local") settingsFresh = false;
      });
      watchingSettings = true;
    } catch {
      /* dead runtime; cached settings keep working */
    }
  }

  function loadSettings() {
    watchSettings();
    if (settingsFresh && lastGoodSettings) {
      return Promise.resolve(lastGoodSettings);
    }
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve(lastGoodSettings || normalizeSettings(DEFAULTS));
        return;
      }
      try {
        chrome.storage.local.get(DEFAULTS, (stored) => {
          if (!extensionAlive() || (chrome.runtime.lastError && /invalidated/i.test(chrome.runtime.lastError.message || ""))) {
            resolve(lastGoodSettings || normalizeSettings(DEFAULTS));
            return;
          }
          lastGoodSettings = normalizeSettings(stored);
          settingsFresh = true;
          resolve(lastGoodSettings);
        });
      } catch {
        resolve(lastGoodSettings || normalizeSettings(DEFAULTS));
      }
    });
  }

  function saveSettings(settings) {
    const next = normalizeSettings(settings);
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve();
        return;
      }
      try {
        chrome.storage.local.set(next, () => resolve());
      } catch {
        resolve();
      }
    });
  }

  root.BGExtensionRules = {
    STORAGE_KEYS,
    DEFAULTS,
    MOSAIC_THEMES,
    MESSAGE_THEMES,
    MESSAGE_THEME_META,
    MOTION_MODES,
    envKey,
    extractIds,
    isOutputPage,
    urlsMatch,
    parseIframeSrc,
    normalizeMosaicTheme,
    normalizeMessageTheme,
    normalizeOneThemeSettings,
    normalizeMessageThemeSettings,
    resolveMessageThemeSettings,
    normalizeSettings,
    resolveIframeSrc,
    findWrapper,
    findOverlayHost,
    hasMosaic,
    hasMessage,
    mosaicContentCount,
    messageCapture,
    mosaicImages,
    backgroundLayers,
    isSkippedMosaicImage,
    extensionAlive,
    loadSettings,
    saveSettings,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
