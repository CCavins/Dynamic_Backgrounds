(function (root) {
  const rules = root.BGExtensionRules;
  if (!rules) return;

  const COVER_STYLE_ID = "dyn-theme-cover-style";
  const HOST_ID = "dyn-theme-host";
  const COVER_CSS =
    "html.dyn-cover-message .capture-content-layer," +
    "html.dyn-cover-message .message-layer," +
    "html.dyn-cover-message .message-content," +
    "html.dyn-cover-message .v2-message," +
    "html.dyn-cover-message .output-app > img.fullscreen-asset," +
    "html.dyn-cover-message .output-app > video.fullscreen-asset{" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
    "html.dyn-cover-mosaic .mosaic-layout," +
    "html.dyn-cover-mosaic .mosaic-tile-slot," +
    "html.dyn-cover-mosaic .mosaic-asset," +
    "html.dyn-cover-mosaic .mosaic-image," +
    "html.dyn-cover-mosaic .v2-mosaic-swap-tile," +
    "html.dyn-cover-mosaic .v2-mosaic-face," +
    "html.dyn-cover-mosaic .v2-asset-tile{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-theme-on.dyn-kind-mosaic .v2-qr-tile," +
    "html.dyn-theme-on.dyn-kind-mosaic .qr-tile," +
    "html.dyn-theme-on.dyn-kind-mosaic .v2-logo," +
    "html.dyn-theme-on.dyn-kind-mosaic .v2-logo-tile," +
    "html.dyn-theme-on.dyn-kind-mosaic .event-logo," +
    "html.dyn-theme-on.dyn-kind-mosaic .logo-tile," +
    "html.dyn-theme-on.dyn-kind-mosaic .mosaic-layout > .asset-view," +
    "html.dyn-theme-on.dyn-kind-message .v2-qr-tile," +
    "html.dyn-theme-on.dyn-kind-message .qr-tile," +
    "html.dyn-theme-on.dyn-kind-message .v2-logo," +
    "html.dyn-theme-on.dyn-kind-message .v2-logo-tile," +
    "html.dyn-theme-on.dyn-kind-message .event-logo," +
    "html.dyn-theme-on.dyn-kind-message .logo-tile{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-theme-on.dyn-kind-mosaic:not(.dyn-show-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-theme-on.dyn-kind-mosaic:not(.dyn-show-bg) .output-wrapper > .asset-view," +
    "html.dyn-theme-on.dyn-kind-message:not(.dyn-show-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-theme-on.dyn-kind-message:not(.dyn-show-bg) .output-wrapper > .asset-view," +
    "html.dyn-theme-on.dyn-kind-mosaic:not(.dyn-show-bg) #dyn-bg-embed," +
    "html.dyn-theme-on.dyn-kind-message:not(.dyn-show-bg) #dyn-bg-embed," +
    "html.dyn-theme-on.dyn-kind-mosaic:not(.dyn-show-bg) #dyn-bg-media," +
    "html.dyn-theme-on.dyn-kind-message:not(.dyn-show-bg) #dyn-bg-media{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-show-bg:not(.dyn-custom-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-show-bg:not(.dyn-custom-bg) .output-wrapper > .asset-view{" +
      "position:absolute!important;inset:0!important;" +
      "left:0!important;top:0!important;right:0!important;bottom:0!important;" +
      "width:100%!important;height:100%!important;" +
      "max-width:none!important;max-height:none!important;" +
      "visibility:visible!important;opacity:1!important;" +
      "pointer-events:none!important;z-index:0!important;" +
      "transform:none!important;display:block!important;" +
    "}" +
    /* Hide every child of the Vixi bg layer, then re-show only the marked
       full-bleed media (logo/QR are often sibling imgs in the same layer). */
    "html.dyn-theme-on.dyn-show-bg:not(.dyn-custom-bg) .v2-app-wrapper__bg-image > *," +
    "html.dyn-theme-on.dyn-show-bg:not(.dyn-custom-bg) .output-wrapper > .asset-view > *{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-theme-on.dyn-show-bg:not(.dyn-custom-bg) .v2-app-wrapper__bg-image > [data-dyn-vixi-bg-media]," +
    "html.dyn-theme-on.dyn-show-bg:not(.dyn-custom-bg) .output-wrapper > .asset-view > [data-dyn-vixi-bg-media]," +
    "html.dyn-show-bg #dyn-bg-embed{" +
      "position:absolute!important;inset:0!important;" +
      "width:100%!important;height:100%!important;" +
      "object-fit:cover!important;object-position:center!important;" +
      "visibility:visible!important;opacity:1!important;" +
      "pointer-events:none!important;z-index:0!important;" +
      "transform:none!important;display:block!important;" +
    "}" +
    /* Stock Vixi QR/logo stay hidden while a theme is on (all known selectors). */
    "html.dyn-theme-on .v2-qr-tile," +
    "html.dyn-theme-on .qr-tile," +
    "html.dyn-theme-on .v2-logo," +
    "html.dyn-theme-on .v2-logo-tile," +
    "html.dyn-theme-on .event-logo," +
    "html.dyn-theme-on .logo-tile," +
    "html.dyn-theme-on .output-logo," +
    "html.dyn-theme-on .brand-logo," +
    "html.dyn-theme-on .v2-app-wrapper__logo," +
    "html.dyn-theme-on img[alt='logo' i]," +
    "html.dyn-theme-on img[alt*='logo' i]," +
    "html.dyn-theme-on .v2-qr-tile img," +
    "html.dyn-theme-on .qr-tile img," +
    "html.dyn-theme-on .v2-logo img," +
    "html.dyn-theme-on .v2-logo-tile img," +
    "html.dyn-theme-on .event-logo img," +
    "html.dyn-theme-on .logo-tile img," +
    "html.dyn-theme-on .v2-qr-tile video," +
    "html.dyn-theme-on .qr-tile video," +
    "html.dyn-theme-on .v2-logo video," +
    "html.dyn-theme-on .v2-logo-tile video," +
    "html.dyn-theme-on [data-dyn-brand-suppressed]{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-theme-on:not(.dyn-show-qr) .dyn-brand-chrome [data-qr]," +
    "html.dyn-theme-on:not(.dyn-show-logo) .dyn-brand-chrome [data-logo]," +
    "html.dyn-theme-on:not(.dyn-show-qr):not(.dyn-show-logo) > .dyn-brand-chrome," +
    "#dyn-message-theme:not(.dyn-show-qr):not(.dyn-show-logo) > .dyn-brand-chrome," +
    "#dyn-mosaic-theme:not(.dyn-show-qr):not(.dyn-show-logo) > .dyn-brand-chrome{" +
      "display:none!important;visibility:hidden!important;opacity:0!important;" +
    "}" +
    /* Custom upload/iframe replaces Vixi’s event background — never flash it. */
    "html.dyn-custom-bg .v2-app-wrapper__bg-image," +
    "html.dyn-custom-bg .output-wrapper > .asset-view," +
    "html.dyn-custom-bg .output-wrapper > .asset-view img," +
    "html.dyn-custom-bg .output-wrapper > .asset-view video{" +
      "visibility:hidden!important;opacity:0!important;" +
      "pointer-events:none!important;display:none!important;" +
    "}" +
    "html.dyn-show-bg #dyn-bg-media{" +
      "position:absolute!important;inset:0!important;" +
      "visibility:visible!important;opacity:1!important;" +
      "pointer-events:none!important;z-index:0!important;" +
      "display:block!important;" +
    "}" +
    /* Custom media lives inside the theme root: above the theme Background
       color, below cards/copy. Transparent PNG/GIF holes show that color. */
    "html.dyn-custom-bg #dyn-message-theme > #dyn-bg-media," +
    "html.dyn-custom-bg #dyn-mosaic-theme > #dyn-bg-media," +
    "html.dyn-custom-bg #dyn-theme-host > #dyn-bg-media," +
    "html.dyn-custom-bg #dyn-message-theme > #dyn-bg-embed," +
    "html.dyn-custom-bg #dyn-mosaic-theme > #dyn-bg-embed," +
    "html.dyn-custom-bg #dyn-theme-host > #dyn-bg-embed{" +
      "background:transparent!important;" +
      "z-index:0!important;" +
    "}" +
    "html.dyn-show-bg #dyn-bg-media > img," +
    "html.dyn-show-bg #dyn-bg-media > video{" +
      "visibility:visible!important;opacity:1!important;" +
      "pointer-events:none!important;display:block!important;" +
    "}" +
    "html.dyn-theme-on.dyn-kind-message [data-dyn-chrome-kind=\"mosaic\"]," +
    "html.dyn-theme-on.dyn-kind-mosaic [data-dyn-chrome-kind=\"message\"]{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-kind-message:not(.dyn-handoff) #dyn-mosaic-theme," +
    "html.dyn-kind-mosaic:not(.dyn-handoff) #dyn-message-theme{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-kind-native #dyn-theme-host," +
    "html.dyn-kind-native #dyn-mosaic-theme," +
    "html.dyn-kind-native #dyn-message-theme," +
    "#dyn-mosaic-theme.is-parked," +
    "#dyn-message-theme.is-parked{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-kind-native .output-app," +
    "html.dyn-kind-native .output-app .output-stream-wrapper," +
    "html.dyn-kind-native .output-app .output-stream-wrapper video," +
    "html.dyn-kind-native .output-app .output-stream-wrapper canvas," +
    "html.dyn-kind-native .output-app > img.fullscreen-asset," +
    "html.dyn-kind-native .output-app > video.fullscreen-asset," +
    "html.dyn-kind-native .output-app > iframe," +
    "html.dyn-kind-native .output-app > video," +
    "html.dyn-kind-native .output-app > img," +
    "html.dyn-kind-native .output-wrapper > .asset-view{" +
      "visibility:visible!important;opacity:1!important;" +
    "}" +
    "html.dyn-hold .output-app{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-hold #dyn-theme-host," +
    "html.dyn-hold #dyn-mosaic-theme:not(.is-parked)," +
    "html.dyn-hold #dyn-message-theme:not(.is-parked){" +
      "visibility:visible!important;opacity:1!important;" +
    "}" +
    "html.dyn-hold #dyn-message-theme.dyn-awaiting-show," +
    "html.dyn-hold #dyn-mosaic-theme.dyn-awaiting-show{" +
      "visibility:hidden!important;opacity:0!important;" +
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
    /* Custom selected media (dyn-custom-bg): keep the theme root Background
       color under the asset. Only clear full-bleed stage fills so media shows
       around cards/copy. Without custom media, clear the root too so Vixi’s
       own event background can show through. */
    "html.dyn-show-bg:not(.dyn-custom-bg) #dyn-theme-host," +
    "html.dyn-show-bg:not(.dyn-custom-bg).dyn-kind-message #dyn-message-theme," +
    "html.dyn-show-bg:not(.dyn-custom-bg).dyn-kind-message #dyn-message-theme[data-theme]," +
    "html.dyn-show-bg:not(.dyn-custom-bg).dyn-kind-mosaic #dyn-mosaic-theme{" +
      "background:transparent!important;background-image:none!important;" +
    "}" +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .dyn-fit-stage," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .dyn-stage," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .frame," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .scene," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .frame::before," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .frame::after," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .scene::before," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .scene::after{" +
      "background:transparent!important;background-image:none!important;" +
    "}" +
    "html.dyn-custom-bg.dyn-kind-message #dyn-message-theme > *:not(#dyn-bg-media):not(#dyn-bg-embed)," +
    "html.dyn-custom-bg.dyn-kind-mosaic #dyn-mosaic-theme > *:not(#dyn-bg-media):not(#dyn-bg-embed)," +
    "html.dyn-custom-bg #dyn-theme-host > *:not(#dyn-bg-media):not(#dyn-bg-embed):not(#dyn-message-theme):not(#dyn-mosaic-theme){" +
      "z-index:2;" +
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
    "html.dyn-theme-on .v2-app-wrapper," +
    "html.dyn-theme-on .output-wrapper{" +
      "position:relative!important;" +
    "}" +
    "#" + HOST_ID + "{" +
      "position:absolute;inset:0;z-index:10;pointer-events:none;" +
      "width:100%;height:100%;min-width:100%;min-height:100%;" +
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
  const kindListeners = [];
  const NATIVE_HOLD_MS = 480;
  let mode = "";
  let chain = Promise.resolve();
  let lastSettings = null;
  let seenKind = "";
  let watchingKind = false;
  let nativeHoldAt = 0;
  let nativeHoldTimer = 0;

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
    const live = typeof liveKind === "function" ? liveKind() : "";
    const kind = rules.activeThemeKind ? rules.activeThemeKind(s) : "";
    const nativeBeat = live === "native" && !html.classList.contains("dyn-hold");
    if (nativeBeat) html.classList.remove("dyn-hold");
    const liveOn = Boolean(
      enabled && !nativeBeat && (rules.liveThemeIsOn ? rules.liveThemeIsOn(s) : eitherTheme)
    );
    // Off means leave Vixi alone — no covers, no kind flags, no chrome hide.
    if (!enabled) {
      html.classList.remove(
        "dyn-cover-message",
        "dyn-cover-mosaic",
        "dyn-theme-on",
        "dyn-kind-message",
        "dyn-kind-mosaic",
        "dyn-kind-native",
        "dyn-show-bg",
        "dyn-show-qr",
        "dyn-show-logo",
        "dyn-hold",
        "dyn-handoff",
        "dyn-handoff-to-message",
        "dyn-handoff-to-mosaic",
        "dyn-message-on",
        "dyn-mosaic-on"
      );
      if (rules.resetOutputCanvas) rules.resetOutputCanvas();
      if (rules.restoreBackgroundLayers) rules.restoreBackgroundLayers();
      if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
      return;
    }
    // Only hide the stock layer we are replacing. Covering mosaic while its
    // theme is off (and then uncovering it in applyCovers) is what flashed
    // Vixi's tiles every second with message-on / mosaic-off.
    const handingOff =
      html.classList.contains("dyn-handoff") || html.classList.contains("dyn-hold");
    html.classList.toggle(
      "dyn-cover-message",
      msgThemeOn || (mosThemeOn && (live === "mosaic" || handingOff))
    );
    html.classList.toggle(
      "dyn-cover-mosaic",
      mosThemeOn || (msgThemeOn && (live === "message" || handingOff))
    );
    const chrome = rules.chromeForKind ? rules.chromeForKind(s, kind) : { showBackground: false };
    html.classList.toggle("dyn-theme-on", liveOn);
    const shownKind = !liveOn
      ? nativeBeat
        ? "native"
        : ""
      : nativeBeat
        ? "native"
        : mode && kind && mode !== kind && !html.classList.contains("dyn-handoff")
          ? mode
          : kind;
    html.classList.toggle("dyn-kind-message", shownKind === "message");
    html.classList.toggle("dyn-kind-mosaic", shownKind === "mosaic");
    html.classList.toggle("dyn-kind-native", nativeBeat);
    html.classList.toggle("dyn-show-bg", liveOn && Boolean(chrome.showBackground));
    html.classList.toggle("dyn-show-qr", liveOn && Boolean(chrome.showQr));
    html.classList.toggle("dyn-show-logo", liveOn && Boolean(chrome.showLogo));
    if (!msgThemeOn) html.classList.remove("dyn-message-on");
    if (!mosThemeOn) html.classList.remove("dyn-mosaic-on");
    if (!liveOn) html.classList.remove("dyn-hold");
    if (rules.tagChromeKinds) rules.tagChromeKinds();
    if (nativeBeat && eitherTheme && rules.applyOutputCanvas) rules.applyOutputCanvas(s.stageAspect);
    else if (nativeBeat && rules.resetOutputCanvas) rules.resetOutputCanvas();
    else if (eitherTheme && rules.applyOutputCanvas) rules.applyOutputCanvas(s.stageAspect);
    else if (rules.resetOutputCanvas) rules.resetOutputCanvas();
    if (!liveOn) {
      // Native/CTA: keep Vixi hidden when a custom Background is selected so
      // leaving CTA cannot flash the event art before #dyn-bg-media re-hides it.
      if (rules.usesCustomBackground && rules.usesCustomBackground(s)) {
        if (rules.hideBackgroundLayers) rules.hideBackgroundLayers();
        if (rules.silenceReplacedMedia) rules.silenceReplacedMedia();
        html.classList.add("dyn-custom-bg");
      } else {
        if (rules.restoreBackgroundLayers) rules.restoreBackgroundLayers();
        if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
        html.classList.remove("dyn-custom-bg");
      }
    } else if (chrome.showBackground) {
      if (rules.usesCustomBackground && rules.usesCustomBackground(s)) {
        if (rules.hideBackgroundLayers) rules.hideBackgroundLayers();
        if (rules.silenceReplacedMedia) rules.silenceReplacedMedia();
        html.classList.add("dyn-custom-bg");
        if (rules.clearVixiBgMediaMarks) rules.clearVixiBgMediaMarks();
      } else {
        if (rules.restoreBackgroundLayers) rules.restoreBackgroundLayers();
        if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
        html.classList.remove("dyn-custom-bg");
        if (rules.markVixiBackgroundMedia) rules.markVixiBackgroundMedia();
        if (rules.suppressStockBrandChrome) rules.suppressStockBrandChrome();
      }
    } else if (rules.silenceReplacedMedia) {
      rules.silenceReplacedMedia();
      if (rules.hideBackgroundLayers) rules.hideBackgroundLayers();
      if (rules.clearVixiBgMediaMarks) rules.clearVixiBgMediaMarks();
    }
    // Keep stock QR/logo suppressed whenever a theme is live, regardless of bg source.
    if (liveOn && rules.suppressStockBrandChrome) {
      rules.suppressStockBrandChrome();
    }
    const themeRoot =
      shownKind === "message"
        ? document.getElementById("dyn-message-theme")
        : shownKind === "mosaic"
          ? document.getElementById("dyn-mosaic-theme")
          : null;
    if (themeRoot && rules.ensureBrandChrome) {
      rules.ensureBrandChrome(themeRoot, shownKind);
    }
    const bgApi = root.BGCustomBackground;
    if (bgApi && typeof bgApi.scheduleApply === "function") {
      bgApi.scheduleApply(0);
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

  function layerLooksPresent(el) {
    if (!el) return false;
    try {
      if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;
      const st = getComputedStyle(el);
      if (st.display === "none") return false;
      // Our covers set visibility/opacity on purpose. A covered mosaic or
      // message shell is still that beat — not a native CTA.
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    } catch {
      return false;
    }
  }

  function layerLooksVisible(el) {
    if (!layerLooksPresent(el)) return false;
    try {
      const st = getComputedStyle(el);
      if (st.visibility === "hidden") return false;
      if (Number.parseFloat(st.opacity || "1") < 0.05) return false;
      return true;
    } catch {
      return true;
    }
  }

  function clearNativeHold() {
    nativeHoldAt = 0;
    if (nativeHoldTimer) {
      clearTimeout(nativeHoldTimer);
      nativeHoldTimer = 0;
    }
  }

  function armNativeHold() {
    if (!nativeHoldAt) nativeHoldAt = performance.now();
    if (!nativeHoldTimer) {
      nativeHoldTimer = setTimeout(() => {
        nativeHoldTimer = 0;
        syncLiveKind();
      }, NATIVE_HOLD_MS + 20);
    }
    return performance.now() - nativeHoldAt >= NATIVE_HOLD_MS;
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
    const msgPresent = hasMsg && layerLooksPresent(msgLayer);
    const mosaicPresent = mosaicPage && layerLooksPresent(mosaicLayer);
    const msgVisible = hasMsg && layerLooksVisible(msgLayer);
    const mosaicVisible = mosaicPage && layerLooksVisible(mosaicLayer);
    const nativePage =
      typeof rules.pageLooksLikeNative === "function" && rules.pageLooksLikeNative();
    const hardNative =
      typeof rules.pageLooksLikeHardNative === "function" && rules.pageLooksLikeHardNative();
    const messageOwned =
      mode === "message" ||
      document.documentElement.classList.contains("dyn-message-on") ||
      document.documentElement.classList.contains("dyn-kind-message");
    const sibling =
      typeof rules.findDirectNativeAsset === "function" ? rules.findDirectNativeAsset() : null;
    const siblingSrc = sibling ? String(sibling.currentSrc || sibling.src || "") : "";
    const capSrc = cap && cap.src ? String(cap.src) : "";
    const siblingOther = Boolean(sibling && siblingSrc && (!capSrc || siblingSrc !== capSrc));
    // A real CTA / stream wins immediately — leftover message chrome from the
    // previous guest must not keep the theme parked over it.
    if (hardNative) {
      clearNativeHold();
      return "native";
    }
    // Leftover capture + a different fullscreen sibling is either the next
    // guest photo or a CTA. Hold the theme through a short swap, then yield.
    if (siblingOther && messageOwned && !mosaicVisible) {
      if (armNativeHold()) return "native";
      return "message";
    }
    // An actually-visible stock layer wins over a leftover covered sibling.
    if (msgVisible && !mosaicVisible) {
      clearNativeHold();
      return "message";
    }
    if (mosaicVisible && !msgVisible && !nativePage) {
      clearNativeHold();
      return "mosaic";
    }
    if (msgPresent && !mosaicVisible) {
      clearNativeHold();
      return "message";
    }
    // Live CTA / stream / video still wins over a leftover mosaic shell.
    // A message-to-message swap can look native for a beat (Vixi puts the next
    // photo on .fullscreen-asset). Keep the theme up unless it is a real CTA.
    if (nativePage && !msgPresent) {
      if (messageOwned && !hardNative) {
        if (armNativeHold()) return "native";
        return "message";
      }
      clearNativeHold();
      return "native";
    }
    if (msgPresent && mosaicPresent) {
      clearNativeHold();
      if (hasMsg && mosaicN === 0) return "message";
      if (mosaicN > 0 && !hasMsg) return "mosaic";
      return hasMsg ? "message" : "mosaic";
    }
    if (msgPresent) {
      clearNativeHold();
      return "message";
    }
    if (mosaicPresent && !nativePage) {
      clearNativeHold();
      return "mosaic";
    }
    if (hint === "mosaic" || hint === "message") {
      if (nativePage) {
        clearNativeHold();
        return "native";
      }
      clearNativeHold();
      return hint;
    }
    if (hasMsg && !mosaicPresent) {
      clearNativeHold();
      return "message";
    }
    if (mosaicPresent) {
      clearNativeHold();
      return "mosaic";
    }
    const handingOff = document.documentElement.classList.contains("dyn-handoff");
    if (handingOff) return "";
    if (hasMsg) {
      clearNativeHold();
      return "message";
    }
    if (mosaicPage) {
      clearNativeHold();
      return "mosaic";
    }
    const app = document.querySelector(".output-app");
    if (!hasMsg && !mosaicPage && app && app.childElementCount > 0) {
      if (messageOwned && !hardNative) {
        if (armNativeHold()) return "native";
        return "message";
      }
      clearNativeHold();
      return "native";
    }
    if (nativePage) {
      clearNativeHold();
      return "native";
    }
    return "";
  }

  function themeOnFor(kind) {
    const s = lastSettings;
    if (!s || s.enabled === false) return false;
    if (kind === "message") return Boolean(s.messageTheme && s.messageTheme !== "off");
    if (kind === "mosaic") return Boolean(s.mosaicTheme && s.mosaicTheme !== "off");
    return false;
  }

  function holdFor(kind) {
    if ((kind !== "mosaic" && kind !== "message") || !themeOnFor(kind)) return;
    const html = document.documentElement;
    html.classList.add("dyn-hold", "dyn-cover-message", "dyn-cover-mosaic", "dyn-theme-on");
    html.classList.remove("dyn-kind-native");
    html.classList.toggle("dyn-kind-message", kind === "message");
    html.classList.toggle("dyn-kind-mosaic", kind === "mosaic");
    const id = kind === "message" ? "dyn-message-theme" : "dyn-mosaic-theme";
    const el = document.getElementById(id);
    if (el) {
      // After CTA the message overlay is awaiting a new capture. Do not
      // unpark it here — that flashes the previous card under dyn-hold.
      if (!el.classList.contains("dyn-awaiting-show")) {
        el.classList.remove("is-parked", "is-leaving");
      }
      html.classList.add(kind === "message" ? "dyn-message-on" : "dyn-mosaic-on");
    }
  }

  function endHold() {
    document.documentElement.classList.remove("dyn-hold");
  }

  function onLiveKind(fn) {
    if (typeof fn === "function") kindListeners.push(fn);
  }

  function syncLiveKind() {
    const live = liveKind();
    if (live === seenKind) return;
    const prev = seenKind;
    seenKind = live;
    if (lastSettings) applyCovers(lastSettings);
    if (
      (live === "mosaic" || live === "message") &&
      (prev === "native" || prev === "" || prev !== live)
    ) {
      holdFor(live);
    }
    kindListeners.forEach((fn) => {
      try {
        fn(live, prev);
      } catch {
        /* ignore */
      }
    });
  }

  function startKindWatch() {
    if (watchingKind) return;
    watchingKind = true;
    seenKind = liveKind();
    const mo = new MutationObserver(() => {
      syncLiveKind();
    });
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset", "class", "hidden", "aria-hidden"],
    });
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
        endHold();
        if (lastSettings) applyCovers(lastSettings);
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
        endHold();
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

  startKindWatch();

  root.BGThemeHandoff = {
    HOST_ID,
    ensureCoverStyle,
    applyCovers,
    liveKind,
    register,
    activate,
    currentMode,
    clearMode,
    onLiveKind,
    endHold,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
