// Runs at document_start, before Vixi paints. If a theme is stored, the
// stock message/mosaic layers are hidden from the very first frame so the
// original look never flashes while the main scripts boot at document_idle.
(() => {
  // Only output pages get covers; admin/dashboard pages on the same domain
  // must never have their message/mosaic elements hidden.
  if (!/\/go\/(output|o)\//.test(location.pathname)) return;

  const STYLE_ID = "dyn-theme-cover-early";
  const html = document.documentElement;
  let urlHint = "";
  try {
    const q = location.search || "";
    if (/(?:^|[?&])standalone=mosaic(?:&|$)/i.test(q)) urlHint = "mosaic";
    else if (/(?:^|[?&])standalone=message(?:&|$)/i.test(q)) urlHint = "message";
  } catch {
    /* ignore */
  }
  const CSS =
    "html.dyn-ext-boot .v2-qr-tile," +
    "html.dyn-ext-boot .qr-tile," +
    "html.dyn-ext-boot .qr-code-wrapper," +
    "html.dyn-ext-boot .qr-code-img," +
    "html.dyn-ext-boot .v2-logo," +
    "html.dyn-ext-boot .v2-logo-tile," +
    "html.dyn-ext-boot .event-logo," +
    "html.dyn-ext-boot .logo-tile," +
    "html.dyn-ext-boot .output-logo," +
    "html.dyn-ext-boot .brand-logo," +
    "html.dyn-ext-boot .v2-app-wrapper__logo," +
    "html.dyn-ext-boot .mosaic-layout > .asset-view{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr) .v2-qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr) .qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr) .qr-code-wrapper:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr) .qr-code-img:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo) .v2-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo) .v2-logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo) .event-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo) .logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "#dyn-message-theme:not(.dyn-show-qr) [data-qr]," +
    "#dyn-message-theme:not(.dyn-show-qr) .dyn-brand-qr," +
    "#dyn-message-theme:not(.dyn-show-logo) [data-logo]," +
    "#dyn-message-theme:not(.dyn-show-logo) .dyn-brand-logo," +
    "#dyn-mosaic-theme:not(.dyn-show-qr) [data-qr]," +
    "#dyn-mosaic-theme:not(.dyn-show-qr) .dyn-brand-qr," +
    "#dyn-mosaic-theme:not(.dyn-show-logo) [data-logo]," +
    "#dyn-mosaic-theme:not(.dyn-show-logo) .dyn-brand-logo{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "#dyn-message-theme:not(.dyn-show-qr) [data-qr] img,#dyn-message-theme:not(.dyn-show-qr) [data-qr] canvas,#dyn-message-theme:not(.dyn-show-qr) [data-qr] svg," +
    "#dyn-message-theme:not(.dyn-show-logo) [data-logo] img,#dyn-message-theme:not(.dyn-show-logo) [data-logo] canvas,#dyn-message-theme:not(.dyn-show-logo) [data-logo] svg," +
    "#dyn-mosaic-theme:not(.dyn-show-qr) [data-qr] img,#dyn-mosaic-theme:not(.dyn-show-logo) [data-logo] img{" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
    "html.dyn-cover-message .capture-content-layer," +
    "html.dyn-cover-message .message-layer," +
    "html.dyn-cover-message .message-content," +
    "html.dyn-cover-message .v2-message," +
    "html.dyn-kind-message.dyn-cover-message .v2-text-tile," +
    "html.dyn-kind-message.dyn-cover-message .v2-asset-tile:not(.v2-mosaic-face){" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
    "html.dyn-cover-mosaic .mosaic-layout," +
    "html.dyn-cover-mosaic .mosaic-tile-slot," +
    "html.dyn-cover-mosaic .mosaic-asset," +
    "html.dyn-cover-mosaic .mosaic-image," +
    "html.dyn-cover-mosaic .v2-mosaic-swap-tile," +
    "html.dyn-cover-mosaic .v2-mosaic-face," +
    "html.dyn-cover-mosaic .mosaic-tile-slot .v2-asset-tile," +
    "html.dyn-cover-mosaic .v2-mosaic-swap-tile .v2-asset-tile{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-lb-pending .v2-app-wrapper .v2-block{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .v2-qr-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .v2-qr-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .qr-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .qr-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .qr-code-wrapper," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .qr-code-wrapper," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .qr-code-img," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .qr-code-img," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .v2-logo," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .v2-logo," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .v2-logo-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .v2-logo-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .event-logo," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .event-logo," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .logo-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .logo-tile," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .output-logo," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .output-logo," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .brand-logo," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .brand-logo," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .v2-app-wrapper__logo," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .v2-app-wrapper__logo," +
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
    "html.dyn-theme-on:not(.dyn-show-bg),html.dyn-theme-on:not(.dyn-show-bg) body,html.dyn-theme-on:not(.dyn-show-bg) .output-page{" +
      "background:#000!important;" +
    "}" +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message:not(.dyn-show-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic:not(.dyn-show-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message:not(.dyn-show-bg) .output-wrapper > .asset-view," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic:not(.dyn-show-bg) .output-wrapper > .asset-view," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message:not(.dyn-show-bg) .output-app > .asset-view{" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
    "html.dyn-kind-native #dyn-theme-host," +
    "html.dyn-kind-native #dyn-mosaic-theme," +
    "html.dyn-kind-native #dyn-message-theme{" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
    "#dyn-cta-wait{" +
      "position:fixed!important;" +
      "object-fit:contain!important;object-position:center!important;" +
      "background:#000!important;z-index:2147483000!important;" +
      "pointer-events:none!important;display:block!important;" +
    "}" +
    "iframe#dyn-cta-wait{" +
      "inset:0!important;left:0!important;top:0!important;" +
      "width:100%!important;height:100%!important;" +
      "max-width:none!important;max-height:none!important;" +
      "border:0!important;" +
    "}" +
    "html:not(.dyn-theme-on) .output-app > iframe," +
    "html.dyn-kind-native .output-app > iframe{" +
      "position:absolute!important;" +
      "inset:0!important;" +
      "width:100%!important;height:100%!important;" +
      "max-width:none!important;max-height:none!important;" +
      "border:0!important;" +
    "}";

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }
  // Hide stock QR/logo/mosaic tiles from the first frame. The class was CSS-only
  // and never applied, so /go/output/ pages without standalone= flashed Vixi.
  html.classList.add("dyn-ext-boot");
  try {
    const raw = sessionStorage.getItem("dynLastLiveKind:" + String(location.pathname || ""));
    const parsed = raw ? JSON.parse(raw) : null;
    if (
      parsed &&
      parsed.kind === "native" &&
      parsed.why !== "polling" &&
      (parsed.ctaSrc || parsed.ctaSrcdoc)
    ) {
      let wait = document.getElementById("dyn-cta-wait");
      const wantTag =
        parsed.ctaTag === "VIDEO" ? "VIDEO" : parsed.ctaTag === "IFRAME" ? "IFRAME" : "IMG";
      if (wait && wait.tagName !== wantTag) {
        wait.remove();
        wait = null;
      }
      if (!wait) {
        wait = document.createElement(
          wantTag === "VIDEO" ? "video" : wantTag === "IFRAME" ? "iframe" : "img"
        );
        wait.id = "dyn-cta-wait";
        wait.setAttribute("aria-hidden", "true");
        if (wantTag === "VIDEO") {
          wait.muted = true;
          wait.autoplay = true;
          wait.loop = true;
          wait.playsInline = true;
        }
        if (wantTag === "IFRAME") {
          wait.setAttribute("tabindex", "-1");
          wait.setAttribute("frameborder", "0");
        }
        html.appendChild(wait);
      }
      if (wantTag === "IFRAME" && parsed.ctaSrcdoc) {
        wait.setAttribute("srcdoc", String(parsed.ctaSrcdoc));
      } else {
        wait.setAttribute("src", String(parsed.ctaSrc || ""));
      }
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      const aw = Number(parsed.ctaNatW) > 0 ? Number(parsed.ctaNatW) : Number(parsed.ctaW) > 0 ? Number(parsed.ctaW) : 16;
      const ah = Number(parsed.ctaNatH) > 0 ? Number(parsed.ctaNatH) : Number(parsed.ctaH) > 0 ? Number(parsed.ctaH) : 9;
      wait.style.cssText =
        wantTag === "IFRAME"
          ? "position:fixed!important;inset:0!important;left:0!important;top:0!important;" +
            "width:100%!important;height:100%!important;" +
            "max-width:none!important;max-height:none!important;border:0!important;" +
            "background:#000!important;z-index:2147483000!important;" +
            "pointer-events:none!important;display:block!important;"
          : (() => {
              const s = Math.min(vw / aw, vh / ah);
              return (
                "position:fixed!important;inset:auto!important;" +
                "left:" + (vw - aw * s) / 2 + "px!important;" +
                "top:" + (vh - ah * s) / 2 + "px!important;" +
                "width:" + aw * s + "px!important;" +
                "height:" + ah * s + "px!important;" +
                "border:0!important;" +
                "object-fit:contain!important;object-position:center!important;" +
                "background:#000!important;z-index:2147483000!important;" +
                "pointer-events:none!important;display:block!important;"
              );
            })();
    }
  } catch {
    /* ignore */
  }

  try {
    const readFlag = (raw, nextKey, oldKey) => {
      if (raw[nextKey] != null) return Boolean(raw[nextKey]);
      if (raw[oldKey] != null) return Boolean(raw[oldKey]);
      return false;
    };
    chrome.storage.local.get(
      {
        enabled: true,
        mosaicTheme: "off",
        messageTheme: "off",
        showBackground: false,
        messageShowBackground: null,
        mosaicShowBackground: null,
        messageShowQr: false,
        messageShowLogo: false,
        mosaicShowQr: false,
        mosaicShowLogo: false,
        showQr: false,
        showLogo: false,
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
        const showQr = msgOn && !mosOn
          ? readFlag(s, "messageShowQr", "showQr")
          : mosOn && !msgOn
            ? readFlag(s, "mosaicShowQr", "showQr")
            : readFlag(s, "messageShowQr", "showQr") || readFlag(s, "mosaicShowQr", "showQr");
        const showLogo = msgOn && !mosOn
          ? readFlag(s, "messageShowLogo", "showLogo")
          : mosOn && !msgOn
            ? readFlag(s, "mosaicShowLogo", "showLogo")
            : readFlag(s, "messageShowLogo", "showLogo") || readFlag(s, "mosaicShowLogo", "showLogo");
        if (!themeOn) {
          html.classList.remove(
            "dyn-cover-message",
            "dyn-cover-mosaic",
            "dyn-theme-on",
            "dyn-show-bg",
            "dyn-chrome-qr",
            "dyn-chrome-logo",
            "dyn-ext-boot"
          );
          return;
        }
        html.classList.toggle(
          "dyn-cover-message",
          msgOn && (urlHint === "message" || urlHint === "" || mosOn)
        );
        html.classList.toggle(
          "dyn-cover-mosaic",
          mosOn && (urlHint === "mosaic" || urlHint === "" || msgOn)
        );
        html.classList.toggle("dyn-theme-on", true);
        html.classList.toggle("dyn-show-bg", showBg);
        html.classList.toggle("dyn-chrome-qr", showQr);
        html.classList.toggle("dyn-chrome-logo", showLogo);
        html.classList.remove("dyn-ext-boot");
      }
    );
  } catch {
    /* dead runtime; the main scripts handle covers once they load */
  }
})();
