(function (root) {
  const rules = root.BGExtensionRules;
  if (!rules) return;

  const COVER_STYLE_ID = "dyn-theme-cover-style";
  const HOST_ID = "dyn-theme-host";
  const COVER_CSS =
    "html.dyn-cover-message .capture-content-layer," +
    "html.dyn-cover-message .message-layer," +
    "html.dyn-cover-message .message-content," +
    "html.dyn-cover-message .v2-message{" +
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
    "html.dyn-kind-mosaic .v2-qr-tile," +
    "html.dyn-kind-mosaic .qr-tile," +
    "html.dyn-kind-mosaic .v2-logo," +
    "html.dyn-kind-mosaic .v2-logo-tile," +
    "html.dyn-kind-mosaic .event-logo," +
    "html.dyn-kind-mosaic .logo-tile," +
    "html.dyn-kind-mosaic .mosaic-layout > .asset-view," +
    "html.dyn-kind-message .v2-qr-tile," +
    "html.dyn-kind-message .qr-tile," +
    "html.dyn-kind-message .v2-logo," +
    "html.dyn-kind-message .v2-logo-tile," +
    "html.dyn-kind-message .event-logo," +
    "html.dyn-kind-message .logo-tile{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-kind-mosaic:not(.dyn-show-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-kind-mosaic:not(.dyn-show-bg) .output-wrapper > .asset-view," +
    "html.dyn-kind-message:not(.dyn-show-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-kind-message:not(.dyn-show-bg) .output-wrapper > .asset-view," +
    "html.dyn-kind-mosaic:not(.dyn-show-bg) #dyn-bg-embed," +
    "html.dyn-kind-message:not(.dyn-show-bg) #dyn-bg-embed{" +
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
  const kindListeners = [];
  let mode = "";
  let chain = Promise.resolve();
  let lastSettings = null;
  let seenKind = "";
  let watchingKind = false;

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
    // Keep stock layers covered whenever that kind's theme is enabled. Dropping
    // the message cover while mosaic still fades is what flashes Vixi's original.
    // Stream / live / CTA still hide leftover mosaic/message shells.
    html.classList.toggle("dyn-cover-message", msgThemeOn);
    html.classList.toggle("dyn-cover-mosaic", mosThemeOn);
    const chrome = rules.chromeForKind ? rules.chromeForKind(s, kind) : { showBackground: false };
    const liveOn = !nativeBeat && (rules.liveThemeIsOn ? rules.liveThemeIsOn(s) : eitherTheme);
    html.classList.toggle("dyn-theme-on", liveOn);
    // Until handoff finishes, keep dyn-kind-* on the currently visible mode.
    // Flipping to the live beat early (e.g. mosaic→message) hides #dyn-mosaic-theme
    // via CSS before activate() can crossfade, which flashes black.
    const shownKind = nativeBeat
      ? "native"
      : mode && kind && mode !== kind && !html.classList.contains("dyn-handoff")
        ? mode
        : kind;
    html.classList.toggle("dyn-kind-message", shownKind === "message");
    html.classList.toggle("dyn-kind-mosaic", shownKind === "mosaic");
    html.classList.toggle("dyn-kind-native", nativeBeat);
    html.classList.toggle("dyn-show-bg", liveOn && Boolean(chrome.showBackground));
    if (rules.tagChromeKinds) rules.tagChromeKinds();
    // Keep the letterboxed stage on native so a parked mosaic/message overlay
    // can resume without remounting. CTA/stream still show through the host.
    if (nativeBeat && eitherTheme && rules.applyOutputCanvas) rules.applyOutputCanvas(s.stageAspect);
    else if (nativeBeat && rules.resetOutputCanvas) rules.resetOutputCanvas();
    else if (eitherTheme && rules.applyOutputCanvas) rules.applyOutputCanvas(s.stageAspect);
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
    const nativePage =
      typeof rules.pageLooksLikeNative === "function" && rules.pageLooksLikeNative();
    if (msgLive && !mosaicLive) return "message";
    // Live CTA / stream / video still wins over a leftover mosaic shell.
    if (nativePage && !msgLive) return "native";
    if (msgLive) return "message";
    if (mosaicLive && !nativePage) return "mosaic";
    if (hint === "mosaic" || hint === "message") {
      if (nativePage) return "native";
      return hint;
    }
    if (hasMsg && !mosaicLive) return "message";
    if (mosaicLive) return "mosaic";
    const handingOff = document.documentElement.classList.contains("dyn-handoff");
    if (handingOff) return "";
    if (hasMsg) return "message";
    if (mosaicPage) return "mosaic";
    const app = document.querySelector(".output-app");
    if (!hasMsg && !mosaicPage && app && app.childElementCount > 0) return "native";
    return nativePage ? "native" : "";
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
      el.classList.remove("is-parked", "is-leaving");
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
      kindListeners.forEach((fn) => {
        try {
          fn(live, prev);
        } catch {
          /* ignore */
        }
      });
    }
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
