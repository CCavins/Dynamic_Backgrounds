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
          ".orbit-ring .dyn-card{position:absolute!important;left:50%;top:50%;margin:0;border-radius:14px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.45);outline:3px solid rgba(255,255,255,.85);will-change:transform;}",
          ".orbit-ring .dyn-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}",
          ".orbit-ring .dyn-card img.orbit-base{z-index:0;}",
          ".orbit-ring .dyn-card img.orbit-next{z-index:1;opacity:0;transition:opacity .55s ease;}",
          ".orbit-ring .dyn-card img.orbit-next.is-in{opacity:1;}",
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
        const base = card.querySelector("img");
        if (base) base.classList.add("orbit-base");
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
        // Cards ~10% smaller than 0.35 short-side; orbit center is stage
        // center via translate(-50%,-50%) on each card.
        const short = Math.min(W, H);
        const cardH = Math.max(56, Math.min(short * 0.315, short * 0.378));
        const cardW = cardH * (2 / 3);
        const halfDiag = Math.hypot(cardW, cardH) / 2;
        const pad = Math.max(12, short * 0.04);
        const maxRadius = short / 2 - halfDiag - pad;
        // Slightly farther from center while staying inside the stage.
        const radius = Math.max(0, Math.min(maxRadius, short * 0.32));
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
            "translate(-50%, -50%) rotate(" +
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
      if (card.dataset.orbitDissolving === "1") return;
      const base =
        card.querySelector("img.orbit-base") || card.querySelector("img");
      const nextApi = hostApi || state.api;
      const src =
        nextApi && typeof nextApi.nextUrl === "function"
          ? nextApi.nextUrl(base && base.src)
          : (pool && pool[Math.floor(Math.random() * pool.length)]) || "";
      if (!base || !src) return;
      if ((base.currentSrc || base.src) === src) return;

      card.dataset.orbitDissolving = "1";
      let next = card.querySelector("img.orbit-next");
      if (!next) {
        next = document.createElement("img");
        next.className = "orbit-next";
        next.alt = "";
        card.appendChild(next);
      }
      next.classList.remove("is-in");
      next.style.opacity = "";

      const finish = () => {
        base.src = src;
        next.classList.remove("is-in");
        next.removeAttribute("src");
        next.src = "";
        card.dataset.orbitDissolving = "0";
      };

      const startDissolve = () => {
        // Force a frame so opacity 0 → 1 transitions.
        void next.offsetWidth;
        next.classList.add("is-in");
        window.setTimeout(finish, 580);
      };

      if (next.src === src && next.complete && next.naturalWidth > 0) {
        startDissolve();
        return;
      }
      next.onload = () => {
        next.onload = null;
        startDissolve();
      };
      next.onerror = () => {
        next.onerror = null;
        card.dataset.orbitDissolving = "0";
      };
      next.src = src;
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
