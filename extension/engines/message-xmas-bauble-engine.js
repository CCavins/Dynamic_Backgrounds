/**
 * Dynamic Backgrounds theme engine
 * id: message-xmas-bauble-engine
 * kind: message
 * Pairs with: themes/message-xmas-bauble.json
 *
 * Pack HTML/CSS provide the bauble layout; this engine adds particle snow.
 */
(function (global) {
  const enginesApi = global.BGThemeEngines;
  if (!enginesApi || typeof enginesApi.define !== "function") {
    throw new Error("BGThemeEngines is not loaded before message-xmas-bauble-engine.js");
  }

  enginesApi.define({
    id: "message-xmas-bauble-engine",
    kind: "message",

    mount(themeRoot, settings) {
      const helpers = global.BGMessageThemes || {};
      const stage = helpers.ensureFitStage
        ? helpers.ensureFitStage(themeRoot)
        : themeRoot;
      // Remove legacy CSS snow layers if present.
      stage.querySelectorAll(".snow").forEach((node) => node.remove());
      const state = {
        photos: [...themeRoot.querySelectorAll("[data-photo], img")],
        messages: [...themeRoot.querySelectorAll("[data-message]")],
        names: [...themeRoot.querySelectorAll("[data-name]")],
        idleTimer: 0,
        snow: null,
      };
      const snowHost = stage.querySelector(".dyn-stage") || stage;
      if (snowHost.style.position === "" || snowHost.style.position === "static") {
        snowHost.style.position = "absolute";
        snowHost.style.inset = "0";
      }
      const snowApi = global.BGXmasSnow;
      if (snowApi && typeof snowApi.attach === "function") {
        state.snow = snowApi.attach(snowHost, { zIndex: 12, count: 64 });
      }
      if (typeof this.applySettings === "function") {
        this.applySettings(themeRoot, state, settings);
      }
      return state;
    },

    applySettings(themeRoot, _state, settings) {
      const helpers = global.BGMessageThemes || {};
      if (helpers.applyVars) helpers.applyVars(themeRoot, settings);
    },

    async show(themeRoot, capture, state, settings) {
      const helpers = global.BGMessageThemes || {};
      if (helpers.commonShowPrep) helpers.commonShowPrep(themeRoot, state);
      (state.photos || []).forEach((img) => {
        if (img.classList && img.classList.contains("orbit-next")) return;
        img.src = (capture && capture.src) || "";
      });
      (state.messages || []).forEach((node) => {
        node.textContent = (capture && capture.message) || "";
      });
      (state.names || []).forEach((node) => {
        node.textContent = (capture && capture.name) || "";
      });
      themeRoot.classList.toggle("no-photo", !(capture && capture.src));
      themeRoot.classList.toggle(
        "no-copy",
        !(capture && (capture.message || capture.name))
      );
      themeRoot.classList.toggle("no-name", !(capture && capture.name));
      if (helpers.finishShow) await helpers.finishShow(themeRoot, state.photos);
      else themeRoot.classList.add("on");
    },

    hide(themeRoot, state) {
      const helpers = global.BGMessageThemes || {};
      if (helpers.hideTheme) return helpers.hideTheme(themeRoot, state);
      themeRoot.classList.remove("on");
      themeRoot.classList.add("off");
    },

    unmount(themeRoot, state) {
      if (state && state.snow && state.snow.destroy) state.snow.destroy();
      if (themeRoot) themeRoot.replaceChildren();
    },
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
