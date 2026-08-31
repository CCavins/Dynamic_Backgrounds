(function (root) {
  const FORMAT = "dynamic-backgrounds-theme";
  const STYLE_ID = "dyn-custom-theme-style";
  const MAX_PACKS = 24;
  const MAX_CSS = 100000;
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
  ]);
  const RESERVED = new Set(["off", ...MESSAGE_ENGINES, ...MOSAIC_ENGINES]);

  let registeredIds = { message: [], mosaic: [] };
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

  function parsePack(raw) {
    let data = raw;
    if (typeof raw === "string") {
      try {
        data = JSON.parse(raw);
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
    ["primary", "secondary", "background", "motion", "scale"].forEach((key) => {
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
    return {
      format: FORMAT,
      version: 1,
      kind: data.kind,
      id,
      label,
      engine,
      engineFile,
      css,
      html,
      fonts: /^https:\/\/fonts\.googleapis\.com\//.test(String(data.fonts || ""))
        ? String(data.fonts)
        : "",
      fontFile: normalizeFontFileName(data.fontFile),
      fontFamily: String(data.fontFamily || "")
        .trim()
        .slice(0, 80),
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
        console.warn("[Dynamic Backgrounds] custom engine failed:", id, err && err.message);
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
    const faces = [];
    const seenFace = new Set();
    const seenLink = new Set();
    const map = fontsMap && typeof fontsMap === "object" ? fontsMap : {};
    (packs || []).forEach((pack) => {
      if (pack.fontId && map[pack.fontId] && map[pack.fontId].dataUrl) {
        const asset = map[pack.fontId];
        const family = String(pack.fontFamily || asset.family || "Custom Font").slice(0, 80);
        const key = pack.fontId + "::" + family;
        if (!seenFace.has(key)) {
          seenFace.add(key);
          const fmt = asset.format || fontFormatForMime(asset.mime, asset.name);
          faces.push(
            "@font-face{font-family:" +
              JSON.stringify(family) +
              ";src:url(" +
              JSON.stringify(asset.dataUrl) +
              ") format(" +
              JSON.stringify(fmt) +
              ");font-display:swap;}"
          );
        }
      }
      if (!pack.fonts || seenLink.has(pack.fonts)) return;
      seenLink.add(pack.fonts);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = pack.fonts;
      link.dataset.dynCustomFont = pack.id;
      document.head.appendChild(link);
    });
    faceStyle.textContent = faces.join("\n");
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
    const used = new Set(
      (packs || []).map((pack) => pack && pack.fontId).filter(Boolean)
    );
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

  function applyMosaicVars(root, settings) {
    if (!root || !root.style) return;
    const n = Number(settings && settings.scale);
    const scale = isFinite(n) ? Math.max(0.7, Math.min(1.5, n)) : 1;
    root.style.setProperty("--scale", String(scale));
    if (settings && settings.primary) root.style.setProperty("--primary", settings.primary);
    if (settings && settings.secondary) root.style.setProperty("--secondary", settings.secondary);
    if (settings && settings.background) root.style.setProperty("--background", settings.background);
  }

  function compileFromEngine(pack, kind) {
    const source = () => engineTheme(kind, pack.engine);
    if (kind === "message") {
      return {
        engine: pack.engine,
        mount(themeRoot, settings) {
          const def = source();
          if (!def || typeof def.mount !== "function") {
            throw new Error(
              'Message engine "' + pack.engine + '" is not loaded. Update/reload the extension.'
            );
          }
          themeRoot.dataset.engine = pack.engine;
          if (registryEngine(kind, pack.engine) && pack.html) {
            const helpers = root.BGMessageThemes || {};
            const stage = helpers.ensureFitStage
              ? helpers.ensureFitStage(themeRoot)
              : themeRoot;
            if (!stage.querySelector("[data-photo], [data-message], img")) {
              stage.innerHTML = pack.html;
            }
          }
          return def.mount(themeRoot, settings);
        },
        applySettings(themeRoot, state, settings) {
          const def = source();
          if (def && def.applySettings) def.applySettings(themeRoot, state, settings);
        },
        async show(themeRoot, capture, state, settings) {
          const def = source();
          const result = def.show(themeRoot, capture, state, settings);
          await Promise.resolve(result);
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
          return source().hide(themeRoot, state);
        },
        unmount(themeRoot, state) {
          const def = source();
          if (def && def.unmount) def.unmount(themeRoot, state);
          if (themeRoot && themeRoot.removeAttribute) themeRoot.removeAttribute("data-engine");
        },
      };
    }
    return {
      engine: pack.engine,
      interval: Number(pack.interval) || 2500,
      mount(mosaicRoot, pool, api, settings) {
        const def = source();
        if (!def || typeof def.mount !== "function") {
          throw new Error(
            'Mosaic engine "' +
              pack.engine +
              '" is not loaded. Update/reload the extension — output pages cannot eval sideloaded engines.'
          );
        }
        mosaicRoot.dataset.engine = pack.engine;
        if (pack.html) {
          const wrap = document.createElement("div");
          wrap.className = "dyn-custom-chrome";
          wrap.innerHTML = pack.html;
          mosaicRoot.appendChild(wrap);
        }
        applyMosaicVars(mosaicRoot, settings);
        return def.mount(mosaicRoot, pool, api, settings);
      },
      tick(mosaicRoot, pool, state, api) {
        const def = source();
        if (def && def.tick) def.tick(mosaicRoot, pool, state, api);
      },
      applySettings(mosaicRoot, state, settings) {
        applyMosaicVars(mosaicRoot, settings);
        const def = source();
        if (def && typeof def.applySettings === "function") {
          def.applySettings(mosaicRoot, state, settings);
        }
      },
      unmount(mosaicRoot, state) {
        const def = source();
        if (def && def.unmount) def.unmount(mosaicRoot, state);
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
          photos: [...themeRoot.querySelectorAll("[data-photo], img")],
          messages: [...themeRoot.querySelectorAll("[data-message]")],
          names: [...themeRoot.querySelectorAll("[data-name]")],
          idleTimer: 0,
        };
      },
      applySettings(themeRoot, _state, settings) {
        if (helpers().applyVars) helpers().applyVars(themeRoot, settings);
      },
      async show(themeRoot, capture, state, settings) {
        if (helpers().commonShowPrep) helpers().commonShowPrep(themeRoot, state);
        (state.photos || []).forEach((img) => {
          img.src = capture.src || "";
        });
        (state.messages || []).forEach((node) => {
          node.textContent = capture.message || "";
        });
        (state.names || []).forEach((node) => {
          node.textContent = capture.name || "";
        });
        themeRoot.classList.toggle("no-photo", !capture.src);
        themeRoot.classList.toggle("no-copy", !capture.message && !capture.name);
        themeRoot.classList.toggle("no-name", !capture.name);
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
      },
      hide(themeRoot, state) {
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
        if (root) root.replaceChildren();
      },
    };
  }

  function registerPacks(packs, fontsMap) {
    unregister();
    const messageApi = root.BGMessageThemes;
    const mosaicApi = root.BGMosaicThemes;
    const rules = root.BGExtensionRules;
    if (rules && typeof rules.applyCustomThemeMeta === "function") {
      rules.applyCustomThemeMeta(packs);
    }
    (packs || []).forEach((pack) => {
      if (pack.kind === "message" && messageApi && messageApi.themes) {
        messageApi.themes[pack.id] = compileMessage(pack);
        registeredIds.message.push(pack.id);
      }
      if (pack.kind === "mosaic" && mosaicApi && mosaicApi.themes) {
        mosaicApi.themes[pack.id] = compileMosaic(pack);
        registeredIds.mosaic.push(pack.id);
      }
    });
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

  async function loadAndRegister() {
    const rules = root.BGExtensionRules;
    try {
      if (!rules || typeof rules.loadCustomThemes !== "function") return [];
      const enginesReady = rules.loadCustomEngines
        ? rules.loadCustomEngines()
        : Promise.resolve({});
      const fontsReady = rules.loadCustomFonts ? rules.loadCustomFonts() : Promise.resolve({});
      const [engines, packs, fontsMap] = await Promise.all([
        enginesReady,
        rules.loadCustomThemes(),
        fontsReady,
      ]);
      registerSideloadEngines(engines);
      registerPacks(packs, fontsMap);
      return packs;
    } finally {
      markReady();
    }
  }

  async function importPack(raw, engineSource, fontAsset) {
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
    if (fontAsset && fontAsset.id && rules && rules.saveCustomFonts) {
      const fonts = await rules.loadCustomFonts();
      fonts[fontAsset.id] = {
        id: fontAsset.id,
        name: fontAsset.name,
        mime: fontAsset.mime,
        dataUrl: fontAsset.dataUrl,
        bytes: fontAsset.bytes,
        family: fontAsset.family,
        format: fontAsset.format,
        updatedAt: Date.now(),
      };
      await rules.saveCustomFonts(fonts);
      pack.fontId = fontAsset.id;
      pack.fontFile = fontAsset.name;
      if (!pack.fontFamily) pack.fontFamily = fontAsset.family;
    } else if (pack.fontFile) {
      if (
        previous &&
        previous.fontId &&
        String(previous.fontFile || "").toLowerCase() === String(pack.fontFile).toLowerCase()
      ) {
        pack.fontId = previous.fontId;
        if (!pack.fontFamily) pack.fontFamily = previous.fontFamily || "";
      } else if (rules && rules.loadCustomFonts) {
        const fonts = await rules.loadCustomFonts();
        const id = fontIdFromFileName(pack.fontFile);
        if (fonts[id] && fonts[id].dataUrl) {
          pack.fontId = id;
          if (!pack.fontFamily) {
            pack.fontFamily = fonts[id].family || familyFromFileName(pack.fontFile);
          }
        }
      }
    } else {
      pack.fontId = "";
      pack.fontFile = "";
    }

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
    parsePack,
    peekEngineMeta,
    ingestFontFile,
    normalizeFontFileName,
    fontIdFromFileName,
    compileSideloadSource,
    registerSideloadEngines,
    registerPacks,
    loadAndRegister,
    whenReady,
    onChange,
    importPack,
    removePack,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
