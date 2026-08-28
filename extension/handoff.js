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
    "html.dyn-theme-on .v2-qr-tile," +
    "html.dyn-theme-on .qr-tile," +
    "html.dyn-theme-on .v2-logo," +
    "html.dyn-theme-on .v2-logo-tile," +
    "html.dyn-theme-on .event-logo," +
    "html.dyn-theme-on .logo-tile," +
    "html.dyn-theme-on .mosaic-layout > .asset-view{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-theme-on:not(.dyn-show-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-theme-on:not(.dyn-show-bg) .output-wrapper > .asset-view," +
    "html.dyn-theme-on:not(.dyn-show-bg) #dyn-bg-embed{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-show-bg .v2-app-wrapper__bg-image," +
    "html.dyn-show-bg .output-wrapper > .asset-view," +
    "html.dyn-show-bg .output-wrapper > .asset-view img," +
    "html.dyn-show-bg .output-wrapper > .asset-view video," +
    "html.dyn-show-bg #dyn-bg-embed{" +
      "position:absolute!important;inset:0!important;" +
      "left:0!important;top:0!important;right:0!important;bottom:0!important;" +
      "width:100%!important;height:100%!important;" +
      "max-width:none!important;max-height:none!important;" +
      "object-fit:cover!important;object-position:center!important;" +
      "visibility:visible!important;opacity:1!important;" +
      "pointer-events:none!important;z-index:0!important;" +
      "transform:none!important;display:block!important;" +
    "}" +
    "html.dyn-kind-message [data-dyn-chrome-kind=\"mosaic\"]," +
    "html.dyn-kind-mosaic [data-dyn-chrome-kind=\"message\"]{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-show-bg #dyn-theme-host," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme[data-theme]," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .dyn-fit-stage," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .dyn-stage," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .frame," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .scene," +
    "html.dyn-show-bg.dyn-kind-mosaic #dyn-mosaic-theme{" +
      "background:transparent!important;background-image:none!important;" +
    "}" +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .frame::before," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .frame::after," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .scene::before," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .scene::after{" +
      "background:transparent!important;background-image:none!important;" +
    "}" +
    "html.dyn-stage-forced,html.dyn-stage-forced body,html.dyn-stage-forced .output-page{" +
      "background:#000!important;overflow:hidden!important;" +
    "}" +
    "html.dyn-stage-forced .output-wrapper," +
    "html.dyn-stage-forced .v2-app-wrapper{" +
      "max-width:none!important;max-height:none!important;" +
    "}" +
    "#" + HOST_ID + "{" +
      "position:absolute;inset:0;z-index:10;pointer-events:none;" +
    "}" +
    "#dyn-mosaic-theme{transition:opacity .42s ease;}" +
    "#dyn-mosaic-theme.is-leaving{opacity:0;}" +
    ".dyn-brand-chrome{position:absolute;inset:0;z-index:40;pointer-events:none;}" +
    ".dyn-brand-logo{position:absolute;top:3.2%;left:3.2%;width:min(14%,180px);height:auto;}" +
    ".dyn-brand-qr{position:absolute;right:3.2%;bottom:3.2%;width:min(12%,160px);aspect-ratio:1;}" +
    ".dyn-portrait .dyn-brand-logo{width:min(28%,200px);}" +
    ".dyn-portrait .dyn-brand-qr{width:min(22%,180px);bottom:4%;}" +
    "[data-qr][hidden],[data-logo][hidden]{display:none!important;}";

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
    const eitherTheme = Boolean(
      enabled &&
        ((s.messageTheme && s.messageTheme !== "off") || (s.mosaicTheme && s.mosaicTheme !== "off"))
    );
    const kind = rules.activeThemeKind ? rules.activeThemeKind(s) : "";
    const chrome = rules.chromeForKind ? rules.chromeForKind(s, kind) : { showBackground: false };
    const liveOn = rules.liveThemeIsOn ? rules.liveThemeIsOn(s) : eitherTheme;
    html.classList.toggle("dyn-theme-on", liveOn);
    html.classList.toggle("dyn-kind-message", kind === "message");
    html.classList.toggle("dyn-kind-mosaic", kind === "mosaic");
    html.classList.toggle("dyn-show-bg", liveOn && Boolean(chrome.showBackground));
    if (rules.tagChromeKinds) rules.tagChromeKinds();
    if (eitherTheme && rules.applyOutputCanvas) rules.applyOutputCanvas(s.stageAspect);
    else if (rules.resetOutputCanvas) rules.resetOutputCanvas();
    if (liveOn && chrome.showBackground) {
      if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
    } else if (liveOn && rules.silenceReplacedMedia) {
      rules.silenceReplacedMedia();
    }
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

  // Bound every hook so a stuck promise can never freeze the handoff queue.
  function withTimeout(promise, ms) {
    return Promise.race([
      Promise.resolve(promise).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, ms)),
    ]);
  }

  function activate(kind, hooks) {
    const tasks = hooks || {};
    return enqueue(async () => {
      if (mode === kind) {
        if (typeof tasks.reveal === "function") await withTimeout(tasks.reveal(), 12000);
        return;
      }
      if (typeof tasks.prepare === "function") await withTimeout(tasks.prepare(), 6000);
      const outgoing = mode && actors[mode];
      if (outgoing && typeof outgoing.hide === "function") {
        try {
          await withTimeout(outgoing.hide(), 2600);
        } catch {
          /* outgoing overlay may already be gone */
        }
      }
      const prev = mode;
      mode = kind;
      if (typeof tasks.reveal === "function") await withTimeout(tasks.reveal(), 12000);
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
