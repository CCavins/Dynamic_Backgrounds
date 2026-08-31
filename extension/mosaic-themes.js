(function (root) {
  const TICK = 2500;

  function markCardReady(card, img) {
    if (!card || !img || !img.naturalWidth) return;
    img.classList.remove("dyn-feed-pending");
    card.classList.add("dyn-feed-ready");
    card.classList.remove("dyn-feed-pending");
  }

  function armCardImage(card, img, src) {
    img.alt = "";
    img.addEventListener("load", () => markCardReady(card, img));
    img.addEventListener("error", () => {
      img.classList.add("dyn-feed-pending");
      card.classList.remove("dyn-feed-ready");
      card.classList.add("dyn-feed-pending");
    });
    if (src) {
      img.classList.add("dyn-feed-pending");
      card.classList.add("dyn-feed-pending");
      img.src = src;
      if (img.complete && img.naturalWidth) markCardReady(card, img);
    } else {
      card.classList.add("dyn-feed-pending");
    }
  }

  function makeCard(src, className) {
    const card = document.createElement("div");
    card.className = className ? "dyn-card " + className : "dyn-card";
    const img = document.createElement("img");
    armCardImage(card, img, src);
    card.appendChild(img);
    return card;
  }

  function makeFanCard(src) {
    const card = document.createElement("div");
    card.className = "dyn-card dyn-fan-card";
    const inner = document.createElement("div");
    inner.className = "dyn-fan-inner";
    const front = document.createElement("div");
    front.className = "dyn-fan-face dyn-fan-front";
    const back = document.createElement("div");
    back.className = "dyn-fan-face dyn-fan-back";
    const imgF = document.createElement("img");
    const imgB = document.createElement("img");
    imgB.className = "dyn-fan-back-img";
    imgB.alt = "";
    armCardImage(card, imgF, src);
    if (src) imgB.src = src;
    front.appendChild(imgF);
    back.appendChild(imgB);
    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    return card;
  }

  function urlAt(pool, index) {
    if (!pool.length) return "";
    return pool[((index % pool.length) + pool.length) % pool.length];
  }

  function setImg(card, src) {
    const img =
      (card && card.querySelector(".dyn-fan-front img")) ||
      (card && card.querySelector("img:not(.dyn-reveal)"));
    if (!img || !src) return;
    if ((img.currentSrc || img.src) === src) {
      markCardReady(card, img);
      return;
    }
    const probe = new Image();
    const apply = () => {
      img.src = src;
      markCardReady(card, img);
    };
    probe.onload = () => {
      if (typeof probe.decode === "function") probe.decode().then(apply, apply);
      else apply();
    };
    probe.src = src;
    if (probe.complete && probe.naturalWidth) apply();
  }

  function replaceImg(card, src) {
    const img = card && card.querySelector("img:not(.dyn-reveal)");
    if (!img || !src) return Promise.resolve();
    if ((img.currentSrc || img.src) === src) {
      markCardReady(card, img);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        img.src = src;
        markCardReady(card, img);
        resolve();
      };
      const probe = new Image();
      probe.onload = () => {
        if (typeof probe.decode === "function") probe.decode().then(done, done);
        else done();
      };
      probe.onerror = done;
      probe.src = src;
      if (probe.complete && probe.naturalWidth) {
        probe.onload();
      }
      window.setTimeout(done, 4000);
    });
  }

  function imgSrc(card) {
    const img =
      (card && card.querySelector(".dyn-fan-front img")) ||
      (card && card.querySelector("img:not(.dyn-reveal)"));
    return img ? img.currentSrc || img.src : "";
  }

  function uniqueList(pool) {
    const out = [];
    const seen = new Set();
    pool.forEach((src) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      out.push(src);
    });
    return out;
  }

  function fill(pool, count) {
    const unique = uniqueList(pool);
    const out = [];
    if (count <= 0) return out;
    for (let i = 0; i < count; i += 1) {
      out.push(unique.length ? unique[i] || unique[i % unique.length] : "");
    }
    return out;
  }

  function pickRandomUrl(pool, avoid) {
    const blocked = new Set();
    if (typeof avoid === "string") {
      if (avoid) blocked.add(avoid);
    } else if (avoid) {
      for (const src of avoid) {
        if (src) blocked.add(src);
      }
    }
    const unique = uniqueList(pool).filter((src) => src && !blocked.has(src));
    const choices = unique.length ? unique : uniqueList(pool);
    if (!choices.length) return "";
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function feedSrc(api, pool, avoid) {
    if (api && typeof api.nextUrl === "function") {
      const next = api.nextUrl(avoid);
      if (next) return next;
    }
    return pickRandomUrl(pool, avoid) || pickRandomUrl(pool) || "";
  }

  function whenDecoded(img) {
    if (!img || !img.src) return Promise.resolve();
    if (img.complete && img.naturalWidth) {
      return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    }
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      img.addEventListener("load", () => {
        if (img.decode) img.decode().then(done, done);
        else done();
      }, { once: true });
      img.addEventListener("error", done, { once: true });
      window.setTimeout(done, 4000);
    });
  }

  function later(state, fn, ms) {
    if (!state.timers) state.timers = [];
    const id = window.setTimeout(fn, ms);
    state.timers.push(id);
    return id;
  }

  function stopTimers(state) {
    (state.timers || []).forEach((id) => window.clearTimeout(id));
    state.timers = [];
    if (state.raf) {
      window.cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
    if (state.ro) {
      state.ro.disconnect();
      state.ro = null;
    }
  }

  function fitStage(stage, designW, designH, parent) {
    if (!stage || !parent) return;
    const vw = parent.clientWidth || 1;
    const vh = parent.clientHeight || 1;
    const s = Math.min(vw / designW, vh / designH);
    stage.style.width = designW + "px";
    stage.style.height = designH + "px";
    stage.style.position = "absolute";
    stage.style.left = (vw - designW * s) / 2 + "px";
    stage.style.top = (vh - designH * s) / 2 + "px";
    stage.style.transformOrigin = "top left";
    stage.style.transform = "scale(" + s + ")";
  }

  function watchStage(state, stage, designW, designH, parent) {
    const fit = () => fitStage(stage, designW, designH, parent);
    fit();
    if (typeof ResizeObserver !== "undefined") {
      state.ro = new ResizeObserver(fit);
      state.ro.observe(parent);
    }
  }

  function easeInOut(k) {
    return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function makePolaroid(src) {
    const card = document.createElement("div");
    card.className = "dyn-card dyn-polaroid";
    const img = document.createElement("img");
    armCardImage(card, img, src);
    card.appendChild(img);
    const band = document.createElement("div");
    band.className = "dyn-polaroid-band";
    card.appendChild(band);
    return card;
  }

  function clampThemeScale(settings) {
    const n = Number(settings && settings.scale);
    if (!isFinite(n)) return 1;
    return Math.max(0.7, Math.min(1.5, n));
  }

  function themeColor(settings, fallback) {
    const v = String((settings && settings.primary) || "");
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : fallback;
  }

  function mosaicThemeRoot(node) {
    if (!node) return node;
    if (node.id === "dyn-mosaic-theme") return node;
    return (node.closest && node.closest("#dyn-mosaic-theme")) || node;
  }

  function applyPolaroidSettings(root, settings) {
    const host = mosaicThemeRoot(root) || root;
    if (!host || !host.style) return;
    host.style.setProperty("--polaroid-frame", themeColor(settings, "#ffffff"));
  }

  function polaroidCardHeight(scale) {
    const w = 370 * scale;
    const imgH = Math.max(1, w - 24) * (4 / 3);
    return 12 + imgH + 10 + w * 0.24 + 14;
  }

  function polaroidGridFor(layoutW, layoutH, scale) {
    const s = clampThemeScale({ scale });
    const cardW = 370 * s;
    const cols = Math.max(1, Math.round(layoutW / cardW));
    const pitchY = 355 * s;
    const cardH = polaroidCardHeight(s);
    // Small even bleed on both sides. Stretching cells to the stage width
    // made left/right a zero-sum; a natural pitch lets both edges kiss the frame.
    const hangL = Math.round(cardW * 0.03);
    const hangR = Math.round(cardW * 0.05);
    const originX = -hangL;
    const pitchX = cols > 1 ? (layoutW + hangL + hangR - cardW) / (cols - 1) : layoutW;
    const originY = Math.round(-cardH * 0.2);
    let rows = 1;
    for (let n = 2; n <= 12; n += 1) {
      const lastY = originY + (n - 1) * pitchY + pitchY * 0.05;
      if ((lastY + cardH - layoutH) / cardH > 0.33) break;
      rows = n;
    }
    return { cols, rows, pitchX, pitchY, originX, originY, cardH };
  }

  function applyPedestalSettings(root, settings) {
    const host = mosaicThemeRoot(root) || root;
    if (!host || !host.style) return;
    host.style.setProperty("--pedestal-color", themeColor(settings, "#54585f"));
  }

  function flipLayoutFor(root, settings) {
    const scale = clampThemeScale(settings);
    const size = stageSize(root);
    const gap = 12;
    const dw = Math.max(1, size.dw);
    const dh = Math.max(1, size.dh);
    const base = 264 * scale;
    const cols = Math.max(1, Math.round((dw + gap) / (base + gap)));
    const tileW = (dw - gap * Math.max(0, cols - 1)) / cols;
    const rows = Math.max(1, Math.round((dh + gap) / (tileW + gap)));
    const tileH = (dh - gap * Math.max(0, rows - 1)) / rows;
    const depth = Math.round(56 * scale);
    return { cols, rows, tileW, tileH, depth, scale };
  }

  function applyFlipSettings(root, settings, layout) {
    const host = mosaicThemeRoot(root) || root;
    if (!host || !host.style) return;
    const next = layout || flipLayoutFor(root, settings);
    host.style.setProperty("--flip-cols", String(next.cols));
    host.style.setProperty("--flip-rows", String(next.rows));
    host.style.setProperty("--flip-w", next.tileW + "px");
    host.style.setProperty("--flip-h", next.tileH + "px");
    host.style.setProperty("--flip-depth", next.depth + "px");
    host.style.setProperty("--flip-edge", themeColor(settings, "#5a5e66"));
    if (root && host !== root && root.style) {
      root.style.setProperty("--flip-cols", String(next.cols));
      root.style.setProperty("--flip-rows", String(next.rows));
      root.style.setProperty("--flip-w", next.tileW + "px");
      root.style.setProperty("--flip-h", next.tileH + "px");
      root.style.setProperty("--flip-depth", next.depth + "px");
      root.style.setProperty("--flip-edge", themeColor(settings, "#5a5e66"));
    }
  }

  function revealFromBottom(card, src) {
    if (!card || !src || imgSrc(card) === src) return Promise.resolve();
    const layer = document.createElement("img");
    layer.className = "dyn-reveal";
    layer.src = src;
    layer.alt = "";
    card.appendChild(layer);
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => layer.classList.add("is-in"));
      });
      window.setTimeout(() => {
        setImg(card, src);
        layer.remove();
        resolve();
      }, 720);
    });
  }

  const STYLE = `
html.dyn-mosaic-on .mosaic-tile-slot,
html.dyn-mosaic-on .mosaic-asset {
  visibility: hidden !important;
}
html.dyn-mosaic-on .mosaic-layout > .asset-view,
html.dyn-mosaic-on .v2-qr-tile,
html.dyn-mosaic-on .qr-tile,
html.dyn-mosaic-on .v2-logo,
html.dyn-mosaic-on .v2-logo-tile,
html.dyn-mosaic-on .event-logo,
html.dyn-mosaic-on .logo-tile {
  visibility: hidden !important;
  opacity: 0 !important;
}
#dyn-mosaic-theme {
  position: absolute;
  inset: 0;
  /* Above the message overlay (z 5) so handoff fades reveal themed chrome. */
  z-index: 6;
  pointer-events: none;
  box-sizing: border-box;
  overflow: hidden;
  container-type: size;
}
#dyn-mosaic-theme .dyn-card {
  position: relative;
  background: #111;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12);
}
#dyn-mosaic-theme .dyn-card:not(.dyn-feed-ready) {
  opacity: 0 !important;
}
#dyn-mosaic-theme .dyn-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}
#dyn-mosaic-theme img.dyn-feed-out {
  opacity: 0 !important;
  transition: opacity 0.75s ease;
}
#dyn-mosaic-theme img.dyn-feed-in {
  opacity: 0;
}
#dyn-mosaic-theme img.dyn-feed-in.is-on {
  opacity: 1;
  transition: opacity 0.75s ease;
}
#dyn-mosaic-theme .dyn-reveal {
  position: absolute;
  inset: 0;
  z-index: 3;
  transform: translateY(100%);
  transition: transform 0.7s cubic-bezier(0.22, 0.82, 0.18, 1);
}
#dyn-mosaic-theme .dyn-reveal.is-in {
  transform: translateY(0);
}
#dyn-mosaic-theme .dyn-card.is-exit {
  opacity: 0;
}

#dyn-mosaic-theme[data-theme="decks"] {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12%;
  padding: 8% 6% 16%;
  overflow: visible;
}
#dyn-mosaic-theme[data-theme="decks"] .dyn-pile {
  position: relative;
  width: min(26vw, 360px);
  aspect-ratio: 2 / 3;
  flex: 0 0 auto;
  overflow: visible;
}
#dyn-mosaic-theme[data-theme="decks"] .dyn-card {
  position: absolute;
  inset: 0;
  transform-origin: 50% 50%;
  transition: transform 0.55s cubic-bezier(0.22, 0.8, 0.2, 1);
}
#dyn-mosaic-theme[data-theme="decks"] .dyn-card.is-dealing,
#dyn-mosaic-theme[data-theme="decks"] .dyn-card.is-face {
  transition: none;
}

#dyn-mosaic-theme[data-theme="spotlight"] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3.8%;
  padding: 4% 8% 13%;
}
#dyn-mosaic-theme[data-theme="spotlight"] .dyn-hero {
  position: relative;
  width: min(42vw, 520px);
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 18px;
  flex: 0 0 auto;
}
#dyn-mosaic-theme[data-theme="spotlight"] .dyn-hero .dyn-card {
  position: absolute;
  inset: 0;
  transition: transform 0.85s cubic-bezier(0.22, 0.8, 0.2, 1);
}
#dyn-mosaic-theme[data-theme="spotlight"] .dyn-hero .is-from-bottom {
  transform: translateY(100%);
}
#dyn-mosaic-theme[data-theme="spotlight"] .dyn-hero .is-exit {
  transform: translateY(-100%);
  opacity: 1;
}
#dyn-mosaic-theme[data-theme="spotlight"] .dyn-strip {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1.4%;
  width: min(86vw, 1100px);
  height: auto;
}
#dyn-mosaic-theme[data-theme="spotlight"] .dyn-strip .dyn-card {
  flex: 0 0 auto;
  height: min(18vh, 168px);
  aspect-ratio: 2 / 3;
  width: auto;
  position: relative;
}

#dyn-mosaic-theme[data-theme="coverflow"] {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6% 4% 14%;
}
#dyn-mosaic-theme[data-theme="coverflow"] .dyn-stage {
  position: relative;
  width: 100%;
  height: min(68vh, 720px);
  perspective: 1400px;
  transform-style: preserve-3d;
  isolation: isolate;
}
#dyn-mosaic-theme[data-theme="coverflow"] .dyn-card {
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(26vw, 360px);
  aspect-ratio: 2 / 3;
  margin-left: calc(min(26vw, 360px) / -2);
  margin-top: calc(min(26vw, 360px) * -0.75);
  transform-origin: 50% 50%;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.22, 0.8, 0.2, 1), opacity 0.5s ease;
}

#dyn-mosaic-theme[data-theme="fan"] {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 5% 1% 12%;
  perspective: 1600px;
  perspective-origin: 50% 50%;
}
#dyn-mosaic-theme[data-theme="fan"] .dyn-fan,
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-fan {
  position: relative;
  width: min(92vw, 1180px);
  height: min(70vh, 760px);
  transform-style: preserve-3d;
}
#dyn-mosaic-theme[data-theme="fan"] .dyn-card,
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-card {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: min(16.5vw, 250px);
  aspect-ratio: 2 / 3;
  margin-left: calc(min(16.5vw, 250px) / -2);
  transform-origin: 50% 72%;
  overflow: visible;
  background: transparent;
  box-shadow: none;
  perspective: 1400px;
  transform-style: preserve-3d;
  transition: transform 0.9s cubic-bezier(0.22, 0.8, 0.2, 1), opacity 0.4s ease;
}
#dyn-mosaic-theme[data-theme="fan"] .dyn-fan-inner,
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-fan-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  transition: transform 0.88s cubic-bezier(0.45, 0.05, 0.2, 1);
}
#dyn-mosaic-theme[data-theme="fan"] .dyn-fan-inner.is-flipped,
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-fan-inner.is-flipped {
  transform: rotateY(180deg);
}
#dyn-mosaic-theme[data-theme="fan"] .dyn-fan-inner.is-snap,
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-fan-inner.is-snap {
  transition: none !important;
}
#dyn-mosaic-theme[data-theme="fan"] .dyn-fan-face,
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-fan-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 16px;
  background: #111;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(1px);
}
#dyn-mosaic-theme[data-theme="fan"] .dyn-fan-back,
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-fan-back {
  transform: rotateY(180deg) translateZ(1px);
}
#dyn-mosaic-theme[data-theme="fan"] .dyn-card.is-tucked,
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-card.is-tucked {
  opacity: 0;
}

#dyn-mosaic-theme[data-theme="filmstrip"] {
  display: flex;
  align-items: center;
  padding: 0 0 10%;
}
#dyn-mosaic-theme[data-theme="filmstrip"] .dyn-window {
  width: 100%;
  overflow: hidden;
}
#dyn-mosaic-theme[data-theme="filmstrip"] .dyn-track {
  display: flex;
  gap: 2.4vw;
  padding-left: 8vw;
  transition: transform 0.8s cubic-bezier(0.22, 0.8, 0.2, 1);
  will-change: transform;
}
#dyn-mosaic-theme[data-theme="filmstrip"] .dyn-card {
  flex: 0 0 min(24vw, 360px);
  width: min(24vw, 360px);
  aspect-ratio: 2 / 3;
}

#dyn-mosaic-theme[data-theme="scatter"] {
  overflow: hidden;
}
#dyn-mosaic-theme[data-theme="scatter"] .dyn-card {
  position: absolute;
  width: min(16vw, 230px);
  aspect-ratio: 2 / 3;
  height: auto;
  transition: transform 0.95s cubic-bezier(0.22, 0.8, 0.2, 1);
}

#dyn-mosaic-theme[data-theme="cascade"] {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10%;
  padding: 5% 6% 13%;
}
#dyn-mosaic-theme[data-theme="cascade"] .dyn-col {
  position: relative;
  width: min(22vw, 300px);
  aspect-ratio: 2 / 6.2;
  height: auto;
  overflow: hidden;
  border-radius: 16px;
  flex: 0 0 auto;
}
#dyn-mosaic-theme[data-theme="cascade"] .dyn-card {
  position: absolute;
  left: 0;
  width: 100%;
  aspect-ratio: 2 / 3;
  height: auto;
  transition: top 0.7s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
}
#dyn-mosaic-theme[data-theme="cascade"] .dyn-card.is-from-bottom {
  transform: translateY(30%);
}

#dyn-mosaic-theme[data-theme="orbit"] {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4% 4% 12%;
}
#dyn-mosaic-theme[data-theme="orbit"] .dyn-orbit {
  position: relative;
  width: min(70vw, 820px);
  height: min(70vh, 720px);
}
#dyn-mosaic-theme[data-theme="orbit"] .dyn-orbit-ring {
  position: absolute;
  inset: 0;
  transition: transform 0.9s cubic-bezier(0.22, 0.8, 0.2, 1);
}
#dyn-mosaic-theme[data-theme="orbit"] .dyn-card {
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(18vw, 260px);
  aspect-ratio: 2 / 3;
  margin-left: calc(min(18vw, 260px) / -2);
  margin-top: calc(min(18vw, 260px) * -0.75);
  transition: transform 0.9s cubic-bezier(0.22, 0.8, 0.2, 1), box-shadow 0.4s ease;
}
#dyn-mosaic-theme[data-theme="orbit"] .dyn-card.is-front {
  z-index: 8;
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.18);
}

#dyn-mosaic-theme[data-theme="billboard"] {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4% 8% 12%;
}
#dyn-mosaic-theme[data-theme="billboard"] .dyn-billboard {
  position: relative;
  width: min(42vw, 520px);
  aspect-ratio: 2 / 3;
  height: auto;
  overflow: hidden;
  border-radius: 18px;
}
#dyn-mosaic-theme[data-theme="billboard"] .dyn-card {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  transition: transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
}
#dyn-mosaic-theme[data-theme="billboard"] .dyn-card.is-from-bottom {
  transform: translateY(100%);
}

#dyn-mosaic-theme[data-theme="reels"] {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10%;
  padding: 5% 6% 13%;
}
#dyn-mosaic-theme[data-theme="reels"] .dyn-reel {
  position: relative;
  width: min(24vw, 340px);
  aspect-ratio: 2 / 3;
  height: auto;
  overflow: hidden;
  border-radius: 16px;
  flex: 0 0 auto;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}
#dyn-mosaic-theme[data-theme="reels"] .dyn-reel-strip {
  display: flex;
  flex-direction: column;
  width: 100%;
  transition: transform 0.95s cubic-bezier(0.22, 0.82, 0.18, 1);
}
#dyn-mosaic-theme[data-theme="reels"] .dyn-card {
  flex: 0 0 var(--frame, 100%);
  width: 100%;
  height: var(--frame, 100%);
  aspect-ratio: auto;
  border-radius: 0;
  box-shadow: none;
}

#dyn-mosaic-theme[data-theme="polaroid"] {
  overflow: hidden;
  background:
    radial-gradient(ellipse 70% 55% at 50% 42%, rgba(18, 48, 62, 0.4), transparent 62%),
    #000;
}
#dyn-mosaic-theme[data-theme="polaroid"] .dyn-polaroid-stage {
  position: absolute;
  transform-origin: top left;
}
#dyn-mosaic-theme[data-theme="polaroid"] .dyn-polaroid-pos {
  position: absolute;
  will-change: transform;
}
#dyn-mosaic-theme[data-theme="polaroid"] .dyn-polaroid-inner {
  position: relative;
  display: inline-block;
  opacity: 0;
  will-change: transform, opacity;
}
#dyn-mosaic-theme[data-theme="polaroid"] .dyn-polaroid {
  background: var(--polaroid-frame, #fff);
  border-radius: 3px;
  padding: 12px 12px 14px 12px;
  overflow: visible;
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.5),
    0 2px 6px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}
#dyn-mosaic-theme[data-theme="polaroid"] .dyn-polaroid img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: center center;
  border-radius: 1px;
  background: #222;
}
#dyn-mosaic-theme[data-theme="polaroid"] .dyn-polaroid-band {
  display: block;
  margin-top: 10px;
}
#dyn-mosaic-theme[data-theme="polaroid"] .anim-enter-drop {
  animation: dyn-drop-in 0.55s cubic-bezier(0.22, 1.2, 0.36, 1) both;
}
#dyn-mosaic-theme[data-theme="polaroid"] .anim-enter-toss {
  animation: dyn-toss-in 0.5s cubic-bezier(0.25, 1.3, 0.5, 1) both;
}
#dyn-mosaic-theme[data-theme="polaroid"] .anim-enter-place {
  animation: dyn-place-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
#dyn-mosaic-theme[data-theme="polaroid"] .anim-exit {
  animation: dyn-lift-out 0.6s ease-in both;
}
@keyframes dyn-drop-in {
  0% { transform: translateY(-70px) scale(1.08) rotate(var(--drop-rot, 3deg)); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
}
@keyframes dyn-toss-in {
  0% { transform: translateX(var(--toss-x, -50px)) translateY(-40px) scale(1.1) rotate(var(--toss-rot, -10deg)); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(0) translateY(0) scale(1) rotate(0deg); opacity: 1; }
}
@keyframes dyn-place-in {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes dyn-lift-out {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-25px) scale(0.94); opacity: 0; }
}

#dyn-mosaic-theme[data-theme="flipwall"] {
  overflow: hidden;
  background: #000;
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-flip-stage {
  position: absolute;
  transform-origin: top left;
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-flip-grid {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: repeat(var(--flip-cols, 7), minmax(0, 1fr));
  grid-template-rows: repeat(var(--flip-rows, 4), minmax(0, 1fr));
  gap: 12px;
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-tile-scene {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  perspective: 1100px;
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-tile {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 800ms cubic-bezier(0.4, 0, 0.2, 1);
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-tile-face,
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-tile-edge {
  position: absolute;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-tile-face {
  inset: 0;
  width: 100%;
  height: 100%;
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-flip-front {
  transform: translateZ(calc(var(--flip-depth, 56px) / 2));
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-flip-back {
  transform: rotateY(180deg) translateZ(calc(var(--flip-depth, 56px) / 2));
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-tile-face img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-card {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-tile-edge {
  background: linear-gradient(
    180deg,
    var(--flip-edge, #5a5e66) 0%,
    color-mix(in srgb, var(--flip-edge, #5a5e66) 32%, #000) 100%
  );
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-edge-left {
  width: var(--flip-depth, 56px); height: 100%; top: 0; left: 0;
  transform-origin: left center;
  transform: rotateY(-90deg) translateX(calc(var(--flip-depth, 56px) / -2));
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-edge-right {
  width: var(--flip-depth, 56px); height: 100%; top: 0; right: 0;
  transform-origin: right center;
  transform: rotateY(90deg) translateX(calc(var(--flip-depth, 56px) / 2));
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-edge-top {
  width: 100%; height: var(--flip-depth, 56px); top: 0; left: 0;
  transform-origin: center top;
  transform: rotateX(90deg) translateY(calc(var(--flip-depth, 56px) / -2));
}
#dyn-mosaic-theme[data-theme="flipwall"] .dyn-edge-bottom {
  width: 100%; height: var(--flip-depth, 56px); bottom: 0; left: 0;
  transform-origin: center bottom;
  transform: rotateX(-90deg) translateY(calc(var(--flip-depth, 56px) / 2));
}

#dyn-mosaic-theme[data-theme="livewall"] {
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 50% -10%, rgba(139, 92, 255, 0.1), transparent 55%),
    radial-gradient(120% 80% at 50% 110%, rgba(255, 62, 127, 0.09), transparent 55%),
    #05060a;
}
#dyn-mosaic-theme[data-theme="livewall"] .dyn-live-world {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  transform-origin: 0 0;
  will-change: transform;
}
#dyn-mosaic-theme[data-theme="livewall"] .dyn-live-tile {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: #11141c;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  transition: opacity 360ms ease, filter 360ms ease;
}
#dyn-mosaic-theme[data-theme="livewall"] .dyn-live-tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform-origin: 50% 50%;
  will-change: transform, opacity;
  backface-visibility: hidden;
  transition: opacity 300ms ease;
}
#dyn-mosaic-theme[data-theme="livewall"] .dyn-live-tile.is-dormant {
  opacity: 0.16;
  filter: saturate(0.75) brightness(0.75);
}
#dyn-mosaic-theme[data-theme="livewall"] .dyn-live-tile.is-dormant img {
  opacity: 0;
}
#dyn-mosaic-theme[data-theme="livewall"] .dyn-live-tile.is-pending img {
  opacity: 0;
  transform: scale(0.28) rotate(-8deg);
}
#dyn-mosaic-theme[data-theme="livewall"] .dyn-live-tile.is-pending::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, #11141c 30%, #1c2130 50%, #11141c 70%);
  background-size: 220% 100%;
  animation: dyn-shimmer 1.2s ease-in-out infinite;
}
@keyframes dyn-shimmer {
  0% { background-position: 140% 0; }
  100% { background-position: -140% 0; }
}
#dyn-mosaic-theme[data-theme="livewall"] .dyn-live-tile.is-arrive img {
  animation: dyn-live-pop 0.58s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes dyn-live-pop {
  0% { opacity: 0; transform: scale(0.28) rotate(-8deg); }
  60% { opacity: 1; }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}
#dyn-mosaic-theme[data-theme="livewall"] .dyn-live-tile.is-flash::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;
  box-shadow: 0 0 0 3px #ff3e7f, 0 0 22px 4px rgba(255, 62, 127, 0.55);
  animation: dyn-ring-fade 1.1s ease-out forwards;
  pointer-events: none;
  z-index: 2;
}
@keyframes dyn-ring-fade {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
#dyn-mosaic-theme[data-theme="livewall"] .dyn-live-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  background: radial-gradient(120% 120% at 50% 50%, transparent 58%, rgba(0, 0, 0, 0.45) 100%);
}

#dyn-mosaic-theme[data-theme="cubes"],
#dyn-mosaic-theme[data-theme="depthfield"] {
  overflow: hidden;
  background: #050506;
}
#dyn-mosaic-theme[data-theme="cubes"] canvas,
#dyn-mosaic-theme[data-theme="depthfield"] canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
#dyn-mosaic-theme[data-theme="cubes"] .dyn-cube-vignette,
#dyn-mosaic-theme[data-theme="depthfield"] .dyn-cube-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
  background:
    radial-gradient(ellipse 88% 78% at 50% 48%, transparent 52%, rgba(0, 0, 0, 0.38) 100%);
}

#dyn-mosaic-theme[data-theme="pedestals"] {
  overflow: hidden;
  background: #000;
  --pedestal-color: #54585f;
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-stage {
  position: absolute;
  width: 100%;
  height: 100%;
  transform-origin: top left;
  perspective: 2000px;
  perspective-origin: 50% 44%;
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-wall {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: rotateX(14deg) rotateY(-24deg);
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped {
  position: absolute;
  transform-style: preserve-3d;
  will-change: transform;
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-face {
  position: absolute;
  overflow: hidden;
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-face::before {
  content: "";
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  pointer-events: none;
  z-index: 2;
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-photo {
  inset: 0;
  background: #000;
  backface-visibility: hidden;
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-photo::after {
  content: "";
  position: absolute;
  inset: 0;
  box-shadow:
    inset 0 0 0 2px rgba(0, 0, 0, 0.45),
    inset 0 0 52px 12px rgba(0, 0, 0, 0.5),
    inset 0 26px 70px rgba(0, 0, 0, 0.22);
  background: linear-gradient(125deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0) 40%, rgba(0, 0, 0, 0.2));
  pointer-events: none;
  z-index: 3;
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-top {
  background: linear-gradient(to top, var(--pedestal-color, #54585f) 0%, #000 100%);
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-bottom {
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--pedestal-color, #54585f) 52%, #000) 0%,
    #000 100%
  );
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-left {
  background: linear-gradient(
    to left,
    color-mix(in srgb, var(--pedestal-color, #54585f) 68%, #000) 0%,
    #000 100%
  );
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-ped-right {
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--pedestal-color, #54585f) 80%, #000) 0%,
    #000 100%
  );
}
#dyn-mosaic-theme[data-theme="pedestals"] .dyn-card {
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  overflow: visible;
}

#dyn-mosaic-theme.dyn-portrait[data-theme="decks"] {
  flex-wrap: wrap;
  align-content: center;
  gap: 5% 8%;
  padding: 10% 8% 16%;
}
#dyn-mosaic-theme.dyn-portrait[data-theme="decks"] .dyn-pile {
  width: min(38cqw, 320px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="spotlight"] {
  padding: 6% 6% 14%;
  gap: 4%;
}
#dyn-mosaic-theme.dyn-portrait[data-theme="spotlight"] .dyn-hero {
  width: min(72cqw, 520px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="spotlight"] .dyn-strip {
  width: min(88cqw, 720px);
  flex-wrap: wrap;
}
#dyn-mosaic-theme.dyn-portrait[data-theme="spotlight"] .dyn-strip .dyn-card {
  height: min(14cqh, 160px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="coverflow"] .dyn-stage {
  height: min(72cqh, 980px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="coverflow"] .dyn-card {
  width: min(48cqw, 360px);
  margin-left: calc(min(48cqw, 360px) / -2);
  margin-top: calc(min(48cqw, 360px) * -0.75);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="fan"] .dyn-fan,
#dyn-mosaic-theme.dyn-portrait[data-theme="fan-brand"] .dyn-fan {
  width: min(96cqw, 720px);
  height: min(62cqh, 900px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="fan"] .dyn-card,
#dyn-mosaic-theme.dyn-portrait[data-theme="fan-brand"] .dyn-card {
  width: min(30cqw, 230px);
  margin-left: calc(min(30cqw, 230px) / -2);
}
/* Fan*: content stays in the open rail — landscape right chrome, portrait bottom chrome. */
#dyn-mosaic-theme[data-theme="fan-brand"] {
  padding: 0;
  align-items: stretch;
  justify-content: stretch;
  perspective: 1600px;
  perspective-origin: 50% 58%;
}
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-brand-frame {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 6% 5% 14% 5%;
  perspective: 1600px;
  perspective-origin: 50% 58%;
}
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-brand-frame.is-reserved {
  right: 22%;
  padding: 5% 3% 12% 6%;
  justify-content: center;
}
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-brand-frame.is-reserved .dyn-fan {
  width: min(84cqw, 780px);
  height: min(72cqh, 680px);
}
#dyn-mosaic-theme[data-theme="fan-brand"] .dyn-brand-frame.is-reserved .dyn-card {
  width: min(18cqw, 210px);
  margin-left: calc(min(18cqw, 210px) / -2);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="fan-brand"] .dyn-brand-frame.is-reserved {
  right: 0;
  bottom: 18%;
  padding: 7% 7% 5%;
  align-items: flex-end;
  justify-content: center;
}
#dyn-mosaic-theme.dyn-portrait[data-theme="fan-brand"] .dyn-brand-frame.is-reserved .dyn-fan {
  width: min(96cqw, 640px);
  height: min(66cqh, 760px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="fan-brand"] .dyn-brand-frame.is-reserved .dyn-card {
  width: min(26cqw, 200px);
  margin-left: calc(min(26cqw, 200px) / -2);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="filmstrip"] {
  padding: 0 0 12%;
}
#dyn-mosaic-theme.dyn-portrait[data-theme="filmstrip"] .dyn-card {
  flex: 0 0 min(58cqw, 360px);
  width: min(58cqw, 360px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="scatter"] .dyn-card {
  width: min(38cqw, 230px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="cascade"] {
  flex-wrap: wrap;
  gap: 6%;
  padding: 8% 8% 14%;
}
#dyn-mosaic-theme.dyn-portrait[data-theme="cascade"] .dyn-col {
  width: min(38cqw, 300px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="orbit"] .dyn-orbit {
  width: min(88cqw, 820px);
  height: min(52cqh, 820px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="orbit"] .dyn-card {
  width: min(32cqw, 260px);
  margin-left: calc(min(32cqw, 260px) / -2);
  margin-top: calc(min(32cqw, 260px) * -0.75);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="billboard"] .dyn-billboard {
  width: min(78cqw, 520px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="reels"] {
  flex-direction: column;
  gap: 4%;
  padding: 8% 8% 14%;
}
#dyn-mosaic-theme.dyn-portrait[data-theme="reels"] .dyn-reel {
  width: min(58cqw, 340px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="flipwall"] .dyn-flip-grid {
  grid-template-columns: repeat(var(--flip-cols, 4), minmax(0, 1fr));
  grid-template-rows: repeat(var(--flip-rows, 7), minmax(0, 1fr));
}

/* Brand-aware variants (*): content lives in .dyn-brand-frame; chrome sits in the rail. */
#dyn-mosaic-theme[data-theme$="-brand"] .dyn-brand-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  box-sizing: border-box;
  container-type: size;
}
#dyn-mosaic-theme[data-theme$="-brand"] .dyn-brand-frame.is-reserved {
  right: 20%;
}
#dyn-mosaic-theme.dyn-portrait[data-theme$="-brand"] .dyn-brand-frame.is-reserved {
  right: 0;
  bottom: 15%;
}
/* Card decks*: keep piles in-flow on the root and open a right/bottom rail. */
#dyn-mosaic-theme[data-theme="decks-brand"].dyn-show-qr,
#dyn-mosaic-theme[data-theme="decks-brand"].dyn-show-logo {
  justify-content: flex-start;
  padding-left: 5%;
  padding-right: 22%;
  gap: 7%;
}
#dyn-mosaic-theme[data-theme="decks-brand"].dyn-show-qr .dyn-pile,
#dyn-mosaic-theme[data-theme="decks-brand"].dyn-show-logo .dyn-pile {
  width: min(22vw, 300px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme="decks-brand"].dyn-show-qr,
#dyn-mosaic-theme.dyn-portrait[data-theme="decks-brand"].dyn-show-logo {
  padding-right: 8%;
  padding-bottom: 18%;
  justify-content: center;
}
#dyn-mosaic-theme[data-theme$="-brand"] > .dyn-brand-chrome .dyn-brand-logo {
  left: auto;
  right: 3.2%;
  top: 4%;
  width: min(15%, 170px);
}
#dyn-mosaic-theme[data-theme$="-brand"] > .dyn-brand-chrome .dyn-brand-qr {
  right: 3.2%;
  bottom: 4%;
  width: min(15%, 160px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme$="-brand"] > .dyn-brand-chrome .dyn-brand-logo {
  top: auto;
  bottom: 4.2%;
  left: 4%;
  right: auto;
  width: min(22%, 160px);
}
#dyn-mosaic-theme.dyn-portrait[data-theme$="-brand"] > .dyn-brand-chrome .dyn-brand-qr {
  bottom: 4.2%;
  right: 4%;
  width: min(20%, 150px);
}
`.replace(
    /#dyn-mosaic-theme\.dyn-portrait\[data-theme="([^"]+)"\]/g,
    '#dyn-mosaic-theme.dyn-portrait:is([data-theme="$1"], [data-engine="$1"])'
  )
  .replace(
    /#dyn-mosaic-theme\[data-theme="([^"]+)"\]/g,
    '#dyn-mosaic-theme:is([data-theme="$1"], [data-engine="$1"])'
  )
  .replace(/(\d*\.?\d+)vh\b/g, "$1cqh")
  .replace(/(\d*\.?\d+)vw\b/g, "$1cqw");

  function stageSize(parent) {
    const rules = root.BGExtensionRules;
    if (rules && typeof rules.resolveStageSize === "function") {
      return rules.resolveStageSize(parent);
    }
    const rw = (parent && parent.clientWidth) || window.innerWidth || 1920;
    const rh = (parent && parent.clientHeight) || window.innerHeight || 1080;
    const portrait = rh > rw;
    const long = 1920;
    return {
      dw: portrait ? Math.max(1, Math.round(long * (rw / rh))) : long,
      dh: portrait ? long : Math.max(1, Math.round(long * (rh / rw))),
      portrait,
      mode: "auto",
    };
  }

  const SCATTER_SLOTS = [
    { x: 8, y: 6, r: -14 },
    { x: 36, y: 4, r: 8 },
    { x: 62, y: 8, r: -7 },
    { x: 12, y: 36, r: 11 },
    { x: 40, y: 32, r: -5 },
    { x: 66, y: 38, r: 13 },
    { x: 18, y: 62, r: -9 },
    { x: 50, y: 58, r: 6 },
  ];

  const SCATTER_SLOTS_PORTRAIT = [
    { x: 10, y: 4, r: -12 },
    { x: 52, y: 6, r: 8 },
    { x: 14, y: 24, r: 10 },
    { x: 56, y: 28, r: -6 },
    { x: 8, y: 46, r: -8 },
    { x: 50, y: 50, r: 12 },
    { x: 16, y: 68, r: 6 },
    { x: 54, y: 72, r: -10 },
  ];

  function layoutCoverflow(cards, center) {
    const n = cards.length;
    cards.forEach((card, i) => {
      let delta = i - (center % n);
      if (delta > n / 2) delta -= n;
      if (delta < -n / 2) delta += n;
      const abs = Math.abs(delta);
      if (abs > 3) {
        card.style.opacity = "0";
        card.style.transform = `translateX(${delta * 42}%) translateZ(-80px) rotateY(${delta * -55}deg) scale(0.7)`;
        card.style.zIndex = "0";
        return;
      }
      const x = delta * 38;
      const rot = delta * -52;
      const scale = delta === 0 ? 1 : 0.82 - abs * 0.05;
      const depth = (3 - abs) * 70;
      card.style.opacity = String(1 - abs * 0.12);
      card.style.zIndex = String(20 - abs);
      card.style.transform = `translateX(${x}%) translateZ(${depth}px) rotateY(${rot}deg) scale(${scale})`;
    });
  }

  function fanChromeReserved(mountRoot) {
    const host =
      (mountRoot && mountRoot.closest && mountRoot.closest("#dyn-mosaic-theme")) ||
      (mountRoot && mountRoot.id === "dyn-mosaic-theme" ? mountRoot : null);
    if (!host) return false;
    return host.classList.contains("dyn-show-qr") || host.classList.contains("dyn-show-logo");
  }

  function layoutFan(cards, frontIndex, opts) {
    const n = cards.length;
    const reserved = !!(opts && opts.reserved);
    const span = reserved ? 48 : 58;
    const xSpread = reserved ? 260 : 400;
    const front = frontIndex == null ? Math.floor(n / 2) : frontIndex;
    cards.forEach((card, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const rot = (t - 0.5) * span;
      const x = (t - 0.5) * xSpread;
      const dist = Math.abs(t - 0.5);
      const isFront = i === front;
      card.classList.remove("is-tucked");
      card.style.zIndex = isFront ? "50" : String(Math.round(40 - dist * 60));
      card.style.transform =
        "translateX(" +
        x.toFixed(2) +
        "%) rotate(" +
        rot.toFixed(2) +
        "deg) translateY(" +
        (isFront ? -3 : dist * 4).toFixed(2) +
        "%)";
      card.dataset.rot = String(rot);
    });
  }

  function layoutFanStacked(cards, frontIndex) {
    const n = cards.length;
    const front = frontIndex == null ? Math.floor(n / 2) : frontIndex;
    cards.forEach((card, i) => {
      const isFront = i === front;
      card.classList.toggle("is-tucked", !isFront);
      card.style.zIndex = isFront ? "50" : String(10 + i);
      card.style.transform = "rotate(0deg) translateY(0)";
      card.dataset.rot = "0";
    });
  }

  function fanAlive(state) {
    return Boolean(state && !state.stopped && state.fan && state.fan.isConnected);
  }

  function preloadFanUrls(urls) {
    (urls || []).forEach((src) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    });
  }

  function applyFanSet(state, urls) {
    (urls || []).forEach((src, i) => {
      const card = state.cards[i];
      if (!card || !src) return;
      setImg(card, src);
      state.urls[i] = src;
    });
  }

  function fanHeroInner(state) {
    const hero = state && state.cards ? state.cards[state.front] : null;
    return hero ? hero.querySelector(".dyn-fan-inner") : null;
  }

  function setFanBack(card, src) {
    const img = card && card.querySelector(".dyn-fan-back-img");
    if (!img || !src) return Promise.resolve();
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      if ((img.currentSrc || img.src) === src && img.complete && img.naturalWidth) {
        done();
        return;
      }
      img.src = src;
      window.setTimeout(done, 900);
    });
  }

  function snapFanInner(inner) {
    if (!inner) return;
    inner.classList.add("is-snap");
    inner.classList.remove("is-flipped");
    void inner.offsetWidth;
    inner.classList.remove("is-snap");
  }

  function flipFanPile(state, nextUrls, onDone) {
    const hero = state.cards[state.front];
    const inner = fanHeroInner(state);
    const finish = () => {
      if (typeof onDone === "function") onDone();
    };
    if (!hero || !inner) {
      applyFanSet(state, nextUrls);
      finish();
      return;
    }
    const nextHero = (nextUrls && nextUrls[state.front]) || "";
    setFanBack(hero, nextHero).then(() => {
      if (!fanAlive(state)) return;
      inner.classList.add("is-flipped");
      fanLater(state, 900, () => {
        if (!fanAlive(state)) return;
        applyFanSet(state, nextUrls);
        snapFanInner(inner);
        finish();
      });
    });
  }

  function runFanCycle(state) {
    if (!fanAlive(state) || state.running) return;
    state.running = true;
    const reserved = fanChromeReserved(state.mountRoot);
    (state.cards || []).forEach((card) => snapFanInner(card.querySelector(".dyn-fan-inner")));
    layoutFan(state.cards, state.front, { reserved });
    fanLater(state, 920 + 2400, () => {
      if (!fanAlive(state)) {
        state.running = false;
        return;
      }
      const nextUrls = pickFanSet(state.poolRef || [], state.api, state.cards.length, state.urls);
      preloadFanUrls(nextUrls);
      layoutFanStacked(state.cards, state.front);
      fanLater(state, 920, () => {
        if (!fanAlive(state)) {
          state.running = false;
          return;
        }
        flipFanPile(state, nextUrls, () => {
          fanLater(state, 720, () => {
            state.running = false;
            if (!fanAlive(state)) return;
            runFanCycle(state);
          });
        });
      });
    });
  }

  function pickFanSet(pool, api, count, avoidList) {
    const avoid = new Set((avoidList || []).filter(Boolean));
    const out = [];
    for (let i = 0; i < count; i += 1) {
      let src = "";
      for (let attempt = 0; attempt < 16; attempt += 1) {
        const hint = out[out.length - 1] || [...avoid][0] || "";
        src = feedSrc(api, pool, hint) || pickRandomUrl(pool, hint) || urlAt(pool, i + attempt);
        if (src && !out.includes(src) && (!avoid.has(src) || attempt > 8)) break;
      }
      if (!src) src = urlAt(pool, i);
      out.push(src);
      avoid.add(src);
    }
    return out;
  }

  function clearFanTimers(state) {
    (state.timers || []).forEach((id) => window.clearTimeout(id));
    state.timers = [];
  }

  function fanLater(state, ms, fn) {
    if (!state.timers) state.timers = [];
    const id = window.setTimeout(fn, ms);
    state.timers.push(id);
    return id;
  }

  function sizeReelFrames(reel) {
    const h = reel.reel.clientHeight || reel.reel.getBoundingClientRect().height || 1;
    reel.reel.style.setProperty("--frame", h + "px");
    return h;
  }

  function snapReelStrip(reel, animate) {
    const cards = [...reel.strip.children];
    const target = cards[Math.min(Math.max(0, reel.index), Math.max(0, cards.length - 1))];
    const y = target ? target.offsetTop : 0;
    if (!animate) reel.strip.style.transition = "none";
    reel.strip.style.transform = "translateY(" + -y + "px)";
    if (!animate) {
      reel.strip.offsetHeight;
      reel.strip.style.transition = "";
    }
  }

  function layoutOrbit(cards, angle) {
    const n = cards.length;
    const step = 360 / Math.max(n, 1);
    const radius = "min(28cqh, 240px)";
    cards.forEach((card, i) => {
      const deg = angle + i * step;
      const wrapped = ((deg % 360) + 360) % 360;
      const dist = Math.min(wrapped, 360 - wrapped);
      const front = dist < step * 0.55;
      card.classList.toggle("is-front", front);
      const scale = front ? 1 : 0.88;
      card.style.zIndex = front ? "24" : String(Math.round(8 - dist / 45));
      card.style.transform = `rotate(${deg}deg) translateY(calc(-1 * ${radius})) rotate(${-deg}deg) scale(${scale})`;
    });
  }

  function fanDeckTransform(index, count) {
    const n = Math.max(count, 1);
    const t = index - (n - 1) / 2;
    const rot = t * 4.8;
    const x = t * 8;
    const y = (n - 1 - index) * 14;
    return `translate(${x}px, ${y}px) rotate(${rot}deg)`;
  }

  function restackDeck(pileEl, skip) {
    const cards = [...pileEl.children].filter(
      (card) =>
        card !== skip &&
        !card.classList.contains("is-dealing") &&
        !card.classList.contains("is-face")
    );
    cards.forEach((card, i) => {
      card.style.zIndex = String(i + 1);
      card.style.transform = fanDeckTransform(i, cards.length);
    });
  }

  function pickFairTurn(state, count, busy) {
    if (!state.wait) state.wait = Array.from({ length: count }, () => 0);
    const open = [];
    for (let i = 0; i < count; i += 1) {
      if (busy && busy[i]) continue;
      open.push(i);
    }
    if (!open.length) return -1;
    const forced = open.filter((i) => state.wait[i] >= Math.max(count - 1, 1));
    const choices = forced.length ? forced : open;
    const weights = choices.map((i) => state.wait[i] + 1);
    let total = 0;
    weights.forEach((w) => {
      total += w;
    });
    let roll = Math.random() * total;
    let pick = choices[0];
    for (let i = 0; i < choices.length; i += 1) {
      roll -= weights[i];
      if (roll <= 0) {
        pick = choices[i];
        break;
      }
    }
    for (let i = 0; i < count; i += 1) {
      state.wait[i] = i === pick ? 0 : state.wait[i] + 1;
    }
    return pick;
  }

  function dealFromSide(pileEl, incoming, face, dir) {
    const fullCount = pileEl.children.length;
    const startPose = incoming.style.transform || fanDeckTransform(0, fullCount);
    const coverPose =
      (face && face.style.transform) || fanDeckTransform(fullCount - 1, fullCount);
    const outPose = `${coverPose} translateX(${dir * 105}%) rotate(${dir * 5}deg) scale(0.95)`;

    incoming.classList.add("is-dealing");
    incoming.style.zIndex = "1";
    incoming.style.transform = startPose;
    if (face) {
      face.classList.add("is-face");
      face.style.zIndex = "10";
    }

    const duration = 1200;
    const deal = incoming.animate(
      [
        { transform: startPose, offset: 0, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
        { transform: outPose, offset: 0.42, easing: "linear" },
        { transform: outPose, offset: 0.5, easing: "cubic-bezier(0, 0, 0.2, 1)" },
        { transform: coverPose, offset: 1 },
      ],
      { duration, fill: "forwards" }
    );

    window.setTimeout(() => {
      incoming.style.zIndex = "20";
      if (face) face.style.zIndex = "5";
    }, duration * 0.5);

    const finish = () => {
      try {
        deal.commitStyles();
        deal.cancel();
      } catch (err) {
        /* ignore */
      }
      incoming.style.transform = coverPose;
      incoming.style.zIndex = "20";
      pileEl.appendChild(incoming);
    };

    return deal.finished.then(finish).catch(finish);
  }

  function layoutCascade(colEl, urls) {
    while (urls.length > 2) urls.shift();
    while (colEl.children.length > 2) {
      colEl.firstElementChild.remove();
    }
    [...colEl.children].forEach((card, i) => {
      card.style.top = i === 0 ? "0%" : "52%";
      card.style.zIndex = String(i + 1);
      card.classList.remove("is-from-bottom");
    });
  }

  const themes = {
    decks: {
      interval: 2800,
      mount(root, pool) {
        const pileCount = 3;
        const perPile = 5;
        const piles = Array.from({ length: pileCount }, () => []);
        const pileEls = [];
        const urls = fill(pool, pileCount * perPile);
        urls.forEach((src, i) => piles[i % pileCount].push(src));
        piles.forEach((pile, pileIndex) => {
          const pileEl = document.createElement("div");
          pileEl.className = "dyn-pile";
          pileEl.dataset.pile = String(pileIndex);
          pile.forEach((src) => pileEl.appendChild(makeCard(src)));
          restackDeck(pileEl);
          root.appendChild(pileEl);
          pileEls.push(pileEl);
        });
        return { piles, pileEls, perPile, dealing: {}, wait: [0, 0, 0] };
      },
      tick(root, pool, state, api) {
        if (!pool.length) return;
        const usedNow = () => [...root.querySelectorAll(".dyn-card img")].map((img) => img.src);
        [...root.querySelectorAll(".dyn-card")].forEach((card) => {
          const src = imgSrc(card);
          if (!src) return;
          if (api && typeof api.isRetiring === "function" && api.isRetiring(src)) {
            const next = feedSrc(api, pool, usedNow());
            if (next && next !== src) replaceImg(card, next);
          }
        });
        const pileIndex = pickFairTurn(state, state.piles.length, state.dealing);
        if (pileIndex < 0) return;
        const pile = state.piles[pileIndex];
        const pileEl = state.pileEls[pileIndex];
        if (!pileEl || !pileEl.children.length) return;

        const incoming = pileEl.firstElementChild;
        const face = pileEl.children.length > 1 ? pileEl.lastElementChild : null;
        if (!incoming || incoming === face) return;

        restackDeck(pileEl);

        state.dealing[pileIndex] = true;
        const dir = pileIndex === 0 ? -1 : 1;
        dealFromSide(pileEl, incoming, face, dir).then(() => {
          const underSrc = face ? feedSrc(api, pool, usedNow()) : "";
          const swap =
            face && face.parentElement && face !== incoming && underSrc
              ? replaceImg(face, underSrc)
              : Promise.resolve();
          return swap.then(() => {
            if (face) face.classList.remove("is-face");
            incoming.classList.remove("is-dealing");
            [...pileEl.children].forEach((card) => {
              const src = imgSrc(card);
              if (!src) return;
              if (api && typeof api.isRetiring === "function" && api.isRetiring(src)) {
                const next = feedSrc(api, pool, usedNow());
                if (next && next !== src) replaceImg(card, next);
              }
            });
            while (pileEl.children.length < state.perPile) {
              const fillSrc = feedSrc(api, pool, usedNow());
              if (!fillSrc) break;
              const back = makeCard(fillSrc);
              back.style.opacity = "0";
              pileEl.insertBefore(back, pileEl.firstChild);
              requestAnimationFrame(() => {
                back.style.transition = "opacity 0.4s ease";
                back.style.opacity = "1";
              });
            }
            const ordered = [...pileEl.children].map((node) => imgSrc(node)).filter(Boolean);
            pile.length = 0;
            ordered.forEach((url) => pile.push(url));
            restackDeck(pileEl);
            state.dealing[pileIndex] = false;
          });
        });
      },
    },

    spotlight: {
      interval: TICK,
      mount(root, pool) {
        const heroWrap = document.createElement("div");
        heroWrap.className = "dyn-hero";
        const strip = document.createElement("div");
        strip.className = "dyn-strip";
        const taken = fill(pool, 7);
        const heroSrc = taken[0] || "";
        const hero = makeCard(heroSrc);
        heroWrap.appendChild(hero);
        const stripUrls = taken.slice(1, 7);
        stripUrls.forEach((src) => strip.appendChild(makeCard(src)));
        root.appendChild(heroWrap);
        root.appendChild(strip);
        return { heroWrap, strip, heroSrc, stripUrls, stripCursor: 0, busy: false };
      },
      tick(root, pool, state, api) {
        if (state.busy) return;
        const next = feedSrc(api, pool, state.heroSrc);
        if (!next) return;
        const prev = state.heroSrc;
        const outgoing = [...state.heroWrap.children].find(
          (node) => !node.classList.contains("is-from-bottom") && !node.classList.contains("is-exit")
        );
        const incoming = makeCard(next, "is-from-bottom");
        incoming.style.zIndex = "8";
        state.heroWrap.appendChild(incoming);
        state.busy = true;
        requestAnimationFrame(() => {
          if (outgoing) outgoing.classList.add("is-exit");
          incoming.classList.remove("is-from-bottom");
        });
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          [...state.heroWrap.children].forEach((node) => {
            if (node !== incoming) node.remove();
          });
          incoming.style.zIndex = "";
          state.busy = false;
        };
        incoming.addEventListener("transitionend", finish, { once: true });
        window.setTimeout(finish, 920);
        state.heroSrc = next;
        if (prev && prev !== next && state.stripUrls.length) {
          const slot = state.stripCursor % state.stripUrls.length;
          state.stripCursor += 1;
          state.stripUrls[slot] = prev;
          const card = state.strip.children[slot];
          if (card) revealFromBottom(card, prev);
        }
      },
    },

    coverflow: {
      interval: TICK,
      mount(root, pool) {
        const stage = document.createElement("div");
        stage.className = "dyn-stage";
        const count = 7;
        const cards = fill(pool, count).map((src) => {
          const card = makeCard(src);
          stage.appendChild(card);
          return card;
        });
        root.appendChild(stage);
        const center = 0;
        layoutCoverflow(cards, center);
        return { cards, center };
      },
      tick(root, pool, state, api) {
        if (!pool.length) return;
        const n = state.cards.length;
        const centerMod = ((state.center % n) + n) % n;
        const hiddenI = (centerMod + Math.floor(n / 2)) % n;
        const hidden = state.cards[hiddenI];
        const src = api.nextUrl(imgSrc(hidden));
        if (src) setImg(hidden, src);
        state.center += 1;
        layoutCoverflow(state.cards, state.center);
      },
    },

    fan: {
      // Self-timed: one card → fan out → hold → fold to the same card →
      // full flip to a new face → hold the new card → repeat.
      interval: 8000,
      mount(root, pool, api) {
        const fan = document.createElement("div");
        fan.className = "dyn-fan";
        const count = 6;
        const urls = fill(pool, count);
        const cards = urls.map((src) => {
          const card = makeFanCard(src);
          fan.appendChild(card);
          return card;
        });
        root.appendChild(fan);
        const front = Math.floor(count / 2);
        const state = {
          fan,
          cards,
          urls,
          front,
          stopped: false,
          running: false,
          timers: [],
          mountRoot: root,
          poolRef: pool,
          api,
        };
        layoutFanStacked(cards, front);
        fanLater(state, 800, () => runFanCycle(state));
        return state;
      },
      tick(_root, pool, state, api) {
        if (!state) return;
        state.poolRef = pool;
        if (api) state.api = api;
        if (state.stopped || state.running || !state.cards || !state.cards.length) return;
        runFanCycle(state);
      },
      unmount(_root, state) {
        if (state) {
          state.stopped = true;
          state.running = false;
        }
        clearFanTimers(state);
      },
    },

    filmstrip: {
      interval: 2200,
      mount(root, pool) {
        const win = document.createElement("div");
        win.className = "dyn-window";
        const track = document.createElement("div");
        track.className = "dyn-track";
        const count = 10;
        fill(pool, count).forEach((src) => track.appendChild(makeCard(src)));
        win.appendChild(track);
        root.appendChild(win);
        return { track, index: 0, offset: 0 };
      },
      tick(root, pool, state, api) {
        const src = api.nextUrl();
        if (!src) return;
        const stepOf = (track) => {
          const card = track.querySelector(".dyn-card");
          if (!card) return 0;
          const gap =
            parseFloat(window.getComputedStyle(track).gap) ||
            (root.clientWidth || window.innerWidth) * 0.024;
          return card.getBoundingClientRect().width + gap;
        };
        state.track.appendChild(makeCard(src));
        state.offset += 1;
        const step = stepOf(state.track);
        state.track.style.transform = `translateX(${-state.offset * (step || 1)}px)`;
        if (state.track.children.length > 14) {
          window.setTimeout(() => {
            if (!state.track.firstElementChild) return;
            state.track.style.transition = "none";
            state.track.firstElementChild.remove();
            state.offset -= 1;
            state.track.style.transform = `translateX(${-state.offset * stepOf(state.track)}px)`;
            state.track.offsetHeight;
            state.track.style.transition = "";
          }, 820);
        }
      },
    },

    scatter: {
      interval: TICK,
      mount(root, pool) {
        const slots = stageSize(root).portrait ? SCATTER_SLOTS_PORTRAIT : SCATTER_SLOTS;
        const urls = fill(pool, slots.length);
        const cards = slots.map((slot, i) => {
          const card = makeCard(urls[i] || "");
          card.style.left = slot.x + "%";
          card.style.top = slot.y + "%";
          card.dataset.base = `translate(0, 0) rotate(${slot.r}deg)`;
          card.style.transform = card.dataset.base;
          card.style.zIndex = String(i);
          root.appendChild(card);
          return card;
        });
        const focus = 0;
        cards[focus].classList.add("is-focus");
        cards[focus].style.transform = "translate(-4%, -8%) rotate(-2deg) scale(1.08)";
        cards[focus].style.zIndex = "20";
        return { cards, focus, prevFocus: 0, phase: 0, wait: slots.map(() => 0) };
      },
      tick(root, pool, state, api) {
        if (!state.cards.length) return;
        state.phase = (state.phase || 0) + 1;
        if (state.phase % 2 === 1) {
          const prevFocus = state.focus;
          const busy = {};
          busy[prevFocus] = true;
          let nextFocus = pickFairTurn(state, state.cards.length, busy);
          if (nextFocus < 0) nextFocus = (prevFocus + 1) % state.cards.length;
          const leaving = state.cards[prevFocus];
          leaving.classList.remove("is-focus");
          leaving.style.transform = leaving.dataset.base;
          window.setTimeout(() => {
            if (!leaving.classList.contains("is-focus")) leaving.style.zIndex = String(prevFocus);
          }, 280);
          state.prevFocus = prevFocus;
          state.focus = nextFocus;
          const next = state.cards[state.focus];
          next.classList.add("is-focus");
          next.style.transform = "translate(-4%, -8%) rotate(-2deg) scale(1.08)";
          window.setTimeout(() => {
            if (next.classList.contains("is-focus")) next.style.zIndex = "20";
          }, 200);
          return;
        }
        const back = state.cards[state.prevFocus];
        if (!back || back.classList.contains("is-focus")) return;
        const src = feedSrc(api, pool, imgSrc(back));
        if (src) revealFromBottom(back, src);
      },
    },

    cascade: {
      interval: TICK,
      mount(root, pool) {
        const colCount = stageSize(root).portrait ? 2 : 3;
        const cols = [];
        const urls = Array.from({ length: colCount }, () => []);
        const taken = fill(pool, colCount * 2);
        let n = 0;
        for (let c = 0; c < colCount; c += 1) {
          const col = document.createElement("div");
          col.className = "dyn-col";
          for (let r = 0; r < 2; r += 1) {
            const src = taken[n] || "";
            n += 1;
            urls[c].push(src);
            col.appendChild(makeCard(src));
          }
          layoutCascade(col, urls[c]);
          root.appendChild(col);
          cols.push(col);
        }
        return { cols, urls, wait: Array.from({ length: colCount }, () => 0), busy: {} };
      },
      tick(root, pool, state, api) {
        const colIndex = pickFairTurn(state, state.cols.length, state.busy);
        if (colIndex < 0) return;
        const src = api.nextUrl(state.urls[colIndex]);
        if (!src) return;
        const col = state.cols[colIndex];
        const incoming = makeCard(src);
        incoming.style.top = "100%";
        incoming.style.zIndex = "8";
        col.appendChild(incoming);
        state.urls[colIndex].push(src);
        const kids = [...col.children];
        state.busy[colIndex] = true;
        requestAnimationFrame(() => {
          if (kids[0]) kids[0].style.top = "-55%";
          if (kids[1]) kids[1].style.top = "0%";
          incoming.style.top = "52%";
        });
        window.setTimeout(() => {
          if (kids[0] && kids[0].parentElement === col) kids[0].remove();
          state.urls[colIndex].shift();
          layoutCascade(col, state.urls[colIndex]);
          state.busy[colIndex] = false;
        }, 720);
      },
    },

    orbit: {
      interval: 2200,
      mount(root, pool) {
        const wrap = document.createElement("div");
        wrap.className = "dyn-orbit";
        const ring = document.createElement("div");
        ring.className = "dyn-orbit-ring";
        const unique = uniqueList(pool);
        const count = Math.max(3, Math.min(8, unique.length || 6));
        const cards = fill(pool, count).map((src) => {
          const card = makeCard(src);
          ring.appendChild(card);
          return card;
        });
        wrap.appendChild(ring);
        root.appendChild(wrap);
        layoutOrbit(cards, 0);
        return { cards, angle: 0, cursor: count };
      },
      tick(root, pool, state, api) {
        const n = state.cards.length;
        const backIndex = Math.floor((((-state.angle / (360 / n)) % n) + n) % n);
        const far = (backIndex + Math.floor(n / 2)) % n;
        const current = imgSrc(state.cards[far]);
        const src = api.nextUrl(current);
        if (src) revealFromBottom(state.cards[far], src);
        state.angle += 360 / Math.max(n, 1);
        layoutOrbit(state.cards, state.angle);
      },
    },

    billboard: {
      interval: 3800,
      mount(root, pool) {
        const board = document.createElement("div");
        board.className = "dyn-billboard";
        const start = fill(pool, 1)[0] || "";
        const card = makeCard(start);
        board.appendChild(card);
        root.appendChild(board);
        return { board, current: start };
      },
      tick(root, pool, state, api) {
        const next = api.nextUrl(state.current);
        if (!next) return;
        const incoming = makeCard(next, "is-from-bottom");
        incoming.style.zIndex = "8";
        state.board.appendChild(incoming);
        requestAnimationFrame(() => incoming.classList.remove("is-from-bottom"));
        window.setTimeout(() => {
          [...state.board.children].forEach((node) => {
            if (node !== incoming) node.remove();
          });
        }, 920);
        state.current = next;
      },
    },

    reels: {
      interval: 3200,
      mount(root, pool) {
        const taken = fill(pool, 24);
        const reels = [];
        for (let r = 0; r < 3; r += 1) {
          const reel = document.createElement("div");
          reel.className = "dyn-reel";
          const strip = document.createElement("div");
          strip.className = "dyn-reel-strip";
          const frames = taken.slice(r * 8, r * 8 + 8);
          frames.forEach((src) => strip.appendChild(makeCard(src)));
          reel.appendChild(strip);
          root.appendChild(reel);
          const item = { reel, strip, frames, index: 0, busy: false };
          sizeReelFrames(item);
          snapReelStrip(item, false);
          reels.push(item);
        }
        return { reels, wait: [0, 0, 0] };
      },
      tick(root, pool, state, api) {
        const visibleOf = (reel) => reel.frames[Math.min(reel.index, reel.frames.length - 1)] || "";
        const reelIndex = pickFairTurn(state, 3, null);
        if (reelIndex < 0) return;
        const reel = state.reels[reelIndex];
        if (reel.busy) return;
        sizeReelFrames(reel);
        const used = new Set();
        state.reels.forEach((item) => used.add(visibleOf(item)));
        const spin = 3 + Math.floor(Math.random() * 4);
        for (let s = 0; s < spin; s += 1) {
          const src = feedSrc(api, pool, used);
          if (!src) continue;
          used.add(src);
          reel.frames.push(src);
          reel.strip.appendChild(makeCard(src));
        }
        sizeReelFrames(reel);
        reel.index += spin;
        reel.busy = true;
        snapReelStrip(reel, true);
        let settled = false;
        const afterSpin = () => {
          if (settled) return;
          settled = true;
          reel.strip.removeEventListener("transitionend", onEnd);
          if (reel.frames.length > 24) {
            const remove = reel.frames.length - 10;
            for (let i = 0; i < remove; i += 1) {
              reel.frames.shift();
              if (reel.strip.firstElementChild) reel.strip.firstElementChild.remove();
            }
            reel.index = Math.max(0, reel.index - remove);
            sizeReelFrames(reel);
            snapReelStrip(reel, false);
          }
          reel.busy = false;
        };
        const onEnd = (event) => {
          if (event && event.target !== reel.strip) return;
          afterSpin();
        };
        reel.strip.addEventListener("transitionend", onEnd);
        window.setTimeout(afterSpin, 1100);
      },
    },

    polaroid: {
      interval: 60000,
      mount(root, pool, _api, settings) {
        const scale = clampThemeScale(settings);
        applyPolaroidSettings(root, settings);
        const size = stageSize(root);
        const stageW = size.dw;
        const stageH = size.dh;
        const portrait = size.portrait;
        // Brand-aware: keep slot anchors in the content area (leave a chrome rail)
        // without clipping — cards may bleed slightly into the rail.
        const themeRoot =
          (root.closest && root.closest("#dyn-mosaic-theme")) ||
          (root.id === "dyn-mosaic-theme" ? root : null) ||
          root;
        const brandAware = String(themeRoot.dataset.theme || "").endsWith("-brand");
        const reserve =
          brandAware &&
          (themeRoot.classList.contains("dyn-show-qr") ||
            themeRoot.classList.contains("dyn-show-logo"));
        const layoutW = reserve && !portrait ? stageW * 0.78 : stageW;
        const layoutH = reserve && portrait ? stageH * 0.85 : stageH;
        const grid = polaroidGridFor(layoutW, layoutH, scale);
        const cols = grid.cols;
        const rows = grid.rows;
        const slotDefs = [];
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) {
            const edge = c === 0 || c === cols - 1;
            slotDefs.push({
              id: slotDefs.length,
              x: Math.round(
                grid.originX + c * grid.pitchX + (Math.random() - 0.5) * (edge ? 20 : 44)
              ),
              y: Math.round(
                grid.originY + r * grid.pitchY + grid.pitchY * 0.05 + (Math.random() - 0.5) * 36
              ),
              rot: +(
                (edge ? 2 + Math.random() * 3 : 3 + Math.random() * 5) *
                (Math.random() < 0.5 ? -1 : 1)
              ).toFixed(1),
              col: c,
              row: r,
            });
          }
        }
        const stage = document.createElement("div");
        stage.className = "dyn-polaroid-stage";
        root.appendChild(stage);
        const state = {
          stage,
          slotDefs,
          live: new Map(),
          seq: 0,
          z: 1,
          stopped: false,
          timers: [],
          poolRef: pool,
          lastPlacedSrc: "",
        };
        watchStage(state, stage, stageW, stageH, root);

        function jitter(slotDef) {
          let jx = (Math.random() - 0.5) * 140;
          let jy = (Math.random() - 0.5) * 140;
          const edge = slotDef.col === 0 || slotDef.col >= cols - 1;
          if (edge) jx *= 0.45;
          // Keep edge cards from leaping further off-stage or opening a gutter.
          if (slotDef.col === 0) jx = Math.max(jx, -8);
          if (slotDef.col >= cols - 1) {
            jx = Math.max(jx, -8);
            jx = Math.min(jx, 12);
          }
          if (reserve && !portrait && slotDef.col >= cols - 1) jx = Math.min(jx, 8);
          if (slotDef.row >= rows - 1) jy = Math.min(jy, 16);
          if (reserve && portrait && slotDef.row >= rows - 1) jy = Math.min(jy, 8);
          return {
            id: slotDef.id,
            x: slotDef.x + jx,
            y: slotDef.y + jy,
            rot: slotDef.rot + (Math.random() - 0.5) * (edge ? 10 : 28),
          };
        }

        function makeCardAt(src, slot) {
          const widths = [330, 343, 356, 370, 383].map((w) => Math.round(w * scale));
          const cardWidth = widths[Math.floor(Math.random() * widths.length)];
          const wrapper = document.createElement("div");
          wrapper.className = "dyn-polaroid-pos";
          wrapper.style.left = slot.x + "px";
          wrapper.style.top = slot.y + "px";
          wrapper.style.zIndex = String((state.z += 1));
          wrapper.style.transform = `rotate(${slot.rot.toFixed(1)}deg)`;
          const inner = document.createElement("div");
          inner.className = "dyn-polaroid-inner";
          inner.style.setProperty("--drop-rot", ((Math.random() - 0.5) * 14).toFixed(1) + "deg");
          inner.style.setProperty(
            "--toss-x",
            (Math.random() > 0.5 ? 1 : -1) * (35 + Math.random() * 50) + "px"
          );
          inner.style.setProperty("--toss-rot", ((Math.random() - 0.5) * 20).toFixed(1) + "deg");
          const card = makePolaroid(src);
          card.style.width = cardWidth + "px";
          const band = card.querySelector(".dyn-polaroid-band");
          if (band) band.style.height = Math.round(cardWidth * 0.24) + "px";
          inner.appendChild(card);
          wrapper.appendChild(inner);
          stage.appendChild(wrapper);
          const animType = ["drop", "toss", "place"][Math.floor(Math.random() * 3)];
          state.seq += 1;
          return { wrapper, inner, animType, seq: state.seq };
        }

        function reveal(card) {
          card.inner.classList.add("anim-enter-" + card.animType);
        }

        function conceal(card, onDone) {
          card.inner.classList.remove("anim-enter-" + card.animType);
          void card.inner.offsetWidth;
          card.inner.classList.add("anim-exit");
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            if (card.wrapper.parentNode) card.wrapper.remove();
            if (onDone) onDone();
          };
          card.inner.addEventListener("animationend", finish, { once: true });
          later(state, finish, 800);
        }

        function fillSlot(slotId, src) {
          const slotDef = slotDefs.find((item) => item.id === slotId);
          const card = makeCardAt(src, jitter(slotDef));
          reveal(card);
          state.live.set(slotId, card);
        }

        function cardSrc(card) {
          const img = card && card.wrapper && card.wrapper.querySelector(".dyn-card img");
          return img ? String(img.currentSrc || img.src || "").trim() : "";
        }

        function urlsEqual(a, b) {
          if (!a || !b) return false;
          if (a === b) return true;
          const na = String(a).split("?")[0].split("#")[0];
          const nb = String(b).split("?")[0].split("#")[0];
          return na === nb;
        }

        function pickCycleSrc(avoidSrcs) {
          const unique = uniqueList(state.poolRef);
          const blocked = (avoidSrcs || []).filter(Boolean);
          const choices = unique.filter((src) => !blocked.some((b) => urlsEqual(src, b)));
          // With more than 3 photos, never fall back onto a just-shown image.
          if (unique.length > 3) {
            if (!choices.length) return "";
            return choices[Math.floor(Math.random() * choices.length)];
          }
          const pool = choices.length ? choices : unique;
          if (!pool.length) return "";
          return pool[Math.floor(Math.random() * pool.length)];
        }

        function replaceSlot(slotId) {
          const oldCard = state.live.get(slotId);
          const avoid = [cardSrc(oldCard)];
          if (uniqueList(state.poolRef).length > 3 && state.lastPlacedSrc) {
            avoid.push(state.lastPlacedSrc);
          }
          const src = pickCycleSrc(avoid);
          if (!src) {
            if (oldCard) {
              conceal(oldCard, () => state.live.delete(slotId));
              state.live.delete(slotId);
            }
            return;
          }
          state.lastPlacedSrc = src;
          fillSlot(slotId, src);
          if (oldCard) {
            later(state, () => conceal(oldCard), 800);
          }
        }

        function cycleOne() {
          if (state.stopped) return;
          if (!uniqueList(state.poolRef).length) {
            later(state, cycleOne, 3000 + Math.random() * 2000);
            return;
          }
          let oldestId = null;
          let oldestSeq = Infinity;
          state.live.forEach((card, slotId) => {
            if (card.seq < oldestSeq) {
              oldestSeq = card.seq;
              oldestId = slotId;
            }
          });
          if (oldestId !== null) replaceSlot(oldestId);
          later(state, cycleOne, 3000 + Math.random() * 2000);
        }

        const urls = fill(pool, slotDefs.length);
        const hasPhotos = uniqueList(pool).length > 0;
        slotDefs.forEach((slot, i) => {
          const src = urls[i] || pickRandomUrl(state.poolRef);
          if (!hasPhotos) {
            fillSlot(slot.id, src);
            return;
          }
          later(state, () => {
            if (!state.stopped) fillSlot(slot.id, src);
          }, i * 55);
        });
        // Native cycle: one card at a time via drop/toss/place. Feed add/remove
        // only refreshes poolRef — it must not flash or rewrite cards on screen.
        later(state, cycleOne, 4200 + Math.random() * 1800);
        return state;
      },
      tick(root, pool, state) {
        // Pool only — on-screen cards change solely via cycleOne.
        if (state) state.poolRef = pool;
      },
      applySettings(root, _state, settings) {
        applyPolaroidSettings(root, settings);
      },
      unmount(root, state) {
        if (state) state.stopped = true;
        stopTimers(state);
      },
    },

    flipwall: {
      interval: 60000,
      mount(root, pool, _api, settings) {
        const layout = flipLayoutFor(root, settings);
        applyFlipSettings(root, settings, layout);
        const size = stageSize(root);
        const cols = layout.cols;
        const rows = layout.rows;
        const count = cols * rows;
        const stage = document.createElement("div");
        stage.className = "dyn-flip-stage";
        const grid = document.createElement("div");
        grid.className = "dyn-flip-grid";
        const tiles = [];
        const urls = fill(pool, count * 2);
        for (let i = 0; i < count; i += 1) {
          const scene = document.createElement("div");
          scene.className = "dyn-tile-scene";
          const tile = document.createElement("div");
          tile.className = "dyn-tile";
          tile.innerHTML =
            '<div class="dyn-tile-face dyn-flip-front"><img alt=""></div>' +
            '<div class="dyn-tile-face dyn-flip-back"><img alt=""></div>' +
            '<div class="dyn-tile-edge dyn-edge-left"></div>' +
            '<div class="dyn-tile-edge dyn-edge-right"></div>' +
            '<div class="dyn-tile-edge dyn-edge-top"></div>' +
            '<div class="dyn-tile-edge dyn-edge-bottom"></div>';
          tile.querySelector(".dyn-flip-front img").src = urls[i] || "";
          tile.querySelector(".dyn-flip-back img").src = urls[i + count] || urls[i] || "";
          scene.appendChild(tile);
          grid.appendChild(scene);
          tiles.push({ tile, rotation: 0 });
        }
        stage.appendChild(grid);
        root.appendChild(stage);
        const state = { tiles, cols, rows, lastCorner: -1, timers: [], stopped: false, poolRef: pool };
        watchStage(state, stage, size.dw, size.dh, root);
        const corners = [
          { oc: 0, or: 0 },
          { oc: cols - 1, or: 0 },
          { oc: 0, or: rows - 1 },
          { oc: cols - 1, or: rows - 1 },
        ];
        function hiddenImg(item) {
          return item.tile.querySelector(item.rotation % 360 === 0 ? ".dyn-flip-back img" : ".dyn-flip-front img");
        }
        function prepHidden() {
          tiles.forEach((item) => {
            const src = pickRandomUrl(state.poolRef) || hiddenImg(item).src;
            if (src) hiddenImg(item).src = src;
          });
        }
        function pickCorner() {
          let idx = Math.floor(Math.random() * 4);
          if (idx === state.lastCorner) idx = (idx + 1) % 4;
          state.lastCorner = idx;
          return corners[idx];
        }
        function doWave() {
          const { oc, or } = pickCorner();
          let maxEnd = 0;
          tiles.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const dist = Math.sqrt((col - oc) ** 2 + (row - or) ** 2);
            const delay = Math.round(dist * 170);
            maxEnd = Math.max(maxEnd, delay + 800);
            later(state, () => {
              item.rotation += 180;
              item.tile.style.transform = `rotateY(${item.rotation}deg)`;
            }, delay);
          });
          return maxEnd + 300;
        }
        function doMini(countN) {
          const order = tiles.map((_, i) => i);
          for (let i = order.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = order[i];
            order[i] = order[j];
            order[j] = tmp;
          }
          order.slice(0, countN).forEach((idx, k) => {
            later(state, () => {
              const item = tiles[idx];
              const src = pickRandomUrl(state.poolRef);
              if (src) hiddenImg(item).src = src;
              item.rotation += 180;
              item.tile.style.transform = `rotateY(${item.rotation}deg)`;
            }, k * 380);
          });
          return (countN - 1) * 380 + 800;
        }
        function runCycle() {
          if (state.stopped) return;
          const waveMs = doWave();
          later(state, () => {
            if (state.stopped) return;
            prepHidden();
            later(state, () => {
              if (state.stopped) return;
              const miniPlan = [2, 3, 1];
              function nextMini(s) {
                if (state.stopped) return;
                if (s >= miniPlan.length) {
                  later(state, () => {
                    prepHidden();
                    later(state, runCycle, 1800);
                  }, 3200);
                  return;
                }
                const wait = doMini(miniPlan[s]);
                later(state, () => nextMini(s + 1), wait + 3200);
              }
              nextMini(0);
            }, 2800);
          }, waveMs);
        }
        later(state, runCycle, 1200);
        return state;
      },
      tick(root, pool, state) {
        if (state) state.poolRef = pool;
      },
      applySettings(root, _state, settings) {
        applyFlipSettings(root, settings);
      },
      unmount(root, state) {
        if (state) state.stopped = true;
        stopTimers(state);
      },
    },

    livewall: {
      interval: 60000,
      mount(root, pool, _api, settings) {
        const scale = clampThemeScale(settings);
        const CONFIG = {
          CELL_W: 240,
          CELL_H: 360,
          GAP: 8,
          COLS: 34,
          ROWS: 22,
          ZOOMED_TILES: [7.6 / scale, 9.8 / scale],
          ZOOMED_ROWS: [3.1 / scale, 3.9 / scale],
          START_CLUSTER_COL_RADIUS: 6,
          START_CLUSTER_ROW_RADIUS: 4,
          EXPAND_STRIP: [6, 11],
          ACTIVE_BUDGET: 210,
          KEEP_OLD_VISIBLE: [0.25, 0.8],
          EDGE_APPROACH_MS: [3000, 4600],
          EDGE_HOLD_MS: [3200, 4600],
          ARC_DIP: 0.8,
          BREATH: 0.03,
          POP_FLASH_MS: 1100,
          EDGE_REVEAL_SPREAD_MS: [40, 720],
          REVEAL_VIEW_PAD_CELLS: 0.5,
          PREWARM_MAX_TRACKED: 420,
        };
        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
        const lerp = (a, b, t) => a + (b - a) * t;
        const rand = (a, b) => a + Math.random() * (b - a);
        function shuffle(arr) {
          const a = arr.slice();
          for (let i = a.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
          }
          return a;
        }
        function shuffledDirs(last) {
          const dirs = ["left", "right", "up", "down"];
          const opp = { left: "right", right: "left", up: "down", down: "up" };
          const weighted = dirs.slice().sort(() => Math.random() - 0.5);
          if (last) {
            weighted.sort((a, b) => {
              if (a === opp[last]) return 1;
              if (b === opp[last]) return -1;
              return 0;
            });
          }
          return weighted;
        }

        const TW = CONFIG.CELL_W + CONFIG.GAP;
        const TH = CONFIG.CELL_H + CONFIG.GAP;
        const WORLD_W = CONFIG.COLS * TW;
        const WORLD_H = CONFIG.ROWS * TH;
        let vw = root.clientWidth || 1;
        let vh = root.clientHeight || 1;

        const world = document.createElement("div");
        world.className = "dyn-live-world";
        world.style.gridTemplateColumns = `repeat(${CONFIG.COLS}, ${CONFIG.CELL_W}px)`;
        world.style.gridAutoRows = `${CONFIG.CELL_H}px`;
        world.style.gap = `${CONFIG.GAP}px`;
        world.style.width = `${WORLD_W}px`;

        const grid = [];
        const tiles = [];
        const frag = document.createDocumentFragment();
        for (let r = 0; r < CONFIG.ROWS; r += 1) {
          grid[r] = [];
          for (let c = 0; c < CONFIG.COLS; c += 1) {
            const el = document.createElement("div");
            el.className = "dyn-live-tile is-dormant";
            const img = document.createElement("img");
            img.alt = "";
            img.decoding = "async";
            img.draggable = false;
            el.appendChild(img);
            frag.appendChild(el);
            const rec = {
              el, img, r, c,
              active: false,
              data: null,
              pendingSrc: null,
              edgePending: false,
              revealAt: null,
            };
            grid[r][c] = rec;
            tiles.push(rec);
          }
        }
        world.appendChild(frag);
        root.appendChild(world);
        const vignette = document.createElement("div");
        vignette.className = "dyn-live-vignette";
        root.appendChild(vignette);

        const cluster = { minC: 0, maxC: 0, minR: 0, maxR: 0 };
        const cam = { cx: WORLD_W / 2, cy: WORLD_H / 2, s: 1 };
        const prewarmCache = new Map();
        const state = {
          world, tiles, cam, poolRef: pool, timers: [], stopped: false, seeded: false,
        };
        let deck = [];
        let deckIdx = 0;
        let activeCount = 0;
        let lastDir = null;
        let pendingReveal = [];
        const segQueue = [];
        let curSeg = null;

        function refreshDeck() {
          deck = shuffle(uniqueList(state.poolRef));
          deckIdx = 0;
        }
        function scaleForTiles(tilesAcross) {
          return vw / (tilesAcross * TW);
        }
        function scaleForRows(rows) {
          return vh / (rows * TH);
        }
        function viewScale(tilesAcross, rows) {
          return Math.min(scaleForTiles(tilesAcross), scaleForRows(rows));
        }
        function pickViewScale() {
          return viewScale(
            rand(CONFIG.ZOOMED_TILES[0], CONFIG.ZOOMED_TILES[1]),
            rand(CONFIG.ZOOMED_ROWS[0], CONFIG.ZOOMED_ROWS[1])
          );
        }
        function clampScale(s) {
          const zoomedIn = viewScale(CONFIG.ZOOMED_TILES[0], CONFIG.ZOOMED_ROWS[0]);
          const zoomedOut = viewScale(CONFIG.ZOOMED_TILES[1], CONFIG.ZOOMED_ROWS[1]) * CONFIG.ARC_DIP;
          return clamp(s, zoomedOut, zoomedIn);
        }
        function clampCenter(cx, cy, s) {
          const halfW = vw / 2 / s;
          const halfH = vh / 2 / s;
          if (WORLD_W > halfW * 2) cx = clamp(cx, halfW, WORLD_W - halfW);
          else cx = WORLD_W / 2;
          if (WORLD_H > halfH * 2) cy = clamp(cy, halfH, WORLD_H - halfH);
          else cy = WORLD_H / 2;
          return [cx, cy];
        }
        function applyCam() {
          world.style.transform =
            `translate3d(${vw / 2 - cam.cx * cam.s}px, ${vh / 2 - cam.cy * cam.s}px, 0) scale(${cam.s})`;
        }
        function prewarmSrc(src) {
          if (!src || prewarmCache.has(src)) return;
          const probe = new Image();
          probe.decoding = "async";
          probe.src = src;
          const done = probe.decode
            ? probe.decode().catch(() => {})
            : whenDecoded(probe);
          prewarmCache.set(src, done);
          if (prewarmCache.size > CONFIG.PREWARM_MAX_TRACKED) {
            prewarmCache.delete(prewarmCache.keys().next().value);
          }
        }
        function cellCenter(r, c) {
          return {
            x: c * TW + CONFIG.CELL_W / 2,
            y: r * TH + CONFIG.CELL_H / 2,
          };
        }
        function nextImage(avoidSet) {
          if (!deck.length) refreshDeck();
          if (!deck.length) return "";
          let src = deck[0];
          for (let tries = 0; tries < 10; tries += 1) {
            if (deckIdx >= deck.length) refreshDeck();
            if (!deck.length) break;
            src = deck[deckIdx];
            deckIdx += 1;
            if (!avoidSet || !avoidSet.has(src)) break;
          }
          return src;
        }
        function neighborAvoidSet(r, c) {
          const out = new Set();
          [[r, c - 1], [r, c + 1], [r - 1, c], [r + 1, c]].forEach(([rr, cc]) => {
            const rec = grid[rr] && grid[rr][cc];
            if (rec && rec.data) out.add(rec.data);
          });
          return out;
        }
        function assignImage(rec, deferSet) {
          const src = nextImage(neighborAvoidSet(rec.r, rec.c));
          rec.data = src;
          rec.pendingSrc = src;
          rec.decoded = !src;
          if (src) {
            prewarmSrc(src);
            const warmed = prewarmCache.get(src);
            if (warmed && typeof warmed.then === "function") {
              warmed.then(() => {
                rec.decoded = true;
              });
            }
          }
          if (!deferSet && src) rec.img.src = src;
        }
        function activateTile(rec, pending) {
          if (!rec.active) activeCount += 1;
          rec.active = true;
          rec.el.classList.remove("is-dormant", "is-arrive", "is-flash");
          if (pending) {
            rec.el.classList.add("is-pending");
            rec.edgePending = true;
            rec.revealAt = null;
          } else {
            rec.el.classList.remove("is-pending");
            rec.edgePending = false;
            rec.revealAt = null;
          }
          assignImage(rec, pending);
        }
        function deactivateTile(rec) {
          if (!rec.active) return;
          rec.active = false;
          activeCount = Math.max(0, activeCount - 1);
          rec.el.classList.remove("is-pending", "is-arrive", "is-flash");
          rec.el.classList.add("is-dormant");
          rec.data = null;
          rec.pendingSrc = null;
          rec.edgePending = false;
          rec.revealAt = null;
          rec.img.removeAttribute("src");
        }
        function revealTile(rec) {
          if (!rec.active || !rec.edgePending) return false;
          if (!tileInView(rec, CONFIG.REVEAL_VIEW_PAD_CELLS)) return false;
          if (rec.pendingSrc && rec.img.getAttribute("src") !== rec.pendingSrc) {
            rec.img.src = rec.pendingSrc;
          }
          rec.el.classList.remove("is-pending");
          rec.edgePending = false;
          rec.revealAt = null;
          rec.el.classList.add("is-arrive", "is-flash");
          later(state, () => rec.el.classList.remove("is-arrive", "is-flash"), CONFIG.POP_FLASH_MS);
          return true;
        }
        function seedCenterCluster() {
          const midC = Math.floor(CONFIG.COLS / 2);
          const midR = Math.floor(CONFIG.ROWS / 2);
          cluster.minC = clamp(midC - CONFIG.START_CLUSTER_COL_RADIUS, 0, CONFIG.COLS - 1);
          cluster.maxC = clamp(midC + CONFIG.START_CLUSTER_COL_RADIUS, 0, CONFIG.COLS - 1);
          cluster.minR = clamp(midR - CONFIG.START_CLUSTER_ROW_RADIUS, 0, CONFIG.ROWS - 1);
          cluster.maxR = clamp(midR + CONFIG.START_CLUSTER_ROW_RADIUS, 0, CONFIG.ROWS - 1);
          for (let r = cluster.minR; r <= cluster.maxR; r += 1) {
            for (let c = cluster.minC; c <= cluster.maxC; c += 1) {
              activateTile(grid[r][c], false);
            }
          }
        }
        function pruneOpposite(direction, strip) {
          const gone = [];
          if (direction === "left") {
            const c0 = cluster.maxC - strip + 1;
            for (let c = c0; c <= cluster.maxC; c += 1) {
              for (let r = cluster.minR; r <= cluster.maxR; r += 1) gone.push(grid[r][c]);
            }
            cluster.maxC = Math.max(cluster.minC, cluster.maxC - strip);
          } else if (direction === "right") {
            const c1 = cluster.minC + strip - 1;
            for (let c = cluster.minC; c <= c1; c += 1) {
              for (let r = cluster.minR; r <= cluster.maxR; r += 1) gone.push(grid[r][c]);
            }
            cluster.minC = Math.min(cluster.maxC, cluster.minC + strip);
          } else if (direction === "up") {
            const r0 = cluster.maxR - strip + 1;
            for (let r = r0; r <= cluster.maxR; r += 1) {
              for (let c = cluster.minC; c <= cluster.maxC; c += 1) gone.push(grid[r][c]);
            }
            cluster.maxR = Math.max(cluster.minR, cluster.maxR - strip);
          } else {
            const r1 = cluster.minR + strip - 1;
            for (let r = cluster.minR; r <= r1; r += 1) {
              for (let c = cluster.minC; c <= cluster.maxC; c += 1) gone.push(grid[r][c]);
            }
            cluster.minR = Math.min(cluster.maxR, cluster.minR + strip);
          }
          gone.forEach(deactivateTile);
        }
        function expandAtEdge(direction, strip) {
          const born = [];
          if (direction === "left") {
            const newMin = Math.max(0, cluster.minC - strip);
            for (let c = newMin; c < cluster.minC; c += 1) {
              for (let r = cluster.minR; r <= cluster.maxR; r += 1) {
                activateTile(grid[r][c], true);
                born.push(grid[r][c]);
              }
            }
            cluster.minC = newMin;
          } else if (direction === "right") {
            const newMax = Math.min(CONFIG.COLS - 1, cluster.maxC + strip);
            for (let c = cluster.maxC + 1; c <= newMax; c += 1) {
              for (let r = cluster.minR; r <= cluster.maxR; r += 1) {
                activateTile(grid[r][c], true);
                born.push(grid[r][c]);
              }
            }
            cluster.maxC = newMax;
          } else if (direction === "up") {
            const newMin = Math.max(0, cluster.minR - strip);
            for (let r = newMin; r < cluster.minR; r += 1) {
              for (let c = cluster.minC; c <= cluster.maxC; c += 1) {
                activateTile(grid[r][c], true);
                born.push(grid[r][c]);
              }
            }
            cluster.minR = newMin;
          } else {
            const newMax = Math.min(CONFIG.ROWS - 1, cluster.maxR + strip);
            for (let r = cluster.maxR + 1; r <= newMax; r += 1) {
              for (let c = cluster.minC; c <= cluster.maxC; c += 1) {
                activateTile(grid[r][c], true);
                born.push(grid[r][c]);
              }
            }
            cluster.maxR = newMax;
          }
          return born;
        }
        function pruneToBudget(direction) {
          while (activeCount > CONFIG.ACTIVE_BUDGET) pruneOpposite(direction, 1);
        }
        function tileInView(rec, pad) {
          const extra = pad || 0;
          const halfW = vw / 2 / cam.s;
          const halfH = vh / 2 / cam.s;
          const x = rec.c * TW + CONFIG.CELL_W / 2;
          const y = rec.r * TH + CONFIG.CELL_H / 2;
          return (
            x > cam.cx - halfW - extra * TW &&
            x < cam.cx + halfW + extra * TW &&
            y > cam.cy - halfH - extra * TH &&
            y < cam.cy + halfH + extra * TH
          );
        }
        function visibleBounds(cx, cy, s, padCells) {
          const pad = padCells == null ? 0.85 : padCells;
          const halfW = vw / 2 / s + pad * TW;
          const halfH = vh / 2 / s + pad * TH;
          return {
            minC: clamp(Math.floor((cx - halfW) / TW), 0, CONFIG.COLS - 1),
            maxC: clamp(Math.floor((cx + halfW) / TW), 0, CONFIG.COLS - 1),
            minR: clamp(Math.floor((cy - halfH) / TH), 0, CONFIG.ROWS - 1),
            maxR: clamp(Math.floor((cy + halfH) / TH), 0, CONFIG.ROWS - 1),
          };
        }
        function queuePending(rec) {
          if (!rec || !rec.edgePending) return;
          if (pendingReveal.indexOf(rec) === -1) pendingReveal.push(rec);
        }
        function stageVisibleGaps() {
          const b = visibleBounds(cam.cx, cam.cy, cam.s, 0.85);
          for (let r = b.minR; r <= b.maxR; r += 1) {
            for (let c = b.minC; c <= b.maxC; c += 1) {
              const rec = grid[r] && grid[r][c];
              if (!rec) continue;
              if (!rec.active) {
                activateTile(rec, true);
                queuePending(rec);
              } else if (rec.edgePending) {
                queuePending(rec);
              }
            }
          }
          cluster.minC = Math.min(cluster.minC, b.minC);
          cluster.maxC = Math.max(cluster.maxC, b.maxC);
          cluster.minR = Math.min(cluster.minR, b.minR);
          cluster.maxR = Math.max(cluster.maxR, b.maxR);
        }
        function neededStrip(direction, zoomed, keepOld) {
          const along =
            direction === "left" || direction === "right"
              ? vw / (zoomed * TW)
              : vh / (zoomed * TH);
          return clamp(Math.ceil(along - keepOld + 1.5), CONFIG.EXPAND_STRIP[0], 14);
        }
        function processEdgeReveals(now) {
          stageVisibleGaps();
          if (!pendingReveal.length) return;
          const remaining = [];
          pendingReveal.forEach((rec) => {
            if (!rec.active || !rec.edgePending) return;
            if (rec.revealAt == null) {
              if (tileInView(rec, CONFIG.REVEAL_VIEW_PAD_CELLS)) {
                rec.revealAt = now + rand(CONFIG.EDGE_REVEAL_SPREAD_MS[0], CONFIG.EDGE_REVEAL_SPREAD_MS[1]);
              }
              remaining.push(rec);
            } else if (now >= rec.revealAt) {
              if (!revealTile(rec)) remaining.push(rec);
            } else {
              remaining.push(rec);
            }
          });
          pendingReveal = remaining;
        }
        function clusterCenter() {
          const minPt = cellCenter(cluster.minR, cluster.minC);
          const maxPt = cellCenter(cluster.maxR, cluster.maxC);
          return { cx: (minPt.x + maxPt.x) / 2, cy: (minPt.y + maxPt.y) / 2 };
        }
        function edgeLandingTarget(direction, oldBounds, zoomed, keepOld) {
          const halfCols = vw / (zoomed * TW) / 2;
          const halfRows = vh / (zoomed * TH) / 2;
          let camCol = (oldBounds.minC + oldBounds.maxC) / 2;
          let camRow = (oldBounds.minR + oldBounds.maxR) / 2;
          if (direction === "left") {
            camCol = oldBounds.minC + keepOld - halfCols;
            camRow += rand(-0.85, 0.85);
          } else if (direction === "right") {
            camCol = oldBounds.maxC - keepOld + halfCols;
            camRow += rand(-0.85, 0.85);
          } else if (direction === "up") {
            camRow = oldBounds.minR + keepOld - halfRows;
            camCol += rand(-0.95, 0.95);
          } else {
            camRow = oldBounds.maxR - keepOld + halfRows;
            camCol += rand(-0.95, 0.95);
          }
          return cellCenter(
            clamp(Math.round(camRow), 0, CONFIG.ROWS - 1),
            clamp(Math.round(camCol), 0, CONFIG.COLS - 1)
          );
        }
        function canExpand(direction) {
          if (direction === "left") return cluster.minC > 0;
          if (direction === "right") return cluster.maxC < CONFIG.COLS - 1;
          if (direction === "up") return cluster.minR > 0;
          return cluster.maxR < CONFIG.ROWS - 1;
        }
        function chooseDirection() {
          const dirs = shuffledDirs(lastDir);
          for (let i = 0; i < dirs.length; i += 1) {
            if (canExpand(dirs[i])) return dirs[i];
          }
          return dirs[0];
        }
        function planEdgeCycle() {
          const dir = chooseDirection();
          lastDir = dir;
          const zoomed = clampScale(pickViewScale());
          const keepOld = rand(CONFIG.KEEP_OLD_VISIBLE[0], CONFIG.KEEP_OLD_VISIBLE[1]);
          const strip = neededStrip(dir, zoomed, keepOld);
          const oldBounds = {
            minC: cluster.minC, maxC: cluster.maxC, minR: cluster.minR, maxR: cluster.maxR,
          };
          const focus = edgeLandingTarget(dir, oldBounds, zoomed, keepOld);
          let edgeCx = focus.x;
          let edgeCy = focus.y;
          [edgeCx, edgeCy] = clampCenter(edgeCx, edgeCy, zoomed);
          segQueue.push({
            kind: "edge-approach",
            dur: rand(CONFIG.EDGE_APPROACH_MS[0], CONFIG.EDGE_APPROACH_MS[1]),
            from: { cx: cam.cx, cy: cam.cy, s: cam.s },
            to: { cx: edgeCx, cy: edgeCy, s: zoomed },
            arc: true,
            onStart() {
              pendingReveal = expandAtEdge(dir, strip);
              stageVisibleGaps();
            },
          });
          segQueue.push({
            kind: "edge-hold",
            dur: rand(CONFIG.EDGE_HOLD_MS[0], CONFIG.EDGE_HOLD_MS[1]),
            from: { cx: edgeCx, cy: edgeCy, s: zoomed },
            to: { cx: edgeCx, cy: edgeCy, s: zoomed },
            arc: false,
            onEnd() {
              stageVisibleGaps();
              pendingReveal.forEach((rec) => {
                if (tileInView(rec, 1)) revealTile(rec);
              });
              pendingReveal = pendingReveal.filter((rec) => rec.edgePending);
              pruneToBudget(dir);
            },
          });
        }
        function ensureSeg(now) {
          if (curSeg) return;
          if (!segQueue.length) planEdgeCycle();
          curSeg = segQueue.shift();
          curSeg.t0 = now;
          if (curSeg.onStart) curSeg.onStart();
        }
        function tick(now) {
          if (state.stopped) return;
          ensureSeg(now);
          const t = clamp((now - curSeg.t0) / curSeg.dur, 0, 1);
          const p = easeInOutCubic(t);
          cam.cx = lerp(curSeg.from.cx, curSeg.to.cx, p);
          cam.cy = lerp(curSeg.from.cy, curSeg.to.cy, p);
          if (curSeg.arc) {
            const sMid = Math.min(curSeg.from.s, curSeg.to.s) * CONFIG.ARC_DIP;
            if (t < 0.5) cam.s = lerp(curSeg.from.s, sMid, easeInOutSine(t / 0.5));
            else cam.s = lerp(sMid, curSeg.to.s, easeInOutSine((t - 0.5) / 0.5));
          } else {
            const breath = 1 + Math.sin(t * Math.PI) * CONFIG.BREATH;
            cam.s = lerp(curSeg.from.s, curSeg.to.s, easeInOutSine(t)) * breath;
          }
          cam.s = clampScale(cam.s);
          [cam.cx, cam.cy] = clampCenter(cam.cx, cam.cy, cam.s);
          applyCam();
          if (curSeg.kind === "edge-approach" || curSeg.kind === "edge-hold") {
            processEdgeReveals(now);
          }
          if (t >= 1) {
            if (curSeg.onEnd) curSeg.onEnd();
            curSeg = null;
          }
          state.raf = window.requestAnimationFrame(tick);
        }
        function seedIfNeeded() {
          if (state.seeded || state.stopped) return;
          if (!uniqueList(state.poolRef).length) return;
          state.seeded = true;
          refreshDeck();
          seedCenterCluster();
          const startScale = clampScale(pickViewScale());
          const center = clusterCenter();
          cam.s = startScale;
          [cam.cx, cam.cy] = clampCenter(center.cx, center.cy, cam.s);
          applyCam();
          const opening = visibleBounds(cam.cx, cam.cy, cam.s, 0.85);
          for (let r = opening.minR; r <= opening.maxR; r += 1) {
            for (let c = opening.minC; c <= opening.maxC; c += 1) {
              const rec = grid[r] && grid[r][c];
              if (rec && !rec.active) activateTile(rec, false);
            }
          }
          cluster.minC = Math.min(cluster.minC, opening.minC);
          cluster.maxC = Math.max(cluster.maxC, opening.maxC);
          cluster.minR = Math.min(cluster.minR, opening.minR);
          cluster.maxR = Math.max(cluster.maxR, opening.maxR);
          later(state, () => {
            if (!state.stopped) state.raf = window.requestAnimationFrame(tick);
          }, 850);
        }

        state.seedIfNeeded = seedIfNeeded;
        if (typeof ResizeObserver !== "undefined") {
          state.ro = new ResizeObserver(() => {
            vw = root.clientWidth || 1;
            vh = root.clientHeight || 1;
            cam.s = clampScale(cam.s);
            [cam.cx, cam.cy] = clampCenter(cam.cx, cam.cy, cam.s);
            applyCam();
          });
          state.ro.observe(root);
        }
        applyCam();
        seedIfNeeded();
        return state;
      },
      tick(root, pool, state) {
        if (!state) return;
        state.poolRef = pool;
        if (typeof state.seedIfNeeded === "function") state.seedIfNeeded();
      },
      unmount(root, state) {
        if (state) state.stopped = true;
        stopTimers(state);
      },
    },

    cubes: {
      interval: 4000,
      mount(root, pool, _api, settings) {
        const api = globalThis.BGTileField;
        if (!api || !globalThis.THREE) return { stopped: true, waiting: true };
        return api.mount(root, pool, {
          scale: clampThemeScale(settings),
          color: themeColor(settings, "#10131c"),
          preset: "showcase",
        });
      },
      tick(root, pool, state) {
        const api = globalThis.BGTileField;
        if (api) api.tick(root, pool, state);
      },
      applySettings(root, state, settings) {
        const api = globalThis.BGTileField;
        if (api && typeof api.applySettings === "function") {
          api.applySettings(root, state, {
            scale: clampThemeScale(settings),
            color: themeColor(settings, "#10131c"),
          });
        }
      },
      unmount(root, state) {
        const api = globalThis.BGTileField;
        if (api) api.unmount(root, state);
      },
    },

    depthfield: {
      interval: 4000,
      mount(root, pool, _api, settings) {
        const api = globalThis.BGTileField;
        if (!api || !globalThis.THREE) return { stopped: true, waiting: true };
        return api.mount(root, pool, {
          scale: clampThemeScale(settings),
          color: themeColor(settings, "#10131c"),
          preset: "depth",
        });
      },
      tick(root, pool, state) {
        const api = globalThis.BGTileField;
        if (api) api.tick(root, pool, state);
      },
      applySettings(root, state, settings) {
        const api = globalThis.BGTileField;
        if (api && typeof api.applySettings === "function") {
          api.applySettings(root, state, {
            scale: clampThemeScale(settings),
            color: themeColor(settings, "#10131c"),
          });
        }
      },
      unmount(root, state) {
        const api = globalThis.BGTileField;
        if (api) api.unmount(root, state);
      },
    },

    pedestals: {
      interval: 60000,
      mount(root, pool, _api, settings) {
        applyPedestalSettings(root, settings);
        const size = stageSize(root);
        const DEPTH = 1800;
        const REST_Z = -DEPTH / 2;
        const COLS = size.portrait ? 2 : 4;
        const ROWS = size.portrait ? 4 : 2;
        const fit = Math.min((size.dw * 0.86) / (COLS * 360), (size.dh * 0.86) / (ROWS * 540));
        const W = Math.round(360 * fit);
        const H = Math.round(540 * fit);
        const SHIFT_X = size.portrait ? 40 : 300;
        const stage = document.createElement("div");
        stage.className = "dyn-ped-stage";
        const wall = document.createElement("div");
        wall.className = "dyn-ped-wall";
        const urls = fill(pool, COLS * ROWS);
        const peds = [];
        const totalW = COLS * W;
        const totalH = ROWS * H;
        const startX = (size.dw - totalW) / 2 + SHIFT_X;
        const startY = (size.dh - totalH) / 2;
        let i = 0;
        for (let r = 0; r < ROWS; r += 1) {
          for (let c = 0; c < COLS; c += 1) {
            const el = document.createElement("div");
            el.className = "dyn-ped";
            el.style.width = W + "px";
            el.style.height = H + "px";
            el.style.left = startX + c * W + "px";
            el.style.top = startY + r * H + "px";
            el.innerHTML =
              '<div class="dyn-ped-face dyn-ped-photo front"><img alt=""><img alt=""></div>' +
              '<div class="dyn-ped-face dyn-ped-top top"></div>' +
              '<div class="dyn-ped-face dyn-ped-bottom bottom"></div>' +
              '<div class="dyn-ped-face dyn-ped-left left"></div>' +
              '<div class="dyn-ped-face dyn-ped-right right"></div>';
            const hw = W / 2, hh = H / 2, hd = DEPTH / 2;
            el.querySelector(".front").style.transform = `translateZ(${hd}px)`;
            const setCentered = (sel, fw, fh, tf) => {
              const node = el.querySelector(sel);
              node.style.top = "50%";
              node.style.left = "50%";
              node.style.width = fw + "px";
              node.style.height = fh + "px";
              node.style.transform = tf;
            };
            setCentered(".top", W, DEPTH, `translate(-50%, -50%) rotateX(90deg) translateZ(${hh}px)`);
            setCentered(".bottom", W, DEPTH, `translate(-50%, -50%) rotateX(-90deg) translateZ(${hh}px)`);
            setCentered(".left", DEPTH, H, `translate(-50%, -50%) rotateY(-90deg) translateZ(${hw}px)`);
            setCentered(".right", DEPTH, H, `translate(-50%, -50%) rotateY(90deg) translateZ(${hw}px)`);
            const layers = [...el.querySelectorAll(".front img")];
            layers[0].src = urls[i] || "";
            layers[0].style.opacity = "1";
            wall.appendChild(el);
            const sign = i % 2 === 0 ? 1 : -1;
            peds.push({
              el, layers, active: 0,
              baseOffset: sign * (25 + Math.random() * 60),
              undAmp: 38 * (0.7 + Math.random() * 0.5),
              undW: (2 * Math.PI) / (11000 + Math.random() * 7000),
              undPhase: Math.random() * Math.PI * 2,
              dive: 0, mode: "hold", outStart: 0, inStart: 0, pendingSrc: "",
            });
            i += 1;
          }
        }
        stage.appendChild(wall);
        root.appendChild(stage);
        const state = { peds, poolRef: pool, stopped: false, timers: [], swapCursor: 0, nextSwapAt: 0 };
        state.swapOrder = peds.map((_, idx) => idx);
        for (let a = state.swapOrder.length - 1; a > 0; a -= 1) {
          const b = Math.floor(Math.random() * (a + 1));
          const tmp = state.swapOrder[a];
          state.swapOrder[a] = state.swapOrder[b];
          state.swapOrder[b] = tmp;
        }
        watchStage(state, stage, size.dw, size.dh, root);
        const OUT_MS = 1500;
        const IN_MS = 1800;
        const DIVE_DEPTH = 2850;
        function prepareNext(p) {
          p.pendingSrc = pickRandomUrl(state.poolRef) || "";
        }
        peds.forEach(prepareNext);
        function swapTexture(p) {
          const incoming = p.layers[1 - p.active];
          incoming.src = p.pendingSrc || pickRandomUrl(state.poolRef) || "";
          incoming.style.opacity = "0";
          p.active = 1 - p.active;
        }
        state.nextSwapAt = performance.now() + 8000;
        function frame(now) {
          if (state.stopped) return;
          if (now >= state.nextSwapAt) {
            for (let n = 0; n < peds.length; n += 1) {
              const idx = state.swapOrder[state.swapCursor % peds.length];
              state.swapCursor += 1;
              if (peds[idx].mode === "hold") {
                peds[idx].mode = "out";
                peds[idx].outStart = now;
                break;
              }
            }
            state.nextSwapAt = now + 8000;
          }
          peds.forEach((p) => {
            if (p.mode === "out") {
              const e = easeInOut(Math.min(1, (now - p.outStart) / OUT_MS));
              p.dive = -DIVE_DEPTH * e;
              p.layers[p.active].style.opacity = String(1 - e);
              if (e >= 1) {
                swapTexture(p);
                p.mode = "in";
                p.inStart = now;
              }
            } else if (p.mode === "in") {
              const e = easeInOut(Math.min(1, (now - p.inStart) / IN_MS));
              p.dive = -DIVE_DEPTH * (1 - e);
              p.layers[p.active].style.opacity = String(e);
              if (e >= 1) {
                p.dive = 0;
                p.layers[p.active].style.opacity = "1";
                p.mode = "hold";
                prepareNext(p);
              }
            } else {
              p.dive = 0;
            }
            const und = p.undAmp * Math.sin(now * p.undW + p.undPhase);
            p.el.style.transform = `translateZ(${(REST_Z + p.baseOffset + und + p.dive).toFixed(1)}px)`;
          });
          state.raf = window.requestAnimationFrame(frame);
        }
        state.raf = window.requestAnimationFrame(frame);
        return state;
      },
      tick(root, pool, state) {
        if (state) state.poolRef = pool;
      },
      applySettings(root, _state, settings) {
        applyPedestalSettings(root, settings);
      },
      unmount(root, state) {
        if (state) state.stopped = true;
        stopTimers(state);
      },
    },

  };

  function brandAware(baseId) {
    const base = themes[baseId];
    if (!base) return null;
    // Flex (decks) and scatter (polaroid) reflow on the full root — no clip frame,
    // so chrome rails never draw a hard edge through the middle of the stage.
    // Absolute/WebGL themes still mount into a sized frame.
    const useFrame = baseId !== "decks" && baseId !== "polaroid";
    return {
      interval: base.interval,
      mount(root, pool, api, settings) {
        const rulesApi = root.BGExtensionRules || globalThis.BGExtensionRules;
        if (rulesApi && typeof rulesApi.ensureBrandChrome === "function") {
          rulesApi.ensureBrandChrome(root, "mosaic");
        }
        root.dataset.engine = baseId;
        const reserve =
          root.classList.contains("dyn-show-qr") || root.classList.contains("dyn-show-logo");
        if (!useFrame) {
          return base.mount(root, pool, api, settings) || {};
        }
        const frame = document.createElement("div");
        frame.className = "dyn-brand-frame" + (reserve ? " is-reserved" : "");
        root.appendChild(frame);
        void frame.offsetWidth;
        const inner = base.mount(frame, pool, api, settings) || {};
        return Object.assign(inner, { brandFrame: frame, brandBase: baseId });
      },
      tick(root, pool, state, api) {
        if (!state) return;
        const target = state.brandFrame || root;
        if (typeof base.tick === "function") base.tick(target, pool, state, api);
      },
      applySettings(root, state, settings) {
        if (typeof base.applySettings !== "function") return;
        const target = (state && state.brandFrame) || root;
        base.applySettings(target, state, settings);
      },
      unmount(root, state) {
        const target = (state && state.brandFrame) || root;
        if (typeof base.unmount === "function") base.unmount(target, state);
        if (root && root.removeAttribute) root.removeAttribute("data-engine");
      },
    };
  }

  ["decks", "polaroid", "flipwall", "livewall", "cubes", "fan"].forEach((id) => {
    const wrapped = brandAware(id);
    if (wrapped) themes[id + "-brand"] = wrapped;
  });

  root.BGMosaicThemes = {
    STYLE,
    themes,
    makeCard,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
