/**
 * Dynamic Themes theme engine
 * id: mosaic-bowl-lights-engine
 * kind: mosaic
 */
(function (global) {
  const enginesApi = global.BGThemeEngines;
  if (!enginesApi || typeof enginesApi.define !== "function") {
    throw new Error("BGThemeEngines is not loaded before mosaic-bowl-lights-engine.js");
  }

  const COLS = 14;
  const ROWS = [
    { r: 0.46, rake: 8 },
    { r: 0.51, rake: 10 },
    { r: 0.56, rake: 12 },
    { r: 0.61, rake: 14 }
  ];
  const PORT_ROWS = [
    { r: 0.62, rake: 6 },
    { r: 0.72, rake: 11 },
    { r: 0.82, rake: 15 },
    { r: 0.92, rake: 19 }
  ];
  const ASPECT = 3 / 4;
  const ARC = (245 * Math.PI) / 180;
  const LOOP = 36;
  const DUST = 320;
  const DUST_FG = 180;
  const HUE_REF = "#2f7bff";

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

  function readScale(root) {
    const raw = root && getComputedStyle(root).getPropertyValue("--scale");
    const n = parseFloat(raw);
    return isFinite(n) && n > 0 ? n : 1;
  }

  function isPortrait(root) {
    return !!(root && root.classList && root.classList.contains("dyn-portrait"));
  }

  function ensureWrap(card) {
    if (card.querySelector(".plate")) return;
    const spin = document.createElement("div");
    spin.className = "spin";
    const plate = document.createElement("div");
    plate.className = "plate";
    plate.style.backfaceVisibility = "visible";
    plate.style.webkitBackfaceVisibility = "visible";
    while (card.firstChild) plate.appendChild(card.firstChild);
    spin.appendChild(plate);
    card.appendChild(spin);
  }

  function wrapAngle(a) {
    const span = ARC;
    const half = span / 2;
    let x = a + half;
    x = ((x % span) + span) % span;
    return x - half;
  }

  function pose(state) {
    const stage = state.stage;
    if (!stage || !stage.clientWidth) return;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const portrait = isPortrait(state.root);
    const grow = readScale(state.root);
    let w = (portrait ? W * 0.15 : W * 0.118) * grow;
    let h = w / ASPECT;
    if (portrait && h > H * 0.11) {
      h = H * 0.11;
      w = h * ASPECT;
    }
    const gap = Math.min(w, h) * (portrait ? 0.55 : 0.16);
    const rowPitch = (h + gap) / H;
    const stackMid = -0.6;
    const t = state.phase;
    if (portrait) {
      stage.style.perspective = Math.round(W * 0.92) + "px";
      stage.style.perspectiveOrigin = "50% 62%";
    } else {
      stage.style.perspective = "";
      stage.style.perspectiveOrigin = "";
    }
    state.cards.forEach(function (card) {
      const row = portrait ? PORT_ROWS[card._row] : ROWS[card._row];
      const rowBias = portrait ? (card._row - 1.5) * ((14 * Math.PI) / 180) : 0;
      const depth = portrait ? 0.78 + card._row * 0.12 : 1;
      const cw = w * depth;
      const ch = h * depth;
      const theta = wrapAngle(-ARC / 2 + ((card._slot + 0.5) / COLS) * ARC - t + rowBias);
      const R = row.r * W;
      const x = R * Math.sin(theta);
      const anchor = portrait ? 0.72 : 0.78;
      const y = portrait
        ? (-0.5 + card._row * Math.max(rowPitch, 0.18)) * H
        : (stackMid + (1.5 - card._row) * rowPitch) * H;
      const z = -R * Math.cos(theta);
      const yaw = ((-theta * 180) / Math.PI) * (portrait ? 0.14 : 0.2);
      const depthCam = portrait ? W * 0.92 : W * 0.5;
      const denom = depthCam - z;
      const proj = denom > 16 ? depthCam / denom : 1;
      const screenX = W / 2 + x * proj;
      const halfW = (cw / 2) * Math.abs(proj);
      const offRight = screenX - halfW > W;
      const offLeft = screenX + halfW < 0;
      if (offRight) card._blOff = false;
      else if (offLeft && !card._blOff) {
        card._blOff = true;
        swapOffscreen(card, state);
      }
      if (card._blW !== cw) {
        card._blW = cw;
        card.style.left = "50%";
        card.style.top = portrait ? "72%" : "78%";
        card.style.width = ((cw / W) * 100).toFixed(3) + "%";
        card.style.height = ((ch / H) * 100).toFixed(3) + "%";
        card.style.marginLeft = (-cw / 2).toFixed(1) + "px";
        card.style.marginTop = (-ch / 2).toFixed(1) + "px";
        card.style.opacity = "1";
        card.style.visibility = "visible";
        const plate = card.querySelector(".plate");
        if (plate) {
          plate.style.backfaceVisibility = "visible";
          plate.style.webkitBackfaceVisibility = "visible";
        }
        const spinEl = card.querySelector(".spin");
        if (spinEl) spinEl.style.willChange = "auto";
      }
      const zIndex = 80 + Math.round(z);
      if (card._blZ !== zIndex) {
        card._blZ = zIndex;
        card.style.zIndex = String(zIndex);
      }
      const spin = card.querySelector(".spin");
      if (spin) {
        spin.style.transform =
          "translate3d(" +
          x.toFixed(1) +
          "px," +
          y.toFixed(1) +
          "px," +
          z.toFixed(1) +
          "px) rotateY(" +
          yaw.toFixed(2) +
          "deg) rotateX(" +
          row.rake +
          "deg)";
      }
    });
  }

  function swapOffscreen(card, state) {
    const api = state.api;
    const img = card.querySelector("img");
    if (!img) return;
    const current = img.currentSrc || img.src;
    const src =
      api && typeof api.nextUrl === "function"
        ? api.nextUrl(current)
        : "";
    if (src && src !== current) img.src = src;
  }

  function crowdPos() {
    const ang = rand(0, Math.PI * 2);
    const rad = Math.pow(Math.random(), 0.55);
    return {
      x: 50 + Math.cos(ang) * 47 * rad,
      y: 38 + Math.sin(ang) * 30 * rad
    };
  }

  function hexToHue(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return 219;
    const n = parseInt(m[1], 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 219;
    const d = max - min;
    let h = 0;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return h * 60;
  }

  function applyHue(themeRoot, settings) {
    if (!themeRoot || !themeRoot.style) return;
    const hex = settings && settings.tint ? settings.tint : "#ffffff";
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
    let shift = 0;
    if (m) {
      const n = parseInt(m[1], 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      if (r !== g || g !== b) {
        shift = hexToHue(hex) - hexToHue(HUE_REF);
        if (shift > 180) shift -= 360;
        if (shift < -180) shift += 360;
      }
    }
    themeRoot.style.setProperty("--hue-shift", shift.toFixed(1) + "deg");
    const lift = settings && settings.bgTint;
    themeRoot.style.setProperty(
      "--bg-tint",
      /^#?[0-9a-f]{6}$/i.test(String(lift || "")) ? lift : "#ffffff"
    );
    const sat = parseFloat(settings && settings.sat);
    themeRoot.style.setProperty("--bg-sat", isFinite(sat) ? String(sat) : "1");
  }

  function ensureFlashes(bg) {
    if (!bg) return null;
    let host = bg.querySelector(".flashes");
    if (!host) {
      host = document.createElement("div");
      host.className = "flashes";
      host.setAttribute("aria-hidden", "true");
      bg.appendChild(host);
    }
    return host;
  }

  function ensureDust(bg) {
    if (!bg) return null;
    let host = bg.querySelector(".dust");
    if (!host) {
      host = document.createElement("div");
      host.className = "dust";
      host.setAttribute("aria-hidden", "true");
      bg.appendChild(host);
    }
    return host;
  }

  function seedDust(host, count) {
    if (!host) return;
    const n = count || DUST;
    while (host.childElementCount < n) {
      const p = document.createElement("i");
      p.style.left = rand(0, 100).toFixed(2) + "%";
      p.style.top = rand(-10, 110).toFixed(2) + "%";
      p.style.setProperty("--dx", rand(-22, 22).toFixed(2) + "cqw");
      p.style.setProperty("--dy", rand(-32, 10).toFixed(2) + "cqh");
      p.style.setProperty("--dust-s", rand(0.35, 2.2).toFixed(2));
      p.style.setProperty("--dust-t", rand(12, 30).toFixed(1) + "s");
      p.style.setProperty("--dust-d", (-rand(0, 28)).toFixed(1) + "s");
      host.appendChild(p);
    }
  }

  function startFlashes(state, host) {
    if (!host) return;
    while (host.childElementCount < 28) host.appendChild(document.createElement("i"));
    function pop() {
      if (!state.fxOn || !host.isConnected) return;
      const nodes = host.children;
      const burst = 1 + (Math.random() < 0.35 ? 1 : 0);
      for (let k = 0; k < burst; k += 1) {
        const el = nodes[Math.floor(Math.random() * nodes.length)];
        const p = crowdPos();
        el.style.left = p.x.toFixed(1) + "%";
        el.style.top = p.y.toFixed(1) + "%";
        el.style.setProperty("--flash-s", rand(0.35, 1.85).toFixed(2));
        el.classList.remove("on");
        el.classList.add("on");
      }
      state.flashTimer = window.setTimeout(pop, rand(700, 1800));
    }
    state.flashTimer = window.setTimeout(pop, rand(500, 1200));
  }

  enginesApi.define({
    id: "mosaic-bowl-lights-engine",
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

      let shell = themeRoot.querySelector(".bl");
      if (!shell) {
        themeRoot.innerHTML =
          '<div class="bl"><div class="bg"><div class="sky"></div><div class="tint"></div><div class="haze"></div><div class="rays"></div><div class="lift"></div><div class="flashes" aria-hidden="true"></div><div class="dust" aria-hidden="true"></div></div><div class="stage"></div><div class="dust dust-fg" aria-hidden="true"></div><div class="logo-slot" data-logo></div><div class="qr-slot" data-qr></div></div>';
        shell = themeRoot.querySelector(".bl");
      }
      const stage = shell.querySelector(".stage");
      const urls = uniqueUrls(pool);
      const cards = [];
      let i = 0;
      ROWS.forEach(function (_row, r) {
        for (let slot = 0; slot < COLS; slot += 1) {
          const src = urls.length ? urls[i % urls.length] : "";
          const card = makeCard(src);
          card.style.position = "absolute";
          card.style.margin = "0";
          card.setAttribute("data-row", String(r));
          card._row = r;
          card._slot = slot;
          ensureWrap(card);
          stage.appendChild(card);
          cards.push(card);
          i += 1;
        }
      });

      const state = {
        root: themeRoot,
        stage: stage,
        cards: cards,
        api: hostApi,
        phase: 0,
        lastTs: 0,
        raf: 0,
        fxOn: true,
        flashTimer: 0,
        ro: null
      };
      applyHue(themeRoot, settings);
      const bg = shell.querySelector(".bg");
      if (bg && !bg.querySelector(".lift")) {
        const lift = document.createElement("div");
        lift.className = "lift";
        const rays = bg.querySelector(".rays");
        if (rays && rays.nextSibling) bg.insertBefore(lift, rays.nextSibling);
        else bg.appendChild(lift);
      }
      startFlashes(state, ensureFlashes(bg));
      seedDust(ensureDust(bg), DUST);
      let fg = shell.querySelector(".dust-fg");
      if (!fg) {
        fg = document.createElement("div");
        fg.className = "dust dust-fg";
        fg.setAttribute("aria-hidden", "true");
        shell.appendChild(fg);
      }
      seedDust(fg, DUST_FG);

      function frame(ts) {
        if (!state.fxOn) return;
        if (!state.lastTs) state.lastTs = ts;
        const dt = Math.min(0.05, (ts - state.lastTs) / 1000);
        state.lastTs = ts;
        state.phase = (state.phase + dt * (ARC / LOOP)) % ARC;
        pose(state);
        state.raf = window.requestAnimationFrame(frame);
      }
      pose(state);
      state.raf = window.requestAnimationFrame(frame);
      if (typeof ResizeObserver !== "undefined") {
        state.ro = new ResizeObserver(function () {
          pose(state);
        });
        state.ro.observe(stage);
      }
      return state;
    },

    tick(_themeRoot, _pool, state, hostApi) {
      if (state && hostApi) state.api = hostApi;
    },

    applySettings(themeRoot, _state, settings) {
      applyHue(themeRoot, settings);
    },

    unmount(themeRoot, state) {
      if (state) {
        state.fxOn = false;
        if (state.raf) {
          window.cancelAnimationFrame(state.raf);
          state.raf = 0;
        }
        if (state.settleRaf) {
          window.cancelAnimationFrame(state.settleRaf);
          state.settleRaf = 0;
        }
        if (state.flashTimer) {
          window.clearTimeout(state.flashTimer);
          state.flashTimer = 0;
        }
        if (state.ro) {
          try {
            state.ro.disconnect();
          } catch (err) {}
          state.ro = null;
        }
      }
      if (themeRoot) themeRoot.replaceChildren();
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
