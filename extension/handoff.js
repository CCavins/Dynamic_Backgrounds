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
    "html.dyn-kind-message.dyn-cover-message .v2-text-tile," +
    "html.dyn-kind-message.dyn-cover-message .v2-asset-tile:not(.v2-mosaic-face){" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
    "html.dyn-kind-message.dyn-cover-message .output-app > img.fullscreen-asset:not([src*='playlist/cta'])," +
    "html.dyn-kind-message.dyn-cover-message .output-app > video.fullscreen-asset:not([src*='playlist/cta']){" +
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
      "border:0!important;object-fit:fill!important;" +
    "}" +
    "html:not(.dyn-theme-on) .output-app:has(> iframe)," +
    "html.dyn-kind-native .output-app:has(> iframe){" +
      "position:relative!important;" +
    "}" +
    "html:not(.dyn-theme-on) .output-app > iframe," +
    "html.dyn-kind-native .output-app > iframe{" +
      "position:absolute!important;" +
      "inset:0!important;" +
      "width:100%!important;height:100%!important;" +
      "max-width:none!important;max-height:none!important;" +
      "border:0!important;" +
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
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .v2-qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .v2-qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .qr-code-wrapper:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .qr-code-wrapper:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .qr-code-img:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .qr-code-img:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .v2-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .v2-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .v2-logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .v2-logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .event-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .event-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .output-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .output-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .brand-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .brand-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message .v2-app-wrapper__logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic .v2-app-wrapper__logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native) .mosaic-layout > .asset-view:not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message:not(:has(#dyn-message-theme.on)) .capture-content-layer," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message:not(:has(#dyn-message-theme.on)) .message-layer," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message:not(:has(#dyn-message-theme.on)) .message-content," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-message:not(:has(#dyn-message-theme.on)) .v2-message," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-cover-message:not(.dyn-kind-mosaic):not(:has(#dyn-message-theme)) .capture-content-layer," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-cover-message:not(.dyn-kind-mosaic):not(:has(#dyn-message-theme)) .message-layer," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-cover-message:not(.dyn-kind-mosaic):not(:has(#dyn-message-theme)) .message-content," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-cover-message:not(.dyn-kind-mosaic):not(:has(#dyn-message-theme)) .v2-message," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic:not(:has(#dyn-mosaic-theme.on)) .mosaic-layout," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic:not(:has(#dyn-mosaic-theme.on)) .mosaic-tile-slot," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic:not(:has(#dyn-mosaic-theme.on)) .mosaic-asset," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-kind-mosaic:not(:has(#dyn-mosaic-theme.on)) .mosaic-image," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-cover-mosaic:not(.dyn-kind-message):not(:has(#dyn-mosaic-theme)) .mosaic-layout," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-cover-mosaic:not(.dyn-kind-message):not(:has(#dyn-mosaic-theme)) .mosaic-tile-slot," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-cover-mosaic:not(.dyn-kind-message):not(:has(#dyn-mosaic-theme)) .mosaic-asset," +
    "html.dyn-theme-on:not(.dyn-kind-native).dyn-cover-mosaic:not(.dyn-kind-message):not(:has(#dyn-mosaic-theme)) .mosaic-image," +
    /* Between messages / awaiting next capture: hide all brand slots (extension
       chrome and in-theme [data-logo]/[data-qr] e.g. Grunge) but keep stage bg. */
    "#dyn-message-theme:not(.on) > .dyn-brand-chrome," +
    "#dyn-mosaic-theme:not(.on) > .dyn-brand-chrome," +
    "#dyn-message-theme:not(.on) [data-logo]," +
    "#dyn-message-theme:not(.on) [data-qr]," +
    "#dyn-message-theme:not(.on) .dyn-brand-logo," +
    "#dyn-message-theme:not(.on) .dyn-brand-qr," +
    "#dyn-mosaic-theme:not(.on) [data-logo]," +
    "#dyn-mosaic-theme:not(.on) [data-qr]," +
    "#dyn-mosaic-theme:not(.on) .dyn-brand-logo," +
    "#dyn-mosaic-theme:not(.on) .dyn-brand-qr," +
    "#dyn-message-theme.dyn-awaiting-show > .dyn-brand-chrome," +
    "#dyn-mosaic-theme.dyn-awaiting-show > .dyn-brand-chrome," +
    "#dyn-message-theme.dyn-awaiting-show [data-logo]," +
    "#dyn-message-theme.dyn-awaiting-show [data-qr]," +
    "#dyn-message-theme.dyn-awaiting-show .dyn-brand-logo," +
    "#dyn-message-theme.dyn-awaiting-show .dyn-brand-qr," +
    "#dyn-mosaic-theme.dyn-awaiting-show [data-logo]," +
    "#dyn-mosaic-theme.dyn-awaiting-show [data-qr]," +
    "#dyn-mosaic-theme.dyn-awaiting-show .dyn-brand-logo," +
    "#dyn-mosaic-theme.dyn-awaiting-show .dyn-brand-qr," +
    "#dyn-message-theme.on.off > .dyn-brand-chrome," +
    "#dyn-mosaic-theme.on.off > .dyn-brand-chrome," +
    "#dyn-message-theme.on.off [data-logo]," +
    "#dyn-message-theme.on.off [data-qr]," +
    "#dyn-message-theme.on.off .dyn-brand-logo," +
    "#dyn-message-theme.on.off .dyn-brand-qr," +
    "#dyn-mosaic-theme.on.off [data-logo]," +
    "#dyn-mosaic-theme.on.off [data-qr]," +
    "#dyn-mosaic-theme.on.off .dyn-brand-logo," +
    "#dyn-mosaic-theme.on.off .dyn-brand-qr," +
    "#dyn-message-theme.is-parked > .dyn-brand-chrome," +
    "#dyn-mosaic-theme.is-parked > .dyn-brand-chrome," +
    "#dyn-message-theme.is-parked [data-logo]," +
    "#dyn-message-theme.is-parked [data-qr]," +
    "#dyn-mosaic-theme.is-parked [data-logo]," +
    "#dyn-mosaic-theme.is-parked [data-qr]{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "#dyn-message-theme:not(.on) [data-logo] img,#dyn-message-theme:not(.on) [data-logo] canvas,#dyn-message-theme:not(.on) [data-logo] svg,#dyn-message-theme:not(.on) [data-logo] .dyn-brand-clone," +
    "#dyn-message-theme:not(.on) [data-qr] img,#dyn-message-theme:not(.on) [data-qr] canvas,#dyn-message-theme:not(.on) [data-qr] svg,#dyn-message-theme:not(.on) [data-qr] .dyn-brand-clone," +
    "#dyn-message-theme.dyn-awaiting-show [data-logo] img,#dyn-message-theme.dyn-awaiting-show [data-logo] canvas,#dyn-message-theme.dyn-awaiting-show [data-logo] svg,#dyn-message-theme.dyn-awaiting-show [data-logo] .dyn-brand-clone," +
    "#dyn-message-theme.dyn-awaiting-show [data-qr] img,#dyn-message-theme.dyn-awaiting-show [data-qr] canvas,#dyn-message-theme.dyn-awaiting-show [data-qr] svg,#dyn-message-theme.dyn-awaiting-show [data-qr] .dyn-brand-clone," +
    "#dyn-message-theme.on.off [data-logo] img,#dyn-message-theme.on.off [data-logo] canvas,#dyn-message-theme.on.off [data-logo] svg,#dyn-message-theme.on.off [data-logo] .dyn-brand-clone," +
    "#dyn-message-theme.on.off [data-qr] img,#dyn-message-theme.on.off [data-qr] canvas,#dyn-message-theme.on.off [data-qr] svg,#dyn-message-theme.on.off [data-qr] .dyn-brand-clone," +
    "#dyn-mosaic-theme:not(.on) [data-logo] img,#dyn-mosaic-theme:not(.on) [data-qr] img," +
    "#dyn-mosaic-theme.dyn-awaiting-show [data-logo] img,#dyn-mosaic-theme.dyn-awaiting-show [data-qr] img," +
    "#dyn-mosaic-theme.on.off [data-logo] img,#dyn-mosaic-theme.on.off [data-qr] img{" +
      "visibility:hidden!important;opacity:0!important;" +
    "}" +
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
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr).dyn-kind-message .v2-qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr).dyn-kind-mosaic .v2-qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr).dyn-kind-message .qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr).dyn-kind-mosaic .qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr).dyn-kind-message .qr-code-wrapper:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr).dyn-kind-mosaic .qr-code-wrapper:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr).dyn-kind-message .qr-code-img:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-kind-native):not(.dyn-chrome-qr).dyn-kind-mosaic .qr-code-img:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-message .v2-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-mosaic .v2-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-message .v2-logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-mosaic .v2-logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-message .event-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-mosaic .event-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-message .logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-mosaic .logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-message .output-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-mosaic .output-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-message .brand-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-mosaic .brand-logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-message .v2-app-wrapper__logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-theme-on:not(.dyn-chrome-logo).dyn-kind-mosaic .v2-app-wrapper__logo:not(.dyn-brand-clone):not(#dyn-theme-host *)," +
    "html.dyn-cover-message:not(.dyn-kind-native) .output-app > .asset-view," +
    "html.dyn-theme-on.dyn-kind-mosaic:not(.dyn-show-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-theme-on.dyn-kind-mosaic:not(.dyn-show-bg) .output-wrapper > .asset-view," +
    "html.dyn-theme-on.dyn-kind-message:not(.dyn-show-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-theme-on.dyn-kind-message:not(.dyn-show-bg) .output-wrapper > .asset-view," +
    "html.dyn-theme-on.dyn-kind-message:not(.dyn-show-bg) .output-app > .asset-view," +
    "html.dyn-theme-on.dyn-kind-mosaic:not(.dyn-show-bg) #dyn-bg-embed," +
    "html.dyn-theme-on.dyn-kind-message:not(.dyn-show-bg) #dyn-bg-embed," +
    "html.dyn-theme-on.dyn-kind-mosaic:not(.dyn-show-bg) #dyn-bg-media," +
    "html.dyn-theme-on.dyn-kind-message:not(.dyn-show-bg) #dyn-bg-media{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-show-bg:not(.dyn-custom-bg) .v2-app-wrapper__bg-image," +
    "html.dyn-show-bg:not(.dyn-custom-bg) .output-wrapper > .asset-view," +
    "html.dyn-show-bg:not(.dyn-custom-bg) .output-wrapper > .asset-view img," +
    "html.dyn-show-bg:not(.dyn-custom-bg) .output-wrapper > .asset-view video," +
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
      "width:100%!important;height:100%!important;" +
      "visibility:visible!important;opacity:1!important;" +
      "pointer-events:none!important;z-index:0!important;" +
      "display:block!important;" +
    "}" +
    /* Custom media lives inside the theme root: above theme backdrop layers
       (.wall, asphalt texture, stage fills), below cards/copy. */
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
      "position:absolute!important;inset:0!important;" +
      "width:100%!important;height:100%!important;" +
      "visibility:visible!important;opacity:1!important;" +
      "pointer-events:none!important;display:block!important;" +
    "}" +
    "html.dyn-theme-on.dyn-kind-message [data-dyn-chrome-kind=\"mosaic\"]," +
    "html.dyn-theme-on.dyn-kind-mosaic [data-dyn-chrome-kind=\"message\"]{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-kind-message:not(.dyn-handoff) #dyn-mosaic-theme," +
    "html.dyn-kind-message:not(.dyn-handoff) #dyn-leaderboard-theme," +
    "html.dyn-kind-mosaic:not(.dyn-handoff) #dyn-message-theme," +
    "html.dyn-kind-mosaic:not(.dyn-handoff) #dyn-leaderboard-theme{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-kind-native #dyn-theme-host," +
    "html.dyn-kind-native #dyn-mosaic-theme," +
    "html.dyn-kind-native #dyn-message-theme," +
    "html.dyn-kind-native #dyn-leaderboard-theme," +
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
    "html.dyn-hold:not(.dyn-show-bg) .output-app{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-hold.dyn-show-bg .output-app .capture-content-layer," +
    "html.dyn-hold.dyn-show-bg .output-app .message-layer," +
    "html.dyn-hold.dyn-show-bg .output-app .message-content," +
    "html.dyn-hold.dyn-show-bg .output-app .v2-message," +
    "html.dyn-hold.dyn-show-bg .output-app .v2-text-tile," +
    "html.dyn-hold.dyn-show-bg .output-app .mosaic-layout," +
    "html.dyn-hold.dyn-show-bg .output-app .mosaic-tile-slot," +
    "html.dyn-hold.dyn-show-bg .output-app .mosaic-asset," +
    "html.dyn-hold.dyn-show-bg .output-app .mosaic-image," +
    "html.dyn-hold.dyn-show-bg .output-app .v2-mosaic-swap-tile," +
    "html.dyn-hold.dyn-show-bg .output-app .v2-mosaic-face," +
    "html.dyn-hold.dyn-show-bg .output-app .v2-asset-tile{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-hold #dyn-theme-host," +
    "html.dyn-hold #dyn-message-theme:not(.is-parked){" +
      "visibility:visible!important;opacity:1!important;" +
    "}" +
    "html.dyn-hold #dyn-mosaic-theme:not(.is-parked){" +
      "visibility:visible!important;opacity:1!important;" +
    "}" +
    "html.dyn-hold #dyn-leaderboard-theme:not(.is-parked){" +
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
    "html.dyn-cover-leaderboard .v2-block[data-dyn-lb-native]," +
    "html.dyn-leaderboard-on .v2-block[data-dyn-lb-native]," +
    "html.dyn-cover-leaderboard .v2-block[data-dyn-lb-header]," +
    "html.dyn-leaderboard-on .v2-block[data-dyn-lb-header]," +
    "html.dyn-lb-pending .v2-app-wrapper .v2-block{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-kind-leaderboard #dyn-message-theme," +
    "html.dyn-kind-leaderboard #dyn-mosaic-theme{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
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
    "html.dyn-show-bg:not(.dyn-custom-bg).dyn-kind-leaderboard #dyn-leaderboard-theme{" +
      "background:transparent!important;background-image:none!important;" +
    "}" +
    /* Leaderboard overlay: live polling bg only — hide leftover playlist layers. */
    "html.dyn-kind-leaderboard.dyn-show-bg:not(.dyn-custom-bg) .v2-app-wrapper__bg-image{" +
      "visibility:visible!important;opacity:1!important;pointer-events:none!important;display:block!important;" +
    "}" +
    "html.dyn-kind-leaderboard.dyn-show-bg:not(.dyn-custom-bg) .output-wrapper > .asset-view," +
    "html.dyn-kind-leaderboard.dyn-show-bg:not(.dyn-custom-bg) .output-wrapper > .asset-view img," +
    "html.dyn-kind-leaderboard.dyn-show-bg:not(.dyn-custom-bg) .output-wrapper > .asset-view video," +
    "html.dyn-kind-leaderboard .output-app > img.fullscreen-asset," +
    "html.dyn-kind-leaderboard .output-app > video.fullscreen-asset," +
    "html.dyn-kind-leaderboard .capture-content-layer," +
    "html.dyn-kind-leaderboard .message-layer," +
    "html.dyn-kind-leaderboard .message-content," +
    "html.dyn-kind-leaderboard .v2-message," +
    "html.dyn-kind-leaderboard:not(.dyn-custom-bg) #dyn-bg-media," +
    "html.dyn-kind-leaderboard:not(.dyn-custom-bg) #dyn-bg-embed{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;display:none!important;" +
    "}" +
    /* Image backdrops (Grunge brick, Slant asphalt, etc.) must not paint over
       #dyn-bg-media / #dyn-bg-embed when Show background is on. */
    "html.dyn-show-bg #dyn-message-theme .wall," +
    "html.dyn-show-bg #dyn-message-theme .grain," +
    "html.dyn-show-bg #dyn-mosaic-theme .sr-texture," +
    "html.dyn-custom-bg #dyn-message-theme .wall," +
    "html.dyn-custom-bg #dyn-message-theme .grain," +
    "html.dyn-custom-bg #dyn-mosaic-theme .sr-texture," +
    "#dyn-message-theme.dyn-show-bg .wall," +
    "#dyn-message-theme.dyn-show-bg .grain," +
    "#dyn-mosaic-theme.dyn-show-bg .sr-texture{" +
      "visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}" +
    "html.dyn-show-bg #dyn-message-theme .dyn-fit-stage," +
    "html.dyn-show-bg #dyn-message-theme .dyn-stage," +
    "html.dyn-show-bg #dyn-message-theme .frame," +
    "html.dyn-show-bg #dyn-message-theme .scene," +
    "html.dyn-custom-bg #dyn-message-theme .dyn-fit-stage," +
    "html.dyn-custom-bg #dyn-message-theme .dyn-stage," +
    "html.dyn-custom-bg #dyn-message-theme .frame," +
    "html.dyn-custom-bg #dyn-message-theme .scene," +
    "html.dyn-show-bg #dyn-mosaic-theme .dyn-stage," +
    "html.dyn-custom-bg #dyn-mosaic-theme .dyn-stage," +
    "html.dyn-show-bg #dyn-message-theme[data-theme]," +
    "html.dyn-show-bg #dyn-mosaic-theme[data-theme]," +
    "html.dyn-custom-bg #dyn-message-theme[data-theme]," +
    "html.dyn-custom-bg #dyn-mosaic-theme[data-theme]," +
    "#dyn-message-theme.dyn-show-bg[data-theme]," +
    "#dyn-mosaic-theme.dyn-show-bg[data-theme]{" +
      "background:transparent!important;background-image:none!important;" +
    "}" +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .frame::before," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .frame::after," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .scene::before," +
    "html.dyn-show-bg.dyn-kind-message #dyn-message-theme .scene::after," +
    "html.dyn-custom-bg #dyn-message-theme .frame::before," +
    "html.dyn-custom-bg #dyn-message-theme .frame::after," +
    "html.dyn-custom-bg #dyn-message-theme .scene::before," +
    "html.dyn-custom-bg #dyn-message-theme .scene::after{" +
      "background:transparent!important;background-image:none!important;" +
    "}" +
    "html.dyn-custom-bg.dyn-kind-message #dyn-message-theme > *:not(#dyn-bg-media):not(#dyn-bg-embed):not(.dyn-brand-chrome)," +
    "html.dyn-custom-bg.dyn-kind-mosaic #dyn-mosaic-theme > *:not(#dyn-bg-media):not(#dyn-bg-embed):not(.dyn-brand-chrome)," +
    "html.dyn-custom-bg #dyn-theme-host > *:not(#dyn-bg-media):not(#dyn-bg-embed):not(#dyn-message-theme):not(#dyn-mosaic-theme):not(.dyn-brand-chrome){" +
      "z-index:2;" +
    "}" +
    "html.dyn-show-bg #dyn-message-theme > .dyn-brand-chrome," +
    "html.dyn-show-bg #dyn-mosaic-theme > .dyn-brand-chrome," +
    "html.dyn-custom-bg #dyn-message-theme > .dyn-brand-chrome," +
    "html.dyn-custom-bg #dyn-mosaic-theme > .dyn-brand-chrome{" +
      "z-index:130!important;" +
    "}" +
    "html.dyn-theme-on:not(.dyn-show-bg):not(.dyn-kind-leaderboard),html.dyn-theme-on:not(.dyn-show-bg):not(.dyn-kind-leaderboard) body,html.dyn-theme-on:not(.dyn-show-bg):not(.dyn-kind-leaderboard) .output-page{" +
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
    ".dyn-brand-chrome{position:absolute;inset:0;z-index:120;pointer-events:none;}" +
    ".dyn-brand-logo{position:absolute;top:3.2%;left:3.2%;width:min(14%,180px);height:auto;}" +
    ".dyn-brand-qr{position:absolute;right:3.2%;bottom:3.2%;width:min(12%,160px);height:auto;aspect-ratio:1;}" +
    ".dyn-brand-logo img,.dyn-brand-logo canvas,.dyn-brand-logo svg,.dyn-brand-logo .dyn-brand-clone," +
    ".dyn-brand-qr img,.dyn-brand-qr canvas,.dyn-brand-qr svg,.dyn-brand-qr .dyn-brand-clone," +
    "[data-logo] img,[data-logo] canvas,[data-logo] svg,[data-logo] .dyn-brand-clone," +
    "[data-qr] img,[data-qr] canvas,[data-qr] svg,[data-qr] .dyn-brand-clone{" +
      "display:block!important;width:100%!important;height:auto!important;" +
      "max-width:100%!important;max-height:100%!important;" +
      "object-fit:contain!important;" +
      "visibility:visible!important;opacity:1!important;" +
    "}" +
    ".dyn-portrait .dyn-brand-logo{width:min(28%,200px);}" +
    ".dyn-portrait .dyn-brand-qr{width:min(22%,180px);bottom:4%;}" +
    "[data-qr][hidden],[data-logo][hidden]{display:none!important;}" +
    /* Passthrough / master Off: never leave theme chrome on screen. */
    "html:not(.dyn-theme-on) #" + HOST_ID + "," +
    "html:not(.dyn-theme-on) #dyn-message-theme," +
    "html:not(.dyn-theme-on) #dyn-mosaic-theme," +
    "html:not(.dyn-theme-on) #dyn-leaderboard-theme{" +
      "display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;" +
    "}";

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
  let stoodDown = false;
  let lastCoverDecision = "";
  let lastLiveWhy = "";
  let leftoverMsgKey = "";
  let mosaicNSeen = false;
  let prevMosaicN = 0;
  let mosDispSeen = false;
  let prevMosDisp = false;
  let committedKindThisPage = false;
  let leftoverMosSrcs = "";
  let leftoverMosSawGap = false;
  const LAST_KIND_KEY_PREFIX = "dynLastLiveKind:";
  const CTA_WAIT_ID = "dyn-cta-wait";

  function captureKeyOf(cap) {
    if (!cap) return "";
    return [String(cap.src || ""), String(cap.message || ""), String(cap.name || "")].join("|");
  }

  function lastKindStorageKey() {
    try {
      return LAST_KIND_KEY_PREFIX + String(location.pathname || "");
    } catch {
      return LAST_KIND_KEY_PREFIX;
    }
  }

  function readPersistedKind() {
    try {
      const raw = sessionStorage.getItem(lastKindStorageKey());
      if (!raw) return { kind: "", why: "" };
      const parsed = JSON.parse(raw);
      const kind = String((parsed && parsed.kind) || "");
      if (kind === "native" || kind === "message" || kind === "mosaic" || kind === "leaderboard") {
        return {
          kind,
          why: String((parsed && parsed.why) || ""),
          ctaSrc: String((parsed && parsed.ctaSrc) || ""),
          ctaSrcdoc: String((parsed && parsed.ctaSrcdoc) || ""),
          ctaTag: String((parsed && parsed.ctaTag) || "IMG"),
          ctaW: Number(parsed && parsed.ctaW) || 0,
          ctaH: Number(parsed && parsed.ctaH) || 0,
          ctaNatW: Number(parsed && parsed.ctaNatW) || 0,
          ctaNatH: Number(parsed && parsed.ctaNatH) || 0,
        };
      }
    } catch {
      /* ignore */
    }
    return { kind: "", why: "", ctaSrc: "", ctaSrcdoc: "", ctaTag: "IMG", ctaW: 0, ctaH: 0, ctaNatW: 0, ctaNatH: 0 };
  }

  function ctaWaitTag(tag) {
    const t = String(tag || "IMG").toUpperCase();
    if (t === "VIDEO" || t === "IFRAME") return t;
    return "IMG";
  }

  function unwrapCtaNode(el) {
    if (!el) return null;
    if (el.id === CTA_WAIT_ID) return null;
    if (/^(IMG|VIDEO|IFRAME|CANVAS)$/i.test(el.tagName || "")) return el;
    try {
      return (
        el.querySelector(
          "iframe, video.fullscreen-asset, img.fullscreen-asset, video, img[alt='CTA Image' i], [src*='/playlist/cta/']"
        ) || el
      );
    } catch {
      return el;
    }
  }

  function captureCtaMedia() {
    try {
      let el =
        document.querySelector(
          ".output-app > img.fullscreen-asset, .output-app > video.fullscreen-asset, .output-app > img[alt='CTA Image' i], .output-app [src*='/playlist/cta/'], .output-app > iframe"
        ) ||
        (rules.findDirectNativeAsset && rules.findDirectNativeAsset());
      el = unwrapCtaNode(el);
      if (!el) {
        return { src: "", srcdoc: "", tag: "IMG", w: 0, h: 0, natW: 0, natH: 0 };
      }
      const src = String(el.currentSrc || el.src || el.getAttribute("src") || "");
      const srcdoc = String(el.srcdoc || el.getAttribute("srcdoc") || "");
      const r = el.getBoundingClientRect();
      const nw = Number(el.naturalWidth || el.videoWidth || 0);
      const nh = Number(el.naturalHeight || el.videoHeight || 0);
      return {
        src,
        srcdoc,
        tag: String(el.tagName || "IMG"),
        w: Math.round(r.width) || nw,
        h: Math.round(r.height) || nh,
        natW: nw,
        natH: nh,
      };
    } catch {
      return { src: "", srcdoc: "", tag: "IMG", w: 0, h: 0, natW: 0, natH: 0 };
    }
  }

  function containViewportBox(aw, ah) {
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const s = Math.min(vw / (aw || 16), vh / (ah || 9));
    return {
      left: (vw - aw * s) / 2,
      top: (vh - ah * s) / 2,
      w: aw * s,
      h: ah * s,
      vw,
      vh,
      aw,
      ah,
    };
  }

  function layoutCachedCtaOverlay(el, persisted) {
    const tag = ctaWaitTag(persisted.ctaTag);
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const aw = persisted.ctaNatW > 0 ? persisted.ctaNatW : persisted.ctaW > 0 ? persisted.ctaW : 16;
    const ah = persisted.ctaNatH > 0 ? persisted.ctaNatH : persisted.ctaH > 0 ? persisted.ctaH : 9;
    // Web page CTAs have no intrinsic pixels — fill the window like Vixi's iframe.
    const box =
      tag === "IFRAME" ? { left: 0, top: 0, w: vw, h: vh, vw, vh, aw, ah } : containViewportBox(aw, ah);
    if (tag === "IFRAME") {
      el.style.cssText =
        "position:fixed!important;" +
        "inset:0!important;left:0!important;top:0!important;right:0!important;bottom:0!important;" +
        "width:100%!important;height:100%!important;" +
        "max-width:none!important;max-height:none!important;" +
        "border:0!important;" +
        "background:#000!important;z-index:2147483000!important;" +
        "pointer-events:none!important;display:block!important;";
      return box;
    }
    el.style.cssText =
      "position:fixed!important;" +
      "inset:auto!important;" +
      "left:" + box.left + "px!important;" +
      "top:" + box.top + "px!important;" +
      "width:" + box.w + "px!important;" +
      "height:" + box.h + "px!important;" +
      "max-width:none!important;max-height:none!important;" +
      "border:0!important;" +
      "object-fit:contain!important;object-position:center!important;" +
      "background:#000!important;z-index:2147483000!important;" +
      "pointer-events:none!important;display:block!important;";
    return box;
  }

  function removeCachedCta() {
    const el = document.getElementById(CTA_WAIT_ID);
    if (el) el.remove();
  }

  function paintCachedCta() {
    const persisted = readPersistedKind();
    const canPaint =
      persistedNativeRefresh() &&
      persisted.why !== "polling" &&
      Boolean(persisted.ctaSrc || persisted.ctaSrcdoc) &&
      !visibleCtaOrStream();
    if (!canPaint) {
      if (visibleCtaOrStream() || !persistedNativeRefresh()) removeCachedCta();
      return false;
    }
    let el = document.getElementById(CTA_WAIT_ID);
    const wantTag = ctaWaitTag(persisted.ctaTag);
    if (el && el.tagName !== wantTag) {
      el.remove();
      el = null;
    }
    if (!el) {
      el = document.createElement(wantTag === "VIDEO" ? "video" : wantTag === "IFRAME" ? "iframe" : "img");
      el.id = CTA_WAIT_ID;
      el.setAttribute("aria-hidden", "true");
      if (wantTag === "VIDEO") {
        el.muted = true;
        el.autoplay = true;
        el.loop = true;
        el.playsInline = true;
      }
      if (wantTag === "IFRAME") {
        el.setAttribute("tabindex", "-1");
        el.setAttribute("frameborder", "0");
      }
      (document.documentElement || document.body).appendChild(el);
    }
    if (wantTag === "IFRAME" && persisted.ctaSrcdoc) {
      if (el.getAttribute("srcdoc") !== persisted.ctaSrcdoc) el.setAttribute("srcdoc", persisted.ctaSrcdoc);
    } else if (el.getAttribute("src") !== persisted.ctaSrc) {
      el.setAttribute("src", persisted.ctaSrc);
    }
    layoutCachedCtaOverlay(el, persisted);
    if (!window.__dynCtaResizeBound) {
      window.__dynCtaResizeBound = true;
      window.addEventListener("resize", () => {
        const wait = document.getElementById(CTA_WAIT_ID);
        if (wait) layoutCachedCtaOverlay(wait, readPersistedKind());
      });
    }
    return true;
  }

  function persistWhyAllowed(kind, why) {
    const w = String(why || "");
    if (kind === "native") {
      return w === "hardCtaOrStream" || w === "hardNative" || w === "polling";
    }
    if (kind === "message") {
      return (
        w === "messageOnly" ||
        w === "freshMsg" ||
        w === "freshMsgOverMos" ||
        w === "msgVisible" ||
        w === "msgPresent" ||
        w === "overlayMsg" ||
        w === "bothHasMsg" ||
        w === "bothFreshMsg"
      );
    }
    if (kind === "mosaic") {
      return (
        w === "mosaicOnly" ||
        w === "mosaicAppeared" ||
        w === "mosBecameOn" ||
        w === "overlayMos" ||
        w === "mosaicVisible" ||
        w === "bothLeftoverMos" ||
        w === "bothNoMsg"
      );
    }
    if (kind === "leaderboard") return w === "leaderboard";
    return false;
  }

  function persistLiveKind(kind, why) {
    const useWhy = why || lastLiveWhy || "";
    if (!persistWhyAllowed(kind, useWhy)) return;
    committedKindThisPage = true;
    try {
      const prev = readPersistedKind();
      let ctaSrc = "";
      let ctaSrcdoc = "";
      let ctaTag = "IMG";
      let ctaW = 0;
      let ctaH = 0;
      let ctaNatW = 0;
      let ctaNatH = 0;
      if (kind === "native" && useWhy !== "polling") {
        const media = captureCtaMedia();
        ctaSrc = media.src || prev.ctaSrc || "";
        ctaSrcdoc = media.srcdoc || prev.ctaSrcdoc || "";
        ctaTag = media.tag || prev.ctaTag || "IMG";
        ctaW = media.w || prev.ctaW || 0;
        ctaH = media.h || prev.ctaH || 0;
        ctaNatW = media.natW || prev.ctaNatW || 0;
        ctaNatH = media.natH || prev.ctaNatH || 0;
      }
      sessionStorage.setItem(
        lastKindStorageKey(),
        JSON.stringify({
          kind,
          why: useWhy,
          t: Date.now(),
          ctaSrc,
          ctaSrcdoc,
          ctaTag,
          ctaW,
          ctaH,
          ctaNatW,
          ctaNatH,
        })
      );
    } catch {
      /* ignore */
    }
  }

  function mosaicSrcSignature() {
    try {
      const srcs = [];
      document
        .querySelectorAll(
          ".v2-asset-tile img, .v2-mosaic-face img, .v2-mosaic-swap-tile img, .mosaic-asset img, img.mosaic-image, .mosaic-tile-slot img"
        )
        .forEach((img) => {
          const src = String(img.currentSrc || img.src || "").trim();
          if (src && !src.startsWith("data:")) srcs.push(src);
        });
      srcs.sort();
      return srcs;
    } catch {
      return [];
    }
  }

  // Leftover .mosaic-layout hydrates on refresh before CTA / message remounts.
  // Keep the cached CTA up for that leftover wall, but release as soon as the
  // mosaic beat actually changes (layer cleared, or tile srcs swapped).
  function leftoverMosaicShouldYield() {
    if (committedKindThisPage) return false;
    const persisted = readPersistedKind();
    if (persisted.kind !== "native" && persisted.kind !== "message" && persisted.kind !== "leaderboard") {
      return false;
    }
    const mosaicN = typeof rules.mosaicContentCount === "function" ? rules.mosaicContentCount() : 0;
    const mosaicLayer =
      typeof rules.findMosaicLayer === "function"
        ? rules.findMosaicLayer()
        : document.querySelector(".mosaic-layout") ||
          document.querySelector(".v2-mosaic-swap-tile");
    const mosPresent = layerLooksPresent(mosaicLayer);
    const srcs = mosaicSrcSignature();
    const next = srcs.join("\n");
    if (!mosPresent || mosaicN === 0) {
      if (leftoverMosSrcs) leftoverMosSawGap = true;
      leftoverMosSrcs = "";
      return false;
    }
    if (leftoverMosSawGap) return false;
    if (!leftoverMosSrcs) {
      leftoverMosSrcs = next;
    } else {
      const prevSet = new Set(leftoverMosSrcs.split("\n").filter(Boolean));
      const nextSet = new Set(srcs);
      let removed = false;
      prevSet.forEach((src) => {
        if (!nextSet.has(src)) removed = true;
      });
      if (removed) {
        leftoverMosSawGap = true;
        return false;
      }
      leftoverMosSrcs = next;
    }
    return true;
  }

  // Last committed beat was CTA / stream / polling. Refresh should leave Vixi
  // alone (same as result-bar polling), not keep black covers forever.
  function persistedNativeRefresh() {
    if (committedKindThisPage) return false;
    const persisted = readPersistedKind();
    return persistWhyAllowed("native", persisted.why) && persisted.kind === "native";
  }

  function paintWaitChrome(s, html, live) {
    const persisted = readPersistedKind();
    const msgThemeOn = Boolean(s && s.enabled !== false && s.messageTheme && s.messageTheme !== "off");
    const waitingMsg =
      msgThemeOn &&
      !visibleCtaOrStream() &&
      !persistedNativeRefresh() &&
      (live === "message" || (!committedKindThisPage && persisted.kind === "message"));
    if (waitingMsg) {
      const chrome = rules.chromeForKind ? rules.chromeForKind(s, "message") : { showBackground: false };
      const wantBg = Boolean(chrome && chrome.showBackground);
      html.classList.add("dyn-cover-message", "dyn-cover-mosaic", "dyn-theme-on", "dyn-kind-message");
      html.classList.remove("dyn-kind-native", "dyn-kind-mosaic", "dyn-chrome-qr", "dyn-chrome-logo");
      html.classList.toggle("dyn-show-bg", wantBg);
      const wantCustom = Boolean(wantBg && rules.usesCustomBackground && rules.usesCustomBackground(s));
      const bgApi = root.BGCustomBackground;
      if (wantCustom && bgApi && typeof bgApi.syncMount === "function") {
        bgApi.syncMount(s, {
          kind: "message",
          liveOn: false,
          nativeBeat: false,
          showBackground: true,
        });
        html.classList.add("dyn-custom-bg");
        if (rules.hideBackgroundLayers) rules.hideBackgroundLayers();
      } else {
        html.classList.remove("dyn-custom-bg");
        if (wantBg && rules.restoreBackgroundLayers) rules.restoreBackgroundLayers();
      }
      return wantBg ? "messageWaitBg" : "messageWaitBlack";
    }
    if (paintCachedCta()) return "ctaWaitCached";
    return "bootKeep";
  }

  function isStandingDown() {
    return stoodDown;
  }

  function ensureCoverStyle() {
    let style = document.getElementById(COVER_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = COVER_STYLE_ID;
      document.documentElement.appendChild(style);
    }
    if (style.textContent !== COVER_CSS) style.textContent = COVER_CSS;
  }

  const STAND_DOWN_CLASSES = [
    "dyn-cover-message",
    "dyn-cover-mosaic",
    "dyn-cover-leaderboard",
    "dyn-theme-on",
    "dyn-show-bg",
    "dyn-chrome-qr",
    "dyn-chrome-logo",
    "dyn-ext-boot",
    "dyn-custom-bg",
    "dyn-hold",
    "dyn-handoff",
    "dyn-handoff-to-message",
    "dyn-handoff-to-mosaic",
    "dyn-message-on",
    "dyn-mosaic-on",
    "dyn-leaderboard-on",
    "dyn-lb-pending",
    "dyn-kind-message",
    "dyn-kind-mosaic",
    "dyn-kind-leaderboard",
    "dyn-kind-native",
  ];

  function removeLeftoverThemeDom() {
    ["dyn-message-theme", "dyn-mosaic-theme", "dyn-leaderboard-theme"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    ["dyn-message-theme-style", "dyn-mosaic-theme-style", "dyn-leaderboard-theme-style"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    const host = document.getElementById(HOST_ID);
    if (host) host.remove();
    htmlClassCleanup();
  }

  function htmlClassCleanup() {
    document.documentElement.classList.remove(
      "dyn-message-on",
      "dyn-mosaic-on",
      "dyn-leaderboard-on",
      "dyn-cover-leaderboard",
      "dyn-lb-pending"
    );
  }

  function invokeActorStandDown(kind) {
    const actor = actors[kind];
    if (!actor) return;
    if (typeof actor.standDown === "function") {
      try {
        actor.standDown();
      } catch {
        /* ignore */
      }
      return;
    }
    if (typeof actor.teardown === "function") {
      try {
        actor.teardown();
      } catch {
        /* ignore */
      }
    }
  }

  function themeDomLeaked() {
    const html = document.documentElement;
    return (
      html.classList.contains("dyn-theme-on") ||
      html.classList.contains("dyn-mosaic-on") ||
      html.classList.contains("dyn-message-on") ||
      Boolean(document.getElementById(HOST_ID)) ||
      Boolean(document.getElementById("dyn-mosaic-theme")) ||
      Boolean(document.getElementById("dyn-message-theme")) ||
      Boolean(document.getElementById("dyn-leaderboard-theme")) ||
      document.documentElement.classList.contains("dyn-leaderboard-on")
    );
  }

  /** Same cleanup as the extension master Off switch — leave Vixi completely alone. */
  function standDownVixi(html) {
    removeCachedCta();
    html.classList.remove(...STAND_DOWN_CLASSES);
    invokeActorStandDown("message");
    invokeActorStandDown("mosaic");
    invokeActorStandDown("leaderboard");
    removeLeftoverThemeDom();
    clearMode("message");
    clearMode("mosaic");
    clearMode("leaderboard");
    if (rules.clearLeaderboardNativeMarks) rules.clearLeaderboardNativeMarks();
    if (rules.resetOutputCanvas) rules.resetOutputCanvas();
    if (rules.restoreBackgroundLayers) rules.restoreBackgroundLayers();
    if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
    if (rules.clearPassthroughState) rules.clearPassthroughState();
    if (rules.removeLeakedBrandChrome) rules.removeLeakedBrandChrome();
    const bgApi = root.BGCustomBackground;
    if (bgApi && typeof bgApi.clearPassthrough === "function") bgApi.clearPassthrough();
  }

  /** Message or mosaic beat we should theme; empty = passthrough (CTA, stream, polling, unknown). */
  function recognizedThemedBeat(s, ctx) {
    const html = ctx.html;
    const msgThemeOn = ctx.msgThemeOn;
    const mosThemeOn = ctx.mosThemeOn;
    const live = ctx.live;
    const hasMsg = ctx.hasMsg;
    const mosaicN = ctx.mosaicN;
    const hardNative = ctx.hardNative;
    const handingOff = ctx.handingOff;

    const lbThemeOn = Boolean(
      ctx.lbThemeOn != null
        ? ctx.lbThemeOn
        : ctx.enabled !== false &&
            rules.normalizeLeaderboardTheme &&
            rules.normalizeLeaderboardTheme(ctx.leaderboardTheme || (ctx.s && ctx.s.leaderboardTheme)) !== "off"
    );
    if (
      typeof rules.pageLooksLikeResultBarPolling === "function" &&
      rules.pageLooksLikeResultBarPolling()
    ) {
      return "";
    }
    if (
      typeof rules.pageLooksLikeLeaderboardOverlay === "function" &&
      rules.pageLooksLikeLeaderboardOverlay()
    ) {
      return lbThemeOn ? "leaderboard" : "";
    }

    if (html.classList.contains("dyn-hold")) {
      if (mode === "message" && msgThemeOn && (live === "message" || hasMsg)) return "message";
      if (
        mode === "mosaic" &&
        mosThemeOn &&
        (live === "mosaic" ||
          mosaicN > 0 ||
          (typeof rules.pageLooksLikeEmptyMosaicShell === "function" &&
            rules.pageLooksLikeEmptyMosaicShell()))
      ) {
        return "mosaic";
      }
      if (mode === "leaderboard" && lbThemeOn) return "leaderboard";
    }
    if (handingOff) {
      if (html.classList.contains("dyn-handoff-to-message") && msgThemeOn) return "message";
      if (html.classList.contains("dyn-handoff-to-mosaic") && mosThemeOn) return "mosaic";
    }
    if (live === "message" && msgThemeOn) return "message";
    if (live === "mosaic" && mosThemeOn) return "mosaic";
    // CTA / stream / polling must not inherit the previous mosaic/message mode
    // (that painted show-background / QR / logo onto the native item).
    if (live === "native") return "";
    if (leftoverMosaicShouldYield()) {
      if (
        hasMsg &&
        msgThemeOn &&
        (typeof rules.findMessageLayer === "function"
          ? rules.findMessageLayer()
          : document.querySelector(".capture-content-layer, .message-layer, .v2-message"))
      ) {
        return "message";
      }
      return "";
    }
    if (hardNative && !html.classList.contains("dyn-hold") && !hasMsg && mosaicN === 0) return "";
    if (
      typeof rules.pageLooksLikeMessageBeat === "function" &&
      rules.pageLooksLikeMessageBeat() &&
      msgThemeOn
    ) {
      return "message";
    }
    if (
      typeof rules.pageLooksLikeMosaicBeat === "function" &&
      rules.pageLooksLikeMosaicBeat() &&
      mosThemeOn
    ) {
      return "mosaic";
    }
    if (
      hasMsg &&
      msgThemeOn &&
      (typeof rules.findMessageLayer === "function"
        ? rules.findMessageLayer()
        : document.querySelector(".capture-content-layer, .message-layer, .v2-message"))
    ) {
      return "message";
    }
    if (mosaicN > 0 && mosThemeOn) return "mosaic";
    if (
      typeof rules.pageLooksLikePassthrough === "function" &&
      rules.pageLooksLikePassthrough()
    ) {
      return "";
    }
    return "";
  }

  function isPassthrough(settings) {
    const s = settings || lastSettings;
    if (!s || s.enabled === false) return true;
    const html = document.documentElement;
    const enabled = s.enabled !== false;
    const msgThemeOn = Boolean(enabled && s.messageTheme && s.messageTheme !== "off");
    const mosThemeOn = Boolean(enabled && s.mosaicTheme && s.mosaicTheme !== "off");
    const live = typeof liveKind === "function" ? liveKind() : "";
    const cap = typeof rules.messageCapture === "function" ? rules.messageCapture() : {};
    const hasMsg = Boolean(cap && (cap.src || cap.message || cap.name));
    const mosaicN = typeof rules.mosaicContentCount === "function" ? rules.mosaicContentCount() : 0;
    const hardNative =
      typeof rules.pageLooksLikeHardNative === "function" && rules.pageLooksLikeHardNative();
    const handingOff =
      html.classList.contains("dyn-handoff") || html.classList.contains("dyn-hold");
    const lbThemeOn = Boolean(enabled && rules.normalizeLeaderboardTheme && rules.normalizeLeaderboardTheme(s.leaderboardTheme) !== "off");
    return !recognizedThemedBeat(s, {
      html,
      msgThemeOn,
      mosThemeOn,
      lbThemeOn,
      s,
      enabled,
      leaderboardTheme: s.leaderboardTheme,
      live,
      hasMsg,
      mosaicN,
      hardNative,
      handingOff,
    });
  }

  function applyCovers(settings) {
    if (settings) lastSettings = settings;
    const s = settings || lastSettings;
    if (!s) return;
    if (rules.touchVixiAspectCache) rules.touchVixiAspectCache();
    ensureCoverStyle();
    const html = document.documentElement;
    const enabled = s.enabled !== false;
    const msgThemeOn = Boolean(enabled && s.messageTheme && s.messageTheme !== "off");
    const mosThemeOn = Boolean(enabled && s.mosaicTheme && s.mosaicTheme !== "off");
    const lbThemeOn = Boolean(enabled && rules.normalizeLeaderboardTheme && rules.normalizeLeaderboardTheme(s.leaderboardTheme) !== "off");
    const eitherTheme = msgThemeOn || mosThemeOn || lbThemeOn;
    const live = typeof liveKind === "function" ? liveKind() : "";
    const kind = rules.activeThemeKind ? rules.activeThemeKind(s) : "";
    const nativeBeat = live === "native" && !html.classList.contains("dyn-hold");
    if (nativeBeat) html.classList.remove("dyn-hold");
    const cap = typeof rules.messageCapture === "function" ? rules.messageCapture() : {};
    const hasMsg = Boolean(cap && (cap.src || cap.message || cap.name));
    const mosaicN = typeof rules.mosaicContentCount === "function" ? rules.mosaicContentCount() : 0;
    const hardNative =
      typeof rules.pageLooksLikeHardNative === "function" && rules.pageLooksLikeHardNative();
    const handingOff =
      html.classList.contains("dyn-handoff") || html.classList.contains("dyn-hold");
    const themedBeat = recognizedThemedBeat(s, {
      html,
      msgThemeOn,
      mosThemeOn,
      lbThemeOn,
      s,
      enabled,
      leaderboardTheme: s.leaderboardTheme,
      live,
      hasMsg,
      mosaicN,
      hardNative,
      handingOff,
    });
    const liveOn = Boolean(
      themedBeat &&
        (themedBeat === "message"
          ? msgThemeOn
          : themedBeat === "mosaic"
            ? mosThemeOn
            : themedBeat === "leaderboard"
              ? lbThemeOn
              : false)
    );
    const themeArmed = Boolean(themedBeat);
    const resultBarPolling =
      typeof rules.pageLooksLikeResultBarPolling === "function" &&
      rules.pageLooksLikeResultBarPolling();
    const hardCtaOrStream = visibleCtaOrStream();
    const themeOffPassthrough =
      (live === "mosaic" && !mosThemeOn) ||
      (live === "message" && !msgThemeOn) ||
      (live === "leaderboard" && !lbThemeOn);
    const nativePassthrough =
      (live === "native" &&
        !(typeof rules.v2MessageHoldActive === "function" && rules.v2MessageHoldActive())) ||
      hardCtaOrStream ||
      resultBarPolling;
    // Only a live CTA/stream/polling/LEADERS-off beat stands the theme down.
    // persist-native refresh must not stand down on an empty page — that
    // revealed leftover Vixi mosaic and hid the CTA until the playlist cycled.
    const passthroughOverlay = nativePassthrough || themeOffPassthrough;
    // Off, polling, CTA, stream, LEADERS (theme off), etc.: leave Vixi alone.
    if (passthroughOverlay || !enabled) {
      const needsStandDown = !stoodDown || (passthroughOverlay && themeDomLeaked());
      if (needsStandDown) {
        standDownVixi(html);
        if (rules.resetOutputCanvas) rules.resetOutputCanvas();
      }
      stoodDown = true;
      lastCoverDecision = "";
      if (
        enabled &&
        typeof rules.pageLooksLikePhotoMagic === "function" &&
        rules.pageLooksLikePhotoMagic()
      ) {
        html.classList.add("dyn-kind-native");
      }
      return;
    }
    if (!themedBeat) {
      // Boot / unknown: keep black (or the message theme background) until
      // liveKind is mosaic/message. Stand down only when CTA/polling is live.
      const waitPaint = paintWaitChrome(s, html, live);
      stoodDown = false;
      // Message-kind + cover hides img.fullscreen-asset. Clear that while we
      // are not actually on a message wait, so a live CTA image can show.
      if (waitPaint !== "messageWaitBg" && waitPaint !== "messageWaitBlack") {
        html.classList.remove("dyn-kind-message", "dyn-kind-mosaic", "dyn-message-on", "dyn-mosaic-on");
      }
      return;
    }
    stoodDown = false;
    removeCachedCta();
    const shownKind = themedBeat;
    const chrome = rules.chromeForKind
      ? rules.chromeForKind(s, themedBeat)
      : { showBackground: false };
    const wantCustomBg = Boolean(rules.usesCustomBackground && rules.usesCustomBackground(s));
    const showBg = Boolean(
      themedBeat === "leaderboard" || (themeArmed && Boolean(chrome.showBackground))
    );
    const stageBgOn = Boolean(themeArmed && showBg);
    const decisionKey = [
      themedBeat,
      live,
      liveOn,
      handingOff,
      stageBgOn,
      wantCustomBg,
      Boolean(chrome.showQr),
      Boolean(chrome.showLogo),
    ].join("|");
    if (decisionKey === lastCoverDecision) {
      return;
    }
    lastCoverDecision = decisionKey;
    // Only hide the stock layer we are replacing. Covering mosaic while its
    // theme is off (and then uncovering it in applyCovers) is what flashed
    // Vixi's tiles every second with message-on / mosaic-off.
    html.classList.toggle(
      "dyn-cover-mosaic",
      (mosThemeOn &&
        (themedBeat === "mosaic" || themedBeat === "message" || handingOff)) ||
        themedBeat === "leaderboard"
    );
    html.classList.toggle(
      "dyn-cover-message",
      (msgThemeOn &&
        (themedBeat === "message" || themedBeat === "mosaic" || handingOff)) ||
        themedBeat === "leaderboard"
    );
    html.classList.toggle("dyn-cover-leaderboard", themedBeat === "leaderboard");
    html.classList.toggle("dyn-leaderboard-on", themedBeat === "leaderboard");
    html.classList.toggle("dyn-theme-on", themeArmed);
    html.classList.toggle("dyn-show-bg", stageBgOn);
    html.classList.toggle("dyn-chrome-qr", themeArmed && Boolean(chrome.showQr));
    html.classList.toggle("dyn-chrome-logo", themeArmed && Boolean(chrome.showLogo));
    if (themeArmed) html.classList.remove("dyn-ext-boot");
    // Reparent #dyn-bg-media onto the incoming theme/host AFTER dyn-show-bg is
    // set (so visibility/backdrop sync agree) but BEFORE kind classes hide the
    // outgoing theme (avoids flashing Vixi's original bg).
    const bgApi = root.BGCustomBackground;
    if (wantCustomBg && shownKind !== "leaderboard" && bgApi && typeof bgApi.syncMount === "function") {
      bgApi.syncMount(s, {
        kind:
          shownKind === "message" || shownKind === "mosaic" || shownKind === "leaderboard"
            ? shownKind
            : kind,
        liveOn,
        nativeBeat,
        showBackground: stageBgOn,
      });
    }
    html.classList.toggle("dyn-kind-message", shownKind === "message");
    html.classList.toggle("dyn-kind-mosaic", shownKind === "mosaic");
    html.classList.toggle("dyn-kind-leaderboard", shownKind === "leaderboard");
    html.classList.remove("dyn-kind-native");
    if (!msgThemeOn) html.classList.remove("dyn-message-on");
    if (!mosThemeOn) html.classList.remove("dyn-mosaic-on");
    if (!lbThemeOn) html.classList.remove("dyn-leaderboard-on");
    if (!liveOn) html.classList.remove("dyn-hold");
    if (rules.tagChromeKinds) rules.tagChromeKinds();
    if (eitherTheme && rules.applyOutputCanvas) rules.applyOutputCanvas(s.stageAspect);
    else if (rules.resetOutputCanvas) rules.resetOutputCanvas();
    if (stageBgOn) {
      if (wantCustomBg) {
        if (rules.hideBackgroundLayers) rules.hideBackgroundLayers();
        if (rules.silenceReplacedMedia) rules.silenceReplacedMedia();
        html.classList.add("dyn-custom-bg");
      } else {
        if (rules.restoreBackgroundLayers) rules.restoreBackgroundLayers();
        if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
        html.classList.remove("dyn-custom-bg");
      }
    } else {
      html.classList.remove("dyn-custom-bg");
      if (themedBeat === "mosaic" && !stageBgOn) {
        if (rules.hideBackgroundLayers) rules.hideBackgroundLayers();
        if (rules.silenceReplacedMedia) rules.silenceReplacedMedia();
      } else {
        if (rules.restoreBackgroundLayers) rules.restoreBackgroundLayers();
        if (rules.resumeBackgroundMedia) rules.resumeBackgroundMedia();
      }
    }
    if (bgApi && typeof bgApi.scheduleApply === "function" && shownKind !== "leaderboard") {
      bgApi.scheduleApply(0);
    }
    if (rules.syncThemeBackdrops) {
      const msgRoot = document.getElementById("dyn-message-theme");
      const mosRoot = document.getElementById("dyn-mosaic-theme");
      if (msgRoot) rules.syncThemeBackdrops(msgRoot);
      if (mosRoot) rules.syncThemeBackdrops(mosRoot);
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

  function ctaNodeLooksLive(el) {
    if (!el || el.id === CTA_WAIT_ID) return false;
    try {
      if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;
      const st = getComputedStyle(el);
      // Covers set visibility:hidden on a live CTA — size + display is enough.
      if (st.display === "none") return false;
      const r = el.getBoundingClientRect();
      return r.width > 40 && r.height > 40;
    } catch {
      return false;
    }
  }

  // Direct CTA / stream only. Nested leftover <img alt="CTA Image"> nodes
  // stay in the DOM and must not stand the theme down.
  function visibleCtaOrStream() {
    if (typeof rules.pageLooksLikeStreamBeat === "function" && rules.pageLooksLikeStreamBeat()) {
      return true;
    }
    if (typeof rules.pageLooksLikeHardNative === "function" && rules.pageLooksLikeHardNative()) {
      return true;
    }
    const el = rules.findDirectNativeAsset && rules.findDirectNativeAsset();
    return Boolean(el && ctaNodeLooksLive(el));
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
    lastLiveWhy = "";
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
    const overlayMos = Boolean(rules.themeOverlayLive && rules.themeOverlayLive("mosaic"));
    const overlayMsg = Boolean(rules.themeOverlayLive && rules.themeOverlayLive("message"));
    const msgLayer =
      typeof rules.findMessageLayer === "function"
        ? rules.findMessageLayer()
        : document.querySelector(".capture-content-layer") ||
          document.querySelector(".message-layer") ||
          document.querySelector(".v2-message");
    const mosaicLayer =
      typeof rules.findMosaicLayer === "function"
        ? rules.findMosaicLayer()
        : document.querySelector(".mosaic-layout") ||
          document.querySelector(".v2-mosaic-swap-tile");
    const msgDisp = layerLooksPresent(msgLayer);
    const mosDisp = layerLooksPresent(mosaicLayer);
    const capKey = captureKeyOf(cap);
    const mosaicOnly = mosDisp && !msgDisp;
    const messageOnly = msgDisp && !mosDisp && hasMsg;
    // Leftover mosaic tiles/chrome must not count as a mosaic beat when a
    // message capture is on the page (refresh-on-message used to first-paint mosaic).
    // An empty mosaic shell is a mosaic beat only when that is the live item
    // (theme on can then hide Vixi's background). CTA / polling still win above.
    const emptyMosaic =
      mosaicN === 0 &&
      typeof rules.pageLooksLikeEmptyMosaicShell === "function" &&
      rules.pageLooksLikeEmptyMosaicShell();
    const mosaicPage =
      overlayMos ||
      (mosaicOnly && mosaicN > 0) ||
      (!hasMsg && mosaicN > 0) ||
      (mosaicOnly && emptyMosaic && !hasMsg);
    const mosaicAppeared = mosaicNSeen && mosaicN > 0 && prevMosaicN === 0;
    const mosBecameOn = mosDispSeen && mosDisp && !prevMosDisp;
    prevMosaicN = mosaicN;
    mosaicNSeen = true;
    prevMosDisp = mosDisp;
    mosDispSeen = true;
    if ((mosaicOnly || overlayMos) && hasMsg && capKey) {
      leftoverMsgKey = leftoverMsgKey || capKey;
    }
    const freshMsg = Boolean(hasMsg && capKey && leftoverMsgKey && capKey !== leftoverMsgKey);
    const msgPresent = overlayMsg || (hasMsg && msgDisp);
    const mosaicPresent = overlayMos || (mosaicPage && mosDisp);
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
    const hardCtaOrStream = visibleCtaOrStream();
    // Real CTA / stream (direct child, sized). Nested leftover CTA imgs
    // must not stand down a live theme.
    if (hardCtaOrStream || (hardNative && !overlayMsg && !overlayMos)) {
      clearNativeHold();
      lastLiveWhy = hardCtaOrStream ? "hardCtaOrStream" : "hardNative";
      return "native";
    }
    // Result-bar polling vs LEADERS overlay are different beats. Treating
    // leftover LEADERS chrome as polling left the leaderboard theme covering
    // the bars, and empty-page passthrough stood down before a CTA existed.
    const resultBars =
      typeof rules.pageLooksLikeResultBarPolling === "function" &&
      rules.pageLooksLikeResultBarPolling();
    if (resultBars && !hasMsg) {
      clearNativeHold();
      lastLiveWhy = "polling";
      return "native";
    }
    if (
      typeof rules.pageLooksLikeLeaderboardOverlay === "function" &&
      rules.pageLooksLikeLeaderboardOverlay()
    ) {
      clearNativeHold();
      lastLiveWhy = "leaderboard";
      return "leaderboard";
    }
    // Overlay .on is leftover from the first beat. A CTA parks both overlays,
    // which is why that was the only switch. Vixi's own shells / a new capture
    // must be able to win without that reset.
    // Photo Magic: do not theme, and do not cover QR / logo / background.
    if (
      typeof rules.pageLooksLikePhotoMagic === "function" &&
      rules.pageLooksLikePhotoMagic() &&
      !(typeof rules.v2MessageHoldActive === "function" && rules.v2MessageHoldActive())
    ) {
      leftoverMsgKey = "";
      clearNativeHold();
      lastLiveWhy = "photoMagic";
      return "native";
    }
    if (messageOnly) {
      leftoverMsgKey = "";
      lastLiveWhy = "messageOnly";
      return "message";
    }
    // Refresh on CTA / message hydrates leftover mosaic tiles before the real
    // beat remounts. Hold that leftover wall, but let a new mosaic beat through
    // (tiles appeared after a gap, or the layer turned on).
    if (leftoverMosaicShouldYield() && mosaicN > 0) {
      if (mosaicAppeared || mosBecameOn) {
        lastLiveWhy = mosaicAppeared ? "mosaicAppeared" : "mosBecameOn";
        return "mosaic";
      }
      lastLiveWhy = "skipLeftoverMos";
      return "";
    }
    // Empty leftover .mosaic-layout over CTA / polling is not a mosaic beat.
    // A live empty mosaic (theme on) still is — hide-background should not
    // leak Vixi's event art.
    if (mosaicOnly && (mosaicN > 0 || emptyMosaic)) {
      lastLiveWhy = mosaicN > 0 ? "mosaicOnly" : "emptyMosaic";
      return "mosaic";
    }
    if (freshMsg) {
      leftoverMsgKey = "";
      lastLiveWhy = overlayMos ? "freshMsgOverMos" : "freshMsg";
      return "message";
    }
    if ((mosaicAppeared || (mosBecameOn && mosaicN > 0)) && !freshMsg) {
      if (hasMsg && capKey) leftoverMsgKey = leftoverMsgKey || capKey;
      lastLiveWhy = mosaicAppeared ? "mosaicAppeared" : "mosBecameOn";
      return "mosaic";
    }
    if (overlayMsg && overlayMos) {
      lastLiveWhy =
        leftoverMsgKey && capKey === leftoverMsgKey
          ? "bothLeftoverMos"
          : hasMsg
            ? "bothHasMsg"
            : "bothNoMsg";
      if (leftoverMsgKey && capKey === leftoverMsgKey) return "mosaic";
      return hasMsg ? "message" : "mosaic";
    }
    if (overlayMsg && !overlayMos) {
      lastLiveWhy = "overlayMsg";
      return "message";
    }
    if (overlayMos) {
      lastLiveWhy = leftoverMsgKey ? "overlayMosLeftover" : "overlayMos";
      return "mosaic";
    }
    if (
      typeof rules.pageLooksLikeLeaderboardOverlay === "function" &&
      rules.pageLooksLikeLeaderboardOverlay()
    ) {
      clearNativeHold();
      return "leaderboard";
    }
    if (typeof rules.pageLooksLikePolling === "function" && rules.pageLooksLikePolling()) {
      if (!hasMsg && mosaicN === 0 && !msgPresent && !mosaicPresent) {
        clearNativeHold();
        lastLiveWhy = "polling";
        return "native";
      }
    }
    // Empty output / leftover wrapper is not a CTA. Treating it as
    // passthrough stood covers down, then leftover mosaic remounted.
    // Leftover capture + a different fullscreen sibling is either the next
    // guest photo or a CTA. Hold the theme through a short swap, then yield.
    if (siblingOther && messageOwned && !mosaicVisible) {
      if (armNativeHold()) {
        lastLiveWhy = "siblingHold";
        return "native";
      }
      return "message";
    }
    // An actually-visible stock layer wins over a leftover covered sibling.
    if (msgVisible && !mosaicVisible) {
      clearNativeHold();
      lastLiveWhy = "msgVisible";
      return "message";
    }
    if (mosaicVisible && !msgVisible && !hasMsg && !nativePage) {
      clearNativeHold();
      lastLiveWhy = "mosaicVisible";
      return "mosaic";
    }
    if (msgPresent && !mosaicVisible) {
      clearNativeHold();
      lastLiveWhy = "msgPresent";
      return "message";
    }
    // Live CTA / stream / video still wins over a leftover mosaic shell.
    // A message-to-message swap can look native for a beat (Vixi puts the next
    // photo on .fullscreen-asset). Keep the theme up unless it is a real CTA.
    if (nativePage && !msgPresent) {
      // Leftover .asset-view is not a CTA. The messageOwned hold here
      // stood covers down (emptyAppHold / nativePageHold) and flashed Vixi.
      if (!hardCtaOrStream && !hardNative) {
        lastLiveWhy = "nativePageWait";
        return "";
      }
      clearNativeHold();
      lastLiveWhy = "nativePage";
      return "native";
    }
    if (msgPresent && mosaicPresent) {
      clearNativeHold();
      if (freshMsg) {
        leftoverMsgKey = "";
        lastLiveWhy = "bothFreshMsg";
        return "message";
      }
      if (leftoverMsgKey && capKey === leftoverMsgKey) {
        lastLiveWhy = "bothLeftoverMsg";
        return "mosaic";
      }
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
      const nativeChild = [...app.children].some((c) => {
        if (!c || c.id === "dyn-theme-host") return false;
        const cls = String(c.className || c.id || "");
        if (/mosaic-layout|capture-content-layer|message-layer|v2-message|v2-mosaic/.test(cls)) {
          return false;
        }
        return true;
      });
      if (nativeChild) {
        if (!hardNative && !visibleCtaOrStream()) {
          lastLiveWhy = "emptyAppUnsized";
          return "";
        }
        clearNativeHold();
        lastLiveWhy = "emptyApp";
        return "native";
      }
    }
    if (nativePage) {
      if (!hardCtaOrStream && !hardNative) {
        lastLiveWhy = "nativePageTailWait";
        return "";
      }
      clearNativeHold();
      lastLiveWhy = "nativePageTail";
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
    const id = kind === "message" ? "dyn-message-theme" : "dyn-mosaic-theme";
    const el = document.getElementById(id);
    // Overlay already painting. dyn-hold hides .output-app; if a rebuild then
    // disposes the overlay, the off background (black) is all that remains.
    if (
      el &&
      el.classList.contains("on") &&
      !el.classList.contains("is-parked") &&
      !el.classList.contains("dyn-awaiting-show")
    ) {
      return;
    }
    html.classList.add("dyn-hold", "dyn-cover-message", "dyn-cover-mosaic", "dyn-theme-on");
    html.classList.remove("dyn-kind-native");
    html.classList.toggle("dyn-kind-message", kind === "message");
    html.classList.toggle("dyn-kind-mosaic", kind === "mosaic");
    const waitChrome = lastSettings && rules.chromeForKind ? rules.chromeForKind(lastSettings, kind) : null;
    const wantBg = Boolean(waitChrome && waitChrome.showBackground);
    const wantCustom = Boolean(
      wantBg && lastSettings && rules.usesCustomBackground && rules.usesCustomBackground(lastSettings)
    );
    html.classList.toggle("dyn-show-bg", wantBg);
    if (wantCustom) {
      const bgApi = root.BGCustomBackground;
      if (bgApi && typeof bgApi.syncMount === "function") {
        bgApi.syncMount(lastSettings, {
          kind,
          liveOn: false,
          nativeBeat: false,
          showBackground: true,
        });
      }
      html.classList.add("dyn-custom-bg");
      if (rules.hideBackgroundLayers) rules.hideBackgroundLayers();
    }
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

  function themeTransitionActive() {
    const html = document.documentElement;
    return (
      html.classList.contains("dyn-handoff") ||
      html.classList.contains("dyn-hold") ||
      html.classList.contains("dyn-theme-on") ||
      html.classList.contains("dyn-message-on") ||
      html.classList.contains("dyn-mosaic-on") ||
      html.classList.contains("dyn-leaderboard-on") ||
      mode === "message" ||
      mode === "mosaic" ||
      mode === "leaderboard"
    );
  }

  function passthroughIsQuiet() {
    if (typeof rules.pageLooksLikePolling === "function" && rules.pageLooksLikePolling()) {
      return false;
    }
    if (themeTransitionActive()) return false;
    // Empty / unknown is not a stable CTA beat — keep watching for
    // fullscreen-asset. Only a live CTA/stream can quiet the observer.
    return stoodDown && visibleCtaOrStream();
  }

  function syncLiveKind() {
    if (passthroughIsQuiet()) return;
    const live = liveKind();
    if (live === seenKind) return;
    const prev = seenKind;
    seenKind = live;
    persistLiveKind(live, lastLiveWhy);
    if (
      (live === "mosaic" || live === "message") &&
      (prev === "native" || prev === "" || prev !== live)
    ) {
      holdFor(live);
    }
    if (lastSettings) applyCovers(lastSettings);
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
    persistLiveKind(seenKind, lastLiveWhy);
    const mo = new MutationObserver(() => {
      if (passthroughIsQuiet()) return;
      syncLiveKind();
    });
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset", "class", "hidden", "aria-hidden", "style"],
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

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    if (passthroughIsQuiet()) return;
    syncLiveKind();
    if (lastSettings) applyCovers(lastSettings);
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    syncLiveKind();
    if (lastSettings) applyCovers(lastSettings);
  });

  root.BGThemeHandoff = {
    HOST_ID,
    ensureCoverStyle,
    applyCovers,
    liveKind,
    isPassthrough,
    isStandingDown,
    passthroughIsQuiet,
    themeTransitionActive,
    register,
    activate,
    currentMode,
    clearMode,
    onLiveKind,
    endHold,
    leftoverMosaicShouldYield,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
