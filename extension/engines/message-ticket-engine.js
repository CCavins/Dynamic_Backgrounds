(function () {
/**
 * Dynamic Themes theme engine
 * id: message-ticket-engine
 * kind: message
 * Pairs with: themes/message-ticket.json
 *
 * Last word of the caption is always the red scratch hero.
 * Remaining words wrap as black varsity lines. Stub SECTION / ROW / SEAT
 * roll to new numbers on each cycle.
 */
BGThemeEngines.define({
  id: "message-ticket-engine",
  kind: "message",

  mount(themeRoot, settings) {
    const helpers = globalThis.BGMessageThemes || {};
    const stage = helpers.ensureFitStage
      ? helpers.ensureFitStage(themeRoot)
      : themeRoot;
    if (!stage.querySelector(".tk")) {
      stage.innerHTML = FALLBACK_HTML;
    }
    const state = {
      stage,
      photos: [...themeRoot.querySelectorAll("[data-photo]")],
      messages: [...themeRoot.querySelectorAll("[data-message]")],
      names: [...themeRoot.querySelectorAll("[data-name]")],
      lines: themeRoot.querySelector(".lines"),
      hero: themeRoot.querySelector(".hero"),
      section: themeRoot.querySelector("[data-section]"),
      row: themeRoot.querySelector("[data-row]"),
      seat: themeRoot.querySelector("[data-seat]"),
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
      node.innerHTML = decorateSpecials(name);
    });
    const split = splitCaption(message);
    if (state.lines) state.lines.innerHTML = decorateSpecials(split.lines);
    if (state.hero) state.hero.textContent = split.hero;
    rollStub(state);
    themeRoot.classList.toggle("no-photo", !src);
    themeRoot.classList.toggle("no-copy", !message && !name);
    themeRoot.classList.toggle("no-name", !name);
    themeRoot.classList.toggle("no-line", !split.lines);
    themeRoot.classList.toggle("no-hero", !split.hero);
    if (document.fonts) {
      try {
        await Promise.race([
          Promise.all([
            document.fonts.load('400 72px "College Solid"'),
            document.fonts.load('800 72px "Alumni Sans"'),
            document.fonts.load('400 96px "Permanent Marker"'),
            document.fonts.load('500 32px "Oswald"'),
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
    placePlate(themeRoot);
    fitAll(themeRoot, helpers.fitText);
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

function decorateSpecials(raw) {
  const text = String(raw || "");
  let html = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i);
    if (/[A-Za-z0-9\s'.,\-]/.test(ch)) {
      html += escapeHtml(ch);
    } else {
      html += '<span class="sym">' + escapeHtml(ch) + "</span>";
    }
  }
  return html;
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

function rollStub(state) {
  if (state.section) state.section.textContent = pad(100 + Math.floor(Math.random() * 300), 3);
  if (state.row) state.row.textContent = pad(1 + Math.floor(Math.random() * 36), 2);
  if (state.seat) state.seat.textContent = pad(1 + Math.floor(Math.random() * 28), 2);
}

function pad(n, len) {
  return String(n).padStart(len, "0");
}

function fitAll(themeRoot, fit) {
  const copy = themeRoot.querySelector(".copy");
  const lines = themeRoot.querySelector(".lines");
  const hero = themeRoot.querySelector(".hero");
  const name = themeRoot.querySelector(".name-box span");
  const box = themeRoot.querySelector(".name-box");
  const stageH = themeRoot.clientHeight || 720;
  const stageW = themeRoot.clientWidth || 1280;
  let linePx = 0;
  if (copy && lines && lines.textContent) {
    linePx = shrinkWrap(lines, copy, stageW, stageH, 0.18, 0.44, 34);
    lines.style.fontSize = linePx + "px";
  }
  if (copy && hero && hero.textContent) {
    const limitW = Math.max(80, copy.clientWidth * 0.9);
    let heroPx = Math.max(48, Math.round((linePx || stageH * 0.18) * 1.7));
    hero.style.whiteSpace = "nowrap";
    hero.style.width = "max-content";
    hero.style.maxWidth = "none";
    hero.style.marginLeft = "auto";
    hero.style.marginRight = "auto";
    hero.style.fontSize = heroPx + "px";
    let guard = 0;
    while (guard < 140 && heroPx > 36 && hero.scrollWidth > limitW) {
      heroPx -= 2;
      hero.style.fontSize = heroPx + "px";
      guard += 1;
    }
    guard = 0;
    while (guard < 80 && heroPx > 36) {
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
    while (guard < 40 && say.scrollHeight > copy.clientHeight - 4) {
      if (lines && linePx > 32) {
        linePx -= 2;
        lines.style.fontSize = linePx + "px";
      }
      if (hero && hero.textContent) {
        const cur = parseFloat(hero.style.fontSize) || 48;
        if (cur > 28) hero.style.fontSize = cur - 2 + "px";
      }
      guard += 1;
    }
  }
  fitName(themeRoot, fit);
}

function placePlate(themeRoot) {
  const card = themeRoot.querySelector(".card");
  const plate = themeRoot.querySelector(".plate");
  const stage = themeRoot.querySelector(".tk") || themeRoot;
  if (!plate) return;
  if (!card || themeRoot.classList.contains("no-photo")) {
    plate.style.left = "";
    return;
  }
  const saved = plate.style.transform;
  const savedCard = card.style.transform;
  plate.style.transform = "none";
  card.style.transform = "rotate(-2.2deg)";
  const cr = card.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  if (sr.width > 0) {
    const leftPct = ((cr.right - sr.left) / sr.width) * 100;
    plate.style.left = Math.max(28, Math.min(52, leftPct)) + "%";
  }
  plate.style.right = "0";
  plate.style.transform = saved;
  card.style.transform = savedCard;
}

function fitName(themeRoot, fit) {
  const plate = themeRoot.querySelector(".plate");
  const box = themeRoot.querySelector(".name-box");
  const name = themeRoot.querySelector(".name-box span");
  if (!plate || !box || !name || !String(name.textContent || "").trim()) return;
  const saved = plate.style.transform;
  plate.style.transform = "none";
  name.style.whiteSpace = "nowrap";
  name.style.width = "max-content";
  name.style.maxWidth = "none";
  name.style.lineHeight = "1";
  const limitH = Math.max(24, (box.clientHeight || plate.clientHeight || 80) - 4);
  const maxPx = Math.max(34, Math.round(limitH * 0.7));
  let size = maxPx;
  name.style.fontSize = size + "px";
  const limitW = Math.max(40, box.clientWidth);
  let guard = 0;
  while (
    guard < 80 &&
    size > 22 &&
    (name.scrollWidth > limitW + 2 || name.scrollHeight > limitH + 1)
  ) {
    size -= 2;
    name.style.fontSize = size + "px";
    guard += 1;
  }
  name.style.width = "100%";
  name.style.textAlign = "center";
  plate.style.transform = saved;
  if (fit && size <= 24) fit(box, name, size, 20);
}

function shrinkWrap(el, copy, stageW, stageH, maxRatio, heightRatio, minPx) {
  const limitW = Math.max(120, copy.clientWidth * 0.98);
  const limitH = Math.max(80, copy.clientHeight * heightRatio);
  let size = Math.round(stageH * maxRatio);
  if (size < minPx) size = minPx;
  el.style.whiteSpace = "normal";
  el.style.width = "100%";
  el.style.maxWidth = "100%";
  el.style.marginLeft = "auto";
  el.style.marginRight = "auto";
  el.style.fontSize = size + "px";
  let guard = 0;
  while (
    guard < 80 &&
    size > minPx &&
    (el.scrollHeight > limitH + 6 || wordOverflows(el, limitW))
  ) {
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
  '<div class="tk"><div class="bg"><div class="sky"></div></div>' +
  '<div class="chrome"><span class="gn">GAME NIGHT</span><i class="edge"></i></div>' +
  '<div class="stub"><div class="blk"><em>SECTION</em><b data-section>104</b></div>' +
  '<div class="blk"><em>ROW</em><b data-row>12</b></div>' +
  '<div class="blk"><em>SEAT</em><b data-seat>07</b></div></div>' +
  '<div class="card"><div class="polaroid"><img data-photo alt=""></div></div>' +
  '<div class="copy"><div class="say"><div class="lines"></div><div class="hero-wrap"><div class="hero"></div></div></div></div>' +
  '<div class="plate"><div class="name-box"><span data-name></span></div></div>' +
  '<span class="sr" data-message></span>' +
  '<div class="logo-slot" data-logo></div><div class="qr-slot" data-qr></div></div>';
})();
