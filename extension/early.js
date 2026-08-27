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
      "visibility:hidden!important;" +
    "}" +
    "html.dyn-cover-message .v2-qr-tile," +
    "html.dyn-cover-message .qr-tile," +
    "html.dyn-cover-mosaic .v2-qr-tile," +
    "html.dyn-cover-mosaic .qr-tile," +
    "html.dyn-cover-message .mosaic-layout > .asset-view," +
    "html.dyn-cover-mosaic .mosaic-layout > .asset-view{" +
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
      { enabled: true, mosaicTheme: "off", messageTheme: "off" },
      (s) => {
        if (chrome.runtime.lastError) return;
        const enabled = s.enabled !== false;
        const html = document.documentElement;
        html.classList.toggle(
          "dyn-cover-message",
          Boolean(enabled && s.messageTheme && s.messageTheme !== "off")
        );
        html.classList.toggle(
          "dyn-cover-mosaic",
          Boolean(enabled && s.mosaicTheme && s.mosaicTheme !== "off")
        );
      }
    );
  } catch {
    /* dead runtime; the main scripts handle covers once they load */
  }
})();
