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

  const COLS = 10;
  const ROWS = 7;
  const HERO_W = 3;
  const HERO_H = 3;
  const COUNT = 1 + COLS * ROWS - HERO_W * HERO_H;
  const MATS = ["blue", "silver", "gold"];

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
    function addTracers(face) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "tracers");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.setAttribute("aria-hidden", "true");
      for (let n = 0; n < 8; n += 1) {
        ["tail", "mid", "head"].forEach(function (kind) {
          const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          rect.setAttribute("class", "tr " + kind + " t" + n);
          rect.setAttribute("x", "0");
          rect.setAttribute("y", "0");
          rect.setAttribute("width", "100");
          rect.setAttribute("height", "100");
          rect.setAttribute("pathLength", "1000");
          svg.appendChild(rect);
        });
      }
      face.appendChild(svg);
    }
    addTracers(front);
    addTracers(back);
    box.appendChild(front);
    box.appendChild(back);
    const shade = document.createElement("div");
    shade.className = "shade";
    drift.appendChild(shade);
    drift.appendChild(box);
    spin.appendChild(drift);
    card.appendChild(spin);
  }

  function randomHeroCell(prevC, prevR) {
    const maxC = COLS - HERO_W;
    const maxR = ROWS - HERO_H;
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

  function applyCard(card, stage, x, y, w, h, isHero, i, stateRoot) {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const dx = (cx - W * 0.5) / W;
    const dy = (cy - H * 0.48) / H;
    const d = Math.sqrt(dx * dx + dy * dy);
    const bulge = Math.pow(1 - Math.min(1, d / 0.78), 1.2);
    const pull = bulge * 0.028;
    const px = x + (W * 0.5 - cx) * pull;
    const py = y + (H * 0.48 - cy) * pull;
    const z = (isHero ? 70 : 6) + bulge * (isHero ? 160 : 140);
    const photoScale = parseFloat((stateRoot && getComputedStyle(stateRoot).getPropertyValue("--scale")) || "1") || 1;
    const s = ((isHero ? 1 : 0.9) + bulge * (isHero ? 0.06 : 0.2)) * photoScale;
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
    const spin = card.querySelector(".spin");
    if (spin) {
      spin.style.transform =
        "translateZ(" +
        z.toFixed(1) +
        "px) rotateX(" +
        card.dataset.pitch +
        "deg) rotateY(" +
        card.dataset.yaw +
        "deg) rotateZ(" +
        card.dataset.roll +
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
    const gap = Math.max(6, W * 0.0085);
    const padX = W * 0.018;
    const padY = H * 0.028;
    const cellW = (W - padX * 2 - gap * (COLS - 1)) / COLS;
    const cellH = (H - padY * 2 - gap * (ROWS - 1)) / ROWS;
    const heroC = state.heroC == null ? 3 : state.heroC;
    const heroR = state.heroR == null ? 2 : state.heroR;
    const hero = state.cards[state.heroIndex];
    applyCard(
      hero,
      stage,
      padX + heroC * (cellW + gap),
      padY + heroR * (cellH + gap),
      HERO_W * cellW + (HERO_W - 1) * gap,
      HERO_H * cellH + (HERO_H - 1) * gap,
      true,
      state.heroIndex,
      state.root
    );
    let n = 0;
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        if (c >= heroC && c < heroC + HERO_W && r >= heroR && r < heroR + HERO_H) continue;
        while (n === state.heroIndex) n += 1;
        const card = state.cards[n];
        if (!card) return;
        applyCard(card, stage, padX + c * (cellW + gap), padY + r * (cellH + gap), cellW, cellH, false, n, state.root);
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

  function flipSome(state, hostApi, pool) {
    const api = hostApi || state.api;
    const sats = [];
    state.cards.forEach(function (card, i) {
      if (i !== state.heroIndex && !card.classList.contains("is-hero")) sats.push(card);
    });
    const n = Math.min(sats.length, 3 + Math.floor(Math.random() * 5));
    for (let i = sats.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = sats[i];
      sats[i] = sats[j];
      sats[j] = t;
    }
    for (let k = 0; k < n; k += 1) {
      window.setTimeout(function () {
        if (state.fxOn) flipCard(sats[k], api, pool);
      }, k * rand(40, 160));
    }
  }

  function refreshPhotos(state, hostApi, pool) {
    const api = hostApi || state.api;
    state.cards.forEach(function (card, i) {
      if (i === state.heroIndex) return;
      const img = card.querySelector("img");
      const src =
        api && typeof api.nextUrl === "function"
          ? api.nextUrl(img && img.src)
          : (pool && pool[Math.floor(Math.random() * pool.length)]) || "";
      if (img && src && (img.currentSrc || img.src) !== src) img.src = src;
    });
  }

  enginesApi.define({
    id: "mosaic-block-wall-engine",
    kind: "mosaic",
    interval: 4000,

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

      let shell = themeRoot.querySelector(".bw");
      if (!shell) {
        themeRoot.innerHTML =
          '<div class="bw"><div class="bg"><div class="sky"></div><div class="streaks"></div><div class="haze"></div></div><div class="stage"></div><div class="logo-slot" data-logo></div><div class="qr-slot" data-qr></div></div>';
        shell = themeRoot.querySelector(".bw");
      }
      const stage = shell.querySelector(".stage");
      const urls = uniqueUrls(pool);
      const cards = [];
      for (let i = 0; i < COUNT; i += 1) {
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
        heroIndex: 0,
        heroC: 3,
        heroR: 2,
        busy: false,
        ro: null,
        fxOn: true,
        flipTimer: 0
      };
      layout(state);
      function beat() {
        if (!state.fxOn) return;
        flipSome(state, hostApi, urls);
        state.flipTimer = window.setTimeout(beat, rand(1100, 2400));
      }
      state.flipTimer = window.setTimeout(beat, 900);
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
      const prev = state.heroIndex;
      let next = prev;
      while (next === prev) next = Math.floor(Math.random() * state.cards.length);
      state.heroIndex = next;
      const cell = randomHeroCell(state.heroC, state.heroR);
      state.heroC = cell.c;
      state.heroR = cell.r;
      pose(state.cards[prev], prev, false);
      pose(state.cards[next], next, true);
      refreshPhotos(state, hostApi, pool);
      layout(state);
      flipCard(state.cards[next], hostApi || state.api, pool);
      flipSome(state, hostApi, pool);
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
