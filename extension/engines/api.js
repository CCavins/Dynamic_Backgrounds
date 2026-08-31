(function (root) {
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

  root.BGThemeEngines = {
    define,
    get,
    has,
    list,
    unregister,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
