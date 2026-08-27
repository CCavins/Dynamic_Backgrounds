const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const messageSrc = fs.readFileSync(path.join(root, "extension/message-themes.js"), "utf8");
const mosaicSrc = fs.readFileSync(path.join(root, "extension/mosaic-themes.js"), "utf8");

function extractRawStyle(src, marker) {
  const start = src.indexOf(marker);
  const from = src.indexOf("`", start) + 1;
  const to = src.indexOf("`;", from);
  return src.slice(from, to);
}

function extractThemeCss(style, themeId) {
  const needle = `[data-theme="${themeId}"]`;
  const lines = style.split("\n");
  const kept = [];
  let capture = false;
  let depth = 0;
  for (const line of lines) {
    const startsTheme = line.includes(needle);
    const startsOther =
      /\[data-theme="/.test(line) && !line.includes(needle) && !line.trim().startsWith("/*");
    if (startsTheme) capture = true;
    else if (capture && startsOther) {
      capture = false;
      depth = 0;
    }
    if (capture) {
      kept.push(line);
      depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    }
  }
  let css = kept.join("\n");
  const keyframes = new Set();
  const anims = css.match(/animation:\s*([a-zA-Z0-9_-]+)/g) || [];
  anims.forEach((item) => {
    const name = item.replace(/animation:\s*/, "").split(/\s/)[0];
    if (name) keyframes.add(name);
  });
  keyframes.forEach((name) => {
    const start = style.indexOf(`@keyframes ${name}`);
    if (start < 0) return;
    let depth = 0;
    let end = start;
    for (let i = start; i < style.length; i += 1) {
      if (style[i] === "{") depth += 1;
      if (style[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    css += "\n" + style.slice(start, end);
  });
  return css
    .replace(/(\d*\.?\d+)vh\b/g, "$1cqh")
    .replace(/(\d*\.?\d+)vw\b/g, "$1cqw")
    .replace(new RegExp(`data-theme="${themeId}"`, "g"), 'data-theme="__ID__"')
    .replace(/:is\(\[data-theme="__ID__"\], \[data-engine="[^"]+"\]\)/g, '[data-theme="__ID__"]')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function applyId(css, id) {
  return css.replace(/__ID__/g, id);
}

function prettyCss(css) {
  return css
    .replace(/\{/g, " {\n  ")
    .replace(/;/g, ";\n  ")
    .replace(/  \n  \}/g, "\n}")
    .replace(/\n  \n/g, "\n")
    .replace(/\}@/g, "}\n@")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function writePack(file, pack) {
  pack.css = prettyCss(pack.css);
  fs.writeFileSync(path.join(root, "themes", file), JSON.stringify(pack, null, 2) + "\n");
  console.log(file, pack.css.length, "css", (pack.html || "").length, "html");
}

const messageStyle = extractRawStyle(messageSrc, "const RAW_STYLE");
const mosaicStyle = extractRawStyle(mosaicSrc, "const STYLE =");
const FONTS =
  "https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@600;700;800&family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Mr+Dafoe&family=Oswald:wght@500;600;700&family=Outfit:wght@400;500;600&family=Syne:wght@600;700;800&display=swap";

function ticks() {
  let html = "";
  for (let i = 0; i < 52; i += 1) {
    const h = i % 5 === 4 ? 22 : 45 + ((i * 17) % 55);
    const ts = (0.55 + ((i * 13) % 35) / 100).toFixed(2);
    const td = (1.1 + ((i * 7) % 16) / 10).toFixed(2);
    const tdel = (-((i * 11) % 30) / 10).toFixed(2);
    html += `<div class="tick" style="--h:${h};--ts:${ts};--td:${td}s;--tdel:${tdel}s"></div>`;
  }
  return html;
}

function neonPath(inset) {
  const x = 92 + inset;
  const y = 92 + inset;
  const w = 516 - inset * 2;
  const h = 816 - inset * 2;
  const r = Math.max(18, 54 - inset * 0.15);
  return `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;
}

function neonTraces() {
  return [42, 24, 6, -11]
    .map((inset) => {
      const d = neonPath(inset);
      return `<g class="trace"><path class="tr glow2" d="${d}"/><path class="tr glow1" d="${d}"/><path class="tr core" d="${d}"/><path class="tr hot" d="${d}"/></g>`;
    })
    .join("");
}

const scoreboardExtra = `
#dyn-message-theme[data-theme="__ID__"] .led-text {
  font-family: Anton, "Arial Narrow", sans-serif;
  text-transform: uppercase;
  line-height: 0.92;
  color: var(--led-core);
  text-shadow:
    0 0 0.4cqh var(--primary),
    0 0 1.2cqh var(--led-glow),
    0 0 3cqh var(--led-haze);
}
#dyn-message-theme[data-theme="__ID__"].on .ticks .tick { opacity: 1; }
`;

writePack("tmpl-led-scoreboard.json", {
  format: "dynamic-backgrounds-theme",
  version: 1,
  kind: "message",
  id: "tmpl-led-scoreboard",
  label: "LED Scoreboard",
  fonts: FONTS,
  revealMs: 1200,
  hideMs: 220,
  settings: {
    primary: { label: "Primary", default: "#ffb300" },
    secondary: { label: "Secondary", default: "#22ff55" },
  },
  fit: [
    { box: ".msg-box", text: ".msg-box .led-text", max: 180, min: 28 },
    { box: ".name-row", text: ".name-row .led-text", max: 72, min: 20 },
  ],
  html:
    '<div class="dyn-stage">' +
    '<div class="frame">' +
    '<div class="glight h g-tl"></div><div class="glight h g-tr"></div>' +
    '<div class="glight h g-bl"></div><div class="glight h g-br"></div>' +
    '<div class="glight v g-l"></div><div class="glight v g-l2"></div>' +
    '<div class="glight v g-r"></div><div class="glight v g-r2"></div>' +
    '<div class="bolt tl"></div><div class="bolt tr"></div>' +
    '<div class="bolt bl"></div><div class="bolt br"></div>' +
    '<div class="bolt ml"></div><div class="bolt mr"></div>' +
    '<div class="bolt tm"></div><div class="bolt bm"></div>' +
    "</div>" +
    '<div class="board"><div class="idle-glow"></div><div class="content">' +
    '<div class="photo-panel"><div class="well"><img data-photo alt=""></div></div>' +
    '<div class="right">' +
    '<div class="msg-box"><span class="led-text" data-message></span></div>' +
    '<div class="name-row"><span class="led-text" data-name></span></div>' +
    `<div class="ticks">${ticks()}</div>` +
    "</div></div><div class=\"sheen\"></div></div></div>",
  css: applyId(extractThemeCss(messageStyle, "led-scoreboard") + scoreboardExtra, "tmpl-led-scoreboard"),
});

writePack("tmpl-neon-nightclub.json", {
  format: "dynamic-backgrounds-theme",
  version: 1,
  kind: "message",
  id: "tmpl-neon-nightclub",
  label: "Neon Nightclub",
  fonts: FONTS,
  revealMs: 1400,
  hideMs: 740,
  settings: {
    primary: { label: "Primary", default: "#35e0ff" },
    secondary: { label: "Secondary", default: "#ff3fa4" },
  },
  fit: [
    { box: ".msg-fit", text: ".msg-fit span", max: 235, min: 22 },
    { box: ".name-script", text: ".name-script span", max: 185, min: 30 },
  ],
  html:
    '<div class="dyn-stage">' +
    '<div class="lasers">' +
    '<div class="beam wide" style="--x:4cqw;--a:-26deg;--sweep:21s;"></div>' +
    '<div class="beam wide" style="--x:18cqw;--a:-52deg;--sweep:27s;animation-delay:-9s;"></div>' +
    '<div class="beam" style="--x:1cqw;--a:-14deg;--sweep:15s;"></div>' +
    '<div class="beam" style="--x:6cqw;--a:-24deg;--sweep:19s;animation-delay:-7s;"></div>' +
    '<div class="beam" style="--x:11cqw;--a:-35deg;--sweep:23s;animation-delay:-3s;"></div>' +
    '<div class="beam" style="--x:16cqw;--a:-47deg;--sweep:17s;animation-delay:-11s;"></div>' +
    '<div class="beam" style="--x:22cqw;--a:-58deg;--sweep:25s;animation-delay:-5s;"></div>' +
    '<div class="beam" style="--x:9cqw;--a:-66deg;--sweep:20s;animation-delay:-14s;"></div>' +
    "</div>" +
    '<div class="fog f1"></div><div class="fog f2"></div><div class="fog f3"></div>' +
    '<div class="fog f4"></div><div class="fog f5"></div>' +
    '<div class="photo-wrap">' +
    '<div class="photo-holder"><img data-photo alt="" draggable="false"></div>' +
    `<svg class="neon-frame-svg" viewBox="0 0 700 1000" aria-hidden="true">${neonTraces()}</svg>` +
    "</div>" +
    '<div class="panel">' +
    '<div class="msg-box"></div>' +
    '<div class="msg-fit"><span data-message></span></div>' +
    '<div class="name-script"><span data-name></span></div>' +
    "</div>" +
    '<div class="vignette"></div></div>',
  css: applyId(extractThemeCss(messageStyle, "neon-nightclub"), "tmpl-neon-nightclub"),
});

const liquidExtra = `
#dyn-message-theme[data-theme="__ID__"] .bubbles { position:absolute; inset:0; z-index:11; pointer-events:none; overflow:hidden; }
#dyn-message-theme[data-theme="__ID__"] .bubbles i {
  position:absolute; left:var(--bx); bottom:-8%;
  width:var(--bs); height:var(--bs); border-radius:50%;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.55), color-mix(in srgb, var(--primary) 55%, transparent) 42%, transparent 70%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.22), 0 0 18px color-mix(in srgb, var(--secondary) 35%, transparent);
  animation: tmpl-liq-rise var(--bdur, 14s) linear var(--bdel, 0s) infinite;
  opacity:.7;
}
@keyframes tmpl-liq-rise {
  0% { transform: translate3d(0, 0, 0) scale(.6); opacity:0; }
  12% { opacity:.75; }
  100% { transform: translate3d(var(--bdx, 4cqw), -118cqh, 0) scale(1.15); opacity:0; }
}
`;

function bubbles() {
  return [
    [8, 18, 16, 0, 3],
    [22, 12, 19, -4, 6],
    [36, 22, 13, 5, 2],
    [48, 10, 21, -2, 9],
    [61, 16, 15, 6, 4],
    [74, 11, 18, -5, 7],
    [86, 20, 12, 3, 1],
    [14, 9, 22, 4, 11],
    [55, 14, 17, -6, 5],
    [93, 8, 20, 2, 8],
  ]
    .map(
      ([x, s, dur, dx, del]) =>
        `<i style="--bx:${x}%;--bs:${s}px;--bdur:${dur}s;--bdx:${dx}cqw;--bdel:-${del}s"></i>`
    )
    .join("");
}

writePack("tmpl-liquid-glass.json", {
  format: "dynamic-backgrounds-theme",
  version: 1,
  kind: "message",
  id: "tmpl-liquid-glass",
  label: "Liquid Glass",
  fonts: FONTS,
  revealMs: 1300,
  hideMs: 690,
  settings: {
    primary: { label: "Bubbles", default: "#7ee8ff" },
    secondary: { label: "Highlight", default: "#4dffc3" },
    background: { label: "Background", default: "#061014" },
    motion: { label: "Motion", default: "drift" },
  },
  fit: [
    { box: ".msg-fit", text: ".msg-fit span", max: 250, min: 32 },
    { box: ".name-fit", text: ".name-fit span", max: 110, min: 28 },
  ],
  html:
    '<div class="dyn-stage">' +
    '<div class="wash"></div>' +
    `<div class="bubbles">${bubbles()}</div>` +
    '<div class="layout"><div class="slab"><div class="floater">' +
    '<div class="slab-glass"></div>' +
    '<div class="photo-well"><img data-photo alt="" draggable="false"></div>' +
    "</div></div></div>" +
    '<div class="copy">' +
    '<div class="msg-fit"><span data-message></span></div>' +
    '<div class="name-slot"><div class="name-fit"><span data-name></span></div></div>' +
    "</div></div>",
  css: applyId(extractThemeCss(messageStyle, "liquid-glass") + liquidExtra, "tmpl-liquid-glass"),
});

const ghosts = [
  { x: "4cqw", y: "8cqh", z: "-420px", ry: "28deg", op: 0.16, blur: "6px", dx: "5cqw", dy: "-3cqh", gd: 0.05, gdur: "24s" },
  { x: "78cqw", y: "10cqh", z: "-360px", ry: "-24deg", op: 0.18, blur: "5px", dx: "-4cqw", dy: "2cqh", gd: 0.12, gdur: "20s" },
  { x: "70cqw", y: "58cqh", z: "-280px", ry: "-16deg", op: 0.2, blur: "3px", dx: "-3cqw", dy: "-2cqh", gd: 0.18, gdur: "26s" },
  { x: "-2cqw", y: "52cqh", z: "-500px", ry: "32deg", op: 0.12, blur: "8px", dx: "6cqw", dy: "3cqh", gd: 0.08, gdur: "30s" },
  { x: "52cqw", y: "-6cqh", z: "-620px", ry: "10deg", op: 0.1, blur: "10px", dx: "3cqw", dy: "4cqh", gd: 0.22, gdur: "28s" },
  { x: "86cqw", y: "36cqh", z: "-180px", ry: "-30deg", op: 0.15, blur: "4px", dx: "-2cqw", dy: "-3cqh", gd: 0.15, gdur: "18s" },
];

writePack("tmpl-parallax-drift.json", {
  format: "dynamic-backgrounds-theme",
  version: 1,
  kind: "message",
  id: "tmpl-parallax-drift",
  label: "Parallax Drift",
  fonts: FONTS,
  revealMs: 1250,
  hideMs: 665,
  settings: {
    primary: { label: "Primary", default: "#ff4d8d" },
    secondary: { label: "Secondary", default: "#7a86ff" },
  },
  fit: [
    { box: ".msg-fit", text: ".msg-fit span", max: 280, min: 32 },
    { box: ".name-fit", text: ".name-fit span", max: 120, min: 28 },
  ],
  html:
    '<div class="dyn-stage">' +
    '<div class="bands">' +
    [8, 22, 38, 54, 70, 84]
      .map(
        (top, i) =>
          `<div class="band" style="top:${top}cqh;--band:${i % 2 ? "var(--secondary)" : "var(--primary)"};--dur:${22 + i * 3}s;--del:${-i * 4}s"></div>`
      )
      .join("") +
    "</div>" +
    '<div class="field">' +
    ghosts
      .map(
        (g) =>
          `<div class="ghost" style="--x:${g.x};--y:${g.y};--z:${g.z};--ry:${g.ry};--op:${g.op};--blur:${g.blur};--dx:${g.dx};--dy:${g.dy};--gd:${g.gd};--gdur:${g.gdur}"><img data-photo alt="" draggable="false"></div>`
      )
      .join("") +
    "</div>" +
    '<div class="hero"><div class="frame"><img data-photo alt="" draggable="false"></div></div>' +
    '<div class="haze" aria-hidden="true"><div class="haze-wash"></div><div class="haze-inner">' +
    '<div class="haze-msg"><span data-message></span></div>' +
    '<div class="haze-name"><span data-name></span></div>' +
    "</div></div>" +
    '<div class="plaque"><div class="plaque-inner">' +
    '<div class="msg-fit"><span data-message></span></div>' +
    '<div class="name-slot"><div class="name-fit"><span data-name></span></div></div>' +
    "</div></div>" +
    '<div class="vignette"></div></div>',
  css: applyId(extractThemeCss(messageStyle, "parallax-drift"), "tmpl-parallax-drift"),
});

const decksExtra = `
#dyn-mosaic-theme[data-theme="__ID__"] {
  background: radial-gradient(70% 50% at 50% 40%, #2a1c14, #0b0b0d 72%);
}
#dyn-mosaic-theme[data-theme="__ID__"].dyn-layout-row .dyn-custom-cards {
  justify-content: center;
  gap: 11%;
  padding: 8% 6% 16%;
  align-items: center;
}
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card {
  position: relative;
  flex: 0 0 16%;
  width: 16%;
  height: 58%;
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(0,0,0,.45);
}
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card:nth-child(3n+1) { transform: rotate(-9deg) translate(8px, 10px); z-index: 1; }
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card:nth-child(3n+2) { transform: rotate(2deg) translate(-2px, -4px); z-index: 2; }
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card:nth-child(3n) { transform: rotate(8deg) translate(-10px, 6px); z-index: 3; }
`;

writePack("tmpl-card-decks.json", {
  format: "dynamic-backgrounds-theme",
  version: 1,
  kind: "mosaic",
  id: "tmpl-card-decks",
  label: "Card decks",
  layout: "row",
  count: 9,
  interval: 2800,
  css: applyId(extractThemeCss(mosaicStyle, "decks") + decksExtra, "tmpl-card-decks"),
});

const polaroidExtra = `
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card {
  background: #fff;
  border-radius: 3px;
  padding: 10px 10px 28px;
  box-shadow: 0 6px 20px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.35);
  overflow: visible;
}
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card img {
  display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 1px; background: #222;
}
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card::after {
  content: "";
  position: absolute; left: 10px; right: 10px; bottom: 8px; height: 14px;
  background: linear-gradient(#f4f1ea, #e7e1d6);
}
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card:nth-child(3n+1) { animation: dyn-drop-in .55s cubic-bezier(.22,1.2,.36,1) both; }
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card:nth-child(3n+2) { animation: dyn-toss-in .5s cubic-bezier(.25,1.3,.5,1) both; }
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card:nth-child(3n) { animation: dyn-place-in .45s cubic-bezier(.34,1.56,.64,1) both; }
`;

writePack("tmpl-polaroid-wall.json", {
  format: "dynamic-backgrounds-theme",
  version: 1,
  kind: "mosaic",
  id: "tmpl-polaroid-wall",
  label: "Polaroid wall",
  layout: "scatter",
  count: 12,
  interval: 2600,
  css: applyId(extractThemeCss(mosaicStyle, "polaroid") + polaroidExtra, "tmpl-polaroid-wall"),
});

const liveExtra = `
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card {
  border-radius: 12px;
  background: #11141c;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.03);
  overflow: hidden;
}
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-card:nth-child(5n) { opacity: .2; filter: saturate(.7) brightness(.7); }
#dyn-mosaic-theme[data-theme="__ID__"] .dyn-live-vignette {
  position: absolute; inset: 0; pointer-events: none; z-index: 5;
  background: radial-gradient(120% 120% at 50% 50%, transparent 58%, rgba(0,0,0,.45) 100%);
}
`;

writePack("tmpl-live-mosaic.json", {
  format: "dynamic-backgrounds-theme",
  version: 1,
  kind: "mosaic",
  id: "tmpl-live-mosaic",
  label: "Live mosaic",
  layout: "grid",
  cols: 8,
  rows: 4,
  interval: 2200,
  html: '<div class="dyn-live-vignette"></div>',
  css: applyId(extractThemeCss(mosaicStyle, "livewall") + liveExtra, "tmpl-live-mosaic"),
});
