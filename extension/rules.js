(function (root) {
  const STORAGE_KEYS = {
    enabled: "enabled",
    anyOutputIframeHtml: "anyOutputIframeHtml",
    rules: "rules",
    mosaicTheme: "mosaicTheme",
    messageTheme: "messageTheme",
    messageThemeSettings: "messageThemeSettings",
    customThemes: "customThemes",
    customEngines: "customEngines",
    customEngineWarningSeen: "customEngineWarningSeen",
    stageAspect: "stageAspect",
    showQr: "showQr",
    showLogo: "showLogo",
  };

  const STAGE_ASPECT_PRESETS = [
    { value: "auto", label: "Auto — match the window" },
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
    stageAspect: "auto",
    showQr: false,
    showLogo: false,
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

  const MOSAIC_THEME_META = {
    decks: { label: "Card decks" },
    spotlight: { label: "Spotlight" },
    coverflow: { label: "Coverflow" },
    fan: { label: "Fan" },
    filmstrip: { label: "Filmstrip" },
    scatter: { label: "Scatter" },
    cascade: { label: "Cascade" },
    orbit: { label: "Orbit" },
    billboard: { label: "Billboard" },
    reels: { label: "Reels" },
    polaroid: { label: "Polaroid wall" },
    flipwall: { label: "3D flip wall" },
    livewall: { label: "Live mosaic" },
    cubes: { label: "Cube field" },
    pedestals: { label: "Pedestals" },
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

  let customMessageMeta = {};
  let customMosaicMeta = {};
  let lastGoodCustomThemes = [];
  let lastGoodCustomEngines = {};
  let lastRawSettings = null;
  let lastGoodSettings = null;
  let settingsFresh = false;

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

  function applyCustomThemeMeta(packs) {
    customMessageMeta = {};
    customMosaicMeta = {};
    (Array.isArray(packs) ? packs : []).forEach((pack) => {
      if (!pack || !pack.id) return;
      const engineMeta =
        pack.kind === "message" && pack.engine ? MESSAGE_THEME_META[pack.engine] : null;
      const meta = {
        label: pack.label || pack.id,
        custom: true,
        engine: pack.engine || "",
        labels: { ...((engineMeta && engineMeta.labels) || {}) },
        defaults: {
          ...((engineMeta && engineMeta.defaults) || {}),
          revealMs:
            Number(pack.revealMs) ||
            (engineMeta && engineMeta.defaults && engineMeta.defaults.revealMs) ||
            1000,
        },
      };
      const settings = pack.settings && typeof pack.settings === "object" ? pack.settings : {};
      ["primary", "secondary", "background"].forEach((key) => {
        const spec = settings[key];
        if (!spec) return;
        meta.labels[key] = spec.label || meta.labels[key] || key;
        if (spec.default) meta.defaults[key] = spec.default;
      });
      if (settings.motion && settings.motion.default) {
        meta.labels.motion = settings.motion.label || meta.labels.motion || "Motion";
        meta.defaults.motion = settings.motion.default;
      }
      if (!meta.defaults.primary) meta.defaults.primary = "#d52265";
      if (!meta.defaults.secondary) meta.defaults.secondary = "#fec651";
      if (pack.kind === "message") customMessageMeta[pack.id] = meta;
      if (pack.kind === "mosaic") customMosaicMeta[pack.id] = { label: meta.label, custom: true };
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

  function normalizeOneThemeSettings(themeId, raw) {
    const meta = messageThemeMetaAll()[themeId];
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
    Object.keys(messageThemeMetaAll()).forEach((id) => {
      next[id] = normalizeOneThemeSettings(id, src[id]);
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

  function parseStageAspect(value) {
    if (value == null) return null;
    const raw = String(value).trim();
    if (!raw || /^auto$/i.test(raw)) return { mode: "auto" };
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
    return parsed ? parsed.mode : "auto";
  }

  function presetForAspect(value) {
    const parsed = parseStageAspect(value);
    if (!parsed || parsed.mode === "auto") return "auto";
    for (let i = 0; i < STAGE_ASPECT_PRESETS.length; i += 1) {
      const preset = STAGE_ASPECT_PRESETS[i];
      if (preset.value === "auto") continue;
      const other = parseStageAspect(preset.value);
      if (other && Math.abs(parsed.aw * other.ah - other.aw * parsed.ah) < 1e-4) {
        return preset.value;
      }
    }
    return "custom";
  }

  function stageAspectToken(sizeOrMode) {
    if (sizeOrMode && typeof sizeOrMode === "object") {
      const mode = sizeOrMode.mode || "auto";
      if (mode === "auto") return sizeOrMode.portrait ? "9-16" : "16-9";
      return String(mode).replace(/:/g, "-");
    }
    const mode = normalizeStageAspect(sizeOrMode);
    if (mode === "auto") return "auto";
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

  function resolveStageSize(box, aspect) {
    const mode = normalizeStageAspect(aspect != null ? aspect : currentStageAspect());
    const rw = (box && (box.clientWidth || box.width)) || window.innerWidth || 1920;
    const rh = (box && (box.clientHeight || box.height)) || window.innerHeight || 1080;
    if (mode === "auto") {
      const portrait = rh > rw;
      return {
        dw: portrait ? 1080 : 1920,
        dh: portrait ? 1920 : 1080,
        portrait,
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
    return (
      document.querySelector(".output-wrapper") ||
      document.querySelector(".v2-app-wrapper") ||
      document.querySelector(".output-page")
    );
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
        if (currentStageAspect() === "auto") return;
        applyOutputCanvas();
      });
    };
    window.addEventListener("resize", refit);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", refit);
  }

  function applyOutputCanvas(aspect) {
    ensureStageCanvasStyle();
    const mode = normalizeStageAspect(aspect != null ? aspect : currentStageAspect());
    const html = document.documentElement;
    bindCanvasResize();

    if (mode === "auto") {
      resetOutputCanvas();
      html.dataset.stageAspect = "auto";
      return resolveStageSize(findWrapper(), mode);
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

  function silenceReplacedMedia() {
    backgroundLayers().forEach((el) => {
      const media = [];
      if (el.matches && el.matches("video, audio")) media.push(el);
      if (el.querySelectorAll) media.push(...el.querySelectorAll("video, audio"));
      media.forEach((node) => {
        try {
          node.pause();
          node.muted = true;
        } catch {
          /* cross-origin or already gone */
        }
      });
    });
  }

  function themeReplacesBackground(settings) {
    const s = settings || lastGoodSettings;
    if (!s || s.enabled === false) return false;
    return normalizeMessageTheme(s.messageTheme) !== "off" || normalizeMosaicTheme(s.mosaicTheme) !== "off";
  }

  function isBrandNode(el) {
    if (!el || !el.closest) return false;
    if (el.closest(QR_SELECTORS)) return true;
    if (el.closest(LOGO_SELECTORS)) return true;
    if (el.closest(".mosaic-layout > .asset-view")) return true;
    return false;
  }

  function findBrandNodes() {
    const qr = document.querySelector(QR_SELECTORS);
    let logo = document.querySelector(LOGO_SELECTORS);
    if (logo && qr && (logo === qr || (logo.closest && logo.closest(QR_SELECTORS)))) logo = null;
    if (!logo) {
      const views = document.querySelectorAll(".mosaic-layout > .asset-view");
      views.forEach((el) => {
        if (logo || (qr && (el === qr || el.contains(qr) || (qr.contains && qr.contains(el))))) return;
        logo = el;
      });
    }
    return { qr, logo };
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

  function ensureBrandChrome(themeRoot) {
    if (!themeRoot) return;
    const settings = lastGoodSettings || DEFAULTS;
    const wantQr = Boolean(settings.showQr);
    const wantLogo = Boolean(settings.showLogo);
    themeRoot.classList.toggle("dyn-show-qr", wantQr);
    themeRoot.classList.toggle("dyn-show-logo", wantLogo);

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

    const nodes = findBrandNodes();
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
      stageAspect: normalizeStageAspect(next.stageAspect),
      showQr: Boolean(next.showQr),
      showLogo: Boolean(next.showLogo),
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
    if (isBrandNode(img)) return true;
    if (img.classList.contains("v2-app-wrapper__bg-image")) return true;
    if (img.closest(".output-wrapper > .asset-view")) return true;
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
        chrome.storage.local.get(Object.assign({}, DEFAULTS, { customThemes: [] }), (stored) => {
          if (!extensionAlive() || (chrome.runtime.lastError && /invalidated/i.test(chrome.runtime.lastError.message || ""))) {
            resolve(lastGoodSettings || normalizeSettings(DEFAULTS));
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
    STAGE_ASPECTS,
    STAGE_ASPECT_PRESETS,
    parseStageAspect,
    presetForAspect,
    stageAspectToken,
    normalizeStageAspect,
    currentStageAspect,
    resolveStageSize,
    containFit,
    applyStageFrame,
    applyOutputCanvas,
    resetOutputCanvas,
    setStageAspect,
    themeReplacesBackground,
    silenceReplacedMedia,
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
