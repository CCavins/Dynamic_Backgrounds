/**
 * Dynamic Backgrounds theme engine
 * id: mosaic-xmas-snowfall-engine
 * kind: mosaic
 * Pairs with: themes/mosaic-xmas-snowfall.json
 *
 * Uses built-in scatter layout + particles.js–style canvas snow in the foreground.
 */
(function (global) {
  const enginesApi = global.BGThemeEngines;
  if (!enginesApi || typeof enginesApi.define !== "function") {
    throw new Error("BGThemeEngines is not loaded before mosaic-xmas-snowfall-engine.js");
  }

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
      const state = scatter.mount(themeRoot, pool, hostApi) || {};
      state._scatter = scatter;
      state.api = hostApi;
      const snowApi = global.BGXmasSnow;
      if (snowApi && typeof snowApi.attach === "function") {
        state.snow = snowApi.attach(themeRoot, { zIndex: 14, count: 80 });
      }
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
