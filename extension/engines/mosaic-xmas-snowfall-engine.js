/**
 * Dynamic Themes theme engine
 * id: mosaic-xmas-snowfall-engine
 * kind: mosaic
 * Pairs with: themes/mosaic-xmas-snowfall.json
 *
 * Uses built-in scatter layout + particles.js–style canvas snow in the foreground.
 * Self-contained: snow helper is inlined so import is JSON + this one engine.js.
 */
(function (global) {
  if (!global.BGXmasSnow) {
    global.BGXmasSnow = {
      attach(host, opts) {
        if (!host) return { destroy() {} };
        const options = opts || {};
        const zIndex = options.zIndex == null ? 12 : options.zIndex;
        const baseCount = options.count == null ? 70 : options.count;
        const canvas = document.createElement("canvas");
        canvas.className = "xmas-snow-canvas";
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText =
          "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:" +
          zIndex +
          ";";
        host.appendChild(canvas);
        const ctx = canvas.getContext("2d");
        let w = 0;
        let h = 0;
        let particles = [];
        let raf = 0;
        let running = true;
        function spawn(anywhere) {
          return {
            x: Math.random() * Math.max(w, 1),
            y: anywhere ? Math.random() * Math.max(h, 1) : -8 - Math.random() * 40,
            r: 1 + Math.random() * 4.2,
            o: 0.28 + Math.random() * 0.45,
            vy: 0.55 + Math.random() * 1.35,
            vx: (Math.random() - 0.5) * 0.85,
          };
        }
        function resize() {
          const rect = host.getBoundingClientRect();
          w = Math.max(1, Math.floor(rect.width));
          h = Math.max(1, Math.floor(rect.height));
          const dpr = Math.min(global.devicePixelRatio || 1, 2);
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
          canvas.style.width = w + "px";
          canvas.style.height = h + "px";
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const n = Math.max(
            42,
            Math.min(140, Math.round((baseCount * (w * h)) / (1280 * 720)))
          );
          particles = [];
          for (let i = 0; i < n; i += 1) particles.push(spawn(true));
        }
        function frame() {
          if (!running) return;
          ctx.clearRect(0, 0, w, h);
          for (let i = 0; i < particles.length; i += 1) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.y > h + 12) {
              particles[i] = spawn(false);
              continue;
            }
            if (p.x < -12) p.x = w + 12;
            if (p.x > w + 12) p.x = -12;
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255," + p.o.toFixed(3) + ")";
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
          raf = global.requestAnimationFrame(frame);
        }
        let ro = null;
        if (typeof ResizeObserver !== "undefined") {
          ro = new ResizeObserver(resize);
          ro.observe(host);
        }
        resize();
        raf = global.requestAnimationFrame(frame);
        return {
          destroy() {
            running = false;
            if (raf) global.cancelAnimationFrame(raf);
            raf = 0;
            if (ro) {
              try {
                ro.disconnect();
              } catch {
                /* ignore */
              }
              ro = null;
            }
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
          },
        };
      },
    };
  }

  const enginesApi = global.BGThemeEngines;
  if (!enginesApi || typeof enginesApi.define !== "function") {
    throw new Error("BGThemeEngines is not loaded before mosaic-xmas-snowfall-engine.js");
  }

  // Keep literal BGThemeEngines.define in this file for import validation.
  enginesApi.define({
    id: "mosaic-xmas-snowfall-engine",
    kind: "mosaic",
    interval: 2600,

    mount(themeRoot, pool, hostApi) {
      const mosaicApi = global.BGMosaicThemes || {};
      const scatter = mosaicApi.themes && mosaicApi.themes.scatter;
      if (!scatter || typeof scatter.mount !== "function") {
        throw new Error("Built-in scatter mosaic theme is required for mosaic-xmas-snowfall-engine");
      }

      // Scatter's size CSS is scoped to data-theme="scatter". This pack uses a
      // custom theme id, so inject equivalent card sizing here.
      let style = themeRoot.querySelector("style[data-xmas-snowfall-engine]");
      if (!style) {
        style = document.createElement("style");
        style.setAttribute("data-xmas-snowfall-engine", "");
        style.textContent = [
          '#dyn-mosaic-theme[data-theme="mosaic-xmas-snowfall"]{overflow:hidden;}',
          '#dyn-mosaic-theme[data-theme="mosaic-xmas-snowfall"] .dyn-card{',
          "position:absolute!important;width:min(16vw,230px);aspect-ratio:2/3;height:auto;",
          "transition:transform .95s cubic-bezier(.22,.8,.2,1);",
          "}",
          '#dyn-mosaic-theme.dyn-portrait[data-theme="mosaic-xmas-snowfall"] .dyn-card{',
          "width:min(38cqw,230px);",
          "}",
        ].join("");
        themeRoot.appendChild(style);
      }

      const state = scatter.mount(themeRoot, pool, hostApi) || {};
      state._scatter = scatter;
      state.api = hostApi;
      state.snow = global.BGXmasSnow.attach(themeRoot, { zIndex: 14, count: 80 });
      return state;
    },

    tick(themeRoot, pool, state, hostApi) {
      if (!state || !state._scatter || !state._scatter.tick) return;
      state._scatter.tick(themeRoot, pool, state, hostApi || state.api);
    },

    unmount(themeRoot, state) {
      if (state && state.snow && state.snow.destroy) state.snow.destroy();
      if (themeRoot) themeRoot.replaceChildren();
    },
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
