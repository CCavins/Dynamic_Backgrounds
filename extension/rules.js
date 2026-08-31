(function (root) {
  const STORAGE_KEYS = {
    enabled: "enabled",
    anyOutputIframeHtml: "anyOutputIframeHtml",
    rules: "rules",
    mosaicTheme: "mosaicTheme",
    messageTheme: "messageTheme",
    messageThemeSettings: "messageThemeSettings",
    mosaicThemeSettings: "mosaicThemeSettings",
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
    messageThemeSettings: {},
    mosaicThemeSettings: {},
    stageAspect: "vixi",
    messageShowBackground: false,
    messageShowQr: false,
    messageShowLogo: false,
    mosaicShowBackground: false,
    mosaicShowQr: false,
    mosaicShowLogo: false,
  };

  const MOTION_MODES = ["slow", "drift", "fizz"];
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
  };

  const MESSAGE_THEMES = ["off", ...Object.keys(MESSAGE_THEME_META)];

  const MOSAIC_THEME_META = {
    decks: { label: "Card decks" },
    "decks-brand": { label: "Card decks*", brandAware: true },
    spotlight: { label: "Spotlight" },
    coverflow: { label: "Coverflow" },
    fan: { label: "Fan" },
    "fan-brand": { label: "Fan*", brandAware: true },
    filmstrip: { label: "Filmstrip" },
    scatter: { label: "Scatter" },
    cascade: { label: "Cascade" },
    orbit: { label: "Orbit" },
    billboard: { label: "Billboard" },
    reels: { label: "Reels" },
    polaroid: {
      label: "Polaroid wall",
      labels: { scale: "Photo size", primary: "Frame" },
      defaults: { scale: 1, primary: "#ffffff" },
    },
    "polaroid-brand": { label: "Polaroid wall*", brandAware: true },
    flipwall: {
      label: "3D flip wall",
      labels: { scale: "Photo size", primary: "Edge" },
      defaults: { scale: 1, primary: "#5a5e66" },
    },
    "flipwall-brand": { label: "3D flip wall*", brandAware: true },
    livewall: {
      label: "Live mosaic",
      labels: { scale: "Photo size" },
      defaults: { scale: 1 },
    },
    "livewall-brand": { label: "Live mosaic*", brandAware: true },
    cubes: {
      label: "Cube field",
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

  function isKnownMessageTheme(value) {
    return value === "off" || Boolean(messageThemeMetaAll()[value]);
  }

  function isKnownMosaicTheme(value) {
    return value === "off" || Boolean(mosaicThemeMetaAll()[value]);
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
    return d.scale != null || d.primary || d.secondary || d.background;
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
        custom: true,
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
          custom: true,
          engine: pack.engine || "",
          labels: meta.labels,
          defaults: themeHasMosaicControls(meta) ? meta.defaults : undefined,
        };
      }
    });
    lastGoodCustomThemes = Array.isArray(packs) ? packs.slice() : [];
    if (lastRawSettings) {
      lastGoodSettings = normalizeSettings(lastRawSettings);
      settingsFresh = true;
    } else {
      settingsFresh = false;
    }
  }

  function normalizeMosaicTheme(value) {
    return isKnownMosaicTheme(value) ? value : "off";
  }

  function normalizeMessageTheme(value) {
    return isKnownMessageTheme(value) ? value : "off";
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
    return messageThemeMetaAll()[themeId] || mosaicThemeMetaAll()[themeId] || null;
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
    if (defaults.motion) {
      next.motion = MOTION_MODES.includes(src.motion) ? src.motion : defaults.motion;
    }
    if (defaults.scale != null) {
      next.scale = clampMosaicScale(src.scale, defaults.scale);
    }
    return next;
  }

  function normalizeMessageThemeSettings(value) {
    const src = value && typeof value === "object" ? value : {};
    const next = {};
    Object.keys(messageThemeMetaAll()).forEach((id) => {
      next[id] = normalizeOneThemeSettings(id, src[id]);
    });
    return next;
  }

  function normalizeMosaicThemeSettings(value) {
    const src = value && typeof value === "object" ? value : {};
    const next = {};
    Object.keys(mosaicThemeMetaAll()).forEach((id) => {
      const storeId = mosaicSettingsBaseId(id) || id;
      if (!themeHasMosaicControls(mosaicThemeMetaAll()[storeId] || mosaicThemeMetaAll()[id])) {
        return;
      }
      if (next[storeId]) return;
      next[storeId] = normalizeOneThemeSettings(storeId, src[storeId] || src[id]);
    });
    return next;
  }

  function resolveMessageThemeSettings(settings, themeId) {
    const id = normalizeMessageTheme(themeId || (settings && settings.messageTheme));
    if (id === "off") return null;
    const meta = messageThemeMetaAll()[id];
    const stored = settings && settings.messageThemeSettings && settings.messageThemeSettings[id];
    return {
      ...normalizeOneThemeSettings(id, stored),
      revealMs: meta && meta.defaults ? meta.defaults.revealMs : 1000,
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
    const normalized = normalizeOneThemeSettings(storeId, stored);
    if (normalized.scale == null) normalized.scale = 1;
    return normalized;
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

  function captureNativeVixiAspect() {
    if (!wrapperLooksNative()) return lastVixiRatio;
    const outer = findWrapper();
    const rw = outer && (outer.clientWidth || outer.width);
    const rh = outer && (outer.clientHeight || outer.height);
    if (rw >= 8 && rh >= 8) lastVixiRatio = snapVixiRatio(clampAspectParts(rw, rh));
    return lastVixiRatio;
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

    const nodes = [box && box.nodeType === 1 ? box : null, findWrapper()].filter(Boolean);
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
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
    }

    if (wrapperLooksNative()) {
      const measure = (box && box.clientWidth >= 8 ? box : null) || findWrapper();
      const rw = measure && (measure.clientWidth || measure.width);
      const rh = measure && (measure.clientHeight || measure.height);
      if (rw >= 8 && rh >= 8) lastVixiRatio = snapVixiRatio(clampAspectParts(rw, rh));
    }
    return lastVixiRatio;
  }

  function resolveStageSize(box, aspect) {
    const mode = normalizeStageAspect(aspect != null ? aspect : currentStageAspect());
    const rw = (box && (box.clientWidth || box.width)) || window.innerWidth || 1920;
    const rh = (box && (box.clientHeight || box.height)) || window.innerHeight || 1080;
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
      const detected = readVixiAspect(box);
      const size = designSizeFromRatio(detected.aw, detected.ah);
      return {
        dw: size.dw,
        dh: size.dh,
        portrait: detected.ah > detected.aw,
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

  const QR_SELECTORS = ".v2-qr-tile, .qr-tile";
  const MESSAGE_CHROME_SCOPE =
    ".message-layer, .capture-content-layer, .message-content, .v2-message";
  const MOSAIC_CHROME_SCOPE =
    ".mosaic-layout, .mosaic-tile-slot, .mosaic-asset, .v2-mosaic-swap-tile, .v2-mosaic-face, .v2-asset-tile";
  const lastBrand = {
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
    "html.dyn-theme-on,html.dyn-theme-on body,html.dyn-theme-on .output-page{" +
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
    return findWrapper();
  }

  function markCanvasOuter(outer) {
    if (!outer) return;
    clearCanvasInline(outer);
    outer.setAttribute("data-dyn-canvas-outer", "1");
    outer.removeAttribute("data-dyn-canvas-fill");
    bindCanvasGuard(outer);
    [".v2-app-wrapper", ".v2-scene-transition", ".v2-container", ".output-app"].forEach((sel) => {
      outer.querySelectorAll(sel).forEach((el) => {
        if (el === outer) return;
        clearCanvasInline(el);
        el.setAttribute("data-dyn-canvas-fill", "1");
        bindCanvasGuard(el);
      });
    });
  }

  function resetOutputCanvas() {
    document
      .querySelectorAll("[data-dyn-canvas-outer], [data-dyn-canvas-fill], [data-dyn-canvas]")
      .forEach((el) => {
        unbindCanvasGuard(el);
        clearCanvasInline(el);
        el.removeAttribute("data-dyn-canvas-outer");
        el.removeAttribute("data-dyn-canvas-fill");
        el.removeAttribute("data-dyn-canvas");
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
        if (handoff && typeof handoff.liveKind === "function" && handoff.liveKind() === "native") {
          resetOutputCanvas();
          return;
        }
        applyOutputCanvas();
      });
    };
    window.addEventListener("resize", refit);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", refit);
  }

  function applyOutputCanvas(aspect) {
    const handoff = root.BGThemeHandoff;
    if (handoff && typeof handoff.liveKind === "function" && handoff.liveKind() === "native") {
      resetOutputCanvas();
      return resolveStageSize(findWrapper(), "auto");
    }
    ensureStageCanvasStyle();
    const mode = normalizeStageAspect(aspect != null ? aspect : currentStageAspect());
    const html = document.documentElement;
    bindCanvasResize();
    captureNativeVixiAspect();

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
      // Stretch Vixi's canvas to the window. Design space then matches that
      // ratio (see resolveStageSize), so mosaics and messages fill instead of
      // sitting in a leftover 16:9 box.
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

  function applyStageFrame(root, aspect) {
    const outer = findOuterCanvas();
    const size = applyOutputCanvas(aspect);
    if (!root) return size;
    root.classList.toggle("dyn-portrait", size.portrait);
    root.dataset.aspect = stageAspectToken(size);
    if (!outer && size.mode !== "auto") {
      root.classList.add("dyn-stage-letterbox");
      clearCanvasInline(root);
      return size;
    }
    root.classList.remove("dyn-stage-letterbox");
    root.style.inset = "0";
    root.style.left = "";
    root.style.top = "";
    root.style.width = "";
    root.style.height = "";
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
    if (live === "message" || live === "mosaic") return live;
    // CTA / video / URL beats must not inherit the previous mosaic or message mode.
    if (live === "native" || pageLooksLikeNative()) return "";
    const mode = handoff && typeof handoff.currentMode === "function" ? handoff.currentMode() : "";
    if (mode === "message" || mode === "mosaic") return mode;
    const s = settings || lastGoodSettings;
    if (s && normalizeMessageTheme(s.messageTheme) !== "off") return "message";
    if (s && normalizeMosaicTheme(s.mosaicTheme) !== "off") return "mosaic";
    return "";
  }

  function themeIsOn(settings) {
    const s = settings || lastGoodSettings;
    if (!s || s.enabled === false) return false;
    return normalizeMessageTheme(s.messageTheme) !== "off" || normalizeMosaicTheme(s.mosaicTheme) !== "off";
  }

  function liveThemeIsOn(settings) {
    const s = settings || lastGoodSettings;
    if (!s || s.enabled === false) return false;
    const kind = activeThemeKind(s);
    if (kind === "message") return normalizeMessageTheme(s.messageTheme) !== "off";
    if (kind === "mosaic") return normalizeMosaicTheme(s.mosaicTheme) !== "off";
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
    const exact = list.find((el) => classifyChrome(el) === kind);
    if (exact) return exact;
    const opposite = kind === "message" ? "mosaic" : kind === "mosaic" ? "message" : "";
    if (opposite && list.some((el) => classifyChrome(el) === opposite)) return null;
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
    const qr = pickChromeNode(document.querySelectorAll(QR_SELECTORS), mode);
    let logos = [...document.querySelectorAll(LOGO_SELECTORS)].filter((el) => {
      if (qr && (el === qr || (el.closest && el.closest(QR_SELECTORS)))) return false;
      return true;
    });
    let logo = pickChromeNode(logos, mode);
    if (!logo && mode === "mosaic") {
      const views = document.querySelectorAll(".mosaic-layout > .asset-view");
      views.forEach((el) => {
        if (logo || (qr && (el === qr || el.contains(qr) || (qr.contains && qr.contains(el))))) return;
        logo = el;
      });
    }
    if (mode === "message" || mode === "mosaic") {
      if (qr) lastBrand[mode].qr = qr;
      if (logo) lastBrand[mode].logo = logo;
    }
    return {
      qr: qr || (mode && lastBrand[mode] && lastBrand[mode].qr) || null,
      logo: logo || (mode && lastBrand[mode] && lastBrand[mode].logo) || null,
      kind: mode,
    };
  }

  function fillBrandSlot(slot, source) {
    if (!slot) return;
    slot.replaceChildren();
    if (!source) {
      slot.hidden = true;
      return;
    }
    slot.hidden = false;
    const clone = source.cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.add("dyn-brand-clone");
    clone.style.cssText =
      "position:relative;inset:auto;left:auto;top:auto;right:auto;bottom:auto;" +
      "width:100%;height:100%;max-width:100%;max-height:100%;" +
      "visibility:visible;opacity:1;display:block;transform:none;pointer-events:none;";
    const media = clone.matches("img,canvas,svg,video")
      ? [clone]
      : [...clone.querySelectorAll("img,canvas,svg,video")];
    media.forEach((el) => {
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.objectFit = "contain";
    });
    slot.appendChild(clone);
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
    if (qrSlot) {
      if (wantQr && nodes.qr) fillBrandSlot(qrSlot, nodes.qr);
      else {
        qrSlot.replaceChildren();
        qrSlot.hidden = true;
      }
    }
    if (logoSlot) {
      if (wantLogo && nodes.logo) fillBrandSlot(logoSlot, nodes.logo);
      else {
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
      mosaicTheme: normalizeMosaicTheme(next.mosaicTheme),
      messageTheme: normalizeMessageTheme(next.messageTheme),
      messageThemeSettings: normalizeMessageThemeSettings(next.messageThemeSettings),
      mosaicThemeSettings: normalizeMosaicThemeSettings(next.mosaicThemeSettings),
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

  function nativeMediaLooksLive(el, inner) {
    if (!el || (el.closest && (isBrandNode(el) || el.closest(QR_SELECTORS)))) return false;
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
    // Empty leftover stream wrappers stay in the DOM on mosaic/message beats.
    // Only the wrapper's actual media can make this a native CTA/live scene.
    if (!inner && el.querySelector && !/^(IMG|VIDEO|CANVAS|IFRAME)$/i.test(el.tagName || "")) {
      const cls = typeof el.className === "string" ? el.className : el.getAttribute("class") || "";
      if (/output-stream|output-live/i.test(cls)) {
        const media = el.querySelector("video, img, canvas, iframe");
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
    if (!el) return false;
    if (el.closest && (isBrandNode(el) || el.closest(QR_SELECTORS))) return false;
    if (el.closest && (el.closest(MOSAIC_CHROME_SCOPE) || el.closest(MESSAGE_CHROME_SCOPE))) {
      return false;
    }
    // Our covers set visibility:hidden on the CTA. Size is enough — if we
    // require computed visibility, a covered CTA never wins over the theme.
    if (el.matches && el.matches("img[alt='CTA Image' i], [src*='/playlist/cta/']")) {
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
        if (!el || el.id === "dyn-theme-host") continue;
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
    if (!lastRawSettings) {
      settingsFresh = false;
      return;
    }
    const base = Object.assign({}, lastRawSettings);
    Object.keys(changes || {}).forEach((key) => {
      if (changes[key] && Object.prototype.hasOwnProperty.call(changes[key], "newValue")) {
        base[key] = changes[key].newValue;
      }
    });
    lastRawSettings = base;
    const packs = Array.isArray(base.customThemes) ? base.customThemes : [];
    applyCustomThemeMeta(packs);
    lastGoodSettings = normalizeSettings(base);
    settingsFresh = true;
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
          const packs = Array.isArray(stored.customThemes) ? stored.customThemes : [];
          applyCustomThemeMeta(packs);
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
          applyCustomThemeMeta(packs);
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
    applyCustomThemeMeta(next);
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

  root.BGExtensionRules = {
    STORAGE_KEYS,
    DEFAULTS,
    MOSAIC_THEMES,
    MOSAIC_THEME_META,
    MESSAGE_THEMES,
    MESSAGE_THEME_META,
    MOTION_MODES,
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
    silenceReplacedMedia,
    resumeBackgroundMedia,
    findBrandNodes,
    ensureBrandChrome,
    messageThemeMetaAll,
    mosaicThemeMetaAll,
    applyCustomThemeMeta,
    loadCustomThemes,
    saveCustomThemes,
    loadCustomEngines,
    saveCustomEngines,
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
    findWrapper,
    findOverlayHost,
    hasMosaic,
    pageLooksLikeMosaic,
    pageLooksLikeNative,
    pageLooksLikeHardNative,
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
  };
  watchSettings();
})(typeof globalThis !== "undefined" ? globalThis : window);
