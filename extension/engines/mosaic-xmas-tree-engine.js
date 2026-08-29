/**
 * Dynamic Backgrounds theme engine
 * id: mosaic-xmas-tree-engine
 * kind: mosaic
 * Pairs with: themes/mosaic-xmas-tree.json
 *
 * Hooks used: interval, mount, tick, unmount
 * Helpers used: BGMosaicThemes.makeCard, api.nextUrl
 */
(function (global) {
  const enginesApi = global.BGThemeEngines;
  if (!enginesApi || typeof enginesApi.define !== "function") {
    throw new Error("BGThemeEngines is not loaded before mosaic-xmas-tree-engine.js");
  }

  // Rows: 1, 2, 3, 4. Spacing opened a bit for larger cards.
  function treeSlots(portrait) {
    const rows = [
      [{ x: 50, y: portrait ? 13 : 15 }],
      [
        { x: 38, y: portrait ? 36 : 38 },
        { x: 62, y: portrait ? 36 : 38 },
      ],
      [
        { x: 28, y: portrait ? 59 : 61 },
        { x: 50, y: portrait ? 59 : 61 },
        { x: 72, y: portrait ? 59 : 61 },
      ],
      [
        { x: 20, y: portrait ? 82 : 84 },
        { x: 40, y: portrait ? 82 : 84 },
        { x: 60, y: portrait ? 82 : 84 },
        { x: 80, y: portrait ? 82 : 84 },
      ],
    ];
    const out = [];
    rows.forEach((row, ri) => {
      row.forEach((slot, ci) => {
        out.push({
          x: slot.x,
          y: slot.y,
          rot: ((ri + ci) % 2 === 0 ? -1 : 1) * (1.6 + (ci % 3) * 0.5),
          row: ri,
          col: ci,
        });
      });
    });
    return out;
  }

  // Hang ornaments from the bottom corners of upper-row cards into the gaps.
  function hangSlotsFromCards(layout, cardWPct, cardHPct) {
    const kinds = ["gold", "red", "green", "blue", "red", "gold"];
    const sways = ["s2", "s3", "", "s2", "s3", ""];
    const pts = [];
    layout.forEach((slot) => {
      if (slot.row >= 3) return;
      const bottom = slot.y + cardHPct * 0.48;
      const rowLen = layout.filter((s) => s.row === slot.row).length;
      const isLeftEdge = slot.col === 0;
      const isRightEdge = slot.col === rowLen - 1;
      // Keep ornaments tucked under the card — on the tree, not in the wings.
      if (isLeftEdge) {
        pts.push({
          x: slot.x - cardWPct * 0.12,
          y: bottom,
          kind: kinds[pts.length % kinds.length],
          sway: sways[pts.length % sways.length],
        });
      }
      if (isRightEdge) {
        pts.push({
          x: slot.x + cardWPct * 0.12,
          y: bottom,
          kind: kinds[pts.length % kinds.length],
          sway: sways[pts.length % sways.length],
        });
      }
    });
    return pts
      .filter((p, i, arr) => !arr.slice(0, i).some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 5))
      .slice(0, 6);
  }

  // Lights on card rims. Top photo uses bottom corners so the star stays clear;
  // other rows use top corners + midpoints between neighbors.
  function lightSlotsFromCards(layout, cardWPct, cardHPct) {
    const colors = ["c-red", "c-gold", "c-green", "c-blue", "c-pink"];
    const delays = ["", "d2", "d3", "d4"];
    const pts = [];
    const byRow = [[], [], [], []];
    layout.forEach((slot) => {
      if (slot.row == null || slot.row < 0 || slot.row > 3) return;
      byRow[slot.row].push(slot);
      if (slot.row === 0) {
        const bottom = slot.y + cardHPct * 0.5;
        pts.push({ x: slot.x - cardWPct * 0.5, y: bottom });
        pts.push({ x: slot.x + cardWPct * 0.5, y: bottom });
        return;
      }
      const top = slot.y - cardHPct * 0.5;
      pts.push({ x: slot.x - cardWPct * 0.5, y: top });
      pts.push({ x: slot.x + cardWPct * 0.5, y: top });
    });
    byRow.forEach((row, rowIndex) => {
      if (rowIndex === 0) return;
      row.sort((a, b) => a.x - b.x);
      for (let i = 0; i < row.length - 1; i += 1) {
        const top = row[i].y - cardHPct * 0.5;
        pts.push({
          x: (row[i].x + row[i + 1].x) / 2,
          y: top - 0.4,
        });
      }
    });
    return pts.slice(0, 22).map((p, i) => ({
      x: p.x,
      y: Math.max(2, Math.min(94, p.y)),
      color: colors[i % colors.length],
      delay: delays[i % delays.length],
    }));
  }

  enginesApi.define({
    id: "mosaic-xmas-tree-engine",
    kind: "mosaic",
    interval: 3800,

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

      let style = themeRoot.querySelector("style[data-xmas-tree-engine]");
      if (!style) {
        style = document.createElement("style");
        style.setAttribute("data-xmas-tree-engine", "");
        style.textContent = [
          ".xmas-tree-stage{position:absolute;inset:0;container-type:size;}",
          ".xmas-tree-field{position:absolute;inset:0;z-index:2;}",
          ".xmas-tree-field .dyn-card{position:absolute!important;margin:0;border-radius:12px;overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.45);outline:3px solid rgba(255,255,255,.88);will-change:transform;}",
          ".xmas-tree-field .dyn-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}",
          ".xmas-tree-field .dyn-card img.orbit-base{z-index:0;}",
          ".xmas-tree-field .dyn-card img.orbit-next{z-index:1;opacity:0;transition:opacity .55s ease;}",
          ".xmas-tree-field .dyn-card img.orbit-next.is-in{opacity:1;}",
          ".xmas-tree-decor{position:absolute;inset:0;z-index:4;pointer-events:none;}",
          ".xmas-tree-chrome{position:absolute;z-index:9;width:min(12%,140px);aspect-ratio:1;pointer-events:none;}",
          ".xmas-tree-logo{top:3.2%;left:3.2%;}",
          ".xmas-tree-qr{top:3.2%;right:3.2%;}",
          ".xmas-tree-chrome img,.xmas-tree-chrome canvas,.xmas-tree-chrome svg{width:100%;height:100%;object-fit:contain;display:block;}",
        ].join("");
        themeRoot.appendChild(style);
      }

      const stage = document.createElement("div");
      stage.className = "xmas-tree-stage";

      const star = document.createElement("div");
      star.className = "tree-star";
      const hollyA = document.createElement("div");
      hollyA.className = "tree-holly a";
      const hollyB = document.createElement("div");
      hollyB.className = "tree-holly b";

      const decor = document.createElement("div");
      decor.className = "xmas-tree-decor";

      const logo = document.createElement("div");
      logo.className = "xmas-tree-chrome xmas-tree-logo";
      logo.setAttribute("data-logo", "");
      const qr = document.createElement("div");
      qr.className = "xmas-tree-chrome xmas-tree-qr";
      qr.setAttribute("data-qr", "");

      const field = document.createElement("div");
      field.className = "xmas-tree-field";
      stage.appendChild(field);
      stage.appendChild(decor);
      stage.appendChild(star);
      stage.appendChild(hollyA);
      stage.appendChild(hollyB);
      themeRoot.appendChild(stage);
      themeRoot.appendChild(logo);
      themeRoot.appendChild(qr);

      const slots = treeSlots(false);
      const urls = [];
      const seen = new Set();
      (pool || []).forEach((src) => {
        if (!src || seen.has(src)) return;
        seen.add(src);
        urls.push(src);
      });
      const cards = [];
      for (let i = 0; i < slots.length; i += 1) {
        const src = urls[i % Math.max(urls.length, 1)] || "";
        const card = makeCard(src);
        const base = card.querySelector("img");
        if (base) base.classList.add("orbit-base");
        field.appendChild(card);
        cards.push(card);
      }

      const hangEls = [];
      for (let i = 0; i < 6; i += 1) {
        const wrap = document.createElement("div");
        wrap.className = "tree-hang";
        const orn = document.createElement("span");
        orn.className = "orn";
        wrap.appendChild(orn);
        decor.appendChild(wrap);
        hangEls.push({ el: wrap });
      }

      const lightEls = [];
      for (let i = 0; i < 22; i += 1) {
        const bulb = document.createElement("div");
        bulb.className = "tree-light";
        decor.appendChild(bulb);
        lightEls.push({ el: bulb });
      }

      const state = {
        stage,
        field,
        decor,
        star,
        cards,
        hangEls,
        lightEls,
        api: hostApi,
        ro: null,
        portrait: false,
      };

      const layoutDecor = (layout, cardWPct, cardHPct) => {
        const hangs = hangSlotsFromCards(layout, cardWPct, cardHPct);
        hangEls.forEach((item, i) => {
          const slot = hangs[i];
          if (!slot) {
            item.el.style.display = "none";
            return;
          }
          item.el.style.display = "";
          item.el.style.left = slot.x + "%";
          item.el.style.top = slot.y + "%";
          item.el.className = ("tree-hang " + slot.kind + " " + (slot.sway || "")).trim();
        });
        const lights = lightSlotsFromCards(layout, cardWPct, cardHPct);
        lightEls.forEach((item, i) => {
          const slot = lights[i];
          if (!slot) {
            item.el.style.display = "none";
            return;
          }
          item.el.style.display = "";
          item.el.style.left = slot.x + "%";
          item.el.style.top = slot.y + "%";
          item.el.className = ("tree-light " + slot.color + " " + (slot.delay || "")).trim();
        });
      };

      const measure = () => {
        const W = field.clientWidth;
        const H = field.clientHeight;
        if (!W || !H) return false;
        const portrait = H > W;
        state.portrait = portrait;
        const short = Math.min(W, H);
        // ~30% larger than the previous tree card scale.
        const cardH = Math.max(64, Math.min(short * (portrait ? 0.195 : 0.234), H * 0.26));
        const cardW = cardH * (2 / 3);
        const layout = treeSlots(portrait);
        const cardHPct = (cardH / H) * 100;
        const cardWPct = (cardW / W) * 100;
        cards.forEach((card, i) => {
          const slot = layout[i] || layout[layout.length - 1];
          card.style.position = "absolute";
          card.style.left = slot.x + "%";
          card.style.top = slot.y + "%";
          card.style.width = cardW.toFixed(1) + "px";
          card.style.height = cardH.toFixed(1) + "px";
          card.style.margin = "0";
          card.style.zIndex = String(10 + i);
          card.style.transform =
            "translate(-50%, -50%) rotate(" + slot.rot.toFixed(1) + "deg)";
        });
        // Star sits mostly above the top card; only ~10% of the star overlaps it.
        const topSlot = layout[0];
        const starPx = Math.min(W * (portrait ? 0.13 : 0.12), portrait ? 128 : 136);
        const starHPct = (starPx / H) * 100;
        const topCardTop = topSlot.y - cardHPct * 0.5;
        star.style.width = starPx.toFixed(1) + "px";
        star.style.left = "50%";
        star.style.top = (topCardTop - starHPct * 0.9).toFixed(2) + "%";
        star.style.transform = "translateX(-50%)";
        layoutDecor(layout, cardWPct, cardHPct);
        return true;
      };

      measure();

      if (typeof ResizeObserver !== "undefined") {
        state.ro = new ResizeObserver(() => {
          measure();
        });
        state.ro.observe(stage);
        state.ro.observe(field);
      }

      return state;
    },

    tick(_themeRoot, pool, state, hostApi) {
      if (!state || !state.cards || !state.cards.length) return;
      const card = state.cards[Math.floor(Math.random() * state.cards.length)];
      if (card.dataset.orbitDissolving === "1") return;
      const base = card.querySelector("img.orbit-base") || card.querySelector("img");
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

      const finish = () => {
        base.src = src;
        next.classList.remove("is-in");
        next.removeAttribute("src");
        next.src = "";
        card.dataset.orbitDissolving = "0";
      };

      const startDissolve = () => {
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
