(function () {
/**
 * Dynamic Themes theme engine
 * id: message-geico-marathon-signs-engine
 * kind: message
 * Pairs with: themes/message-geico-marathon-signs.json
 *
 * NYC Marathon sign set. The capture message is the racer name and the
 * capture name is the from line. Each new message advances to the next
 * sign: the line is set in GEICO Roobert Heavy, and the matching
 * illustration is an SVG from the art file. The racer message sits above
 * that line and the from name sits below it, both in Caveat. The guest
 * photo sits on the right. A static footer holds an uploaded QR code.
 */
var SIGNS = [
  { line: "Queensboro bridge\nahead. Buckle up.", file: "geico-signs-bridge.svg" },
  { line: "Tap here to activate\n\u201cBridge Mode\u201d.", file: "geico-signs-shoe.svg" },
  { line: "Tap here for a\nturbo boost.", file: "geico-signs-boost.svg" },
  { line: "Congrats, you just\nran a half marathon!\nNow do it again.", file: "geico-signs-finish.svg" },
  { line: "You\u2019re running better\nthan the subway.", file: "geico-signs-subway.svg" },
  { line: "Keep chaffing\nyour dreams.", file: "geico-signs-flame.svg" },
  { line: "Way to go\nstrangers!", file: "geico-signs-highfive.svg" },
  { line: "Run if you think\nI\u2019m awesome.", file: "geico-signs-thumb.svg" },
  { line: "I\u2019ve been training\nfor months to\nhold this sign.", file: "geico-signs-hold.svg" },
  { line: "Run like you did\nwhen cronuts first\ncame out.", file: "geico-signs-cronut.svg" },
  { line: "Run like you\nsaw an open\nparking space.", file: "geico-signs-parking.svg" },
  { line: "Run like a pigeon\nis chasing you.", file: "geico-signs-pigeon.svg" },
];

BGThemeEngines.define({
  id: "message-geico-marathon-signs-engine",
  kind: "message",

  mount(themeRoot, settings) {
    var helpers = globalThis.BGMessageThemes || {};
    var stage = helpers.ensureFitStage ? helpers.ensureFitStage(themeRoot) : themeRoot;
    if (!stage.querySelector(".board")) stage.innerHTML = FALLBACK_HTML;
    var stopPhotos = hideGuestPhotos(themeRoot);
    var state = {
      stage: stage,
      racer: themeRoot.querySelector("[data-message]"),
      from: themeRoot.querySelector("[data-name]"),
      sign: themeRoot.querySelector("[data-sign]"),
      slot: themeRoot.querySelector(".glyph-slot"),
      glyph: themeRoot.querySelector("[data-glyph]"),
      index: 0,
      captureKey: null,
      alive: true,
      stopPhotos: stopPhotos,
    };
    ensureFont();
    paintSign(state);
    applyFooterQr(themeRoot);
    if (typeof this.applySettings === "function") this.applySettings(themeRoot, state, settings);
    return state;
  },

  applySettings(themeRoot, state, settings) {
    var helpers = globalThis.BGMessageThemes || {};
    if (helpers.applyVars) helpers.applyVars(themeRoot, settings);
  },

  async show(themeRoot, capture, state) {
    var helpers = globalThis.BGMessageThemes || {};
    var returning = themeRoot.classList.contains("on");
    if (!returning && helpers.commonShowPrep) helpers.commonShowPrep(themeRoot, state);
    var message = (capture && capture.message) || "";
    var name = (capture && capture.name) || "";
    scrubGuestPhotos(themeRoot);
    if (state && state.racer) state.racer.textContent = message;
    if (state && state.from) state.from.textContent = name;
    var key = message + "\n" + name;
    if (state && state.captureKey == null) {
      state.captureKey = key;
    } else if (state && state.captureKey !== key) {
      state.captureKey = key;
      state.index = (state.index + 1) % SIGNS.length;
    }
    if (state) await paintSign(state);
    applyFooterQr(themeRoot);
    await ensureFont();
    await nextFrame();
    if (document.fonts && document.fonts.load) {
      try {
        await Promise.race([
          Promise.all([
            document.fonts.load("700 80px Caveat"),
            document.fonts.ready,
          ]),
          wait(800),
        ]);
      } catch (err) {}
    }
    fitBoard(themeRoot);
    themeRoot.classList.toggle("no-copy", !message && !name);
    themeRoot.classList.toggle("no-name", !name);
    themeRoot.classList.toggle("no-racer", !message);
    scrubGuestPhotos(themeRoot);
    if (returning) {
      await nextFrame();
      await wait(80);
      setDissolved(themeRoot, false);
      return;
    }
    if (helpers.finishShow) await helpers.finishShow(themeRoot, []);
    else themeRoot.classList.add("on");
  },

  hide(themeRoot) {
    if (!themeRoot.classList.contains("on")) return Promise.resolve();
    setDissolved(themeRoot, true);
    return wait(760);
  },

  unmount(_themeRoot, state) {
    if (!state) return;
    state.alive = false;
    if (typeof state.stopPhotos === "function") state.stopPhotos();
  },
});

function setDissolved(themeRoot, out) {
  var swap = themeRoot.querySelector(".swap");
  if (swap) swap.classList.toggle("is-out", out);
}

function paintSign(state) {
  if (!state || !state.sign) return Promise.resolve();
  var sign = SIGNS[state.index % SIGNS.length];
  if (state.signLine !== sign.line) {
    state.signLine = sign.line;
    state.sign.innerHTML = sign.line.split("\n").map(escapeHtml).join("<br>");
  }
  if (state.slot) {
    state.slot.style.left = "";
    state.slot.style.bottom = "";
    state.slot.style.width = "";
    state.slot.style.height = "";
  }
  if (!state.glyph) return Promise.resolve();
  var src = assetUrl(sign.file);
  var ready = warmGlyph(src);
  if (state.glyph.dataset.glyphSrc === src) return ready;
  state.glyph.dataset.glyphSrc = src;
  state.glyph.style.backgroundImage = 'url("' + src + '")';
  return ready.then(function () {
    return nextFrame();
  });
}

var fontReady = null;

function ensureFont() {
  if (fontReady) return fontReady;
  var family = "GEICO Roobert Heavy";
  if (document.fonts && document.fonts.check && document.fonts.check('900 48px "' + family + '"')) {
    fontReady = Promise.resolve();
    return fontReady;
  }
  if (typeof FontFace !== "function" || !document.fonts) {
    fontReady = Promise.resolve();
    return fontReady;
  }
  var face = new FontFace(family, 'url("' + assetUrl("GEICORoobert-Heavy.otf") + '")', { weight: "900" });
  document.fonts.add(face);
  fontReady = face.load().then(function () {
    return document.fonts.ready;
  }).catch(function () {});
  return fontReady;
}

var glyphReady = Object.create(null);

function warmGlyph(src) {
  if (!src) return Promise.resolve();
  if (glyphReady[src]) return glyphReady[src];
  glyphReady[src] = new Promise(function (resolve) {
    var img = new Image();
    var settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      resolve();
    }
    img.onload = function () {
      if (typeof img.decode === "function") img.decode().then(finish, finish);
      else finish();
    };
    img.onerror = finish;
    img.src = src;
    window.setTimeout(finish, 2000);
  });
  return glyphReady[src];
}

function nextFrame() {
  return new Promise(function (resolve) {
    window.requestAnimationFrame(function () {
      resolve();
    });
  });
}

function concealPhoto(img) {
  if (!img || img.tagName !== "IMG") return;
  if (img.closest && img.closest("#preview-bg, #dyn-bg-media, #dyn-bg-embed, [data-photo], [data-footer-qr]")) return;
  img.removeAttribute("src");
  img.removeAttribute("srcset");
  img.style.setProperty("display", "none", "important");
  img.style.setProperty("opacity", "0", "important");
  img.style.setProperty("visibility", "hidden", "important");
}

function scrubGuestPhotos(themeRoot) {
  if (!themeRoot) return;
  themeRoot.querySelectorAll("img").forEach(concealPhoto);
}

function hideGuestPhotos(themeRoot) {
  if (!themeRoot) return function () {};
  scrubGuestPhotos(themeRoot);
  if (typeof MutationObserver !== "function") return function () {};
  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === "attributes") {
        concealPhoto(record.target);
        return;
      }
      record.addedNodes.forEach(function (node) {
        if (!node || node.nodeType !== 1) return;
        if (node.tagName === "IMG") concealPhoto(node);
        if (node.querySelectorAll) node.querySelectorAll("img").forEach(concealPhoto);
      });
    });
  });
  observer.observe(themeRoot, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "srcset"],
  });
  return function () {
    observer.disconnect();
  };
}

