(function (root) {
  const FORMAT = "dynamic-backgrounds-theme";
  const STYLE_ID = "dyn-custom-theme-style";
  const MAX_PACKS = 24;
  const MAX_CSS = 100000;
  const MAX_HTML = 50000;
  const RESERVED = new Set([
    "off",
    "led-scoreboard",
    "neon-nightclub",
    "ultras-tifo",
    "holo-card",
    "broadcast-tv",
    "liquid-glass",
    "parallax-drift",
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
  ]);

  let registeredIds = { message: [], mosaic: [] };

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
    const label = String(data.label || id).trim().slice(0, 80);
    const css = String(data.css || "");
    const html = String(data.html || "");
    if (css.length > MAX_CSS) throw new Error("css is too large.");
    if (html.length > MAX_HTML) throw new Error("html is too large.");
    if (looksUnsafe(css) || looksUnsafe(html)) {
      throw new Error("Theme contains disallowed script or event handlers.");
    }
    if (data.kind === "message" && !html.trim()) {
      throw new Error("Message themes need an html template.");
    }
    const settings = {};
    const srcSettings = data.settings && typeof data.settings === "object" ? data.settings : {};
    ["primary", "secondary", "background", "motion"].forEach((key) => {
      const spec = srcSettings[key];
      if (!spec || typeof spec !== "object") return;
      const next = { label: String(spec.label || key).slice(0, 40) };
      if (key === "motion") next.default = String(spec.default || "drift");
      else if (isHex(spec.default)) next.default = spec.default.toLowerCase();
      else if (key === "primary") next.default = "#d52265";
      else if (key === "secondary") next.default = "#fec651";
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
    return {
      format: FORMAT,
      version: 1,
      kind: data.kind,
      id,
      label,
      css,
      html,
      fonts: /^https:\/\/fonts\.googleapis\.com\//.test(String(data.fonts || ""))
        ? String(data.fonts)
        : "",
      settings,
      revealMs: Math.max(200, Math.min(4000, Number(data.revealMs) || 1000)),
      hideMs: Math.max(120, Math.min(2000, Number(data.hideMs) || 320)),
      layout: ["grid", "row", "scatter", "ribbon"].includes(data.layout) ? data.layout : "grid",
      cols: Math.max(1, Math.min(8, Number(data.cols) || 4)),
      rows: Math.max(1, Math.min(6, Number(data.rows) || 3)),
      count: Math.max(3, Math.min(24, Number(data.count) || 8)),
      interval: Math.max(800, Math.min(12000, Number(data.interval) || 2800)),
      fit,
    };
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
#dyn-mosaic-theme.dyn-layout-row .dyn-card {
  flex: 0 0 18%;
  height: 58%;
}
#dyn-mosaic-theme.dyn-layout-scatter .dyn-card {
  position: absolute;
  width: 18%;
  height: 28%;
}
#dyn-mosaic-theme.dyn-layout-ribbon .dyn-custom-cards {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  transform: rotate(-8deg) scale(1.08);
}
#dyn-mosaic-theme.dyn-layout-ribbon .dyn-card {
  width: 16%;
  height: 52%;
  flex: 0 0 16%;
}
#dyn-mosaic-theme.dyn-custom-mosaic .dyn-card {
  transition: opacity 0.22s ease, transform 0.4s ease;
}
#dyn-mosaic-theme.dyn-custom-mosaic .dyn-card.is-swap {
  opacity: 0.2;
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

  function injectFonts(packs) {
    document.querySelectorAll("link[data-dyn-custom-font]").forEach((node) => node.remove());
    const seen = new Set();
    (packs || []).forEach((pack) => {
      if (!pack.fonts || seen.has(pack.fonts)) return;
      seen.add(pack.fonts);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = pack.fonts;
      link.dataset.dynCustomFont = pack.id;
      document.head.appendChild(link);
    });
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

  function compileMessage(pack) {
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
    const count =
      pack.layout === "grid" ? pack.cols * pack.rows : pack.count;
    return {
      interval: pack.interval,
      mount(root, pool, api) {
        root.classList.add("dyn-custom-mosaic", "dyn-layout-" + pack.layout);
        root.style.setProperty("--cols", String(pack.cols));
        root.style.setProperty("--rows", String(pack.rows));
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
        card.classList.add("is-swap");
        window.setTimeout(() => {
          img.src = src;
          card.classList.remove("is-swap");
        }, 220);
      },
      unmount(root) {
        if (root) root.replaceChildren();
      },
    };
  }

  function registerPacks(packs) {
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
    injectFonts(packs);
  }

  async function loadAndRegister() {
    const rules = root.BGExtensionRules;
    if (!rules || typeof rules.loadCustomThemes !== "function") return [];
    const packs = await rules.loadCustomThemes();
    registerPacks(packs);
    return packs;
  }

  async function importPack(raw) {
    const pack = parsePack(raw);
    const rules = root.BGExtensionRules;
    const current = rules ? await rules.loadCustomThemes() : [];
    if (current.length >= MAX_PACKS && !current.some((item) => item.id === pack.id)) {
      throw new Error("Too many imported themes. Remove one first.");
    }
    const next = current.filter((item) => item.id !== pack.id);
    next.push(pack);
    if (rules) await rules.saveCustomThemes(next);
    registerPacks(next);
    return pack;
  }

  async function removePack(id) {
    const rules = root.BGExtensionRules;
    const current = rules ? await rules.loadCustomThemes() : [];
    const next = current.filter((item) => item.id !== id);
    if (rules) await rules.saveCustomThemes(next);
    registerPacks(next);
    return next;
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.customThemes) {
        const packs = Array.isArray(changes.customThemes.newValue)
          ? changes.customThemes.newValue
          : [];
        registerPacks(packs);
      }
    });
  } catch {
    /* popup or dead runtime */
  }

  loadAndRegister().catch(() => {});

  root.BGCustomThemes = {
    FORMAT,
    parsePack,
    registerPacks,
    loadAndRegister,
    importPack,
    removePack,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
