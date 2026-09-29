(function () {
/**
 * Dynamic Themes theme engine
 * id: message-brushed-engine
 * kind: message
 * Pairs with: themes/message-brushed.json
 *
 * Hooks used: mount, applySettings, show, hide, unmount
 * Helpers used: BGMessageThemes.ensureFitStage, applyVars, commonShowPrep,
 * finishShow, hideTheme, fitText
 *
 * Splits the caption into a chrome slam line and gold brush hero lines:
 * newlines first; else first words go chrome and the rest go gold
 * (2 words → 1/1, 3 → 2/1, 4 → 2/2, 5+ → 4/rest). One word stays gold.
 */
BGThemeEngines.define({
  id: "message-brushed-engine",
  kind: "message",

  mount(themeRoot, settings) {
    const helpers = globalThis.BGMessageThemes || {};
    const stage = helpers.ensureFitStage
      ? helpers.ensureFitStage(themeRoot)
      : themeRoot;
    if (!stage.querySelector(".hd")) {
      stage.innerHTML = FALLBACK_HTML;
    }
    const state = {
      stage,
      photos: [...themeRoot.querySelectorAll("[data-photo]")],
      messages: [...themeRoot.querySelectorAll("[data-message]")],
      names: [...themeRoot.querySelectorAll("[data-name]")],
      line1: themeRoot.querySelector(".line1"),
      heroes: themeRoot.querySelector(".heroes"),
      dustHost: themeRoot.querySelector(".dust"),
      dustRaf: 0,
      dust: [],
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
    applyHues(themeRoot, settings);
  },

  async show(themeRoot, capture, state, settings) {
    const helpers = globalThis.BGMessageThemes || {};
    if (helpers.commonShowPrep) helpers.commonShowPrep(themeRoot, state);
    const src = (capture && capture.src) || "";
    const message = (capture && capture.message) || "";
    const name = (capture && capture.name) || "";
    (state.photos || []).forEach((img) => {
      img.src = src;
    });
    (state.messages || []).forEach((node) => {
      node.textContent = message;
    });
    (state.names || []).forEach((node) => {
      node.textContent = name;
    });
    const split = splitCaption(message);
    renderLine(state.line1, split.line1);
    renderHeroes(state.heroes, split.heroes);
    themeRoot.classList.toggle("no-photo", !src);
    themeRoot.classList.toggle("no-copy", !message && !name);
    themeRoot.classList.toggle("no-name", !name);
    themeRoot.classList.toggle("no-line1", !split.line1);
    themeRoot.classList.toggle("no-hero", !split.heroes.length);
    if (document.fonts) {
      try {
        await Promise.race([
          Promise.all([
            document.fonts.load('italic 400 96px "Rubik Wet Paint"'),
            document.fonts.load("italic 400 72px Impact"),
            document.fonts.ready.catch(function () {}),
          ]),
          wait(900),
        ]);
      } catch (err) {}
    }
    fitAll(themeRoot, helpers.fitText);
    startDust(state);
    if (helpers.finishShow) await helpers.finishShow(themeRoot, state.photos);
    else themeRoot.classList.add("on");
    pinBotStroke(themeRoot);
    requestAnimationFrame(function () {
      pinBotStroke(themeRoot);
    });
  },

  hide(themeRoot, state) {
    stopDust(state);
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
    stopDust(state);
    if (state && state.idleTimer) clearTimeout(state.idleTimer);
  },
});

const HUE_REF_LEFT = 42;
const HUE_REF_SKY = 219;

function hexToHue(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return h * 60;
}

function hueShift(hex, ref) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  if (r === g && g === b) return 0;
  let shift = hexToHue(hex) - ref;
  if (shift > 180) shift -= 360;
  if (shift < -180) shift += 360;
  return shift;
}

function applyHues(themeRoot, settings) {
  if (!themeRoot || !themeRoot.style) return;
  const name = settings && settings.nameBox;
  themeRoot.style.setProperty(
    "--name-box",
    /^#?[0-9a-f]{6}$/i.test(String(name || "")) ? name : "#06102a"
  );
  const textBrush = hueShift(settings && settings.background, HUE_REF_LEFT);
  const left = hueShift(settings && settings.leftTint, HUE_REF_LEFT);
  const sky = hueShift(settings && settings.bgHue, HUE_REF_SKY);
  themeRoot.style.setProperty("--text-brush-hue", textBrush.toFixed(1) + "deg");
  themeRoot.style.setProperty("--left-hue", left.toFixed(1) + "deg");
  themeRoot.style.setProperty("--sky-hue", sky.toFixed(1) + "deg");
}

function splitCaption(raw) {
  const text = String(raw || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!text) return { line1: "", heroes: [] };
  const parts = text
    .split(/\n+/)
    .map(function (part) {
      return part.trim();
    })
    .filter(Boolean);
  if (parts.length >= 2) {
    return { line1: parts[0], heroes: parts.slice(1) };
  }
  const words = glueAmpersands(parts[0].split(/\s+/).filter(Boolean));
  if (words.length >= 5) {
    return { line1: words.slice(0, 4).join(" "), heroes: [words.slice(4).join(" ")] };
  }
  if (words.length === 4) {
    return { line1: words.slice(0, 2).join(" "), heroes: [words.slice(2).join(" ")] };
  }
  if (words.length === 3) {
    return { line1: words.slice(0, 2).join(" "), heroes: [words[2]] };
  }
  if (words.length === 2) {
    return { line1: words[0], heroes: [words[1]] };
  }
  return { line1: "", heroes: [parts[0]] };
}

function glueAmpersands(words) {
  const out = [];
  (words || []).forEach(function (word) {
    if (!word) return;
    if (/^[&+/]$/.test(word) && out.length) {
      out[out.length - 1] += " " + word;
      return;
    }
    if (out.length && /^[&+]/.test(word) && word.length <= 2) {
      out[out.length - 1] += " " + word;
      return;
    }
    out.push(word);
  });
  return out;
}

function renderLine(el, text) {
  if (!el) return;
  el.textContent = "";
  if (!text) return;
  glueAmpersands(text.split(/\s+/).filter(Boolean)).forEach(function (word) {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = word;
    el.appendChild(span);
  });
}

function renderHeroes(el, lines) {
  if (!el) return;
  el.textContent = "";
  (lines || []).forEach(function (line) {
    const hero = document.createElement("span");
    hero.className = "hero";
    const fill = document.createElement("span");
    fill.className = "hero-fill";
    fill.textContent = line;
    hero.appendChild(fill);
    el.appendChild(hero);
  });
}

function fitAll(themeRoot, fit) {
  const copy = themeRoot.querySelector(".copy");
  const lockup = themeRoot.querySelector(".copy-lockup");
  const hd = themeRoot.querySelector(".hd") || themeRoot;
  if (!copy) return;
  const savedTilt = lockup ? lockup.style.transform : "";
  if (lockup) lockup.style.transform = "none";
  const line1 = themeRoot.querySelector(".line1");
  if (line1) {
    line1.style.fontSize = shrinkToBox(line1, copy, 104, 24) + "px";
  }
  const heroes = themeRoot.querySelector(".heroes");
  const fills = themeRoot.querySelectorAll(".hero-fill");
  if (heroes && fills.length) {
    const wrapPx = Math.max(120, copy.clientWidth * 0.94);
    fills.forEach(function (fill) {
      fill.style.whiteSpace = /\s/.test(fill.textContent || "") ? "normal" : "nowrap";
      fill.style.width = "max-content";
      fill.style.maxWidth = wrapPx + "px";
      fill.style.textAlign = "center";
      fill.style.marginLeft = "auto";
      fill.style.marginRight = "auto";
    });
    let size = 136;
    applyHeroSize(heroes, fills, size);
    let guard = 0;
    while (guard < 70 && size > 52 && (heroWiderThan(fills, copy) || heroWordOverflows(fills, copy))) {
      size -= 2;
      applyHeroSize(heroes, fills, size);
      guard += 1;
    }
    if (lockup) lockup.style.transform = savedTilt;
    guard = 0;
    while (guard < 24 && size > 52 && heroHitsClip(fills, copy, hd)) {
      size -= 2;
      applyHeroSize(heroes, fills, size);
      guard += 1;
    }
    const line1Px = line1 ? parseFloat(line1.style.fontSize) : 0;
    if (line1Px && size > line1Px * 1.42) {
      size = Math.round(line1Px * 1.42);
      applyHeroSize(heroes, fills, size);
    }
    tightenLockup(themeRoot, size);
  } else if (lockup) {
    lockup.style.transform = savedTilt;
  }
  fitPlateToName(themeRoot, fit);
  pinBotStroke(themeRoot);
}

function tightenLockup(themeRoot, size) {
  const heroes = themeRoot.querySelector(".heroes");
  const line1 = themeRoot.querySelector(".line1");
  if (!heroes) return;
  const goldPx = size || parseFloat(heroes.style.fontSize) || 96;
  const chromePx = line1 ? parseFloat(line1.style.fontSize) || 72 : 72;
  const hasChrome = !!(line1 && line1.offsetParent && String(line1.textContent || "").trim());
  if (line1 && hasChrome) {
    line1.style.paddingBottom = Math.round(chromePx * 0.07) + "px";
  }
  heroes.style.marginTop = hasChrome ? Math.round(goldPx * 0.11) + "px" : "0px";
  themeRoot.querySelectorAll(".hero").forEach(function (hero, i) {
    hero.style.marginTop = i ? Math.round(goldPx * 0.02) + "px" : "";
  });
}

function offsetTopIn(el, ancestor) {
  let y = 0;
  let node = el;
  while (node && node !== ancestor) {
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return y;
}

function pinBotStroke(themeRoot) {
  const lockup = themeRoot.querySelector(".copy-lockup");
  const bot = themeRoot.querySelector(".paint-bot");
  const last =
    themeRoot.querySelector(".hero:last-child") ||
    themeRoot.querySelector(".line1");
  if (!lockup || !bot || !last || last.offsetParent === null) {
    if (bot) {
      bot.style.top = "";
      bot.style.transform = "";
    }
    return;
  }
  const saved = lockup.style.transform;
  lockup.style.transform = "none";
  const y = offsetTopIn(last, lockup) + last.offsetHeight;
  const drop = Math.round(Math.min(16, Math.max(8, last.offsetHeight * 0.1)));
  bot.style.top = Math.round(y + drop) + "px";
  bot.style.transform = "translate(-50%, 0)";
  lockup.style.transform = saved;
}

function fitPlateToName(themeRoot, fit) {
  const plate = themeRoot.querySelector(".plate");
  const box = themeRoot.querySelector(".name-box");
  const name = themeRoot.querySelector(".name-box span");
  const copy = themeRoot.querySelector(".copy");
  if (!plate || !box || !name || !copy) return;
  const text = String(name.textContent || "").trim();
  if (!text) {
    plate.style.width = "";
    box.style.paddingLeft = "";
    box.style.paddingRight = "";
    return;
  }
  const savedX = plate.style.transform;
  plate.style.transform = "none";
  name.style.width = "max-content";
  name.style.maxWidth = "none";
  name.style.whiteSpace = "nowrap";
  name.style.fontSize = "";
  let size = Math.round(parseFloat(getComputedStyle(name).fontSize) || 64);
  if (size > 88) size = 88;
  if (size < 28) size = 28;
  name.style.fontSize = size + "px";
  const maxW = Math.max(160, copy.clientWidth);
  const h = plate.clientHeight || box.clientHeight || 80;
  const slant = Math.max(22, Math.round(h * 0.42));
  const chamfer = Math.max(8, Math.round(h * 0.12));
  const inkPad = Math.max(22, Math.round(size * 0.4));
  const side = slant + inkPad + 10;
  let width = Math.ceil(nameWidth(name) + side * 2);
  let guard = 0;
  while (guard < 50 && size > 26 && width > maxW) {
    size -= 2;
    name.style.fontSize = size + "px";
    width = Math.ceil(nameWidth(name) + side * 2);
    guard += 1;
  }
  width = Math.min(maxW, Math.max(width, side * 2 + 36));
  plate.style.width = width + "px";
  box.style.paddingLeft = side + "px";
  box.style.paddingRight = side + "px";
  applyPlateShape(plate, width, h, slant, chamfer);
  plate.style.transform = savedX;
  if (fit && width >= maxW - 2) {
    fit(box, name, size, 26);
  }
}

function nameWidth(el) {
  return Math.max(el.scrollWidth || 0, el.offsetWidth || 0);
}

function applyPlateShape(plate, w, h, slantPx, chamferPx) {
  const shape = plateShape(w, h, slantPx, chamferPx);
  const pts = shape.viewBox.join(" ");
  plate.querySelectorAll(".plate-svg polygon").forEach(function (poly) {
    poly.setAttribute("points", pts);
  });
  plate.style.setProperty("--frame-clip", "polygon(" + shape.css.join(", ") + ")");
}

function plateShape(w, h, slantPx, chamferPx) {
  const padX = Math.max(2, w * 0.004);
  const padY = Math.max(2, h * 0.025);
  const s = Math.min(slantPx, (w - chamferPx * 2) * 0.4);
  const c = Math.min(chamferPx, h * 0.36, w * 0.18);
  const tl = [padX + s, padY];
  const tr = [w - padX, padY];
  const br = [w - padX - s, h - padY];
  const bl = [padX, h - padY];
  const ulTop = [tl[0] + c, padY];
  const ulLeft = intersect45(ulTop, -1, 1, tl, bl) || [tl[0] - (s * c) / Math.max(1, h - padY * 2), padY + c];
  const lrBot = [br[0] - c, h - padY];
  const lrRight = intersect45(lrBot, 1, -1, tr, br) || [br[0] + (s * c) / Math.max(1, h - padY * 2), h - padY - c];
  const px = [ulTop, tr, lrRight, lrBot, bl, ulLeft];
  return {
    viewBox: px.map(function (p) {
      return ((p[0] / w) * 1000).toFixed(1) + "," + ((p[1] / h) * 160).toFixed(1);
    }),
    css: px.map(function (p) {
      return ((p[0] / w) * 100).toFixed(2) + "% " + ((p[1] / h) * 100).toFixed(2) + "%";
    }),
  };
}

function intersect45(start, dirX, dirY, a, b) {
  const r = [dirX * 4000, dirY * 4000];
  const s = [b[0] - a[0], b[1] - a[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (!den) return null;
  const qp = [a[0] - start[0], a[1] - start[1]];
  const t = (qp[0] * s[1] - qp[1] * s[0]) / den;
  const u = (qp[0] * r[1] - qp[1] * r[0]) / den;
  if (t < 0 || u < 0 || u > 1) return null;
  return [start[0] + r[0] * t, start[1] + r[1] * t];
}

function applyHeroSize(heroes, fills, size) {
  heroes.style.fontSize = size + "px";
  fills.forEach(function (fill) {
    fill.style.fontSize = size + "px";
  });
}

function shrinkToBox(el, copy, maxPx, minPx) {
  if (!el) return minPx;
  let size = maxPx;
  el.style.fontSize = size + "px";
  while (size > minPx && textWiderThan(el, copy)) {
    size -= 2;
    el.style.fontSize = size + "px";
  }
  return size;
}

function textWiderThan(el, copy) {
  const box = copy.getBoundingClientRect();
  const pad = Math.max(8, box.width * 0.04);
  const limit = Math.max(80, box.width - pad * 2);
  return measureText(el) > limit;
}

function measureText(el) {
  const filter = el.style.filter;
  el.style.filter = "none";
  let width = 0;
  if (el.classList.contains("line1")) {
    el.querySelectorAll(".word").forEach(function (word) {
      width += word.getBoundingClientRect().width;
    });
  } else if (el.firstChild) {
    const range = document.createRange();
    range.selectNodeContents(el);
    width = range.getBoundingClientRect().width;
    range.detach();
  }
  if (!width) width = el.scrollWidth || el.offsetWidth;
  el.style.filter = filter;
  return width;
}

function heroWiderThan(fills, copy) {
  const limit = copyLimit(copy, 0.94);
  for (let i = 0; i < fills.length; i += 1) {
    if (measureText(fills[i]) > limit) return true;
  }
  return false;
}

function heroWordOverflows(fills, copy) {
  const limit = copyLimit(copy, 0.92);
  for (let i = 0; i < fills.length; i += 1) {
    const words = String(fills[i].textContent || "").split(/\s+/).filter(Boolean);
    for (let w = 0; w < words.length; w += 1) {
      if (measureWord(fills[i], words[w]) > limit) return true;
    }
  }
  return false;
}

function copyLimit(copy, ratio) {
  const box = copy.getBoundingClientRect();
  return Math.max(80, box.width * ratio);
}

function heroHitsClip(fills, copy, hd) {
  const copyBox = copy.getBoundingClientRect();
  const stageBox = hd.getBoundingClientRect();
  const right = Math.min(copyBox.right, stageBox.right) - 2;
  const left = Math.max(copyBox.left, stageBox.left) + 2;
  for (let i = 0; i < fills.length; i += 1) {
    const box = inkBox(fills[i]);
    const hang = Math.max(6, parseFloat(getComputedStyle(fills[i]).fontSize) * 0.18);
    if (box.right + hang > right || box.left - 2 < left) return true;
  }
  return false;
}

function inkBox(el) {
  if (el.firstChild) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const box = range.getBoundingClientRect();
    range.detach();
    if (box.width) return box;
  }
  return el.getBoundingClientRect();
}

function measureWord(el, word) {
  const probe = document.createElement("span");
  probe.textContent = word;
  probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font:" + getComputedStyle(el).font;
  el.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  el.removeChild(probe);
  return width;
}


function rand(min, max) {
  return min + Math.random() * (max - min);
}

function seedDust(el, first) {
  return {
    el: el,
    x: rand(4, 96),
    y: rand(6, 94),
    vx: rand(-10, 10),
    vy: rand(-16, -4),
    s: rand(2, 5.5),
    a: rand(0.35, 0.9),
    life: rand(2800, 7200),
    t0: first ? performance.now() - rand(0, 2400) : 0,
  };
}

function startDust(state) {
  stopDust(state);
  const host = state && state.dustHost;
  if (!host) return;
  host.textContent = "";
  state.dust = [];
  for (let i = 0; i < 46; i += 1) {
    const el = document.createElement("i");
    host.appendChild(el);
    state.dust.push(seedDust(el, true));
  }
  function frame(now) {
    state.dust.forEach(function (p) {
      if (!p.t0) p.t0 = now;
      const t = (now - p.t0) / p.life;
      if (t >= 1) {
        const next = seedDust(p.el, false);
        next.t0 = now;
        Object.assign(p, next);
        return;
      }
      const fade = t < 0.18 ? t / 0.18 : t > 0.72 ? (1 - t) / 0.28 : 1;
      const x = p.x + p.vx * t;
      const y = p.y + p.vy * t;
      p.el.style.left = x + "%";
      p.el.style.top = y + "%";
      p.el.style.width = p.s + "px";
      p.el.style.height = p.s + "px";
      p.el.style.opacity = String(Math.max(0, fade * p.a));
    });
    state.dustRaf = requestAnimationFrame(frame);
  }
  state.dustRaf = requestAnimationFrame(frame);
}

function stopDust(state) {
  if (state && state.dustRaf) {
    cancelAnimationFrame(state.dustRaf);
    state.dustRaf = 0;
  }
  if (state) state.dust = [];
}

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

const FALLBACK_HTML =
  '<div class="hd">' +
  '<div class="bg"><div class="sky"></div><div class="bg-brush"></div><div class="lights"></div><div class="dust"></div></div>' +
  '<div class="card"><i class="frame-halo"></i><div class="card-rim"><div class="card-inner"><img data-photo alt=""></div></div></div>' +
  '<div class="copy"><div class="copy-lockup"><div class="line1"></div><div class="heroes"></div></div>' +
  '<div class="plate"><div class="plate-flares"></div><svg class="plate-svg" viewBox="0 0 1000 160" preserveAspectRatio="none"><polygon class="plate-stroke-black" points="118,4 996,4 948,118 882,156 4,156 65,30"/><polygon class="plate-fill" points="118,4 996,4 948,118 882,156 4,156 65,30"/><polygon class="plate-stroke-gold" points="118,4 996,4 948,118 882,156 4,156 65,30"/></svg><div class="name-box"><span data-name></span></div></div></div>' +
  '<span class="sr" data-message></span>' +
  '<div class="logo-slot" data-logo></div><div class="qr-slot" data-qr></div>' +
  "</div>";
})();
