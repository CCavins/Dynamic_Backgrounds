(function () {
/**
 * Dynamic Themes theme engine
 * id: message-chalk-engine
 * kind: message
 * Pairs with: themes/message-chalk.json
 *
 * Last word of the caption is always the large yellow chalk hero.
 * Remaining words wrap as white chalk. Name sits in a chalk box
 * that grows with the lettering.
 */
BGThemeEngines.define({
  id: "message-chalk-engine",
  kind: "message",

  mount(themeRoot, settings) {
    const helpers = globalThis.BGMessageThemes || {};
    const stage = helpers.ensureFitStage
      ? helpers.ensureFitStage(themeRoot)
      : themeRoot;
    if (!stage.querySelector(".ck")) {
      stage.innerHTML = FALLBACK_HTML;
    }
    const state = {
      stage,
      photos: [...themeRoot.querySelectorAll("[data-photo]")],
      messages: [...themeRoot.querySelectorAll("[data-message]")],
      names: [...themeRoot.querySelectorAll("[data-name]")],
      lines: themeRoot.querySelector(".lines"),
      hero: themeRoot.querySelector(".hero"),
      idleTimer: 0,
    };
    if (typeof this.applySettings === "function") {
      this.applySettings(themeRoot, state, settings);
    }
    return state;
  },

  applySettings(themeRoot, _state, settings) {
    const helpers = globalThis.BGMessageThemes || {};
    if (helpers.applyVars) helpers.applyVars(themeRoot, settings);
  },

  async show(themeRoot, capture, state, settings) {
    const helpers = globalThis.BGMessageThemes || {};
    if (helpers.commonShowPrep) helpers.commonShowPrep(themeRoot, state);
    const src = (capture && capture.src) || "";
    const message = (capture && capture.message) || "";
    const name = (capture && capture.name) || "";
    (state.photos || []).forEach(function (img) {
      img.src = src;
    });
    (state.messages || []).forEach(function (node) {
      node.textContent = message;
    });
    (state.names || []).forEach(function (node) {
      node.textContent = name;
    });
    const split = splitCaption(message);
    if (state.lines) state.lines.textContent = split.lines;
    if (state.hero) fillHero(state.hero, split.hero);
    themeRoot.classList.toggle("no-photo", !src);
    themeRoot.classList.toggle("no-copy", !message && !name);
    themeRoot.classList.toggle("no-name", !name);
    themeRoot.classList.toggle("no-line", !split.lines);
    themeRoot.classList.toggle("no-hero", !split.hero);
    if (document.fonts) {
      try {
        await Promise.race([
          Promise.all([
            document.fonts.load('400 96px "Permanent Marker"'),
            document.fonts.load('400 64px "Bebas Neue"'),
            document.fonts.ready.catch(function () {}),
          ]),
          wait(900),
        ]);
      } catch (err) {}
    }
    const sky = themeRoot.querySelector(".sky");
    if (sky) {
      sky.style.animation = "none";
      void sky.offsetWidth;
      sky.style.animation = "";
    }
    fitAll(themeRoot, helpers.fitText);
    pinNeArrow(themeRoot);
    if (helpers.finishShow) await helpers.finishShow(themeRoot, state.photos);
    else themeRoot.classList.add("on");
  },

  hide(themeRoot, state) {
    const helpers = globalThis.BGMessageThemes || {};
    if (helpers.hideTheme) return helpers.hideTheme(themeRoot, state, 280);
    themeRoot.classList.add("off");
    return new Promise(function (resolve) {
      setTimeout(function () {
        themeRoot.classList.remove("on", "off");
        resolve();
      }, 280);
    });
  },

  unmount(_themeRoot, state) {
    if (state && state.idleTimer) clearTimeout(state.idleTimer);
  },
});

function fillHero(el, text) {
  const chars = Array.from(String(text || ""));
  el.innerHTML = chars
    .map(function (ch) {
      return "<b>" + escapeHtml(ch === " " ? "\u00a0" : ch) + "</b>";
    })
    .join("");
  const letters = [...el.querySelectorAll("b")];
  const n = letters.length;
  letters.forEach(function (b, i) {
    const t = n < 2 ? 0 : (i / (n - 1) - 0.5) * 2;
    b.style.transform = "rotate(" + (t * 3.8).toFixed(2) + "deg) translateY(" + (t * t * 0.12).toFixed(3) + "em)";
  });
}

function escapeHtml(ch) {
  if (ch === "&") return "&amp;";
  if (ch === "<") return "&lt;";
  if (ch === ">") return "&gt;";
  if (ch === '"') return "&quot;";
  return ch;
}

function splitCaption(raw) {
  const text = String(raw || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!text) return { lines: "", hero: "" };
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 1) return { lines: "", hero: words[0] };
  return {
    lines: words.slice(0, -1).join(" "),
    hero: words[words.length - 1],
  };
}

function fitAll(themeRoot, fit) {
  const copy = themeRoot.querySelector(".copy");
  const lines = themeRoot.querySelector(".lines");
  const hero = themeRoot.querySelector(".hero");
  const stageH = themeRoot.clientHeight || 720;
  let linePx = 0;
  if (copy && lines && lines.textContent) {
    linePx = shrinkWrap(lines, copy, stageH, 0.17, 0.42, 32);
    lines.style.fontSize = linePx + "px";
  }
  if (copy && hero && hero.textContent) {
    const limitW = Math.max(80, copy.clientWidth * 0.92);
    let heroPx = Math.max(46, Math.round((linePx || stageH * 0.17) * 1.72));
    hero.style.whiteSpace = "nowrap";
    hero.style.width = "max-content";
    hero.style.maxWidth = "none";
    hero.style.fontSize = heroPx + "px";
    let guard = 0;
    while (guard < 140 && heroPx > 34 && hero.scrollWidth > limitW) {
      heroPx -= 2;
      hero.style.fontSize = heroPx + "px";
      guard += 1;
    }
    guard = 0;
    while (guard < 80 && heroPx > 34) {
      const hb = hero.getBoundingClientRect();
      const cb = copy.getBoundingClientRect();
      if (hb.left >= cb.left + 2 && hb.right <= cb.right - 2) break;
      heroPx -= 2;
      hero.style.fontSize = heroPx + "px";
      guard += 1;
    }
  }
  const say = themeRoot.querySelector(".say");
  if (copy && say && copy.clientHeight) {
    let guard = 0;
    while (guard < 40 && say.scrollHeight > copy.clientHeight * 0.78) {
      if (lines && linePx > 30) {
        linePx -= 2;
        lines.style.fontSize = linePx + "px";
      }
      if (hero && hero.textContent) {
        const cur = parseFloat(hero.style.fontSize) || 46;
        if (cur > 28) hero.style.fontSize = cur - 2 + "px";
      }
      guard += 1;
    }
  }
  fitName(themeRoot, fit);
}

function pinNeArrow(themeRoot) {
  const arr = themeRoot.querySelector(".arr.ne");
  const pin = themeRoot.querySelector(".arr-ne-pin");
  const host = themeRoot.querySelector(".ck") || themeRoot;
  if (!arr || !pin) return;
  if (pin.offsetWidth < 2) {
    arr.style.opacity = "0";
    return;
  }
  const hostBox = host.getBoundingClientRect();
  const pinBox = pin.getBoundingClientRect();
  const w = pin.offsetWidth;
  const h = pin.offsetHeight;
  arr.style.left = pinBox.left + pinBox.width / 2 - hostBox.left - w / 2 + "px";
  arr.style.top = pinBox.top + pinBox.height / 2 - hostBox.top - h / 2 + "px";
  arr.style.width = w + "px";
  arr.style.height = h + "px";
  arr.style.transform = "rotate(-6deg)";
  arr.style.transformOrigin = "50% 50%";
}

function fitName(themeRoot, fit) {
  const box = themeRoot.querySelector(".name-box");
  const name = themeRoot.querySelector(".name-box span");
  if (!box || !name || !String(name.textContent || "").trim()) return;
  name.style.whiteSpace = "nowrap";
  name.style.width = "max-content";
  const copy = themeRoot.querySelector(".copy");
  const limitW = Math.max(80, ((copy && copy.clientWidth) || 400) * 0.88);
  let size = Math.max(52, Math.round((themeRoot.clientHeight || 720) * 0.122));
  name.style.fontSize = size + "px";
  let guard = 0;
  while (guard < 80 && size > 24 && name.scrollWidth + size * 2 > limitW) {
    size -= 2;
    name.style.fontSize = size + "px";
    guard += 1;
  }
  const letter = Math.max(12, size * 0.92);
  box.style.width = Math.ceil(name.scrollWidth + letter * 2) + "px";
  box.style.paddingLeft = "0";
  box.style.paddingRight = "0";
  name.style.width = "100%";
  name.style.textAlign = "center";
  if (fit && size <= 26) fit(box, name, size, 20);
}

function shrinkWrap(el, copy, stageH, maxRatio, heightRatio, minPx) {
  const limitW = Math.max(120, copy.clientWidth * 0.96);
  const limitH = Math.max(70, copy.clientHeight * heightRatio);
  let size = Math.round(stageH * maxRatio);
  if (size < minPx) size = minPx;
  el.style.whiteSpace = "normal";
  el.style.width = "100%";
  el.style.fontSize = size + "px";
  let guard = 0;
  while (guard < 80 && size > minPx && (el.scrollHeight > limitH + 6 || wordOverflows(el, limitW))) {
    size -= 2;
    el.style.fontSize = size + "px";
    guard += 1;
  }
  return size;
}

function wordOverflows(el, limit) {
  const words = String(el.textContent || "").split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i += 1) {
    const probe = document.createElement("span");
    probe.textContent = words[i];
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font:" + getComputedStyle(el).font;
    el.appendChild(probe);
    const width = probe.offsetWidth;
    el.removeChild(probe);
    if (width > limit) return true;
  }
  return false;
}

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

const FALLBACK_HTML =
  '<div class="ck"><div class="bg"><div class="sky"></div></div>' +
  '<div class="card"><div class="polaroid"><img data-photo alt=""></div></div>' +
  '<div class="copy"><div class="say"><div class="lines"></div><div class="hero-wrap"><div class="hero"></div></div></div>' +
  '<div class="name-box"><span data-name></span></div></div>' +
  '<span class="sr" data-message></span></div>';
})();
