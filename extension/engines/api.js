(function (root) {
  // userScripts.execute may re-inject this file; keep one registry per world.
  if (root.BGThemeEngines && root.BGThemeEngines.__dynApi) return;

  const registry = new Map();

  function attachBuiltin(def) {
    const builtin = def && def.builtin;
    if (!builtin || !builtin.id) return;
    const themeId = String(builtin.id || "").trim();
    if (!/^[a-z][a-z0-9-]{1,40}$/.test(themeId)) return;
    if (def.kind === "message") {
      const api = root.BGMessageThemes;
      if (!api || !api.themes) return;
      api.themes[themeId] = {
        engine: def.id,
        mount(themeRoot, settings) {
          return def.mount(themeRoot, settings);
        },
        applySettings(themeRoot, state, settings) {
          if (typeof def.applySettings === "function") {
            def.applySettings(themeRoot, state, settings);
          }
        },
        show(themeRoot, capture, state, settings) {
          return typeof def.show === "function"
            ? def.show(themeRoot, capture, state, settings)
            : undefined;
        },
        hide(themeRoot, state, settings) {
          return typeof def.hide === "function"
            ? def.hide(themeRoot, state, settings)
            : Promise.resolve();
        },
        unmount(themeRoot, state) {
          if (typeof def.unmount === "function") def.unmount(themeRoot, state);
        },
      };
      return;
    }
    if (def.kind === "mosaic") {
      const api = root.BGMosaicThemes;
      if (!api || !api.themes) return;
      api.themes[themeId] = {
        engine: def.id,
        interval: Number(def.interval) || 2500,
        mount(mosaicRoot, pool, hostApi, settings) {
          return def.mount(mosaicRoot, pool, hostApi, settings);
        },
        tick(mosaicRoot, pool, state, hostApi) {
          if (typeof def.tick === "function") def.tick(mosaicRoot, pool, state, hostApi);
        },
        applySettings(mosaicRoot, state, settings) {
          if (typeof def.applySettings === "function") {
            def.applySettings(mosaicRoot, state, settings);
          }
        },
        unmount(mosaicRoot, state) {
          if (typeof def.unmount === "function") def.unmount(mosaicRoot, state);
        },
      };
    }
  }

  function define(def) {
    if (!def || typeof def !== "object") {
      throw new Error("BGThemeEngines.define requires an object.");
    }
    const id = String(def.id || "").trim();
    const kind = String(def.kind || "").trim();
    if (!/^[a-z][a-z0-9-]{1,40}$/.test(id)) {
      throw new Error("Engine id must be lowercase letters, numbers, and dashes.");
    }
    if (kind !== "message" && kind !== "mosaic") {
      throw new Error('Engine kind must be "message" or "mosaic".');
    }
    if (typeof def.mount !== "function") {
      throw new Error("Engine must provide mount().");
    }
    registry.set(id, def);
    try {
      attachBuiltin(def);
    } catch {
      /* host theme API may not exist in popup import validation */
    }
    return def;
  }

  function get(id) {
    return registry.get(String(id || "")) || null;
  }

  function has(id) {
    return registry.has(String(id || ""));
  }

  function list() {
    return [...registry.values()];
  }

  function unregister(id) {
    return registry.delete(String(id || ""));
  }

  function parseHex(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function differs(hex, base) {
    const a = parseHex(hex);
    const b = parseHex(base);
    if (!a || !b) return false;
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 24;
  }

  function unwrapUrl(value) {
    let s = String(value || "").trim();
    if (s.slice(0, 4).toLowerCase() === "url(") {
      s = s.slice(4, -1).trim();
      if ((s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') || (s.charAt(0) === "'" && s.charAt(s.length - 1) === "'")) {
        s = s.slice(1, -1);
      }
    }
    return s;
  }

  function hueOf(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 16) return null;
    const d = max - min;
    let h = 0;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    return h;
  }

  function hueDist(a, b) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  function luma(r, g, b) {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  function shadeExact(target, ratio) {
    const tr = target[0];
    const tg = target[1];
    const tb = target[2];
    if (ratio <= 1) return [tr * ratio, tg * ratio, tb * ratio];
    const t = Math.min(1, (ratio - 1) / 0.75);
    return [tr + (255 - tr) * t, tg + (255 - tg) * t, tb + (255 - tb) * t];
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("bitmap")); };
      img.src = src;
    });
  }

  const bitmapCache = new Map();

  function paintBitmap(cacheId, src, painter) {
    if (bitmapCache.has(cacheId)) return bitmapCache.get(cacheId);
    const pending = loadImage(unwrapUrl(src)).then(function (img) {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) throw new Error("bitmap");
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const image = ctx.getImageData(0, 0, w, h);
      painter(image.data);
      ctx.putImageData(image, 0, 0);
      return new Promise(function (resolve) {
        if (typeof canvas.toBlob === "function") {
          canvas.toBlob(function (blob) {
            resolve(blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/png"));
          }, "image/png");
          return;
        }
        resolve(canvas.toDataURL("image/png"));
      });
    });
    bitmapCache.set(cacheId, pending);
    return pending.then(function (url) {
      return url;
    }, function (err) {
      bitmapCache.delete(cacheId);
      throw err;
    });
  }

  function anchorLuma(lumas) {
    if (!lumas.length) return 0.5;
    const bins = new Array(24).fill(0);
    for (let i = 0; i < lumas.length; i += 1) {
      const b = Math.max(0, Math.min(23, Math.floor(lumas[i] * 24)));
      bins[b] += 1;
    }
    let peak = 0;
    for (let i = 1; i < bins.length; i += 1) if (bins[i] > bins[peak]) peak = i;
    const lo = peak / 24;
    const hi = (peak + 1) / 24;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < lumas.length; i += 1) {
      if (lumas[i] < lo || lumas[i] >= hi) continue;
      sum += lumas[i];
      n += 1;
    }
    const anchor = n ? sum / n : lumas[lumas.length >> 1];
    return anchor > 0.04 ? anchor : 0.5;
  }

  function colorizeMonoPixels(data, target) {
    const lumas = [];
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      lumas.push(luma(data[i], data[i + 1], data[i + 2]));
    }
    const denom = anchorLuma(lumas);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8) continue;
      const rgb = shadeExact(target, luma(data[i], data[i + 1], data[i + 2]) / denom);
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
    }
  }

  function colorizeDuoPixels(data, refA, colorA, refB, colorB, tube) {
    const hueA = hueOf(refA[0], refA[1], refA[2]);
    const hueB = hueOf(refB[0], refB[1], refB[2]);
    const buckets = [[], []];
    const cls = new Int8Array(data.length / 4);
    for (let p = 0, i = 0; i < data.length; i += 4, p += 1) {
      if (data[i + 3] < 8) {
        cls[p] = -1;
        continue;
      }
      const h = hueOf(data[i], data[i + 1], data[i + 2]);
      if (h == null || hueA == null || hueB == null) {
        cls[p] = 2;
        continue;
      }
      const which = hueDist(h, hueA) <= hueDist(h, hueB) ? 0 : 1;
      cls[p] = which;
      buckets[which].push(luma(data[i], data[i + 1], data[i + 2]));
    }
    const med = buckets.map(function (arr) { return anchorLuma(arr); });
    const colors = [colorA, colorB];
    for (let p = 0, i = 0; i < data.length; i += 4, p += 1) {
      const c = cls[p];
      if (c < 0) continue;
      if (c === 2) {
        if (!tube) continue;
        const L = luma(data[i], data[i + 1], data[i + 2]);
        if (L < 0.72) continue;
        const rgb = shadeExact(tube, L / 0.92);
        data[i] = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
        continue;
      }
      const denom = med[c] > 0.04 ? med[c] : 0.5;
      const rgb = shadeExact(colors[c], luma(data[i], data[i + 1], data[i + 2]) / denom);
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
    }
  }

  function colorizeMono(cacheId, src, hex) {
    const rgb = parseHex(hex);
    if (!rgb || !src) return Promise.resolve("");
    const key = String(cacheId) + "|mono2|" + String(hex).trim().toLowerCase();
    return paintBitmap(key, src, function (data) { colorizeMonoPixels(data, rgb); });
  }

  function colorizeDuo(cacheId, src, refAHex, colorAHex, refBHex, colorBHex, tubeHex) {
    const refA = parseHex(refAHex);
    const colorA = parseHex(colorAHex);
    const refB = parseHex(refBHex);
    const colorB = parseHex(colorBHex);
    const tube = tubeHex ? parseHex(tubeHex) : null;
    if (!refA || !colorA || !refB || !colorB || !src) return Promise.resolve("");
    const key = ["duo2", cacheId, colorAHex, colorBHex, tubeHex || ""].join("|").toLowerCase();
    return paintBitmap(key, src, function (data) {
      colorizeDuoPixels(data, refA, colorA, refB, colorB, tube);
    });
  }

  root.BGThemeEngines = {
    define,
    get,
    has,
    list,
    unregister,
    differs,
    colorizeMono,
    colorizeDuo,
    __dynApi: true,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
