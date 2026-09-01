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
  const STAGGER_MS = 55;
  const TOP_COUNT = 5;
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

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function pickUrls(pool, api, count, avoidList, recentBatches) {
    const avoidBatch = new Set((avoidList || []).filter(Boolean));
    const poolList = Array.isArray(pool) ? pool.filter(Boolean) : [];
    const seen = new Set();
    const uniquePool = [];
    poolList.forEach((src) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      uniquePool.push(src);
    });

    const recentSets = (recentBatches || []).map(
      (batch) => new Set((batch || []).filter(Boolean))
    );

    function batchKey(list) {
      return list
        .filter(Boolean)
        .slice()
        .sort()
        .join("\0");
    }

    function matchesRecent(list) {
      const key = batchKey(list);
      return recentSets.some((set) => batchKey([...set]) === key);
    }

    function pickOne(blocked) {
      if (api && typeof api.nextUrl === "function") {
        const next = api.nextUrl(blocked);
        if (next && !blocked.has(next)) return next;
      }
      const choices = uniquePool.filter((s) => s && !blocked.has(s));
      const pickFrom = choices.length ? choices : uniquePool;
      if (!pickFrom.length) return "";
      return pickFrom[Math.floor(Math.random() * pickFrom.length)];
    }

    let best = null;
    for (let tryBatch = 0; tryBatch < 8; tryBatch += 1) {
      const out = [];
      const used = new Set();
      for (let i = 0; i < count; i += 1) {
        let src = "";
        for (let attempt = 0; attempt < 16; attempt += 1) {
          const blocked = new Set(used);
          if (attempt < 10) avoidBatch.forEach((s) => blocked.add(s));
          src = pickOne(blocked);
          if (!src) break;
          if (!used.has(src) && (attempt >= 10 || !avoidBatch.has(src))) break;
          if (attempt >= 10) break;
          src = "";
        }
        if (!src) src = uniquePool[out.length % Math.max(uniquePool.length, 1)] || "";
        if (src) used.add(src);
        out.push(src);
      }
      const shuffled = shuffle(out);
      if (!matchesRecent(shuffled) || tryBatch >= 7) {
        best = shuffled;
        break;
      }
    }
    return best || shuffle(uniquePool.slice(0, count));
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
          ".sr-rows{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;justify-content:center;gap:clamp(10px,3.2cqh,36px);padding:clamp(8%,7cqh,14%) 4.5% clamp(8%,7cqh,14%) 1.5%;box-sizing:border-box;transition:padding .45s ease,gap .45s ease;}",
          ".sr-row{display:flex;justify-content:center;align-items:center;gap:clamp(8px,1.4cqw,22px);width:100%;position:relative;transform:translateX(-1.2cqw);}",
          /* Slot = motion + fade together so the card shadow does not shimmer separately. */
          '#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .sr-row .sr-slot{position:relative;flex:0 0 auto;width:var(--sr-card-w,12cqw);aspect-ratio:2/3;height:auto;transform:skewX(-16deg) translate3d(var(--sr-x,0px),0,0);opacity:var(--sr-o,0);will-change:transform,opacity;transition:transform 900ms cubic-bezier(.25,.82,.25,1),opacity 750ms cubic-bezier(.25,.82,.25,1);backface-visibility:hidden;}',
          '#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .sr-row .sr-slot.is-hold{transition:none;}',
          '#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .sr-row .sr-slot.is-exiting{transition:transform 850ms cubic-bezier(.37,0,.2,1),opacity 700ms cubic-bezier(.37,0,.2,1);}',
          '#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .sr-row .sr-slot .dyn-card{position:absolute!important;inset:0;margin:0;width:100%!important;height:100%!important;padding:clamp(5px,.55cqw,10px);box-sizing:border-box;background:#fff;border-radius:2px;overflow:hidden;transform:none!important;box-shadow:0 14px 28px rgba(0,0,0,.4)!important;filter:none!important;opacity:1!important;transition:none;}',
          '#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .sr-row .sr-slot .sr-well{position:absolute;inset:clamp(5px,.55cqw,10px);overflow:hidden;background:#1a1a1a;opacity:1;transition:none;}',
          '#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .sr-row .sr-slot .sr-well img{position:absolute;left:50%;top:50%;width:148%;height:115%;max-width:none;object-fit:cover;object-position:center center;display:block;transform:translate(-50%,-50%) skewX(16deg);filter:grayscale(1) contrast(1.08);}',
          ".sr-chrome{position:absolute;z-index:6;width:min(11.5%,132px);aspect-ratio:1;pointer-events:none;}",
          ".sr-logo{top:3.4%;left:3.2%;}",
          ".sr-qr{bottom:3.4%;right:3.2%;}",
          ".sr-chrome img,.sr-chrome canvas,.sr-chrome svg{width:100%;height:100%;object-fit:contain;display:block;}",
          '#dyn-mosaic-theme.dyn-show-logo[data-theme="mosaic-slant-rows"] .sr-shapes .sr-shape:nth-child(1),',
          '#dyn-mosaic-theme.dyn-show-logo[data-theme="mosaic-slant-rows"] .sr-shapes .sr-shape:nth-child(3){opacity:.18;transform:scale(.7);}',
          '#dyn-mosaic-theme.dyn-show-qr[data-theme="mosaic-slant-rows"] .sr-shapes .sr-shape:nth-child(7),',
          '#dyn-mosaic-theme.dyn-show-qr[data-theme="mosaic-slant-rows"] .sr-shapes .sr-shape:nth-child(8){opacity:.18;transform:scale(.7);}',
          '#dyn-mosaic-theme.dyn-show-logo[data-theme="mosaic-slant-rows"] .sr-rows{padding-top:clamp(11%,9cqh,16%);}',
          '#dyn-mosaic-theme.dyn-show-qr[data-theme="mosaic-slant-rows"] .sr-rows{padding-bottom:clamp(11%,9cqh,16%);}',
          '#dyn-mosaic-theme.dyn-show-logo.dyn-show-qr[data-theme="mosaic-slant-rows"] .sr-rows{padding-top:clamp(11%,9cqh,16%);padding-bottom:clamp(11%,9cqh,16%);gap:clamp(8px,2.4cqh,28px);}',
          '#dyn-mosaic-theme.dyn-portrait[data-theme="mosaic-slant-rows"] .sr-row{gap:clamp(6px,1.8cqw,14px);transform:translateX(-0.6cqw);}',
          '#dyn-mosaic-theme.dyn-portrait[data-theme="mosaic-slant-rows"] .sr-rows{padding-left:2%;padding-right:5%;gap:clamp(12px,2.8cqh,28px);}',
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
        slots: [],
        batchUrls: [],
        recentBatches: [],
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
        const base = portrait ? 18 : 11.8;
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

      const setSlotPose = (slot, x, o) => {
        slot.style.setProperty("--sr-x", x);
        slot.style.setProperty("--sr-o", String(o));
      };

      const whenCardsReady = () =>
        Promise.all(
          state.slots.map((slot) => {
            const img = slot.querySelector("img");
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
        state.slots = [];
        state.cards = [];
        const topN = TOP_COUNT;
        const botN = BOTTOM_COUNT;
        for (let i = 0; i < topN + botN; i += 1) {
          const src = state.batchUrls[i] || "";
          const card = state.makeCard(src);
          const img = card.querySelector("img");
          const well = document.createElement("div");
          well.className = "sr-well";
          if (img) well.appendChild(img);
          card.appendChild(well);

          const slot = document.createElement("div");
          slot.className = "sr-slot is-hold";
          slot.dataset.row = i < topN ? "top" : "bot";
          slot.dataset.idx = String(i < topN ? i : i - topN);
          slot.appendChild(card);
          setSlotPose(slot, "0px", 0);

          if (i < topN) topRow.appendChild(slot);
          else bottomRow.appendChild(slot);
          state.slots.push(slot);
          state.cards.push(card);
        }
      };

      const enterCards = () => {
        if (state.phase === "unmount") return;
        state.phase = "enter";
        state.slots.forEach((slot) => {
          const fromLeft = slot.dataset.row === "top";
          slot.classList.remove("is-exiting");
          slot.classList.add("is-hold");
          slot.style.transitionDelay = "0ms";
          setSlotPose(slot, fromLeft ? "-115vw" : "115vw", 0);
        });
        void topRow.offsetWidth;
        global.requestAnimationFrame(() => {
          global.requestAnimationFrame(() => {
            if (state.phase === "unmount") return;
            state.slots.forEach((slot) => {
              const idx = Number(slot.dataset.idx) || 0;
              slot.classList.remove("is-hold");
              slot.style.transitionDelay = idx * STAGGER_MS + "ms";
              setSlotPose(slot, "0px", 1);
            });
          });
        });
        const maxIdx = Math.max(TOP_COUNT - 1, BOTTOM_COUNT - 1);
        const enterDone = ENTER_MS + maxIdx * STAGGER_MS + 40;
        schedule(() => {
          state.slots.forEach((slot) => {
            slot.classList.add("is-hold");
            slot.style.transitionDelay = "0ms";
            setSlotPose(slot, "0px", 1);
          });
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

        state.slots.forEach((slot) => {
          const idx = Number(slot.dataset.idx) || 0;
          slot.classList.remove("is-hold");
          slot.classList.add("is-exiting");
          slot.style.transitionDelay = idx * STAGGER_MS + "ms";
        });
        void topRow.offsetWidth;
        global.requestAnimationFrame(() => {
          global.requestAnimationFrame(() => {
            if (state.phase === "unmount") return;
            state.slots.forEach((slot) => {
              const dir = slot.dataset.row === "top" ? topDir : botDir;
              const endX = dir > 0 ? "115vw" : "-115vw";
              setSlotPose(slot, endX, 0);
            });
          });
        });
        const maxIdx = Math.max(TOP_COUNT - 1, BOTTOM_COUNT - 1);
        schedule(() => {
          refillAndEnter();
        }, EXIT_MS + maxIdx * STAGGER_MS + 80);
      };

      const refillAndEnter = () => {
        if (state.phase === "unmount") return;
        state.cycle += 1;
        const avoid = state.batchUrls.slice();
        // Clear exiting cards before picking so nextUrl is not pinned to overlay DOM order.
        topRow.replaceChildren();
        bottomRow.replaceChildren();
        state.slots = [];
        state.cards = [];
        const urls = pickUrls(
          state.pool,
          state.api,
          TOP_COUNT + BOTTOM_COUNT,
          avoid,
          state.recentBatches
        );
        if (!state.recentBatches) state.recentBatches = [];
        state.recentBatches.unshift(urls.slice());
        if (state.recentBatches.length > 4) state.recentBatches.length = 4;
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
        if (!state.recentBatches) state.recentBatches = [];
        state.recentBatches.unshift(urls.slice());
        if (state.recentBatches.length > 4) state.recentBatches.length = 4;
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
