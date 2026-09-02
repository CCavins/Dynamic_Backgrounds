(() => {
  const rules = globalThis.BGExtensionRules;
  const mediaApi = globalThis.BGMediaStore;
  if (!rules) return;

  const IFRAME_ID = "dyn-bg-embed";
  const MEDIA_ID = "dyn-bg-media";
  const IFRAME_STYLE =
    "position:absolute;inset:0;width:100%;height:100%;border:0;z-index:0;pointer-events:none;background:transparent;";
  const MEDIA_HOST_STYLE_BASE =
    "position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;";

  let applyTimer = 0;
  let lastMediaKey = "";
  let mediaRetryCount = 0;
  const MEDIA_RETRY_MAX = 12;

  function hideOriginalBackground(wrapper) {
    rules.backgroundLayers(wrapper).forEach((background) => {
      background.style.setProperty("display", "none", "important");
    });
  }

  function restoreOriginalBackground() {
    rules.backgroundLayers().forEach((background) => {
      background.style.removeProperty("display");
    });
  }

  function removeIframe() {
    const iframe = document.getElementById(IFRAME_ID);
    if (iframe) iframe.remove();
  }

  function removeMedia() {
    const host = document.getElementById(MEDIA_ID);
    if (host) host.remove();
    lastMediaKey = "";
  }

  function removeAllCustom() {
    removeIframe();
    removeMedia();
    document.documentElement.classList.remove("dyn-custom-bg");
    restoreOriginalBackground();
  }

  function showBackgroundWanted(settings) {
    const handoff = globalThis.BGThemeHandoff;
    if (handoff && typeof handoff.isPassthrough === "function" && handoff.isPassthrough(settings)) {
      return false;
    }
    if (rules.pageLooksLikeHardNative && rules.pageLooksLikeHardNative()) return false;
    if (rules.pageLooksLikePassthrough && rules.pageLooksLikePassthrough()) return false;
    const cap = rules.messageCapture ? rules.messageCapture() : {};
    const hasMsg = Boolean(cap && (cap.src || cap.message || cap.name));
    const mosaicN =
      typeof rules.mosaicContentCount === "function" ? rules.mosaicContentCount() : 0;
    if (
      rules.pageLooksLikeNative &&
      rules.pageLooksLikeNative() &&
      !hasMsg &&
      mosaicN === 0
    ) {
      return false;
    }
    if (!rules.liveThemeIsOn || !rules.liveThemeIsOn(settings)) {
      const live = handoff && typeof handoff.liveKind === "function" ? handoff.liveKind() : "";
      if (live === "native") return false;
      if (hasMsg && settings && settings.messageTheme && settings.messageTheme !== "off") {
        const chrome = rules.chromeForKind ? rules.chromeForKind(settings, "message") : null;
        return Boolean(chrome && chrome.showBackground);
      }
      if (mosaicN > 0 && settings && settings.mosaicTheme && settings.mosaicTheme !== "off") {
        const chrome = rules.chromeForKind ? rules.chromeForKind(settings, "mosaic") : null;
        return Boolean(chrome && chrome.showBackground);
      }
      return false;
    }
    const chrome = rules.chromeForKind
      ? rules.chromeForKind(settings, rules.activeThemeKind ? rules.activeThemeKind(settings) : "")
      : { showBackground: false };
    return Boolean(chrome && chrome.showBackground);
  }

  /** Live theme root when Show background is on; otherwise the Vixi wrapper.
   *  forcedKind: pin mount to message/mosaic during handoff before kind classes flip.
   *  useWrapper: CTA / no live theme — keep media on the page wrapper.
   *  forceShowBg: when set, skip chrome lookup (handoff already computed it). */
  function findBgMountParent(settings, forcedKind, useWrapper, forceShowBg) {
    const wrapper = rules.findWrapper();
    if (useWrapper) return wrapper;
    const themeOn = rules.liveThemeIsOn
      ? rules.liveThemeIsOn(settings)
      : false;
    const wantBg = forceShowBg == null ? showBackgroundWanted(settings) : Boolean(forceShowBg);
    if (!themeOn || !wantBg) {
      return wrapper;
    }
    const kind =
      forcedKind === "message" || forcedKind === "mosaic"
        ? forcedKind
        : rules.activeThemeKind
          ? rules.activeThemeKind(settings)
          : "";
    const themeId = kind === "message" ? "dyn-message-theme" : kind === "mosaic" ? "dyn-mosaic-theme" : "";
    if (themeId) {
      const themeRoot = document.getElementById(themeId);
      if (
        themeRoot &&
        !themeRoot.classList.contains("is-parked") &&
        !themeRoot.classList.contains("dyn-awaiting-show")
      ) {
        return themeRoot;
      }
    }
    const host = document.getElementById("dyn-theme-host");
    return host || wrapper;
  }

  function mediaHostStyle(parent) {
    const insideTheme =
      parent &&
      (parent.id === "dyn-message-theme" ||
        parent.id === "dyn-mosaic-theme" ||
        parent.id === "dyn-theme-host");
    // Inside a theme: transparent host so PNG/GIF alpha shows the theme Background color.
    // On the bare wrapper (no theme): black fill behind the asset.
    return (
      MEDIA_HOST_STYLE_BASE +
      "background:" +
      (insideTheme ? "transparent" : "#000") +
      ";"
    );
  }

  function markCustomBg(active) {
    document.documentElement.classList.toggle("dyn-custom-bg", Boolean(active));
  }

  function moveIntoParent(node, parent, styleCss) {
    if (!node || !parent) return;
    if (styleCss) node.style.cssText = styleCss;
    if (node.parentElement !== parent) {
      parent.insertBefore(node, parent.firstChild);
    }
  }

  function injectIframe(src, settings, mountParent) {
    const parent = mountParent || findBgMountParent(settings);
    if (!parent) return false;
    const wrapper = rules.findWrapper();
    if (wrapper) hideOriginalBackground(wrapper);
    removeMedia();

    let iframe = document.getElementById(IFRAME_ID);
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = IFRAME_ID;
      iframe.setAttribute("title", "Dynamic background");
      iframe.setAttribute("allow", "autoplay");
    }
    moveIntoParent(iframe, parent, IFRAME_STYLE);

    if (iframe.getAttribute("src") !== src) {
      iframe.setAttribute("src", src);
    }
    markCustomBg(true);
    return true;
  }

  function applyFit(el, fit) {
    const css = mediaApi && mediaApi.fitCss ? mediaApi.fitCss(fit) : { objectFit: "cover", objectPosition: "center" };
    el.style.objectFit = css.objectFit;
    el.style.objectPosition = css.objectPosition;
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.display = "block";
  }

  function injectRemoteAsset(asset, fit, settings, mountParent) {
    if (!asset || !asset.src) return false;

    const parent = mountParent || findBgMountParent(settings);
    if (!parent) return false;
    const wrapper = rules.findWrapper();
    if (wrapper) hideOriginalBackground(wrapper);
    removeIframe();

    let host = document.getElementById(MEDIA_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = MEDIA_ID;
    }
    // Reparent without destroy so CTA → theme handoff does not blank a frame.
    moveIntoParent(host, parent, mediaHostStyle(parent));

    const wantVideo = asset.kind === "video";
    const key = "url|" + asset.kind + "|" + (fit || "cover") + "|" + asset.src;
    let node = host.firstElementChild;
    const tag = wantVideo ? "VIDEO" : "IMG";
    if (!node || node.tagName !== tag || lastMediaKey !== key) {
      host.replaceChildren();
      node = document.createElement(wantVideo ? "video" : "img");
      if (wantVideo) {
        node.autoplay = true;
        node.loop = true;
        node.muted = true;
        node.playsInline = true;
        node.setAttribute("playsinline", "");
      }
      node.alt = "";
      host.appendChild(node);
      node.src = asset.src;
      lastMediaKey = key;
    }
    applyFit(node, fit);
    if (wantVideo && typeof node.play === "function") {
      const play = node.play();
      if (play && typeof play.catch === "function") play.catch(() => {});
    }
    markCustomBg(true);
    if (rules.syncThemeBackdrops && parent) rules.syncThemeBackdrops(parent);
    return true;
  }

  async function injectMedia(mediaId, fit, settings, mountParent) {
    if (!mediaApi || typeof mediaApi.getMedia !== "function") return false;
    const asset = await mediaApi.getMedia(mediaId, { retries: 5 });
    if (!asset || !asset.dataUrl) return false;

    return injectRemoteAsset(
      {
        src: asset.dataUrl,
        kind: mediaApi.isVideoMime && mediaApi.isVideoMime(asset.mime) ? "video" : "image",
      },
      fit,
      settings,
      mountParent
    );
  }

  /**
   * Synchronously keep custom bg mounted on the incoming theme (or host) BEFORE
   * handoff flips dyn-kind-* classes. Avoids one frame where #dyn-bg-media is
   * still inside the outgoing (now-hidden) theme and Vixi’s original bg shows.
   */
  function syncMount(settings, opts) {
    const s = settings;
    if (!s || !rules.usesCustomBackground || !rules.usesCustomBackground(s)) return false;
    if (rules.pageLooksLikePassthrough && rules.pageLooksLikePassthrough()) return false;

    const liveOn = Boolean(opts && opts.liveOn);
    const showBackground = Boolean(opts && opts.showBackground);
    const nativeBeat = Boolean(opts && opts.nativeBeat);
    const forcedKind = opts && opts.kind;

    const wrapper = rules.findWrapper();
    if (wrapper) hideOriginalBackground(wrapper);
    if (rules.silenceReplacedMedia) rules.silenceReplacedMedia();
    markCustomBg(true);

    if (liveOn && !showBackground) {
      removeIframe();
      removeMedia();
      return true;
    }

    const useWrapper = nativeBeat || !liveOn;
    const parent = findBgMountParent(
      s,
      useWrapper ? "" : forcedKind,
      useWrapper,
      liveOn ? showBackground : true
    );
    if (!parent) return false;

    // Fast path: reparent existing media/iframe first so it never sits in a
    // theme about to be hidden by dyn-kind-* CSS.
    const media = document.getElementById(MEDIA_ID);
    const iframe = document.getElementById(IFRAME_ID);
    if (media) moveIntoParent(media, parent, mediaHostStyle(parent));
    if (iframe) moveIntoParent(iframe, parent, IFRAME_STYLE);

    if (s.bgMode === "vixi") {
      const asset =
        typeof rules.resolveVixiBackgroundAsset === "function"
          ? rules.resolveVixiBackgroundAsset()
          : null;
      if (asset && asset.src) return injectRemoteAsset(asset, s.bgFit || "cover", s, parent);
      return Boolean(media);
    }

    const href = typeof location !== "undefined" ? location.href : "";
    const mediaId =
      typeof rules.resolveBackgroundMediaId === "function"
        ? rules.resolveBackgroundMediaId(s, href)
        : "";
    if (mediaId) {
      // Async fill if empty; reparent above already kept the prior frame up.
      if (!media || !media.firstElementChild) {
        injectMedia(mediaId, s.bgFit || "cover", s, parent).catch(() => {});
      }
      return true;
    }

    const src = rules.resolveIframeSrc ? rules.resolveIframeSrc(s, href) : "";
    if (src) return injectIframe(src, s, parent);
    return Boolean(media || iframe);
  }

  async function apply() {
    const handoff = globalThis.BGThemeHandoff;
    if (
      rules.pageLooksLikePolling &&
      rules.pageLooksLikePolling()
    ) {
      if (handoff && typeof handoff.isStandingDown === "function" && handoff.isStandingDown()) {
        const leaked = Boolean(
          document.getElementById("dyn-theme-host") ||
          document.getElementById("dyn-mosaic-theme") ||
          document.getElementById("dyn-message-theme")
        );
        if (!leaked) return;
      }
    } else if (
      handoff &&
      typeof handoff.passthroughIsQuiet === "function" &&
      handoff.passthroughIsQuiet()
    ) {
      return;
    }
    if (rules.pageLooksLikePassthrough && rules.pageLooksLikePassthrough()) {
      removeAllCustom();
      if (rules.removeLeakedBrandChrome) rules.removeLeakedBrandChrome();
      if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
      return;
    }
    const settings = await rules.loadSettings();
    if (handoff && typeof handoff.isPassthrough === "function" && handoff.isPassthrough(settings)) {
      if (
        !(rules.pageLooksLikePolling && rules.pageLooksLikePolling()) &&
        handoff.isStandingDown &&
        handoff.isStandingDown()
      ) {
        return;
      }
      removeAllCustom();
      if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
      return;
    }

    const lbThemed = Boolean(
      settings &&
        settings.enabled !== false &&
        rules.normalizeLeaderboardTheme &&
        rules.normalizeLeaderboardTheme(settings.leaderboardTheme) !== "off" &&
        rules.pageLooksLikeLeaderboardOverlay &&
        rules.pageLooksLikeLeaderboardOverlay()
    );
    if (lbThemed) {
      removeIframe();
      removeMedia();
      document.documentElement.classList.remove("dyn-custom-bg");
      restoreOriginalBackground();
      if (rules.clearPassthroughState) rules.clearPassthroughState();
      if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
      return;
    }

    const themeOn = rules.liveThemeIsOn
      ? rules.liveThemeIsOn(settings)
      : rules.themeIsOn
        ? rules.themeIsOn(settings)
        : Boolean(
            settings &&
              settings.enabled !== false &&
              ((settings.messageTheme && settings.messageTheme !== "off") ||
                (settings.mosaicTheme && settings.mosaicTheme !== "off") ||
                (settings.leaderboardTheme && settings.leaderboardTheme !== "off"))
          );

    const wantCustom = showBackgroundWanted(settings);
    if (themeOn && !wantCustom) {
      removeIframe();
      removeMedia();
      document.documentElement.classList.remove("dyn-custom-bg");
      if (rules.themeReplacesBackground && rules.themeReplacesBackground(settings)) {
        hideOriginalBackground(rules.findWrapper());
      } else {
        restoreOriginalBackground();
      }
      return;
    }

    // Source = Vixi: copy the event bg URL into #dyn-bg-media (same path as a
    // pasted asset URL), then hide Vixi’s live layers so logo/QR do not ride along.
    if (settings && settings.bgMode === "vixi") {
      const asset =
        typeof rules.resolveVixiBackgroundAsset === "function"
          ? rules.resolveVixiBackgroundAsset()
          : null;
      if (asset && asset.src && injectRemoteAsset(asset, settings.bgFit || "cover", settings)) {
        return;
      }
      // Keep layers hidden while waiting for the event asset to appear.
      const wrapper = rules.findWrapper();
      if (wrapper) hideOriginalBackground(wrapper);
      markCustomBg(true);
      return;
    }

    const mediaId =
      typeof rules.resolveBackgroundMediaId === "function"
        ? rules.resolveBackgroundMediaId(settings, location.href)
        : "";
    if (mediaId) {
      const ok = await injectMedia(mediaId, settings.bgFit || "cover", settings);
      if (ok) {
        mediaRetryCount = 0;
        return;
      }
      if (mediaRetryCount < MEDIA_RETRY_MAX) {
        mediaRetryCount += 1;
        scheduleApply(Math.min(2000, 120 * mediaRetryCount));
      }
      return;
    }
    mediaRetryCount = 0;

    const src = rules.resolveIframeSrc(settings, location.href);
    if (!src) {
      removeAllCustom();
      if (themeOn && rules.themeReplacesBackground && rules.themeReplacesBackground(settings)) {
        hideOriginalBackground(rules.findWrapper());
      }
      return;
    }
    injectIframe(src, settings);
  }

  function scheduleApply(delayMs) {
    const handoff = globalThis.BGThemeHandoff;
    if (
      !(rules.pageLooksLikePolling && rules.pageLooksLikePolling()) &&
      handoff &&
      typeof handoff.passthroughIsQuiet === "function" &&
      handoff.passthroughIsQuiet()
    ) {
      return;
    }
    if (applyTimer) clearTimeout(applyTimer);
    const wait = delayMs == null ? 50 : Math.max(0, Number(delayMs) || 0);
    applyTimer = setTimeout(() => {
      applyTimer = 0;
      apply().catch(() => {});
    }, wait);
  }

  const observer = new MutationObserver(() => {
    const peek = rules.peekSettings ? rules.peekSettings() : null;
    if (rules.leaderboardBeatActive && peek && rules.leaderboardBeatActive(peek)) {
      return;
    }
    if (rules.pageLooksLikePolling && rules.pageLooksLikePolling()) {
      scheduleApply(0);
      return;
    }
    const handoff = globalThis.BGThemeHandoff;
    if (
      handoff &&
      typeof handoff.passthroughIsQuiet === "function" &&
      handoff.passthroughIsQuiet()
    ) {
      return;
    }
    scheduleApply();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.dynMediaAssets || Object.keys(changes).some((k) => k.indexOf("dynMediaAsset:") === 0)) {
        mediaRetryCount = 0;
      }
      scheduleApply();
    });
  } catch {
    /* extension reloaded */
  }

  try {
    chrome.runtime.onMessage.addListener((message) => {
      if (!message || message.type !== "dyn-bg-apply-settings") return;
      mediaRetryCount = 0;
      scheduleApply(0);
    });
  } catch {
    /* extension reloaded */
  }

  globalThis.BGCustomBackground = {
    scheduleApply,
    syncMount,
    removeAllCustom,
    clearPassthrough() {
      removeAllCustom();
      if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
    },
    applyNow() {
      return apply();
    },
  };

  let resizeApplyTimer = 0;
  window.addEventListener("resize", () => {
    const handoff = globalThis.BGThemeHandoff;
    if (
      handoff &&
      typeof handoff.passthroughIsQuiet === "function" &&
      handoff.passthroughIsQuiet()
    ) {
      return;
    }
    if (resizeApplyTimer) clearTimeout(resizeApplyTimer);
    resizeApplyTimer = setTimeout(() => {
      resizeApplyTimer = 0;
      scheduleApply(60);
    }, 80);
  });

  scheduleApply(0);
})();
