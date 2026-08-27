/**
 * Dynamic Backgrounds theme engine
 * id: example-orbit-swap
 * kind: mosaic
 * Pairs with: themes/example-mosaic-engine.json
 *
 * Hooks used: interval, mount, tick, unmount
 * Helpers used: BGMosaicThemes.makeCard, api.nextUrl
 *
 * This file is a classic script. It must call BGThemeEngines.define({...}).
 * Do not use import/export. The same file ships in the extension and can be
 * sideloaded from the popup with the JSON pack.
 */
BGThemeEngines.define({
  id: "example-orbit-swap",
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
    const ring = document.createElement("div");
    ring.className = "orbit-ring";
    stage.appendChild(ring);
    root.appendChild(stage);

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
    layoutCards(cards);
    return { stage, ring, cards, api };
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

  unmount(root) {
    if (root) root.replaceChildren();
  },
});

function layoutCards(cards) {
  const radiusX = 32;
  const radiusY = 30;
  cards.forEach((card, i) => {
    const a = (Math.PI * 2 * i) / cards.length - Math.PI / 2;
    card.style.left = (50 + Math.cos(a) * radiusX).toFixed(2) + "%";
    card.style.top = (50 + Math.sin(a) * radiusY).toFixed(2) + "%";
    card.style.transform =
      "translate(-50%, -50%) rotate(" + ((a * 180) / Math.PI + 90).toFixed(1) + "deg)";
  });
}
