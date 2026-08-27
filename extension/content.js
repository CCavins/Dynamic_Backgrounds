(() => {
  const rules = globalThis.BGExtensionRules;
  if (!rules) return;

  const IFRAME_ID = "dyn-bg-embed";
  const IFRAME_STYLE =
    "position:absolute;inset:0;width:100%;height:100%;border:0;z-index:0;pointer-events:none;";

  let applyTimer = 0;

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

  function removeEmbed() {
    const iframe = document.getElementById(IFRAME_ID);
    if (iframe) iframe.remove();
    restoreOriginalBackground();
  }

  function injectEmbed(src) {
    const wrapper = rules.findWrapper();
    if (!wrapper) return false;

    hideOriginalBackground(wrapper);

    let iframe = document.getElementById(IFRAME_ID);
    if (!iframe || iframe.parentElement !== wrapper) {
      if (iframe) iframe.remove();
      iframe = document.createElement("iframe");
      iframe.id = IFRAME_ID;
      iframe.setAttribute("title", "Dynamic background");
      iframe.setAttribute("allow", "autoplay");
      iframe.style.cssText = IFRAME_STYLE;
      wrapper.insertBefore(iframe, wrapper.firstChild);
    }

    if (iframe.getAttribute("src") !== src) {
      iframe.setAttribute("src", src);
    }

    return true;
  }

  async function apply() {
    // Cached settings keep the injected background alive across extension
    // reloads; only a page refresh swaps in the new script.
    const settings = await rules.loadSettings();
    if (rules.themeReplacesBackground && rules.themeReplacesBackground(settings)) {
      hideOriginalBackground(rules.findWrapper());
      const iframe = document.getElementById(IFRAME_ID);
      if (iframe) iframe.remove();
      return;
    }
    const src = rules.resolveIframeSrc(settings, location.href);
    if (!src) {
      // Only pay for teardown when something was actually injected.
      if (document.getElementById(IFRAME_ID)) removeEmbed();
      return;
    }
    injectEmbed(src);
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

  apply().catch(() => {});
})();
