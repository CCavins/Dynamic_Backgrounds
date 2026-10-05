(function () {
/**
 * Dynamic Themes theme engine
 * id: message-geico-marathon-engine
 * kind: message
 * Pairs with: themes/message-geico-marathon.json
 *
 * Jumbotron halfway-mark board. The capture message is the racer name.
 * The capture name is the from line. Approved sign lines and corner
 * glyphs advance together, in order, only when a new message arrives.
 * The guest photo is not shown.
 */
var SIGNS = [
  { line: "You\u2019re running better\nthan the subway.", file: "geico-marathon-subway.png" },
  { line: "Run like a pigeon\nis chasing you.", file: "geico-marathon-pigeon.png" },
  { line: "Want us to call\nyou a taxi?", file: "geico-marathon-taxi.png" },
  { line: "Does this sign make\nme look supportive?", file: "geico-marathon-hands.png" },
];

BGThemeEngines.define({
  id: "message-geico-marathon-engine",
  kind: "message",

  mount(themeRoot, settings) {
    var helpers = globalThis.BGMessageThemes || {};
    var stage = helpers.ensureFitStage ? helpers.ensureFitStage(themeRoot) : themeRoot;
    if (!stage.querySelector(".board")) stage.innerHTML = FALLBACK_HTML;
    var stopPhotos = hideGuestPhotos(themeRoot);
    var logo = themeRoot.querySelector("[data-brand='geico']");
    var state = {
      stage: stage,
      logo: logo,
      racer: themeRoot.querySelector("[data-message]"),
      from: themeRoot.querySelector("[data-name]"),
      sign: themeRoot.querySelector("[data-sign]"),
      glyph: themeRoot.querySelector("[data-glyph]"),
      index: 0,
      captureKey: null,
      color: (settings && settings.primary) || "#d6f25c",
      alive: true,
      stopPhotos: stopPhotos,
    };
    paintSign(state);
    if (typeof this.applySettings === "function") this.applySettings(themeRoot, state, settings);
    return state;
  },

  applySettings(themeRoot, state, settings) {
    var helpers = globalThis.BGMessageThemes || {};
    if (helpers.applyVars) helpers.applyVars(themeRoot, settings);
    if (state) {
      state.color = (settings && settings.primary) || "#d6f25c";
      paintSign(state);
    }
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
    themeRoot.classList.toggle("no-copy", !message && !name);
    themeRoot.classList.toggle("no-name", !name);
    themeRoot.classList.toggle("no-racer", !message);
    if (document.fonts && document.fonts.load) {
      try {
        await Promise.race([
          Promise.all([
            document.fonts.load('700 80px Caveat'),
            document.fonts.load('700 64px "Barlow Condensed"'),
            document.fonts.ready,
          ]),
          wait(800),
        ]);
      } catch (err) {}
    }
    fitBoard(themeRoot);
    scrubGuestPhotos(themeRoot);
    if (returning) {
      await wait(30);
      setDissolved(themeRoot, false);
      return;
    }
    if (helpers.finishShow) await helpers.finishShow(themeRoot, []);
    else themeRoot.classList.add("on");
  },

  hide(themeRoot) {
    if (!themeRoot.classList.contains("on")) return Promise.resolve();
    setDissolved(themeRoot, true);
    return wait(440);
  },

  unmount(_themeRoot, state) {
    if (!state) return;
    state.alive = false;
    if (typeof state.stopPhotos === "function") state.stopPhotos();
  },
});

function setDissolved(themeRoot, out) {
  ["copy", "glyph"].forEach(function (name) {
    var node = themeRoot.querySelector("." + name);
    if (node) node.classList.toggle("is-out", out);
  });
}

function paintSign(state) {
  if (!state || !state.sign) return Promise.resolve();
  var sign = SIGNS[state.index % SIGNS.length];
  state.sign.innerHTML = sign.line
    .split("\n")
    .map(escapeHtml)
    .join("<br>");
  if (!state.glyph) return Promise.resolve();
  var mask = 'url("' + assetUrl(sign.file) + '")';
  state.glyph.style.webkitMaskImage = mask;
  state.glyph.style.maskImage = mask;
  return Promise.resolve();
}

function concealPhoto(img) {
  if (!img || img.tagName !== "IMG") return;
  if (img.closest && img.closest("#preview-bg, #dyn-bg-media, #dyn-bg-embed")) return;
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
  var hide = concealPhoto;
  themeRoot.querySelectorAll("img").forEach(hide);
  if (typeof MutationObserver !== "function") return function () {};
  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === "attributes") {
        hide(record.target);
        return;
      }
      record.addedNodes.forEach(function (node) {
        if (!node || node.nodeType !== 1) return;
        if (node.tagName === "IMG") hide(node);
        if (node.querySelectorAll) node.querySelectorAll("img").forEach(hide);
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
  if (!copy) return;
  fitNode(themeRoot.querySelector("[data-message]"), copy, 13, 4.4, 0.34);
  fitNode(themeRoot.querySelector("[data-sign]"), copy, 8.2, 3.4, 0.34);
  fitNode(themeRoot.querySelector("[data-name]"), copy, 6.5, 3, 0.22);
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
    var base = path.indexOf("/themes/") !== -1 ? "assets/" : "themes/assets/";
    return new URL(base + filename, location.href).href;
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

var FALLBACK_HTML =
  '<div class="board">' +
  '<div class="bar"><div class="logo" data-brand="geico"></div></div>' +
  '<div class="copy"><p class="racer" data-message></p><p class="sign" data-sign></p><p class="from" data-name></p></div>' +
  '<div class="glyph" data-glyph></div>' +
  '<div class="slot-logo" data-logo></div><div class="slot-qr" data-qr></div>' +
  "</div>";
})();
