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
BGThemeEngines.define({
  id: "mosaic-orbit-swap-engine",
  kind: "mosaic",
  interval: 2400,

  mount(root, pool, api) {
    const mosaicApi = globalThis.BGMosaicThemes || {};
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

    let style = root.querySelector("style[data-orbit-engine]");
    if (!style) {
      style = document.createElement("style");
      style.setAttribute("data-orbit-engine", "");
      style.textContent = [
        ".orbit-stage{position:absolute;inset:0;container-type:size;}",
        ".orbit-ring{position:absolute;inset:0;}",
        ".orbit-ring .dyn-card{position:absolute!important;left:50%;top:50%;margin:0;border-radius:14px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.45);outline:3px solid rgba(255,255,255,.85);transition:opacity .28s ease,box-shadow .35s ease;will-change:transform;}",
        ".orbit-ring .dyn-card.is-front{z-index:24;box-shadow:0 28px 60px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.2);}",
        ".orbit-ring .dyn-card.is-swap{opacity:.15;}",
        ".orbit-ring .dyn-card img{width:100%;height:100%;object-fit:cover;display:block;}",
        ".orbit-chrome{position:absolute;z-index:5;width:min(12%,140px);aspect-ratio:1;pointer-events:none;}",
        ".orbit-logo{top:3.2%;left:3.2%;}",
        ".orbit-qr{top:3.2%;right:3.2%;}",
        ".orbit-chrome img,.orbit-chrome canvas,.orbit-chrome svg{width:100%;height:100%;object-fit:contain;display:block;}",
      ].join("");
      root.appendChild(style);
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
    root.appendChild(stage);
    root.appendChild(logo);
    root.appendChild(qr);

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
      api,
      ro: null,
      raf: 0,
      angle: 0,
      radius: 0,
      cardW: 0,
      cardH: 0,
      t0: performance.now(),
      // Full revolution every 28s — JS-driven so it always moves.
      periodMs: 18000,
    };

    const measure = () => {
      const W = ring.clientWidth;
      const H = ring.clientHeight;
      if (!W || !H) return false;
      const short = Math.min(W, H);
      const cardH = Math.max(40, Math.min(short * 0.2, short * 0.38));
      const cardW = cardH * (2 / 3);
      const halfDiag = Math.hypot(cardW, cardH) / 2;
      const pad = Math.max(14, short * 0.055);
      state.cardW = cardW;
      state.cardH = cardH;
      state.radius = Math.max(0, short / 2 - halfDiag - pad);
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
        const front = dist < step * 0.55;
        card.classList.toggle("is-front", front);
        card.style.zIndex = front ? "24" : String(Math.round(8 - dist / 45));
        const scale = front ? 1 : 0.88;
        // Upright cards circling the center (same pattern as built-in Orbit).
        card.style.transform =
          "rotate(" +
          deg.toFixed(2) +
          "deg) translateY(" +
          (-state.radius).toFixed(1) +
          "px) rotate(" +
          (-deg).toFixed(2) +
          "deg) scale(" +
          scale +
          ")";
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

  tick(_root, pool, state, api) {
    if (!state || !state.cards || !state.cards.length) return;
    const card = state.cards[Math.floor(Math.random() * state.cards.length)];
    const img = card.querySelector("img");
    const nextApi = api || state.api;
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

  unmount(root, state) {
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
    if (root) root.replaceChildren();
  },
});
