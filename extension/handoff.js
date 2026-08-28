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
      "opacity:0!important;pointer-events:none!important;" +
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
    "html.dyn-kind-message:not(.dyn-handoff) #dyn-mosaic-theme," +
    "html.dyn-kind-mosaic:not(.dyn-handoff) #dyn-message-theme{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    /* Incoming mosaic must sit under the live message while the message exits,
       otherwise decks/polaroids paint on top of the fading message beat. */
    "html.dyn-handoff-to-mosaic #dyn-mosaic-theme{" +
      "z-index:4!important;" +
    "}" +
    "html.dyn-handoff .capture-content-layer," +
    "html.dyn-handoff .message-layer," +
    "html.dyn-handoff .message-content," +
    "html.dyn-handoff .v2-message," +
    "html.dyn-handoff .mosaic-tile-slot," +
    "html.dyn-handoff .mosaic-asset," +
    "html.dyn-handoff .mosaic-image{" +
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
    "html.dyn-theme-on,html.dyn-theme-on body,html.dyn-theme-on .output-page{" +
      "background:#000!important;" +
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
    const msgThemeOn = Boolean(enabled && s.messageTheme && s.messageTheme !== "off");
    const mosThemeOn = Boolean(enabled && s.mosaicTheme && s.mosaicTheme !== "off");
    const eitherTheme = msgThemeOn || mosThemeOn;
    const kind = rules.activeThemeKind ? rules.activeThemeKind(s) : "";
    // Keep stock layers covered whenever that kind's theme is enabled. Dropping
    // the message cover while mosaic still fades is what flashes Vixi's original.
    html.classList.toggle("dyn-cover-message", msgThemeOn);
    html.classList.toggle("dyn-cover-mosaic", mosThemeOn);
    const chrome = rules.chromeForKind ? rules.chromeForKind(s, kind) : { showBackground: false };
    const liveOn = rules.liveThemeIsOn ? rules.liveThemeIsOn(s) : eitherTheme;
    html.classList.toggle("dyn-theme-on", liveOn);
    // Until handoff finishes, keep dyn-kind-* on the currently visible mode.
    // Flipping to the live beat early (e.g. mosaic→message) hides #dyn-mosaic-theme
    // via CSS before activate() can crossfade, which flashes black.
    const shownKind =
      mode && kind && mode !== kind && !html.classList.contains("dyn-handoff") ? mode : kind;
    html.classList.toggle("dyn-kind-message", shownKind === "message");
    html.classList.toggle("dyn-kind-mosaic", shownKind === "mosaic");
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

  function beginHandoff(toKind) {
    ensureCoverStyle();
    const html = document.documentElement;
    html.classList.add("dyn-handoff");
    html.classList.remove("dyn-handoff-to-message", "dyn-handoff-to-mosaic");
    if (toKind === "message" || toKind === "mosaic") {
      html.classList.add("dyn-handoff-to-" + toKind);
    }
  }

  function endHandoff() {
    const html = document.documentElement;
    html.classList.remove("dyn-handoff", "dyn-handoff-to-message", "dyn-handoff-to-mosaic");
    if (lastSettings) applyCovers(lastSettings);
  }

  function layerLooksLive(el) {
    if (!el) return false;
    try {
      if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;
      const st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden") return false;
      if (Number.parseFloat(st.opacity || "1") < 0.05) return false;
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    } catch {
      return false;
    }
  }

  function liveKind() {
    let hint = "";
    try {
      const q = location.search || "";
      if (/(?:^|[?&])standalone=mosaic(?:&|$)/i.test(q)) hint = "mosaic";
      if (/(?:^|[?&])standalone=message(?:&|$)/i.test(q)) hint = "message";
    } catch {
      /* ignore */
    }
    const cap = typeof rules.messageCapture === "function" ? rules.messageCapture() : {};
    const hasMsg = Boolean(cap && (cap.src || cap.message || cap.name));
    const mosaicN = typeof rules.mosaicContentCount === "function" ? rules.mosaicContentCount() : 0;
    const mosaicPage =
      mosaicN > 0 ||
      (typeof rules.pageLooksLikeMosaic === "function" && rules.pageLooksLikeMosaic());
    const msgLayer =
      document.querySelector(".capture-content-layer") ||
      document.querySelector(".message-layer") ||
      document.querySelector(".v2-message");
    const mosaicLayer =
      document.querySelector(".mosaic-layout") ||
      document.querySelector(".v2-mosaic-swap-tile") ||
      document.querySelector(".v2-asset-tile");
    const msgLive = hasMsg && layerLooksLive(msgLayer);
    const mosaicLive = mosaicPage && layerLooksLive(mosaicLayer);
    // A live message beat wins even on ?standalone=mosaic links, so mosaic
    // cards can fade out instead of sitting on top of the capture.
    if (msgLive && !mosaicLive) return "message";
    if (mosaicLive && !msgLive) return "mosaic";
    if (msgLive) return "message";
    if (mosaicLive) return "mosaic";
    if (hint === "mosaic" || hint === "message") return hint;
    // Residual .mosaic-layout in the DOM must not block a message beat when
    // the mosaic layer is not actually visible (Vixi often leaves the shell).
    if (hasMsg && !mosaicLive) return "message";
    if (mosaicPage && !hasMsg) return "mosaic";
    if (hasMsg) return "message";
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
      beginHandoff(kind);
      try {
        if (typeof tasks.prepare === "function") await withTimeout(tasks.prepare(), 8000);
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
      } finally {
        endHandoff();
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
