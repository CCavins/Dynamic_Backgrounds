/**
 * Dynamic Themes theme engine
 * id: message-aurora-engine
 * kind: message
 * Pairs with: themes/message-aurora.json
 *
 * Hooks used: mount, applySettings, show, hide, unmount
 * Helpers used: BGMessageThemes.ensureFitStage, applyVars, commonShowPrep,
 *   finishShow, hideTheme
 *
 * This file is a classic script. It must call BGThemeEngines.define({...}).
 * Do not use import/export. The same file ships in the extension and can be
 * sideloaded from the popup with the JSON pack.
 */
BGThemeEngines.define({
  id: "message-aurora-engine",
  kind: "message",

  mount(themeRoot, settings) {
    const helpers = globalThis.BGMessageThemes || {};
    const stage = helpers.ensureFitStage
      ? helpers.ensureFitStage(themeRoot)
      : themeRoot;
    if (!stage.querySelector(".aurora-card")) {
      stage.innerHTML =
        '<div class="aurora-sky">' +
        '<div class="aurora-card">' +
        '<img data-photo alt="">' +
        '<div class="aurora-copy">' +
        '<p class="aurora-msg"><span data-message></span></p>' +
        '<p class="aurora-name"><span data-name></span></p>' +
        "</div></div></div>";
    }
    let canvas = stage.querySelector("canvas.aurora-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "aurora-canvas";
      const sky = stage.querySelector(".aurora-sky") || stage;
      sky.insertBefore(canvas, sky.firstChild);
    }
    const state = {
      canvas,
      ctx: canvas.getContext("2d"),
      raf: 0,
      t0: 0,
      photos: [...themeRoot.querySelectorAll("[data-photo], .aurora-card img")],
      messages: [...themeRoot.querySelectorAll("[data-message]")],
      names: [...themeRoot.querySelectorAll("[data-name]")],
      idleTimer: 0,
    };
    if (typeof this.applySettings === "function") {
      this.applySettings(themeRoot, state, settings);
    }
    return state;
  },

  applySettings(themeRoot, _state, settings) {
    const helpers = globalThis.BGMessageThemes || {};
    if (helpers.applyVars) helpers.applyVars(themeRoot, settings);
  },

  async show(themeRoot, capture, state, settings) {
    const helpers = globalThis.BGMessageThemes || {};
    if (helpers.commonShowPrep) helpers.commonShowPrep(themeRoot, state);
    (state.photos || []).forEach((img) => {
      img.src = (capture && capture.src) || "";
    });
    if (helpers.applyMessageFields) {
      helpers.applyMessageFields(themeRoot, capture);
    } else {
      (state.messages || []).forEach((node) => {
        node.textContent = (capture && capture.message) || "";
      });
      (state.names || []).forEach((node) => {
        node.textContent = (capture && capture.name) || "";
      });
      themeRoot.classList.toggle("no-photo", !(capture && capture.src));
      themeRoot.classList.toggle("no-copy", !(capture && (capture.message || capture.name)));
      themeRoot.classList.toggle("no-name", !(capture && capture.name));
    }
    startAurora(state, themeRoot, settings);
    if (helpers.finishShow) await helpers.finishShow(themeRoot, state.photos);
    else themeRoot.classList.add("on");
  },

  hide(themeRoot, state) {
    stopAurora(state);
    const helpers = globalThis.BGMessageThemes || {};
    if (helpers.hideTheme) return helpers.hideTheme(themeRoot, state, 320);
    themeRoot.classList.add("off");
    return new Promise((resolve) => {
      setTimeout(() => {
        themeRoot.classList.remove("on", "off");
        resolve();
      }, 320);
    });
  },

  unmount(_themeRoot, state) {
    stopAurora(state);
    if (state && state.idleTimer) clearTimeout(state.idleTimer);
  },
});

function readColor(themeRoot, name, fallback) {
  const raw = getComputedStyle(themeRoot).getPropertyValue(name).trim();
  return raw || fallback;
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return { r: 80, g: 220, b: 180 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function startAurora(state, themeRoot, settings) {
  stopAurora(state);
  if (!state || !state.ctx) return;
  const canvas = state.canvas;
  const ctx = state.ctx;
  const primary = hexToRgb((settings && settings.primary) || readColor(themeRoot, "--primary", "#6ef3c4"));
  const secondary = hexToRgb((settings && settings.secondary) || readColor(themeRoot, "--secondary", "#7aa7ff"));
  state.t0 = performance.now();

  function resize() {
    const w = themeRoot.clientWidth || 1920;
    const h = themeRoot.clientHeight || 1080;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function frame(now) {
    resize();
    const w = canvas.width;
    const h = canvas.height;
    const t = (now - state.t0) / 1000;
    ctx.clearRect(0, 0, w, h);
    for (let band = 0; band < 3; band += 1) {
      const y0 = h * (0.18 + band * 0.16);
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) {
        const y =
          y0 +
          Math.sin(x / (140 + band * 40) + t * (0.6 + band * 0.25)) * (28 + band * 10) +
          Math.sin(x / 90 + t * 0.35 + band) * 16;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      const color = band % 2 ? primary : secondary;
      const grad = ctx.createLinearGradient(0, y0 - 40, 0, h);
      grad.addColorStop(0, "rgba(" + color.r + "," + color.g + "," + color.b + ",0.22)");
      grad.addColorStop(1, "rgba(" + color.r + "," + color.g + "," + color.b + ",0)");
      ctx.fillStyle = grad;
      ctx.fill();
    }
    state.raf = requestAnimationFrame(frame);
  }

  state.raf = requestAnimationFrame(frame);
}

function stopAurora(state) {
  if (state && state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = 0;
  }
}
