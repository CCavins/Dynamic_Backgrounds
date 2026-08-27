(function (root) {
  const STYLE = `
html.dyn-message-on .capture-content-layer,
html.dyn-message-on .message-layer {
  visibility: hidden !important;
}
html.dyn-message-on .v2-qr-tile,
html.dyn-message-on .qr-tile,
html.dyn-message-on .mosaic-layout > .asset-view {
  z-index: 6 !important;
}
#dyn-message-theme {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  box-sizing: border-box;
  overflow: hidden;
}
#dyn-message-theme,
#dyn-message-theme * { box-sizing: border-box; }
#dyn-message-theme .dyn-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* -------- LED Scoreboard -------- */
#dyn-message-theme[data-theme="led-scoreboard"] {
  --led-core: color-mix(in srgb, var(--primary) 70%, #fff);
  --led-edge: color-mix(in srgb, var(--primary) 55%, #3a1400);
  --led-glow: color-mix(in srgb, var(--primary) 70%, transparent);
  --led-haze: color-mix(in srgb, var(--primary) 30%, transparent);
  --grn: var(--secondary);
  --grn-core: color-mix(in srgb, var(--secondary) 60%, #fff);
  --grn-glow: color-mix(in srgb, var(--secondary) 55%, transparent);
}
#dyn-message-theme[data-theme="led-scoreboard"] .dyn-stage {
  background:
    radial-gradient(120% 90% at 50% -10%, rgba(255,255,255,.1), transparent 55%),
    linear-gradient(180deg, #3c3f43, #17181a 45%, #101113);
}
#dyn-message-theme[data-theme="led-scoreboard"] .led-content {
  position: absolute; inset: 4.5vh 3.2vw;
  display: flex; gap: 2.2vw; z-index: 2;
}
#dyn-message-theme[data-theme="led-scoreboard"] .led-photo {
  flex: none; width: 28vw; height: 100%;
  border-radius: 0.5vw; overflow: hidden;
  background: radial-gradient(circle at 40% 35%, #43474c, #101113 75%);
  box-shadow: inset 0 0 0 0.35vw #0a0b0c, 0 0 0 0.18vw #3a3d41;
  opacity: 0;
}
#dyn-message-theme[data-theme="led-scoreboard"] .led-photo img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: saturate(1.08) contrast(1.06);
}
#dyn-message-theme[data-theme="led-scoreboard"] .led-right {
  flex: 1; min-width: 0; display: flex; flex-direction: column;
}
#dyn-message-theme[data-theme="led-scoreboard"] .led-msg,
#dyn-message-theme[data-theme="led-scoreboard"] .led-name {
  display: flex; align-items: center; justify-content: center; overflow: hidden; opacity: 0;
}
#dyn-message-theme[data-theme="led-scoreboard"] .led-msg { flex: 1; min-height: 0; }
#dyn-message-theme[data-theme="led-scoreboard"] .led-name { flex: none; height: 15.5vh; margin-top: 0.8vh; }
#dyn-message-theme[data-theme="led-scoreboard"] .led-name.hidden { display: none; }
#dyn-message-theme[data-theme="led-scoreboard"] .led-matrix {
  display: block;
  filter: drop-shadow(0 0 0.35vh var(--primary)) drop-shadow(0 0 2.6vh var(--led-haze));
}
#dyn-message-theme[data-theme="led-scoreboard"] .led-ticks {
  flex: none; height: 5.6vh; margin-top: 1.6vh;
  display: flex; align-items: flex-end; gap: 0.18vw;
}
#dyn-message-theme[data-theme="led-scoreboard"] .led-tick {
  flex: 1; height: calc(var(--h) * 1%);
  background: linear-gradient(180deg, var(--led-core), var(--primary) 55%, var(--led-edge));
  box-shadow: 0 0 0.28vw var(--led-glow);
  opacity: 0; transform-origin: bottom;
}
#dyn-message-theme[data-theme="led-scoreboard"].on .led-photo {
  opacity: 1; animation: dynLedIn var(--reveal-ms) both ease;
}
#dyn-message-theme[data-theme="led-scoreboard"].on .led-msg {
  opacity: 1; animation: dynLedWipe calc(var(--reveal-ms) * .75) steps(14,end) both;
  animation-delay: calc(var(--reveal-ms) * .22);
}
#dyn-message-theme[data-theme="led-scoreboard"].on .led-name {
  opacity: 1; animation: dynLedWipe calc(var(--reveal-ms) * .5) steps(10,end) both;
  animation-delay: calc(var(--reveal-ms) * .55);
}
#dyn-message-theme[data-theme="led-scoreboard"].on .led-tick { opacity: 1; animation: dynTick 1.6s ease-in-out var(--tdel,0s) infinite alternate; }
#dyn-message-theme[data-theme="led-scoreboard"].off .led-photo,
#dyn-message-theme[data-theme="led-scoreboard"].off .led-msg,
#dyn-message-theme[data-theme="led-scoreboard"].off .led-name { opacity: 0 !important; animation: none !important; }
@keyframes dynLedIn { from { opacity: 0; filter: brightness(3); } to { opacity: 1; filter: none; } }
@keyframes dynLedWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes dynTick { to { transform: scaleY(var(--ts,.72)); } }

/* -------- Neon Nightclub -------- */
#dyn-message-theme[data-theme="neon-nightclub"] .dyn-stage {
  background:
    radial-gradient(80vw 60vh at 18% 88%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 60%),
    radial-gradient(70vw 50vh at 88% 8%, color-mix(in srgb, var(--secondary) 16%, transparent), transparent 55%),
    #05060c;
}
#dyn-message-theme[data-theme="neon-nightclub"] .neon-beam {
  position: absolute; top: -8%; left: var(--x); width: 2px; height: 130%;
  background: linear-gradient(to bottom, transparent, color-mix(in srgb, var(--primary) 55%, transparent), transparent);
  transform: rotate(var(--a)); opacity: .35; filter: blur(2px);
  animation: dynSweep var(--sweep) linear infinite;
}
#dyn-message-theme[data-theme="neon-nightclub"] .neon-fog {
  position: absolute; inset: auto -10% -18% -10%; height: 46%;
  background: radial-gradient(closest-side, rgba(198,210,232,.28), transparent 74%);
  filter: blur(18px); opacity: .45; animation: dynFog var(--dur,40s) ease-in-out infinite alternate;
}
#dyn-message-theme[data-theme="neon-nightclub"] .neon-photo {
  position: absolute; left: 7vw; top: 50%; height: 78vh; aspect-ratio: 3/4;
  transform: translateY(-50%); opacity: 0;
}
#dyn-message-theme[data-theme="neon-nightclub"] .neon-photo img {
  position: absolute; inset: 13%; width: calc(100% - 26%); height: calc(100% - 26%);
  object-fit: cover; border-radius: 2vw; display: block;
}
#dyn-message-theme[data-theme="neon-nightclub"] .neon-frame {
  position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible;
}
#dyn-message-theme[data-theme="neon-nightclub"] .neon-frame .tr { fill: none; stroke-linecap: round; stroke-linejoin: round; }
#dyn-message-theme[data-theme="neon-nightclub"] .neon-frame .trace:nth-child(-n+2) .core { stroke: var(--primary); }
#dyn-message-theme[data-theme="neon-nightclub"] .neon-frame .trace:nth-child(n+3) .core { stroke: var(--secondary); }
#dyn-message-theme[data-theme="neon-nightclub"] .neon-frame .glow2 { stroke: currentColor; stroke-width: 18; opacity: .12; filter: blur(8px); }
#dyn-message-theme[data-theme="neon-nightclub"] .neon-frame .glow1 { stroke: currentColor; stroke-width: 8; opacity: .35; filter: blur(3px); }
#dyn-message-theme[data-theme="neon-nightclub"] .neon-frame .core { stroke-width: 3.2; }
#dyn-message-theme[data-theme="neon-nightclub"] .neon-frame .hot { stroke: #fff; stroke-width: 1.1; opacity: .85; }
#dyn-message-theme[data-theme="neon-nightclub"] .neon-frame .trace:nth-child(-n+2) { color: var(--primary); }
#dyn-message-theme[data-theme="neon-nightclub"] .neon-frame .trace:nth-child(n+3) { color: var(--secondary); }
#dyn-message-theme[data-theme="neon-nightclub"] .neon-copy {
  position: absolute; right: 6vw; top: 50%; width: min(42vw,760px); height: 72vh;
  transform: translateY(-50%); display: flex; flex-direction: column; opacity: 0;
}
#dyn-message-theme[data-theme="neon-nightclub"] .neon-msg {
  flex: 1; min-height: 0; overflow: hidden; display: flex; align-items: center;
}
#dyn-message-theme[data-theme="neon-nightclub"] .neon-msg span {
  display: block; width: 100%;
  font-family: Anton, "Arial Narrow", sans-serif; text-transform: uppercase;
  line-height: .9; color: #fff; text-shadow: 0 0 18px var(--primary); overflow-wrap: anywhere;
}
#dyn-message-theme[data-theme="neon-nightclub"] .neon-name {
  flex: none; height: 14vh; display: flex; align-items: center;
  font-family: "Mr Dafoe", cursive; color: var(--secondary);
  text-shadow: 0 0 16px var(--secondary); white-space: nowrap;
}
#dyn-message-theme[data-theme="neon-nightclub"] .neon-copy.gone,
#dyn-message-theme[data-theme="neon-nightclub"] .neon-name.hidden { display: none; }
#dyn-message-theme[data-theme="neon-nightclub"].on .neon-photo { opacity: 1; animation: dynRise var(--reveal-ms) both cubic-bezier(.18,1,.28,1); }
#dyn-message-theme[data-theme="neon-nightclub"].on .neon-copy { opacity: 1; animation: dynRise calc(var(--reveal-ms) * .7) calc(var(--reveal-ms) * .2) both; }
#dyn-message-theme[data-theme="neon-nightclub"].off .neon-photo,
#dyn-message-theme[data-theme="neon-nightclub"].off .neon-copy { opacity: 0 !important; animation: none !important; }
@keyframes dynSweep { from { transform: rotate(var(--a)); } to { transform: rotate(calc(var(--a) + 8deg)); } }
@keyframes dynFog { from { transform: translateX(-4%); } to { transform: translateX(4%); } }
@keyframes dynRise { from { opacity: 0; transform: translateY(-46%) scale(.96); } to { opacity: 1; } }

/* -------- Ultras Tifo -------- */
#dyn-message-theme[data-theme="ultras-tifo"] .dyn-stage {
  background:
    radial-gradient(90vw 70vh at 50% 110%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 60%),
    #07080c;
}
#dyn-message-theme[data-theme="ultras-tifo"] .tifo-banner {
  position: absolute; left: 5vw; right: 5vw; top: 8vh; height: 84vh;
  background: color-mix(in srgb, var(--primary) 88%, #1a0608);
  box-shadow: 0 3vh 6vh rgba(0,0,0,.55);
  clip-path: polygon(1% 2%, 99% 0, 100% 98%, 0 100%);
  display: flex; gap: 3vw; padding: 4vh 3vw; opacity: 0;
}
#dyn-message-theme[data-theme="ultras-tifo"] .tifo-photo {
  flex: none; width: 28vw; height: 100%; overflow: hidden;
  box-shadow: 0 0 0 8px #0a0807;
}
#dyn-message-theme[data-theme="ultras-tifo"] .tifo-photo img {
  width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(1.1) contrast(1.08);
}
#dyn-message-theme[data-theme="ultras-tifo"] .tifo-copy {
  flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;
}
#dyn-message-theme[data-theme="ultras-tifo"] .tifo-lines { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; }
#dyn-message-theme[data-theme="ultras-tifo"] .tifo-line {
  font-family: Anton, sans-serif; text-transform: uppercase; line-height: .92;
  color: var(--secondary); letter-spacing: .01em; overflow-wrap: anywhere;
  transform: rotate(var(--rot,0deg));
  text-shadow: 0 2px 0 #0a0807;
}
#dyn-message-theme[data-theme="ultras-tifo"] .tifo-name {
  flex: none; height: 14vh; display: flex; align-items: center;
  font-family: Anton, sans-serif; text-transform: uppercase; color: var(--secondary);
  letter-spacing: .12em; white-space: nowrap;
}
#dyn-message-theme[data-theme="ultras-tifo"] .tifo-name.hidden { display: none; }
#dyn-message-theme[data-theme="ultras-tifo"] .tifo-smoke {
  position: absolute; inset: auto 0 0 0; height: 28%; pointer-events: none;
  background: radial-gradient(closest-side, rgba(225,220,214,.35), transparent 70%);
  filter: blur(20px); opacity: .5;
}
#dyn-message-theme[data-theme="ultras-tifo"].on .tifo-banner { opacity: 1; animation: dynTifoIn var(--reveal-ms) both cubic-bezier(.2,.9,.2,1); }
#dyn-message-theme[data-theme="ultras-tifo"].off .tifo-banner { opacity: 0 !important; animation: none !important; }
@keyframes dynTifoIn { from { opacity: 0; transform: translateY(4vh) rotate(-.6deg); } to { opacity: 1; transform: none; } }

/* -------- Holo Card -------- */
#dyn-message-theme[data-theme="holo-card"] .dyn-stage {
  background:
    radial-gradient(80vw 60vh at 20% 80%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 58%),
    radial-gradient(70vw 50vh at 90% 10%, color-mix(in srgb, var(--secondary) 16%, transparent), transparent 55%),
    #05040a;
}
#dyn-message-theme[data-theme="holo-card"] .holo-layout {
  position: absolute; inset: 0; display: flex; align-items: center; padding: 6vh 6vw; gap: 5vw;
}
#dyn-message-theme[data-theme="holo-card"] .holo-card {
  flex: none; height: 76vh; aspect-ratio: 3/4; position: relative; opacity: 0;
  transform: perspective(1400px) rotateY(12deg);
}
#dyn-message-theme[data-theme="holo-card"] .holo-well {
  position: absolute; inset: 0; border-radius: 1.4vw; overflow: hidden; background: #08070c;
  box-shadow: 0 3vh 7vh rgba(0,0,0,.55), 0 0 4vw color-mix(in srgb, var(--primary) 28%, transparent);
}
#dyn-message-theme[data-theme="holo-card"] .holo-well img { width: 100%; height: 100%; object-fit: cover; display: block; }
#dyn-message-theme[data-theme="holo-card"] .holo-foil {
  position: absolute; inset: 0; pointer-events: none; mix-blend-mode: color-dodge; opacity: .55;
  background: conic-gradient(from 140deg, var(--primary), var(--secondary), #fff, var(--primary));
  animation: dynFoil 8s linear infinite;
}
#dyn-message-theme[data-theme="holo-card"] .holo-copy {
  flex: 1; min-width: 0; height: 74vh; display: flex; flex-direction: column; justify-content: center; opacity: 0;
}
#dyn-message-theme[data-theme="holo-card"] .holo-msg {
  flex: 1; min-height: 0; overflow: hidden; display: flex; align-items: center;
}
#dyn-message-theme[data-theme="holo-card"] .holo-msg span {
  display: block; width: 100%;
  font-family: "Bebas Neue", "Arial Narrow", sans-serif; text-transform: uppercase; line-height: .88;
  background: linear-gradient(115deg, #fff, var(--primary), var(--secondary), #fff);
  background-size: 220% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: dynSheen 7s linear infinite; overflow-wrap: anywhere;
}
#dyn-message-theme[data-theme="holo-card"] .holo-name {
  flex: none; height: 14vh; display: flex; align-items: center;
  font-family: Outfit, sans-serif; letter-spacing: .16em; text-transform: uppercase;
  color: color-mix(in srgb, #fff 82%, var(--secondary)); white-space: nowrap;
}
#dyn-message-theme[data-theme="holo-card"] .holo-copy.gone,
#dyn-message-theme[data-theme="holo-card"] .holo-name.hidden { display: none; }
#dyn-message-theme[data-theme="holo-card"].on .holo-card { opacity: 1; animation: dynHoloIn var(--reveal-ms) both; }
#dyn-message-theme[data-theme="holo-card"].on .holo-copy { opacity: 1; animation: dynRise calc(var(--reveal-ms) * .7) calc(var(--reveal-ms) * .18) both; }
#dyn-message-theme[data-theme="holo-card"].off .holo-card,
#dyn-message-theme[data-theme="holo-card"].off .holo-copy { opacity: 0 !important; animation: none !important; }
@keyframes dynFoil { to { transform: rotate(20deg) scale(1.2); } }
@keyframes dynSheen { to { background-position: 100% 50%; } }
@keyframes dynHoloIn { from { opacity: 0; transform: perspective(1400px) rotateY(28deg) translateX(-3vw); } to { opacity: 1; transform: perspective(1400px) rotateY(12deg); } }

/* -------- Broadcast TV -------- */
#dyn-message-theme[data-theme="broadcast-tv"] .dyn-stage {
  display: flex; align-items: center; justify-content: center;
  background:
    radial-gradient(at 40% 40%, transparent, #a64c2f33),
    linear-gradient(transparent, #780d7c33), #2d313b;
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv {
  width: min(96vw, calc(96vh * 1.8)); height: min(96vh, calc(96vw / 1.8));
  border-radius: 2.4vh; display: flex; padding: 2vh; gap: 3vh;
  background: radial-gradient(circle at 100% 0, #d8d19d, #77533d, #2d313b);
  box-shadow: 0 0 0 1.4vh #2d313b, 0 0 4vh 1.2vh #000; opacity: 0;
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv-crt {
  flex: none; height: 100%; aspect-ratio: 4/3; border-radius: 3.2vh;
  border: 0.8vh solid #dad9b3; overflow: hidden; background: #0e1e2c;
  box-shadow: inset 0 0 2vh #000;
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv-crt img {
  width: 100%; height: 100%; object-fit: contain; display: block;
  filter: saturate(1.08) contrast(1.05) brightness(.96);
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv-side {
  flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end;
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv-news { display: flex; flex-direction: column; max-height: 42%; }
#dyn-message-theme[data-theme="broadcast-tv"] .tv-rule { height: 0.6vh; background: linear-gradient(90deg, var(--primary), var(--secondary)); }
#dyn-message-theme[data-theme="broadcast-tv"] .tv-head {
  padding: 1vh 1.2vh; background: linear-gradient(90deg, rgba(10,12,18,.92), rgba(10,12,18,.7));
  min-height: 0; overflow: hidden;
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv-head span {
  display: block; width: 100%;
  font-family: "Barlow Condensed", "Arial Narrow", sans-serif; font-weight: 800;
  text-transform: uppercase; line-height: .92; color: #f4f6f8; overflow-wrap: anywhere;
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv-slug {
  padding: 0.8vh 1.2vh; background: color-mix(in srgb, var(--secondary) 88%, #1a1408);
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv-slug span {
  display: block; font-family: Oswald, sans-serif; font-weight: 600;
  letter-spacing: .12em; text-transform: uppercase; color: #1a1408; white-space: nowrap;
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv-news.gone,
#dyn-message-theme[data-theme="broadcast-tv"] .tv-head.hidden,
#dyn-message-theme[data-theme="broadcast-tv"] .tv-slug.hidden { display: none; }
#dyn-message-theme[data-theme="broadcast-tv"].on .tv { opacity: 1; animation: dynTvIn var(--reveal-ms) both; }
#dyn-message-theme[data-theme="broadcast-tv"].off .tv { opacity: 0 !important; animation: none !important; }
@keyframes dynTvIn { from { opacity: 0; transform: translateY(1vh) scale(.985); } to { opacity: 1; transform: none; } }

/* -------- Liquid Glass -------- */
#dyn-message-theme[data-theme="liquid-glass"] .dyn-stage {
  background:
    radial-gradient(80vw 60vh at 18% 80%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 58%),
    radial-gradient(70vw 50vh at 88% 8%, color-mix(in srgb, var(--secondary) 16%, transparent), transparent 55%),
    linear-gradient(180deg, color-mix(in srgb, var(--background) 78%, #fff), var(--background) 52%, color-mix(in srgb, var(--background) 86%, #000));
}
#dyn-message-theme[data-theme="liquid-glass"] .liq-layout {
  position: absolute; inset: 0; display: flex; align-items: center; padding: 6vh 6vw;
}
#dyn-message-theme[data-theme="liquid-glass"] .liq-slab {
  height: 78vh; aspect-ratio: 3/4; position: relative; opacity: 0;
}
#dyn-message-theme[data-theme="liquid-glass"] .liq-glass {
  position: absolute; inset: 0; border-radius: 1.8vw;
  background: linear-gradient(160deg, rgba(255,255,255,.14), rgba(255,255,255,.03) 46%, rgba(255,255,255,.07));
  border: 1px solid rgba(255,255,255,.26);
  box-shadow: 0 2.2vh 5vh rgba(0,0,0,.4), 0 0 3.4vw color-mix(in srgb, var(--primary) 18%, transparent);
}
#dyn-message-theme[data-theme="liquid-glass"] .liq-well {
  position: absolute; inset: 4.6%; border-radius: 1.2vw; overflow: hidden; background: var(--background);
}
#dyn-message-theme[data-theme="liquid-glass"] .liq-well img { width: 100%; height: 100%; object-fit: cover; display: block; }
#dyn-message-theme[data-theme="liquid-glass"] .liq-copy {
  position: absolute; right: 5vw; top: 50%; width: min(46vw,820px); height: 74vh;
  transform: translateY(-50%); display: flex; flex-direction: column; opacity: 0;
}
#dyn-message-theme[data-theme="liquid-glass"] .liq-msg {
  flex: 1; min-height: 0; overflow: hidden; display: flex; align-items: center;
}
#dyn-message-theme[data-theme="liquid-glass"] .liq-msg span {
  display: block; width: 100%;
  font-family: "Cormorant Garamond", Georgia, serif; font-style: italic; font-weight: 500;
  line-height: 1.02; color: #f6fbff; text-shadow: 0 0 22px color-mix(in srgb, var(--primary) 50%, transparent);
  overflow-wrap: anywhere;
}
#dyn-message-theme[data-theme="liquid-glass"] .liq-name {
  flex: none; height: 16vh; margin-top: 3vh; padding-top: 2.3vh;
  border-top: 1px solid color-mix(in srgb, var(--primary) 32%, rgba(255,255,255,.16));
  display: flex; align-items: center;
  font-family: Outfit, sans-serif; letter-spacing: .16em; text-transform: uppercase;
  color: color-mix(in srgb, #fff 82%, var(--secondary)); white-space: nowrap;
}
#dyn-message-theme[data-theme="liquid-glass"] .liq-copy.gone,
#dyn-message-theme[data-theme="liquid-glass"] .liq-name.hidden { display: none; }
#dyn-message-theme[data-theme="liquid-glass"] .liq-bubbles { position: absolute; inset: 0; pointer-events: none; }
#dyn-message-theme[data-theme="liquid-glass"] .liq-bubble {
  position: absolute; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff, var(--primary) 42%, transparent 70%);
  opacity: .35; filter: blur(1px);
  animation: dynBubble var(--dur,10s) ease-in-out var(--del,0s) infinite;
}
#dyn-message-theme[data-theme="liquid-glass"][data-motion="slow"] .liq-bubble { animation-duration: 18s; }
#dyn-message-theme[data-theme="liquid-glass"][data-motion="drift"] .liq-bubble { animation-duration: 10s; }
#dyn-message-theme[data-theme="liquid-glass"][data-motion="fizz"] .liq-bubble { animation-name: dynFizz; animation-duration: 4.2s; }
#dyn-message-theme[data-theme="liquid-glass"].on .liq-slab { opacity: 1; animation: dynRise var(--reveal-ms) both; }
#dyn-message-theme[data-theme="liquid-glass"].on .liq-copy { opacity: 1; animation: dynRise calc(var(--reveal-ms) * .68) calc(var(--reveal-ms) * .24) both; }
#dyn-message-theme[data-theme="liquid-glass"].off .liq-slab,
#dyn-message-theme[data-theme="liquid-glass"].off .liq-copy { opacity: 0 !important; animation: none !important; }
@keyframes dynBubble { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(var(--dx,2vw), var(--dy,-3vh)) scale(1.15); } }
@keyframes dynFizz { from { transform: translateY(8vh) scale(.7); opacity: 0; } to { transform: translateY(-10vh) scale(1.1); opacity: 0; } }

/* -------- Parallax Drift -------- */
#dyn-message-theme[data-theme="parallax-drift"] .dyn-stage {
  background:
    radial-gradient(90vw 70vh at 80% 110%, color-mix(in srgb, var(--primary) 24%, transparent), transparent 60%),
    radial-gradient(80vw 60vh at 8% -8%, color-mix(in srgb, var(--secondary) 22%, transparent), transparent 58%),
    #07060c;
  perspective: 1400px;
}
#dyn-message-theme[data-theme="parallax-drift"] .para-band {
  position: absolute; left: -20%; width: 140%; height: 9vh;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 18%, transparent) 40%, transparent);
  filter: blur(10px); opacity: .45; animation: dynBand 28s linear infinite;
}
#dyn-message-theme[data-theme="parallax-drift"] .para-hero {
  position: absolute; left: 7vw; top: 50%; height: 78vh; aspect-ratio: 3/4;
  transform: translateY(-50%) rotateY(18deg) rotateX(4deg); opacity: 0;
}
#dyn-message-theme[data-theme="parallax-drift"] .para-frame {
  width: 100%; height: 100%; border-radius: 1.3vw; overflow: hidden; background: #0a0910;
  box-shadow: 0 3vh 7vh rgba(0,0,0,.55), 0 0 5vw color-mix(in srgb, var(--primary) 24%, transparent);
}
#dyn-message-theme[data-theme="parallax-drift"] .para-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
#dyn-message-theme[data-theme="parallax-drift"] .para-ghost {
  position: absolute; width: 16vw; height: 22vw; border-radius: .8vw; overflow: hidden; opacity: 0;
  transform: translate3d(var(--x), var(--y), var(--z)) rotateY(var(--ry,-18deg));
}
#dyn-message-theme[data-theme="parallax-drift"] .para-ghost img { width: 100%; height: 100%; object-fit: cover; display: block; }
#dyn-message-theme[data-theme="parallax-drift"] .para-copy {
  position: absolute; left: 44vw; right: 5vw; top: 50%; height: 74vh;
  transform: translateY(-50%); display: flex; flex-direction: column; justify-content: center; opacity: 0;
}
#dyn-message-theme[data-theme="parallax-drift"] .para-msg {
  flex: 1; min-height: 0; overflow: hidden; display: flex; align-items: center;
}
#dyn-message-theme[data-theme="parallax-drift"] .para-msg span {
  display: block; width: 100%;
  font-family: Anton, "Arial Narrow", sans-serif; text-transform: uppercase; line-height: .9; color: #fff;
  overflow-wrap: anywhere;
}
#dyn-message-theme[data-theme="parallax-drift"] .para-name {
  flex: none; height: 16vh; margin-top: 3.2vh; padding-top: 2.2vh;
  border-top: 3px solid color-mix(in srgb, var(--primary) 70%, transparent);
  display: flex; align-items: center;
  font-family: Syne, sans-serif; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  color: color-mix(in srgb, var(--secondary) 38%, #fff); white-space: nowrap;
}
#dyn-message-theme[data-theme="parallax-drift"] .para-copy.gone,
#dyn-message-theme[data-theme="parallax-drift"] .para-name.hidden { display: none; }
#dyn-message-theme[data-theme="parallax-drift"].on .para-hero { opacity: 1; animation: dynRise var(--reveal-ms) both; }
#dyn-message-theme[data-theme="parallax-drift"].on .para-copy { opacity: 1; animation: dynRise calc(var(--reveal-ms) * .7) calc(var(--reveal-ms) * .2) both; }
#dyn-message-theme[data-theme="parallax-drift"].on .para-ghost { opacity: var(--op,.18); animation: dynGhost 22s ease-in-out infinite alternate; }
#dyn-message-theme[data-theme="parallax-drift"].off .para-hero,
#dyn-message-theme[data-theme="parallax-drift"].off .para-copy { opacity: 0 !important; animation: none !important; }
@keyframes dynBand { from { transform: translateX(-12%); } to { transform: translateX(12%); } }
@keyframes dynGhost { to { transform: translate3d(calc(var(--x) + 4vw), calc(var(--y) - 2vh), var(--z)) rotateY(calc(var(--ry,-18deg) + 8deg)); } }
`;

  const FONTS =
    "https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@600;700;800&family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Mr+Dafoe&family=Oswald:wght@500;600;700&family=Outfit:wght@400;500;600&family=Syne:wght@600;700;800&display=swap";

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function fitText(containerEl, spanEl, maxPx, minPx) {
    if (!containerEl || !spanEl) return minPx || 10;
    const min = typeof minPx === "number" ? minPx : 10;
    let size = maxPx;
    spanEl.style.fontSize = size + "px";
    while (
      size > min &&
      (spanEl.scrollHeight > containerEl.clientHeight || spanEl.scrollWidth > containerEl.clientWidth + 1)
    ) {
      size -= 2;
      spanEl.style.fontSize = size + "px";
    }
    return size;
  }

  function applyVars(root, settings) {
    if (!root || !settings) return;
    root.style.setProperty("--primary", settings.primary);
    root.style.setProperty("--secondary", settings.secondary);
    root.style.setProperty("--reveal-ms", (settings.revealMs || 1000) + "ms");
    if (settings.background) root.style.setProperty("--background", settings.background);
    if (settings.motion) root.setAttribute("data-motion", settings.motion);
    else root.removeAttribute("data-motion");
  }

  function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    const n = parseInt(m ? m[1] : "ffb300", 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mixRgb(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];
  }

  function rgbStr(c, alpha) {
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (alpha == null ? 1 : alpha) + ")";
  }

  function makeLedSprites(pitch, dpr, primary) {
    const p = hexToRgb(primary);
    const WHITE = [255, 255, 255];
    const BLACK = [0, 0, 0];
    const s = Math.max(2, Math.ceil(pitch * dpr));
    const lit = document.createElement("canvas");
    lit.width = lit.height = s;
    let g = lit.getContext("2d");
    const r = s / 2;
    let grad = g.createRadialGradient(r, r, 0, r, r, r * 0.92);
    grad.addColorStop(0, rgbStr(mixRgb(p, WHITE, 0.72)));
    grad.addColorStop(0.34, rgbStr(mixRgb(p, WHITE, 0.22)));
    grad.addColorStop(0.6, rgbStr(p));
    grad.addColorStop(0.82, rgbStr(mixRgb(p, BLACK, 0.42)));
    grad.addColorStop(1, rgbStr(mixRgb(p, BLACK, 0.42), 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    const off = document.createElement("canvas");
    off.width = off.height = s;
    g = off.getContext("2d");
    grad = g.createRadialGradient(r, r, 0, r, r, r * 0.34);
    grad.addColorStop(0, rgbStr(mixRgb(p, BLACK, 0.68), 0.5));
    grad.addColorStop(0.8, rgbStr(mixRgb(p, BLACK, 0.72), 0.35));
    grad.addColorStop(1, rgbStr(mixRgb(p, BLACK, 0.72), 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return { lit, off };
  }

  function balanceLines(words, n) {
    const target = words.join(" ").length / n;
    const lines = [];
    let cur = "";
    words.forEach((w) => {
      if (cur && lines.length < n - 1 && cur.length + 1 + w.length > target * 1.12) {
        lines.push(cur);
        cur = w;
      } else {
        cur = cur ? cur + " " + w : w;
      }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  const measureCtx = document.createElement("canvas").getContext("2d");

  function renderMatrix(canvas, stage, text, maxLines, primary) {
    const box = canvas.parentNode;
    const w = box.clientWidth;
    const h = box.clientHeight;
    text = String(text || "").trim().toUpperCase();
    if (!w || !h || !text) {
      canvas.width = canvas.height = 0;
      canvas.style.width = canvas.style.height = "0px";
      return;
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pitch = Math.max(4, Math.round(stage.clientHeight * 0.0062));
    const cols = Math.max(4, Math.floor(w / pitch));
    const rows = Math.max(4, Math.floor(h / pitch));
    const words = text.split(/\s+/);
    measureCtx.font = '100px Anton, "Arial Narrow", sans-serif';
    let best = null;
    const maxN = Math.min(maxLines, words.length);
    for (let n = 1; n <= maxN; n += 1) {
      const lines = balanceLines(words, n);
      let widest = 1;
      lines.forEach((line) => {
        widest = Math.max(widest, measureCtx.measureText(line).width);
      });
      const size = Math.min((cols - 2) * 100 / widest, (rows / lines.length) * 0.78);
      if (!best || size > best.size) best = { lines, size };
    }
    const SS = 3;
    const raster = document.createElement("canvas");
    raster.width = cols * SS;
    raster.height = rows * SS;
    const rctx = raster.getContext("2d", { willReadFrequently: true });
    const fpx = best.size * SS;
    rctx.font = fpx.toFixed(2) + 'px Anton, "Arial Narrow", sans-serif';
    rctx.textAlign = "center";
    rctx.textBaseline = "middle";
    rctx.fillStyle = "#fff";
    const fatten = best.size >= 26;
    rctx.strokeStyle = "#fff";
    rctx.lineWidth = SS * 1.1;
    best.lines.forEach((line, l) => {
      const ty = rows * SS * ((l + 0.5) / best.lines.length) + fpx * 0.05;
      rctx.fillText(line, (cols * SS) / 2, ty);
      if (fatten) rctx.strokeText(line, (cols * SS) / 2, ty);
    });
    const ss = rctx.getImageData(0, 0, cols * SS, rows * SS).data;
    const alpha = new Float32Array(cols * rows);
    for (let rr = 0; rr < rows; rr += 1) {
      for (let cc = 0; cc < cols; cc += 1) {
        let sum = 0;
        for (let sy = 0; sy < SS; sy += 1) {
          for (let sx = 0; sx < SS; sx += 1) {
            sum += ss[(((rr * SS + sy) * cols * SS) + (cc * SS + sx)) * 4 + 3];
          }
        }
        alpha[rr * cols + cc] = sum / (SS * SS * 255);
      }
    }
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sprites = makeLedSprites(pitch, dpr, primary || "#ffb300");
    const xOff = (w - cols * pitch) / 2;
    const yOff = (h - rows * pitch) / 2;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const a = alpha[r * cols + c];
        const x = xOff + c * pitch;
        const y = yOff + r * pitch;
        if (a > 0.55) {
          ctx.globalAlpha = 0.66 + 0.34 * Math.min(1, (a - 0.55) / 0.4);
          ctx.drawImage(sprites.lit, x, y, pitch, pitch);
        } else {
          ctx.globalAlpha = 1;
          ctx.drawImage(sprites.off, x, y, pitch, pitch);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundedRectPoint(x, y, w, h, r, t) {
    const sw = w - 2 * r;
    const sh = h - 2 * r;
    const arc = (Math.PI * r) / 2;
    const per = 2 * sw + 2 * sh + 4 * arc;
    let d = (((t % 1) + 1) % 1) * per;
    if (d < sw) return { x: x + r + d, y };
    d -= sw;
    if (d < arc) {
      const a = -Math.PI / 2 + d / r;
      return { x: x + w - r + Math.cos(a) * r, y: y + r + Math.sin(a) * r };
    }
    d -= arc;
    if (d < sh) return { x: x + w, y: y + r + d };
    d -= sh;
    if (d < arc) {
      const a = d / r;
      return { x: x + w - r + Math.cos(a) * r, y: y + h - r + Math.sin(a) * r };
    }
    d -= arc;
    if (d < sw) return { x: x + w - r - d, y: y + h };
    d -= sw;
    if (d < arc) {
      const a = Math.PI / 2 + d / r;
      return { x: x + r + Math.cos(a) * r, y: y + h - r + Math.sin(a) * r };
    }
    d -= arc;
    if (d < sh) return { x, y: y + h - r - d };
    d -= sh;
    const a = Math.PI + d / r;
    return { x: x + r + Math.cos(a) * r, y: y + r + Math.sin(a) * r };
  }

  function wobblyRectPath(rect, inset, jitter, seed) {
    const x = rect.x - inset;
    const y = rect.y - inset;
    const w = rect.w + inset * 2;
    const h = rect.h + inset * 2;
    const r = Math.max(8, rect.r + inset * 0.4);
    const rand = mulberry32(seed);
    const steps = 48;
    let d = "";
    for (let i = 0; i <= steps; i += 1) {
      const p = roundedRectPoint(x, y, w, h, r, i / steps);
      const nx = (rand() - 0.5) * jitter;
      const ny = (rand() - 0.5) * jitter;
      d += (i === 0 ? "M" : "L") + (p.x + nx).toFixed(1) + " " + (p.y + ny).toFixed(1);
    }
    return d + "Z";
  }

  function splitLines(text, maxLines) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return balanceLines(words, Math.min(maxLines, words.length));
  }

  function commonShowPrep(root) {
    root.classList.remove("on", "off");
  }

  function hideTheme(root, revealMs) {
    root.classList.add("off");
    return wait(Math.max(180, Math.round((Number(revealMs) || 1000) * 0.42)));
  }

  const PHOTO_RECT = { x: 92, y: 92, w: 516, h: 816, r: 54 };

  const themes = {
    "led-scoreboard": {
      mount(root) {
        root.innerHTML =
          '<div class="dyn-stage">' +
            '<div class="led-content">' +
              '<div class="led-photo"><img alt=""></div>' +
              '<div class="led-right">' +
                '<div class="led-msg"><canvas class="led-matrix led-msg-canvas"></canvas></div>' +
                '<div class="led-name"><canvas class="led-matrix led-name-canvas"></canvas></div>' +
                '<div class="led-ticks"></div>' +
              "</div>" +
            "</div>" +
          "</div>";
        const ticks = root.querySelector(".led-ticks");
        for (let i = 0; i < 52; i += 1) {
          const t = document.createElement("div");
          t.className = "led-tick";
          t.style.setProperty("--h", String(i % 5 === 4 ? 22 : 45 + Math.round(Math.random() * 55)));
          t.style.setProperty("--ts", (0.55 + Math.random() * 0.35).toFixed(2));
          t.style.setProperty("--tdel", (Math.random() * -3).toFixed(2) + "s");
          ticks.appendChild(t);
        }
        return {
          photo: root.querySelector(".led-photo img"),
          nameRow: root.querySelector(".led-name"),
          msgCanvas: root.querySelector(".led-msg-canvas"),
          nameCanvas: root.querySelector(".led-name-canvas"),
          msgText: "",
          nameText: "",
          primary: "#ffb300",
        };
      },
      applySettings(root, state, settings) {
        applyVars(root, settings);
        state.primary = settings.primary;
        if (state.msgText || state.nameText) {
          renderMatrix(state.msgCanvas, root, state.msgText, 4, settings.primary);
          renderMatrix(state.nameCanvas, root, state.nameText, 1, settings.primary);
        }
      },
      async show(root, capture, state, settings) {
        commonShowPrep(root);
        state.photo.src = capture.src || "";
        state.msgText = capture.message || "";
        state.nameText = capture.name || "";
        state.nameRow.classList.toggle("hidden", !capture.name);
        await wait(30);
        renderMatrix(state.msgCanvas, root, state.msgText, 4, (settings && settings.primary) || state.primary);
        renderMatrix(state.nameCanvas, root, state.nameText, 1, (settings && settings.primary) || state.primary);
        root.classList.add("on");
      },
      hide(root, state, settings) {
        return hideTheme(root, settings && settings.revealMs);
      },
      unmount() {},
    },

    "neon-nightclub": {
      mount(root) {
        root.innerHTML =
          '<div class="dyn-stage">' +
            '<div class="neon-beam" style="--x:4vw;--a:-26deg;--sweep:21s;"></div>' +
            '<div class="neon-beam" style="--x:18vw;--a:-52deg;--sweep:27s;"></div>' +
            '<div class="neon-beam" style="--x:11vw;--a:-35deg;--sweep:23s;"></div>' +
            '<div class="neon-fog" style="--dur:46s;"></div>' +
            '<div class="neon-photo"><img alt=""><svg class="neon-frame" viewBox="0 0 700 1000"></svg></div>' +
            '<div class="neon-copy"><div class="neon-msg"><span></span></div><div class="neon-name"></div></div>' +
          "</div>";
        return {
          photo: root.querySelector(".neon-photo img"),
          frame: root.querySelector(".neon-frame"),
          copy: root.querySelector(".neon-copy"),
          msgFit: root.querySelector(".neon-msg"),
          msg: root.querySelector(".neon-msg span"),
          name: root.querySelector(".neon-name"),
        };
      },
      applySettings(root, _state, settings) {
        applyVars(root, settings);
      },
      async show(root, capture, state) {
        commonShowPrep(root);
        state.photo.src = capture.src || "";
        state.msg.textContent = capture.message || "";
        state.name.textContent = capture.name || "";
        const hasMsg = !!capture.message;
        const hasName = !!capture.name;
        state.copy.classList.toggle("gone", !hasMsg && !hasName);
        state.name.classList.toggle("hidden", !hasName);
        const traces = [
          { inset: 42, jitter: 13 },
          { inset: 24, jitter: 16 },
          { inset: 6, jitter: 13 },
          { inset: -11, jitter: 9 },
        ];
        state.frame.innerHTML = traces
          .map((t) => {
            const d = wobblyRectPath(PHOTO_RECT, t.inset, t.jitter, (Math.random() * 1e9) | 0);
            return `<g class="trace"><path class="tr glow2" d="${d}"/><path class="tr glow1" d="${d}"/><path class="tr core" d="${d}"/><path class="tr hot" d="${d}"/></g>`;
          })
          .join("");
        await wait(20);
        if (hasMsg) fitText(state.msgFit, state.msg, 220, 28);
        if (hasName) fitText(state.name, state.name, 92, 22);
        root.classList.add("on");
      },
      hide(root, state, settings) {
        return hideTheme(root, settings && settings.revealMs);
      },
      unmount() {},
    },

    "ultras-tifo": {
      mount(root) {
        root.innerHTML =
          '<div class="dyn-stage">' +
            '<div class="tifo-banner">' +
              '<div class="tifo-photo"><img alt=""></div>' +
              '<div class="tifo-copy"><div class="tifo-lines"></div><div class="tifo-name"></div></div>' +
            "</div>" +
            '<div class="tifo-smoke"></div>' +
          "</div>";
        return {
          photo: root.querySelector(".tifo-photo img"),
          lines: root.querySelector(".tifo-lines"),
          name: root.querySelector(".tifo-name"),
        };
      },
      applySettings(root, _state, settings) {
        applyVars(root, settings);
      },
      async show(root, capture, state) {
        commonShowPrep(root);
        state.photo.src = capture.src || "";
        state.name.textContent = capture.name || "";
        state.name.classList.toggle("hidden", !capture.name);
        const lines = splitLines(capture.message, 4);
        const rots = [-1.2, 0.8, -0.6, 0.9];
        state.lines.replaceChildren();
        lines.forEach((txt, i) => {
          const el = document.createElement("div");
          el.className = "tifo-line";
          el.style.setProperty("--rot", rots[i % rots.length] + "deg");
          el.textContent = txt;
          state.lines.appendChild(el);
        });
        await wait(20);
        [...state.lines.children].forEach((el) => fitText(el, el, lines.length === 1 ? 220 : 140, 26));
        if (capture.name) fitText(state.name, state.name, 96, 22);
        root.classList.add("on");
      },
      hide(root, state, settings) {
        return hideTheme(root, settings && settings.revealMs);
      },
      unmount() {},
    },

    "holo-card": {
      mount(root) {
        root.innerHTML =
          '<div class="dyn-stage"><div class="holo-layout">' +
            '<div class="holo-card"><div class="holo-well"><img alt=""></div><div class="holo-foil"></div></div>' +
            '<div class="holo-copy"><div class="holo-msg"><span></span></div><div class="holo-name"></div></div>' +
          "</div></div>";
        return {
          photo: root.querySelector(".holo-well img"),
          copy: root.querySelector(".holo-copy"),
          msgFit: root.querySelector(".holo-msg"),
          msg: root.querySelector(".holo-msg span"),
          name: root.querySelector(".holo-name"),
        };
      },
      applySettings(root, _state, settings) {
        applyVars(root, settings);
      },
      async show(root, capture, state) {
        commonShowPrep(root);
        state.photo.src = capture.src || "";
        state.msg.textContent = capture.message || "";
        state.name.textContent = capture.name || "";
        const hasMsg = !!capture.message;
        const hasName = !!capture.name;
        state.copy.classList.toggle("gone", !hasMsg && !hasName);
        state.name.classList.toggle("hidden", !hasName);
        await wait(20);
        if (hasMsg) fitText(state.msgFit, state.msg, 240, 32);
        if (hasName) fitText(state.name, state.name, 72, 20);
        root.classList.add("on");
      },
      hide(root, state, settings) {
        return hideTheme(root, settings && settings.revealMs);
      },
      unmount() {},
    },

    "broadcast-tv": {
      mount(root) {
        root.innerHTML =
          '<div class="dyn-stage"><div class="tv">' +
            '<div class="tv-crt"><img alt=""></div>' +
            '<div class="tv-side"><div class="tv-news">' +
              '<div class="tv-rule"></div>' +
              '<div class="tv-head"><span></span></div>' +
              '<div class="tv-slug"><span></span></div>' +
            "</div></div>" +
          "</div></div>";
        return {
          photo: root.querySelector(".tv-crt img"),
          news: root.querySelector(".tv-news"),
          head: root.querySelector(".tv-head"),
          headSpan: root.querySelector(".tv-head span"),
          slug: root.querySelector(".tv-slug"),
          slugSpan: root.querySelector(".tv-slug span"),
        };
      },
      applySettings(root, _state, settings) {
        applyVars(root, settings);
      },
      async show(root, capture, state) {
        commonShowPrep(root);
        state.photo.src = capture.src || "";
        state.headSpan.textContent = capture.message || "";
        state.slugSpan.textContent = capture.name || "";
        const hasMsg = !!capture.message;
        const hasName = !!capture.name;
        state.news.classList.toggle("gone", !hasMsg && !hasName);
        state.head.classList.toggle("hidden", !hasMsg);
        state.slug.classList.toggle("hidden", !hasName);
        await wait(20);
        if (hasMsg) fitText(state.head, state.headSpan, 72, 18);
        if (hasName) fitText(state.slug, state.slugSpan, 28, 14);
        root.classList.add("on");
      },
      hide(root, state, settings) {
        return hideTheme(root, settings && settings.revealMs);
      },
      unmount() {},
    },

    "liquid-glass": {
      mount(root) {
        root.innerHTML =
          '<div class="dyn-stage"><div class="liq-bubbles"></div><div class="liq-layout">' +
            '<div class="liq-slab"><div class="liq-glass"></div><div class="liq-well"><img alt=""></div></div>' +
          '</div><div class="liq-copy"><div class="liq-msg"><span></span></div><div class="liq-name"></div></div></div>';
        const host = root.querySelector(".liq-bubbles");
        for (let i = 0; i < 18; i += 1) {
          const b = document.createElement("div");
          b.className = "liq-bubble";
          const size = 18 + Math.random() * 70;
          b.style.width = b.style.height = size + "px";
          b.style.left = Math.random() * 100 + "%";
          b.style.top = Math.random() * 100 + "%";
          b.style.setProperty("--dx", ((Math.random() - 0.5) * 8).toFixed(1) + "vw");
          b.style.setProperty("--dy", ((Math.random() - 0.5) * 8).toFixed(1) + "vh");
          b.style.setProperty("--dur", (7 + Math.random() * 10).toFixed(1) + "s");
          b.style.setProperty("--del", (-Math.random() * 8).toFixed(1) + "s");
          host.appendChild(b);
        }
        return {
          photo: root.querySelector(".liq-well img"),
          copy: root.querySelector(".liq-copy"),
          msgFit: root.querySelector(".liq-msg"),
          msg: root.querySelector(".liq-msg span"),
          name: root.querySelector(".liq-name"),
        };
      },
      applySettings(root, _state, settings) {
        applyVars(root, settings);
      },
      async show(root, capture, state) {
        commonShowPrep(root);
        state.photo.src = capture.src || "";
        state.msg.textContent = capture.message || "";
        state.name.textContent = capture.name || "";
        const hasMsg = !!capture.message;
        const hasName = !!capture.name;
        state.copy.classList.toggle("gone", !hasMsg && !hasName);
        state.name.classList.toggle("hidden", !hasName);
        await wait(20);
        if (hasMsg) fitText(state.msgFit, state.msg, 220, 28);
        if (hasName) fitText(state.name, state.name, 64, 18);
        root.classList.add("on");
      },
      hide(root, state, settings) {
        return hideTheme(root, settings && settings.revealMs);
      },
      unmount() {},
    },

    "parallax-drift": {
      mount(root) {
        const ghosts = [
          { x: "4vw", y: "8vh", z: "-420px", ry: "28deg", op: 0.16 },
          { x: "78vw", y: "10vh", z: "-360px", ry: "-24deg", op: 0.18 },
          { x: "70vw", y: "58vh", z: "-280px", ry: "-16deg", op: 0.2 },
          { x: "-2vw", y: "52vh", z: "-500px", ry: "32deg", op: 0.12 },
        ];
        root.innerHTML =
          '<div class="dyn-stage">' +
            '<div class="para-band" style="top:18%;"></div><div class="para-band" style="top:62%;animation-delay:-8s;"></div>' +
            ghosts
              .map(
                (g) =>
                  `<div class="para-ghost" style="--x:${g.x};--y:${g.y};--z:${g.z};--ry:${g.ry};--op:${g.op}"><img alt=""></div>`
              )
              .join("") +
            '<div class="para-hero"><div class="para-frame"><img alt=""></div></div>' +
            '<div class="para-copy"><div class="para-msg"><span></span></div><div class="para-name"></div></div>' +
          "</div>";
        return {
          photo: root.querySelector(".para-frame img"),
          ghosts: [...root.querySelectorAll(".para-ghost img")],
          copy: root.querySelector(".para-copy"),
          msgFit: root.querySelector(".para-msg"),
          msg: root.querySelector(".para-msg span"),
          name: root.querySelector(".para-name"),
        };
      },
      applySettings(root, _state, settings) {
        applyVars(root, settings);
      },
      async show(root, capture, state) {
        commonShowPrep(root);
        state.photo.src = capture.src || "";
        state.ghosts.forEach((img) => {
          img.src = capture.src || "";
        });
        state.msg.textContent = capture.message || "";
        state.name.textContent = capture.name || "";
        const hasMsg = !!capture.message;
        const hasName = !!capture.name;
        state.copy.classList.toggle("gone", !hasMsg && !hasName);
        state.name.classList.toggle("hidden", !hasName);
        await wait(20);
        if (hasMsg) fitText(state.msgFit, state.msg, 240, 32);
        if (hasName) fitText(state.name, state.name, 72, 20);
        root.classList.add("on");
      },
      hide(root, state, settings) {
        return hideTheme(root, settings && settings.revealMs);
      },
      unmount() {},
    },
  };

  root.BGMessageThemes = { STYLE, FONTS, themes };
})(typeof globalThis !== "undefined" ? globalThis : window);
