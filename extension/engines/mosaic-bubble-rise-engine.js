/**
 * Dynamic Themes theme engine
 * id: mosaic-bubble-rise-engine
 * kind: mosaic
 */
(function (global) {
  const enginesApi = global.BGThemeEngines;
  if (!enginesApi || typeof enginesApi.define !== "function") {
    throw new Error("BGThemeEngines is not loaded before mosaic-bubble-rise-engine.js");
  }

  const MAX_PHOTOS = 16;

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

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function hexToRgb(hex) {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || "").trim());
    if (!m) return { r: 191, g: 232, b: 255 };
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function readScale(root) {
    const n = parseFloat(root && getComputedStyle(root).getPropertyValue("--scale"));
    return isFinite(n) && n > 0 ? n : 1;
  }

  function readTint(settings) {
    const color = settings && /^#([0-9a-fA-F]{6})$/.test(String(settings.tint || ""))
      ? String(settings.tint)
      : "#7ec8ff";
    const n = Number(settings && settings.tintOpacity);
    return {
      color: color,
      opacity: isFinite(n) ? clamp(n, 0, 0.75) : 0,
    };
  }

  function applyTint(root, settings) {
    if (!root) return;
    const tint = readTint(settings);
    root.style.setProperty("--br-tint", tint.color);
    root.style.setProperty("--br-tint-opacity", String(tint.opacity));
  }

  function readRise(settings) {
    const n = Number(settings && settings.rise);
    return isFinite(n) && n > 0 ? clamp(n, 0.45, 1.8) : 1;
  }

  function photoCount(scale) {
    if (scale >= 1.35) return 9;
    if (scale >= 1.15) return 12;
    return MAX_PHOTOS;
  }

  function cssVar(root, name, fallback) {
    const v = root && getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }

  function readColors(root) {
    return {
      top: cssVar(root, "--primary", "#0d5c8c"),
      deep: cssVar(root, "--background", "#021224"),
      ray: cssVar(root, "--secondary", "#bfe8ff"),
      glass: cssVar(root, "--frame", "#e7f7ff"),
    };
  }

  function makeNoise() {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 160;
    const g = c.getContext("2d");
    const img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = 150 + Math.random() * 90;
      img.data[i] = n;
      img.data[i + 1] = Math.min(255, n + 14);
      img.data[i + 2] = Math.min(255, n + 32);
      img.data[i + 3] = Math.random() < 0.62 ? 34 : 10;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function makeBubbleSprite() {
    const size = 96;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    const half = size / 2;
    const body = g.createRadialGradient(half, half, half * 0.15, half, half, half * 0.98);
    body.addColorStop(0, "rgba(255,255,255,0.02)");
    body.addColorStop(0.55, "rgba(255,255,255,0.04)");
    body.addColorStop(0.78, "rgba(210,236,255,0.16)");
    body.addColorStop(0.9, "rgba(255,255,255,0.55)");
    body.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = body;
    g.beginPath();
    g.arc(half, half, half * 0.96, 0, Math.PI * 2);
    g.fill();
    const hi = g.createRadialGradient(size * 0.34, size * 0.3, 0, size * 0.34, size * 0.3, size * 0.2);
    hi.addColorStop(0, "rgba(255,255,255,0.9)");
    hi.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = hi;
    g.beginPath();
    g.ellipse(size * 0.36, size * 0.32, size * 0.16, size * 0.1, -0.5, 0, Math.PI * 2);
    g.fill();
    const rim = g.createRadialGradient(half, half, half * 0.72, half, half, half * 0.96);
    rim.addColorStop(0, "rgba(255,255,255,0)");
    rim.addColorStop(0.7, "rgba(255,255,255,0.08)");
    rim.addColorStop(1, "rgba(255,255,255,0.35)");
    g.strokeStyle = rim;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(half, half, half * 0.9, 0, Math.PI * 2);
    g.stroke();
    return c;
  }

  function drawWater(state, time) {
    const ctx = state.ctx;
    const w = state.w;
    const h = state.h;
    if (!ctx || !w || !h) return;
    const colors = state.colors;
    const ray = hexToRgb(colors.ray);
    if (!state.gradient || state.gradientKey !== colors.top + colors.deep) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, colors.top);
      g.addColorStop(0.45, colors.top);
      g.addColorStop(1, colors.deep);
      state.gradient = g;
      state.gradientKey = colors.top + colors.deep;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = state.gradient;
    ctx.fillRect(0, 0, w, h);

    const drift = (time * 14) % 160;
    ctx.globalAlpha = 0.22;
    for (let y = -160 + drift; y < h; y += 160) {
      for (let x = 0; x < w; x += 160) ctx.drawImage(state.noise, x, y);
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    for (let i = 0; i < 4; i += 1) {
      const y = ((time * 22 + i * h * 0.28) % (h + 90)) - 50;
      const band = ctx.createLinearGradient(0, y, 0, y + 84);
      band.addColorStop(0, "rgba(255,255,255,0)");
      band.addColorStop(0.5, "rgba(" + ray.r + "," + ray.g + "," + ray.b + ",0.16)");
      band.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, y, w, 84);
    }
    ctx.restore();

    if (state.rayAlpha > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const rays = state.rays;
      for (let i = 0; i < rays.length; i += 1) {
        const rayDef = rays[i];
        const sway = Math.sin(time * rayDef.sway + rayDef.phase);
        const x = w * rayDef.x + sway * 28;
        ctx.save();
        ctx.translate(x, -40);
        ctx.rotate(rayDef.tilt + sway * 0.04);
        const rw = rayDef.w * (1 + 0.18 * Math.sin(time * 0.3 + rayDef.phase));
        const grad = ctx.createLinearGradient(-rw, 0, rw, 0);
        grad.addColorStop(0, "rgba(" + ray.r + "," + ray.g + "," + ray.b + ",0)");
        grad.addColorStop(0.5, "rgba(" + ray.r + "," + ray.g + "," + ray.b + ",0.22)");
        grad.addColorStop(1, "rgba(" + ray.r + "," + ray.g + "," + ray.b + ",0)");
        ctx.fillStyle = grad;
        ctx.fillRect(-rw, 0, rw * 2, h * 1.15);
        ctx.restore();
      }
      const glow = ctx.createLinearGradient(0, 0, 0, h * 0.22);
      glow.addColorStop(0, "rgba(" + ray.r + "," + ray.g + "," + ray.b + ",0.2)");
      glow.addColorStop(1, "rgba(" + ray.r + "," + ray.g + "," + ray.b + ",0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h * 0.22);
      ctx.restore();
    }

    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.2, w * 0.5, h * 0.5, h * 0.78);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,8,18,0.28)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function drawMotes(ctx, sprite, list, time, dt, speed, w, h) {
    for (let i = 0; i < list.length; i += 1) {
      const b = list[i];
      b.y -= b.rise * speed * dt;
      if (b.y < -b.r * 2) {
        b.y = h + b.r + Math.random() * 40;
        b.x = Math.random();
      }
      const x = b.x * w + Math.sin(time * b.freq + b.phase) * b.amp;
      ctx.globalAlpha = b.alpha;
      ctx.drawImage(sprite, x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    ctx.globalAlpha = 1;
  }

  function makeMote(layer, spawnAnywhere, h) {
    const far = layer === "far";
    const r = far ? rand(1.1, 3.4) : rand(2.2, 5.2);
    return {
      x: Math.random(),
      y: spawnAnywhere ? Math.random() * h : h + rand(8, 80),
      r: r,
      rise: far ? rand(12, 28) : rand(30, 64),
      amp: far ? rand(3, 9) : rand(6, 14),
      freq: rand(0.35, 0.9),
      phase: rand(0, Math.PI * 2),
      alpha: far ? rand(0.12, 0.32) : rand(0.35, 0.62),
    };
  }

  function seedMotes(state) {
    const w = state.w || 1200;
    const h = state.h || 700;
    const farN = Math.round(58 * w / 1200);
    const nearN = Math.max(3, Math.round(5 * w / 1200));
    state.far = [];
    state.near = [];
    for (let i = 0; i < farN; i += 1) state.far.push(makeMote("far", true, h));
    for (let i = 0; i < nearN; i += 1) state.near.push(makeMote("near", true, h));
  }

  function bubbleSize() {
    const u = Math.random();
    if (u < 0.22) return rand(0.55, 0.82);
    if (u < 0.7) return rand(0.84, 1.28);
    return rand(1.32, 2);
  }

  function ensureLens(shell) {
    if (shell.querySelector(".br-lens-svg")) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "br-lens-svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    const ns = "http://www.w3.org/2000/svg";
    const filter = document.createElementNS(ns, "filter");
    filter.setAttribute("id", "br-lens");
    filter.setAttribute("x", "-8%");
    filter.setAttribute("y", "-8%");
    filter.setAttribute("width", "116%");
    filter.setAttribute("height", "116%");
    const turb = document.createElementNS(ns, "feTurbulence");
    turb.setAttribute("type", "fractalNoise");
    turb.setAttribute("baseFrequency", "0.012");
    turb.setAttribute("numOctaves", "2");
    turb.setAttribute("seed", "4");
    turb.setAttribute("result", "noise");
    const disp = document.createElementNS(ns, "feDisplacementMap");
    disp.setAttribute("in", "SourceGraphic");
    disp.setAttribute("in2", "noise");
    disp.setAttribute("scale", "7");
    disp.setAttribute("xChannelSelector", "R");
    disp.setAttribute("yChannelSelector", "G");
    filter.appendChild(turb);
    filter.appendChild(disp);
    svg.appendChild(filter);
    shell.appendChild(svg);
  }
  function layoutPhotos(state) {
    const scale = readScale(state.root);
    state.scale = scale;
    const count = photoCount(scale);
    state.visible = count;
    const short = Math.min(state.w, state.h) || 400;
    state.photos.forEach(function (b, i) {
      const show = i < count;
      b.el.style.display = show ? "" : "none";
      if (!show) return;
      const r = short * 0.085 * scale * b.size;
      b.r = r;
      b.el.style.width = (r * 2).toFixed(1) + "px";
      b.el.style.height = (r * 2).toFixed(1) + "px";
      b.rise = 48 * b.speed;
      b.lane = (i + 0.5) / count;
      b.amp = 10 + b.size * 10;
    });
  }

  function placePhoto(b, y, swap) {
    b.y = y;
    if (swap) {
      const img = b.el.querySelector("img");
      const api = b.api;
      if (img && api && typeof api.nextUrl === "function") {
        const src = api.nextUrl(img.currentSrc || img.src);
        if (src) img.src = src;
      }
    }
  }

  function ensureShell(card) {
    if (card.querySelector(".br-glass")) return;
    const glass = document.createElement("div");
    glass.className = "br-glass";
    while (card.firstChild) glass.appendChild(card.firstChild);
    const shine = document.createElement("span");
    shine.className = "br-shine";
    const rim = document.createElement("span");
    rim.className = "br-rim";
    const tint = document.createElement("span");
    tint.className = "br-tint";
    glass.appendChild(tint);
    glass.appendChild(shine);
    glass.appendChild(rim);
    card.appendChild(glass);
  }

  enginesApi.define({
    id: "mosaic-bubble-rise-engine",
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

      let shell = themeRoot.querySelector(".br");
      if (!shell) {
        themeRoot.innerHTML =
          '<div class="br"><canvas class="br-water"></canvas><div class="br-stage"></div><canvas class="br-front"></canvas><div class="logo-slot" data-logo></div><div class="qr-slot" data-qr></div></div>';
        shell = themeRoot.querySelector(".br");
      }
      ensureLens(shell);
      const water = shell.querySelector(".br-water");
      const front = shell.querySelector(".br-front");
      const stage = shell.querySelector(".br-stage");
      const urls = uniqueUrls(pool);
      const photos = [];
      for (let i = 0; i < MAX_PHOTOS; i += 1) {
        const src = urls.length ? urls[i % urls.length] : "";
        const card = makeCard(src);
        card.classList.add("br-bubble");
        ensureShell(card);
        const photo = card.querySelector("img");
        if (photo) {
          photo.style.animationDuration = rand(5.5, 9.5).toFixed(2) + "s";
          photo.style.animationDelay = (-rand(0, 8)).toFixed(2) + "s";
        }
        stage.appendChild(card);
        photos.push({
          el: card,
          api: hostApi,
          y: 0,
          r: 40,
          rise: 70,
          lane: (i + 0.5) / MAX_PHOTOS,
          amp: 16,
          freq: rand(0.28, 0.62),
          phase: rand(0, Math.PI * 2),
          jitter: rand(-0.04, 0.04),
          size: bubbleSize(),
          speed: rand(0.42, 1.85),
        });
      }

      const state = {
        root: themeRoot,
        shell: shell,
        water: water,
        front: front,
        stage: stage,
        ctx: water.getContext("2d"),
        frontCtx: front.getContext("2d"),
        photos: photos,
        far: [],
        near: [],
        noise: makeNoise(),
        sprite: makeBubbleSprite(),
        rays: [
          { x: 0.16, tilt: 0.22, w: 90, sway: 0.18, phase: 0.2 },
          { x: 0.4, tilt: 0.16, w: 140, sway: 0.14, phase: 1.7 },
          { x: 0.62, tilt: 0.2, w: 80, sway: 0.22, phase: 3.4 },
          { x: 0.84, tilt: 0.12, w: 120, sway: 0.15, phase: 2.2 },
        ],
        colors: readColors(themeRoot),
        rayAlpha: 1,
        rise: readRise(settings),
        scale: 1,
        visible: MAX_PHOTOS,
        w: 0,
        h: 0,
        alive: true,
        raf: 0,
        ro: null,
        last: performance.now(),
        gradient: null,
        gradientKey: "",
      };

      function resize() {
        const w = shell.clientWidth;
        const h = shell.clientHeight;
        if (!w || !h) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        [water, front].forEach(function (canvas) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
          canvas.style.width = w + "px";
          canvas.style.height = h + "px";
        });
        state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        state.frontCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        state.w = w;
        state.h = h;
        state.gradient = null;
        if (!state.far.length) seedMotes(state);
        layoutPhotos(state);
        const H = h;
        state.photos.forEach(function (b, i) {
          if (!b.y) b.y = rand(-b.r, H + b.r * 2) + (i % 3) * 10;
        });
      }

      function frame(now) {
        if (!state.alive) return;
        state.raf = window.requestAnimationFrame(frame);
        const dt = Math.min((now - state.last) / 1000, 0.05);
        state.last = now;
        const time = now / 1000;
        if (!state.w) return;
        drawWater(state, time);
        state.ctx.globalCompositeOperation = "source-over";
        drawMotes(state.ctx, state.sprite, state.far, time, dt, state.rise, state.w, state.h);
        const speed = state.rise;
        const H = state.h;
        const W = state.w;
        for (let i = 0; i < state.visible; i += 1) {
          const b = state.photos[i];
          b.y -= b.rise * speed * dt * (0.94 + 0.06 * Math.sin(time * 0.25 + b.phase));
          if (b.y < -b.r - 8) placePhoto(b, H + b.r + rand(12, H * 0.25), true);
          const x = (b.lane + b.jitter) * W + Math.sin(time * b.freq + b.phase) * b.amp;
          b.el.style.transform =
            "translate3d(" + (x - b.r).toFixed(1) + "px," + (b.y - b.r).toFixed(1) + "px,0)";
          b.el.style.zIndex = String(10 + Math.round(b.r));
        }
        state.frontCtx.clearRect(0, 0, W, H);
        drawMotes(state.frontCtx, state.sprite, state.near, time, dt, state.rise, state.w, state.h);
      }

      resize();
      if (typeof ResizeObserver !== "undefined") {
        state.ro = new ResizeObserver(resize);
        state.ro.observe(shell);
      }
      state.raf = window.requestAnimationFrame(function (now) {
        state.last = now;
        frame(now);
      });
      applyTint(themeRoot, settings);
      return state;
    },

    applySettings(themeRoot, state, settings) {
      if (!state) return;
      state.root = themeRoot || state.root;
      state.rise = readRise(settings);
      applyTint(themeRoot, settings);
      state.colors = readColors(state.root);
      state.gradient = null;
      if (state.w) layoutPhotos(state);
    },

    unmount(themeRoot, state) {
      if (state) {
        state.alive = false;
        if (state.raf) window.cancelAnimationFrame(state.raf);
        if (state.ro) {
          try {
            state.ro.disconnect();
          } catch (err) {}
        }
      }
      if (themeRoot) themeRoot.replaceChildren();
    },
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
