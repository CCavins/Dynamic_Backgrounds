(function (root) {
  const STORAGE_KEYS = {
    enabled: "enabled",
    anyOutputIframeHtml: "anyOutputIframeHtml",
    rules: "rules",
    mosaicTheme: "mosaicTheme",
    messageTheme: "messageTheme",
    leaderboardTheme: "leaderboardTheme",
    messageThemeSettings: "messageThemeSettings",
    mosaicThemeSettings: "mosaicThemeSettings",
    leaderboardThemeSettings: "leaderboardThemeSettings",
    customThemes: "customThemes",
    customEngines: "customEngines",
    customEngineWarningSeen: "customEngineWarningSeen",
    stageAspect: "stageAspect",
    showQr: "showQr",
    showLogo: "showLogo",
    showBackground: "showBackground",
    messageShowBackground: "messageShowBackground",
    messageShowQr: "messageShowQr",
    messageShowLogo: "messageShowLogo",
    mosaicShowBackground: "mosaicShowBackground",
    mosaicShowQr: "mosaicShowQr",
    mosaicShowLogo: "mosaicShowLogo",
    bgMode: "bgMode",
    bgMediaId: "bgMediaId",
    bgFit: "bgFit",
  };

  const STAGE_ASPECT_PRESETS = [
    { value: "vixi", label: "Match Vixi" },
    { value: "auto", label: "Match the window" },
    { value: "16:9", label: "16:9 landscape" },
    { value: "9:16", label: "9:16 portrait" },
    { value: "4:3", label: "4:3 landscape" },
    { value: "3:4", label: "3:4 portrait" },
    { value: "3:2", label: "3:2 landscape" },
    { value: "2:3", label: "2:3 portrait" },
    { value: "1:1", label: "1:1 square" },
    { value: "5:4", label: "5:4 landscape" },
    { value: "4:5", label: "4:5 portrait" },
    { value: "21:9", label: "21:9 ultrawide" },
    { value: "9:21", label: "9:21 tall" },
  ];
  const STAGE_ASPECTS = STAGE_ASPECT_PRESETS.map((item) => item.value);
  const DESIGN_LONG_EDGE = 1920;
  const MAX_ASPECT_RATIO = 32;

  const DEFAULTS = {
    enabled: true,
    anyOutputIframeHtml: "",
    rules: [],
    mosaicTheme: "off",
    messageTheme: "off",
    leaderboardTheme: "off",
    messageThemeSettings: {},
    mosaicThemeSettings: {},
    leaderboardThemeSettings: {},
    stageAspect: "vixi",
    messageShowBackground: false,
    messageShowQr: false,
    messageShowLogo: false,
    mosaicShowBackground: false,
    mosaicShowQr: false,
    mosaicShowLogo: false,
    bgMode: "auto",
    bgMediaId: "",
    bgFit: "cover",
  };

  const MOTION_MODES = ["slow", "drift", "fizz"];
  const PHOTO_STYLE_MODES = ["bw", "color", "sepia"];

  function normalizePhotoStyle(value, fallback) {
    if (PHOTO_STYLE_MODES.includes(value)) return value;
    if (value === true || value === "true" || value === 1 || value === "1") return "color";
    if (value === false || value === "false" || value === 0 || value === "0") return "bw";
    return fallback && PHOTO_STYLE_MODES.includes(fallback) ? fallback : "bw";
  }
  const BG_MODES = ["auto", "vixi", "link", "media"];
  const BG_FITS = ["cover", "contain", "fill", "center"];
  const MOSAIC_SCALE_MIN = 0.7;
  const MOSAIC_SCALE_MAX = 1.5;

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
    "text-message": {
      label: "Text Message",
      labels: {
        primary: "Phone",
        secondary: "Accent",
        background: "Stage",
        wallpaper: "Chat wallpaper",
      },
      defaults: {
        primary: "#3f3f46",
        secondary: "#0a84ff",
        background: "#07090f",
        wallpaper: "",
        revealMs: 900,
      },
    },
  };

  const MESSAGE_THEMES = ["off", ...Object.keys(MESSAGE_THEME_META)];

  const MOSAIC_THEME_META = {
    decks: { label: "Card decks", hidden: true },
    "decks-brand": { label: "Card decks*", brandAware: true },
    spotlight: { label: "Spotlight" },
    coverflow: { label: "Coverflow" },
    fan: { label: "Fan", hidden: true },
    "fan-brand": { label: "Fan*", brandAware: true },
    filmstrip: { label: "Filmstrip", hidden: true },
    scatter: { label: "Scatter", hidden: true },
    cascade: { label: "Cascade" },
    orbit: { label: "Orbit" },
    billboard: { label: "Billboard", hidden: true },
    reels: { label: "Reels" },
    polaroid: {
      label: "Polaroid wall",
      hidden: true,
      labels: { scale: "Photo size", primary: "Frame" },
      defaults: { scale: 1, primary: "#ffffff" },
    },
    "polaroid-brand": { label: "Polaroid wall*", brandAware: true },
    flipwall: {
      label: "3D flip wall",
      hidden: true,
      labels: { scale: "Photo size", primary: "Edge" },
      defaults: { scale: 1, primary: "#5a5e66" },
    },
    "flipwall-brand": { label: "3D flip wall*", brandAware: true },
    livewall: {
      label: "Live mosaic",
      hidden: true,
      labels: { scale: "Photo size" },
      defaults: { scale: 1 },
    },
    "livewall-brand": { label: "Live mosaic*", brandAware: true },
    cubes: {
      label: "Cube field",
      hidden: true,
      labels: { scale: "Cube size", primary: "Cube color" },
      defaults: { scale: 1, primary: "#10131c" },
    },
    "cubes-brand": { label: "Cube field*", brandAware: true },
    depthfield: {
      label: "Depth Field",
      labels: { scale: "Cube size", primary: "Cube color" },
      defaults: { scale: 1, primary: "#10131c" },
    },
    pedestals: {
      label: "Pedestals",
      labels: { primary: "Pedestal" },
      defaults: { primary: "#54585f" },
    },
  };

  const MOSAIC_THEMES = ["off", ...Object.keys(MOSAIC_THEME_META)];

  const LEADERBOARD_THEME_META = {
    podium: {
      label: "Crown podium",
      labels: { primary: "Score", secondary: "Highlight", panel: "Boxes" },
      defaults: {
        primary: "#3dff8a",
        secondary: "#f5c542",
        panel: "#12182a",
        revealMs: 360,
        hideMs: 220,
        showHeader: true,
        avatarBorder: true,
      },
    },
    "stacked-cards": {
      label: "Winner cards",
      labels: { primary: "Score", secondary: "Highlight", panel: "Boxes" },
      defaults: {
        primary: "#3dff8a",
        secondary: "#f5c542",
        panel: "#12182a",
        revealMs: 340,
        hideMs: 200,
        showHeader: true,
        avatarBorder: true,
      },
    },
    "compact-ladder": {
      label: "Wreath ranking",
      labels: { primary: "Score", secondary: "Highlight", panel: "Boxes" },
      defaults: {
        primary: "#3dff8a",
        secondary: "#f5c542",
        panel: "#12182a",
        revealMs: 300,
        hideMs: 180,
        showHeader: true,
        avatarBorder: true,
      },
    },
    "hero-list": {
      label: "Gold spotlight",
      labels: { primary: "Score", secondary: "Highlight", panel: "Boxes" },
      defaults: {
        primary: "#f5c542",
        secondary: "#6d4aff",
        panel: "#121028",
        revealMs: 360,
        hideMs: 220,
        showHeader: true,
        avatarBorder: true,
      },
    },
    "ticker-strip": {
      label: "Broadcast pills",
      labels: { primary: "Score", secondary: "Highlight", panel: "Boxes" },
      defaults: {
        primary: "#f5c542",
        secondary: "#3dff8a",
        panel: "#12182a",
        revealMs: 320,
        hideMs: 200,
        showHeader: true,
        avatarBorder: true,
      },
    },
  };

  const LEADERBOARD_THEMES = ["off", ...Object.keys(LEADERBOARD_THEME_META)];

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
      if (document.documentElement.getAttribute("data-dyn-harness") === "1") return true;
      const url = new URL(urlString);
      // api.vixisuite…/go/o/ID?standalone=mosaic and cdn…/go/output/ID
      if (!/vixisuite/i.test(url.hostname) && !/thefamousgroup\.com$/i.test(url.hostname)) {
        return false;
      }
      if (/(?:^|[?&])standalone=(?:mosaic|message)(?:&|$)/i.test(url.search || "")) return true;
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

  let customMessageMeta = {};
  let customMosaicMeta = {};
  const bundledMessageThemeIds = new Set();
  const bundledMosaicThemeIds = new Set();

  function registerBundledThemeIds(kind, ids) {
    const set = kind === "message" ? bundledMessageThemeIds : bundledMosaicThemeIds;
    (Array.isArray(ids) ? ids : []).forEach((id) => {
      const next = String(id || "").trim();
      if (next) set.add(next);
    });
  }
  let lastGoodCustomThemes = [];
  let lastGoodCustomEngines = {};
  let lastRawSettings = null;
  let lastGoodSettings = null;
  let settingsFresh = false;
  let settingsEpoch = 0;

  function messageThemeMetaAll() {
    return { ...MESSAGE_THEME_META, ...customMessageMeta };
  }

  function mosaicThemeMetaAll() {
    return { ...MOSAIC_THEME_META, ...customMosaicMeta };
  }

  function leaderboardThemeMetaAll() {
    return { ...LEADERBOARD_THEME_META };
  }

  function isKnownMessageTheme(value) {
    return (
      value === "off" ||
      Boolean(messageThemeMetaAll()[value]) ||
      bundledMessageThemeIds.has(value)
    );
  }

  function isKnownMosaicTheme(value) {
    return (
      value === "off" ||
      Boolean(mosaicThemeMetaAll()[value]) ||
      bundledMosaicThemeIds.has(value)
    );
  }

  function builtinMosaicEngineMeta(engine) {
    if (!engine) return null;
    if (MOSAIC_THEME_META[engine] && MOSAIC_THEME_META[engine].defaults) {
      return MOSAIC_THEME_META[engine];
    }
    if (String(engine).endsWith("-brand")) {
      const base = String(engine).slice(0, -6);
      if (MOSAIC_THEME_META[base] && MOSAIC_THEME_META[base].defaults) return MOSAIC_THEME_META[base];
    }
    return null;
  }

  function themeHasMosaicControls(meta) {
    const d = meta && meta.defaults;
    if (!d) return false;
    return (
      d.scale != null ||
      d.primary ||
      d.secondary ||
      d.background ||
      d.frame ||
      d.photoStyle
    );
  }

  function mosaicSettingsBaseId(themeId) {
    const id = String(themeId || "");
    if (!id || id === "off") return "";
    const all = mosaicThemeMetaAll();
    const meta = all[id];
    if (meta && themeHasMosaicControls(meta)) return id;
    if (id.endsWith("-brand")) {
      const base = id.slice(0, -6);
      if (all[base] && themeHasMosaicControls(all[base])) return base;
    }
    if (meta && meta.engine) {
      const engineMeta = builtinMosaicEngineMeta(meta.engine);
      if (engineMeta && themeHasMosaicControls(engineMeta)) {
        const engine = String(meta.engine);
        return engine.endsWith("-brand") ? engine.slice(0, -6) : engine;
      }
    }
    return id;
  }

  function applyCustomThemeMeta(packs) {
    customMessageMeta = {};
    customMosaicMeta = {};
    (Array.isArray(packs) ? packs : []).forEach((pack) => {
      if (!pack || !pack.id) return;
      const engineMeta =
        pack.kind === "message" && pack.engine
          ? MESSAGE_THEME_META[pack.engine]
          : pack.kind === "mosaic"
            ? builtinMosaicEngineMeta(pack.engine)
            : null;
      const meta = {
        label: pack.label || pack.id,
        custom: !pack.bundled,
        bundled: Boolean(pack.bundled),
        engine: pack.engine || "",
        labels: { ...((engineMeta && engineMeta.labels) || {}) },
        defaults: { ...((engineMeta && engineMeta.defaults) || {}) },
      };
      if (pack.kind === "message") {
        meta.defaults.revealMs =
          Number(pack.revealMs) ||
          (engineMeta && engineMeta.defaults && engineMeta.defaults.revealMs) ||
          1000;
      }
      const settings = pack.settings && typeof pack.settings === "object" ? pack.settings : {};
      ["primary", "secondary", "background"].forEach((key) => {
        const spec = settings[key];
        if (!spec) return;
        meta.labels[key] = spec.label || meta.labels[key] || key;
        if (spec.default) meta.defaults[key] = spec.default;
      });
      if (pack.kind === "message" && settings.motion && settings.motion.default) {
        meta.labels.motion = settings.motion.label || meta.labels.motion || "Motion";
        meta.defaults.motion = settings.motion.default;
      }
      if (settings.scale && settings.scale.default != null) {
        meta.labels.scale = settings.scale.label || meta.labels.scale || "Photo size";
        const n = Number(settings.scale.default);
        meta.defaults.scale = isFinite(n) ? n : engineMeta && engineMeta.defaults && engineMeta.defaults.scale != null
          ? engineMeta.defaults.scale
          : 1;
      }
      Object.keys(settings).forEach((key) => {
        if (["primary", "secondary", "background", "scale", "motion"].includes(key)) return;
        const spec = settings[key];
        if (!spec || typeof spec !== "object") return;
        meta.labels[key] = spec.label || meta.labels[key] || key;
        if (spec.type === "select" && Array.isArray(spec.options) && spec.options.length) {
          meta.selects = meta.selects || {};
          meta.selects[key] = spec.options.map((option) => ({
            value: String(option.value),
            label: option.label || String(option.value),
          }));
          meta.defaults[key] =
            spec.default != null ? String(spec.default) : String(spec.options[0].value);
        } else if (spec.type === "toggle") meta.defaults[key] = Boolean(spec.default);
        else if (spec.default != null && isHexColor(spec.default)) meta.defaults[key] = spec.default;
      });
      if (pack.kind === "message") {
        if (!meta.defaults.primary) meta.defaults.primary = "#d52265";
        if (!meta.defaults.secondary) meta.defaults.secondary = "#fec651";
        customMessageMeta[pack.id] = meta;
      }
      if (pack.kind === "mosaic") {
        delete meta.defaults.motion;
        delete meta.labels.motion;
        delete meta.defaults.revealMs;
        customMosaicMeta[pack.id] = {
          label: meta.label,
          custom: meta.custom,
          bundled: meta.bundled,
          engine: pack.engine || "",
          labels: meta.labels,
          selects: meta.selects || {},
          defaults: themeHasMosaicControls(meta) ? meta.defaults : undefined,
        };
      }
    });
    lastGoodCustomThemes = Array.isArray(packs) ? packs.slice() : [];
    if (lastRawSettings) {
      lastGoodSettings = normalizeSettings(lastRawSettings);
      settingsFresh = true;
      refreshLiveThemeSettings();
    } else {
      settingsFresh = false;
    }
  }

  function refreshLiveThemeSettings() {
    if (typeof document === "undefined") return;
    try {
      document.documentElement.dispatchEvent(
        new CustomEvent("dyn-bg-theme-settings", {
          detail: peekSettings(),
        })
      );
    } catch {
      /* ignore */
    }
  }

  const MOSAIC_THEME_ALIASES = {
    decks: "decks-brand",
    fan: "fan-brand",
    flipwall: "flipwall-brand",
    livewall: "livewall-brand",
    cubes: "cubes-brand",
    polaroid: "polaroid-brand",
    filmstrip: "reels",
    scatter: "polaroid-brand",
    billboard: "spotlight",
  };

  function normalizeMosaicTheme(value) {
    let next = value;
    for (let i = 0; i < 4; i += 1) {
      const builtin = MOSAIC_THEME_META[next];
      if (!(builtin && builtin.hidden && MOSAIC_THEME_ALIASES[next])) break;
      next = MOSAIC_THEME_ALIASES[next];
    }
    return isKnownMosaicTheme(next) ? next : "off";
  }

  function normalizeMessageTheme(value) {
    return isKnownMessageTheme(value) ? value : "off";
  }

  function isKnownLeaderboardTheme(value) {
    return value === "off" || Boolean(leaderboardThemeMetaAll()[value]);
  }

  function normalizeLeaderboardTheme(value) {
    return isKnownLeaderboardTheme(value) ? value : "off";
  }

  function isHexColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || ""));
  }

  function clampMosaicScale(value, fallback) {
    const n = Number(value);
    const base = isFinite(n) ? n : fallback == null ? 1 : Number(fallback);
    const seed = isFinite(base) ? base : 1;
    return Math.max(MOSAIC_SCALE_MIN, Math.min(MOSAIC_SCALE_MAX, seed));
  }

  function themeMetaForSettings(themeId) {
    return messageThemeMetaAll()[themeId] || mosaicThemeMetaAll()[themeId] || leaderboardThemeMetaAll()[themeId] || null;
  }

  function normalizeBgMode(value) {
    const next = String(value || "auto").toLowerCase();
    return BG_MODES.includes(next) ? next : "auto";
  }

  function normalizeBgFit(value) {
    const next = String(value || "cover").toLowerCase();
    return BG_FITS.includes(next) ? next : "cover";
  }

  function normalizeWallpaperId(value) {
    const next = String(value || "").trim();
    if (!next) return "";
    if (!/^[a-zA-Z0-9._:-]{1,80}$/.test(next)) return "";
    return next;
  }

  function normalizeOneThemeSettings(themeId, raw) {
    const direct = themeMetaForSettings(themeId);
    const baseId = mosaicSettingsBaseId(themeId);
    const meta =
      (direct && direct.defaults && direct) ||
      (baseId && themeMetaForSettings(baseId)) ||
      direct;
    if (!meta || !meta.defaults) return {};
    const defaults = meta.defaults;
    const src = raw && typeof raw === "object" ? raw : {};
    const next = {};
    if (defaults.primary) {
      next.primary = isHexColor(src.primary) ? src.primary.toLowerCase() : defaults.primary;
    }
    if (defaults.secondary) {
      next.secondary = isHexColor(src.secondary) ? src.secondary.toLowerCase() : defaults.secondary;
    }
    if (defaults.background) {
      next.background = isHexColor(src.background)
        ? src.background.toLowerCase()
        : defaults.background;
    }
    if (defaults.frame || isHexColor(src.frame)) {
      next.frame = isHexColor(src.frame) ? src.frame.toLowerCase() : defaults.frame || "#ffffff";
    }
    if (defaults.motion) {
      next.motion = MOTION_MODES.includes(src.motion) ? src.motion : defaults.motion;
    }
    if (defaults.photoStyle || src.photoStyle != null || typeof src.colorPhotos === "boolean") {
      let photoStyle = src.photoStyle;
      if (photoStyle == null && typeof src.colorPhotos === "boolean") {
        photoStyle = src.colorPhotos ? "color" : "bw";
      }
      next.photoStyle = normalizePhotoStyle(
        photoStyle,
        defaults.photoStyle || next.photoStyle || "bw"
      );
    }
    if (meta.selects) {
      Object.keys(meta.selects).forEach((key) => {
        if (next[key] != null) return;
        const options = meta.selects[key].map((option) => String(option.value));
        const fallback = defaults[key];
        let raw = src[key];
        if (key === "photoStyle" && raw == null && typeof src.colorPhotos === "boolean") {
          raw = src.colorPhotos ? "color" : "bw";
        }
        if (options.includes(String(raw))) next[key] = String(raw);
        else if (options.includes(String(fallback))) next[key] = String(fallback);
        else if (options.length) next[key] = options[0];
      });
    }
    if (defaults.scale != null) {
      next.scale = clampMosaicScale(src.scale, defaults.scale);
    }
    if (Object.prototype.hasOwnProperty.call(defaults, "wallpaper")) {
      next.wallpaper = normalizeWallpaperId(src.wallpaper);
    }
    Object.keys(defaults).forEach((key) => {
      if (
        [
          "primary",
          "secondary",
          "background",
          "motion",
          "photoStyle",
          "scale",
          "wallpaper",
          "revealMs",
        ].includes(key)
      ) {
        return;
      }
      if (typeof defaults[key] === "boolean") {
        if (typeof src[key] === "boolean") next[key] = src[key];
        else if (src[key] === true || src[key] === "true" || src[key] === 1 || src[key] === "1") {
          next[key] = true;
        } else if (src[key] === false || src[key] === "false" || src[key] === 0 || src[key] === "0") {
          next[key] = false;
        } else next[key] = defaults[key];
      } else if (isHexColor(defaults[key])) {
        next[key] = isHexColor(src[key]) ? src[key].toLowerCase() : defaults[key];
      }
    });
    return next;
  }

  function normalizeMessageThemeSettings(value) {
    const src = value && typeof value === "object" ? value : {};
    const next = {};
    const seen = new Set();
    Object.keys(messageThemeMetaAll()).forEach((id) => {
      seen.add(id);
      next[id] = normalizeOneThemeSettings(id, src[id]);
    });
    Object.keys(src).forEach((id) => {
      if (seen.has(id)) return;
      next[id] = src[id];
    });
    return next;
  }

  function normalizeLeaderboardThemeSettings(value) {
    const src = value && typeof value === "object" ? value : {};
    const next = {};
    const seen = new Set();
    Object.keys(leaderboardThemeMetaAll()).forEach((id) => {
      seen.add(id);
      next[id] = normalizeOneThemeSettings(id, src[id]);
    });
    Object.keys(src).forEach((id) => {
      if (seen.has(id)) return;
      next[id] = src[id];
    });
    return next;
  }

  function normalizeMosaicThemeSettings(value) {
    const src = value && typeof value === "object" ? value : {};
    const next = {};
    const seen = new Set();
    Object.keys(mosaicThemeMetaAll()).forEach((id) => {
      const storeId = mosaicSettingsBaseId(id) || id;
      if (!themeHasMosaicControls(mosaicThemeMetaAll()[storeId] || mosaicThemeMetaAll()[id])) {
        return;
      }
      if (next[storeId]) return;
      seen.add(storeId);
      next[storeId] = normalizeOneThemeSettings(storeId, src[storeId] || src[id]);
    });
    Object.keys(src).forEach((storeId) => {
      if (seen.has(storeId)) return;
      next[storeId] = src[storeId];
    });
    return next;
  }

  function mergeResolvedThemeSettings(themeId, stored) {
    const normalized = normalizeOneThemeSettings(themeId, stored);
    const meta = themeMetaForSettings(themeId);
    const resolved =
      meta && meta.defaults
        ? normalized
        : stored && typeof stored === "object"
          ? Object.assign({}, stored, normalized)
          : normalized;
    if (stored && typeof stored === "object") {
      if (isHexColor(stored.primary)) resolved.primary = stored.primary.toLowerCase();
      if (isHexColor(stored.secondary)) resolved.secondary = stored.secondary.toLowerCase();
      if (isHexColor(stored.background)) resolved.background = stored.background.toLowerCase();
      if (isHexColor(stored.frame)) resolved.frame = stored.frame.toLowerCase();
      if (stored.motion && MOTION_MODES.includes(stored.motion)) resolved.motion = stored.motion;
      if (stored.photoStyle != null || typeof stored.colorPhotos === "boolean") {
        let photoStyle = stored.photoStyle;
        if (photoStyle == null && typeof stored.colorPhotos === "boolean") {
          photoStyle = stored.colorPhotos ? "color" : "bw";
        }
        resolved.photoStyle = normalizePhotoStyle(photoStyle, resolved.photoStyle || "bw");
      }
    }
    return resolved;
  }

  function resolveMessageThemeSettings(settings, themeId) {
    const id = normalizeMessageTheme(themeId || (settings && settings.messageTheme));
    if (id === "off") return null;
    const meta = messageThemeMetaAll()[id];
    const stored = settings && settings.messageThemeSettings && settings.messageThemeSettings[id];
    const resolved = mergeResolvedThemeSettings(id, stored);
    return {
      ...resolved,
      revealMs:
        (meta && meta.defaults && meta.defaults.revealMs) ||
        Number(resolved.revealMs) ||
        1000,
    };
  }

  function resolveLeaderboardThemeSettings(settings, themeId) {
    const id = normalizeLeaderboardTheme(themeId || (settings && settings.leaderboardTheme));
    if (id === "off") return null;
    const meta = leaderboardThemeMetaAll()[id];
    const stored =
      settings && settings.leaderboardThemeSettings && settings.leaderboardThemeSettings[id];
    const resolved = mergeResolvedThemeSettings(id, stored);
    return {
      ...resolved,
      revealMs:
        (meta && meta.defaults && meta.defaults.revealMs) ||
        Number(resolved.revealMs) ||
        300,
      hideMs:
        (meta && meta.defaults && meta.defaults.hideMs) ||
        Number(resolved.hideMs) ||
        200,
    };
  }

  function resolveMosaicThemeSettings(settings, themeId) {
    const id = normalizeMosaicTheme(themeId || (settings && settings.mosaicTheme));
    if (id === "off") return { scale: 1 };
    const storeId = mosaicSettingsBaseId(id) || id;
    const stored =
      settings &&
      settings.mosaicThemeSettings &&
      (settings.mosaicThemeSettings[id] || settings.mosaicThemeSettings[storeId]);
    const resolved = mergeResolvedThemeSettings(storeId, stored);
    if (resolved.scale == null) resolved.scale = 1;
    return resolved;
  }

  function formatAspectPart(n) {
    if (!isFinite(n)) return "";
    if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
    return String(Number(n.toFixed(4)));
  }

  function clampAspectParts(aw, ah) {
    let w = aw;
    let h = ah;
    if (w / h > MAX_ASPECT_RATIO) h = w / MAX_ASPECT_RATIO;
    if (h / w > MAX_ASPECT_RATIO) w = h / MAX_ASPECT_RATIO;
    return { aw: w, ah: h };
  }

  function isNamedAspect(mode) {
    return mode === "vixi" || mode === "auto";
  }

  function parseStageAspect(value) {
    if (value == null) return null;
    const raw = String(value).trim();
    if (!raw || /^vixi$/i.test(raw)) return { mode: "vixi" };
    if (/^auto$/i.test(raw)) return { mode: "auto" };
    const match = raw.match(/^(\d+(?:\.\d+)?)\s*[:x×/]\s*(\d+(?:\.\d+)?)$/i);
    if (!match) return null;
    const aw0 = Number(match[1]);
    const ah0 = Number(match[2]);
    if (!isFinite(aw0) || !isFinite(ah0) || aw0 <= 0 || ah0 <= 0) return null;
    if (aw0 > 9999 || ah0 > 9999) return null;
    const { aw, ah } = clampAspectParts(aw0, ah0);
    return {
      mode: formatAspectPart(aw) + ":" + formatAspectPart(ah),
      aw,
      ah,
      portrait: ah > aw,
    };
  }

  function normalizeStageAspect(value) {
    const parsed = parseStageAspect(value);
    return parsed ? parsed.mode : "vixi";
  }

  function presetForAspect(value) {
    const parsed = parseStageAspect(value);
    if (!parsed || isNamedAspect(parsed.mode)) return parsed ? parsed.mode : "vixi";
    for (let i = 0; i < STAGE_ASPECT_PRESETS.length; i += 1) {
      const preset = STAGE_ASPECT_PRESETS[i];
      if (isNamedAspect(preset.value)) continue;
      const other = parseStageAspect(preset.value);
      if (other && other.aw && Math.abs(parsed.aw * other.ah - other.aw * parsed.ah) < 1e-4) {
        return preset.value;
      }
    }
    return "custom";
  }

  function stageAspectToken(sizeOrMode) {
    if (sizeOrMode && typeof sizeOrMode === "object") {
      const mode = sizeOrMode.mode || "vixi";
      if (isNamedAspect(mode)) return mode;
      return String(mode).replace(/:/g, "-");
    }
    const mode = normalizeStageAspect(sizeOrMode);
    if (isNamedAspect(mode)) return mode;
    return mode.replace(/:/g, "-");
  }

  function designSizeFromRatio(aw, ah) {
    if (aw >= ah) {
      return {
        dw: DESIGN_LONG_EDGE,
        dh: Math.max(1, Math.round(DESIGN_LONG_EDGE * (ah / aw))),
      };
    }
    return {
      dw: Math.max(1, Math.round(DESIGN_LONG_EDGE * (aw / ah))),
      dh: DESIGN_LONG_EDGE,
    };
  }

  function viewportSize() {
    try {
      const vv = window.visualViewport;
      if (vv && vv.width > 0 && vv.height > 0) {
        return { vw: vv.width, vh: vv.height };
      }
    } catch {
      /* ignore */
    }
    return {
      vw: window.innerWidth || 1920,
      vh: window.innerHeight || 1080,
    };
  }

  // Largest aw:ah rectangle that fits in vw x vh (touches a pair of edges).
  function containFit(vw, vh, aw, ah) {
    if (!(vw > 0 && vh > 0 && aw > 0 && ah > 0)) {
      return { w: vw, h: vh, left: 0, top: 0 };
    }
    if (vw * ah > vh * aw) {
      const h = vh;
      const w = (h * aw) / ah;
      return { w, h, left: (vw - w) / 2, top: 0 };
    }
    const w = vw;
    const h = (w * ah) / aw;
    return { w, h, left: 0, top: (vh - h) / 2 };
  }

  function currentStageAspect() {
    return normalizeStageAspect(lastGoodSettings && lastGoodSettings.stageAspect);
  }

  let lastVixiRatio = { aw: 16, ah: 9 };
  let lastVixiDesign = { dw: DESIGN_LONG_EDGE, dh: Math.max(1, Math.round(DESIGN_LONG_EDGE * (9 / 16))) };

  function cssAspectParts(raw) {
    if (!raw || raw === "auto" || raw === "none") return null;
    const match = String(raw).match(/([\d.]+)\s*\/\s*([\d.]+)/);
    if (!match) return null;
    const aw = Number(match[1]);
    const ah = Number(match[2]);
    if (!(aw > 0 && ah > 0)) return null;
    return clampAspectParts(aw, ah);
  }

  function namedRatioFromValue(value) {
    const parsed = parseStageAspect(value);
    if (!parsed || isNamedAspect(parsed.mode) || !parsed.aw) return null;
    return { aw: parsed.aw, ah: parsed.ah };
  }

  function snapVixiRatio(parts) {
    if (!parts || !(parts.aw > 0 && parts.ah > 0)) return lastVixiRatio;
    const ratio = parts.aw / parts.ah;
    for (let i = 0; i < STAGE_ASPECT_PRESETS.length; i += 1) {
      const preset = STAGE_ASPECT_PRESETS[i];
      if (isNamedAspect(preset.value)) continue;
      const other = parseStageAspect(preset.value);
      if (!other || !other.aw) continue;
      if (Math.abs(ratio - other.aw / other.ah) < 0.02) {
        return { aw: other.aw, ah: other.ah };
      }
    }
    return parts;
  }

  function wrapperLooksNative() {
    const html = document.documentElement;
    return html.dataset.stageAspect !== "auto" || !html.classList.contains("dyn-stage-forced");
  }

  function parseTransformScale(el) {
    if (!el) return 1;
    try {
      const tr = getComputedStyle(el).transform;
      if (!tr || tr === "none") return 1;
      const m = tr.match(/matrix3d\(([^)]+)\)/) || tr.match(/matrix\(([^)]+)\)/);
      if (!m) return 1;
      const parts = m[1].split(",").map((n) => Number.parseFloat(n.trim()));
      if (parts.length === 6) {
        const sx = Math.hypot(parts[0], parts[1]);
        const sy = Math.hypot(parts[2], parts[3]);
        const s = (sx + sy) / 2;
        return s > 0 ? s : 1;
      }
      if (parts.length === 16) {
        const sx = Math.hypot(parts[0], parts[1]);
        const sy = Math.hypot(parts[4], parts[5]);
        const s = (sx + sy) / 2;
        return s > 0 ? s : 1;
      }
    } catch {
      /* ignore */
    }
    return 1;
  }

  function inlineDesignSize(el) {
    if (!el || !el.style) return null;
    const w = Number.parseFloat(el.style.width);
    const h = Number.parseFloat(el.style.height);
    if (w >= 8 && h >= 8) return clampAspectParts(w, h);
    return null;
  }

  function measureVixiAspectFromEl(el) {
    if (!el) return null;
    const inline = inlineDesignSize(el);
    if (inline) return snapVixiRatio(inline);
    const scale = parseTransformScale(el);
    const r = el.getBoundingClientRect();
    if (r.width >= 8 && r.height >= 8 && scale > 0 && scale < 0.995) {
      return snapVixiRatio(clampAspectParts(r.width / scale, r.height / scale));
    }
    return null;
  }

  /** Reliable Vixi canvas ratio — not the fullscreen window box. */
  function measureWrapperAspect(el) {
    if (!el) return null;
    const fromEl = measureVixiAspectFromEl(el);
    if (fromEl) return fromEl;
    const scene =
      el.querySelector &&
      el.querySelector(".v2-scene-transition, .v2-container, .v2-scene");
    if (scene) {
      const fromScene = measureVixiAspectFromEl(scene);
      if (fromScene) return fromScene;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return null;
    const page = document.querySelector(".output-page");
    const pr = page ? page.getBoundingClientRect() : null;
    const { vw, vh } = viewportSize();
    const pageW = pr && pr.width >= 8 ? pr.width : vw;
    const pageH = pr && pr.height >= 8 ? pr.height : vh;
    const letterboxed = r.width < pageW - 10 || r.height < pageH - 10;
    if (letterboxed) return snapVixiRatio(clampAspectParts(r.width, r.height));
    return null;
  }

  function rememberVixiDesign(dw, dh) {
    const w = Number(dw);
    const h = Number(dh);
    if (!(w >= 8 && h >= 8)) return lastVixiDesign;
    lastVixiDesign = { dw: Math.round(w), dh: Math.round(h) };
    lastVixiRatio = snapVixiRatio(clampAspectParts(w, h));
    return lastVixiDesign;
  }

  /** Vixi's configured output pixel size — not just aspect ratio. */
  function readVixiDesignSize(box) {
    const nodes = [
      document.querySelector(".v2-app-wrapper"),
      box && box.nodeType === 1 ? box : null,
      findWrapper(),
    ].filter(Boolean);
    const seen = new Set();
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      if (seen.has(el)) continue;
      seen.add(el);
      const inline = inlineDesignSize(el);
      if (inline) return rememberVixiDesign(inline.aw, inline.ah);
      const scale = parseTransformScale(el);
      const r = el.getBoundingClientRect();
      if (r.width >= 8 && r.height >= 8 && scale > 0 && scale < 0.995) {
        return rememberVixiDesign(r.width / scale, r.height / scale);
      }
    }
    const ratio = readVixiAspect(box);
    const size = designSizeFromRatio(ratio.aw, ratio.ah);
    return rememberVixiDesign(size.dw, size.dh);
  }

  /** Match Vixi caps at native resolution; other modes may upscale to fill. */
  function stageContainScale(vw, vh, dw, dh, mode) {
    if (!(vw > 0 && vh > 0 && dw > 0 && dh > 0)) return 1;
    let s = Math.min(vw / dw, vh / dh);
    if (normalizeStageAspect(mode) === "vixi") s = Math.min(1, s);
    return s;
  }

  /** Cache Vixi's design aspect while the v2 wrapper is on screen (before stream/CTA cuts). */
  function touchVixiAspectCache() {
    readVixiDesignSize(findWrapper());
    return lastVixiRatio;
  }

  function captureNativeVixiAspect() {
    return touchVixiAspectCache();
  }

  function readVixiAspect(box) {
    try {
      const params = new URLSearchParams(location.search || "");
      const keys = ["aspect", "ratio", "aspectRatio", "outputAspect", "canvas"];
      for (let i = 0; i < keys.length; i += 1) {
        const fromUrl = namedRatioFromValue(params.get(keys[i]));
        if (fromUrl) {
          lastVixiRatio = snapVixiRatio(fromUrl);
          return lastVixiRatio;
        }
      }
    } catch {
      /* ignore */
    }

    const nodes = [
      box && box.nodeType === 1 ? box : null,
      document.querySelector(".v2-app-wrapper"),
      document.querySelector(".v2-scene-transition"),
      findWrapper(),
    ].filter(Boolean);
    const seen = new Set();
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      if (seen.has(el)) continue;
      seen.add(el);
      const ds = el.dataset || {};
      const fromData = namedRatioFromValue(
        ds.ratio || ds.aspectRatio || ds.outputAspect
      );
      if (fromData) {
        lastVixiRatio = snapVixiRatio(fromData);
        return lastVixiRatio;
      }
      try {
        const fromCss = cssAspectParts(getComputedStyle(el).aspectRatio);
        if (fromCss) {
          lastVixiRatio = snapVixiRatio(fromCss);
          return lastVixiRatio;
        }
      } catch {
        /* ignore */
      }
      const measured = measureWrapperAspect(el);
      if (measured) {
        lastVixiRatio = measured;
        return lastVixiRatio;
      }
    }

    return lastVixiRatio;
  }

  function resolveCanvasAspect(aspect) {
    return aspect != null ? aspect : currentStageAspect();
  }

  function resolveStageSize(box, aspect) {
    const mode = normalizeStageAspect(aspect != null ? aspect : currentStageAspect());
    const vp = viewportSize();
    const rw = (box && (box.clientWidth || box.width)) || vp.vw;
    const rh = (box && (box.clientHeight || box.height)) || vp.vh;
    if (mode === "auto") {
      const size = designSizeFromRatio(rw, rh);
      return {
        dw: size.dw,
        dh: size.dh,
        portrait: rh > rw,
        mode,
      };
    }
    if (mode === "vixi") {
      const design = readVixiDesignSize(box);
      return {
        dw: design.dw,
        dh: design.dh,
        portrait: design.dh > design.dw,
        mode,
      };
    }
    const parsed = parseStageAspect(mode);
    const size = designSizeFromRatio(parsed.aw, parsed.ah);
    return {
      dw: size.dw,
      dh: size.dh,
      portrait: parsed.portrait,
      mode,
    };
  }

  function setStageAspect(value) {
    lastGoodSettings = normalizeSettings({
      ...(lastGoodSettings || DEFAULTS),
      stageAspect: value,
    });
    return lastGoodSettings.stageAspect;
  }

  const QR_SELECTORS = [
    ".v2-qr-tile",
    ".qr-tile",
    ".v2-qr",
    ".event-qr",
    ".output-qr",
    // Current Vixi Suite output markup (message + mosaic).
    ".qr-code-wrapper",
    ".qr-code-wrapper-inner",
    ".qr-code-img",
    "img.qr-code-img",
    "[class*='qr-tile' i]",
    "[class*='qr_tile' i]",
    "[class*='qr-code' i]",
    "img[alt='qr' i]",
    "img[alt*='qr' i]",
    "canvas[class*='qr' i]",
  ].join(", ");
  const MESSAGE_CHROME_SCOPE =
    ".message-layer, .capture-content-layer, .message-content, .v2-message";
  const MOSAIC_CHROME_SCOPE =
    ".mosaic-layout, .mosaic-tile-slot, .mosaic-asset, .v2-mosaic-swap-tile, .v2-mosaic-face, .v2-asset-tile";
  const lastBrand = {
    message: { qr: null, logo: null },
    mosaic: { qr: null, logo: null },
  };
  /** Per-kind raster cache. Message and mosaic QR/logo never share. */
  const lastBrandAsset = {
    message: { qr: null, logo: null },
    mosaic: { qr: null, logo: null },
  };
  const LOGO_SELECTORS = [
    ".v2-logo-tile",
    ".v2-logo",
    ".event-logo",
    ".output-logo",
    ".brand-logo",
    ".logo-tile",
    ".v2-app-wrapper__logo",
    "img[alt='logo' i]",
    "img[alt*='logo' i]",
  ].join(", ");

  let canvasResizeBound = false;
  const canvasGuards = new WeakMap();
  const CANVAS_STYLE_PROPS = [
    "position",
    "left",
    "top",
    "right",
    "bottom",
    "inset",
    "width",
    "height",
    "max-width",
    "max-height",
    "transform",
    "margin",
    "flex",
  ];
  const STAGE_CANVAS_STYLE_ID = "dyn-stage-canvas-style";
  const STAGE_CANVAS_CSS =
    "html.dyn-theme-on:not(.dyn-show-bg),html.dyn-theme-on:not(.dyn-show-bg) body,html.dyn-theme-on:not(.dyn-show-bg) .output-page{" +
      "background:#000!important;" +
    "}" +
    "html.dyn-stage-forced,html.dyn-stage-forced body,html.dyn-stage-forced .output-page{" +
      "background:#000!important;overflow:hidden!important;" +
    "}" +
    "html.dyn-stage-forced [data-dyn-canvas-outer]," +
    "html.dyn-stage-forced .dyn-stage-letterbox{" +
      "position:fixed!important;" +
      "inset:0!important;" +
      "left:0!important;right:0!important;top:0!important;bottom:0!important;" +
      "width:min(100vw,calc(100vh * var(--dyn-aw) / var(--dyn-ah)))!important;" +
      "height:min(100vh,calc(100vw * var(--dyn-ah) / var(--dyn-aw)))!important;" +
      "max-width:none!important;max-height:none!important;" +
      "margin:auto!important;" +
      "transform:none!important;" +
      "flex:none!important;" +
      "box-sizing:border-box!important;" +
    "}" +
    "html.dyn-stage-forced[data-stage-aspect=\"auto\"] [data-dyn-canvas-outer]," +
    "html.dyn-stage-forced[data-stage-aspect=\"auto\"] .dyn-stage-letterbox{" +
      "width:100vw!important;" +
      "height:100vh!important;" +
      "left:0!important;top:0!important;right:0!important;bottom:0!important;" +
      "margin:0!important;" +
    "}" +
    "html.dyn-stage-forced [data-dyn-canvas-outer] .v2-app-wrapper," +
    "html.dyn-stage-forced [data-dyn-canvas-outer] .v2-scene-transition," +
    "html.dyn-stage-forced [data-dyn-canvas-outer] .v2-container," +
    "html.dyn-stage-forced [data-dyn-canvas-outer] .output-app," +
    "html.dyn-stage-forced [data-dyn-canvas-fill]{" +
      "position:absolute!important;" +
      "inset:0!important;" +
      "left:0!important;top:0!important;right:0!important;bottom:0!important;" +
      "width:100%!important;height:100%!important;" +
      "max-width:none!important;max-height:none!important;" +
      "transform:none!important;" +
      "margin:0!important;" +
    "}" +
    "html.dyn-stage-forced [data-dyn-canvas-fill] .output-stream-wrapper," +
    "html.dyn-stage-forced [data-dyn-canvas-fill] .output-stream-wrapper video," +
    "html.dyn-stage-forced [data-dyn-canvas-fill] .output-stream-wrapper canvas," +
    "html.dyn-stage-forced [data-dyn-canvas-fill] [class*='output-stream']," +
    "html.dyn-stage-forced [data-dyn-canvas-fill] [class*='output-live']," +
    "html.dyn-stage-forced [data-dyn-canvas-fill] .output-app > :not(#dyn-theme-host) img," +
    "html.dyn-stage-forced [data-dyn-canvas-fill] .output-app > :not(#dyn-theme-host) video," +
    "html.dyn-stage-forced [data-dyn-canvas-fill] .output-app > :not(#dyn-theme-host) canvas," +
    "html.dyn-stage-forced [data-dyn-canvas-fill] .output-app > :not(#dyn-theme-host) iframe{" +
      "position:absolute!important;" +
      "inset:0!important;" +
      "width:100%!important;height:100%!important;" +
      "max-width:none!important;max-height:none!important;" +
      "object-fit:contain!important;" +
      "object-position:center!important;" +
    "}";

  function ensureStageCanvasStyle() {
    let style = document.getElementById(STAGE_CANVAS_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STAGE_CANVAS_STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    if (style.textContent !== STAGE_CANVAS_CSS) style.textContent = STAGE_CANVAS_CSS;
  }

  function clearCanvasInline(el) {
    if (!el || !el.style) return;
    CANVAS_STYLE_PROPS.forEach((prop) => el.style.removeProperty(prop));
  }

  function bindCanvasGuard(el) {
    if (!el || canvasGuards.has(el) || typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(() => {
      const dirty = CANVAS_STYLE_PROPS.some((prop) => el.style.getPropertyValue(prop));
      if (dirty) clearCanvasInline(el);
    });
    mo.observe(el, { attributes: true, attributeFilter: ["style"] });
    canvasGuards.set(el, mo);
  }

  function unbindCanvasGuard(el) {
    const mo = canvasGuards.get(el);
    if (!mo) return;
    mo.disconnect();
    canvasGuards.delete(el);
  }

  function findOuterCanvas() {
    // Vixi v2 scales the live scene internally — never letterbox the wrapper.
    if (document.querySelector(".v2-app-wrapper")) return null;
    const page = document.querySelector(".output-wrapper");
    if (page) return page;
    return findWrapper();
  }

  function markCanvasOuter(outer) {
    if (!outer) return;
    // Vixi v2 scales and positions the live scene via inline styles on this node.
    // Never attach canvas guards or strip styles here — it breaks polling/CTA layouts.
    if (outer.classList && outer.classList.contains("v2-app-wrapper")) return;
    clearCanvasInline(outer);
    outer.setAttribute("data-dyn-canvas-outer", "1");
    outer.removeAttribute("data-dyn-canvas-fill");
    bindCanvasGuard(outer);
    outer.querySelectorAll(".output-app").forEach((el) => {
      if (el === outer) return;
      clearCanvasInline(el);
      el.setAttribute("data-dyn-canvas-fill", "1");
      bindCanvasGuard(el);
    });
  }

  function resetOutputCanvas() {
    document
      .querySelectorAll("[data-dyn-canvas-outer], [data-dyn-canvas-fill], [data-dyn-canvas]")
      .forEach((el) => {
        unbindCanvasGuard(el);
        el.removeAttribute("data-dyn-canvas-outer");
        el.removeAttribute("data-dyn-canvas-fill");
        el.removeAttribute("data-dyn-canvas");
        if (!el.classList || !el.classList.contains("v2-app-wrapper")) {
          clearCanvasInline(el);
        }
      });
    document.querySelectorAll(".dyn-stage-letterbox").forEach((el) => {
      el.classList.remove("dyn-stage-letterbox");
      clearCanvasInline(el);
    });
    const html = document.documentElement;
    html.classList.remove("dyn-stage-forced");
    html.style.removeProperty("--dyn-aw");
    html.style.removeProperty("--dyn-ah");
    delete html.dataset.stageAspect;
  }

  function bindCanvasResize() {
    if (canvasResizeBound) return;
    canvasResizeBound = true;
    let raf = 0;
    const refit = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const handoff = root.BGThemeHandoff;
        if (
          pageLooksLikePassthrough() ||
          (handoff && typeof handoff.liveKind === "function" && handoff.liveKind() === "native")
        ) {
          resetOutputCanvas();
          return;
        }
        applyOutputCanvas(currentStageAspect());
      });
    };
    window.addEventListener("resize", refit);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", refit);
  }

  function applyForcedStageCanvas(aspect) {
    ensureStageCanvasStyle();
    const mode = normalizeStageAspect(resolveCanvasAspect(aspect));
    const html = document.documentElement;
    bindCanvasResize();
    touchVixiAspectCache();

    if (mode === "vixi") {
      const detected = readVixiAspect(findOuterCanvas());
      html.classList.add("dyn-stage-forced");
      html.dataset.stageAspect = "vixi";
      html.style.setProperty("--dyn-aw", String(detected.aw));
      html.style.setProperty("--dyn-ah", String(detected.ah));
      const outer = findOuterCanvas();
      if (outer) markCanvasOuter(outer);
      const { vw, vh } = viewportSize();
      const fit = containFit(vw, vh, detected.aw, detected.ah);
      return resolveStageSize({ clientWidth: fit.w, clientHeight: fit.h }, mode);
    }

    if (mode === "auto") {
      html.classList.add("dyn-stage-forced");
      html.dataset.stageAspect = "auto";
      html.style.removeProperty("--dyn-aw");
      html.style.removeProperty("--dyn-ah");
      const outer = findOuterCanvas();
      if (outer) markCanvasOuter(outer);
      return resolveStageSize(outer || findWrapper(), mode);
    }

    const parsed = parseStageAspect(mode);
    html.classList.add("dyn-stage-forced");
    html.dataset.stageAspect = stageAspectToken(mode);
    html.style.setProperty("--dyn-aw", String(parsed.aw));
    html.style.setProperty("--dyn-ah", String(parsed.ah));

    const outer = findOuterCanvas();
    if (outer) markCanvasOuter(outer);
    const { vw, vh } = viewportSize();
    const fit = containFit(vw, vh, parsed.aw, parsed.ah);
    return resolveStageSize({ clientWidth: fit.w, clientHeight: fit.h }, mode);
  }

  function applyOutputCanvas(aspect) {
    const mode = resolveCanvasAspect(aspect);
    if (document.querySelector(".v2-app-wrapper") || pageLooksLikePassthrough()) {
      touchVixiAspectCache();
      resetOutputCanvas();
      return resolveStageSize(findWrapper(), mode);
    }
    if (needsPassthroughStageCanvas()) {
      return applyForcedStageCanvas(mode);
    }
    const handoff = root.BGThemeHandoff;
    if (handoff && typeof handoff.liveKind === "function" && handoff.liveKind() === "native") {
      resetOutputCanvas();
      return resolveStageSize(findWrapper(), mode);
    }
    return applyForcedStageCanvas(mode);
  }

  function applyStageFrame(root, aspect) {
    applyOutputCanvas(aspect);
    const size = resolveStageSize(
      (root && root.parentElement) || findWrapper(),
      aspect != null ? aspect : currentStageAspect()
    );
    if (!root) return size;
    root.classList.toggle("dyn-portrait", size.portrait);
    root.dataset.aspect = stageAspectToken(size);
    const host = root.parentElement;
    if (!host) return size;
    const vw = host.clientWidth || 1;
    const vh = host.clientHeight || 1;
    if (size.mode === "auto") {
      root.classList.remove("dyn-stage-letterbox");
      root.style.position = "absolute";
      root.style.inset = "0";
      root.style.left = "";
      root.style.top = "";
      root.style.right = "";
      root.style.bottom = "";
      root.style.width = "";
      root.style.height = "";
      root.style.maxWidth = "";
      root.style.maxHeight = "";
      return size;
    }
    root.classList.add("dyn-stage-letterbox");
    const s = stageContainScale(vw, vh, size.dw, size.dh, size.mode);
    const w = size.dw * s;
    const h = size.dh * s;
    root.style.position = "absolute";
    root.style.inset = "auto";
    root.style.left = (vw - w) / 2 + "px";
    root.style.top = (vh - h) / 2 + "px";
    root.style.right = "auto";
    root.style.bottom = "auto";
    root.style.width = w + "px";
    root.style.height = h + "px";
    root.style.maxWidth = size.mode === "vixi" ? size.dw + "px" : "";
    root.style.maxHeight = size.mode === "vixi" ? size.dh + "px" : "";
    return size;
  }

  function eachBackgroundMedia(fn) {
    backgroundLayers().forEach((el) => {
      const media = [];
      if (el.matches && el.matches("video, audio")) media.push(el);
      if (el.querySelectorAll) media.push(...el.querySelectorAll("video, audio"));
      media.forEach((node) => {
        try {
          fn(node);
        } catch {
          /* cross-origin or already gone */
        }
      });
    });
  }

  function restoreBackgroundLayers() {
    backgroundLayers().forEach((el) => {
      if (el && el.style) el.style.removeProperty("display");
    });
  }

  function hideBackgroundLayers(root) {
    backgroundLayers(root).forEach((el) => {
      if (el && el.style) el.style.setProperty("display", "none", "important");
    });
  }

  /**
   * True when Background should run through #dyn-bg-media / #dyn-bg-embed
   * (upload, link, or Vixi event art) instead of leaving Vixi’s live DOM layers visible.
   */
  function usesCustomBackground(settings, pageUrl) {
    const href = pageUrl || (typeof location !== "undefined" ? location.href : "");
    const state = normalizeSettings(settings);
    if (
      normalizeLeaderboardTheme(state.leaderboardTheme) !== "off" &&
      pageLooksLikeLeaderboardOverlay()
    ) {
      return false;
    }
    // Vixi source always uses the inject path (URL copied from the event asset).
    if (state.bgMode === "vixi") return true;
    if (resolveBackgroundMediaId(settings, href)) return true;
    const src = typeof resolveIframeSrc === "function" ? resolveIframeSrc(settings, href) : "";
    return Boolean(src);
  }

  /** True when Show background is active on the output/preview document. */
  function isStageBackgroundActive(_themeRoot) {
    try {
      if (document.body && document.body.classList.contains("has-preview-bg")) return true;
      const html = document.documentElement;
      if (html.classList.contains("dyn-show-bg")) return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  /** Hide theme backdrop layers so #dyn-bg-media can cover the stage on output. */
  function syncThemeBackdrops(themeRoot) {
    if (!themeRoot || !themeRoot.querySelectorAll) return;
    const on = isStageBackgroundActive(themeRoot);
    themeRoot.querySelectorAll(".wall, .grain, .sr-texture").forEach((el) => {
      if (on) {
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
        el.style.setProperty("pointer-events", "none", "important");
      } else {
        el.style.removeProperty("visibility");
        el.style.removeProperty("opacity");
        el.style.removeProperty("pointer-events");
      }
    });
    themeRoot.querySelectorAll(".dyn-stage, .dyn-fit-stage, .frame, .scene").forEach((el) => {
      if (on) {
        el.style.setProperty("background", "transparent", "important");
        el.style.setProperty("background-image", "none", "important");
      } else {
        el.style.removeProperty("background");
        el.style.removeProperty("background-image");
      }
    });
    if (on && (themeRoot.id === "dyn-message-theme" || themeRoot.id === "dyn-mosaic-theme")) {
      themeRoot.style.setProperty("background", "transparent", "important");
      themeRoot.style.setProperty("background-image", "none", "important");
    } else if (!on && (themeRoot.id === "dyn-message-theme" || themeRoot.id === "dyn-mosaic-theme")) {
      themeRoot.style.removeProperty("background");
      themeRoot.style.removeProperty("background-image");
    }
    try {
      const api = typeof globalThis !== "undefined" && globalThis.BGTileField;
      if (api && typeof api.syncStageBackground === "function") api.syncStageBackground(themeRoot);
    } catch {
      /* ignore */
    }
  }

  let lastVixiBgAsset = null;

  function clearPassthroughState() {
    lastVixiBgAsset = null;
  }

  function removeLeakedBrandChrome() {
    try {
      document
        .querySelectorAll(
          ".output-app .dyn-brand-chrome, .output-wrapper > .dyn-brand-chrome, " +
            ".output-app > .dyn-brand-clone, .output-wrapper > .dyn-brand-clone"
        )
        .forEach((el) => {
          if (
            el.closest &&
            el.closest("#dyn-message-theme, #dyn-mosaic-theme, #dyn-leaderboard-theme, #dyn-theme-host")
          ) {
            return;
          }
          el.remove();
        });
    } catch {
      /* ignore */
    }
  }

  function cssBackgroundImageUrl(el) {
    if (!el || !el.ownerDocument) return "";
    try {
      const bg = getComputedStyle(el).backgroundImage || "";
      const match = bg.match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
      return match ? String(match[2] || "").trim() : "";
    } catch {
      return "";
    }
  }

  function mediaElementSrc(el) {
    if (!el) return "";
    if (el.tagName === "SOURCE") {
      return String(el.src || el.getAttribute("src") || "").trim();
    }
    if (el.tagName === "PICTURE") {
      const img = el.querySelector("img");
      return mediaElementSrc(img);
    }
    const direct = String(el.currentSrc || el.src || "").trim();
    if (direct) return direct;
    if (el.tagName === "VIDEO") {
      const source = el.querySelector("source[src]");
      if (source) return String(source.src || source.getAttribute("src") || "").trim();
    }
    return cssBackgroundImageUrl(el);
  }

  function mediaElementArea(el) {
    if (!el) return 0;
    try {
      const r = el.getBoundingClientRect();
      const box = Math.max(0, r.width) * Math.max(0, r.height);
      if (box >= 4) return box;
    } catch {
      /* ignore */
    }
    const w = Math.max(Number(el.naturalWidth) || 0, Number(el.videoWidth) || 0, el.clientWidth || 0);
    const h = Math.max(Number(el.naturalHeight) || 0, Number(el.videoHeight) || 0, el.clientHeight || 0);
    return w * h;
  }

  /**
   * Read the event’s current background asset the same way a pasted URL would
   * work: pick the largest non-logo/QR media inside Vixi’s bg layers.
   * Returns { src, kind: "image"|"video" } or null.
   * Caches the last good asset so CTA / theme swaps do not briefly lose the URL.
   */
  function resolveVixiBackgroundAsset(root) {
    const layers = backgroundLayers(root);
    let best = null;
    let bestArea = -1;

    const consider = (el, srcHint) => {
      if (!el || !el.tagName) return;
      if (el.closest && el.closest("#dyn-bg-media, #dyn-bg-embed, #dyn-theme-host")) return;
      if (isBrandNode(el)) return;
      if (el.closest && (el.closest(QR_SELECTORS) || el.closest(LOGO_SELECTORS))) return;
      const src = String(srcHint || mediaElementSrc(el) || "").trim();
      if (!src || src === "about:blank") return;
      if (/^(data:text\/html|javascript:)/i.test(src)) return;
      const tag = el.tagName;
      const kind =
        tag === "VIDEO" || /\.(mp4|webm|mov|m4v|ogv|ogg)(\?|$)/i.test(src) ? "video" : "image";
      const area = mediaElementArea(el);
      if (area < bestArea) return;
      bestArea = area;
      best = { src, kind };
    };

    layers.forEach((layer) => {
      if (!layer) return;
      const nodes = [
        layer,
        ...layer.querySelectorAll("img, video, picture, source, canvas"),
      ];
      nodes.forEach((el) => {
        if (el === layer) {
          const cssUrl = cssBackgroundImageUrl(layer);
          if (cssUrl) consider(layer, cssUrl);
          return;
        }
        consider(el);
      });
    });

    if (best && best.src) lastVixiBgAsset = best;
    if (pageLooksLikeLeaderboardOverlay(root || undefined)) return best;
    return best || lastVixiBgAsset;
  }

  function silenceReplacedMedia() {
    eachBackgroundMedia((node) => {
      node.pause();
      node.muted = true;
    });
  }

  function resumeBackgroundMedia() {
    eachBackgroundMedia((node) => {
      if (node.paused && typeof node.play === "function") {
        const play = node.play();
        if (play && typeof play.catch === "function") play.catch(() => {});
      }
    });
  }

  function readChromeFlag(raw, nextKey, oldKey) {
    if (!raw) return false;
    if (raw[nextKey] != null) return Boolean(raw[nextKey]);
    return Boolean(raw[oldKey]);
  }

  function chromeForKind(settings, kind) {
    const s = settings || lastGoodSettings || DEFAULTS;
    if (kind === "message") {
      return {
        showBackground: Boolean(s.messageShowBackground),
        showQr: Boolean(s.messageShowQr),
        showLogo: Boolean(s.messageShowLogo),
      };
    }
    if (kind === "mosaic") {
      return {
        showBackground: Boolean(s.mosaicShowBackground),
        showQr: Boolean(s.mosaicShowQr),
        showLogo: Boolean(s.mosaicShowLogo),
      };
    }
    if (kind === "leaderboard") {
      // Leaderboard replaces leader rows only — always keep Vixi's event background.
      return { showBackground: true, showQr: false, showLogo: false };
    }
    return { showBackground: false, showQr: false, showLogo: false };
  }

  function themeKindFromRoot(themeRoot) {
    if (!themeRoot) return "";
    if (themeRoot.id === "dyn-mosaic-theme") return "mosaic";
    if (themeRoot.id === "dyn-message-theme") return "message";
    if (themeRoot.closest) {
      if (themeRoot.closest("#dyn-mosaic-theme")) return "mosaic";
      if (themeRoot.closest("#dyn-message-theme")) return "message";
    }
    return "";
  }

  function activeThemeKind(settings) {
    const handoff = root.BGThemeHandoff;
    const live = handoff && typeof handoff.liveKind === "function" ? handoff.liveKind() : "";
    const mode = handoff && typeof handoff.currentMode === "function" ? handoff.currentMode() : "";
    if (mode === "leaderboard") return "leaderboard";
    if (live === "message" || live === "mosaic" || live === "leaderboard") return live;
    // CTA / video / URL beats must not inherit the previous mosaic or message mode.
    if (live === "native" || pageLooksLikeNative() || pageLooksLikePassthrough()) return "";
    if (mode === "message" || mode === "mosaic") return mode;
    const s = settings || lastGoodSettings;
    if (s && normalizeMessageTheme(s.messageTheme) !== "off") return "message";
    if (s && normalizeMosaicTheme(s.mosaicTheme) !== "off") return "mosaic";
    if (s && normalizeLeaderboardTheme(s.leaderboardTheme) !== "off") return "leaderboard";
    return "";
  }

  function themeIsOn(settings) {
    const s = settings || lastGoodSettings;
    if (!s || s.enabled === false) return false;
    return normalizeMessageTheme(s.messageTheme) !== "off" || normalizeMosaicTheme(s.mosaicTheme) !== "off" || normalizeLeaderboardTheme(s.leaderboardTheme) !== "off";
  }

  function liveThemeIsOn(settings) {
    const s = settings || lastGoodSettings;
    if (!s || s.enabled === false) return false;
    const kind = activeThemeKind(s);
    if (kind === "message") return normalizeMessageTheme(s.messageTheme) !== "off";
    if (kind === "mosaic") return normalizeMosaicTheme(s.mosaicTheme) !== "off";
    if (kind === "leaderboard") return normalizeLeaderboardTheme(s.leaderboardTheme) !== "off";
    return false;
  }

  function themeReplacesBackground(settings) {
    const s = settings || lastGoodSettings;
    if (!liveThemeIsOn(s)) return false;
    const chrome = chromeForKind(s, activeThemeKind(s));
    return !chrome.showBackground;
  }

  function classifyChrome(el) {
    if (!el || !el.closest) return "shared";
    if (el.closest(MESSAGE_CHROME_SCOPE)) return "message";
    if (el.closest(MOSAIC_CHROME_SCOPE)) return "mosaic";
    // Vixi’s message QR is `.qr-code-wrapper` under `.output-app`, outside
    // `.message-layer`. Mosaic’s QR uses the same classes but lives inside
    // `.mosaic-layout` (caught above). When message chrome is on screen and
    // this node is not under mosaic, treat it as the message QR.
    const qrChrome = el.closest(
      ".qr-code-wrapper, .qr-code-img, .v2-qr-tile, .qr-tile, .v2-qr, .event-qr, .output-qr"
    );
    if (qrChrome || (el.matches && el.matches(QR_SELECTORS))) {
      if (document.querySelector(MESSAGE_CHROME_SCOPE)) return "message";
    }
    let node = el.parentElement;
    while (node && node !== document.documentElement && node !== document.body) {
      if (!node.querySelector) {
        node = node.parentElement;
        continue;
      }
      const hasMosaic = Boolean(node.querySelector(MOSAIC_CHROME_SCOPE));
      const hasMessage = Boolean(node.querySelector(MESSAGE_CHROME_SCOPE));
      if (hasMosaic && !hasMessage) return "mosaic";
      if (hasMessage && !hasMosaic) return "message";
      if (hasMosaic && hasMessage) break;
      node = node.parentElement;
    }
    return "shared";
  }

  function tagChromeKinds() {
    const nodes = [
      ...document.querySelectorAll(QR_SELECTORS),
      ...document.querySelectorAll(LOGO_SELECTORS),
      ...backgroundLayers(),
    ];
    nodes.forEach((el) => {
      if (!el || !el.setAttribute) return;
      el.setAttribute("data-dyn-chrome-kind", classifyChrome(el));
    });
  }

  function pickChromeNode(nodes, kind) {
    const list = [...nodes].filter(Boolean);
    if (!list.length || (kind !== "message" && kind !== "mosaic")) return null;
    const exact = list.find((el) => classifyChrome(el) === kind);
    if (exact) return exact;
    const opposite = kind === "message" ? "mosaic" : "message";
    // If the other kind’s tile is present, never borrow it or an ambiguous shared node.
    if (list.some((el) => classifyChrome(el) === opposite)) return null;
    return list.find((el) => classifyChrome(el) === "shared") || null;
  }

  function isBrandNode(el) {
    if (!el || !el.closest) return false;
    if (el.closest(QR_SELECTORS)) return true;
    if (el.closest(LOGO_SELECTORS)) return true;
    if (el.closest(".mosaic-layout > .asset-view")) return true;
    return false;
  }

  function findBrandNodes(kind) {
    const mode = kind === "message" || kind === "mosaic" ? kind : activeThemeKind();
    if (mode !== "message" && mode !== "mosaic") {
      return { qr: null, logo: null, kind: mode };
    }
    let qrNodes = [...document.querySelectorAll(QR_SELECTORS)].filter((el) => {
      if (!el || (el.closest && el.closest("#dyn-theme-host, .dyn-brand-chrome"))) return false;
      return true;
    });
    // Fallback: square canvases / imgs that look like QR chrome (bottom-ish).
    // Never pick canvases inside our own themes (LED matrices, etc.).
    if (!qrNodes.length) {
      qrNodes = [...document.querySelectorAll("canvas, img")].filter((el) => {
        if (
          !el ||
          (el.closest &&
            el.closest(
              "#dyn-theme-host, #dyn-message-theme, #dyn-mosaic-theme, .dyn-brand-chrome, #dyn-bg-media"
            ))
        ) {
          return false;
        }
        if (el.closest && el.closest(LOGO_SELECTORS)) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 24 || r.height < 24 || r.width > 420 || r.height > 420) return false;
        const ratio = r.width / Math.max(r.height, 1);
        if (ratio < 0.75 || ratio > 1.35) return false;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return cx > window.innerWidth * 0.45 && cy > window.innerHeight * 0.35;
      });
    }
    const qr = pickChromeNode(qrNodes, mode);
    let logos = [...document.querySelectorAll(LOGO_SELECTORS)].filter((el) => {
      if (!el || (el.closest && el.closest("#dyn-theme-host, .dyn-brand-chrome"))) return false;
      if (qr && (el === qr || (el.closest && el.closest(QR_SELECTORS)))) return false;
      return true;
    });
    let logo = pickChromeNode(logos, mode);
    if (!logo && mode === "mosaic") {
      const views = document.querySelectorAll(".mosaic-layout > .asset-view");
      views.forEach((el) => {
        if (logo || (qr && (el === qr || el.contains(qr) || (qr.contains && qr.contains(el))))) return;
        // Mosaic logo fallback stays mosaic-scoped.
        if (classifyChrome(el) === "message") return;
        logo = el;
      });
    }
    if (qr) lastBrand[mode].qr = qr;
    if (logo) lastBrand[mode].logo = logo;
    return {
      qr: qr || lastBrand[mode].qr || null,
      logo: logo || lastBrand[mode].logo || null,
      kind: mode,
    };
  }

  function rememberBrandAsset(mode, type, source) {
    if ((mode !== "message" && mode !== "mosaic") || (type !== "qr" && type !== "logo")) return;
    const painted = brandMediaFromSource(source);
    if (!painted) return;
    let src = "";
    if (painted.tagName === "IMG" || painted.tagName === "VIDEO") {
      src = String(painted.currentSrc || painted.src || "");
    } else if (painted.tagName === "CANVAS") {
      const img = canvasToImage(painted);
      src = img ? String(img.src || "") : "";
    }
    if (src && src.length > 16) lastBrandAsset[mode][type] = { src, kind: "image" };
  }

  function assetElementFromCache(mode, type) {
    if ((mode !== "message" && mode !== "mosaic") || (type !== "qr" && type !== "logo")) return null;
    const asset = lastBrandAsset[mode][type];
    if (!asset || !asset.src) return null;
    const img = document.createElement("img");
    img.className = "dyn-brand-clone";
    img.alt = "";
    img.src = asset.src;
    return img;
  }

  function fillBrandSlot(slot, source) {
    if (!slot) return;
    slot.replaceChildren();
    if (!source) {
      slot.hidden = true;
      return;
    }
    slot.hidden = false;

    // Prefer a real paintablesource. Canvas cloneNode is empty (no pixels);
    // CSS background-image on the tile is lost when we rewrite style.cssText.
    const painted = brandMediaFromSource(source);
    if (painted) {
      painted.classList.add("dyn-brand-clone");
      painted.alt = painted.alt || "";
      painted.style.cssText =
        "display:block!important;width:100%!important;height:auto!important;" +
        "max-width:100%;max-height:100%;aspect-ratio:1/1;object-fit:contain;" +
        "visibility:visible!important;opacity:1!important;pointer-events:none;";
      slot.appendChild(painted);
      return;
    }

    const clone = source.cloneNode(true);
    clone.removeAttribute("id");
    const stripBrandClass = (el) => {
      if (!el || !el.classList) return;
      [
        "v2-qr-tile",
        "qr-tile",
        "v2-qr",
        "event-qr",
        "output-qr",
        "qr-code-wrapper",
        "qr-code-wrapper-inner",
        "qr-code-img",
        "v2-logo",
        "v2-logo-tile",
        "event-logo",
        "logo-tile",
        "output-logo",
        "brand-logo",
        "v2-app-wrapper__logo",
      ].forEach((c) => el.classList.remove(c));
      el.classList.add("dyn-brand-clone");
    };
    stripBrandClass(clone);
    clone.querySelectorAll("*").forEach(stripBrandClass);
    clone.style.cssText =
      "position:relative;inset:auto;left:auto;top:auto;right:auto;bottom:auto;" +
      "width:100%;height:auto;max-width:100%;max-height:100%;aspect-ratio:1/1;" +
      "visibility:visible!important;opacity:1!important;display:block!important;" +
      "transform:none;pointer-events:none;";
    const media = clone.matches("img,canvas,svg,video")
      ? [clone]
      : [...clone.querySelectorAll("img,canvas,svg,video")];
    media.forEach((el) => {
      if (el.tagName === "CANVAS") {
        const srcCanvas =
          source.tagName === "CANVAS"
            ? source
            : source.querySelector
              ? source.querySelector("canvas")
              : null;
        const img = canvasToImage(srcCanvas) || canvasToImage(el);
        if (img) {
          el.replaceWith(img);
          return;
        }
      }
      el.style.width = "100%";
      el.style.height = "auto";
      el.style.aspectRatio = "1 / 1";
      el.style.objectFit = "contain";
      el.style.setProperty("visibility", "visible", "important");
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("display", "block", "important");
    });
    // If the source tile used a CSS background QR, stamp it onto the clone.
    const bgUrl = cssBackgroundImageUrl(source);
    if (bgUrl && !slot.querySelector("img,canvas,svg")) {
      const img = document.createElement("img");
      img.className = "dyn-brand-clone";
      img.alt = "";
      img.src = bgUrl;
      img.style.cssText =
        "display:block!important;width:100%!important;height:auto!important;" +
        "aspect-ratio:1/1;object-fit:contain;visibility:visible!important;opacity:1!important;";
      slot.appendChild(img);
      return;
    }
    slot.appendChild(clone);
  }

  function canvasToImage(canvas) {
    if (!canvas || canvas.tagName !== "CANVAS") return null;
    try {
      const w = canvas.width || 0;
      const h = canvas.height || 0;
      if (w < 2 || h < 2) return null;
      const url = canvas.toDataURL("image/png");
      if (!url || url.length < 32) return null;
      const img = document.createElement("img");
      img.className = "dyn-brand-clone";
      img.alt = "";
      img.src = url;
      return img;
    } catch {
      // Tainted canvas — fall back to drawImage onto a fresh canvas.
      try {
        const copy = document.createElement("canvas");
        copy.width = canvas.width;
        copy.height = canvas.height;
        copy.className = "dyn-brand-clone";
        const ctx = copy.getContext("2d");
        if (ctx) ctx.drawImage(canvas, 0, 0);
        return copy;
      } catch {
        return null;
      }
    }
  }

  function brandMediaFromSource(source) {
    if (!source) return null;
    if (source.tagName === "IMG" || source.tagName === "SVG" || source.tagName === "VIDEO") {
      const clone = source.cloneNode(true);
      clone.removeAttribute("id");
      return clone;
    }
    if (source.tagName === "CANVAS") {
      return canvasToImage(source);
    }
    const canvas = source.querySelector && source.querySelector("canvas");
    if (canvas) {
      const img = canvasToImage(canvas);
      if (img) return img;
    }
    const img = source.querySelector && source.querySelector("img,svg,video");
    if (img) {
      const clone = img.cloneNode(true);
      clone.removeAttribute("id");
      return clone;
    }
    const bgUrl = cssBackgroundImageUrl(source);
    if (bgUrl) {
      const out = document.createElement("img");
      out.alt = "";
      out.src = bgUrl;
      return out;
    }
    return null;
  }

  function ensureBrandChrome(themeRoot, kind) {
    if (!themeRoot) return;
    const settings = lastGoodSettings || DEFAULTS;
    const mode = kind === "message" || kind === "mosaic" ? kind : themeKindFromRoot(themeRoot);
    const chrome = chromeForKind(settings, mode);
    const wantQr = Boolean(chrome.showQr);
    const wantLogo = Boolean(chrome.showLogo);
    const wantBg = Boolean(chrome.showBackground);
    themeRoot.classList.toggle("dyn-show-qr", wantQr);
    themeRoot.classList.toggle("dyn-show-logo", wantLogo);
    themeRoot.classList.toggle("dyn-show-bg", wantBg);
    if (mode) themeRoot.dataset.chromeKind = mode;
    syncThemeBackdrops(themeRoot);

    let qrSlot = themeRoot.querySelector("[data-qr]");
    let logoSlot = themeRoot.querySelector("[data-logo]");
    if ((wantQr && !qrSlot) || (wantLogo && !logoSlot)) {
      let chrome = themeRoot.querySelector(":scope > .dyn-brand-chrome");
      if (!chrome) {
        chrome = document.createElement("div");
        chrome.className = "dyn-brand-chrome";
        chrome.innerHTML =
          '<div class="dyn-brand-logo" data-logo></div><div class="dyn-brand-qr" data-qr></div>';
        themeRoot.appendChild(chrome);
      }
      qrSlot = themeRoot.querySelector("[data-qr]");
      logoSlot = themeRoot.querySelector("[data-logo]");
    }

    const nodes = findBrandNodes(mode);
    // Snapshot only into this kind’s cache — never into the other kind.
    if (mode === "message" || mode === "mosaic") {
      if (nodes.qr && nodes.qr.isConnected) rememberBrandAsset(mode, "qr", nodes.qr);
      if (nodes.logo && nodes.logo.isConnected) rememberBrandAsset(mode, "logo", nodes.logo);
    }

    if (qrSlot) {
      const liveQr = nodes.qr && nodes.qr.isConnected ? nodes.qr : null;
      if (wantQr && liveQr) {
        fillBrandSlot(qrSlot, liveQr);
        if (mode === "message" || mode === "mosaic") rememberBrandAsset(mode, "qr", liveQr);
      } else if (wantQr && (mode === "message" || mode === "mosaic") && lastBrandAsset[mode].qr) {
        const cached = assetElementFromCache(mode, "qr");
        if (cached) {
          qrSlot.hidden = false;
          qrSlot.replaceChildren(cached);
          cached.style.cssText =
            "display:block!important;width:100%!important;height:auto!important;" +
            "max-width:100%;max-height:100%;aspect-ratio:1/1;object-fit:contain;" +
            "visibility:visible!important;opacity:1!important;pointer-events:none;";
        } else {
          qrSlot.replaceChildren();
          qrSlot.hidden = true;
        }
      } else {
        qrSlot.replaceChildren();
        qrSlot.hidden = true;
      }
    }
    if (logoSlot) {
      const liveLogo = nodes.logo && nodes.logo.isConnected ? nodes.logo : null;
      if (wantLogo && liveLogo) {
        fillBrandSlot(logoSlot, liveLogo);
        if (mode === "message" || mode === "mosaic") rememberBrandAsset(mode, "logo", liveLogo);
      } else if (wantLogo && (mode === "message" || mode === "mosaic") && lastBrandAsset[mode].logo) {
        const cached = assetElementFromCache(mode, "logo");
        if (cached) {
          logoSlot.hidden = false;
          logoSlot.replaceChildren(cached);
          cached.style.cssText =
            "display:block!important;width:100%!important;height:auto!important;" +
            "max-width:100%;max-height:100%;object-fit:contain;" +
            "visibility:visible!important;opacity:1!important;pointer-events:none;";
        } else {
          logoSlot.replaceChildren();
          logoSlot.hidden = true;
        }
      } else {
        logoSlot.replaceChildren();
        logoSlot.hidden = true;
      }
    }
  }

  function normalizeSettings(value) {
    const next = value || {};
    const rules = Array.isArray(next.rules) ? next.rules : [];
    return {
      enabled: next.enabled !== false,
      anyOutputIframeHtml: String(next.anyOutputIframeHtml || ""),
      bgMode: normalizeBgMode(next.bgMode),
      bgMediaId: normalizeWallpaperId(next.bgMediaId),
      bgFit: normalizeBgFit(next.bgFit),
      mosaicTheme: normalizeMosaicTheme(next.mosaicTheme),
      messageTheme: normalizeMessageTheme(next.messageTheme),
      leaderboardTheme: normalizeLeaderboardTheme(next.leaderboardTheme),
      messageThemeSettings: normalizeMessageThemeSettings(next.messageThemeSettings),
      mosaicThemeSettings: normalizeMosaicThemeSettings(next.mosaicThemeSettings),
      leaderboardThemeSettings: normalizeLeaderboardThemeSettings(next.leaderboardThemeSettings),
      stageAspect: normalizeStageAspect(next.stageAspect),
      messageShowBackground: readChromeFlag(next, "messageShowBackground", "showBackground"),
      messageShowQr: readChromeFlag(next, "messageShowQr", "showQr"),
      messageShowLogo: readChromeFlag(next, "messageShowLogo", "showLogo"),
      mosaicShowBackground: readChromeFlag(next, "mosaicShowBackground", "showBackground"),
      mosaicShowQr: readChromeFlag(next, "mosaicShowQr", "showQr"),
      mosaicShowLogo: readChromeFlag(next, "mosaicShowLogo", "showLogo"),
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
    if (state.bgMode === "media" || state.bgMode === "vixi") return "";

    for (const rule of state.rules) {
      if (!rule.outputUrl || !rule.iframeHtml) continue;
      if (!urlsMatch(pageUrl, rule.outputUrl)) continue;
      const src = parseIframeSrc(rule.iframeHtml);
      if (src) return src;
    }

    if (state.bgMode === "auto" && state.bgMediaId) return "";

    if (state.bgMode === "link" || state.bgMode === "auto") {
      if (isOutputPage(pageUrl)) {
        return parseIframeSrc(state.anyOutputIframeHtml);
      }
    }

    return "";
  }

  function resolveBackgroundMediaId(settings, pageUrl) {
    const state = normalizeSettings(settings);
    if (!state.enabled) return "";
    if (state.bgMode === "link" || state.bgMode === "vixi") return "";
    // Per-rule iframe still wins over global media when a rule matches.
    for (const rule of state.rules) {
      if (!rule.outputUrl || !rule.iframeHtml) continue;
      if (!urlsMatch(pageUrl, rule.outputUrl)) continue;
      return "";
    }
    if (!isOutputPage(pageUrl)) return "";
    if (state.bgMode === "media") return state.bgMediaId || "";
    if (state.bgMode === "auto") {
      if (state.bgMediaId) return state.bgMediaId;
    }
    return "";
  }

  function findWrapper() {
    return document.querySelector(".v2-app-wrapper") || document.querySelector(".output-wrapper");
  }

  function findOverlayHost() {
    // Standalone mosaic letterboxes .output-wrapper inside a taller
    // .output-page. Attaching to the page (or a missing wrapper) puts the
    // theme in the wrong box and destroying the host on hydrate drops it.
    const wrapper = findWrapper();
    if (!wrapper) return null;

    const hostId = (root.BGThemeHandoff && root.BGThemeHandoff.HOST_ID) || "dyn-theme-host";
    let host = document.getElementById(hostId);
    const app =
      wrapper.querySelector(":scope > .output-app") || wrapper.querySelector(".output-app");
    if (!host) {
      host = document.createElement("div");
      host.id = hostId;
      host.setAttribute("aria-hidden", "true");
    }
    if (host.parentElement !== wrapper) {
      if (app && app.parentElement === wrapper) wrapper.insertBefore(host, app);
      else wrapper.appendChild(host);
    } else if (
      app &&
      app.parentElement === wrapper &&
      host.compareDocumentPosition(app) & Node.DOCUMENT_POSITION_PRECEDING
    ) {
      wrapper.insertBefore(host, app);
    }
    if (host.clientWidth < 8 || host.clientHeight < 8) {
      try {
        const st = wrapper && getComputedStyle(wrapper);
        if (st && st.position === "static") wrapper.style.position = "relative";
        if (host.clientWidth < 8) host.style.width = "100%";
        if (host.clientHeight < 8) {
          const h = (wrapper && wrapper.clientHeight) || window.innerHeight || 0;
          if (h >= 8) host.style.minHeight = h + "px";
        }
      } catch {
        /* ignore */
      }
    }
    return host;
  }

  function pageLooksLikeMosaic() {
    try {
      if (/(?:^|[?&])standalone=mosaic(?:&|$)/i.test(location.search || "")) return true;
    } catch {
      /* ignore */
    }
    return Boolean(document.querySelector(MOSAIC_CHROME_SCOPE + ", img.mosaic-image"));
  }

  function elementLooksVisible(el) {
    if (!el) return false;
    try {
      if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;
      const st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden") return false;
      if (Number.parseFloat(st.opacity || "1") < 0.05) return false;
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    } catch {
      return false;
    }
  }

  function themeOverlayLive(kind) {
    const id =
      kind === "message" ? "dyn-message-theme" : kind === "mosaic" ? "dyn-mosaic-theme" : "";
    if (!id) return false;
    const el = document.getElementById(id);
    if (!el || el.classList.contains("is-parked") || el.classList.contains("is-leaving")) {
      return false;
    }
    // Only the overlay node. HTML kind/on classes are set *from* liveKind, so
    // treating them as proof the overlay is live created a remount loop.
    return el.classList.contains("on");
  }

  /** Visible message beat — not a leftover empty shell from the previous guest. */
  function pageLooksLikeMessageBeat() {
    if (themeOverlayLive("message")) return true;
    const cap = messageCapture();
    if (!cap.src && !cap.message && !cap.name) return false;
    const layer = document.querySelector(MESSAGE_CHROME_SCOPE);
    if (!layer) return false;
    const html = document.documentElement;
    // Our covers hide the stock layer on purpose — capture + shell is enough.
    if (
      html.classList.contains("dyn-kind-message") ||
      html.classList.contains("dyn-message-on") ||
      html.classList.contains("dyn-cover-message") ||
      html.classList.contains("dyn-hold") ||
      html.classList.contains("dyn-handoff")
    ) {
      return true;
    }
    return elementLooksVisible(layer);
  }

  /** Visible mosaic beat — tiles on screen, not a hidden leftover layout. */
  function pageLooksLikeMosaicBeat() {
    if (themeOverlayLive("mosaic")) return true;
    const n = mosaicContentCount();
    if (n > 0) {
      const layer = document.querySelector(MOSAIC_CHROME_SCOPE);
      const html = document.documentElement;
      // Cover/hold/handoff classes are applied on boot to every output page.
      // They are not proof this is a mosaic beat — leftover tiles + early
      // covers used to theme mosaic over CTA and polling on refresh.
      if (
        html.classList.contains("dyn-kind-mosaic") ||
        html.classList.contains("dyn-mosaic-on")
      ) {
        return true;
      }
      return !layer || elementLooksVisible(layer);
    }
    if (!pageLooksLikeMosaic()) return false;
    return elementLooksVisible(document.querySelector(MOSAIC_CHROME_SCOPE));
  }

  /** V2 LEADERS overlay only — explicit LEADERS header; not result-bar polling. */
  function pageLooksLikeLeaderboardOverlay(wrapper) {
    const root = wrapper || document.querySelector(".v2-app-wrapper");
    if (!root) return false;
    if (pageLooksLikeResultBarPolling(root)) return false;
    // DOM presence only — we hide the native header while themed; visibility would loop.
    const leaderHeader = [...root.querySelectorAll(".v2-text-tile")].find((el) => {
      return tileText(el).toUpperCase() === "LEADERS";
    });
    return Boolean(leaderHeader);
  }

  /** Themed LEADERS overlay beat — message/mosaic should yield without re-covering every tick. */
  function leaderboardBeatActive(settings) {
    const s = settings || lastGoodSettings;
    if (!s || s.enabled === false) return false;
    if (normalizeLeaderboardTheme(s.leaderboardTheme) === "off") return false;
    return pageLooksLikeLeaderboardOverlay();
  }

  function clearLeaderboardNativeMarks() {
    document.querySelectorAll(".v2-block[data-dyn-lb-native], .v2-block[data-dyn-lb-header]").forEach((el) => {
      el.removeAttribute("data-dyn-lb-native");
      el.removeAttribute("data-dyn-lb-header");
    });
  }

  function elementLooksLaidOut(el) {
    if (!el) return false;
    try {
      if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;
      const st = getComputedStyle(el);
      if (st.display === "none") return false;
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    } catch {
      return false;
    }
  }

  function pageLooksLikeResultBarPolling(wrapper) {
    try {
      const root = wrapper || document.querySelector(".v2-app-wrapper");
      if (!root) return false;
      // Display + size only. Covers set visibility:hidden on a live polling
      // page; requiring visibility made leftover LEADERS win and kept the
      // leaderboard overlay over the result bars.
      return [...root.querySelectorAll(".v2-result-bar-tile")].some(elementLooksLaidOut);
    } catch {
      /* ignore */
    }
    return false;
  }

  function pageLooksLikePolling() {
    try {
      const wrapper = document.querySelector(".v2-app-wrapper");
      if (!wrapper) return false;
      if (pageLooksLikeLeaderboardOverlay(wrapper)) return true;
      return pageLooksLikeResultBarPolling(wrapper);
    } catch {
      /* ignore */
    }
    return false;
  }

  function tileText(el) {
    if (!el) return "";
    const inner = el.querySelector(".v2-auto-scale-text__content");
    return String((inner && inner.textContent) || el.textContent || "").trim();
  }

  function looksLikeScore(tx) {
    const t = String(tx || "").trim().replace(/[\s,]/g, "");
    if (!t) return false;
    return /^[+\-]?\d+(\.\d+)?k?$/i.test(t);
  }

  function nameAndScoreFromTiles(textTiles) {
    const texts = [];
    (textTiles || []).forEach((tile) => {
      const tx = tileText(tile);
      if (tx) texts.push(tx);
    });
    if (!texts.length) return { name: "", score: "" };
    if (texts.length === 1) {
      return looksLikeScore(texts[0]) ? { name: "", score: texts[0] } : { name: texts[0], score: "" };
    }
    const a = texts[0];
    const b = texts[1];
    if (looksLikeScore(a) && !looksLikeScore(b)) return { name: b, score: a };
    if (looksLikeScore(b) && !looksLikeScore(a)) return { name: a, score: b };
    return { name: a, score: b };
  }

  function parseCssUrl(raw) {
    const m = String(raw || "").match(/url\(\s*(['"]?)(.*?)\1\s*\)/i);
    return m ? String(m[2] || "").trim() : "";
  }

  function parseInlineCss(raw, prop) {
    const m = String(raw || "").match(new RegExp("(?:^|;)\\s*" + prop + "\\s*:\\s*([^;]+)", "i"));
    return m ? m[1].trim() : "";
  }

  /** Vixi avatars use a CSS sprite on .v2-avatar-tile__sprite; the img is display:none. */
  function captureLeaderboardAvatar(block) {
    const tile = block && block.querySelector && block.querySelector(".v2-avatar-tile");
    if (!tile) return null;
    const sprite = tile.querySelector(".v2-avatar-tile__sprite");
    if (sprite) {
      const inline = sprite.getAttribute("style") || sprite.style.cssText || "";
      const src =
        parseCssUrl(parseInlineCss(inline, "background-image")) ||
        parseCssUrl(sprite.style && sprite.style.backgroundImage) ||
        parseCssUrl(getComputedStyle(sprite).backgroundImage);
      if (src) {
        let bgSize = parseInlineCss(inline, "background-size");
        let bgPosition = parseInlineCss(inline, "background-position");
        const bgRepeat = parseInlineCss(inline, "background-repeat") || "no-repeat";
        if (!bgSize || !/%/.test(bgSize)) bgSize = "500% 500%";
        if (!bgPosition || !/%/.test(bgPosition)) {
          bgPosition = parseInlineCss(inline, "background-position") || "50% 50%";
          if (!/%/.test(bgPosition)) bgPosition = "50% 50%";
        }
        bgPosition = bgPosition.split(/\s*\/\s*/)[0].trim();
        return { src, sprite: true, bgSize, bgPosition, bgRepeat };
      }
    }
    const img = tile.querySelector("img");
    if (!img) return null;
    const src = String(img.currentSrc || img.src || "").trim();
    if (!src) return null;
    return { src, sprite: false };
  }

  function leaderboardCapture() {
    const wrapper = document.querySelector(".v2-app-wrapper");
    if (!wrapper || !pageLooksLikeLeaderboardOverlay(wrapper)) {
      return { header: "", leaders: [] };
    }
    const marked = new Set();
    let header = "LEADERS";
    const leaders = [];
    const blocks = [...wrapper.querySelectorAll(".v2-block")].filter((block) => {
      if (block.querySelector(".v2-avatar-tile img")) return true;
      return [...block.querySelectorAll(".v2-text-tile")].some(
        (t) => tileText(t).toUpperCase() === "LEADERS"
      );
    });
    blocks.forEach((block) => {
      const tiles = [...block.querySelectorAll(".v2-text-tile")];
      const avatarImg = block.querySelector(".v2-avatar-tile img");
      const avatar = captureLeaderboardAvatar(block);
      const headerHit = tiles.find((t) => tileText(t).toUpperCase() === "LEADERS");
      if (headerHit && !avatarImg) {
        header = tileText(headerHit) || "LEADERS";
        if (!block.hasAttribute("data-dyn-lb-header")) block.setAttribute("data-dyn-lb-header", "1");
        if (block.hasAttribute("data-dyn-lb-native")) block.removeAttribute("data-dyn-lb-native");
        marked.add(block);
        return;
      }
      if (!avatarImg && !avatar) return;
      const rankTile = tiles.find((t) => /^[0-9]+$/.test(tileText(t)));
      const rank = rankTile ? tileText(rankTile) : String(leaders.length + 1);
      const textTiles = tiles.filter((t) => {
        const tx = tileText(t);
        return tx && tx.toUpperCase() !== "LEADERS" && tx !== rank;
      });
      const named = nameAndScoreFromTiles(textTiles);
      const name = named.name;
      const score = named.score;
      if (!block.hasAttribute("data-dyn-lb-native")) block.setAttribute("data-dyn-lb-native", "1");
      if (block.hasAttribute("data-dyn-lb-header")) block.removeAttribute("data-dyn-lb-header");
      marked.add(block);
      leaders.push({
        rank,
        name,
        score,
        avatar,
        avatarSrc: avatar && avatar.src ? avatar.src : "",
      });
    });
    wrapper.querySelectorAll(".v2-block[data-dyn-lb-native], .v2-block[data-dyn-lb-header]").forEach((el) => {
      if (!marked.has(el)) {
        el.removeAttribute("data-dyn-lb-native");
        el.removeAttribute("data-dyn-lb-header");
      }
    });
    leaders.sort((a, b) => {
      const ar = parseInt(a.rank, 10);
      const br = parseInt(b.rank, 10);
      if (isFinite(ar) && isFinite(br) && ar !== br) return ar - br;
      return 0;
    });
    return { header, leaders };
  }

  function isExtensionOwnedOutputNode(el) {
    if (!el || el.nodeType !== 1) return false;
    const id = String(el.id || "");
    if (id === "dyn-theme-host" || id === "dyn-bg-media" || id === "dyn-bg-embed") return true;
    if (/^dyn-/.test(id)) return true;
    return false;
  }

  /** Beats we may replace with a custom theme (message, mosaic, themed LEADERS). */
  function pageLooksLikeRecognizedThemeTarget(settings) {
    const s = settings || lastGoodSettings;
    if (!s || s.enabled === false) return false;
    if (normalizeMessageTheme(s.messageTheme) !== "off" && pageLooksLikeMessageBeat()) return true;
    if (normalizeMosaicTheme(s.mosaicTheme) !== "off" && pageLooksLikeMosaicBeat()) return true;
    if (leaderboardBeatActive(s)) return true;
    return false;
  }

  /** Live native media — not an empty wrapper or leftover mosaic/message shell. */
  function outputHasVisibleNativeShell() {
    try {
      const app = document.querySelector(".output-app");
      if (!app) return false;
      const host = document.getElementById("dyn-theme-host");
      const media = [...app.querySelectorAll("video, img, canvas, iframe")].filter((el) => {
        if (host && host.contains(el)) return false;
        if (el.closest && el.closest("#dyn-message-theme, #dyn-mosaic-theme, #dyn-leaderboard-theme")) {
          return false;
        }
        if (el.closest && (el.closest(MOSAIC_CHROME_SCOPE) || el.closest(MESSAGE_CHROME_SCOPE))) {
          return false;
        }
        return nativeMediaLooksLive(el, true) || directNativeAssetLooksLive(el);
      });
      return media.length > 0;
    } catch {
      /* ignore */
    }
    return false;
  }

  /** Unrecognized Vixi output: leave native UI alone (CTA/stream/polling/future types). */
  function pageLooksLikeUnknownPassthrough(settings) {
    if (!isOutputPage(location.href)) return false;
    if (pageLooksLikeRecognizedThemeTarget(settings)) return false;
    return outputHasVisibleNativeShell();
  }

  // Polling, CTA v2, streams, and other playlist items we do not theme.
  function pageLooksLikeStreamBeat() {
    try {
      const app = document.querySelector(".output-app");
      if (!app) return false;
      const nodes = [
        ...app.querySelectorAll(
          ".output-stream-wrapper, [class*='output-stream'], [class*='output-live']"
        ),
      ];
      return nodes.some((el) => isHardNativeEl(el) || nativeMediaLooksLive(el));
    } catch {
      /* ignore */
    }
    return false;
  }

  /** Passthrough beats use Vixi's own layout — never force a letterbox canvas. */
  function needsPassthroughStageCanvas() {
    return false;
  }

  function passthroughLeavesVixiAlone(settings) {
    return pageLooksLikePassthrough(settings);
  }

  function pageLooksLikePassthrough(settings) {
    const s = settings || lastGoodSettings;
    if (pageLooksLikeResultBarPolling()) return true;
    if (leaderboardBeatActive(s)) return false;
    if (pageLooksLikeLeaderboardOverlay() && !leaderboardBeatActive(s)) return true;
    if (pageLooksLikeMessageBeat() || pageLooksLikeMosaicBeat()) return false;
    if (pageLooksLikeHardNative()) return true;
    try {
      const app = document.querySelector(".output-app");
      if (app) {
        const nativeSel =
          ".output-stream-wrapper, [class*='output-stream'], [class*='output-live']," +
          "img.fullscreen-asset, video.fullscreen-asset, img[alt='CTA Image' i]," +
          "[src*='/playlist/cta/'], :scope > iframe, video[id^='subscribe-']";
        const nodes = [...app.querySelectorAll(nativeSel)];
        if (nodes.some(isHardNativeEl) || nodes.some((el) => nativeMediaLooksLive(el))) return true;
        const direct = app.querySelector(
          ":scope > img, :scope > video, :scope > iframe, :scope > canvas"
        );
        if (direct && nativeMediaLooksLive(direct)) return true;
        if (
          [...app.children].some((child) => {
            if (!child || child.id === "dyn-theme-host") return false;
            return nativeMediaLooksLive(child);
          })
        ) {
          return true;
        }
      }
      const wrapper = document.querySelector(".v2-app-wrapper");
      if (wrapper) {
        if ([...wrapper.querySelectorAll(".v2-result-bar-tile")].some(elementLooksVisible)) {
          return true;
        }
        const passthroughSel =
          ".output-stream-wrapper, [class*='output-stream'], " +
          "[class*='output-live'], img.fullscreen-asset, video.fullscreen-asset, iframe, " +
          "video[id^='subscribe-']";
        if ([...wrapper.querySelectorAll(passthroughSel)].some(elementLooksVisible)) return true;
      }
    } catch {
      /* ignore */
    }
    if (pageLooksLikeUnknownPassthrough(s)) return true;
    return false;
  }

  function nativeMediaLooksLive(el, inner) {
    if (!el || el.id === "dyn-cta-wait") return false;
    if (el.closest && (isBrandNode(el) || el.closest(QR_SELECTORS))) return false;
    if (el.classList && el.classList.contains("mosaic-image")) return false;
    if (el.closest && (el.closest(MOSAIC_CHROME_SCOPE) || el.closest(MESSAGE_CHROME_SCOPE))) {
      return false;
    }
    if (el.matches && el.matches("img.fullscreen-asset, video.fullscreen-asset")) {
      const src = String(el.currentSrc || el.src || "");
      const alt = String(el.getAttribute("alt") || "");
      const isCta = /\/playlist\/cta\//i.test(src) || /cta/i.test(alt);
      const app = document.querySelector(".output-app");
      const direct = Boolean(app && el.parentElement === app);
      if (!isCta && !direct) return false;
    }
    // Empty leftover stream / .asset-view wrappers stay in the DOM on mosaic
    // and message beats. Only the wrapper's actual media is a native scene.
    // Treating a sized empty .asset-view as live stood covers down on refresh
    // and flashed Vixi's message card / background.
    if (!inner && el.querySelector && !/^(IMG|VIDEO|CANVAS|IFRAME)$/i.test(el.tagName || "")) {
      const cls = typeof el.className === "string" ? el.className : el.getAttribute("class") || "";
      if (/output-stream|output-live/i.test(cls)) {
        const media = el.querySelector("video, img, canvas, iframe");
        return Boolean(media && nativeMediaLooksLive(media, true));
      }
      // Event-background photos live in .asset-view. Only a real CTA / stream
      // inside the wrapper is native — any img here stood the theme down.
      if (el.classList && el.classList.contains("asset-view")) {
        const media = el.querySelector(
          "iframe, img.fullscreen-asset, video.fullscreen-asset, img[alt='CTA Image' i], [src*='/playlist/cta/']"
        );
        return Boolean(media && nativeMediaLooksLive(media, true));
      }
    }
    try {
      if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;
      const st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden") return false;
      if (Number.parseFloat(st.opacity || "1") < 0.05) return false;
      const r = el.getBoundingClientRect();
      return r.width > 40 && r.height > 40;
    } catch {
      return false;
    }
  }

  function isHardNativeEl(el) {
    if (!el || el.id === "dyn-cta-wait") return false;
    if (el.closest && (isBrandNode(el) || el.closest(QR_SELECTORS))) return false;
    if (el.closest && (el.closest(MOSAIC_CHROME_SCOPE) || el.closest(MESSAGE_CHROME_SCOPE))) {
      return false;
    }
    // Our covers set visibility:hidden on the CTA. Size is enough — if we
    // require computed visibility, a covered CTA never wins over the theme.
    if (el.matches && el.matches("img[alt='CTA Image' i], [src*='/playlist/cta/'], img.fullscreen-asset")) {
      return directNativeAssetLooksLive(el);
    }
    if (el.matches && el.matches("video[id^='subscribe-'], video.fullscreen-asset")) {
      return directNativeAssetLooksLive(el);
    }
    if (el.tagName === "IFRAME") return directNativeAssetLooksLive(el);
    const src = String(el.currentSrc || el.src || "");
    const alt = String(el.getAttribute("alt") || "");
    if (/\/playlist\/cta\//i.test(src) || /cta/i.test(alt)) return directNativeAssetLooksLive(el);
    const cls = typeof el.className === "string" ? el.className : el.getAttribute("class") || "";
    if (/output-stream|output-live/i.test(cls)) {
      const media = el.querySelector("video, img, canvas, iframe");
      return Boolean(media && nativeMediaLooksLive(media, true));
    }
    return false;
  }

  function directNativeAssetLooksLive(el) {
    if (!el || (el.closest && (isBrandNode(el) || el.closest(QR_SELECTORS)))) return false;
    if (el.closest && (el.closest(MOSAIC_CHROME_SCOPE) || el.closest(MESSAGE_CHROME_SCOPE))) {
      return false;
    }
    try {
      if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;
      const st = getComputedStyle(el);
      if (st.display === "none") return false;
      const r = el.getBoundingClientRect();
      return r.width > 40 && r.height > 40;
    } catch {
      return false;
    }
  }

  // CTA / stream / video sit as direct children of .output-app. Leftover
  // message chrome from the previous guest must not hide that sibling.
  function findDirectNativeAsset() {
    try {
      const app = document.querySelector(".output-app");
      if (!app) return null;
      for (const el of app.children) {
        if (!el || el.id === "dyn-theme-host" || el.id === "dyn-cta-wait") continue;
        if (
          el.matches &&
          el.matches(
            "img.fullscreen-asset, video.fullscreen-asset, iframe, video, img[alt='CTA Image' i]"
          )
        ) {
          if (directNativeAssetLooksLive(el)) return el;
        }
        const cls = typeof el.className === "string" ? el.className : el.getAttribute("class") || "";
        if (/output-stream|output-live/i.test(cls)) {
          const media = el.querySelector("video, img, canvas, iframe");
          if (media && nativeMediaLooksLive(media, true)) return el;
        }
      }
      const views = document.querySelectorAll(".output-wrapper > .asset-view");
      for (const view of views) {
        if (!view || (view.closest && (view.closest(MOSAIC_CHROME_SCOPE) || view.closest(MESSAGE_CHROME_SCOPE)))) {
          continue;
        }
        const el = view.querySelector(
          "iframe, img.fullscreen-asset, video.fullscreen-asset, img[alt='CTA Image' i], [src*='/playlist/cta/']"
        );
        if (el && directNativeAssetLooksLive(el)) return el;
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  function pageLooksLikeHardNative() {
    try {
      const app = document.querySelector(".output-app");
      if (!app) return false;
      return [...app.querySelectorAll(
        ".output-stream-wrapper, [class*='output-stream'], [class*='output-live']," +
          "img.fullscreen-asset, video.fullscreen-asset, img[alt='CTA Image' i]," +
          "[src*='/playlist/cta/'], :scope > iframe, video[id^='subscribe-']"
      )].some(isHardNativeEl);
    } catch {
      return false;
    }
  }

  // Vixi scenes we do not theme: stream/live camera, CTA, video, URL, etc.
  // Only mosaic and message playlist items get an overlay.
  function pageLooksLikeNative() {
    try {
      const app = document.querySelector(".output-app");
      if (!app) return false;
      const nativeSel =
        ".output-stream-wrapper, [class*='output-stream'], [class*='output-live']," +
        "img.fullscreen-asset, video.fullscreen-asset, img[alt='CTA Image' i]," +
        "[src*='/playlist/cta/'], :scope > iframe, video[id^='subscribe-']";
      const mosaicShell = app.querySelector(
        ".mosaic-layout, .v2-mosaic-swap-tile, .v2-asset-tile"
      );
      const messageShell = app.querySelector(
        ".capture-content-layer, .message-layer, .v2-message"
      );
      const nodes = [...app.querySelectorAll(nativeSel)];
      const hardNative = nodes.some(isHardNativeEl);
      const nativeLive = nodes.some((el) => nativeMediaLooksLive(el));
      // A real CTA / stream wins. A fullscreen-asset during a message swap
      // is the next capture, not native — parking the theme there flashes Vixi.
      if (hardNative) return true;
      if (mosaicShell || messageShell) return false;
      if (nativeLive) return true;
      const direct = app.querySelector(
        ":scope > img, :scope > video, :scope > iframe, :scope > canvas"
      );
      if (direct && nativeMediaLooksLive(direct)) return true;
      return [...app.children].some((child) => {
        if (!child || child.id === "dyn-theme-host") return false;
        return nativeMediaLooksLive(child);
      });
    } catch {
      /* ignore */
    }
    return false;
  }

  function pageLooksLikeMessage() {
    try {
      if (/(?:^|[?&])standalone=message(?:&|$)/i.test(location.search || "")) return true;
    } catch {
      /* ignore */
    }
    return Boolean(document.querySelector(MESSAGE_CHROME_SCOPE));
  }

  function hasMosaic() {
    return mosaicContentCount() > 0 || pageLooksLikeMosaic();
  }

  function hasMessage() {
    const cap = messageCapture();
    return Boolean(cap.src || cap.message || cap.name);
  }

  function mosaicImageSrc(img) {
    if (!img) return "";
    const src = String(img.currentSrc || img.src || "").trim();
    if (src && !src.startsWith("data:")) return src;
    const srcset = img.getAttribute ? String(img.getAttribute("srcset") || "") : "";
    if (!srcset) return "";
    const first = srcset.split(",")[0].trim().split(/\s+/)[0];
    return first && !first.startsWith("data:") ? first : "";
  }

  function mosaicContentCount() {
    let count = 0;
    mosaicImages().forEach((img) => {
      const src = mosaicImageSrc(img);
      if (!src) return;
      if (isSkippedMosaicImage(img)) return;
      count += 1;
    });
    if (count === 0) count = mosaicAssetClassUrls().length;
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
    return document.querySelectorAll(
      ".v2-asset-tile img, .v2-mosaic-face img, .v2-mosaic-swap-tile img, .mosaic-asset img, img.mosaic-image, .mosaic-tile-slot img"
    );
  }

  function mosaicAssetClassUrls(face) {
    const prefix = face === "back" ? "back" : "front";
    const urls = [];
    const seen = new Set();
    const re = new RegExp("^" + prefix + "-(https?:\\/\\/\\S+)", "i");
    document.querySelectorAll(".mosaic-asset").forEach((el) => {
      String(el.className || "")
        .split(/\s+/)
        .forEach((token) => {
          const match = re.exec(token);
          if (!match || seen.has(match[1]) || isBrandMosaicSrc(match[1])) return;
          seen.add(match[1]);
          urls.push(match[1]);
        });
    });
    return urls;
  }

  function mosaicAssetBackUrls() {
    return mosaicAssetClassUrls("back");
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

  function isBrandMosaicSrc(src) {
    const s = String(src || "");
    if (!s) return true;
    if (/\/config\//i.test(s)) return true;
    if (/output_logo|layers__logo|default_am_output_logo/i.test(s)) return true;
    try {
      const nodes = [
        ...document.querySelectorAll(LOGO_SELECTORS),
        ...document.querySelectorAll(".mosaic-layout > .asset-view img"),
        ...document.querySelectorAll(QR_SELECTORS + " img"),
      ];
      for (const el of nodes) {
        const url = el && (el.currentSrc || el.src) ? el.currentSrc || el.src : "";
        if (url && url === s) return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  function isSkippedMosaicImage(img) {
    if (!img || !img.closest) return true;
    if (isBrandNode(img)) return true;
    if (img.classList.contains("v2-app-wrapper__bg-image")) return true;
    if (img.closest(".output-wrapper > .asset-view")) return true;
    if (img.closest(".mosaic-layout > .asset-view")) return true;
    if (img.closest(".v2-mosaic-face.back, .dyn-flip-back, [class*='mosaic-face--back']")) {
      return true;
    }
    const asset = img.closest(".mosaic-asset");
    if (asset) {
      const fronts = [];
      const backs = [];
      String(asset.className || "")
        .split(/\s+/)
        .forEach((token) => {
          const front = /^front-(https?:\/\/\S+)/i.exec(token);
          const back = /^back-(https?:\/\/\S+)/i.exec(token);
          if (front) fronts.push(front[1]);
          if (back) backs.push(back[1]);
        });
      const src = mosaicImageSrc(img);
      const onFront = fronts.some((url) => url === src || (src && src.indexOf(url) === 0));
      const onBack = backs.some((url) => url === src || (src && src.indexOf(url) === 0));
      if (onBack && !onFront) return true;
    }
    if (isBrandMosaicSrc(mosaicImageSrc(img) || img.currentSrc || img.src)) return true;
    return false;
  }

  function extensionAlive() {
    try {
      return Boolean(chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  let watchingSettings = false;

  function applyStorageDelta(changes) {
    settingsEpoch += 1;
    const base = Object.assign({}, lastRawSettings || DEFAULTS);
    Object.keys(changes || {}).forEach((key) => {
      if (changes[key] && Object.prototype.hasOwnProperty.call(changes[key], "newValue")) {
        base[key] = changes[key].newValue;
      }
    });
    lastRawSettings = base;
    lastGoodSettings = normalizeSettings(base);
    settingsFresh = true;
  }

  function peekSettings() {
    return lastGoodSettings || normalizeSettings(lastRawSettings || DEFAULTS);
  }

  function watchSettings() {
    if (watchingSettings || !extensionAlive()) return;
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local") applyStorageDelta(changes);
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
    const epoch = settingsEpoch;
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve(lastGoodSettings || normalizeSettings(DEFAULTS));
        return;
      }
      try {
        chrome.storage.local.get(Object.assign({}, DEFAULTS, { customThemes: [] }), (stored) => {
          if (!extensionAlive() || (chrome.runtime.lastError && /invalidated/i.test(chrome.runtime.lastError.message || ""))) {
            resolve(lastGoodSettings || normalizeSettings(DEFAULTS));
            return;
          }
          if (epoch !== settingsEpoch) {
            resolve(lastGoodSettings || normalizeSettings(stored));
            return;
          }
          lastRawSettings = stored;
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

  function loadCustomThemes() {
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve(lastGoodCustomThemes.slice());
        return;
      }
      try {
        chrome.storage.local.get({ customThemes: [] }, (stored) => {
          const packs = Array.isArray(stored.customThemes) ? stored.customThemes : [];
          lastGoodCustomThemes = packs.slice();
          resolve(packs);
        });
      } catch {
        resolve(lastGoodCustomThemes.slice());
      }
    });
  }

  function loadCustomEngines() {
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve({ ...lastGoodCustomEngines });
        return;
      }
      try {
        chrome.storage.local.get({ customEngines: {} }, (stored) => {
          const raw = stored.customEngines && typeof stored.customEngines === "object"
            ? stored.customEngines
            : {};
          lastGoodCustomEngines = raw;
          resolve(raw);
        });
      } catch {
        resolve({ ...lastGoodCustomEngines });
      }
    });
  }

  function saveCustomEngines(engines) {
    const next = engines && typeof engines === "object" ? engines : {};
    lastGoodCustomEngines = next;
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve();
        return;
      }
      try {
        chrome.storage.local.set({ customEngines: next }, () => resolve());
      } catch {
        resolve();
      }
    });
  }

  function loadCustomEngineWarningSeen() {
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve(false);
        return;
      }
      try {
        chrome.storage.local.get({ customEngineWarningSeen: false }, (stored) => {
          resolve(Boolean(stored.customEngineWarningSeen));
        });
      } catch {
        resolve(false);
      }
    });
  }

  function saveCustomEngineWarningSeen() {
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve();
        return;
      }
      try {
        chrome.storage.local.set({ customEngineWarningSeen: true }, () => resolve());
      } catch {
        resolve();
      }
    });
  }

  function saveCustomThemes(packs) {
    const next = Array.isArray(packs) ? packs : [];
    lastGoodCustomThemes = next.slice();
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve();
        return;
      }
      try {
        chrome.storage.local.set({ customThemes: next }, () => resolve());
      } catch {
        resolve();
      }
    });
  }

  let lastGoodCustomFonts = {};

  function loadCustomFonts() {
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve({ ...lastGoodCustomFonts });
        return;
      }
      try {
        chrome.storage.local.get({ customFonts: {} }, (stored) => {
          const raw =
            stored.customFonts && typeof stored.customFonts === "object" ? stored.customFonts : {};
          lastGoodCustomFonts = raw;
          resolve(raw);
        });
      } catch {
        resolve({ ...lastGoodCustomFonts });
      }
    });
  }

  function saveCustomFonts(fonts) {
    const next = fonts && typeof fonts === "object" ? fonts : {};
    lastGoodCustomFonts = next;
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve();
        return;
      }
      try {
        chrome.storage.local.set({ customFonts: next }, () => resolve());
      } catch {
        resolve();
      }
    });
  }

  root.BGExtensionRules = {
    STORAGE_KEYS,
    DEFAULTS,
    MOSAIC_THEMES,
    MOSAIC_THEME_META,
    MESSAGE_THEMES,
    MESSAGE_THEME_META,
    MOTION_MODES,
    PHOTO_STYLE_MODES,
    normalizePhotoStyle,
    MOSAIC_SCALE_MIN,
    MOSAIC_SCALE_MAX,
    STAGE_ASPECTS,
    STAGE_ASPECT_PRESETS,
    parseStageAspect,
    presetForAspect,
    stageAspectToken,
    normalizeStageAspect,
    isNamedAspect,
    currentStageAspect,
    resolveStageSize,
    readVixiAspect,
    readVixiDesignSize,
    stageContainScale,
    containFit,
    applyStageFrame,
    applyOutputCanvas,
    resetOutputCanvas,
    setStageAspect,
    themeIsOn,
    liveThemeIsOn,
    activeThemeKind,
    chromeForKind,
    themeKindFromRoot,
    classifyChrome,
    tagChromeKinds,
    themeReplacesBackground,
    restoreBackgroundLayers,
    hideBackgroundLayers,
    usesCustomBackground,
    isStageBackgroundActive,
    syncThemeBackdrops,
    resolveVixiBackgroundAsset,
    silenceReplacedMedia,
    resumeBackgroundMedia,
    findBrandNodes,
    ensureBrandChrome,
    messageThemeMetaAll,
    mosaicThemeMetaAll,
    applyCustomThemeMeta,
    registerBundledThemeIds,
    refreshLiveThemeSettings,
    applyStorageDelta,
    loadCustomThemes,
    saveCustomThemes,
    loadCustomEngines,
    saveCustomEngines,
    loadCustomFonts,
    saveCustomFonts,
    loadCustomEngineWarningSeen,
    saveCustomEngineWarningSeen,
    envKey,
    extractIds,
    isOutputPage,
    urlsMatch,
    parseIframeSrc,
    normalizeMosaicTheme,
    normalizeMessageTheme,
    normalizeOneThemeSettings,
    normalizeMessageThemeSettings,
    normalizeMosaicThemeSettings,
    resolveMessageThemeSettings,
    resolveMosaicThemeSettings,
    mosaicSettingsBaseId,
    clampMosaicScale,
    themeHasMosaicControls,
    normalizeSettings,
    resolveIframeSrc,
    resolveBackgroundMediaId,
    normalizeBgMode,
    normalizeBgFit,
    BG_FITS,
    BG_MODES,
    findWrapper,
    findOverlayHost,
    hasMosaic,
    pageLooksLikeMosaic,
    pageLooksLikeNative,
    pageLooksLikeHardNative,
    pageLooksLikeStreamBeat,

    LEADERBOARD_THEMES,
    LEADERBOARD_THEME_META,
    leaderboardThemeMetaAll,
    normalizeLeaderboardTheme,
    normalizeLeaderboardThemeSettings,
    resolveLeaderboardThemeSettings,
    pageLooksLikeLeaderboardOverlay,
    leaderboardBeatActive,
    pageLooksLikeResultBarPolling,
    leaderboardCapture,
    captureLeaderboardAvatar,
    clearLeaderboardNativeMarks,
    pageLooksLikePolling,
    touchVixiAspectCache,
    measureWrapperAspect,
    pageLooksLikeRecognizedThemeTarget,
    pageLooksLikeUnknownPassthrough,
    needsPassthroughStageCanvas,
    pageLooksLikePassthrough,
    pageLooksLikeMessageBeat,
    pageLooksLikeMosaicBeat,
    themeOverlayLive,
    removeLeakedBrandChrome,
    passthroughLeavesVixiAlone,
    clearPassthroughState,
    findDirectNativeAsset,
    pageLooksLikeMessage,
    hasMessage,
    mosaicContentCount,
    messageCapture,
    mosaicImages,
    mosaicImageSrc,
    mosaicAssetClassUrls,
    mosaicAssetBackUrls,
    isBrandMosaicSrc,
    backgroundLayers,
    isSkippedMosaicImage,
    extensionAlive,
    loadSettings,
    saveSettings,
    peekSettings,
  };
  watchSettings();
})(typeof globalThis !== "undefined" ? globalThis : window);