function fitBoard(themeRoot) {
  var copy = themeRoot.querySelector(".copy");
  if (!copy || copy.clientHeight < 8) return;
  fitNode(themeRoot.querySelector("[data-sign]"), copy, 9.2, 5.6, 0.52);
  fitNode(themeRoot.querySelector("[data-message]"), copy, 12, 6.4, 0.42);
  fitNode(themeRoot.querySelector("[data-name]"), copy, 8.2, 4.6, 0.3);
}

function fitNode(node, box, start, min, heightRatio) {
  if (!node || !box) return;
  var size = start;
  node.style.fontSize = size + "cqw";
  var guard = 0;
  var heightLimit = box.clientHeight * heightRatio;
  var widthLimit = box.clientWidth * 0.96;
  while (
    guard < 28 &&
    size > min &&
    (node.scrollHeight > heightLimit + 1 || node.scrollWidth > widthLimit + 1)
  ) {
    size = Math.round((size - 0.3) * 10) / 10;
    node.style.fontSize = size + "cqw";
    guard += 1;
  }
}

function assetUrl(filename) {
  try {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL("packs/assets/" + filename);
    }
  } catch (err) {}
  try {
    var path = String(location.pathname || "");
    var file = filename + (filename.indexOf("?") === -1 ? "?v=2" : "");
    if (path.indexOf("/themes/") !== -1) return new URL("assets/" + file, location.href).href;
    return new URL("/themes/assets/" + file, location.origin).href;
  } catch (err2) {
    return "themes/assets/" + filename;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wait(ms) {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, ms);
  });
}

