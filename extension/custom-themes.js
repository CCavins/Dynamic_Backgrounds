(function (root) {
  const FORMAT = "dynamic-backgrounds-theme";
  const STYLE_ID = "dyn-custom-theme-style";
  const MAX_PACKS = 24;
  const MAX_CSS = 256000;
  const MAX_HTML = 50000;
  const MAX_ENGINE_JS = 200000;
  const MESSAGE_ENGINES = new Set([
    "led-scoreboard",
    "neon-nightclub",
    "ultras-tifo",
    "holo-card",
    "broadcast-tv",
    "liquid-glass",
    "parallax-drift",
    "text-message",
  ]);
  const MOSAIC_ENGINES = new Set([
    "decks",
    "decks-brand",
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
    "polaroid-brand",
    "flipwall",
    "flipwall-brand",
    "livewall",
    "livewall-brand",
    "cubes",
    "cubes-brand",
    "depthfield",
    "pedestals",
  ]);
  const BUNDLED_ENGINES = new Set([
    "message-aurora-engine",
    "message-text-message-engine",
    "mosaic-orbit-swap-engine",
    "mosaic-xmas-wreath-engine",
    "mosaic-xmas-tree-engine",
    "mosaic-xmas-snowfall-engine",
    "message-xmas-bauble-engine",
    "mosaic-slant-rows-engine",
  ]);
  const BUNDLED_PACK_FILES = [
    "packs/message-grunge-poster.json",
    "packs/mosaic-slant-rows.json",
  ];
  const BUNDLED_PACK_IDS = {
    message: ["message-grunge-poster"],
    mosaic: ["mosaic-slant-rows"],
  };
  const RESERVED = new Set(["off", ...MESSAGE_ENGINES, ...MOSAIC_ENGINES]);

  const rulesApi = root.BGExtensionRules;
  if (rulesApi && typeof rulesApi.registerBundledThemeIds === "function") {
    rulesApi.registerBundledThemeIds("message", BUNDLED_PACK_IDS.message);
    rulesApi.registerBundledThemeIds("mosaic", BUNDLED_PACK_IDS.mosaic);
  }

  let registeredIds = { message: [], mosaic: [] };
  let lastRegisteredPacks = [];
  const changeListeners = [];
  let readyResolved = false;
  let readyResolve = null;
  const readyPromise = new Promise((resolve) => {
    readyResolve = resolve;
  });

  function whenReady() {
    return readyResolved ? Promise.resolve() : readyPromise;
  }

  function onChange(fn) {
    if (typeof fn === "function") changeListeners.push(fn);
  }

  function markReady() {
    if (readyResolved) return;
    readyResolved = true;
    if (readyResolve) readyResolve();
  }

  function notifyChange() {
    changeListeners.forEach((fn) => {
      try {
        fn();
      } catch {
        /* listener failed */
      }
    });
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function isHex(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || ""));
  }

  function looksUnsafe(text) {
    return /<script\b|javascript:|data:text\/html|on[a-z]+\s*=/i.test(String(text || ""));
  }

  function stripJsonComments(text) {
    const src = String(text || "");
    let out = "";
    let i = 0;
    let inStr = false;
    let esc = false;
    while (i < src.length) {
      const ch = src[i];
      const next = src[i + 1];
      if (inStr) {
        out += ch;
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        i += 1;
        continue;
      }
      if (ch === '"') {
        inStr = true;
        out += ch;
        i += 1;
        continue;
      }
      if (ch === "/" && next === "/") {
        i += 2;
        while (i < src.length && src[i] !== "\n") i += 1;
        continue;
      }
      if (ch === "/" && next === "*") {
        i += 2;
        while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i += 1;
        if (i < src.length) i += 2;
        out += " ";
        continue;
      }
      out += ch;
      i += 1;
    }
    return out;
  }

  function parsePack(raw) {
    let data = raw;
    if (typeof raw === "string") {
      try {
        data = JSON.parse(stripJsonComments(raw));
      } catch {
        throw new Error("Theme file is not valid JSON.");
      }
    }
    if (!data || data.format !== FORMAT) {
      throw new Error('Missing "format": "dynamic-backgrounds-theme".');
    }
    if (Number(data.version) !== 1) {
      throw new Error("Unsupported theme version. Use version 1.");
    }
    if (data.kind !== "message" && data.kind !== "mosaic") {
      throw new Error('kind must be "message" or "mosaic".');
    }
    const id = String(data.id || "").trim();
    if (!/^[a-z][a-z0-9-]{1,40}$/.test(id)) {
      throw new Error("id must be lowercase letters, numbers, and dashes.");
    }
    if (RESERVED.has(id)) {
      throw new Error("That id is reserved by a built-in theme.");
    }
    const engine = String(data.engine || "").trim();
    if (engine) {
      if (!/^[a-z][a-z0-9-]{1,40}$/.test(engine)) {
        throw new Error("engine must be lowercase letters, numbers, and dashes.");
      }
      const builtinOk = (data.kind === "message" ? MESSAGE_ENGINES : MOSAIC_ENGINES).has(engine);
      if (!builtinOk && RESERVED.has(engine)) {
        throw new Error("That engine id is reserved by a built-in theme.");
      }
    }
    let engineFile = String(data.engineFile || "").trim().replace(/^.*[/\\]/, "");
    if (engineFile && !/^[a-zA-Z0-9._-]{1,80}\.js$/.test(engineFile)) engineFile = "";
    const label = String(data.label || id).trim().slice(0, 80);
    const css = String(data.css || "");
    const html = String(data.html || "");
    if (css.length > MAX_CSS) throw new Error("css is too large.");
    if (html.length > MAX_HTML) throw new Error("html is too large.");
    if (looksUnsafe(css) || looksUnsafe(html)) {
      throw new Error("Theme contains disallowed script or event handlers.");
    }
    if (data.kind === "message" && !html.trim() && !engine) {
      throw new Error("Message themes need an html template or an engine.");
    }
    const engineDefaults = engineThemeDefaults(data.kind, engine);
    const settings = {};
    const srcSettings = data.settings && typeof data.settings === "object" ? data.settings : {};
    const coreSettingKeys = ["primary", "secondary", "background", "motion", "scale"];
    coreSettingKeys.forEach((key) => {
      const spec = srcSettings[key];
      const inherited = engineDefaults && engineDefaults[key];
      if ((!spec || typeof spec !== "object") && !inherited) return;
      const next = {
        label: String((spec && spec.label) || (inherited && inherited.label) || key).slice(0, 40),
      };
      const rawDefault = spec && spec.default != null ? spec.default : inherited && inherited.default;
      if (key === "scale") {
        const n = Number(rawDefault);
        next.default = Math.max(0.7, Math.min(1.5, isFinite(n) ? n : 1));
      } else if (key === "motion") {
        if (data.kind === "mosaic") return;
        next.default = String(rawDefault || "drift");
      } else if (isHex(rawDefault)) next.default = String(rawDefault).toLowerCase();
      else if (key === "primary") next.default = "#d52265";
      else if (key === "secondary") next.default = "#fec651";
      else return;
      settings[key] = next;
    });
    Object.keys(srcSettings).forEach((key) => {
      if (coreSettingKeys.includes(key)) return;
      const spec = srcSettings[key];
      if (!spec || typeof spec !== "object") return;
      const next = {
        label: String(spec.label || key).slice(0, 40),
      };
      if (spec.type === "toggle") {
        next.type = "toggle";
        next.default = Boolean(spec.default);
      } else if (spec.type === "select" && Array.isArray(spec.options) && spec.options.length) {
        next.type = "select";
        next.default =
          spec.default != null ? String(spec.default) : String(spec.options[0].value || "");
        next.options = spec.options
          .map((option) => ({
            value: String(option.value),
            label: String(option.label || option.value).slice(0, 60),
          }))
          .filter((option) => option.value);
        if (!next.options.length) return;
      } else if (isHex(spec.default)) {
        next.default = String(spec.default).toLowerCase();
      } else if (spec.default != null) {
        next.default = spec.default;
      } else {
        return;
      }
      settings[key] = next;
    });
    const fit = Array.isArray(data.fit)
      ? data.fit
          .map((item) => ({
            box: String((item && item.box) || ""),
            text: String((item && item.text) || ""),
            max: Number(item && item.max) || 160,
            min: Number(item && item.min) || 18,
          }))
          .filter((item) => item.box && item.text)
      : [];
    const revealFallback =
      data.revealMs != null
        ? Number(data.revealMs)
        : engineDefaults && engineDefaults.revealMs
          ? Number(engineDefaults.revealMs)
          : 1000;
    const pack = {
      format: FORMAT,
      version: 1,
      kind: data.kind,
      id,
      label,
      engine,
      engineFile,
      css,
      html,
      fonts: normalizeGoogleFonts(data.fonts),
      fontFaces: normalizeFontFaces(data),
      // First face mirrored for older UI / packs that only know singular fields
      fontFile: "",
      fontFamily: "",
      fontId: "",
      settings,
      revealMs: Math.max(200, Math.min(4000, revealFallback || 1000)),
      hideMs: Math.max(120, Math.min(2000, Number(data.hideMs) || 320)),
      layout: ["grid", "row", "scatter", "ribbon"].includes(data.layout) ? data.layout : "grid",
      cols: Math.max(1, Math.min(8, Number(data.cols) || 4)),
      rows: Math.max(1, Math.min(6, Number(data.rows) || 3)),
      count: Math.max(3, Math.min(24, Number(data.count) || 8)),
      interval:
        data.interval != null
          ? Math.max(800, Math.min(12000, Number(data.interval) || 2800))
          : 0,
      fit,
    };
    return syncLegacyFontFields(pack);
  }

  const MAX_GOOGLE_FONT_LINKS = 8;
  const MAX_FONT_FACES = 12;

  function normalizeGoogleFonts(value) {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    const out = [];
    const seen = new Set();
    list.forEach((item) => {
      const href = String(item || "").trim();
      if (!/^https:\/\/fonts\.googleapis\.com\//.test(href)) return;
      if (seen.has(href)) return;
      seen.add(href);
      out.push(href);
    });
    return out.slice(0, MAX_GOOGLE_FONT_LINKS);
  }

  function normalizeFontFaces(data) {
    const faces = [];
    const seen = new Set();
    function pushFace(file, family, fontId) {
      const fontFile = normalizeFontFileName(file);
      if (!fontFile) return;
      const key = fontFile.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      faces.push({
        fontFile,
        fontFamily: String(family || "")
          .trim()
          .slice(0, 80),
        fontId: String(fontId || "").trim().slice(0, 80),
      });
    }
    if (Array.isArray(data && data.fontFaces) && data.fontFaces.length) {
      data.fontFaces.forEach((item) => {
        if (!item || typeof item !== "object") return;
        pushFace(
          item.fontFile || item.file,
          item.fontFamily || item.family,
          item.fontId
        );
      });
    } else if (data) {
      // Legacy singular fields when fontFaces is omitted
      pushFace(data.fontFile, data.fontFamily, data.fontId);
    }
    return faces.slice(0, MAX_FONT_FACES);
  }

  function getPackFontFaces(pack) {
    if (!pack) return [];
    if (Array.isArray(pack.fontFaces) && pack.fontFaces.length) {
      return pack.fontFaces.filter((face) => face && (face.fontFile || face.fontId));
    }
    if (pack.fontFile || pack.fontId) {
      return [
        {
          fontFile: pack.fontFile || "",
          fontFamily: pack.fontFamily || "",
          fontId: pack.fontId || "",
        },
      ];
    }
    return [];
  }

  function getPackGoogleFonts(pack) {
    if (!pack) return [];
    if (Array.isArray(pack.fonts)) {
      return pack.fonts.filter((href) => /^https:\/\/fonts\.googleapis\.com\//.test(String(href || "")));
    }
    if (typeof pack.fonts === "string" && /^https:\/\/fonts\.googleapis\.com\//.test(pack.fonts)) {
      return [pack.fonts];
    }
    return [];
  }

  function syncLegacyFontFields(pack) {
    const faces = getPackFontFaces(pack);
    const first = faces[0] || null;
    pack.fontFaces = faces;
    pack.fontFile = first ? first.fontFile || "" : "";
    pack.fontFamily = first ? first.fontFamily || "" : "";
    pack.fontId = first ? first.fontId || "" : "";
    return pack;
  }

  function normalizeFontFileName(value) {
    const name = String(value || "")
      .trim()
      .replace(/^.*[/\\]/, "");
    if (!/^[a-zA-Z0-9._-]{1,80}\.(woff2|woff|ttf|otf)$/i.test(name)) return "";
    return name;
  }

  function fontIdFromFileName(name) {
    const base = normalizeFontFileName(name);
    if (!base) return "";
    return base.toLowerCase();
  }

  function familyFromFileName(name) {
    const base = normalizeFontFileName(name) || String(name || "");
    const stem = base.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    return stem.slice(0, 80) || "Custom Font";
  }

  function fontFormatForMime(mime, fileName) {
    const m = String(mime || "").toLowerCase();
    const n = String(fileName || "").toLowerCase();
    if (m.includes("woff2") || /\.woff2$/i.test(n)) return "woff2";
    if (m.includes("woff") || /\.woff$/i.test(n)) return "woff";
    if (m.includes("opentype") || /\.otf$/i.test(n)) return "opentype";
    return "truetype";
  }

  function mimeForFontFile(fileName, fileType) {
    const t = String(fileType || "").toLowerCase();
    if (t) return t;
    const n = String(fileName || "").toLowerCase();
    if (/\.woff2$/i.test(n)) return "font/woff2";
    if (/\.woff$/i.test(n)) return "font/woff";
    if (/\.otf$/i.test(n)) return "font/otf";
    return "font/ttf";
  }

  const MAX_FONT_BYTES = 2 * 1024 * 1024;

  function readBlobAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read font file."));
      reader.readAsDataURL(blob);
    });
  }

  async function ingestFontFile(file) {
    if (!file) throw new Error("No font selected.");
    const name = normalizeFontFileName(file.name || fileBaseNameFallback(file));
    if (!name) throw new Error("Use a .woff2, .woff, .ttf, or .otf font file.");
    if (file.size > MAX_FONT_BYTES) {
      throw new Error("Font is too large (max about 2 MB). Prefer .woff2.");
    }
    const id = fontIdFromFileName(name);
    const mime = mimeForFontFile(name, file.type);
    const dataUrl = await readBlobAsDataUrl(file);
    return {
      id,
      name,
      mime,
      dataUrl,
      bytes: Number(file.size) || 0,
      family: familyFromFileName(name),
      format: fontFormatForMime(mime, name),
      updatedAt: Date.now(),
    };
  }

  function fileBaseNameFallback(file) {
    return String(file && file.name ? file.name : "").replace(/^.*[/\\]/, "");
  }

  function engineMessageDefaults(engine) {
    return engineThemeDefaults("message", engine);
  }

  function engineThemeDefaults(kind, engine) {
    const rules = root.BGExtensionRules;
    if (!rules) return null;
    let meta = null;
    if (kind === "message") {
      meta = rules.MESSAGE_THEME_META && rules.MESSAGE_THEME_META[engine];
    } else {
      meta = rules.MOSAIC_THEME_META && rules.MOSAIC_THEME_META[engine];
      if (!meta && engine && String(engine).endsWith("-brand")) {
        meta = rules.MOSAIC_THEME_META[String(engine).slice(0, -6)];
      }
    }
    if (!meta) return null;
    const defaults = meta.defaults || {};
    const labels = meta.labels || {};
    const next = {};
    ["primary", "secondary", "background", "motion", "scale"].forEach((key) => {
      if (defaults[key] == null) return;
      if (kind === "mosaic" && key === "motion") return;
      next[key] = { label: labels[key] || key, default: defaults[key] };
    });
    if (defaults.revealMs) next.revealMs = defaults.revealMs;
    return next;
  }

  function registryEngine(kind, engine) {
    const api = root.BGThemeEngines;
    const def = api && typeof api.get === "function" ? api.get(engine) : null;
    if (!def) return null;
    if (def.kind && def.kind !== kind) return null;
    return def;
  }

  function engineTheme(kind, engine) {
    const registered = registryEngine(kind, engine);
    if (registered) return registered;
    if (kind === "message") {
      return root.BGMessageThemes && root.BGMessageThemes.themes
        ? root.BGMessageThemes.themes[engine]
        : null;
    }
    return root.BGMosaicThemes && root.BGMosaicThemes.themes
      ? root.BGMosaicThemes.themes[engine]
      : null;
  }

  function looksLikeModule(source) {
    return /^\s*import\s|^\s*export\s/m.test(String(source || ""));
  }

  function peekEngineMeta(source) {
    const text = String(source || "");
    if (!text.trim()) throw new Error("Engine file is empty.");
    if (text.length > MAX_ENGINE_JS) throw new Error("engine.js is too large.");
    if (looksLikeModule(text)) {
      throw new Error("Engine must be a classic script, not a module. Do not use import/export.");
    }
    // Accept BGThemeEngines.define(...) or enginesApi.define(...) after
    // const enginesApi = global.BGThemeEngines / globalThis.BGThemeEngines.
    const hasDefine =
      /BGThemeEngines\s*\.\s*define\s*\(/.test(text) ||
      (/\benginesApi\s*\.\s*define\s*\(/.test(text) &&
        /\benginesApi\s*=\s*(?:global(?:This)?|window)\s*\.\s*BGThemeEngines\b/.test(text));
    if (!hasDefine) {
      throw new Error("Engine must call BGThemeEngines.define({ id, kind, ... }).");
    }
    const idMatch = text.match(/\bid\s*:\s*["']([a-z][a-z0-9-]{1,40})["']/);
    const kindMatch = text.match(/\bkind\s*:\s*["'](message|mosaic)["']/);
    if (!idMatch || !kindMatch) {
      throw new Error('Engine must call BGThemeEngines.define({ id, kind, ... }).');
    }
    const id = idMatch[1];
    if (RESERVED.has(id)) {
      throw new Error("That engine id is reserved by a built-in theme.");
    }
    return { id, kind: kindMatch[1] };
  }

  function isExtensionPage() {
    try {
      return location.protocol === "chrome-extension:";
    } catch {
      return false;
    }
  }

  // Isolated content scripts inherit the extension CSP, which blocks
  // new Function / eval. Bundled engines are loaded as real files instead.
  function isIsolatedContentScript() {
    try {
      return Boolean(
        typeof chrome !== "undefined" &&
          chrome.runtime &&
          chrome.runtime.id &&
          location.protocol !== "chrome-extension:"
      );
    } catch {
      return false;
    }
  }

  function canCompileEngines() {
    return !isExtensionPage() && !isIsolatedContentScript();
  }

  function isEvalCspError(err) {
    const msg = String(err && err.message ? err.message : err);
    return /unsafe-eval|Content Security Policy|Evaluating a string as JavaScript/i.test(msg);
  }

  function compileSideloadSource(source) {
    const meta = peekEngineMeta(source);
    const api = root.BGThemeEngines;
    if (!api || typeof api.define !== "function") {
      throw new Error("Engine API is not loaded.");
    }
    const existing = api.get(meta.id);
    if (existing) return existing;
    if (!canCompileEngines()) return null;
    const fn = new Function("BGThemeEngines", String(source));
    fn(api);
    const def = api.get(meta.id);
    if (!def || typeof def.mount !== "function") {
      throw new Error("Engine define() did not register a mount function.");
    }
    if (def.kind && def.kind !== meta.kind) {
      throw new Error("Engine kind does not match define().");
    }
    return def;
  }

  function registerSideloadEngines(records) {
    const api = root.BGThemeEngines;
    if (!api) return;
    Object.keys(records || {}).forEach((id) => {
      if (api.get(id)) return;
      const rec = records[id];
      if (!rec || !rec.source) return;
      if (!canCompileEngines()) return;
      try {
        compileSideloadSource(rec.source);
      } catch (err) {
        if (isEvalCspError(err)) return;
        console.warn("[Dynamic Themes] custom engine failed:", id, err && err.message);
      }
    });
  }

  const LAYOUT_STYLE = `
#dyn-mosaic-theme.dyn-custom-mosaic {
  position: absolute;
  inset: 0;
}
#dyn-mosaic-theme.dyn-custom-mosaic .dyn-custom-cards {
  position: absolute;
  inset: 0;
}
#dyn-mosaic-theme.dyn-layout-grid .dyn-custom-cards {
  display: grid;
  grid-template-columns: repeat(var(--cols, 4), 1fr);
  grid-template-rows: repeat(var(--rows, 3), 1fr);
  gap: 14px;
  padding: 28px;
}
#dyn-mosaic-theme.dyn-layout-row .dyn-custom-cards {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 28px;
}
#dyn-mosaic-theme.dyn-layout-grid .dyn-card,
#dyn-mosaic-theme.dyn-layout-row .dyn-card,
#dyn-mosaic-theme.dyn-layout-ribbon .dyn-card,
#dyn-mosaic-theme.dyn-layout-scatter .dyn-card {
  aspect-ratio: 2 / 3;
  height: auto;
}
#dyn-mosaic-theme.dyn-layout-grid .dyn-card {
  width: auto;
  max-width: 100%;
  max-height: 100%;
  justify-self: center;
  align-self: center;
}
#dyn-mosaic-theme.dyn-layout-row .dyn-card {
  flex: 0 0 calc(18% * var(--scale, 1));
  width: calc(18% * var(--scale, 1));
}
#dyn-mosaic-theme.dyn-layout-scatter .dyn-card {
  position: absolute;
  width: calc(18% * var(--scale, 1));
}
#dyn-mosaic-theme.dyn-layout-ribbon .dyn-custom-cards {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  transform: rotate(-8deg) scale(1.08);
}
#dyn-mosaic-theme.dyn-layout-ribbon .dyn-card {
  width: calc(16% * var(--scale, 1));
  flex: 0 0 calc(16% * var(--scale, 1));
}
#dyn-mosaic-theme.dyn-custom-mosaic .dyn-card {
  transition: opacity 0.22s ease, transform 0.4s ease;
}
#dyn-mosaic-theme.dyn-custom-mosaic .dyn-card.is-swap {
  opacity: 0.2;
}
#dyn-mosaic-theme.dyn-portrait.dyn-layout-row .dyn-custom-cards {
  flex-direction: column;
  justify-content: center;
}
#dyn-mosaic-theme.dyn-portrait.dyn-layout-row .dyn-card {
  flex: 0 0 auto;
  width: calc(42% * var(--scale, 1));
}
#dyn-mosaic-theme.dyn-portrait.dyn-layout-ribbon .dyn-custom-cards {
  flex-direction: column;
  transform: rotate(-6deg) scale(1.04);
}
#dyn-mosaic-theme.dyn-portrait.dyn-layout-ribbon .dyn-card {
  width: calc(42% * var(--scale, 1));
  flex: 0 0 auto;
}
#dyn-mosaic-theme.dyn-portrait.dyn-layout-scatter .dyn-card {
  width: calc(32% * var(--scale, 1));
}
`;

  function injectStyle(packs) {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }
    style.textContent =
      LAYOUT_STYLE +
      "\n" +
      (packs || [])
        .map((pack) => String(pack.css || "").trim())
        .filter(Boolean)
        .join("\n\n");
  }

  function injectFonts(packs, fontsMap) {
    document.querySelectorAll("link[data-dyn-custom-font]").forEach((node) => node.remove());
    let faceStyle = document.getElementById("dyn-custom-font-faces");
    if (!faceStyle) {
      faceStyle = document.createElement("style");
      faceStyle.id = "dyn-custom-font-faces";
      document.documentElement.appendChild(faceStyle);
    }
    const facesCss = [];
    const seenFace = new Set();
    const seenLink = new Set();
    const map = fontsMap && typeof fontsMap === "object" ? fontsMap : {};
    (packs || []).forEach((pack) => {
      getPackFontFaces(pack).forEach((face) => {
        const fontId = face.fontId || fontIdFromFileName(face.fontFile);
        if (!fontId || !map[fontId] || !map[fontId].dataUrl) return;
        const asset = map[fontId];
        const family = String(face.fontFamily || asset.family || "Custom Font").slice(0, 80);
        const key = fontId + "::" + family;
        if (seenFace.has(key)) return;
        seenFace.add(key);
        const fmt = asset.format || fontFormatForMime(asset.mime, asset.name);
        facesCss.push(
          "@font-face{font-family:" +
            JSON.stringify(family) +
            ";src:url(" +
            JSON.stringify(asset.dataUrl) +
            ") format(" +
            JSON.stringify(fmt) +
            ");font-display:swap;}"
        );
      });
      getPackGoogleFonts(pack).forEach((href) => {
        if (!href || seenLink.has(href)) return;
        seenLink.add(href);
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.dynCustomFont = pack.id;
        document.head.appendChild(link);
      });
    });
    faceStyle.textContent = facesCss.join("\n");
  }

  async function loadFontsMap() {
    const rules = root.BGExtensionRules;
    if (rules && typeof rules.loadCustomFonts === "function") {
      return rules.loadCustomFonts();
    }
    return {};
  }

  async function pruneUnusedFonts(packs) {
    const rules = root.BGExtensionRules;
    if (!rules || typeof rules.loadCustomFonts !== "function") return;
    const used = new Set();
    (packs || []).forEach((pack) => {
      getPackFontFaces(pack).forEach((face) => {
        const id = face.fontId || fontIdFromFileName(face.fontFile);
        if (id) used.add(id);
      });
    });
    const fonts = await rules.loadCustomFonts();
    let changed = false;
    Object.keys(fonts || {}).forEach((id) => {
      if (!used.has(id)) {
        delete fonts[id];
        changed = true;
      }
    });
    if (changed && rules.saveCustomFonts) await rules.saveCustomFonts(fonts);
  }

  function unregister() {
    const messageApi = root.BGMessageThemes;
    const mosaicApi = root.BGMosaicThemes;
    registeredIds.message.forEach((id) => {
      if (messageApi && messageApi.themes) delete messageApi.themes[id];
    });
    registeredIds.mosaic.forEach((id) => {
      if (mosaicApi && mosaicApi.themes) delete mosaicApi.themes[id];
    });
    registeredIds = { message: [], mosaic: [] };
  }

  function photoStyleOf(settings) {
    const rules = root.BGExtensionRules;
    const raw =
      settings && settings.photoStyle != null
        ? settings.photoStyle
        : settings && typeof settings.colorPhotos === "boolean"
          ? settings.colorPhotos
          : undefined;
    if (rules && typeof rules.normalizePhotoStyle === "function") {
      return rules.normalizePhotoStyle(raw, "bw");
    }
    if (raw === true || raw === "true") return "color";
    if (raw === "color" || raw === "sepia") return raw;
    return "bw";
  }

  function slantPhotoFilter(photoStyle) {
    if (photoStyle === "color") return "contrast(1.05)";
    if (photoStyle === "sepia") return "sepia(0.88) contrast(1.08) brightness(0.92) saturate(0.85)";
    return "grayscale(1) contrast(1.08)";
  }

  function packAssetUrl(filename) {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL("packs/assets/" + filename);
      }
    } catch {
      /* not extension */
    }
    try {
      const path = String(location.pathname || "");
      const base = path.includes("/themes/") ? "assets/" : "themes/assets/";
      return new URL(base + filename, location.href).href;
    } catch {
      return "themes/assets/" + filename;
    }
  }

  function applySlantAsphalt(rootEl) {
    if (!rootEl) return;
    const rulesApi = root.BGExtensionRules;
    const hideTexture =
      rulesApi &&
      typeof rulesApi.isStageBackgroundActive === "function" &&
      rulesApi.isStageBackgroundActive(rootEl);
    rootEl.querySelectorAll(".sr-texture").forEach((el) => {
      if (hideTexture) {
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
        el.style.setProperty("pointer-events", "none", "important");
        el.style.setProperty("background-image", "none", "important");
      } else {
        el.style.removeProperty("visibility");
        el.style.removeProperty("opacity");
        el.style.removeProperty("pointer-events");
        el.style.removeProperty("background-image");
      }
    });
    if (hideTexture) {
      rootEl.style.setProperty("--sr-texture", "none");
      return;
    }
    const url = packAssetUrl("slant-asphalt.webp");
    rootEl.style.setProperty("--sr-texture", 'url("' + url + '")');
  }

  function applySlantRowsPresentation(rootEl, settings) {
    if (!rootEl) return false;
    const isSlant =
      rootEl.dataset.theme === "mosaic-slant-rows" ||
      rootEl.dataset.engine === "mosaic-slant-rows-engine";
    if (!isSlant) return false;
    applySlantAsphalt(rootEl);
    const s = settings || {};
    const ps = photoStyleOf(s);
    rootEl.setAttribute("data-photo-style", ps);
    rootEl.removeAttribute("data-color-photos");
    if (s.primary != null && s.primary !== "") rootEl.style.setProperty("--primary", s.primary);
    if (s.secondary != null && s.secondary !== "") rootEl.style.setProperty("--secondary", s.secondary);
    if (s.background != null && s.background !== "") {
      rootEl.style.setProperty("--background", s.background);
    }
    if (s.frame != null && s.frame !== "") rootEl.style.setProperty("--frame", s.frame);
    const filt = slantPhotoFilter(ps);
    rootEl.querySelectorAll(".sr-well img").forEach((img) => {
      img.style.filter = filt;
    });
    if (s.frame != null && s.frame !== "") {
      rootEl.querySelectorAll(".sr-row .sr-slot .dyn-card").forEach((card) => {
        card.style.background = s.frame;
      });
    }
    return true;
  }

  function applyMosaicVars(rootEl, settings) {
    if (!rootEl || !rootEl.style) return;
    const s = settings || {};
    const n = Number(s.scale);
    const scale = isFinite(n) ? Math.max(0.7, Math.min(1.5, n)) : 1;
    rootEl.style.setProperty("--scale", String(scale));
    if (s.primary != null && s.primary !== "") rootEl.style.setProperty("--primary", s.primary);
    if (s.secondary != null && s.secondary !== "") rootEl.style.setProperty("--secondary", s.secondary);
    if (s.background != null && s.background !== "") {
      rootEl.style.setProperty("--background", s.background);
    }
    if (s.frame != null && s.frame !== "") rootEl.style.setProperty("--frame", s.frame);
    rootEl.setAttribute("data-photo-style", photoStyleOf(s));
    rootEl.removeAttribute("data-color-photos");
    applySlantRowsPresentation(rootEl, s);
  }

  const US_CALL = "dyn-bg-us-call";
  const US_RESULT = "dyn-bg-us-result";
  const US_READY_ATTR = "data-dyn-sideload";

  function sideloadReady() {
    try {
      return document.documentElement.getAttribute(US_READY_ATTR) === "1";
    } catch {
      return false;
    }
  }

  function waitForSideloadHost(ms) {
    if (sideloadReady()) return Promise.resolve(true);
    return new Promise((resolve) => {
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        document.documentElement.removeEventListener("dyn-bg-sideload-ready", onReady);
        window.removeEventListener("message", onMsg);
        clearTimeout(timer);
        resolve(ok);
      };
      const onReady = () => done(true);
      const onMsg = (event) => {
        if (event.source !== window) return;
        const data = event.data;
        if (data && data.source === "dyn-bg-sideload" && data.type === "ready") done(true);
      };
      const timer = setTimeout(() => done(sideloadReady()), ms || 2500);
      document.documentElement.addEventListener("dyn-bg-sideload-ready", onReady);
      window.addEventListener("message", onMsg);
    });
  }

  function usCall(method, payload) {
    return new Promise((resolve, reject) => {
      const requestId = "r" + Math.random().toString(36).slice(2, 10);
      const timer = setTimeout(() => {
        window.removeEventListener("message", onMsg);
        document.documentElement.removeEventListener(US_RESULT, onDom);
        reject(
          new Error(
            "Sideloaded engine did not respond. On chrome://extensions open Dynamic Themes → details and turn on Allow User Scripts, then reload this page."
          )
        );
      }, 8000);
      function finish(detail) {
        clearTimeout(timer);
        window.removeEventListener("message", onMsg);
        document.documentElement.removeEventListener(US_RESULT, onDom);
        if (!detail || detail.ok === false || detail.error) {
          reject(new Error(String((detail && detail.error) || "Sideload engine call failed.")));
          return;
        }
        resolve(detail);
      }
      function onMsg(event) {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.source !== "dyn-bg-sideload" || data.type !== "result") return;
        if (data.requestId !== requestId) return;
        finish(data);
      }
      function onDom(event) {
        const detail = event && event.detail;
        if (!detail || detail.requestId !== requestId) return;
        finish(detail);
      }
      window.addEventListener("message", onMsg);
      document.documentElement.addEventListener(US_RESULT, onDom);
      const body = Object.assign({ requestId, method }, payload || {});
      window.postMessage(
        Object.assign({ source: "dyn-bg-sideload", type: "call" }, body),
        "*"
      );
      document.documentElement.dispatchEvent(new CustomEvent(US_CALL, { detail: body }));
    });
  }

  async function ensureSideloadEngine(engineId) {
    await waitForSideloadHost(3000);
    if (!sideloadReady()) {
      throw new Error(
        "Sideloaded engines need Allow User Scripts (extension details). Enable it, reload the extension, then reload this page."
      );
    }
    const check = await usCall("has", { engineId });
    if (!check || !check.has) {
      try {
        if (chrome.runtime && chrome.runtime.sendMessage) {
          await chrome.runtime.sendMessage({ type: "dyn-bg-sync-sideload" });
          await wait(400);
          await waitForSideloadHost(3000);
        }
      } catch {
        /* background may be unavailable */
      }
      const again = await usCall("has", { engineId });
      if (!again || !again.has) {
        throw new Error(
          'Sideload engine "' +
            engineId +
            '" is not registered. Re-import the .js with the JSON, enable Allow User Scripts, and reload the page.'
        );
      }
    }
  }

  function isSideloadState(state) {
    return Boolean(state && state.__sideload && state.handle);
  }

  function requestSideloadSync() {
    try {
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        return Promise.resolve({ ok: false, reason: "no-runtime" });
      }
      return new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage({ type: "dyn-bg-sync-sideload" }, (result) => {
            if (chrome.runtime.lastError) {
              resolve({ ok: false, reason: "error", hint: chrome.runtime.lastError.message });
              return;
            }
            resolve(result || { ok: false, reason: "empty" });
          });
        } catch (err) {
          resolve({ ok: false, reason: "error", hint: String((err && err.message) || err) });
        }
      });
    } catch {
      return Promise.resolve({ ok: false, reason: "error" });
    }
  }

  function compileFromEngine(pack, kind) {
    const source = () => engineTheme(kind, pack.engine);
    if (kind === "message") {
      return {
        engine: pack.engine,
        mount(themeRoot, settings) {
          themeRoot.dataset.engine = pack.engine;
          if (pack.html) {
            const helpers = root.BGMessageThemes || {};
            const stage = helpers.ensureFitStage
              ? helpers.ensureFitStage(themeRoot)
              : themeRoot;
            if (!stage.querySelector("[data-photo], [data-message], img")) {
              stage.innerHTML = pack.html;
            }
          }
          const def = source();
          if (def && typeof def.mount === "function") {
            return def.mount(themeRoot, settings);
          }
          // Sideload fallback (USER_SCRIPT world). Returns a Promise — mosaic/message await it.
          return ensureSideloadEngine(pack.engine).then(async () => {
            if (!themeRoot.id) themeRoot.id = "dyn-message-theme";
            const result = await usCall("mountMessage", {
              engineId: pack.engine,
              rootId: themeRoot.id,
              settings: settings || {},
            });
            return { __sideload: true, handle: result.handle, engineId: pack.engine };
          });
        },
        applySettings(themeRoot, state, settings) {
          const helpers = root.BGMessageThemes || {};
          if (helpers.applyVars) helpers.applyVars(themeRoot, settings || {});
          if (isSideloadState(state)) {
            usCall("applySettings", {
              engineId: pack.engine,
              handle: state.handle,
              rootId: themeRoot && themeRoot.id,
              settings: settings || {},
            }).catch(() => {});
            return;
          }
          const def = source();
          if (def && def.applySettings) def.applySettings(themeRoot, state, settings);
        },
        async show(themeRoot, capture, state, settings) {
          if (isSideloadState(state)) {
            await usCall("show", {
              engineId: pack.engine,
              handle: state.handle,
              rootId: themeRoot && themeRoot.id,
              capture: capture || {},
              settings: settings || {},
            });
          } else {
            const def = source();
            if (def && def.show) await Promise.resolve(def.show(themeRoot, capture, state, settings));
          }
          const helpers = root.BGMessageThemes || {};
          if (document.fonts && document.fonts.ready) {
            await Promise.race([document.fonts.ready.catch(() => {}), wait(800)]);
          }
          const fit = helpers.fitText;
          if (fit && pack.fit && pack.fit.length) {
            pack.fit.forEach((rule) => {
              const box = themeRoot.querySelector(rule.box);
              const text = themeRoot.querySelector(rule.text);
              if (box && text) fit(box, text, rule.max, rule.min);
            });
          }
        },
        hide(themeRoot, state) {
          if (isSideloadState(state)) {
            return usCall("hide", {
              engineId: pack.engine,
              handle: state.handle,
              rootId: themeRoot && themeRoot.id,
            });
          }
          const def = source();
          return def && def.hide ? def.hide(themeRoot, state) : Promise.resolve();
        },
        unmount(themeRoot, state) {
          if (isSideloadState(state)) {
            usCall("unmount", {
              engineId: pack.engine,
              handle: state.handle,
              rootId: themeRoot && themeRoot.id,
            }).catch(() => {});
          } else {
            const def = source();
            if (def && def.unmount) def.unmount(themeRoot, state);
          }
          if (themeRoot && themeRoot.removeAttribute) themeRoot.removeAttribute("data-engine");
        },
      };
    }
    return {
      engine: pack.engine,
      interval: Number(pack.interval) || 2500,
      mount(mosaicRoot, pool, api, settings) {
        mosaicRoot.dataset.engine = pack.engine;
        if (pack.html) {
          const wrap = document.createElement("div");
          wrap.className = "dyn-custom-chrome";
          wrap.innerHTML = pack.html;
          mosaicRoot.appendChild(wrap);
        }
        applyMosaicVars(mosaicRoot, settings);
        const def = source();
        // Bundled / already-defined engines: same sync path as before.
        if (def && typeof def.mount === "function") {
          return def.mount(mosaicRoot, pool, api, settings);
        }
        // Sideload-only engines: Promise path (awaited by mosaic.js).
        return ensureSideloadEngine(pack.engine).then(async () => {
          if (!mosaicRoot.id) mosaicRoot.id = "dyn-mosaic-theme";
          const result = await usCall("mount", {
            engineId: pack.engine,
            rootId: mosaicRoot.id,
            pool: Array.isArray(pool) ? pool.slice() : [],
            settings: settings || {},
          });
          return { __sideload: true, handle: result.handle, engineId: pack.engine };
        });
      },
      tick(mosaicRoot, pool, state, api) {
        if (isSideloadState(state)) {
          usCall("tick", {
            engineId: pack.engine,
            handle: state.handle,
            rootId: mosaicRoot && mosaicRoot.id,
            pool: Array.isArray(pool) ? pool.slice() : [],
          }).catch(() => {});
          return;
        }
        const def = source();
        if (def && def.tick) def.tick(mosaicRoot, pool, state, api);
      },
      applySettings(mosaicRoot, state, settings) {
        applyMosaicVars(mosaicRoot, settings);
        if (isSideloadState(state)) {
          usCall("applySettings", {
            engineId: pack.engine,
            handle: state.handle,
            rootId: mosaicRoot && mosaicRoot.id,
            settings: settings || {},
          }).catch(() => {});
          return;
        }
        const def = source();
        if (def && typeof def.applySettings === "function") {
          def.applySettings(mosaicRoot, state, settings);
        }
      },
      unmount(mosaicRoot, state) {
        if (isSideloadState(state)) {
          usCall("unmount", {
            engineId: pack.engine,
            handle: state.handle,
            rootId: mosaicRoot && mosaicRoot.id,
          }).catch(() => {});
        } else {
          const def = source();
          if (def && def.unmount) def.unmount(mosaicRoot, state);
        }
        if (mosaicRoot && mosaicRoot.removeAttribute) mosaicRoot.removeAttribute("data-engine");
      },
    };
  }

  function compileMessage(pack) {
    if (pack.engine) {
      return compileFromEngine(pack, "message");
    }
    const helpers = () => root.BGMessageThemes || {};
    return {
      mount(themeRoot) {
        const stage = helpers().ensureFitStage
          ? helpers().ensureFitStage(themeRoot)
          : themeRoot;
        stage.innerHTML = pack.html;
        return {
          photos: helpers().collectMessagePhotos
            ? helpers().collectMessagePhotos(themeRoot, "[data-photo], img")
            : [...themeRoot.querySelectorAll("[data-photo], img")].filter(
                (img) => !img.closest("#dyn-bg-media, #dyn-bg-embed, #preview-bg")
              ),
          messages: [...themeRoot.querySelectorAll("[data-message]")],
          names: [...themeRoot.querySelectorAll("[data-name]")],
          idleTimer: 0,
        };
      },
      applySettings(themeRoot, _state, settings) {
        if (helpers().applyVars) helpers().applyVars(themeRoot, settings);
      },
      async show(themeRoot, capture, state, settings) {
        const fresh = !themeRoot.classList.contains("on");
        if (fresh && helpers().commonShowPrep) helpers().commonShowPrep(themeRoot, state);
        if (helpers().applyVars && settings) helpers().applyVars(themeRoot, settings);
        (state.photos || []).forEach((img) => {
          img.src = capture.src || "";
        });
        if (helpers().applyMessageFields) {
          helpers().applyMessageFields(themeRoot, capture);
        } else {
          (state.messages || []).forEach((node) => {
            node.textContent = capture.message || "";
          });
          (state.names || []).forEach((node) => {
            node.textContent = capture.name || "";
          });
          themeRoot.classList.toggle("no-photo", !capture.src);
          themeRoot.classList.toggle("no-copy", !capture.message && !capture.name);
          themeRoot.classList.toggle("no-name", !capture.name);
        }
        if (document.fonts && document.fonts.ready) {
          await Promise.race([document.fonts.ready.catch(() => {}), wait(800)]);
        }
        const fit = helpers().fitText;
        if (fit && pack.fit.length) {
          pack.fit.forEach((rule) => {
            const box = themeRoot.querySelector(rule.box);
            const text = themeRoot.querySelector(rule.text);
            if (box && text) fit(box, text, rule.max, rule.min);
          });
        }
        if (helpers().finishShow) {
          await helpers().finishShow(themeRoot, state.photos);
        } else {
          themeRoot.classList.add("on");
        }
        if (!fresh && helpers().replayGuestMotion) helpers().replayGuestMotion(themeRoot);
      },
      hide(themeRoot, state) {
        if (themeRoot.classList.contains("on") && !themeRoot.classList.contains("is-parked")) {
          return Promise.resolve();
        }
        if (helpers().hideTheme) return helpers().hideTheme(themeRoot, state, pack.hideMs);
        themeRoot.classList.add("off");
        return wait(pack.hideMs).then(() => themeRoot.classList.remove("on", "off"));
      },
      unmount(themeRoot, state) {
        if (state && state.idleTimer) clearTimeout(state.idleTimer);
      },
    };
  }

  function fillUrls(pool, count) {
    const unique = [];
    const seen = new Set();
    (pool || []).forEach((src) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      unique.push(src);
    });
    const out = [];
    if (!unique.length) return out;
    for (let i = 0; i < count; i += 1) out.push(unique[i % unique.length]);
    return out;
  }

  function makeMosaicCard(src) {
    const mosaicApi = root.BGMosaicThemes;
    if (mosaicApi && typeof mosaicApi.makeCard === "function") return mosaicApi.makeCard(src);
    const card = document.createElement("div");
    card.className = "dyn-card";
    const img = document.createElement("img");
    img.alt = "";
    img.src = src || "";
    card.appendChild(img);
    return card;
  }

  function nextSrc(api, pool, avoid) {
    if (api && typeof api.nextUrl === "function") return api.nextUrl(avoid);
    const list = (pool || []).filter(Boolean);
    if (!list.length) return "";
    return list[Math.floor(Math.random() * list.length)];
  }

  function compileMosaic(pack) {
    if (pack.engine) {
      return compileFromEngine(pack, "mosaic");
    }
    const count =
      pack.layout === "grid" ? pack.cols * pack.rows : pack.count;
    return {
      interval: pack.interval,
      mount(root, pool, api, settings) {
        root.classList.add("dyn-custom-mosaic", "dyn-layout-" + pack.layout);
        root.style.setProperty("--cols", String(pack.cols));
        root.style.setProperty("--rows", String(pack.rows));
        applyMosaicVars(root, settings);
        if (pack.html) {
          const wrap = document.createElement("div");
          wrap.className = "dyn-custom-chrome";
          wrap.innerHTML = pack.html;
          root.appendChild(wrap);
        }
        const host = document.createElement("div");
        host.className = "dyn-custom-cards";
        root.appendChild(host);
        const urls = fillUrls(pool, count);
        const cards = urls.map((src) => {
          const card = makeMosaicCard(src);
          host.appendChild(card);
          return card;
        });
        if (pack.layout === "scatter") {
          cards.forEach((card) => {
            card.style.left = 6 + Math.random() * 72 + "%";
            card.style.top = 4 + Math.random() * 68 + "%";
            card.style.transform = "rotate(" + ((Math.random() - 0.5) * 18).toFixed(1) + "deg)";
          });
        }
        return { host, cards, api };
      },
      tick(root, pool, state, api) {
        if (!state || !state.cards || !state.cards.length) return;
        const card = state.cards[Math.floor(Math.random() * state.cards.length)];
        const img = card.querySelector("img");
        const src = nextSrc(api || state.api, pool, img && img.src);
        if (!img || !src) return;
        const probe = new Image();
        probe.onload = () => {
          card.classList.add("is-swap");
          window.setTimeout(() => {
            img.src = src;
            card.classList.add("dyn-feed-ready");
            card.classList.remove("dyn-feed-pending", "is-swap");
          }, 220);
        };
        probe.src = src;
        if (probe.complete && probe.naturalWidth) probe.onload();
      },
      applySettings(root, _state, settings) {
        applyMosaicVars(root, settings);
      },
      unmount(root) {
        if (root) {
          const keep = [];
          ["dyn-bg-media", "dyn-bg-embed"].forEach((id) => {
            const el = root.querySelector(":scope > #" + id);
            if (el) keep.push(el);
          });
          root.replaceChildren();
          keep.forEach((el) => root.insertBefore(el, root.firstChild));
        }
      },
    };
  }

  function compileRegisteredPack(pack) {
    const messageApi = root.BGMessageThemes;
    const mosaicApi = root.BGMosaicThemes;
    if (!pack || !pack.id) return;
    if (pack.kind === "message" && messageApi && messageApi.themes) {
      messageApi.themes[pack.id] = compileMessage(pack);
      if (!registeredIds.message.includes(pack.id)) registeredIds.message.push(pack.id);
    }
    if (pack.kind === "mosaic" && mosaicApi && mosaicApi.themes) {
      mosaicApi.themes[pack.id] = compileMosaic(pack);
      if (!registeredIds.mosaic.includes(pack.id)) registeredIds.mosaic.push(pack.id);
    }
  }

  function applyRegisteredPacks(packs, fontsMap) {
    const rules = root.BGExtensionRules;
    if (rules && typeof rules.applyCustomThemeMeta === "function") {
      rules.applyCustomThemeMeta(packs);
    }
    injectStyle(packs);
    if (fontsMap) {
      injectFonts(packs, fontsMap);
    } else {
      loadFontsMap()
        .then((map) => injectFonts(packs, map))
        .catch(() => injectFonts(packs, {}));
    }
    notifyChange();
  }

  function registerPacks(packs, fontsMap) {
    unregister();
    lastRegisteredPacks = [];
    (packs || []).forEach((pack) => {
      if (!pack || !pack.id) return;
      lastRegisteredPacks.push(pack);
      compileRegisteredPack(pack);
    });
    applyRegisteredPacks(lastRegisteredPacks, fontsMap);
  }

  function addPacks(packs, fontsMap) {
    const extras = [];
    (packs || []).forEach((pack) => {
      if (!pack || !pack.id) return;
      if (lastRegisteredPacks.some((item) => item.id === pack.id)) return;
      extras.push(pack);
    });
    if (!extras.length) return;
    extras.forEach((pack) => {
      lastRegisteredPacks.push(pack);
      compileRegisteredPack(pack);
    });
    applyRegisteredPacks(lastRegisteredPacks, fontsMap);
  }

  async function loadBundledPacks() {
    const out = [];
    if (typeof fetch !== "function") return out;
    const base =
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      typeof chrome.runtime.getURL === "function"
        ? (path) => chrome.runtime.getURL(path)
        : (path) => {
            try {
              return new URL(
                "../extension/" + String(path || "").replace(/^\//, ""),
                location.href
              ).href;
            } catch {
              return "../extension/" + String(path || "").replace(/^\//, "");
            }
          };
    for (let i = 0; i < BUNDLED_PACK_FILES.length; i += 1) {
      const rel = BUNDLED_PACK_FILES[i];
      try {
        const res = await fetch(base(rel));
        if (!res || !res.ok) continue;
        const raw = await res.json();
        const pack = parsePack(raw);
        pack.bundled = true;
        out.push(pack);
      } catch {
        /* skip missing bundled pack */
      }
    }
    return out;
  }

  function mergePackLists(bundled, stored) {
    const byId = new Map();
    (Array.isArray(stored) ? stored : []).forEach((pack) => {
      if (pack && pack.id) byId.set(pack.id, pack);
    });
    // Bundled packs always win so shipped themes stay current.
    (Array.isArray(bundled) ? bundled : []).forEach((pack) => {
      if (pack && pack.id) byId.set(pack.id, pack);
    });
    return [...byId.values()];
  }

  async function loadAndRegister() {
    const rules = root.BGExtensionRules;
    try {
      if (!rules || typeof rules.loadCustomThemes !== "function") return [];
      const enginesReady = rules.loadCustomEngines
        ? rules.loadCustomEngines()
        : Promise.resolve({});
      const fontsReady = rules.loadCustomFonts ? rules.loadCustomFonts() : Promise.resolve({});
      const [engines, packs, fontsMap, bundled] = await Promise.all([
        enginesReady,
        rules.loadCustomThemes(),
        fontsReady,
        loadBundledPacks(),
      ]);
      registerSideloadEngines(engines);
      const merged = mergePackLists(bundled, packs);
    registerPacks(merged, fontsMap);
    return merged;
    } finally {
      markReady();
    }
  }

  async function importPack(raw, engineSource, fontAssets) {
    let meta = null;
    if (engineSource) {
      meta = peekEngineMeta(engineSource);
    }
    const pack = parsePack(raw);
    if (meta) {
      if (meta.kind !== pack.kind) {
        throw new Error("Engine kind does not match the theme JSON.");
      }
      if (pack.engine && pack.engine !== meta.id) {
        throw new Error('JSON "engine" must match the engine file id.');
      }
      pack.engine = meta.id;
    }
    const rules = root.BGExtensionRules;
    if (pack.engine && !engineTheme(pack.kind, pack.engine) && !engineSource) {
      const builtin =
        pack.kind === "message" ? MESSAGE_ENGINES.has(pack.engine) : MOSAIC_ENGINES.has(pack.engine);
      if (!builtin && !BUNDLED_ENGINES.has(pack.engine)) {
        const stored =
          rules && rules.loadCustomEngines ? await rules.loadCustomEngines() : {};
        if (!stored[pack.engine]) {
          throw new Error("Unknown engine. Import the .js file with the JSON.");
        }
      }
    }
    const current = rules ? await rules.loadCustomThemes() : [];
    if (current.length >= MAX_PACKS && !current.some((item) => item.id === pack.id)) {
      throw new Error("Too many imported themes. Remove one first.");
    }
    if (engineSource && rules && rules.saveCustomEngines) {
      const engines = await rules.loadCustomEngines();
      engines[meta.id] = { id: meta.id, kind: meta.kind, source: String(engineSource) };
      await rules.saveCustomEngines(engines);
      if (canCompileEngines()) {
        try {
          compileSideloadSource(engineSource);
        } catch {
          /* content script compiles on the next load if this context cannot */
        }
      }
    }

    const previous = current.find((item) => item.id === pack.id);
    const assetList = Array.isArray(fontAssets)
      ? fontAssets.filter(Boolean)
      : fontAssets
        ? [fontAssets]
        : [];
    const assetsByName = new Map();
    assetList.forEach((asset) => {
      if (asset && asset.id && asset.name) {
        assetsByName.set(String(asset.name).toLowerCase(), asset);
      }
    });

    let storedFonts = null;
    async function ensureFonts() {
      if (!storedFonts && rules && rules.loadCustomFonts) {
        storedFonts = await rules.loadCustomFonts();
      }
      return storedFonts || {};
    }

    const resolvedFaces = [];
    for (const face of getPackFontFaces(pack)) {
      const want = String(face.fontFile || "").toLowerCase();
      const fromBatch = want ? assetsByName.get(want) : null;
      if (fromBatch && fromBatch.id && rules && rules.saveCustomFonts) {
        const fonts = await ensureFonts();
        fonts[fromBatch.id] = {
          id: fromBatch.id,
          name: fromBatch.name,
          mime: fromBatch.mime,
          dataUrl: fromBatch.dataUrl,
          bytes: fromBatch.bytes,
          family: fromBatch.family,
          format: fromBatch.format,
          updatedAt: Date.now(),
        };
        storedFonts = fonts;
        resolvedFaces.push({
          fontFile: fromBatch.name,
          fontFamily: face.fontFamily || fromBatch.family || "",
          fontId: fromBatch.id,
        });
        continue;
      }

      const prevFaces = previous ? getPackFontFaces(previous) : [];
      const prevMatch = prevFaces.find(
        (item) =>
          item.fontId &&
          String(item.fontFile || "").toLowerCase() === want
      );
      if (prevMatch) {
        resolvedFaces.push({
          fontFile: prevMatch.fontFile || face.fontFile,
          fontFamily: face.fontFamily || prevMatch.fontFamily || "",
          fontId: prevMatch.fontId,
        });
        continue;
      }

      if (want && rules && rules.loadCustomFonts) {
        const fonts = await ensureFonts();
        const id = fontIdFromFileName(face.fontFile);
        if (fonts[id] && fonts[id].dataUrl) {
          resolvedFaces.push({
            fontFile: face.fontFile,
            fontFamily: face.fontFamily || fonts[id].family || familyFromFileName(face.fontFile),
            fontId: id,
          });
          continue;
        }
      }

      resolvedFaces.push({
        fontFile: face.fontFile || "",
        fontFamily: face.fontFamily || "",
        fontId: "",
      });
    }

    if (storedFonts && rules && rules.saveCustomFonts) {
      await rules.saveCustomFonts(storedFonts);
    }

    pack.fontFaces = resolvedFaces;
    syncLegacyFontFields(pack);

    const now = new Date().toISOString();
    pack.importedAt = (previous && previous.importedAt) || now;
    pack.updatedAt = now;
    const next = current.filter((item) => item.id !== pack.id);
    next.push(pack);
    if (rules) await rules.saveCustomThemes(next);
    await pruneUnusedFonts(next);
    await loadAndRegister();
    return pack;
  }

  async function removePack(id) {
    const rules = root.BGExtensionRules;
    const current = rules ? await rules.loadCustomThemes() : [];
    const removed = current.find((item) => item.id === id);
    const next = current.filter((item) => item.id !== id);
    if (rules) await rules.saveCustomThemes(next);
    if (removed && removed.engine && rules && rules.loadCustomEngines) {
      const stillUsed = next.some((item) => item.engine === removed.engine);
      if (!stillUsed) {
        const engines = await rules.loadCustomEngines();
        if (engines[removed.engine]) {
          delete engines[removed.engine];
          // Never unregister shipped example engines — only drop the stored copy.
          if (
            !BUNDLED_ENGINES.has(removed.engine) &&
            root.BGThemeEngines &&
            root.BGThemeEngines.unregister
          ) {
            root.BGThemeEngines.unregister(removed.engine);
          }
          await rules.saveCustomEngines(engines);
        }
      }
    }
    await pruneUnusedFonts(next);
    await loadAndRegister();
    return next;
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.customEngines || changes.customThemes || changes.customFonts) {
        loadAndRegister().catch(() => {});
      }
    });
  } catch {
    /* popup or dead runtime */
  }

  loadAndRegister().catch(() => {});

  function importFileBaseName(file) {
    return String(file && file.name ? file.name : "").replace(/^.*[/\\]/, "");
  }

  function findEngineForPack(pack, engines) {
    if (!pack || !pack.engine || !engines.length) return null;
    const engineFile = String(pack.engineFile || "").toLowerCase();
    const engineId = String(pack.engine || "").toLowerCase();
    const idEngineName = String(pack.id || "").toLowerCase() + "-engine.js";
    const byFile = engineFile
      ? engines.find((item) => item.name.toLowerCase() === engineFile)
      : null;
    if (byFile) return byFile;
    const byId = engines.find((item) => String(item.meta.id || "").toLowerCase() === engineId);
    if (byId) return byId;
    return (
      engines.find((item) => item.name.toLowerCase() === idEngineName) ||
      engines.find((item) => item.name.toLowerCase().replace(/\.js$/, "") === engineId) ||
      null
    );
  }

  function engineReady(kind, engineId) {
    if (!engineId) return true;
    if (engineTheme(kind, engineId)) return true;
    const builtin = kind === "message" ? MESSAGE_ENGINES.has(engineId) : MOSAIC_ENGINES.has(engineId);
    return builtin || BUNDLED_ENGINES.has(engineId);
  }

  function bindImportedFonts(pack, fontAssets) {
    if (!pack) return pack;
    const assetsByName = new Map();
    (fontAssets || []).forEach((asset) => {
      if (asset && asset.id && asset.name) {
        assetsByName.set(String(asset.name).toLowerCase(), asset);
      }
    });
    const resolved = [];
    getPackFontFaces(pack).forEach((face) => {
      const want = String(face.fontFile || "").toLowerCase();
      const fromBatch = want ? assetsByName.get(want) : null;
      if (fromBatch) {
        resolved.push({
          fontFile: fromBatch.name,
          fontFamily: face.fontFamily || fromBatch.family || "",
          fontId: fromBatch.id,
        });
        return;
      }
      resolved.push({
        fontFile: face.fontFile || "",
        fontFamily: face.fontFamily || "",
        fontId: face.fontId || (want ? fontIdFromFileName(face.fontFile) : ""),
      });
    });
    pack.fontFaces = resolved;
    return syncLegacyFontFields(pack);
  }

  function replaceSideloadEngine(source) {
    const meta = peekEngineMeta(source);
    const api = root.BGThemeEngines;
    if (api && typeof api.unregister === "function") api.unregister(meta.id);
    return compileSideloadSource(source);
  }

  async function planThemeImports(files) {
    const list = [...(files || [])];
    const jsonFiles = list.filter((file) => /\.json$/i.test(file.name));
    const jsFiles = list.filter((file) => /\.js$/i.test(file.name));
    const fontFiles = list.filter((file) => /\.(woff2|woff|ttf|otf)$/i.test(file.name));
    if (!jsonFiles.length) {
      throw new Error("Select at least one theme .json file.");
    }

    const engines = [];
    const notes = [];
    for (const file of jsFiles) {
      const name = importFileBaseName(file);
      if (/snow-particles/i.test(name)) {
        notes.push("Skipped " + name + " (helper — not an importable engine).");
        continue;
      }
      const text = await file.text();
      try {
        const meta = peekEngineMeta(text);
        engines.push({ file, text, meta, name });
      } catch (err) {
        notes.push(
          "Skipped " + name + " (" + ((err && err.message) || "not a theme engine") + ")."
        );
      }
    }

    const fonts = [];
    for (const file of fontFiles) {
      try {
        const asset = await ingestFontFile(file);
        fonts.push({ file, asset, name: asset.name });
      } catch (err) {
        notes.push(
          "Skipped " +
            importFileBaseName(file) +
            " (" +
            ((err && err.message) || "not a usable font") +
            ")."
        );
      }
    }

    function findFontsForPack(pack) {
      const faces = getPackFontFaces(pack);
      const matched = [];
      const missing = [];
      faces.forEach((face) => {
        const want = String(face.fontFile || "").toLowerCase();
        if (!want) return;
        const hit = fonts.find((item) => item.name.toLowerCase() === want);
        if (hit) matched.push(hit);
        else missing.push(face.fontFile);
      });
      return { matched, missing };
    }

    const usedEngines = new Set();
    const usedFonts = new Set();
    const jobs = [];
    const errors = [];
    for (const file of jsonFiles) {
      const name = importFileBaseName(file);
      let raw = "";
      let pack = null;
      try {
        raw = await file.text();
        pack = parsePack(raw);
      } catch (err) {
        errors.push(name + ": " + ((err && err.message) || "invalid theme"));
        continue;
      }
      const match = findEngineForPack(pack, engines);
      if (match) usedEngines.add(match.name);
      const fontPlan = findFontsForPack(pack);
      fontPlan.matched.forEach((item) => usedFonts.add(item.name));
      fontPlan.missing.forEach((fontName) => {
        notes.push(
          name +
            ': fontFile "' +
            fontName +
            '" not in this selection (will reuse a stored copy if one exists).'
        );
      });
      jobs.push({
        raw,
        pack,
        jsonName: name,
        engineSource: match ? match.text : "",
        engineName: match ? match.name : "",
        fontAssets: fontPlan.matched.map((item) => item.asset),
      });
    }

    engines.forEach((item) => {
      if (!usedEngines.has(item.name)) {
        notes.push("Unused engine " + item.name + " (no matching theme .json in this selection).");
      }
    });
    fonts.forEach((item) => {
      if (!usedFonts.has(item.name)) {
        notes.push("Unused font " + item.name + " (no theme fontFile matched it).");
      }
    });

    return { jobs, errors, notes };
  }

  root.BGCustomThemes = {
    FORMAT,
    MESSAGE_ENGINES,
    MOSAIC_ENGINES,
    RESERVED,
    MAX_PACKS,
    MAX_CSS,
    MAX_HTML,
    MAX_ENGINE_JS,
    MAX_FONT_BYTES,
    applyMosaicVars,
    refreshSlantRows: applySlantRowsPresentation,
    parsePack,
    peekEngineMeta,
    ingestFontFile,
    normalizeFontFileName,
    fontIdFromFileName,
    getPackFontFaces,
    getPackGoogleFonts,
    compileSideloadSource,
    registerSideloadEngines,
    registerPacks,
    addPacks,
    loadAndRegister,
    whenReady,
    onChange,
    importPack,
    removePack,
    requestSideloadSync,
    planThemeImports,
    engineReady,
    bindImportedFonts,
    replaceSideloadEngine,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
