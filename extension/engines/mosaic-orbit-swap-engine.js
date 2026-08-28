/**
 * Dynamic Backgrounds theme engine
 * id: mosaic-orbit-swap-engine
 * kind: mosaic
 * Pairs with: themes/mosaic-orbit-swap.json
 *
 * Hooks used: interval, mount, tick, unmount
 * Helpers used: BGMosaicThemes.makeCard, api.nextUrl
 *
 * This file is a classic script. It must call BGThemeEngines.define({...}).
 * Do not use import/export. The same file ships in the extension and can be
 * sideloaded from the popup with the JSON pack.
 */
(function (global) {
  const enginesApi = global.BGThemeEngines;
  if (!enginesApi || typeof enginesApi.define !== "function") {
    throw new Error("BGThemeEngines is not loaded before mosaic-orbit-swap-engine.js");
  }

  enginesApi.define({
    id: "mosaic-orbit-swap-engine",
    kind: "mosaic",
    interval: 4200,

    mount(themeRoot, pool, hostApi) {
      const mosaicApi = global.BGMosaicThemes || {};
      const makeCard =
        mosaicApi.makeCard ||
        function (src) {
          const card = document.createElement("div");
          card.className = "dyn-card";
          const img = document.createElement("img");
          img.alt = "";
          img.src = src || "";
          card.appendChild(img);
          return card;
        };

      let style = themeRoot.querySelector("style[data-orbit-engine]");
      if (!style) {
        style = document.createElement("style");
        style.setAttribute("data-orbit-engine", "");
        style.textContent = [
          ".orbit-stage{position:absolute;inset:0;container-type:size;}",
          ".orbit-ring{position:absolute;inset:0;}",
          ".orbit-ring .dyn-card{position:absolute!important;left:50%;top:50%;margin:0;border-radius:14px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.45);outline:3px solid rgba(255,255,255,.85);transition:opacity .28s ease;will-change:transform;}",
          ".orbit-ring .dyn-card.is-swap{opacity:.15;}",
          ".orbit-ring .dyn-card img{width:100%;height:100%;object-fit:cover;display:block;}",
          ".orbit-chrome{position:absolute;z-index:5;width:min(12%,140px);aspect-ratio:1;pointer-events:none;}",
          ".orbit-logo{top:3.2%;left:3.2%;}",
          ".orbit-qr{top:3.2%;right:3.2%;}",
          ".orbit-chrome img,.orbit-chrome canvas,.orbit-chrome svg{width:100%;height:100%;object-fit:contain;display:block;}",
        ].join("");
        themeRoot.appendChild(style);
      }

      const stage = document.createElement("div");
      stage.className = "orbit-stage";

      const logo = document.createElement("div");
      logo.className = "orbit-chrome orbit-logo";
      logo.setAttribute("data-logo", "");
      const qr = document.createElement("div");
      qr.className = "orbit-chrome orbit-qr";
      qr.setAttribute("data-qr", "");

      const ring = document.createElement("div");
      ring.className = "orbit-ring";
      stage.appendChild(ring);
      themeRoot.appendChild(stage);
      themeRoot.appendChild(logo);
      themeRoot.appendChild(qr);

      const count = 6;
      const urls = [];
      const seen = new Set();
      (pool || []).forEach((src) => {
        if (!src || seen.has(src)) return;
        seen.add(src);
        urls.push(src);
      });
      const cards = [];
      for (let i = 0; i < count; i += 1) {
        const src = urls[i % Math.max(urls.length, 1)] || "";
        const card = makeCard(src);
        ring.appendChild(card);
        cards.push(card);
      }

      const state = {
        stage,
        ring,
        cards,
        api: hostApi,
        ro: null,
        raf: 0,
        angle: 0,
        radius: 0,
        cardW: 0,
        cardH: 0,
        t0: performance.now(),
        periodMs: 18000,
      };

      const measure = () => {
        const W = ring.clientWidth;
        const H = ring.clientHeight;
        if (!W || !H) return false;
        // ~75% larger than the prior 0.20 short-side card, kept on a true
        // centered circle so no edge is clipped more than another.
        const short = Math.min(W, H);
        const cardH = Math.max(56, Math.min(short * 0.35, short * 0.42));
        const cardW = cardH * (2 / 3);
        const halfDiag = Math.hypot(cardW, cardH) / 2;
        const pad = Math.max(12, short * 0.04);
        const maxRadius = short / 2 - halfDiag - pad;
        // Pull in toward center (tighter ring) while staying inside the stage.
        const radius = Math.max(0, Math.min(maxRadius, short * 0.28));
        state.cardW = cardW;
        state.cardH = cardH;
        state.radius = radius;
        cards.forEach((card) => {
          card.style.position = "absolute";
          card.style.left = "50%";
          card.style.top = "50%";
          card.style.width = cardW.toFixed(1) + "px";
          card.style.height = cardH.toFixed(1) + "px";
          card.style.margin = "0";
        });
        return true;
      };

      const paint = () => {
        const n = cards.length;
        const step = 360 / Math.max(n, 1);
        cards.forEach((card, i) => {
          const deg = state.angle + i * step;
          const wrapped = ((deg % 360) + 360) % 360;
          const dist = Math.min(wrapped, 360 - wrapped);
          // Z-order only — keep size constant all the way around.
          card.style.zIndex = String(Math.round(20 - dist / 18));
          card.style.transform =
            "rotate(" +
            deg.toFixed(2) +
            "deg) translateY(" +
            (-state.radius).toFixed(1) +
            "px) rotate(" +
            (-deg).toFixed(2) +
            "deg)";
        });
      };

      const frame = (now) => {
        if (!state.radius && !measure()) {
          state.raf = requestAnimationFrame(frame);
          return;
        }
        state.angle = (((now - state.t0) / state.periodMs) * 360) % 360;
        paint();
        state.raf = requestAnimationFrame(frame);
      };

      measure();
      paint();
      state.raf = requestAnimationFrame(frame);

      if (typeof ResizeObserver !== "undefined") {
        state.ro = new ResizeObserver(() => {
          measure();
          paint();
        });
        state.ro.observe(stage);
        state.ro.observe(ring);
      }

      return state;
    },

    tick(_themeRoot, pool, state, hostApi) {
      if (!state || !state.cards || !state.cards.length) return;
      const card = state.cards[Math.floor(Math.random() * state.cards.length)];
      const img = card.querySelector("img");
      const nextApi = hostApi || state.api;
      const src =
        nextApi && typeof nextApi.nextUrl === "function"
          ? nextApi.nextUrl(img && img.src)
          : (pool && pool[Math.floor(Math.random() * pool.length)]) || "";
      if (!img || !src) return;
      card.classList.add("is-swap");
      window.setTimeout(() => {
        img.src = src;
        card.classList.remove("is-swap");
      }, 220);
    },

    unmount(themeRoot, state) {
      if (state && state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      if (state && state.ro) {
        try {
          state.ro.disconnect();
        } catch {
          /* ignore */
        }
        state.ro = null;
      }
      if (themeRoot) themeRoot.replaceChildren();
    },
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
