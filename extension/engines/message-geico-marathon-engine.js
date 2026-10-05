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
var tintCache = {};

BGThemeEngines.define({
  id: "message-geico-marathon-engine",
  kind: "message",

  mount(themeRoot, settings) {
    var helpers = globalThis.BGMessageThemes || {};
    var stage = helpers.ensureFitStage ? helpers.ensureFitStage(themeRoot) : themeRoot;
    if (!stage.querySelector(".board")) stage.innerHTML = FALLBACK_HTML;
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
    if (helpers.commonShowPrep) helpers.commonShowPrep(themeRoot, state);
    var message = (capture && capture.message) || "";
    var name = (capture && capture.name) || "";
    if (state && state.racer) state.racer.textContent = message;
    if (state && state.from) state.from.textContent = name;
    if (state && state.logo) state.logo.src = assetUrl("geico-marathon-logo.png");
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
    if (state && state.logo) state.logo.src = assetUrl("geico-marathon-logo.png");
    if (helpers.finishShow) await helpers.finishShow(themeRoot, []);
    else themeRoot.classList.add("on");
  },

  hide(themeRoot, state) {
    var helpers = globalThis.BGMessageThemes || {};
    if (helpers.hideTheme) return helpers.hideTheme(themeRoot, state, 280);
    themeRoot.classList.add("off");
    return wait(280).then(function () {
      themeRoot.classList.remove("on", "off");
    });
  },

  unmount(_themeRoot, state) {
    if (!state) return;
    state.alive = false;
  },
});

function paintSign(state) {
  if (!state || !state.sign) return Promise.resolve();
  var sign = SIGNS[state.index % SIGNS.length];
  var token = (state.paintToken = (state.paintToken || 0) + 1);
  state.sign.innerHTML = sign.line
    .split("\n")
    .map(escapeHtml)
    .join("<br>");
  if (state.logo) state.logo.src = assetUrl("geico-marathon-logo.png");
  return tintGlyph(assetUrl(sign.file), state.color || "#d6f25c").then(function (src) {
    if (!state.alive || state.paintToken !== token || !state.glyph) return;
    state.glyph.src = src;
  });
}

function tintGlyph(url, color) {
  var key = url + "@" + color;
  if (tintCache[key]) return Promise.resolve(tintCache[key]);
  return new Promise(function (resolve) {
    var img = new Image();
    img.onload = function () {
      try {
        var canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        var image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var px = image.data;
        var rgb = parseHex(color);
        for (var i = 0; i < px.length; i += 4) {
          if (!px[i + 3]) continue;
          px[i] = rgb[0];
          px[i + 1] = rgb[1];
          px[i + 2] = rgb[2];
        }
        ctx.putImageData(image, 0, 0);
        tintCache[key] = canvas.toDataURL("image/png");
      } catch (err) {
        tintCache[key] = url;
      }
      resolve(tintCache[key]);
    };
    img.onerror = function () {
      resolve(url);
    };
    img.src = url;
  });
}

function parseHex(color) {
  var hex = String(color || "").trim();
  var match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return [214, 242, 92];
  var value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
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
  '<div class="bar"><img class="logo" alt="GEICO" data-brand="geico"></div>' +
  '<div class="copy"><p class="racer" data-message></p><p class="sign" data-sign></p><p class="from" data-name></p></div>' +
  '<img class="glyph" data-glyph alt="">' +
  '<div class="slot-logo" data-logo></div><div class="slot-qr" data-qr></div>' +
  "</div>";
})();