function applyFooterQr(themeRoot) {
  if (!themeRoot) return;
  var img = themeRoot.querySelector("[data-footer-qr] img");
  if (!img) return;
  var saved = window.__SAVED_OUTPUT && window.__SAVED_OUTPUT.backgrounds && window.__SAVED_OUTPUT.backgrounds.qr;
  var url = (saved && saved.url) || window.__GEICO_SIGNS_QR || "";
  if (!url) {
    try { url = localStorage.getItem("geico-signs-sidebar-qr") || ""; } catch (err) { url = ""; }
  }
  if (!url) {
    img.removeAttribute("src");
    return;
  }
  if (img.getAttribute("src") !== url) img.src = url;
}

var FALLBACK_HTML =
  '<div class="board">' +
  '<div class="stage"><div class="swap">' +
  '<div class="glyph-slot"><div class="glyph" data-glyph></div></div>' +
  '<img class="guest" data-photo alt="">' +
  '<div class="copy"><p class="racer" data-message></p><p class="sign" data-sign></p><p class="from" data-name></p></div>' +
  "</div></div>" +
  '<footer class="foot">' +
  '<div class="qr-box" data-footer-qr><img alt=""></div>' +
  '<p class="scan">Scan here to make a sign</p>' +
  '<div class="logo" data-brand="geico"></div>' +
  "</footer>" +
  '<div class="slot-logo" data-logo></div><div class="slot-qr" data-qr></div>' +
  "</div>";
})();
