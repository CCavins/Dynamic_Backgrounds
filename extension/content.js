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
    if (!rules.liveThemeIsOn || !rules.liveThemeIsOn(settings)) return true;
    const chrome = rules.chromeForKind
      ? rules.chromeForKind(settings, rules.activeThemeKind ? rules.activeThemeKind(settings) : "")
      : { showBackground: false };
    return Boolean(chrome && chrome.showBackground);
  }

  /** Live theme root when Show background is on; otherwise the Vixi wrapper. */
  function findBgMountParent(settings) {
    const wrapper = rules.findWrapper();
    const themeOn = rules.liveThemeIsOn
      ? rules.liveThemeIsOn(settings)
      : false;
    if (!themeOn || !showBackgroundWanted(settings)) {
      return wrapper;
    }
    const kind = rules.activeThemeKind ? rules.activeThemeKind(settings) : "";
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

  function markCustomBg(parent) {
    const insideTheme =
      parent &&
      (parent.id === "dyn-message-theme" ||
        parent.id === "dyn-mosaic-theme" ||
        parent.id === "dyn-theme-host");
    document.documentElement.classList.toggle("dyn-custom-bg", Boolean(insideTheme));
  }

  function injectIframe(src, settings) {
    const parent = findBgMountParent(settings);
    if (!parent) return false;
    const wrapper = rules.findWrapper();
    if (wrapper) hideOriginalBackground(wrapper);
    removeMedia();

    let iframe = document.getElementById(IFRAME_ID);
    if (!iframe || iframe.parentElement !== parent) {
      if (iframe) iframe.remove();
      iframe = document.createElement("iframe");
      iframe.id = IFRAME_ID;
      iframe.setAttribute("title", "Dynamic background");
      iframe.setAttribute("allow", "autoplay");
      iframe.style.cssText = IFRAME_STYLE;
      parent.insertBefore(iframe, parent.firstChild);
    }

    if (iframe.getAttribute("src") !== src) {
      iframe.setAttribute("src", src);
    }
    markCustomBg(parent);
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

  async function injectMedia(mediaId, fit, settings) {
    if (!mediaApi || typeof mediaApi.getMedia !== "function") return false;
    const asset = await mediaApi.getMedia(mediaId);
    if (!asset || !asset.dataUrl) return false;

    const parent = findBgMountParent(settings);
    if (!parent) return false;
    const wrapper = rules.findWrapper();
    if (wrapper) hideOriginalBackground(wrapper);
    removeIframe();

    let host = document.getElementById(MEDIA_ID);
    if (!host || host.parentElement !== parent) {
      if (host) host.remove();
      host = document.createElement("div");
      host.id = MEDIA_ID;
      host.style.cssText = mediaHostStyle(parent);
      parent.insertBefore(host, parent.firstChild);
    } else {
      host.style.cssText = mediaHostStyle(parent);
    }

    const key = mediaId + "|" + (asset.mime || "") + "|" + (fit || "cover") + "|" + asset.dataUrl.length;
    const wantVideo = mediaApi.isVideoMime && mediaApi.isVideoMime(asset.mime);
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
      node.src = asset.dataUrl;
      lastMediaKey = key;
    }
    applyFit(node, fit);
    if (wantVideo && typeof node.play === "function") {
      const play = node.play();
      if (play && typeof play.catch === "function") play.catch(() => {});
    }
    markCustomBg(parent);
    return true;
  }

  async function apply() {
    const settings = await rules.loadSettings();
    const themeOn = rules.liveThemeIsOn
      ? rules.liveThemeIsOn(settings)
      : rules.themeIsOn
        ? rules.themeIsOn(settings)
        : Boolean(
            settings &&
              settings.enabled !== false &&
              ((settings.messageTheme && settings.messageTheme !== "off") ||
                (settings.mosaicTheme && settings.mosaicTheme !== "off"))
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

    const mediaId =
      typeof rules.resolveBackgroundMediaId === "function"
        ? rules.resolveBackgroundMediaId(settings, location.href)
        : "";
    if (mediaId) {
      const ok = await injectMedia(mediaId, settings.bgFit || "cover", settings);
      if (ok) return;
    }

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

  function scheduleApply() {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      applyTimer = 0;
      apply().catch(() => {});
    }, 50);
  }

  const observer = new MutationObserver(() => {
    scheduleApply();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") scheduleApply();
    });
  } catch {
    /* extension reloaded */
  }

  scheduleApply();
})();
