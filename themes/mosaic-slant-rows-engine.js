/**
 * Dynamic Backgrounds theme engine
 * id: mosaic-slant-rows-engine
 * kind: mosaic
 * Pairs with: mosaic-slant-rows.json
 *
 * Two slanted photo rows: a fixed batch animates in, holds ~5.5s
 * unchanged (no mid-hold swaps), exits opposite directions, then a
 * new batch is picked and the loop repeats.
 *
 * Hooks: interval, mount, tick, applySettings, unmount
 * Helpers: BGMosaicThemes.makeCard, api.nextUrl
 */
(function (global) {
  const enginesApi = global.BGThemeEngines;
  if (!enginesApi || typeof enginesApi.define !== "function") {
    throw new Error("BGThemeEngines is not loaded before mosaic-slant-rows-engine.js");
  }

  const HOLD_MS = 5500;
  const ENTER_MS = 900;
  const EXIT_MS = 850;
  const STAGGER_MS = 70;
  const TOP_COUNT = 4;
  const BOTTOM_COUNT = 5;

  function makeFallbackCard(src) {
    const card = document.createElement("div");
    card.className = "dyn-card";
    const img = document.createElement("img");
    img.alt = "";
    img.src = src || "";
    card.appendChild(img);
    return card;
  }

  function pickUrls(pool, api, count, avoid) {
    const out = [];
    const used = new Set(avoid || []);
    const list = Array.isArray(pool) ? pool.filter(Boolean) : [];
    for (let i = 0; i < count; i += 1) {
      let src = "";
      if (api && typeof api.nextUrl === "function") {
        src = api.nextUrl(used) || "";
      }
      if (!src && list.length) {
        for (let tries = 0; tries < list.length; tries += 1) {
          const candidate = list[(i + tries) % list.length];
          if (candidate && !used.has(candidate)) {
            src = candidate;
            break;
          }
        }
        if (!src) src = list[i % list.length] || "";
      }
      if (src) used.add(src);
      out.push(src || "");
    }
    return out;
  }

  function buildShapes(layer) {
    const shapes = [
      { cls: "sr-pill", style: "top:6%;left:-4%;width:38%;height:7%" },
      { cls: "sr-pill sr-sec", style: "top:4%;right:-6%;width:42%;height:9%" },
      { cls: "sr-circle", style: "top:14%;left:18%;width:5.5%;aspect-ratio:1" },
      { cls: "sr-circle sr-sec", style: "top:10%;right:22%;width:4%;aspect-ratio:1" },
      { cls: "sr-half", style: "top:2%;left:42%;width:9%;aspect-ratio:2/1" },
      { cls: "sr-pill", style: "bottom:8%;left:-8%;width:46%;height:8%" },
      { cls: "sr-pill sr-sec", style: "bottom:5%;right:-4%;width:36%;height:7%" },
      { cls: "sr-circle", style: "bottom:16%;right:16%;width:6%;aspect-ratio:1" },
      { cls: "sr-circle sr-sec", style: "bottom:12%;left:28%;width:3.5%;aspect-ratio:1" },
      { cls: "sr-half sr-flip", style: "bottom:3%;left:48%;width:10%;aspect-ratio:2/1" },
    ];
    shapes.forEach((s) => {
      const el = document.createElement("div");
      el.className = "sr-shape " + s.cls;
      el.setAttribute("style", s.style);
      layer.appendChild(el);
    });

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "sr-traces");
    svg.setAttribute("viewBox", "0 0 1600 900");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    const paths = [
      "M80 120 C220 40, 360 180, 520 110 S820 40, 980 130",
      "M1100 60 C1220 120, 1380 40, 1520 100",
      "M60 780 C200 720, 340 840, 520 780 S860 700, 1040 790",
      "M1180 820 C1300 760, 1420 840, 1540 780",
      "M200 200 C280 260, 240 340, 360 300",
      "M1280 700 C1360 640, 1440 720, 1500 680",
    ];
    paths.forEach((d, i) => {
      const p = document.createElementNS(svgNS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", i % 2 ? "sr-trace sr-sec" : "sr-trace");
      svg.appendChild(p);
      const end = d.trim().split(/[\s,]+/).slice(-2);
      if (end.length === 2) {
        const c = document.createElementNS(svgNS, "circle");
        c.setAttribute("cx", end[0]);
        c.setAttribute("cy", end[1]);
        c.setAttribute("r", "5");
        c.setAttribute("class", i % 2 ? "sr-dot sr-sec" : "sr-dot");
        svg.appendChild(c);
      }
    });
    layer.appendChild(svg);
  }

  enginesApi.define({
    id: "mosaic-slant-rows-engine",
    kind: "mosaic",
    interval: 7000,

    mount(themeRoot, pool, hostApi, settings) {
      const mosaicApi = global.BGMosaicThemes || {};
      const makeCard = mosaicApi.makeCard || makeFallbackCard;

      let style = themeRoot.querySelector("style[data-slant-rows-engine]");
      if (!style) {
        style = document.createElement("style");
        style.setAttribute("data-slant-rows-engine", "");
        style.textContent = [
          ".sr-stage{position:absolute;inset:0;container-type:size;overflow:hidden;}",
          ".sr-texture{position:absolute;inset:0;z-index:0;pointer-events:none;background:var(--background,#141414);}",
          ".sr-texture::after{content:\"\";position:absolute;inset:0;opacity:.55;mix-blend-mode:overlay;background-image:var(--sr-texture,none);background-size:cover;background-position:center;}",
          ".sr-halftone{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.22;background-image:radial-gradient(circle,#000 1.1px,transparent 1.2px);background-size:7px 7px;}",
          ".sr-shapes{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;}",
          ".sr-shape{position:absolute;background:var(--primary,#e31b23);border-radius:999px;will-change:transform;}",
          ".sr-shape.sr-sec{background:var(--secondary,#f36c1b);}",
          ".sr-circle{border-radius:50%;}",
          ".sr-half{border-radius:999px 999px 0 0;height:auto;}",
          ".sr-half.sr-flip{border-radius:0 0 999px 999px;}",
          ".sr-traces{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}",
          ".sr-trace{fill:none;stroke:var(--primary,#e31b23);stroke-width:2.2;stroke-linecap:round;opacity:.92;}",
          ".sr-trace.sr-sec{stroke:var(--secondary,#f36c1b);}",
          ".sr-dot{fill:var(--primary,#e31b23);}",
          ".sr-dot.sr-sec{fill:var(--secondary,#f36c1b);}",
          ".sr-rows{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;justify-content:center;gap:clamp(10px,3.2cqh,36px);padding:clamp(8%,7cqh,14%) clamp(3%,3cqw,4%);box-sizing:border-box;transition:padding .45s ease,gap .45s ease;}",
          ".sr-row{display:flex;justify-content:center;align-items:center;gap:clamp(10px,1.8cqw,28px);width:100%;position:relative;}",
          /* opacity !important beats mosaic-themes.js `.dyn-card:not(.dyn-feed-ready){opacity:0!important}`
             so enter/exit --sr-o animation can run (and batch refills do not stay stuck black). */
          '#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .sr-row .dyn-card{position:relative!important;flex:0 0 auto;margin:0;width:var(--sr-card-w,14cqw);aspect-ratio:2/3;height:auto;padding:clamp(5px,.55cqw,10px);box-sizing:border-box;background:#fff;border-radius:2px;overflow:hidden;transform:skewX(-16deg) translate3d(var(--sr-x,0),var(--sr-y,0),0) scale(var(--sr-s,1));opacity:var(--sr-o,0)!important;filter:grayscale(1) contrast(1.05);box-shadow:0 14px 34px rgba(0,0,0,.42);will-change:transform,opacity;transition:none;}',
          '#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .sr-row .dyn-card img{position:absolute;inset:clamp(5px,.55cqw,10px);width:100%;height:100%;object-fit:cover;object-position:center center;display:block;transform:skewX(16deg);transform-origin:center center;filter:grayscale(1) contrast(1.08);}',
          '#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .sr-row .dyn-card.is-animating{transition:transform .9s cubic-bezier(.22,.82,.2,1),opacity .75s ease;}',
          '#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .sr-row .dyn-card.is-exiting{transition:transform .85s cubic-bezier(.45,.05,.55,1),opacity .7s ease;}',
          ".sr-chrome{position:absolute;z-index:6;width:min(11.5%,132px);aspect-ratio:1;pointer-events:none;}",
          ".sr-logo{top:3.4%;left:3.2%;}",
          ".sr-qr{bottom:3.4%;right:3.2%;}",
          ".sr-chrome img,.sr-chrome canvas,.sr-chrome svg{width:100%;height:100%;object-fit:contain;display:block;}",
          /* Clear busy shapes near chrome when toggled */
          '#dyn-mosaic-theme.dyn-show-logo[data-theme="mosaic-slant-rows"] .sr-shapes .sr-shape:nth-child(1),',
          '#dyn-mosaic-theme.dyn-show-logo[data-theme="mosaic-slant-rows"] .sr-shapes .sr-shape:nth-child(3){opacity:.18;transform:scale(.7);}',
          '#dyn-mosaic-theme.dyn-show-qr[data-theme="mosaic-slant-rows"] .sr-shapes .sr-shape:nth-child(7),',
          '#dyn-mosaic-theme.dyn-show-qr[data-theme="mosaic-slant-rows"] .sr-shapes .sr-shape:nth-child(8){opacity:.18;transform:scale(.7);}',
          '#dyn-mosaic-theme.dyn-show-logo[data-theme="mosaic-slant-rows"] .sr-rows{padding-top:clamp(11%,9cqh,16%);}',
          '#dyn-mosaic-theme.dyn-show-qr[data-theme="mosaic-slant-rows"] .sr-rows{padding-bottom:clamp(11%,9cqh,16%);}',
          '#dyn-mosaic-theme.dyn-show-logo.dyn-show-qr[data-theme="mosaic-slant-rows"] .sr-rows{padding-top:clamp(11%,9cqh,16%);padding-bottom:clamp(11%,9cqh,16%);gap:clamp(8px,2.4cqh,28px);}',
          /* Portrait: stack density, slightly smaller cards */
          '#dyn-mosaic-theme.dyn-portrait[data-theme="mosaic-slant-rows"] .sr-row{gap:clamp(8px,2.2cqw,16px);}',
          '#dyn-mosaic-theme.dyn-portrait[data-theme="mosaic-slant-rows"] .sr-rows{padding-left:4%;padding-right:4%;gap:clamp(12px,2.8cqh,28px);}',
          '#dyn-mosaic-theme.dyn-portrait[data-theme="mosaic-slant-rows"] .sr-chrome{width:min(18%,120px);}',
        ].join("");
        themeRoot.appendChild(style);
      }

      const stage = document.createElement("div");
      stage.className = "sr-stage";

      const texture = document.createElement("div");
      texture.className = "sr-texture";
      const halftone = document.createElement("div");
      halftone.className = "sr-halftone";
      const shapes = document.createElement("div");
      shapes.className = "sr-shapes";
      buildShapes(shapes);

      const rowsWrap = document.createElement("div");
      rowsWrap.className = "sr-rows";
      const topRow = document.createElement("div");
      topRow.className = "sr-row sr-row-top";
      const bottomRow = document.createElement("div");
      bottomRow.className = "sr-row sr-row-bottom";
      rowsWrap.appendChild(topRow);
      rowsWrap.appendChild(bottomRow);

      const logo = document.createElement("div");
      logo.className = "sr-chrome sr-logo";
      logo.setAttribute("data-logo", "");
      const qr = document.createElement("div");
      qr.className = "sr-chrome sr-qr";
      qr.setAttribute("data-qr", "");

      stage.appendChild(texture);
      stage.appendChild(halftone);
      stage.appendChild(shapes);
      stage.appendChild(rowsWrap);
      themeRoot.appendChild(stage);
      themeRoot.appendChild(logo);
      themeRoot.appendChild(qr);

      const state = {
        stage,
        topRow,
        bottomRow,
        rowsWrap,
        api: hostApi,
        pool: pool || [],
        cards: [],
        batchUrls: [],
        timers: [],
        phase: "idle",
        cycle: 0,
        exitFlip: 0,
        ro: null,
        makeCard,
        settings: settings || {},
      };

      const applyScale = () => {
        const scale =
          state.settings && state.settings.scale != null
            ? Number(state.settings.scale)
            : 1;
        const s = Math.max(0.7, Math.min(1.5, scale || 1));
        const portrait = themeRoot.classList.contains("dyn-portrait");
        const base = portrait ? 22 : 13.5;
        themeRoot.style.setProperty("--sr-card-w", (base * s).toFixed(2) + "cqw");
        themeRoot.style.setProperty("--scale", String(s));
      };

      const applyColors = () => {
        const s = state.settings || {};
        if (s.primary) themeRoot.style.setProperty("--primary", s.primary);
        if (s.secondary) themeRoot.style.setProperty("--secondary", s.secondary);
        if (s.background) themeRoot.style.setProperty("--background", s.background);
      };

      const clearTimers = () => {
        (state.timers || []).forEach((id) => global.clearTimeout(id));
        state.timers = [];
      };

      const schedule = (fn, ms) => {
        const id = global.setTimeout(fn, ms);
        state.timers.push(id);
        return id;
      };

      const setCardPose = (card, x, y, o, sc) => {
        card.style.setProperty("--sr-x", x);
        card.style.setProperty("--sr-y", y || "0px");
        card.style.setProperty("--sr-o", String(o));
        card.style.setProperty("--sr-s", String(sc == null ? 1 : sc));
      };

      const whenCardsReady = () =>
        Promise.all(
          state.cards.map((card) => {
            const img = card.querySelector("img");
            if (!img || !img.getAttribute("src")) return Promise.resolve();
            if (img.complete && img.naturalWidth) return Promise.resolve();
            return new Promise((resolve) => {
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            });
          })
        );

      const buildRows = (urls) => {
        // Lock this set for the whole enter→hold→exit cycle.
        state.batchUrls = (urls || []).slice();
        topRow.replaceChildren();
        bottomRow.replaceChildren();
        state.cards = [];
        const topN = TOP_COUNT;
        const botN = BOTTOM_COUNT;
        for (let i = 0; i < topN + botN; i += 1) {
          const src = state.batchUrls[i] || "";
          const card = state.makeCard(src);
          card.classList.add(i < topN ? "sr-top" : "sr-bot");
          card.dataset.row = i < topN ? "top" : "bot";
          card.dataset.idx = String(i < topN ? i : i - topN);
          setCardPose(card, "0px", "18px", 0, 0.86);
          if (i < topN) topRow.appendChild(card);
          else bottomRow.appendChild(card);
          state.cards.push(card);
        }
      };

      const enterCards = () => {
        if (state.phase === "unmount") return;
        state.phase = "enter";
        state.cards.forEach((card, i) => {
          const row = card.dataset.row;
          const idx = Number(card.dataset.idx) || 0;
          const fromLeft = row === "top";
          const startX = fromLeft
            ? -(48 + idx * 8) + "%"
            : 48 + idx * 8 + "%";
          card.classList.remove("is-exiting");
          card.classList.add("is-animating");
          setCardPose(card, startX, "22px", 0, 0.82);
          schedule(() => {
            setCardPose(card, "0%", "0px", 1, 1);
          }, 30 + i * STAGGER_MS);
        });
        const enterDone = ENTER_MS + state.cards.length * STAGGER_MS;
        schedule(() => {
          state.cards.forEach((c) => c.classList.remove("is-animating"));
          state.phase = "hold";
          schedule(exitCards, HOLD_MS);
        }, enterDone);
      };

      const exitCards = () => {
        if (state.phase === "unmount") return;
        state.phase = "exit";
        state.exitFlip = 1 - (state.exitFlip || 0);
        const topDir = state.exitFlip ? 1 : -1;
        const botDir = -topDir;
        state.cards.forEach((card, i) => {
          const row = card.dataset.row;
          const idx = Number(card.dataset.idx) || 0;
          const dir = row === "top" ? topDir : botDir;
          const endX = dir * (55 + idx * 10) + "%";
          card.classList.add("is-exiting");
          schedule(() => {
            setCardPose(card, endX, "8px", 0, 0.92);
          }, i * 35);
        });
        schedule(() => {
          refillAndEnter();
        }, EXIT_MS + state.cards.length * 35 + 80);
      };

      const refillAndEnter = () => {
        if (state.phase === "unmount") return;
        state.cycle += 1;
        // Only place new photos after the previous batch has fully exited.
        const avoid = state.batchUrls.slice();
        const urls = pickUrls(
          state.pool,
          state.api,
          TOP_COUNT + BOTTOM_COUNT,
          avoid
        );
        buildRows(urls);
        applyScale();
        whenCardsReady().then(() => {
          if (state.phase === "unmount") return;
          schedule(() => enterCards(), 40);
        });
      };

      const start = () => {
        clearTimers();
        applyColors();
        applyScale();
        const urls = pickUrls(state.pool, state.api, TOP_COUNT + BOTTOM_COUNT);
        buildRows(urls);
        whenCardsReady().then(() => {
          if (state.phase === "unmount") return;
          schedule(() => enterCards(), 60);
        });
      };

      state._applyScale = applyScale;
      state._applyColors = applyColors;
      state._clearTimers = clearTimers;
      state._start = start;
      state._refill = refillAndEnter;

      if (typeof ResizeObserver !== "undefined") {
        state.ro = new ResizeObserver(() => applyScale());
        state.ro.observe(stage);
      }

      start();
      return state;
    },

    tick(_root, pool, state, hostApi) {
      if (!state) return;
      // Never swap on-screen cards here — batch is locked until exit.
      if (pool) state.pool = pool;
      if (hostApi) state.api = hostApi;
    },

    applySettings(themeRoot, state, settings) {
      if (!state) return;
      state.settings = settings || {};
      if (state._applyColors) state._applyColors();
      if (state._applyScale) state._applyScale();
      if (themeRoot && settings) {
        if (settings.primary) themeRoot.style.setProperty("--primary", settings.primary);
        if (settings.secondary) themeRoot.style.setProperty("--secondary", settings.secondary);
        if (settings.background) themeRoot.style.setProperty("--background", settings.background);
      }
    },

    unmount(themeRoot, state) {
      if (state) {
        state.phase = "unmount";
        if (state._clearTimers) state._clearTimers();
        if (state.ro) {
          try {
            state.ro.disconnect();
          } catch {
            /* ignore */
          }
          state.ro = null;
        }
      }
      if (themeRoot) themeRoot.replaceChildren();
    },
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
