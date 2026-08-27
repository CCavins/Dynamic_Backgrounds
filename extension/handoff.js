(function (root) {
  const rules = root.BGExtensionRules;
  if (!rules) return;

  const COVER_STYLE_ID = "dyn-theme-cover-style";
  const HOST_ID = "dyn-theme-host";
  const COVER_CSS =
    "html.dyn-cover-message .capture-content-layer," +
    "html.dyn-cover-message .message-layer{" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
    "html.dyn-cover-mosaic .mosaic-tile-slot," +
    "html.dyn-cover-mosaic .mosaic-asset," +
    "html.dyn-cover-mosaic .mosaic-image{" +
      "visibility:hidden!important;" +
    "}" +
    "#" + HOST_ID + "{" +
      "position:absolute;inset:0;z-index:0;pointer-events:none;" +
    "}" +
    "#dyn-mosaic-theme{transition:opacity .42s ease;}" +
    "#dyn-mosaic-theme.is-leaving{opacity:0;}";

  const actors = { message: null, mosaic: null };
  let mode = "";
  let chain = Promise.resolve();
  let lastSettings = null;

  function ensureCoverStyle() {
    let style = document.getElementById(COVER_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = COVER_STYLE_ID;
      document.documentElement.appendChild(style);
    }
    if (style.textContent !== COVER_CSS) style.textContent = COVER_CSS;
  }

  function applyCovers(settings) {
    if (settings) lastSettings = settings;
    const s = settings || lastSettings;
    if (!s) return;
    ensureCoverStyle();
    const html = document.documentElement;
    const enabled = s.enabled !== false;
    html.classList.toggle(
      "dyn-cover-message",
      Boolean(enabled && s.messageTheme && s.messageTheme !== "off")
    );
    html.classList.toggle(
      "dyn-cover-mosaic",
      Boolean(enabled && s.mosaicTheme && s.mosaicTheme !== "off")
    );
  }

  function liveKind() {
    const cap = rules.messageCapture();
    const hasMsg = Boolean(cap.src || cap.message || cap.name);
    const mosaicN = typeof rules.mosaicContentCount === "function" ? rules.mosaicContentCount() : 0;
    if (hasMsg && mosaicN === 0) return "message";
    if (!hasMsg && mosaicN > 0) return "mosaic";
    return "";
  }

  function register(kind, api) {
    actors[kind] = api || null;
  }

  function enqueue(fn) {
    const run = () => Promise.resolve().then(fn);
    chain = chain.then(run, run);
    return chain;
  }

  function activate(kind, hooks) {
    const tasks = hooks || {};
    return enqueue(async () => {
      if (mode === kind) {
        if (typeof tasks.reveal === "function") await tasks.reveal();
        return;
      }
      if (typeof tasks.prepare === "function") await tasks.prepare();
      const outgoing = mode && actors[mode];
      if (outgoing && typeof outgoing.hide === "function") {
        try {
          await outgoing.hide();
        } catch {
          /* outgoing overlay may already be gone */
        }
      }
      const prev = mode;
      mode = kind;
      if (typeof tasks.reveal === "function") await tasks.reveal();
      const prevActor = prev && actors[prev];
      if (prevActor && typeof prevActor.teardown === "function") {
        try {
          prevActor.teardown();
        } catch {
          /* ignore */
        }
      }
    });
  }

  function currentMode() {
    return mode;
  }

  function clearMode(kind) {
    if (!kind || mode === kind) mode = "";
  }

  root.BGThemeHandoff = {
    HOST_ID,
    ensureCoverStyle,
    applyCovers,
    liveKind,
    register,
    activate,
    currentMode,
    clearMode,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
