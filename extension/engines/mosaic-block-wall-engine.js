/**
 * Dynamic Themes theme engine
 * id: mosaic-block-wall-engine
 * kind: mosaic
 */
(function (global) {
  const enginesApi = global.BGThemeEngines;
  if (!enginesApi || typeof enginesApi.define !== "function") {
    throw new Error("BGThemeEngines is not loaded before mosaic-block-wall-engine.js");
  }

  const MATS = ["blue", "silver", "gold"];

  function readScale(state) {
    const fromSettings = state && state.settings && Number(state.settings.scale);
    if (isFinite(fromSettings) && fromSettings > 0) return fromSettings;
    const raw = state && state.root && getComputedStyle(state.root).getPropertyValue("--scale");
    const n = parseFloat(raw);
    return isFinite(n) && n > 0 ? n : 1;
  }

  function cellShape(cols, rows, W, H) {
    const gutter = 0.09;
    const padX = W * 0.02;
    const padY = H * 0.03;
    const cellW = (W - padX * 2) / (cols + (cols - 1) * gutter);
    const gap = cellW * gutter;
    const cellH = (H - padY * 2 - gap * (rows - 1)) / rows;
    return cellH > 1 ? cellW / cellH : 1;
  }

  function gridFor(scale, W, H) {
    const s = Math.max(0.9, Math.min(1.5, scale || 1));
    const density = Math.pow(s, 1.15);
    let cols = Math.max(4, Math.min(11, Math.round(10 / density)));
    let rows = Math.max(4, Math.min(8, Math.round(7 / density)));
    if (s >= 1.08 && W > 0 && H > 0) {
      const t = Math.min(1, (s - 1) / 0.5);
      const target = 1 - t * (1 - 2 / 3);
      let best = null;
      const colStart = Math.max(4, cols - 1);
      const colEnd = Math.min(12, cols + 2);
      for (let c = colStart; c <= colEnd; c += 1) {
        for (let r = 2; r <= 12; r += 1) {
          const aspect = cellShape(c, r, W, H);
          if (aspect < 0.64 || aspect > 1.02) continue;
          const err = Math.abs(aspect - target) + Math.abs(c - cols) * 0.04;
          if (!best || err < best.err) best = { cols: c, rows: r, err: err };
        }
      }
      if (best) {
        cols = best.cols;
        rows = best.rows;
      }
    }
    let hero = cols >= 6 && rows >= 5 ? 3 : 2;
    if (hero >= cols) hero = Math.max(2, cols - 1);
    if (hero >= rows) hero = Math.max(2, rows - 1);
    return { cols: cols, rows: rows, heroW: hero, heroH: hero };
  }

  function tileCount(grid) {
    return grid.cols * grid.rows - grid.heroW * grid.heroH + 1;
  }

  const MAX_TILES = tileCount(gridFor(0.9));

  function uniqueUrls(pool) {
    const out = [];
    const seen = new Set();
    (pool || []).forEach(function (src) {
      if (!src || seen.has(src)) return;
      seen.add(src);
      out.push(src);
    });
    return out;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function ensureWrap(card) {
    if (card.querySelector(".box")) return;
    const spin = document.createElement("div");
    spin.className = "spin";
    const drift = document.createElement("div");
    drift.className = "drift";
    const box = document.createElement("div");
    box.className = "box";
    const front = document.createElement("div");
    front.className = "face front";
    while (card.firstChild) front.appendChild(card.firstChild);
    const back = document.createElement("div");
    back.className = "face back";
    const backImg = document.createElement("img");
    backImg.alt = "";
    back.appendChild(backImg);
    ["left", "right", "top", "bottom"].forEach(function (name) {
      const face = document.createElement("div");
      face.className = "face " + name;
      box.appendChild(face);
    });
    function addGlow(face) {
      const glow = document.createElement("div");
      glow.className = "glow";
      const spin = document.createElement("div");
      spin.className = "glow-spin";
      const light = document.createElement("div");
      light.className = "glow-light";
      spin.appendChild(light);
      glow.appendChild(spin);
      face.appendChild(glow);
    }
    addGlow(front);
    addGlow(back);
    box.appendChild(front);
    box.appendChild(back);
    const shade = document.createElement("div");
    shade.className = "shade";
    drift.appendChild(shade);
    drift.appendChild(box);
    spin.appendChild(drift);
    card.appendChild(spin);
  }

  function randomHeroCell(state, prevC, prevR) {
    const stage = state.stage;
    const grid = state.grid || gridFor(readScale(state), stage && stage.clientWidth, stage && stage.clientHeight);
    const maxC = Math.max(0, grid.cols - grid.heroW);
    const maxR = Math.max(0, grid.rows - grid.heroH);
    let c = prevC;
    let r = prevR;
    let n = 0;
    while ((c === prevC && r === prevR) && n < 24) {
      c = Math.floor(Math.random() * (maxC + 1));
      r = Math.floor(Math.random() * (maxR + 1));
      n += 1;
    }
    return { c: c, r: r };
  }

  function pose(card, i, isHero) {
    if (isHero) {
      card.dataset.yaw = rand(-6.5, 6.5).toFixed(2);
      card.dataset.pitch = rand(-3.2, 3.2).toFixed(2);
      card.dataset.roll = rand(-1.1, 1.1).toFixed(2);
      return;
    }
    const lane = i % 9;
    card.dataset.yaw = (lane < 3 ? rand(-16, -7) : lane > 6 ? rand(7, 16) : rand(-8, 8)).toFixed(2);
    card.dataset.pitch = rand(-8, 7).toFixed(2);
    card.dataset.roll = rand(-2.4, 2.4).toFixed(2);
  }

  function applyCard(card, stage, x, y, w, h, isHero, i, fit) {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const dx = (cx - W * 0.5) / W;
    const dy = (cy - H * 0.48) / H;
    const d = Math.sqrt(dx * dx + dy * dy);
    const bulge = Math.pow(1 - Math.min(1, d / 0.78), 1.2);
    const pull = fit ? bulge * 0.01 : bulge * 0.028;
    const px = x + (W * 0.5 - cx) * pull;
    const py = y + (H * 0.48 - cy) * pull;
    const z = fit
      ? (isHero ? 36 : 4) + bulge * (isHero ? 48 : 28)
      : (isHero ? 70 : 6) + bulge * (isHero ? 160 : 140);
    const s = fit ? 1 : (isHero ? 1 : 0.9) + bulge * (isHero ? 0.06 : 0.2);
    card.style.left = ((px / W) * 100).toFixed(3) + "%";
    card.style.top = ((py / H) * 100).toFixed(3) + "%";
    card.style.width = ((w / W) * 100).toFixed(3) + "%";
    card.style.height = ((h / H) * 100).toFixed(3) + "%";
    card.classList.toggle("is-hero", !!isHero);
    card.style.zIndex = String(isHero ? 48 : 4 + Math.round(bulge * 30));
    card.style.setProperty("--depth", Math.max(isHero ? 28 : 16, h * (isHero ? 0.2 : 0.24)).toFixed(1) + "px");
    card.style.setProperty("--half-w", (w / 2).toFixed(1) + "px");
    card.style.setProperty("--half-h", (h / 2).toFixed(1) + "px");
    if (!card.dataset.yaw) pose(card, i, isHero);
    const tilt = fit ? 0.4 : 1;
    const spin = card.querySelector(".spin");
    if (spin) {
      spin.style.transform =
        "translateZ(" +
        z.toFixed(1) +
        "px) rotateX(" +
        (parseFloat(card.dataset.pitch) * tilt).toFixed(2) +
        "deg) rotateY(" +
        (parseFloat(card.dataset.yaw) * tilt).toFixed(2) +
        "deg) rotateZ(" +
        (parseFloat(card.dataset.roll) * tilt).toFixed(2) +
        "deg) scale(" +
        s.toFixed(3) +
        ")";
    }
  }

  function layout(state) {
    const stage = state.stage;
    if (!stage || !stage.clientWidth) return;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const photoScale = readScale(state);
    const grid = gridFor(photoScale, W, H);
    const fit = photoScale >= 1.08;
    state.grid = grid;
    const key = grid.cols + "x" + grid.rows;
    if (state.gridKey !== key) {
      state.heroC = Math.floor(Math.max(0, grid.cols - grid.heroW) / 2);
      state.heroR = Math.floor(Math.max(0, grid.rows - grid.heroH) / 2);
      if (state.gridKey) {
        state.cards.forEach(function (card) {
          const timing = "0.45s ease";
          card.style.transition =
            "left " + timing + ", top " + timing + ", width " + timing + ", height " + timing + ", --depth " + timing;
          const spinEl = card.querySelector(".spin");
          if (spinEl) spinEl.style.transition = "transform " + timing;
        });
      }
    }
    state.gridKey = key;
    const visible = tileCount(grid);
    state.visible = visible;
    if (state.heroIndex == null || state.heroIndex >= visible) state.heroIndex = 0;
    const maxC = Math.max(0, grid.cols - grid.heroW);
    const maxR = Math.max(0, grid.rows - grid.heroH);
    if (state.heroC == null || state.heroC > maxC) state.heroC = Math.min(3, maxC);
    if (state.heroR == null || state.heroR > maxR) state.heroR = Math.min(2, maxR);
    state.cards.forEach(function (card, i) {
      const show = i < visible;
      if (!show) card.classList.remove("is-hero");
      card.style.display = show ? "" : "none";
    });
    const gutter = 0.09;
    const padX = W * 0.02;
    const padY = H * 0.03;
    const cellW = (W - padX * 2) / (grid.cols + (grid.cols - 1) * gutter);
    const gap = cellW * gutter;
    const cellH = (H - padY * 2 - gap * (grid.rows - 1)) / grid.rows;
    const heroC = state.heroC;
    const heroR = state.heroR;
    const hero = state.cards[state.heroIndex];
    applyCard(
      hero,
      stage,
      padX + heroC * (cellW + gap),
      padY + heroR * (cellH + gap),
      grid.heroW * cellW + (grid.heroW - 1) * gap,
      grid.heroH * cellH + (grid.heroH - 1) * gap,
      true,
      state.heroIndex,
      fit
    );
    let n = 0;
    for (let r = 0; r < grid.rows; r += 1) {
      for (let c = 0; c < grid.cols; c += 1) {
        if (c >= heroC && c < heroC + grid.heroW && r >= heroR && r < heroR + grid.heroH) continue;
        while (n === state.heroIndex) n += 1;
        const card = state.cards[n];
        if (!card) return;
        applyCard(card, stage, padX + c * (cellW + gap), padY + r * (cellH + gap), cellW, cellH, false, n, fit);
        n += 1;
      }
    }
  }

  function nextSrc(api, pool, avoid) {
    if (api && typeof api.nextUrl === "function") return api.nextUrl(avoid);
    if (pool && pool.length) {
      let src = pool[Math.floor(Math.random() * pool.length)];
      if (pool.length > 1 && src === avoid) src = pool[Math.floor(Math.random() * pool.length)];
      return src;
    }
    return "";
  }

  function incomingImg(card) {
    const flipped = card.classList.contains("is-flipped");
    return card.querySelector(flipped ? ".front img" : ".back img");
  }

  function flipCard(card, api, pool) {
    if (!card) return;
    const img = incomingImg(card);
    const src = nextSrc(api, pool, img && img.src);
    if (img && src) img.src = src;
    card.classList.toggle("is-flipped");
  }

  function flipOne(state, hostApi, pool) {
    const api = hostApi || state.api;
    const sats = [];
    state.cards.forEach(function (card, i) {
      if (i !== state.heroIndex && card.style.display !== "none" && !card.classList.contains("is-hero")) sats.push(card);
    });
    if (!sats.length) return;
    flipCard(sats[Math.floor(Math.random() * sats.length)], api, pool);
  }

  function applyBackgroundBitmap(themeRoot, settings) {
    if (!themeRoot) return;
    const hex = settings && settings.background;
    if (hex && enginesApi.differs && enginesApi.differs(hex, "#050814")) themeRoot.dataset.bitmap = "1";
    else delete themeRoot.dataset.bitmap;
  }

  enginesApi.define({
    id: "mosaic-block-wall-engine",
    kind: "mosaic",
    interval: 9000,

    mount(themeRoot, pool, hostApi, settings) {
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

      let shell = themeRoot.querySelector(".bw");
      if (!shell) {
        themeRoot.innerHTML =
          '<div class="bw"><div class="bg"><div class="sky"></div><div class="streaks"></div><div class="haze"></div></div><div class="stage"></div><div class="logo-slot" data-logo></div><div class="qr-slot" data-qr></div></div>';
        shell = themeRoot.querySelector(".bw");
      }
      const stage = shell.querySelector(".stage");
      const urls = uniqueUrls(pool);
      const cards = [];
      for (let i = 0; i < MAX_TILES; i += 1) {
        const src = urls.length ? urls[i % urls.length] : "";
        const card = makeCard(src);
        card.style.position = "absolute";
        card.style.margin = "0";
        card.setAttribute("data-mat", MATS[i % 3]);
        ensureWrap(card);
        pose(card, i, i === 0);
        const backImg = card.querySelector(".back img");
        if (backImg && urls.length) backImg.src = urls[(i + Math.ceil(urls.length / 2)) % urls.length];
        stage.appendChild(card);
        cards.push(card);
      }

      const state = {
        root: themeRoot,
        stage: stage,
        cards: cards,
        api: hostApi,
        settings: settings || null,
        heroIndex: 0,
        heroC: 3,
        heroR: 2,
        busy: false,
        ro: null,
        fxOn: true,
        flipTimer: 0
      };
      applyBackgroundBitmap(themeRoot, settings);
      layout(state);
      function beat() {
        if (!state.fxOn) return;
        flipOne(state, hostApi, urls);
        state.flipTimer = window.setTimeout(beat, rand(5600, 9000));
      }
      state.flipTimer = window.setTimeout(beat, 2400);
      if (typeof ResizeObserver !== "undefined") {
        state.ro = new ResizeObserver(function () {
          if (state.busy) return;
          layout(state);
        });
        state.ro.observe(stage);
      }
      return state;
    },

    tick(_themeRoot, pool, state, hostApi) {
      if (!state || !state.cards || state.cards.length < 2 || state.busy) return;
      const limit = state.visible || state.cards.length;
      const prev = state.heroIndex;
      let next = prev;
      let guard = 0;
      while (next === prev && guard < 12) {
        next = Math.floor(Math.random() * limit);
        guard += 1;
      }
      state.heroIndex = next;
      const cell = randomHeroCell(state, state.heroC, state.heroR);
      state.heroC = cell.c;
      state.heroR = cell.r;
      pose(state.cards[prev], prev, false);
      pose(state.cards[next], next, true);
      state.cards.forEach(function (card, i) {
        const delay = i === next ? "1.6s" : "0s";
        const dur = i === next ? "2s" : "1.8s";
        const timing = dur + " ease " + delay;
        card.style.transition =
          "left " + timing +
          ", top " + timing +
          ", width " + timing +
          ", height " + timing +
          ", --depth " + timing;
        const spinEl = card.querySelector(".spin");
        if (spinEl) spinEl.style.transition = "transform " + timing;
      });
      layout(state);
      const incoming = state.cards[next];
      if (incoming) incoming.style.zIndex = "4";
      window.setTimeout(function () {
        if (incoming && state.heroIndex === next) incoming.style.zIndex = "12";
      }, 1600);
    },

    applySettings(themeRoot, state, settings) {
      if (!state) return;
      state.settings = settings || state.settings;
      if (themeRoot) state.root = themeRoot;
      applyBackgroundBitmap(themeRoot, state.settings);
      layout(state);
    },

    unmount(themeRoot, state) {
      if (state) {
        state.fxOn = false;
        if (state.flipTimer) {
          window.clearTimeout(state.flipTimer);
          state.flipTimer = 0;
        }
      }
      if (state && state.ro) {
        try {
          state.ro.disconnect();
        } catch (err) {}
        state.ro = null;
      }
      if (themeRoot) themeRoot.replaceChildren();
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
