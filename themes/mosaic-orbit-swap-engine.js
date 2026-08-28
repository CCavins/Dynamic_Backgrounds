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

    const state = { stage, ring, cards, api, ro: null };
    const relayout = () => layoutCards(cards, ring);
    relayout();
    requestAnimationFrame(relayout);
    if (typeof ResizeObserver !== "undefined") {
      state.ro = new ResizeObserver(relayout);
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

function layoutCards(cards, ring) {
  if (!ring || !cards || !cards.length) return;
  const W = ring.clientWidth;
  const H = ring.clientHeight;
  if (!W || !H) return;

  // True circle in the stage, sized so rotated 2:3 cards stay inside.
  const short = Math.min(W, H);
  const cardH = Math.max(48, short * 0.26);
  const cardW = cardH * (2 / 3);
  const halfDiag = Math.hypot(cardW, cardH) / 2;
  const pad = Math.max(8, short * 0.03);
  const radius = Math.max(0, Math.min(W, H) / 2 - halfDiag - pad);

  cards.forEach((card, i) => {
    const a = (Math.PI * 2 * i) / cards.length - Math.PI / 2;
    const x = W / 2 + Math.cos(a) * radius;
    const y = H / 2 + Math.sin(a) * radius;
    card.style.width = cardW.toFixed(1) + "px";
    card.style.height = cardH.toFixed(1) + "px";
    card.style.left = x.toFixed(1) + "px";
    card.style.top = y.toFixed(1) + "px";
    card.style.transform =
      "translate(-50%, -50%) rotate(" + ((a * 180) / Math.PI + 90).toFixed(1) + "deg)";
  });
}
