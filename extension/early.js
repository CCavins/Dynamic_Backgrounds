// Runs at document_start, before Vixi paints. If a theme is stored, the
// stock message/mosaic layers are hidden from the very first frame so the
// original look never flashes while the main scripts boot at document_idle.
(() => {
  // Only output pages get covers; admin/dashboard pages on the same domain
  // must never have their message/mosaic elements hidden.
  if (!/\/go\/(output|o)\//.test(location.pathname)) return;

  const STYLE_ID = "dyn-theme-cover-early";
  const CSS =
    "html.dyn-cover-message .capture-content-layer," +
    "html.dyn-cover-message .message-layer{" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
    "html.dyn-cover-mosaic .mosaic-tile-slot," +
    "html.dyn-cover-mosaic .mosaic-asset," +
    "html.dyn-cover-mosaic .mosaic-image{" +
      "opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-theme-on:not(:has(.output-stream-wrapper)):not(:has(img.fullscreen-asset)) .v2-qr-tile," +
    "html.dyn-theme-on:not(:has(.output-stream-wrapper)):not(:has(img.fullscreen-asset)) .qr-tile," +
    "html.dyn-theme-on:not(:has(.output-stream-wrapper)):not(:has(img.fullscreen-asset)) .v2-logo," +
    "html.dyn-theme-on:not(:has(.output-stream-wrapper)):not(:has(img.fullscreen-asset)) .v2-logo-tile," +
    "html.dyn-theme-on:not(:has(.output-stream-wrapper)):not(:has(img.fullscreen-asset)) .event-logo," +
    "html.dyn-theme-on:not(:has(.output-stream-wrapper)):not(:has(img.fullscreen-asset)) .logo-tile," +
    "html.dyn-theme-on .mosaic-layout > .asset-view{" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
    "html.dyn-theme-on,html.dyn-theme-on body,html.dyn-theme-on .output-page{" +
      "background:#000!important;" +
    "}" +
    "html.dyn-theme-on:not(.dyn-show-bg):not(:has(.output-stream-wrapper)):not(:has(img.fullscreen-asset)) .v2-app-wrapper__bg-image," +
    "html.dyn-theme-on:not(.dyn-show-bg):not(:has(.output-stream-wrapper)):not(:has(img.fullscreen-asset)) .output-wrapper > .asset-view{" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
    "html.dyn-kind-native #dyn-theme-host," +
    "html.dyn-kind-native #dyn-mosaic-theme," +
    "html.dyn-kind-native #dyn-message-theme{" +
      "visibility:hidden!important;opacity:0!important;" +
    "}";

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  try {
    chrome.storage.local.get(
      {
        enabled: true,
        mosaicTheme: "off",
        messageTheme: "off",
        showBackground: false,
        messageShowBackground: null,
        mosaicShowBackground: null,
      },
      (s) => {
        if (chrome.runtime.lastError) return;
        const enabled = s.enabled !== false;
        const msgOn = Boolean(enabled && s.messageTheme && s.messageTheme !== "off");
        const mosOn = Boolean(enabled && s.mosaicTheme && s.mosaicTheme !== "off");
        const themeOn = msgOn || mosOn;
        const flag = (nextKey) =>
          s[nextKey] == null ? Boolean(s.showBackground) : Boolean(s[nextKey]);
        const showBg = msgOn && !mosOn
          ? flag("messageShowBackground")
          : mosOn && !msgOn
            ? flag("mosaicShowBackground")
            : flag("messageShowBackground") && flag("mosaicShowBackground");
        const html = document.documentElement;
        html.classList.toggle("dyn-cover-message", msgOn);
        html.classList.toggle("dyn-cover-mosaic", mosOn);
        html.classList.toggle("dyn-theme-on", themeOn);
        html.classList.toggle("dyn-show-bg", themeOn && showBg);
      }
    );
  } catch {
    /* dead runtime; the main scripts handle covers once they load */
  }
})();
