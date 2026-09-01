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
    "html.dyn-theme-on:not(.dyn-kind-native) .v2-qr-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native) .qr-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native) .qr-code-wrapper," +
    "html.dyn-theme-on:not(.dyn-kind-native) .qr-code-img," +
    "html.dyn-theme-on:not(.dyn-kind-native) .v2-logo," +
    "html.dyn-theme-on:not(.dyn-kind-native) .v2-logo-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native) .event-logo," +
    "html.dyn-theme-on:not(.dyn-kind-native) .logo-tile," +
    "html.dyn-cover-message:not(.dyn-kind-native) .capture-content-layer," +
    "html.dyn-cover-message:not(.dyn-kind-native) .message-layer," +
    "html.dyn-cover-message:not(.dyn-kind-native) .message-content," +
    "html.dyn-cover-message:not(.dyn-kind-native) .v2-message," +
    "html.dyn-cover-mosaic:not(.dyn-kind-native) .mosaic-layout," +
    "html.dyn-cover-mosaic:not(.dyn-kind-native) .mosaic-tile-slot," +
    "html.dyn-cover-mosaic:not(.dyn-kind-native) .mosaic-asset," +
    "html.dyn-cover-mosaic:not(.dyn-kind-native) .mosaic-image," +
    "html.dyn-theme-on:not(.dyn-kind-native) .mosaic-layout > .asset-view{" +
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
