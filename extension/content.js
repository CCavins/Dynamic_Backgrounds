(() => {
  const rules = globalThis.BGExtensionRules;
  if (!rules) return;

  const IFRAME_ID = "dyn-bg-embed";
  const WRAPPER_SELECTOR = ".v2-app-wrapper";
  const BG_SELECTOR = ".v2-app-wrapper__bg-image";
  const IFRAME_STYLE =
    "position:absolute;inset:0;width:100%;height:100%;border:0;z-index:0;pointer-events:none;";

  let applyTimer = 0;

  function hideOriginalBackground(wrapper) {
    const background = wrapper.querySelector(BG_SELECTOR);
    if (background) background.style.setProperty("display", "none", "important");
  }

  function restoreOriginalBackground() {
    document.querySelectorAll(BG_SELECTOR).forEach((background) => {
      background.style.removeProperty("display");
    });
  }

  function removeEmbed() {
    const iframe = document.getElementById(IFRAME_ID);
    if (iframe) iframe.remove();
    restoreOriginalBackground();
  }

  function injectEmbed(src) {
    const wrapper = document.querySelector(WRAPPER_SELECTOR);
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
    if (typeof rules.extensionAlive === "function" && !rules.extensionAlive()) {
      observer.disconnect();
      return;
    }
    const settings = await rules.loadSettings();
    const src = rules.resolveIframeSrc(settings, location.href);
    if (!src) {
      removeEmbed();
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
