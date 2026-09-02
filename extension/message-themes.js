(function (root) {
  // Faithful ports of the Vixi message templates (output-api/message-templates).
  // Each theme keeps the original DOM structure, CSS, fonts, reveal/idle/exit
  // animations and fitText caps.
  //
  // Scaling model: every theme renders inside a design-space stage whose
  // long edge is 1920. Auto matches the window; forced ratios use that ratio.
  // The stage is uniformly transform-scaled to fill the canvas. Viewport units
  // in the original CSS are converted to container units (cqh/cqw) against that
  // stage, and text is fitted once in design pixels. Text, photo and chrome all
  // scale together, and words are never broken mid-word: the fitter shrinks the
  // font until the longest word fits instead.
  const RAW_STYLE = `
html.dyn-message-on .capture-content-layer,
html.dyn-message-on .message-layer {
  visibility: hidden !important;
  opacity: 0 !important;
}
html.dyn-message-on .v2-qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *),
html.dyn-message-on .qr-tile:not(.dyn-brand-clone):not(#dyn-theme-host *),
html.dyn-message-on .qr-code-wrapper:not(.dyn-brand-clone):not(#dyn-theme-host *),
html.dyn-message-on .qr-code-img:not(.dyn-brand-clone):not(#dyn-theme-host *),
html.dyn-message-on .v2-logo:not(.dyn-brand-clone):not(#dyn-theme-host *),
html.dyn-message-on .v2-logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *),
html.dyn-message-on .event-logo:not(.dyn-brand-clone):not(#dyn-theme-host *),
html.dyn-message-on .logo-tile:not(.dyn-brand-clone):not(#dyn-theme-host *),
html.dyn-message-on .mosaic-layout > .asset-view:not(#dyn-theme-host *) {
  visibility: hidden !important;
  opacity: 0 !important;
}
#dyn-message-theme {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  box-sizing: border-box;
  overflow: hidden;
  background: #05050c;
}
#dyn-message-theme.dyn-awaiting-show {
  visibility: visible !important;
  opacity: 1 !important;
}
html.dyn-show-bg #dyn-message-theme:not(.on) {
  visibility: visible !important;
  opacity: 1 !important;
  background: transparent !important;
}
/* Custom selected background: hide the whole stage so #dyn-bg-media shows. */
html.dyn-show-bg #dyn-message-theme:not(.on) > *:not(#dyn-bg-media):not(#dyn-bg-embed):not(.dyn-brand-chrome),
#dyn-message-theme.dyn-awaiting-show.dyn-show-bg > *:not(#dyn-bg-media):not(#dyn-bg-embed):not(.dyn-brand-chrome) {
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
/* Back-to-back / first paint: keep wall, TV, grain, scraps. Hide guest layers. */
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .photo-paste,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .msg-paste,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .name-stamp,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .program,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .news,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .well,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .photo-panel,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .msg-box,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .name-row,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .photo-holder,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .name-script,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .copy,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .hero,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .plaque,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .slab,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) .rig,
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) [data-photo],
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) [data-message],
#dyn-message-theme.dyn-awaiting-show:not(.dyn-show-bg) [data-name] {
  visibility: hidden !important;
  opacity: 0 !important;
}
#dyn-message-theme.dyn-keep-chrome.off .wall,
#dyn-message-theme.dyn-keep-chrome.off .scrap,
#dyn-message-theme.dyn-keep-chrome.off .grain,
#dyn-message-theme.dyn-keep-chrome.off .tv,
#dyn-message-theme.dyn-keep-chrome.off .dyn-stage {
  opacity: 1 !important;
  visibility: visible !important;
  animation: none !important;
}
#dyn-message-theme[data-theme="message-grunge-poster"] .wall {
  background-color: #3a322c;
}
#dyn-message-theme[data-theme="message-grunge-poster"].on:not(.off).dyn-grunge-paste-lock .photo-paste,
#dyn-message-theme[data-theme="message-grunge-poster"].on:not(.off).dyn-grunge-paste-lock .msg-paste,
#dyn-message-theme[data-theme="message-grunge-poster"].on:not(.off).dyn-grunge-paste-lock .name-stamp {
  opacity: 1 !important;
}
#dyn-message-theme,
#dyn-message-theme * { box-sizing: border-box; }
#dyn-message-theme .dyn-fit-stage {
  position: absolute;
  transform-origin: top left;
  container-type: size;
  overflow: hidden;
}
#dyn-message-theme .dyn-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
#dyn-message-theme img { pointer-events: none; }

/* ================================================================
   LED SCOREBOARD
   ================================================================ */
#dyn-message-theme[data-theme="led-scoreboard"] {
  --led-core:  color-mix(in srgb, var(--primary) 70%, #ffffff);
  --led-edge:  color-mix(in srgb, var(--primary) 55%, #3a1400);
  --led-glow:  color-mix(in srgb, var(--primary) 70%, transparent);
  --led-haze:  color-mix(in srgb, var(--primary) 30%, transparent);
  --led-off:   color-mix(in srgb, var(--primary) 12%, #0a0804);
  --grn:       var(--secondary);
  --grn-core:  color-mix(in srgb, var(--secondary) 60%, #ffffff);
  --grn-glow:  color-mix(in srgb, var(--secondary) 55%, transparent);
  --grn-haze:  color-mix(in srgb, var(--secondary) 25%, transparent);
  --grn-dark:  color-mix(in srgb, var(--secondary) 35%, #01130a);
  background: #000;
}
#dyn-message-theme[data-theme="led-scoreboard"] .frame {
  position: absolute; inset: 0; z-index: 1;
  background:
    radial-gradient(120% 90% at 50% -10%, rgba(255,255,255,0.10), transparent 55%),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.028) 0 2px, transparent 2px 7px),
    repeating-linear-gradient(0deg, rgba(0,0,0,0.20) 0 3px, transparent 3px 9px),
    linear-gradient(180deg, #3c3f43 0%, #26282b 12%, #17181a 45%, #202225 78%, #101113 100%);
}
#dyn-message-theme[data-theme="led-scoreboard"] .frame::before {
  content: '';
  position: absolute; left: 0; right: 0; top: 0; height: 1vh;
  background: linear-gradient(180deg, rgba(255,255,255,0.14), transparent);
}
#dyn-message-theme[data-theme="led-scoreboard"] .bolt {
  position: absolute; z-index: 2;
  width: 1.75vw; height: 1.75vw; border-radius: 50%;
  background:
    radial-gradient(circle at 34% 30%, #8d939a 0%, #55595e 34%, #26282b 72%, #0c0d0e 100%);
  box-shadow:
    0 0.25vh 0.5vh rgba(0,0,0,0.8),
    inset 0 -0.15vh 0.3vh rgba(0,0,0,0.7),
    inset 0 0.12vh 0.2vh rgba(255,255,255,0.35);
}
#dyn-message-theme[data-theme="led-scoreboard"] .bolt::after {
  content: '';
  position: absolute; inset: 27%;
  background: radial-gradient(circle at 40% 35%, #43474c, #101113 75%);
  clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
}
#dyn-message-theme[data-theme="led-scoreboard"] .bolt.tl { top: 1.15vh; left: 0.75vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .bolt.tr { top: 1.15vh; right: 0.75vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .bolt.bl { bottom: 1.15vh; left: 0.75vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .bolt.br { bottom: 1.15vh; right: 0.75vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .bolt.ml { top: 48.5%; left: 0.62vw; width: 1.5vw; height: 1.5vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .bolt.mr { top: 48.5%; right: 0.62vw; width: 1.5vw; height: 1.5vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .bolt.tm { top: 1.3vh; left: 49.4%; width: 1.5vw; height: 1.5vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .bolt.bm { bottom: 1.3vh; left: 49.4%; width: 1.5vw; height: 1.5vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .glight {
  position: absolute; z-index: 2;
  border-radius: 0.6vw;
  background:
    linear-gradient(180deg,
      color-mix(in srgb, var(--grn-core) 90%, transparent) 0%,
      var(--grn) 45%,
      color-mix(in srgb, var(--grn) 70%, #003311) 100%);
  box-shadow:
    0 0 0.9vw var(--grn-glow),
    0 0 2.4vw var(--grn-haze),
    inset 0 0 0.35vw color-mix(in srgb, var(--grn-core) 80%, transparent),
    inset 0 -0.18vh 0.2vh rgba(0,0,0,0.45);
  animation: dynLedGlight 5.2s ease-in-out infinite;
}
#dyn-message-theme[data-theme="led-scoreboard"] .glight::before {
  content: '';
  position: absolute; inset: -0.55vh -0.3vw;
  border-radius: 0.8vw;
  background: transparent;
  box-shadow: inset 0 0 0 0.14vw rgba(0,0,0,0.85), inset 0 0.2vh 0.4vh rgba(0,0,0,0.8);
  z-index: -1;
}
#dyn-message-theme[data-theme="led-scoreboard"] .glight.h { height: 1.35vh; }
#dyn-message-theme[data-theme="led-scoreboard"] .glight.v { width: 0.7vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .glight.g-tl { top: 1.85vh; left: 5.5vw;  width: 12vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .glight.g-tr { top: 1.85vh; right: 13vw;  width: 12vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .glight.g-bl { bottom: 1.85vh; left: 5.5vw;  width: 12vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .glight.g-br { bottom: 1.85vh; right: 5.5vw; width: 12vw; }
#dyn-message-theme[data-theme="led-scoreboard"] .glight.g-l  { left: 1.05vw; top: 24vh; height: 20vh; }
#dyn-message-theme[data-theme="led-scoreboard"] .glight.g-l2 { left: 1.05vw; bottom: 24vh; height: 20vh; }
#dyn-message-theme[data-theme="led-scoreboard"] .glight.g-r  { right: 1.05vw; top: 24vh; height: 20vh; }
#dyn-message-theme[data-theme="led-scoreboard"] .glight.g-r2 { right: 1.05vw; bottom: 24vh; height: 20vh; }
@keyframes dynLedGlight {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(0.86); }
}
#dyn-message-theme[data-theme="led-scoreboard"] .board {
  position: absolute; z-index: 10;
  inset: 5.4vh 3.1vw;
  border-radius: 0.75vw;
  background:
    radial-gradient(130% 100% at 50% 0%, rgba(255,255,255,0.05), transparent 40%),
    radial-gradient(circle, #161512 12%, transparent 13%) 0 0 / 0.42vw 0.42vw,
    linear-gradient(180deg, #0a0a09, #050505 55%, #080807);
  overflow: hidden;
  box-shadow:
    0 0 0 0.16vw #000,
    0 0 0 0.34vw #3a3d41,
    0 0.25vh 0 0.36vw rgba(255,255,255,0.12),
    0 0 2.4vw 0.4vw rgba(0,0,0,0.85),
    inset 0 0 3vw rgba(0,0,0,0.9);
}
#dyn-message-theme[data-theme="led-scoreboard"] .board::after {
  content: '';
  position: absolute; inset: 0; z-index: 60;
  pointer-events: none;
  background:
    radial-gradient(90% 130% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%);
}
#dyn-message-theme[data-theme="led-scoreboard"] .idle-glow {
  position: absolute; inset: 0; z-index: 12; pointer-events: none;
  background:
    radial-gradient(circle, var(--led-haze) 16%, transparent 24%) 0 0 / 1.9vh 1.9vh;
  animation: dynLedIdle 5.5s ease-in-out infinite;
}
@keyframes dynLedIdle {
  0%, 100% { opacity: 0.05; }
  50%      { opacity: 0.12; }
}
#dyn-message-theme[data-theme="led-scoreboard"] .sheen {
  position: absolute; z-index: 55; left: -5%; width: 110%;
  top: -30%; height: 18%;
  background: linear-gradient(180deg, transparent, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 55%, transparent);
  animation: dynLedSheen 9s linear infinite;
  pointer-events: none;
}
@keyframes dynLedSheen {
  0%   { transform: translateY(0); }
  100% { transform: translateY(720%); }
}
#dyn-message-theme[data-theme="led-scoreboard"] .content {
  position: absolute; inset: 0; z-index: 20;
  display: flex;
  padding: 3.4vh 1.9vw;
  gap: 2vw;
}
#dyn-message-theme[data-theme="led-scoreboard"] .photo-panel {
  position: relative;
  width: 31.5vw;
  height: 100%;
  flex: none;
  border-radius: 0.8vw;
  padding: 0.42vw;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--grn-core) 85%, transparent),
    var(--grn) 40%,
    color-mix(in srgb, var(--grn) 62%, #002211));
  box-shadow:
    0 0 1.1vw var(--grn-glow),
    0 0 3vw var(--grn-haze),
    0 0 0 0.16vw rgba(0,0,0,0.9),
    0 0 0 0.3vw #212327,
    inset 0 0 0.5vw color-mix(in srgb, var(--grn-core) 70%, transparent);
  opacity: 0;
}
#dyn-message-theme[data-theme="led-scoreboard"] .photo-panel .well {
  width: 100%; height: 100%;
  border-radius: 0.5vw;
  overflow: hidden;
  background: #020302;
  box-shadow: inset 0 0 0 0.12vw rgba(0,0,0,0.9);
}
#dyn-message-theme[data-theme="led-scoreboard"] .photo-panel img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
#dyn-message-theme[data-theme="led-scoreboard"].on .photo-panel {
  animation: dynLedPower calc(var(--reveal-ms) * 0.85) steps(1, end) forwards;
}
@keyframes dynLedPower {
  0%   { opacity: 0; }
  12%  { opacity: 0.55; }
  20%  { opacity: 0.08; }
  34%  { opacity: 0.85; }
  44%  { opacity: 0.25; }
  58%  { opacity: 1; }
  70%  { opacity: 0.75; }
  100% { opacity: 1; }
}
#dyn-message-theme[data-theme="led-scoreboard"] .right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0.4vw;
}
#dyn-message-theme[data-theme="led-scoreboard"] .matrix {
  display: block;
  filter:
    drop-shadow(0 0 0.35vh var(--primary))
    drop-shadow(0 0 0.9vh var(--led-glow))
    drop-shadow(0 0 2.6vh var(--led-haze));
}
#dyn-message-theme[data-theme="led-scoreboard"].held .matrix { animation: dynLedBreath 5.5s ease-in-out infinite; }
@keyframes dynLedBreath {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.93; }
}
#dyn-message-theme[data-theme="led-scoreboard"] .msg-box {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  position: relative;
}
#dyn-message-theme[data-theme="led-scoreboard"] .name-row {
  flex: none;
  height: 15.5vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  margin-top: 0.8vh;
}
#dyn-message-theme[data-theme="led-scoreboard"] .name-row.hidden { display: none; }
#dyn-message-theme[data-theme="led-scoreboard"] .msg-box,
#dyn-message-theme[data-theme="led-scoreboard"] .name-row { opacity: 0; }
#dyn-message-theme[data-theme="led-scoreboard"].on .msg-box {
  opacity: 1;
  animation: dynLedWipe calc(var(--reveal-ms) * 0.75) steps(14, end) both;
  animation-delay: calc(var(--reveal-ms) * 0.22);
}
#dyn-message-theme[data-theme="led-scoreboard"].on .name-row {
  opacity: 1;
  animation: dynLedWipe calc(var(--reveal-ms) * 0.5) steps(10, end) both;
  animation-delay: calc(var(--reveal-ms) * 0.55);
}
@keyframes dynLedWipe {
  0%   { clip-path: inset(0 100% 0 0); }
  100% { clip-path: inset(0 0 0 0); }
}
#dyn-message-theme[data-theme="led-scoreboard"] .ticks {
  flex: none;
  height: 5.6vh;
  margin-top: 1.6vh;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.18vw;
  padding: 0 0.2vw;
}
#dyn-message-theme[data-theme="led-scoreboard"] .tick {
  flex: 1;
  height: calc(var(--h) * 1%);
  border-radius: 0.12vw;
  background: linear-gradient(180deg, var(--led-core), var(--primary) 55%, var(--led-edge));
  box-shadow:
    0 0 0.28vw var(--led-glow),
    0 0 0.8vw var(--led-haze);
  opacity: 0;
  transform-origin: bottom;
  transition: opacity 0.12s linear var(--d, 0s);
}
#dyn-message-theme[data-theme="led-scoreboard"].ticks-live .tick {
  opacity: 1;
  animation: dynLedTick var(--td, 1.6s) ease-in-out var(--tdel, 0s) infinite alternate;
}
@keyframes dynLedTick {
  0%   { transform: scaleY(1); }
  100% { transform: scaleY(var(--ts, 0.72)); }
}
#dyn-message-theme[data-theme="led-scoreboard"].on.off .photo-panel,
#dyn-message-theme[data-theme="led-scoreboard"].on.off .msg-box,
#dyn-message-theme[data-theme="led-scoreboard"].on.off .name-row {
  animation: none !important;
  transition: opacity 0.16s steps(3, end), filter 0.16s linear !important;
  opacity: 0 !important;
  filter: brightness(3);
}

/* ================================================================
   NEON NIGHTCLUB
   ================================================================ */
#dyn-message-theme[data-theme="neon-nightclub"] {
  --off-ms: 680ms;
  --p-hot:  color-mix(in srgb, var(--primary) 45%, white);
  --p-soft: color-mix(in srgb, var(--primary) 55%, transparent);
  --p-haze: color-mix(in srgb, var(--primary) 28%, transparent);
  --s-hot:  color-mix(in srgb, var(--secondary) 42%, white);
  --s-soft: color-mix(in srgb, var(--secondary) 55%, transparent);
  --s-haze: color-mix(in srgb, var(--secondary) 28%, transparent);
  background: #000;
}
#dyn-message-theme[data-theme="neon-nightclub"] .dyn-stage {
  background:
    radial-gradient(110vw 60vh at 30% 106%, rgba(46, 78, 120, .28), transparent 62%),
    radial-gradient(90vw 55vh at 80% 108%, rgba(70, 48, 110, .20), transparent 60%),
    radial-gradient(120vw 80vh at 70% -20%, rgba(20, 30, 60, .35), transparent 60%),
    linear-gradient(180deg, #04060e 0%, #060a18 60%, #081020 100%);
}
#dyn-message-theme[data-theme="neon-nightclub"] .lasers { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
#dyn-message-theme[data-theme="neon-nightclub"] .beam {
  position: absolute; top: -14vh; left: var(--x, 7vw);
  width: 5px; height: 175vh;
  transform-origin: top center;
  background: linear-gradient(to bottom,
    rgba(120, 255, 155, 0.85) 0%,
    rgba(120, 255, 155, 0.72) 16%,
    rgba(120, 255, 155, 0.34) 52%,
    transparent 90%);
  filter: blur(1px) drop-shadow(0 0 11px rgba(120, 255, 155, .85));
  animation: dynNeonSweep var(--sweep, 18s) ease-in-out infinite alternate;
}
#dyn-message-theme[data-theme="neon-nightclub"] .beam.wide {
  width: 28px; opacity: .38; filter: blur(13px);
}
@keyframes dynNeonSweep {
  from { transform: rotate(calc(var(--a) - 2.2deg)); }
  to   { transform: rotate(calc(var(--a) + 2.6deg)); }
}
#dyn-message-theme[data-theme="neon-nightclub"] .fog {
  position: absolute; z-index: 2; pointer-events: none; border-radius: 50%;
  filter: blur(52px); animation: dynNeonDrift var(--dur, 40s) ease-in-out infinite alternate;
}
#dyn-message-theme[data-theme="neon-nightclub"] .fog.f1 { width: 72vw; height: 58vh; left: 20%; top: 38%;
  background: radial-gradient(closest-side, rgba(198,210,232,.36), transparent 74%); --dur: 46s; }
#dyn-message-theme[data-theme="neon-nightclub"] .fog.f2 { width: 56vw; height: 48vh; left: 44%; top: 6%;
  background: radial-gradient(closest-side, rgba(205,215,240,.26), transparent 72%); --dur: 36s; animation-delay: -14s; }
#dyn-message-theme[data-theme="neon-nightclub"] .fog.f3 { width: 62vw; height: 44vh; left: -12%; top: 56%;
  background: radial-gradient(closest-side, rgba(185,198,225,.30), transparent 72%); --dur: 52s; animation-delay: -26s; }
#dyn-message-theme[data-theme="neon-nightclub"] .fog.f4 { width: 46vw; height: 44vh; left: 38%; top: 40%; z-index: 5;
  background: radial-gradient(closest-side, rgba(210,220,245,.32), transparent 70%); --dur: 30s; animation-delay: -8s; }
#dyn-message-theme[data-theme="neon-nightclub"] .fog.f5 { width: 48vw; height: 32vh; left: 46%; top: 60%; z-index: 12;
  background: radial-gradient(closest-side, rgba(215,225,248,.15), transparent 70%); --dur: 38s; animation-delay: -18s; }
@keyframes dynNeonDrift {
  from { transform: translate(-6vw, 2vh) scale(1); }
  to   { transform: translate(6vw, -2.5vh) scale(1.14); }
}
#dyn-message-theme[data-theme="neon-nightclub"] .vignette {
  position: absolute; inset: 0; z-index: 6; pointer-events: none;
  background: radial-gradient(118vw 104vh at 50% 46%, transparent 62%, rgba(0,0,0,.42) 100%);
}
#dyn-message-theme[data-theme="neon-nightclub"] .photo-wrap {
  position: absolute; z-index: 10;
  left: 4vw; top: 50%; transform: translateY(-50%);
  height: 92vh; aspect-ratio: 700 / 1000;
}
#dyn-message-theme[data-theme="neon-nightclub"] .photo-wrap svg {
  position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible;
}
#dyn-message-theme[data-theme="neon-nightclub"] .photo-holder {
  position: absolute; left: 13.15%; top: 9.2%;
  width: 73.7%; height: 81.6%;
  border-radius: 4.6vh; overflow: hidden;
  box-shadow: 0 0 6vh rgba(0,0,0,.8);
  opacity: 0;
}
#dyn-message-theme[data-theme="neon-nightclub"] .photo-holder img {
  display: block; width: 100%; height: 100%;
  object-fit: cover;
  filter: saturate(1.15) contrast(1.06) brightness(.95);
}
#dyn-message-theme[data-theme="neon-nightclub"] .photo-holder::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(160deg,
    color-mix(in srgb, var(--primary) 65%, transparent) 0%,
    transparent 42%,
    color-mix(in srgb, var(--secondary) 65%, transparent) 100%);
  opacity: .24;
}
#dyn-message-theme[data-theme="neon-nightclub"] .photo-holder::before {
  content: ""; position: absolute; inset: 0; z-index: 1;
  border-radius: inherit;
  box-shadow:
    inset 0 0 9vh color-mix(in srgb, var(--secondary) 28%, transparent),
    inset 0 0 3vh color-mix(in srgb, var(--primary) 22%, transparent);
}
#dyn-message-theme[data-theme="neon-nightclub"] .tr { fill: none; stroke: var(--tube); stroke-linecap: round; stroke-linejoin: round; }
#dyn-message-theme[data-theme="neon-nightclub"] .tr.glow2 { stroke-width: 30; filter: blur(24px); opacity: .5; }
#dyn-message-theme[data-theme="neon-nightclub"] .tr.glow1 { stroke-width: 13; filter: blur(7px);  opacity: .85; }
#dyn-message-theme[data-theme="neon-nightclub"] .tr.core  { stroke-width: 5; }
#dyn-message-theme[data-theme="neon-nightclub"] .tr.hot   { stroke-width: 2.2; stroke: color-mix(in srgb, var(--tube) 30%, white); opacity: .95; }
#dyn-message-theme[data-theme="neon-nightclub"] .trace { opacity: 0; }
#dyn-message-theme[data-theme="neon-nightclub"] .trace:nth-child(1) { --tube: var(--primary); }
#dyn-message-theme[data-theme="neon-nightclub"] .trace:nth-child(2) { --tube: color-mix(in srgb, var(--primary) 68%, var(--secondary)); }
#dyn-message-theme[data-theme="neon-nightclub"] .trace:nth-child(3) { --tube: color-mix(in srgb, var(--primary) 32%, var(--secondary)); }
#dyn-message-theme[data-theme="neon-nightclub"] .trace:nth-child(4) { --tube: var(--secondary); }
#dyn-message-theme[data-theme="neon-nightclub"] .panel {
  position: absolute; z-index: 11;
  left: 44.5vw; right: 5vw; top: 50%; transform: translateY(-50%);
  height: 58vh;
}
#dyn-message-theme[data-theme="neon-nightclub"] .panel.gone { display: none; }
#dyn-message-theme[data-theme="neon-nightclub"] .msg-box {
  position: absolute; inset: 0;
  background: rgba(3, 5, 12, .6);
  border: 6px solid color-mix(in srgb, var(--primary) 42%, white);
  border-radius: 10px;
  box-shadow:
    0 0 0 3.5px color-mix(in srgb, var(--primary) 80%, transparent),
    inset 0 0 0 3.5px color-mix(in srgb, var(--primary) 80%, transparent),
    0 0 22px var(--primary),
    0 0 60px var(--p-soft),
    0 0 150px var(--p-haze),
    inset 0 0 18px var(--p-haze),
    inset 0 0 60px color-mix(in srgb, var(--primary) 12%, transparent);
  opacity: 0;
}
#dyn-message-theme[data-theme="neon-nightclub"] .msg-fit {
  position: absolute; left: 5.5%; right: 5.5%; top: 8%; bottom: 44%;
  display: flex; align-items: center; justify-content: center;
  text-align: center; overflow: hidden;
  opacity: 0;
}
#dyn-message-theme[data-theme="neon-nightclub"] .panel.no-name .msg-fit { bottom: 10%; }
#dyn-message-theme[data-theme="neon-nightclub"] .panel.no-msg .msg-fit { display: none; }
#dyn-message-theme[data-theme="neon-nightclub"] .msg-fit span {
  font-family: 'Anton', 'Arial Narrow', sans-serif;
  text-transform: uppercase;
  letter-spacing: .015em;
  line-height: 1.02;
  color: color-mix(in srgb, white 72%, var(--primary));
  text-shadow:
    0 0 2px rgba(255,255,255,.9),
    0 0 8px var(--primary),
    0 0 18px var(--primary),
    0 0 46px var(--p-soft),
    0 0 110px var(--p-haze);
}
#dyn-message-theme[data-theme="neon-nightclub"] .name-script {
  position: absolute; left: 0; right: 0; bottom: 8%;
  height: 34%;
  display: flex; align-items: center; justify-content: center;
  text-align: center; overflow: visible;
  opacity: 0;
}
#dyn-message-theme[data-theme="neon-nightclub"] .panel.no-msg .name-script {
  top: 50%; bottom: auto; height: 60%;
  transform: translate(0, -50%);
}
#dyn-message-theme[data-theme="neon-nightclub"] .panel.no-name .name-script { display: none; }
#dyn-message-theme[data-theme="neon-nightclub"] .name-script span {
  font-family: 'Mr Dafoe', cursive;
  line-height: .95;
  color: var(--s-hot);
  -webkit-text-stroke: 0.014em color-mix(in srgb, var(--secondary) 55%, white);
  white-space: nowrap;
  transform: rotate(-3deg);
  text-shadow:
    0 0 8px var(--secondary),
    0 0 24px var(--secondary),
    0 0 60px var(--s-soft),
    0 0 130px var(--s-haze);
}
@keyframes dynNeonStrike {
  0%   { opacity: 0; }
  6%   { opacity: 0; }
  7%   { opacity: 1; }
  9%   { opacity: .12; }
  14%  { opacity: 1; }
  16%  { opacity: .2; }
  24%  { opacity: .95; }
  28%  { opacity: .25; }
  38%  { opacity: 1; }
  46%  { opacity: .82; }
  55%  { opacity: 1; }
  100% { opacity: 1; }
}
@keyframes dynNeonPhotoIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
#dyn-message-theme[data-theme="neon-nightclub"].on .trace,
#dyn-message-theme[data-theme="neon-nightclub"].on .msg-box,
#dyn-message-theme[data-theme="neon-nightclub"].on .msg-fit,
#dyn-message-theme[data-theme="neon-nightclub"].on .name-script {
  opacity: 1;
  animation: dynNeonStrike var(--reveal-ms) both;
}
#dyn-message-theme[data-theme="neon-nightclub"].on .trace:nth-child(1) { animation-delay: 0ms; }
#dyn-message-theme[data-theme="neon-nightclub"].on .trace:nth-child(2) { animation-delay: calc(var(--reveal-ms) * .04); }
#dyn-message-theme[data-theme="neon-nightclub"].on .trace:nth-child(3) { animation-delay: calc(var(--reveal-ms) * .08); }
#dyn-message-theme[data-theme="neon-nightclub"].on .trace:nth-child(4) { animation-delay: calc(var(--reveal-ms) * .12); }
#dyn-message-theme[data-theme="neon-nightclub"].on .msg-box     { animation-delay: calc(var(--reveal-ms) * .10); }
#dyn-message-theme[data-theme="neon-nightclub"].on .msg-fit     { animation-delay: calc(var(--reveal-ms) * .18); }
#dyn-message-theme[data-theme="neon-nightclub"].on .name-script { animation-delay: calc(var(--reveal-ms) * .28); }
#dyn-message-theme[data-theme="neon-nightclub"].on .photo-holder {
  animation: dynNeonPhotoIn calc(var(--reveal-ms) * .5) calc(var(--reveal-ms) * .35) both ease;
}
@keyframes dynNeonIdleFlick {
  0%, 95.4%, 97.2%, 100% { opacity: 1; }
  96%   { opacity: .5; }
  96.6% { opacity: 1; }
  98%   { opacity: .72; }
  98.6% { opacity: 1; }
}
@keyframes dynNeonHum {
  from { filter: brightness(1); }
  to   { filter: brightness(1.18); }
}
#dyn-message-theme[data-theme="neon-nightclub"].on.idle .trace:nth-child(3) { animation: dynNeonIdleFlick 8.5s linear infinite; }
#dyn-message-theme[data-theme="neon-nightclub"].on.idle .trace:nth-child(1) { animation: dynNeonIdleFlick 13s linear infinite; animation-delay: -6s; }
#dyn-message-theme[data-theme="neon-nightclub"].on.idle .msg-box            { animation: dynNeonIdleFlick 7s linear infinite; animation-delay: -3s; }
#dyn-message-theme[data-theme="neon-nightclub"].on.idle .msg-fit            { animation: none; opacity: 1; }
#dyn-message-theme[data-theme="neon-nightclub"].on.idle .name-script        { animation: dynNeonHum 3.4s ease-in-out infinite alternate; }
#dyn-message-theme[data-theme="neon-nightclub"].on.idle .photo-holder       { animation: none; opacity: 1; }
@keyframes dynNeonFlickOff {
  0%   { opacity: 1; }
  12%  { opacity: .15; }
  22%  { opacity: .85; }
  34%  { opacity: .1; }
  46%  { opacity: .5; }
  58%  { opacity: .08; }
  74%  { opacity: .18; }
  100% { opacity: 0; }
}
@keyframes dynNeonPhotoOff {
  from { opacity: 1; }
  to   { opacity: 0; }
}
#dyn-message-theme[data-theme="neon-nightclub"].on.off .trace,
#dyn-message-theme[data-theme="neon-nightclub"].on.off .msg-box,
#dyn-message-theme[data-theme="neon-nightclub"].on.off .msg-fit,
#dyn-message-theme[data-theme="neon-nightclub"].on.off .name-script {
  animation: dynNeonFlickOff var(--off-ms) both;
}
#dyn-message-theme[data-theme="neon-nightclub"].on.off .photo-holder {
  animation: dynNeonPhotoOff calc(var(--off-ms) * .8) both ease;
}

/* ================================================================
   ULTRAS TIFO
   ================================================================ */
#dyn-message-theme[data-theme="ultras-tifo"] {
  --ink: #0d0a08;
  --paper: #e9e1cd;
  --ember: color-mix(in srgb, var(--secondary) 42%, #ff8a2a 58%);
  --shadow-tint: color-mix(in srgb, var(--primary) 30%, rgb(0 0 0 / 0.65) 70%);
  background: #07080c;
  font-family: 'Anton', 'Arial Narrow', Impact, sans-serif;
}
#dyn-message-theme[data-theme="ultras-tifo"] .scene {
  position: absolute; inset: 0;
  background:
    radial-gradient(140% 90% at 50% 118%, #1a1416 0%, transparent 55%),
    radial-gradient(120% 80% at 50% -25%, #10131c 0%, transparent 60%),
    linear-gradient(180deg, #090a10 0%, #07080c 55%, #0b0a0c 100%);
}
#dyn-message-theme[data-theme="ultras-tifo"] .scene::after {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(45% 30% at 12% -8%, rgb(190 200 230 / 0.10), transparent 70%),
    radial-gradient(45% 30% at 88% -8%, rgb(190 200 230 / 0.10), transparent 70%);
}
#dyn-message-theme[data-theme="ultras-tifo"] .smoke { position: absolute; border-radius: 50%; filter: blur(36px); }
#dyn-message-theme[data-theme="ultras-tifo"] .smoke.w { background: radial-gradient(closest-side,
  rgb(242 240 236 / 0.92), rgb(233 230 226 / 0.55) 42%,
  rgb(226 223 219 / 0.22) 64%, transparent 78%); }
#dyn-message-theme[data-theme="ultras-tifo"] .smoke.d { background: radial-gradient(closest-side,
  rgb(30 27 25 / 0.9), rgb(24 22 20 / 0.5) 48%, transparent 75%); }
@keyframes dynTifoSmoke {
  0%   { transform: translate(0, 0) scale(1) rotate(0deg); }
  50%  { transform: translate(var(--tx, 50px), var(--ty, -30px)) scale(var(--ts, 1.14)) rotate(4deg); }
  100% { transform: translate(calc(var(--tx, 50px) * .3), calc(var(--ty, -30px) * .6)) scale(1.04) rotate(-2deg); }
}
#dyn-message-theme[data-theme="ultras-tifo"] .smoke { animation: dynTifoSmoke var(--dur, 26s) ease-in-out infinite alternate; }
#dyn-message-theme[data-theme="ultras-tifo"] .smoke-back  { position: absolute; inset: 0; z-index: 1; }
#dyn-message-theme[data-theme="ultras-tifo"] .smoke-front { position: absolute; inset: 0; z-index: 8; pointer-events: none; }
#dyn-message-theme[data-theme="ultras-tifo"] .embers { position: absolute; inset: 0; z-index: 9; pointer-events: none; overflow: hidden; }
#dyn-message-theme[data-theme="ultras-tifo"] .ember {
  position: absolute; bottom: -3vh;
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--ember);
  box-shadow: 0 0 11px 4px color-mix(in srgb, var(--ember) 80%, transparent);
  animation: dynTifoEmber var(--dur, 8s) linear forwards;
  opacity: 0;
}
#dyn-message-theme[data-theme="ultras-tifo"] .ember.flare {
  width: 12px; height: 12px;
  box-shadow: 0 0 24px 8px color-mix(in srgb, var(--ember) 90%, transparent);
  animation: dynTifoEmber var(--dur, 8s) linear forwards, dynTifoEmberFlick 0.9s ease-in-out infinite;
}
@keyframes dynTifoEmber {
  0%   { transform: translate(0, 0); opacity: 0; }
  7%   { opacity: 0.95; }
  70%  { opacity: 0.7; }
  100% { transform: translate(var(--dx, 0px), -112vh); opacity: 0; }
}
@keyframes dynTifoEmberFlick { 50% { filter: brightness(1.7); } }
#dyn-message-theme[data-theme="ultras-tifo"] .stage {
  position: absolute; inset: 0; z-index: 5;
  display: grid; place-items: center;
  opacity: 0;
  pointer-events: none;
}
#dyn-message-theme[data-theme="ultras-tifo"].on .stage {
  opacity: 1;
  animation: dynTifoBannerIn calc(var(--reveal-ms) * 0.24) cubic-bezier(.2,1.4,.4,1) both;
}
@keyframes dynTifoBannerIn {
  from { opacity: 0; transform: scale(0.955); }
  to   { opacity: 1; transform: scale(1); }
}
#dyn-message-theme[data-theme="ultras-tifo"].on.off .stage {
  animation: dynTifoWhip min(520ms, calc(var(--reveal-ms) * 0.55)) cubic-bezier(.6,-.15,.85,.4) both;
}
@keyframes dynTifoWhip {
  0%   { transform: translateX(0) rotate(0deg) skewX(0deg); opacity: 1; }
  18%  { transform: translateX(2.5%) rotate(0.6deg) skewX(-1deg); opacity: 1; }
  100% { transform: translateX(-142%) rotate(-7deg) skewX(9deg); opacity: 0.3; }
}
#dyn-message-theme[data-theme="ultras-tifo"] .banner {
  position: relative;
  width: 92vw; height: 86vh;
  filter: drop-shadow(0 34px 70px var(--shadow-tint));
  animation: dynTifoSway 9.5s ease-in-out infinite alternate;
  transform-origin: 50% 42%;
}
@keyframes dynTifoSway {
  0%   { transform: rotate(-0.12deg) skewX(0.12deg) scale(1); }
  50%  { transform: rotate(0.1deg)  skewX(-0.16deg) scale(1.0035); }
  100% { transform: rotate(-0.08deg) skewX(0.1deg) scale(1.001); }
}
#dyn-message-theme[data-theme="ultras-tifo"] .b-black  { position: absolute; inset: -1.4% -1.1%; background: #0a0807; filter: url(#dynt-tear-xl); }
#dyn-message-theme[data-theme="ultras-tifo"] .b-black2 { position: absolute; inset: -0.5% -0.4%; background: #16100f; filter: url(#dynt-tear-x2); }
#dyn-message-theme[data-theme="ultras-tifo"] .b-red {
  position: absolute; inset: 1.15% 0.95%;
  filter: url(#dynt-tear-lg);
  background:
    radial-gradient(120% 90% at 18% 18%, color-mix(in srgb, var(--primary), #fff 9%) 0%, transparent 55%),
    radial-gradient(150% 110% at 84% 82%, color-mix(in srgb, var(--primary), #000 40%) 0%, transparent 62%),
    radial-gradient(100% 100% at 50% 45%, var(--primary) 0%, color-mix(in srgb, var(--primary), #000 24%) 100%);
}
#dyn-message-theme[data-theme="ultras-tifo"] .b-red > svg.grain { position: absolute; inset: 0; width: 100%; height: 100%; }
#dyn-message-theme[data-theme="ultras-tifo"] .grain.mottle  { mix-blend-mode: overlay;    opacity: 0.7; }
#dyn-message-theme[data-theme="ultras-tifo"] .grain.speck   { mix-blend-mode: multiply;   opacity: 0.3; }
#dyn-message-theme[data-theme="ultras-tifo"] .grain.roller  { mix-blend-mode: overlay;    opacity: 0.3; }
#dyn-message-theme[data-theme="ultras-tifo"] .grain.rollerd { mix-blend-mode: multiply;   opacity: 0.2; }
#dyn-message-theme[data-theme="ultras-tifo"] .streak { position: absolute; border-radius: 42%; opacity: 0.24;
  background: color-mix(in srgb, var(--primary), #fff 18%); }
#dyn-message-theme[data-theme="ultras-tifo"] .st1 { top: 16%; left: 5%;  width: 58%; height: 5.5%; transform: rotate(-1.6deg); }
#dyn-message-theme[data-theme="ultras-tifo"] .st2 { top: 60%; left: 28%; width: 64%; height: 6.5%; transform: rotate(-0.8deg); }
#dyn-message-theme[data-theme="ultras-tifo"] .st3 { top: 37%; left: 44%; width: 44%; height: 4.5%; transform: rotate(1.2deg); }
#dyn-message-theme[data-theme="ultras-tifo"] .st4 { top: 80%; left: 8%;  width: 40%; height: 4.5%; transform: rotate(0.8deg); opacity: 0.15; }
#dyn-message-theme[data-theme="ultras-tifo"] .stroke { position: absolute; background: #0d0a09; opacity: 0.93; }
#dyn-message-theme[data-theme="ultras-tifo"] .sk1 { top: -2.2%;    left: 7%;    width: 34%;  height: 6.2%; transform: rotate(-1.4deg); }
#dyn-message-theme[data-theme="ultras-tifo"] .sk2 { top: -1.6%;    right: 11%;  width: 27%;  height: 5%;   transform: rotate(1deg); }
#dyn-message-theme[data-theme="ultras-tifo"] .sk3 { bottom: -2.4%; left: 19%;   width: 31%;  height: 6.6%; transform: rotate(1.3deg); }
#dyn-message-theme[data-theme="ultras-tifo"] .sk4 { bottom: -1.8%; right: 5%;   width: 25%;  height: 5.4%; transform: rotate(-1.1deg); }
#dyn-message-theme[data-theme="ultras-tifo"] .sk5 { left: -1.8%;   top: 14%;    width: 4.6%; height: 35%;  transform: rotate(2deg); }
#dyn-message-theme[data-theme="ultras-tifo"] .sk6 { right: -1.8%;  top: 38%;    width: 4.2%; height: 31%;  transform: rotate(-2deg); }
#dyn-message-theme[data-theme="ultras-tifo"] .sk7 { left: -2.5%;   top: -2.5%;  width: 13%;  height: 12%;  border-radius: 34%; }
#dyn-message-theme[data-theme="ultras-tifo"] .sk8 { right: -2.5%;  bottom: -3%; width: 15%;  height: 11%;  border-radius: 30%; }
#dyn-message-theme[data-theme="ultras-tifo"] .sk9 { right: -2%;    top: -2.5%;  width: 10%;  height: 9%;   border-radius: 36%; opacity: 0.85; }
#dyn-message-theme[data-theme="ultras-tifo"] .sk10{ left: -2%;     bottom: -2.5%; width: 11%; height: 10%; border-radius: 36%; opacity: 0.85; }
#dyn-message-theme[data-theme="ultras-tifo"] .b-shade { position: absolute; inset: 0;
  box-shadow:
    inset 0 0 220px 70px rgb(0 0 0 / 0.5),
    inset 0 0 80px 22px color-mix(in srgb, var(--primary) 30%, rgb(0 0 0 / 0.42) 70%);
}
#dyn-message-theme[data-theme="ultras-tifo"] .content {
  position: absolute; inset: 0; z-index: 3;
  padding: 2.6% 3.6%;
  display: flex; align-items: center; gap: 2.5%;
}
#dyn-message-theme[data-theme="ultras-tifo"] .patch-col { flex: 0 0 36.5%; height: 100%;
  display: flex; align-items: center; justify-content: center; }
#dyn-message-theme[data-theme="ultras-tifo"] .msg-col   { flex: 1 1 auto; min-width: 0; height: 100%;
  display: flex; flex-direction: column; justify-content: center; }
#dyn-message-theme[data-theme="ultras-tifo"] .banner.no-msg .content { flex-direction: column; justify-content: center; gap: 2.5%; }
#dyn-message-theme[data-theme="ultras-tifo"] .banner.no-msg .patch-col { flex: 0 0 auto; height: 72%; width: auto; }
#dyn-message-theme[data-theme="ultras-tifo"] .banner.no-msg .msg-col   { flex: 0 0 auto; height: 17%; width: 70%; }
#dyn-message-theme[data-theme="ultras-tifo"] .banner.no-msg .lines     { display: none; }
#dyn-message-theme[data-theme="ultras-tifo"] .banner.no-msg .name-slot { height: 100%; margin-top: 0; justify-content: center; }
#dyn-message-theme[data-theme="ultras-tifo"] .patch {
  position: relative;
  width: 100%; aspect-ratio: 3 / 4; max-height: 100%;
  transform: rotate(-2deg);
  filter: drop-shadow(0 20px 34px var(--shadow-tint));
  transform-origin: 46% 44%;
}
#dyn-message-theme[data-theme="ultras-tifo"] .banner.no-msg .patch { width: auto; height: 100%; }
#dyn-message-theme[data-theme="ultras-tifo"].on .patch {
  animation: dynTifoSlap calc(var(--reveal-ms) * 0.3) cubic-bezier(.25,1.5,.45,1) both;
  animation-delay: calc(var(--reveal-ms) * 0.08);
}
@keyframes dynTifoSlap {
  0%   { opacity: 0; transform: rotate(-9deg) scale(1.65); }
  62%  { opacity: 1; transform: rotate(-1.2deg) scale(0.965); }
  82%  { transform: rotate(-2.4deg) scale(1.02); }
  100% { transform: rotate(-2deg) scale(1); }
}
#dyn-message-theme[data-theme="ultras-tifo"] .patch-paper {
  position: absolute; inset: -1.5%;
  background:
    radial-gradient(120% 100% at 30% 20%, #f2ecdc 0%, transparent 60%),
    radial-gradient(130% 110% at 75% 85%, #d9d0b8 0%, transparent 65%),
    var(--paper);
  filter: url(#dynt-tear-paper);
}
#dyn-message-theme[data-theme="ultras-tifo"] .patch-stitch {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  overflow: visible;
  opacity: 0.9;
  filter: url(#dynt-rough-fine);
}
#dyn-message-theme[data-theme="ultras-tifo"] .patch-photo {
  position: absolute; inset: 7.5%;
  width: 85%; height: 85%;
  object-fit: cover;
  filter: saturate(1.08) contrast(1.06);
  background: #222;
}
#dyn-message-theme[data-theme="ultras-tifo"] .lines {
  height: 84%; width: 100%;
  display: flex; flex-direction: column; align-items: flex-start;
  justify-content: center;
  padding-left: 1%;
}
#dyn-message-theme[data-theme="ultras-tifo"] .line-slot { flex: 1 1 0; min-height: 0; width: 100%;
  display: flex; align-items: center; }
#dyn-message-theme[data-theme="ultras-tifo"] .line {
  position: relative; display: block; width: max-content;
  white-space: nowrap;
  transform: rotate(var(--rot, 0deg));
  transform-origin: 38% 55%;
  filter: drop-shadow(0 8px 16px color-mix(in srgb, var(--primary) 25%, rgb(0 0 0 / 0.42) 75%));
}
#dyn-message-theme[data-theme="ultras-tifo"] .line-slot:nth-child(2) .line { margin-left: 0.55%; }
#dyn-message-theme[data-theme="ultras-tifo"] .line-slot:nth-child(3) .line { margin-left: 0.2%; }
#dyn-message-theme[data-theme="ultras-tifo"] .line-slot:nth-child(4) .line { margin-left: 0.8%; }
#dyn-message-theme[data-theme="ultras-tifo"].on .line {
  animation: dynTifoStamp calc(var(--reveal-ms) * 0.2) cubic-bezier(.2,1.6,.4,1) both;
  animation-delay: calc(var(--reveal-ms) * var(--d, 0.4));
}
@keyframes dynTifoStamp {
  0%   { opacity: 0; transform: rotate(calc(var(--rot, 0deg) + 3deg)) scale(1.9); }
  70%  { opacity: 1; transform: rotate(var(--rot, 0deg)) scale(0.97); }
  100% { opacity: 1; transform: rotate(var(--rot, 0deg)) scale(1); }
}
#dyn-message-theme[data-theme="ultras-tifo"] .line .block {
  position: absolute; inset: -0.06em -0.13em -0.06em -0.13em;
  background: var(--ink);
}
#dyn-message-theme[data-theme="ultras-tifo"] .line-slot:nth-child(4n+1) .block { filter: url(#dynt-pb1); }
#dyn-message-theme[data-theme="ultras-tifo"] .line-slot:nth-child(4n+2) .block { filter: url(#dynt-pb2); }
#dyn-message-theme[data-theme="ultras-tifo"] .line-slot:nth-child(4n+3) .block { filter: url(#dynt-pb3); }
#dyn-message-theme[data-theme="ultras-tifo"] .line-slot:nth-child(4n+4) .block { filter: url(#dynt-pb4); }
#dyn-message-theme[data-theme="ultras-tifo"] .line .txt {
  position: relative; display: block;
  line-height: 0.86; padding: 0.05em 0.14em;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.012em;
  filter: url(#dynt-brush-text);
}
#dyn-message-theme[data-theme="ultras-tifo"] .name-slot { height: 14%; margin-top: 1%; width: 100%;
  display: flex; align-items: center; justify-content: center; }
#dyn-message-theme[data-theme="ultras-tifo"] .name-wrap {
  position: relative; display: block; width: max-content;
  font-family: 'Anton', 'Arial Narrow', Impact, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  transform: rotate(-2deg);
  color: #fff;
  text-shadow: 0 4px 14px rgb(0 0 0 / 0.45);
}
#dyn-message-theme[data-theme="ultras-tifo"].on .name-wrap {
  animation: dynTifoName calc(var(--reveal-ms) * 0.2) cubic-bezier(.2,1.3,.5,1) both;
  animation-delay: calc(var(--reveal-ms) * var(--dn, 0.78));
}
@keyframes dynTifoName {
  0%   { opacity: 0; transform: rotate(-2deg) translateX(-0.45em) scaleX(1.35); }
  100% { opacity: 1; transform: rotate(-2deg) translateX(0) scaleX(1); }
}
#dyn-message-theme[data-theme="ultras-tifo"] .name-wrap .nm {
  position: relative; display: block;
  line-height: 0.95; padding: 0.04em 0.1em;
  filter: url(#dynt-brush-text);
}
#dyn-message-theme[data-theme="ultras-tifo"] .puff {
  position: absolute; border-radius: 50%;
  background: radial-gradient(closest-side, rgb(225 220 214 / 0.7), rgb(200 196 190 / 0.3) 55%, transparent 72%);
  filter: blur(26px);
  opacity: 0; pointer-events: none;
  width: 34vw; height: 34vw;
}
#dyn-message-theme[data-theme="ultras-tifo"] .puff.p1 { left: 4vw;  top: 30vh; }
#dyn-message-theme[data-theme="ultras-tifo"] .puff.p2 { left: 30vw; top: 12vh; width: 28vw; height: 28vw; }
#dyn-message-theme[data-theme="ultras-tifo"] .puff.p3 { left: 22vw; top: 48vh; width: 26vw; height: 26vw; }
#dyn-message-theme[data-theme="ultras-tifo"].on.off .puff {
  animation: dynTifoPuff min(560ms, calc(var(--reveal-ms) * 0.6)) ease-out both;
}
#dyn-message-theme[data-theme="ultras-tifo"].on.off .puff.p2 { animation-delay: 60ms; }
#dyn-message-theme[data-theme="ultras-tifo"].on.off .puff.p3 { animation-delay: 110ms; }
@keyframes dynTifoPuff {
  0%   { opacity: 0;    transform: scale(0.25); }
  30%  { opacity: 0.65; }
  100% { opacity: 0;    transform: scale(1.7) translateX(-18%); }
}
#dyn-message-theme[data-theme="ultras-tifo"] .svg-defs { position: absolute; width: 0; height: 0; overflow: hidden; }

/* ================================================================
   HOLO CARD
   ================================================================ */
#dyn-message-theme[data-theme="holo-card"] {
  --p-hot:  color-mix(in srgb, var(--primary) 42%, white);
  --p-soft: color-mix(in srgb, var(--primary) 55%, transparent);
  --p-haze: color-mix(in srgb, var(--primary) 28%, transparent);
  --s-hot:  color-mix(in srgb, var(--secondary) 40%, white);
  --s-soft: color-mix(in srgb, var(--secondary) 50%, transparent);
  --s-haze: color-mix(in srgb, var(--secondary) 26%, transparent);
  --holo-rest: rotateY(-11deg) rotateX(5deg) translate3d(-0.35vw, 0.45vh, 10px) scale(1);
  background: #05040a;
}
#dyn-message-theme[data-theme="holo-card"] .dyn-stage {
  background:
    radial-gradient(90vw 70vh at 18% 110%, var(--p-haze), transparent 62%),
    radial-gradient(80vw 60vh at 88% -10%, var(--s-haze), transparent 58%),
    radial-gradient(70vw 50vh at 70% 90%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 60%),
    linear-gradient(180deg, #07060f 0%, #05040a 55%, #080712 100%);
  perspective: 1600px;
}
#dyn-message-theme[data-theme="holo-card"] .aurora {
  display: none;
}
#dyn-message-theme[data-theme="holo-card"] .dust { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
#dyn-message-theme[data-theme="holo-card"] .speck {
  position: absolute; width: 3px; height: 3px; border-radius: 50%;
  background: #fff;
  opacity: 0.22;
  animation: dynHoloSpeck var(--dur, 16s) ease-in-out infinite alternate;
  animation-delay: var(--del, 0s);
}
@keyframes dynHoloSpeck {
  from { transform: translate(0, 0); opacity: 0.08; }
  to   { transform: translate(var(--dx, 20px), var(--dy, -30px)); opacity: 0.38; }
}
#dyn-message-theme[data-theme="holo-card"] .layout {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  gap: 4.2vw;
  padding: 5vh 5vw;
  transform-style: preserve-3d;
}
#dyn-message-theme[data-theme="holo-card"] .rig {
  flex: none;
  height: 84vh;
  aspect-ratio: 3 / 4.15;
  transform-style: preserve-3d;
  transform-origin: 50% 55%;
  transform: var(--holo-rest);
  opacity: 0;
  backface-visibility: hidden;
}
#dyn-message-theme[data-theme="holo-card"] .card {
  position: relative; width: 100%; height: 100%;
  transform-style: flat;
  transform-origin: 50% 55%;
  border-radius: 1.6vw;
  background:
    linear-gradient(160deg, #1a1824 0%, #0c0b12 55%, #15131d 100%);
  box-shadow:
    0 2.4vh 6vh rgba(0,0,0,.65),
    0 0 0 1px rgba(255,255,255,.08),
    0 0 4vw var(--p-haze);
}
#dyn-message-theme[data-theme="holo-card"] .card::before {
  content: '';
  position: absolute; inset: -2px; z-index: 0;
  border-radius: inherit;
  padding: 2px;
  background: conic-gradient(from 140deg,
    var(--primary), var(--s-hot), #fff, var(--secondary), var(--p-hot), var(--primary));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.85;
}
#dyn-message-theme[data-theme="holo-card"] .well {
  position: absolute; inset: 3.4%;
  border-radius: 1.15vw;
  overflow: hidden;
  isolation: isolate;
  contain: paint;
  transform: translateZ(0);
  transform-style: flat;
  background: #08070c;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
}
#dyn-message-theme[data-theme="holo-card"] .well img {
  display: block; width: 100%; height: 100%;
  object-fit: cover;
  filter: saturate(1.12) contrast(1.06);
}
#dyn-message-theme[data-theme="holo-card"] .foil {
  position: absolute;
  inset: -30%;
  width: 160%;
  height: 160%;
  pointer-events: none;
  background:
    repeating-linear-gradient(-28deg,
      transparent 0 18px,
      rgba(255,255,255,.04) 24px,
      rgba(255,255,255,.12) 30px,
      rgba(255,255,255,.04) 36px,
      transparent 42px 56px),
    conic-gradient(from 200deg at 40% 30%,
      var(--primary), var(--secondary), #ffe9a8, #ff7ad9, var(--primary));
  opacity: 0.32;
  backface-visibility: hidden;
  transform: translate3d(-7%, -4%, 0);
}
#dyn-message-theme[data-theme="holo-card"] .glare {
  position: absolute;
  top: -18%;
  height: 136%;
  width: 70%;
  left: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 52% 74% at 50% 48%,
    rgba(255,255,255,.34) 0%,
    rgba(255,255,255,.14) 34%,
    rgba(255,255,255,.04) 58%,
    transparent 78%);
  opacity: 0.68;
  backface-visibility: hidden;
  transform: translate3d(-150%, 0, 0);
}
#dyn-message-theme[data-theme="holo-card"] .copy {
  flex: 1 1 40vw; min-width: 0; max-width: 50vw;
  height: 78vh;
  display: flex; flex-direction: column; justify-content: center;
  gap: 0;
  opacity: 0;
  overflow: visible;
}
#dyn-message-theme[data-theme="holo-card"] .copy.gone { display: none; }
#dyn-message-theme[data-theme="holo-card"] .msg-stack {
  position: relative;
  flex: 1 1 auto;
  height: 0;
  min-height: 0;
  overflow: visible;
}
#dyn-message-theme[data-theme="holo-card"] .msg-bloom,
#dyn-message-theme[data-theme="holo-card"] .msg-fit {
  position: absolute;
  display: flex; align-items: center;
  text-align: left;
}
#dyn-message-theme[data-theme="holo-card"] .msg-fit {
  inset: 0;
  overflow: hidden;
  z-index: 1;
}
#dyn-message-theme[data-theme="holo-card"] .msg-bloom {
  inset: -12vh -7vw;
  padding: 12vh 7vw;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  filter: blur(22px);
  opacity: 0.7;
  -webkit-mask-image:
    linear-gradient(to right, transparent 0%, #000 18%, #000 82%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to right, transparent 0%, #000 18%, #000 82%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%);
  mask-composite: intersect;
}
#dyn-message-theme[data-theme="holo-card"] .msg-bloom span,
#dyn-message-theme[data-theme="holo-card"] .msg-fit span {
  display: block;
  width: 100%;
  font-family: 'Bebas Neue', 'Arial Narrow', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 0.9;
  overflow-wrap: normal;
}
#dyn-message-theme[data-theme="holo-card"] .msg-bloom span {
  color: var(--p-hot);
  text-shadow: 0 0 2vh var(--s-soft);
}
#dyn-message-theme[data-theme="holo-card"] .msg-fit span {
  color: #fff;
  background: linear-gradient(115deg,
    #fff 10%,
    var(--p-hot) 32%,
    var(--s-hot) 58%,
    #fff 88%);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
#dyn-message-theme[data-theme="holo-card"] .name-slot {
  position: relative;
  flex: none;
  height: 16vh;
  margin-top: 3.2vh;
  padding-top: 2.4vh;
  overflow: visible;
  display: flex; align-items: center;
}
#dyn-message-theme[data-theme="holo-card"] .name-slot::before {
  content: '';
  position: absolute;
  left: -2vw; right: -2vw; top: 0;
  height: 2.2vh;
  transform: translateY(-50%);
  background: linear-gradient(90deg,
    transparent 0%,
    var(--p-soft) 22%,
    var(--s-soft) 58%,
    transparent 100%);
  filter: blur(10px);
  pointer-events: none;
}
#dyn-message-theme[data-theme="holo-card"] .name-slot.hidden { display: none; }
#dyn-message-theme[data-theme="holo-card"] .name-fit {
  width: 100%; height: 12.5vh;
  overflow: hidden;
  display: flex; align-items: center;
  padding: 0 1.2vw;
}
#dyn-message-theme[data-theme="holo-card"] .name-fit span {
  display: block;
  width: 100%;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 0.95;
  color: color-mix(in srgb, white 78%, var(--secondary));
  text-shadow: 0 0 18px var(--s-haze), 0 0 36px var(--s-soft);
  white-space: nowrap;
}
#dyn-message-theme[data-theme="holo-card"] .copy.no-msg .msg-stack { display: none; }
#dyn-message-theme[data-theme="holo-card"] .copy.no-msg .name-slot {
  flex: 1; height: auto; margin-top: 0; padding-top: 0; border: 0;
}
#dyn-message-theme[data-theme="holo-card"] .copy.no-msg .name-fit { height: 28vh; }
#dyn-message-theme[data-theme="holo-card"] .copy.no-name .name-slot { display: none; }
#dyn-message-theme[data-theme="holo-card"].no-copy .copy { display: none; }
#dyn-message-theme[data-theme="holo-card"].no-copy .layout { justify-content: center; }
#dyn-message-theme[data-theme="holo-card"].no-photo .foil,
#dyn-message-theme[data-theme="holo-card"].no-photo .glare { display: none; }
@keyframes dynHoloCardIn {
  0%   { opacity: 0; transform: rotateY(48deg) rotateX(10deg) translate3d(6vw, 4vh, -140px) scale(0.84); filter: brightness(1.8); }
  62%  { opacity: 1; filter: brightness(1.15); }
  100% { opacity: 1; transform: var(--holo-rest); filter: none; }
}
@keyframes dynHoloCopyIn {
  from { opacity: 0; transform: translateX(3.2vw); filter: blur(8px); }
  to   { opacity: 1; transform: none; filter: none; }
}
#dyn-message-theme[data-theme="holo-card"].on .rig {
  opacity: 1;
  animation: dynHoloCardIn var(--reveal-ms) cubic-bezier(.22,.82,.24,1) both;
}
#dyn-message-theme[data-theme="holo-card"].on .copy {
  opacity: 1;
  animation: dynHoloCopyIn calc(var(--reveal-ms) * 0.72) calc(var(--reveal-ms) * 0.28) cubic-bezier(.2,.9,.3,1) both;
}
@keyframes dynHoloOrbit {
  from { transform: var(--holo-rest); }
  to   { transform: rotateY(10deg) rotateX(-4deg) translate3d(0.45vw, -1.15vh, 14px) scale(1); }
}
@keyframes dynHoloGlare {
  0%   { transform: translate3d(-150%, 0, 0); }
  100% { transform: translate3d(170%, 0, 0); }
}
@keyframes dynHoloFoil {
  0%   { transform: translate3d(-7%, -4%, 0); }
  100% { transform: translate3d(7%, 5%, 0); }
}
@keyframes dynHoloSheen {
  0%   { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}
#dyn-message-theme[data-theme="holo-card"].on.idle .rig {
  animation: dynHoloOrbit 6s linear infinite alternate;
  opacity: 1;
  filter: none;
  transform: var(--holo-rest);
  will-change: transform;
}
#dyn-message-theme[data-theme="holo-card"].on.idle .copy { animation: none; opacity: 1; transform: none; filter: none; }
#dyn-message-theme[data-theme="holo-card"].on.idle .card { animation: none; }
#dyn-message-theme[data-theme="holo-card"].on.idle .glare { animation: dynHoloGlare 10s linear infinite; }
#dyn-message-theme[data-theme="holo-card"].on.idle .foil { animation: dynHoloFoil 18s ease-in-out infinite alternate; }
#dyn-message-theme[data-theme="holo-card"].on.idle .msg-fit span { animation: dynHoloSheen 8s ease-in-out infinite alternate; }
@keyframes dynHoloCardOut {
  0%   { opacity: 1; transform: var(--holo-rest); filter: none; }
  28%  { filter: brightness(1.6); }
  100% { opacity: 0; transform: rotateY(-62deg) rotateX(5deg) translate3d(-8vw, 0.45vh, 10px) scale(0.88); filter: brightness(2.2); }
}
@keyframes dynHoloCopyOut {
  to { opacity: 0; transform: translateX(-2.4vw); filter: blur(6px); }
}
#dyn-message-theme[data-theme="holo-card"].on.off .rig { animation: dynHoloCardOut calc(var(--reveal-ms) * 0.55) cubic-bezier(.6,.05,.85,.4) both; }
#dyn-message-theme[data-theme="holo-card"].on.off .copy { animation: dynHoloCopyOut calc(var(--reveal-ms) * 0.4) both; }
#dyn-message-theme[data-theme="holo-card"] .vignette {
  position: absolute; inset: 0; z-index: 20; pointer-events: none;
  background: radial-gradient(120vw 100vh at 50% 48%, transparent 58%, rgba(0,0,0,.5) 100%);
}

/* ================================================================
   BROADCAST TV
   ================================================================ */
#dyn-message-theme[data-theme="broadcast-tv"] {
  --body: #2d313b;
  --body-hsl: 30, 7%, 12%;
  --wht: #f2fdff;
  --wht-hsl: 30, 20%, 95%;
  --dark: hsla(30, 7%, 12%, 0.5);
  --metal: #847e75;
  --pixel: #0e1e2c;
}
#dyn-message-theme[data-theme="broadcast-tv"] .dyn-stage {
  display: flex; align-items: center; justify-content: center;
  background:
    radial-gradient(at 40% 40%, transparent, transparent, #a64c2f33),
    linear-gradient(transparent, #780d7c33),
    var(--body);
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv {
  position: relative;
  container-type: size;
  container-name: tv;
  width: min(96vw, calc(96vh * 1.8));
  height: min(96vh, calc(96vw / 1.8));
  border-radius: 4cqh;
  background: radial-gradient(circle at 100% 0, #d8d19d, #77533d, var(--body));
  box-shadow: 0 0 0 2cqh var(--body), 0 0 5cqh 2cqh #000;
  overflow: hidden;
  opacity: 0;
  transform: translateY(1cqh) scale(0.985);
}
#dyn-message-theme[data-theme="broadcast-tv"].ready .tv {
  opacity: 1;
  transform: none;
  transition: opacity 0.5s ease, transform 0.65s cubic-bezier(.18,.9,.22,1);
}
#dyn-message-theme[data-theme="broadcast-tv"] .tv::after {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 20;
  background:
    radial-gradient(at 40% 40%, transparent, transparent, #a64c2f),
    linear-gradient(transparent, #780d7c);
  mix-blend-mode: color;
  opacity: 0.3;
  filter: blur(2cqh);
}
#dyn-message-theme[data-theme="broadcast-tv"] .set {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: stretch;
  width: 100%;
  height: 100%;
  padding: 2cqh;
  gap: 3.6cqh;
  min-width: 0;
  filter: drop-shadow(0.2cqh 0 0 #00ff0033) drop-shadow(-0.2cqh 0 0 #ff00ff33);
}
#dyn-message-theme[data-theme="broadcast-tv"] .crt {
  position: relative;
  z-index: 3;
  flex: none;
  height: 100%;
  aspect-ratio: 4 / 3;
  border: 1cqh solid #dad9b3;
  border-radius: 6cqh;
  box-shadow:
    0 0 0 1cqh #41423a,
    inset 0 0 0.5cqh 3cqh #423d3a,
    -0.5cqh 0.5cqh 0.5cqh 2cqh #36323a;
  overflow: hidden;
}
#dyn-message-theme[data-theme="broadcast-tv"] .crt::before {
  content: "";
  position: absolute;
  inset: -2cqh;
  border-radius: 3cqh;
  z-index: 0;
  background:
    repeating-linear-gradient(90deg,
      transparent, transparent 0.5cqh,
      hsla(var(--body-hsl), 0.01) 0.5cqh,
      hsla(var(--wht-hsl), 0.025) 1cqh),
    radial-gradient(at 30% 70%, hsla(var(--body-hsl), 0.5), transparent),
    #454149;
  box-shadow:
    -1.5cqh 1.5cqh 1.5cqh var(--dark),
    inset -0.2cqh 0.2cqh 0.2cqh hsla(var(--wht-hsl), 0.1),
    inset 0 0 0 1cqh #44424e,
    inset -1.25cqh 1.25cqh 0.5cqh var(--dark);
}
#dyn-message-theme[data-theme="broadcast-tv"] .bezel {
  position: absolute;
  inset: 1cqh;
  border: 1cqh solid #76767a;
  border-radius: 4.5cqh;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
  box-shadow:
    inset 0.8cqh 0 2cqh #4f484b,
    inset -0.8cqh 0 2cqh #36323a;
}
#dyn-message-theme[data-theme="broadcast-tv"] .glass {
  position: absolute;
  inset: 4cqh 3.6cqh 4.2cqh;
  z-index: 2;
  overflow: hidden;
  border-radius: 18% / 22%;
  background: #0e1e2c;
  box-shadow:
    inset 0.8cqh 0.8cqh 1.6cqh rgba(0,0,0,.55),
    0 0 1cqh #39343c;
}
#dyn-message-theme[data-theme="broadcast-tv"] .program {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  opacity: 0;
  background: #0e1e2c;
}
#dyn-message-theme[data-theme="broadcast-tv"] .program img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  filter: saturate(1.08) contrast(1.05) brightness(0.96);
}
#dyn-message-theme[data-theme="broadcast-tv"].on:not(.fizzing) .program { opacity: 1; }
#dyn-message-theme[data-theme="broadcast-tv"] .news {
  position: absolute;
  left: 6%;
  right: 6%;
  bottom: 6%;
  z-index: 4;
  display: flex;
  flex-direction: column;
  width: auto;
  max-height: 22%;
  overflow: hidden;
  opacity: 0;
  transform: translateY(1cqh);
  filter: drop-shadow(0 1cqh 1.4cqh rgba(0,0,0,.45));
}
#dyn-message-theme[data-theme="broadcast-tv"] .news.gone { display: none; }
#dyn-message-theme[data-theme="broadcast-tv"].on:not(.fizzing) .news {
  opacity: 1;
  transform: none;
  transition: opacity 0.35s ease, transform 0.45s cubic-bezier(.18,.9,.22,1);
}
#dyn-message-theme[data-theme="broadcast-tv"] .news-rule {
  flex: none;
  height: 0.55cqh;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
}
#dyn-message-theme[data-theme="broadcast-tv"] .news-head {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0.7cqh 1.4cqh;
  background: linear-gradient(90deg, rgba(10,12,18,.92), rgba(10,12,18,.7));
}
#dyn-message-theme[data-theme="broadcast-tv"] .msg-fit,
#dyn-message-theme[data-theme="broadcast-tv"] .name-fit {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
}
#dyn-message-theme[data-theme="broadcast-tv"] .msg-fit span {
  display: block;
  width: 100%;
  font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 0.92;
  color: #f4f6f8;
  overflow-wrap: normal;
}
#dyn-message-theme[data-theme="broadcast-tv"] .news-slug {
  flex: none;
  height: 4.2cqh;
  max-height: 40%;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 1.4cqh;
  background: color-mix(in srgb, var(--secondary) 88%, #1a1408);
}
#dyn-message-theme[data-theme="broadcast-tv"] .news-slug.hidden { display: none; }
#dyn-message-theme[data-theme="broadcast-tv"] .name-fit { height: 3.2cqh; }
#dyn-message-theme[data-theme="broadcast-tv"] .name-fit span {
  display: block;
  width: 100%;
  font-family: 'Oswald', sans-serif;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 0.95;
  color: #1a1408;
  white-space: nowrap;
}
#dyn-message-theme[data-theme="broadcast-tv"] .news.no-msg .news-head { display: none; }
#dyn-message-theme[data-theme="broadcast-tv"] .news.no-msg .news-slug { flex: 1; height: auto; max-height: none; }
#dyn-message-theme[data-theme="broadcast-tv"] .news.no-name .news-slug { display: none; }
#dyn-message-theme[data-theme="broadcast-tv"] .fx,
#dyn-message-theme[data-theme="broadcast-tv"] .static,
#dyn-message-theme[data-theme="broadcast-tv"] .roll {
  position: absolute; inset: 0; pointer-events: none;
}
#dyn-message-theme[data-theme="broadcast-tv"] .fx {
  z-index: 5;
  background:
    repeating-linear-gradient(transparent, transparent 0.5cqh, var(--pixel) 0.5cqh, var(--pixel) 1cqh),
    repeating-linear-gradient(90deg, hsla(0,100%,50%,.12), hsla(120,100%,50%,.12) 0.4cqh);
  background-size: 100% 1cqh, 0.8cqh 100%;
  mix-blend-mode: overlay;
  opacity: 0.45;
}
#dyn-message-theme[data-theme="broadcast-tv"] .shine {
  position: absolute; inset: 0; z-index: 6; pointer-events: none;
  background:
    radial-gradient(circle at 100% 50%, transparent, var(--body)),
    radial-gradient(circle at 0 50%, transparent, var(--wht) 77%, transparent);
  opacity: 0.28;
  mix-blend-mode: screen;
}
#dyn-message-theme[data-theme="broadcast-tv"] .static {
  z-index: 8;
  opacity: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 18cqh 18cqh;
  mix-blend-mode: screen;
  filter: contrast(1.55) brightness(1.3);
}
#dyn-message-theme[data-theme="broadcast-tv"].fizzing .static {
  opacity: 0.92;
  animation: dynTvFizz 0.07s steps(2) infinite;
}
@keyframes dynTvFizz {
  0% { background-position: 0 0; }
  50% { background-position: -4cqh 2cqh; }
  100% { background-position: 3cqh -2cqh; }
}
#dyn-message-theme[data-theme="broadcast-tv"] .roll {
  z-index: 9;
  background: linear-gradient(180deg, #fff, #c8d0d8);
  opacity: 0;
  transform: scaleY(0.012);
}
#dyn-message-theme[data-theme="broadcast-tv"].fizzing.on .roll {
  animation: dynTvOpen calc(var(--reveal-ms) * 0.28) cubic-bezier(.2,.8,.2,1) both;
}
@keyframes dynTvOpen {
  0%   { opacity: 0.95; transform: scaleY(0.012); }
  45%  { opacity: 0.32; transform: scaleY(1); }
  100% { opacity: 0; transform: scaleY(1); }
}
#dyn-message-theme[data-theme="broadcast-tv"] .panel {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1.2cqh;
  padding: 1cqh;
  border-radius: 3cqh;
  background: var(--body);
  box-shadow:
    -0.1cqh 0.1cqh 0.1cqh #00000033,
    inset 0 0 0.5cqh #423d3a,
    -0.5cqh 0.5cqh 0.5cqh #36323a;
  overflow: hidden;
}
#dyn-message-theme[data-theme="broadcast-tv"] .grill,
#dyn-message-theme[data-theme="broadcast-tv"] .knobs {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  border-radius: 2cqh;
  background: #3a353e;
  border: 1cqh solid #44424e;
  box-shadow:
    inset -0.5cqh 0.5cqh 0.5cqh var(--dark),
    -0.5cqh 0.5cqh 0.5cqh #36323a;
}
#dyn-message-theme[data-theme="broadcast-tv"] .grill { flex: 1.15; padding: 1.2cqh; }
#dyn-message-theme[data-theme="broadcast-tv"] .knobs { flex: 1; padding: 1.4cqh 1.2cqh; justify-content: space-evenly; }
#dyn-message-theme[data-theme="broadcast-tv"] .speaker {
  width: 42%;
  max-width: 14cqh;
  aspect-ratio: 1;
  margin: 0.6cqh auto 1cqh;
  border-radius: 50%;
  flex: none;
  background: conic-gradient(from 180deg, var(--body), #1e2128, var(--body));
  box-shadow:
    -0.5cqh 0.5cqh 0.5cqh hsla(var(--wht-hsl), 0.1),
    0.5cqh -0.5cqh 0.5cqh hsla(var(--body-hsl), 0.5);
}
#dyn-message-theme[data-theme="broadcast-tv"] .slats {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55cqh;
  padding: 0 0.6cqh 0.4cqh;
}
#dyn-message-theme[data-theme="broadcast-tv"] .slats i {
  display: block;
  flex: 1;
  min-height: 0.35cqh;
  border-radius: 0.35cqh;
  background: #44424e;
  box-shadow:
    -0.35cqh 0.35cqh 0.35cqh var(--dark),
    inset -0.15cqh 0.15cqh 0.15cqh hsla(var(--wht-hsl), 0.1);
}
#dyn-message-theme[data-theme="broadcast-tv"] .knob-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-evenly;
  gap: 1cqh;
  min-height: 0;
}
#dyn-message-theme[data-theme="broadcast-tv"] .ctrl {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6cqh;
  min-width: 0;
}
#dyn-message-theme[data-theme="broadcast-tv"] .ctrl b {
  font-family: sans-serif;
  font-size: 1.15cqh;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--wht);
  text-shadow: -0.08cqh 0.08cqh 0 var(--body), 0.04cqh -0.04cqh 0 #fff;
}
#dyn-message-theme[data-theme="broadcast-tv"] .power,
#dyn-message-theme[data-theme="broadcast-tv"] .vol,
#dyn-message-theme[data-theme="broadcast-tv"] .tune {
  position: relative;
  flex: none;
  border-radius: 50%;
  aspect-ratio: 1;
  display: block;
}
#dyn-message-theme[data-theme="broadcast-tv"] .power {
  width: 5.6cqh;
  background: var(--body);
  box-shadow:
    -0.2cqh 0.2cqh 0.2cqh hsla(var(--wht-hsl), 0.1),
    0.2cqh -0.2cqh 0.2cqh hsla(var(--body-hsl), 0.5);
}
#dyn-message-theme[data-theme="broadcast-tv"] .power::before,
#dyn-message-theme[data-theme="broadcast-tv"] .power::after {
  content: "";
  position: absolute;
  inset: 16%;
  border-radius: 50%;
}
#dyn-message-theme[data-theme="broadcast-tv"] .power::before {
  background: #792e5b;
  box-shadow:
    -0.6cqh 0.6cqh 0.6cqh hsla(var(--body-hsl), 0.5),
    inset -0.6cqh 0.6cqh 0.6cqh hsla(var(--body-hsl), 0.5),
    inset 0 0 0 0.45cqh var(--metal),
    inset 0 0 0 0.55cqh var(--body);
}
#dyn-message-theme[data-theme="broadcast-tv"] .power::after {
  background: radial-gradient(transparent, #ff0199, transparent);
  mix-blend-mode: lighten;
  opacity: 0;
}
#dyn-message-theme[data-theme="broadcast-tv"].on .power::before { filter: brightness(1.5) contrast(1.2); }
#dyn-message-theme[data-theme="broadcast-tv"].on .power::after { opacity: 0.5; }
#dyn-message-theme[data-theme="broadcast-tv"] .vol { width: 5.6cqh; }
#dyn-message-theme[data-theme="broadcast-tv"] .tune { width: 9.2cqh; }
#dyn-message-theme[data-theme="broadcast-tv"] .vol,
#dyn-message-theme[data-theme="broadcast-tv"] .tune {
  background: var(--body);
  box-shadow:
    -0.2cqh 0.2cqh 0.2cqh hsla(var(--wht-hsl), 0.1),
    0.2cqh -0.2cqh 0.2cqh hsla(var(--body-hsl), 0.5);
}
#dyn-message-theme[data-theme="broadcast-tv"] .vol::before,
#dyn-message-theme[data-theme="broadcast-tv"] .tune::before {
  content: "";
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background: linear-gradient(45deg, #908e95, #575356, #a3a3a8);
  box-shadow:
    -0.6cqh 0.6cqh 0.6cqh hsla(var(--body-hsl), 0.5),
    inset -0.6cqh 0.6cqh 0.6cqh hsla(var(--body-hsl), 0.5),
    inset 0 0 0 0.45cqh var(--metal),
    inset 0 0 0 0.55cqh var(--body);
}
#dyn-message-theme[data-theme="broadcast-tv"] .tune::before { border: 0.12cqh dashed var(--body); inset: 6%; }
#dyn-message-theme[data-theme="broadcast-tv"] .vol::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 18%;
  width: 0.45cqh;
  height: 28%;
  background: var(--wht);
  border-radius: 0.2cqh;
  transform: translateX(-50%);
  box-shadow: inset -0.1cqh 0.1cqh 0.1cqh hsla(var(--body-hsl), 0.5);
  transform-origin: 50% 140%;
}
#dyn-message-theme[data-theme="broadcast-tv"] .tune-needle {
  position: absolute;
  left: 50%;
  top: 14%;
  width: 0.45cqh;
  height: 32%;
  background: var(--wht);
  border-radius: 0.2cqh;
  transform: translateX(-50%) rotate(0deg);
  box-shadow: inset -0.1cqh 0.1cqh 0.1cqh hsla(var(--body-hsl), 0.5);
  transform-origin: 50% 140%;
  will-change: transform;
  display: block;
}

/* ================================================================
   LIQUID GLASS
   ================================================================ */
#dyn-message-theme[data-theme="liquid-glass"] {
  --p-hot:  color-mix(in srgb, var(--primary) 42%, white);
  --p-soft: color-mix(in srgb, var(--primary) 48%, transparent);
  --p-haze: color-mix(in srgb, var(--primary) 18%, transparent);
  --s-hot:  color-mix(in srgb, var(--secondary) 38%, white);
  --s-soft: color-mix(in srgb, var(--secondary) 45%, transparent);
  --s-haze: color-mix(in srgb, var(--secondary) 16%, transparent);
  background: var(--background, #061014);
}
#dyn-message-theme[data-theme="liquid-glass"] .dyn-stage {
  background:
    radial-gradient(80vw 60vh at 18% 80%, var(--p-haze), transparent 58%),
    radial-gradient(70vw 50vh at 88% 8%, var(--s-haze), transparent 55%),
    linear-gradient(180deg,
      color-mix(in srgb, var(--background) 78%, white) 0%,
      var(--background) 52%,
      color-mix(in srgb, var(--background) 86%, black) 100%);
}
#dyn-message-theme[data-theme="liquid-glass"] .wash {
  position: absolute; inset: -10%; z-index: 1; pointer-events: none;
  background:
    radial-gradient(closest-side, color-mix(in srgb, var(--primary) 22%, transparent), transparent 70%) 20% 70% / 40% 30%,
    radial-gradient(closest-side, color-mix(in srgb, var(--secondary) 16%, transparent), transparent 68%) 70% 20% / 36% 28%;
  background-repeat: no-repeat;
  filter: blur(28px);
  opacity: 0.55;
}
#dyn-message-theme[data-theme="liquid-glass"] canvas.gl {
  position: absolute; inset: 0; z-index: 12;
  width: 100%; height: 100%;
  pointer-events: none;
  opacity: 0;
}
#dyn-message-theme[data-theme="liquid-glass"] .layout {
  position: absolute; inset: 0; z-index: 8;
  display: flex; align-items: center;
  justify-content: flex-start;
  padding: 6vh 6vw;
}
#dyn-message-theme[data-theme="liquid-glass"].no-copy .layout { justify-content: center; }
#dyn-message-theme[data-theme="liquid-glass"] .slab {
  position: relative;
  height: 78vh;
  aspect-ratio: 3 / 4;
  flex: none;
  opacity: 0;
}
#dyn-message-theme[data-theme="liquid-glass"] .floater { position: absolute; inset: 0; }
#dyn-message-theme[data-theme="liquid-glass"] .slab-glass {
  position: absolute; inset: 0;
  border-radius: 1.8vw;
  background: linear-gradient(160deg, rgba(255,255,255,.14), rgba(255,255,255,.03) 46%, rgba(255,255,255,.07));
  border: 1px solid rgba(255,255,255,.26);
  box-shadow:
    0 2.2vh 5vh rgba(0,0,0,.4),
    inset 0 1px 0 rgba(255,255,255,.4),
    0 0 3.4vw var(--p-haze);
}
#dyn-message-theme[data-theme="liquid-glass"] .photo-well {
  position: absolute; inset: 4.6%;
  border-radius: 1.2vw;
  overflow: hidden;
  background: var(--background);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.14);
}
#dyn-message-theme[data-theme="liquid-glass"] .photo-well img {
  display: block; width: 100%; height: 100%;
  object-fit: cover;
  filter: saturate(1.08) contrast(1.04);
}
#dyn-message-theme[data-theme="liquid-glass"] .copy {
  position: absolute; z-index: 14;
  right: 5vw; top: 50%;
  width: min(46vw, 820px);
  height: 74vh;
  transform: translateY(-50%);
  display: flex; flex-direction: column;
  opacity: 0;
}
#dyn-message-theme[data-theme="liquid-glass"] .copy.gone { display: none; }
#dyn-message-theme[data-theme="liquid-glass"] .msg-fit {
  flex: 1 1 auto;
  height: 0;
  min-height: 0;
  overflow: hidden;
  display: flex; align-items: center;
}
#dyn-message-theme[data-theme="liquid-glass"] .msg-fit span {
  display: block;
  width: 100%;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 500;
  font-style: italic;
  line-height: 1.02;
  color: #f6fbff;
  overflow-wrap: normal;
  text-shadow: 0 0 22px var(--p-soft);
}
#dyn-message-theme[data-theme="liquid-glass"] .name-slot {
  flex: none;
  height: 16vh;
  margin-top: 3vh;
  padding-top: 2.3vh;
  border-top: 1px solid color-mix(in srgb, var(--primary) 32%, rgba(255,255,255,.16));
  overflow: hidden;
  display: flex; align-items: center;
}
#dyn-message-theme[data-theme="liquid-glass"] .name-slot.hidden { display: none; }
#dyn-message-theme[data-theme="liquid-glass"] .name-fit {
  width: 100%; height: 12.5vh;
  overflow: hidden;
  display: flex; align-items: center;
}
#dyn-message-theme[data-theme="liquid-glass"] .name-fit span {
  display: block;
  width: 100%;
  font-family: 'Outfit', sans-serif;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 0.95;
  color: color-mix(in srgb, white 82%, var(--secondary));
  white-space: nowrap;
  text-shadow: 0 0 20px var(--s-soft);
}
#dyn-message-theme[data-theme="liquid-glass"] .copy.no-msg .msg-fit { display: none; }
#dyn-message-theme[data-theme="liquid-glass"] .copy.no-msg .name-slot {
  flex: 1; height: auto; margin-top: 0; padding-top: 0; border: 0;
}
#dyn-message-theme[data-theme="liquid-glass"] .copy.no-msg .name-fit { height: 28vh; }
#dyn-message-theme[data-theme="liquid-glass"] .copy.no-name .name-slot { display: none; }
@keyframes dynLiqRise {
  from { opacity: 0; transform: translateY(6vh); filter: blur(8px); }
  to   { opacity: 1; transform: none; filter: none; }
}
@keyframes dynLiqCopyIn {
  from { opacity: 0; transform: translateY(-50%) translateX(2.4vw); filter: blur(7px); }
  to   { opacity: 1; transform: translateY(-50%); filter: none; }
}
@keyframes dynLiqGlIn { from { opacity: 0; } to { opacity: 1; } }
#dyn-message-theme[data-theme="liquid-glass"].on .slab { animation: dynLiqRise var(--reveal-ms) cubic-bezier(.18,1.02,.28,1) both; }
#dyn-message-theme[data-theme="liquid-glass"].on .copy {
  animation: dynLiqCopyIn calc(var(--reveal-ms) * 0.68) calc(var(--reveal-ms) * 0.24) cubic-bezier(.2,.9,.22,1) both;
}
#dyn-message-theme[data-theme="liquid-glass"].on canvas.gl { animation: dynLiqGlIn calc(var(--reveal-ms) * 0.8) calc(var(--reveal-ms) * 0.1) ease both; }
@keyframes dynLiqFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.8vh); }
}
#dyn-message-theme[data-theme="liquid-glass"].on.idle .slab { animation: none; opacity: 1; transform: none; filter: none; }
#dyn-message-theme[data-theme="liquid-glass"].on.idle .copy { animation: none; opacity: 1; transform: translateY(-50%); filter: none; }
#dyn-message-theme[data-theme="liquid-glass"].on.idle canvas.gl { animation: none; opacity: 1; }
#dyn-message-theme[data-theme="liquid-glass"].on.idle .floater { animation: dynLiqFloat 10s ease-in-out infinite; }
@keyframes dynLiqSink {
  to { opacity: 0; transform: translateY(5vh); filter: blur(6px); }
}
@keyframes dynLiqCopyOut {
  to { opacity: 0; transform: translateY(-50%) translateX(-1.4vw); filter: blur(6px); }
}
@keyframes dynLiqGlOut { to { opacity: 0; } }
#dyn-message-theme[data-theme="liquid-glass"].on.off .slab { animation: dynLiqSink calc(var(--reveal-ms) * 0.48) cubic-bezier(.55,.05,.8,.3) both; }
#dyn-message-theme[data-theme="liquid-glass"].on.off .copy { animation: dynLiqCopyOut calc(var(--reveal-ms) * 0.42) both; }
#dyn-message-theme[data-theme="liquid-glass"].on.off canvas.gl { animation: dynLiqGlOut calc(var(--reveal-ms) * 0.4) both; }

/* ================================================================
   PARALLAX DRIFT
   ================================================================ */
#dyn-message-theme[data-theme="parallax-drift"] {
  --p-hot:  color-mix(in srgb, var(--primary) 40%, white);
  --p-soft: color-mix(in srgb, var(--primary) 50%, transparent);
  --p-haze: color-mix(in srgb, var(--primary) 24%, transparent);
  --s-hot:  color-mix(in srgb, var(--secondary) 38%, white);
  --s-soft: color-mix(in srgb, var(--secondary) 48%, transparent);
  --s-haze: color-mix(in srgb, var(--secondary) 22%, transparent);
  background: #07060c;
}
#dyn-message-theme[data-theme="parallax-drift"] .dyn-stage {
  background:
    radial-gradient(90vw 70vh at 80% 110%, var(--p-haze), transparent 60%),
    radial-gradient(80vw 60vh at 8% -8%, var(--s-haze), transparent 58%),
    linear-gradient(180deg, #0c0a14 0%, #07060c 60%, #09080f 100%);
  perspective: 1400px;
}
#dyn-message-theme[data-theme="parallax-drift"] .bands { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
#dyn-message-theme[data-theme="parallax-drift"] .band {
  position: absolute; left: -20%; width: 140%; height: 9vh;
  background: linear-gradient(90deg,
    transparent,
    color-mix(in srgb, var(--band, var(--primary)) 18%, transparent) 40%,
    transparent);
  filter: blur(10px);
  opacity: 0.45;
  animation: dynParaBand var(--dur, 28s) linear infinite;
  animation-delay: var(--del, 0s);
}
@keyframes dynParaBand {
  from { transform: translateX(-12%); }
  to   { transform: translateX(12%); }
}
#dyn-message-theme[data-theme="parallax-drift"] .field {
  position: absolute; inset: 0; z-index: 4;
  transform-style: preserve-3d;
  pointer-events: none;
}
#dyn-message-theme[data-theme="parallax-drift"] .ghost {
  position: absolute;
  width: 16vw; height: 22vw;
  border-radius: 0.8vw;
  overflow: hidden;
  opacity: 0;
  transform: translate3d(var(--x), var(--y), var(--z)) rotateY(var(--ry, -18deg));
  box-shadow: 0 1.4vh 3vh rgba(0,0,0,.45);
  filter: saturate(0.85);
}
#dyn-message-theme[data-theme="parallax-drift"] .ghost img {
  display: block; width: 100%; height: 100%;
  object-fit: cover;
}
#dyn-message-theme[data-theme="parallax-drift"] .ghost::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(160deg, var(--s-haze), var(--p-haze));
  mix-blend-mode: soft-light;
}
#dyn-message-theme[data-theme="parallax-drift"].on .ghost {
  opacity: var(--op, 0.22);
  animation: dynParaGhostIn calc(var(--reveal-ms) * 0.8) calc(var(--reveal-ms) * var(--gd, 0.1)) both ease;
}
@keyframes dynParaGhostIn {
  from { opacity: 0; filter: blur(12px); }
  to   { opacity: var(--op, 0.22); filter: blur(var(--blur, 2px)); }
}
#dyn-message-theme[data-theme="parallax-drift"].on.idle .ghost { animation: dynParaGhostDrift var(--gdur, 22s) ease-in-out infinite alternate; }
@keyframes dynParaGhostDrift {
  from { transform: translate3d(var(--x), var(--y), var(--z)) rotateY(var(--ry, -18deg)); }
  to   { transform: translate3d(calc(var(--x) + var(--dx, 4vw)), calc(var(--y) + var(--dy, -2vh)), var(--z)) rotateY(calc(var(--ry, -18deg) + 8deg)); }
}
#dyn-message-theme[data-theme="parallax-drift"] .hero {
  position: absolute; z-index: 10;
  left: 7vw; top: 50%;
  height: 78vh;
  aspect-ratio: 3 / 4;
  transform: translateY(-50%) rotateY(18deg) rotateX(4deg);
  transform-origin: 20% 50%;
  opacity: 0;
}
#dyn-message-theme[data-theme="parallax-drift"] .frame {
  position: relative; width: 100%; height: 100%;
  border-radius: 1.3vw;
  overflow: hidden;
  background: #0a0910;
  box-shadow:
    0 3vh 7vh rgba(0,0,0,.55),
    0 0 0 1px rgba(255,255,255,.1),
    0 0 5vw var(--p-haze);
}
#dyn-message-theme[data-theme="parallax-drift"] .frame img {
  display: block; width: 100%; height: 100%;
  object-fit: cover;
  filter: saturate(1.12) contrast(1.05);
}
#dyn-message-theme[data-theme="parallax-drift"] .frame::before {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 0 0 2px rgba(255,255,255,.14);
}
#dyn-message-theme[data-theme="parallax-drift"] .frame::after {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(115deg, rgba(255,255,255,.2), transparent 32%, transparent 70%, var(--p-haze));
  mix-blend-mode: overlay;
}
#dyn-message-theme[data-theme="parallax-drift"] .plaque,
#dyn-message-theme[data-theme="parallax-drift"] .haze {
  position: absolute;
  left: 44vw; right: 5vw; top: 50%;
  height: 74vh;
  display: flex; flex-direction: column; justify-content: center;
  pointer-events: none;
  opacity: 0;
}
#dyn-message-theme[data-theme="parallax-drift"] .plaque {
  z-index: 12;
  transform: translateY(-50%) rotateY(-8deg);
  transform-origin: 0 50%;
}
#dyn-message-theme[data-theme="parallax-drift"] .haze {
  z-index: 11;
  transform: translateY(-50%) translateZ(140px);
}
#dyn-message-theme[data-theme="parallax-drift"] .haze-wash {
  position: absolute;
  left: -10vw; right: 8%;
  top: 6%; bottom: 14%;
  background: radial-gradient(ellipse 70% 65% at 28% 42%, var(--p-soft), transparent 72%);
  filter: blur(48px);
  opacity: 0.55;
  pointer-events: none;
}
#dyn-message-theme[data-theme="parallax-drift"] .plaque.gone,
#dyn-message-theme[data-theme="parallax-drift"] .haze.gone { display: none; }
#dyn-message-theme[data-theme="parallax-drift"] .plaque-inner,
#dyn-message-theme[data-theme="parallax-drift"] .haze-inner {
  position: relative;
  z-index: 1;
  display: flex; flex-direction: column;
  height: 100%;
}
#dyn-message-theme[data-theme="parallax-drift"] .msg-fit,
#dyn-message-theme[data-theme="parallax-drift"] .haze-msg {
  flex: 1 1 auto;
  height: 0;
  min-height: 0;
  display: flex; align-items: center;
}
#dyn-message-theme[data-theme="parallax-drift"] .msg-fit { overflow: hidden; }
#dyn-message-theme[data-theme="parallax-drift"] .haze-msg {
  overflow: visible;
  filter: blur(70px);
  opacity: 0.55;
  transform: translateX(-3vw);
}
#dyn-message-theme[data-theme="parallax-drift"] .msg-fit span,
#dyn-message-theme[data-theme="parallax-drift"] .haze-msg span {
  display: block;
  width: 100%;
  font-family: 'Anton', 'Arial Narrow', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  line-height: 0.9;
  overflow-wrap: normal;
}
#dyn-message-theme[data-theme="parallax-drift"] .haze-msg span { color: var(--primary); }
#dyn-message-theme[data-theme="parallax-drift"] .msg-fit span { color: #fff; }
#dyn-message-theme[data-theme="parallax-drift"] .name-slot,
#dyn-message-theme[data-theme="parallax-drift"] .haze-name {
  flex: none;
  height: 16vh;
  margin-top: 3.2vh;
  display: flex; align-items: center;
}
#dyn-message-theme[data-theme="parallax-drift"] .name-slot {
  padding-top: 2.2vh;
  border-top: 3px solid color-mix(in srgb, var(--primary) 70%, transparent);
  overflow: hidden;
}
#dyn-message-theme[data-theme="parallax-drift"] .name-slot.hidden,
#dyn-message-theme[data-theme="parallax-drift"] .haze-name.hidden { display: none; }
#dyn-message-theme[data-theme="parallax-drift"] .name-fit,
#dyn-message-theme[data-theme="parallax-drift"] .haze-name {
  width: 100%;
}
#dyn-message-theme[data-theme="parallax-drift"] .name-fit {
  height: 12.5vh;
  overflow: hidden;
  display: flex; align-items: center;
}
#dyn-message-theme[data-theme="parallax-drift"] .haze-name {
  overflow: visible;
  filter: blur(48px);
  opacity: 0.62;
  transform: translateX(-2vw);
}
#dyn-message-theme[data-theme="parallax-drift"] .name-fit span,
#dyn-message-theme[data-theme="parallax-drift"] .haze-name span {
  display: block;
  width: 100%;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 0.95;
  white-space: nowrap;
}
#dyn-message-theme[data-theme="parallax-drift"] .haze-name span { color: var(--secondary); }
#dyn-message-theme[data-theme="parallax-drift"] .name-fit span { color: var(--s-hot); }
#dyn-message-theme[data-theme="parallax-drift"] .plaque.no-msg .msg-fit,
#dyn-message-theme[data-theme="parallax-drift"] .haze.no-msg .haze-msg { display: none; }
#dyn-message-theme[data-theme="parallax-drift"] .plaque.no-msg .name-slot,
#dyn-message-theme[data-theme="parallax-drift"] .haze.no-msg .haze-name {
  flex: 1; height: auto; margin-top: 0; padding-top: 0; border: 0;
}
#dyn-message-theme[data-theme="parallax-drift"] .plaque.no-msg .name-fit,
#dyn-message-theme[data-theme="parallax-drift"] .haze.no-msg .haze-name { height: 28vh; }
#dyn-message-theme[data-theme="parallax-drift"] .plaque.no-name .name-slot,
#dyn-message-theme[data-theme="parallax-drift"] .haze.no-name .haze-name { display: none; }
#dyn-message-theme[data-theme="parallax-drift"].no-copy .hero {
  left: 50%;
  transform: translate(-50%, -50%) rotateY(8deg) rotateX(2deg);
}
@keyframes dynParaHeroIn {
  0%   { opacity: 0; transform: translateY(-50%) rotateY(46deg) rotateX(8deg) translate3d(-8vw, 2vh, -90px) scale(0.9); }
  72%  { opacity: 1; transform: translateY(-50%) rotateY(20deg) rotateX(4.4deg); }
  100% { opacity: 1; transform: translateY(-50%) rotateY(18deg) rotateX(4deg); }
}
@keyframes dynParaHeroInC {
  0%   { opacity: 0; transform: translate(-50%, -50%) rotateY(36deg) rotateX(6deg) scale(0.9); }
  72%  { opacity: 1; transform: translate(-50%, -50%) rotateY(9deg) rotateX(2.2deg); }
  100% { opacity: 1; transform: translate(-50%, -50%) rotateY(8deg) rotateX(2deg); }
}
@keyframes dynParaPlaqueIn {
  0%   { opacity: 0; transform: translateY(-50%) rotateY(-20deg) translate3d(4vw, 1vh, -40px); }
  72%  { opacity: 1; transform: translateY(-50%) rotateY(-9deg); }
  100% { opacity: 1; transform: translateY(-50%) rotateY(-8deg); }
}
#dyn-message-theme[data-theme="parallax-drift"].on .hero { opacity: 1; animation: dynParaHeroIn var(--reveal-ms) cubic-bezier(.2,.72,.22,1) both; }
#dyn-message-theme[data-theme="parallax-drift"].no-copy.on .hero { animation-name: dynParaHeroInC; }
@keyframes dynParaHazeIn {
  0%   { opacity: 0; transform: translateY(-50%) translateZ(140px) translate3d(4vw, 1vh, 0); }
  72%  { opacity: 1; transform: translateY(-50%) translateZ(140px); }
  100% { opacity: 1; transform: translateY(-50%) translateZ(140px); }
}
#dyn-message-theme[data-theme="parallax-drift"].on .plaque {
  opacity: 1;
  animation: dynParaPlaqueIn calc(var(--reveal-ms) * 0.82) calc(var(--reveal-ms) * 0.1) cubic-bezier(.2,.72,.22,1) both;
}
#dyn-message-theme[data-theme="parallax-drift"].on .haze {
  opacity: 1;
  animation: dynParaHazeIn calc(var(--reveal-ms) * 0.82) calc(var(--reveal-ms) * 0.1) cubic-bezier(.2,.72,.22,1) both;
}
@keyframes dynParaHeroDrift {
  0%, 100% { transform: translateY(-50%) rotateY(18deg) rotateX(4deg); }
  50% { transform: translateY(calc(-50% - 0.7vh)) rotateY(22deg) rotateX(2deg); }
}
@keyframes dynParaHeroDriftC {
  0%, 100% { transform: translate(-50%, -50%) rotateY(8deg) rotateX(2deg); }
  50% { transform: translate(-50%, calc(-50% - 0.7vh)) rotateY(11deg) rotateX(1deg); }
}
@keyframes dynParaPlaqueDrift {
  0%, 100% { transform: translateY(-50%) rotateY(-8deg); }
  50% { transform: translateY(calc(-50% - 0.55vh)) rotateY(-6deg); }
}
#dyn-message-theme[data-theme="parallax-drift"].on.idle .hero {
  opacity: 1;
  animation: dynParaHeroDrift 16s ease-in-out infinite;
}
#dyn-message-theme[data-theme="parallax-drift"].no-copy.on.idle .hero { animation-name: dynParaHeroDriftC; }
@keyframes dynParaHazeDrift {
  0%, 100% { transform: translateY(-50%) translateZ(140px); }
  50% { transform: translateY(calc(-50% - 0.55vh)) translateZ(140px); }
}
#dyn-message-theme[data-theme="parallax-drift"].on.idle .plaque {
  opacity: 1;
  animation: dynParaPlaqueDrift 16s ease-in-out infinite;
}
#dyn-message-theme[data-theme="parallax-drift"].on.idle .haze {
  opacity: 1;
  animation: dynParaHazeDrift 16s ease-in-out infinite;
}
@keyframes dynParaHeroOut {
  from { opacity: 1; transform: translateY(-50%) rotateY(18deg) rotateX(4deg); }
  to { opacity: 0; transform: translateY(-50%) rotateY(-40deg) rotateX(2deg) translate3d(7vw, 0, -40px) scale(0.92); }
}
@keyframes dynParaHeroOutC {
  from { opacity: 1; transform: translate(-50%, -50%) rotateY(8deg) rotateX(2deg); }
  to { opacity: 0; transform: translate(-50%, -50%) rotateY(-36deg) scale(0.92); }
}
@keyframes dynParaPlaqueOut {
  from { opacity: 1; transform: translateY(-50%) rotateY(-8deg); }
  to { opacity: 0; transform: translateY(-50%) rotateY(12deg) translate3d(-3vw, 0, -20px); }
}
@keyframes dynParaGhostOut {
  to { opacity: 0; filter: blur(14px); }
}
#dyn-message-theme[data-theme="parallax-drift"].on.off .hero { animation: dynParaHeroOut calc(var(--reveal-ms) * 0.5) cubic-bezier(.6,.05,.85,.35) both; }
#dyn-message-theme[data-theme="parallax-drift"].no-copy.on.off .hero { animation-name: dynParaHeroOutC; }
@keyframes dynParaHazeOut {
  from { opacity: 1; transform: translateY(-50%) translateZ(140px); }
  to { opacity: 0; transform: translateY(-50%) translateZ(140px) translate3d(-3vw, 0, 0); }
}
#dyn-message-theme[data-theme="parallax-drift"].on.off .plaque { animation: dynParaPlaqueOut calc(var(--reveal-ms) * 0.4) both; }
#dyn-message-theme[data-theme="parallax-drift"].on.off .haze { animation: dynParaHazeOut calc(var(--reveal-ms) * 0.4) both; }
#dyn-message-theme[data-theme="parallax-drift"].on.off .ghost { animation: dynParaGhostOut 360ms both; }
#dyn-message-theme[data-theme="parallax-drift"] .vignette {
  position: absolute; inset: 0; z-index: 20; pointer-events: none;
  background: radial-gradient(120vw 100vh at 42% 48%, transparent 55%, rgba(0,0,0,.55) 100%);
}

/* ================================================================
   PORTRAIT CANVAS: restack when the stage is taller than wide
   (auto on a tall window, or any portrait ratio).
   Photo-above-copy for most themes; liquid-glass and broadcast-tv
   put the banner on top and the photo in the lower half.
   ================================================================ */
#dyn-message-theme.dyn-portrait[data-theme="led-scoreboard"] .content { flex-direction: column; }
#dyn-message-theme.dyn-portrait[data-theme="led-scoreboard"] .photo-panel { width: 100%; height: 40%; }
#dyn-message-theme.dyn-portrait[data-theme="neon-nightclub"] .photo-wrap {
  left: 50%; top: 27%; height: 44cqh; transform: translate(-50%, -50%);
}
#dyn-message-theme.dyn-portrait[data-theme="neon-nightclub"] .panel {
  left: 7cqw; right: 7cqw; top: 73%; height: 36cqh;
}
#dyn-message-theme.dyn-portrait[data-theme="ultras-tifo"] .content { flex-direction: column; gap: 2.5%; }
#dyn-message-theme.dyn-portrait[data-theme="ultras-tifo"] .patch-col { flex: 0 0 42%; width: auto; }
#dyn-message-theme.dyn-portrait[data-theme="ultras-tifo"] .patch { width: auto; height: 100%; }
#dyn-message-theme.dyn-portrait[data-theme="ultras-tifo"] .msg-col { flex: 1 1 auto; width: 100%; min-height: 0; }
#dyn-message-theme.dyn-portrait[data-theme="holo-card"] .layout { flex-direction: column; gap: 3cqh; }
#dyn-message-theme.dyn-portrait[data-theme="holo-card"] .rig { height: 44cqh; }
#dyn-message-theme.dyn-portrait[data-theme="holo-card"] .copy {
  flex: none; width: 88cqw; max-width: 88cqw; height: 34cqh; justify-content: flex-start;
}
#dyn-message-theme.dyn-portrait[data-theme="holo-card"] .copy.no-msg .name-fit { height: 18cqh; }
#dyn-message-theme.dyn-portrait[data-theme="liquid-glass"] .layout {
  justify-content: flex-end; align-items: flex-end; padding-top: 0; padding-bottom: 5cqh;
}
#dyn-message-theme.dyn-portrait[data-theme="liquid-glass"] .slab { height: 52cqh; }
#dyn-message-theme.dyn-portrait[data-theme="liquid-glass"] .copy {
  left: 7cqw; right: 7cqw; width: auto; top: 6%; height: 28cqh;
}
#dyn-message-theme.dyn-portrait[data-theme="parallax-drift"] .hero {
  height: 42cqh; left: calc(50cqw - 15.75cqh); top: 26%;
}
#dyn-message-theme.dyn-portrait[data-theme="parallax-drift"] .plaque,
#dyn-message-theme.dyn-portrait[data-theme="parallax-drift"] .haze {
  left: 8cqw; right: 8cqw; top: 73%; height: 40cqh;
}
#dyn-message-theme.dyn-portrait[data-theme="broadcast-tv"] .tv {
  width: min(94cqw, calc(94cqh * 0.68));
  height: min(94cqh, calc(94cqw / 0.68));
}
#dyn-message-theme.dyn-portrait[data-theme="broadcast-tv"] .set {
  flex-direction: column;
}
#dyn-message-theme.dyn-portrait[data-theme="broadcast-tv"] .crt {
  width: 100%;
  height: auto;
  flex: 1 1 auto;
  aspect-ratio: 3 / 4;
}
#dyn-message-theme.dyn-portrait[data-theme="broadcast-tv"] .news {
  left: 6%;
  right: 6%;
  top: 5%;
  bottom: auto;
  max-height: 26%;
}
`;

  // Viewport units in the ported CSS become container units resolved against
  // the design-space stage, so 1cqh inside a 1080-tall stage is exactly what
  // 1vh was in the original full-screen template.
  const STYLE = RAW_STYLE
    .replace(/(\d*\.?\d+)vh\b/g, "$1cqh")
    .replace(/(\d*\.?\d+)vw\b/g, "$1cqw")
    .replace(
      /#dyn-message-theme\.dyn-portrait\[data-theme="([^"]+)"\]/g,
      '#dyn-message-theme.dyn-portrait:is([data-theme="$1"], [data-engine="$1"])'
    )
    .replace(
      /#dyn-message-theme\[data-theme="([^"]+)"\]/g,
      '#dyn-message-theme:is([data-theme="$1"], [data-engine="$1"])'
    );

  const FONTS =
    "https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@600;700;800&family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Mr+Dafoe&family=Oswald:wght@500;600;700&family=Outfit:wght@400;500;600&family=Syne:wght@600;700;800&display=swap";

  // ================================================================
  // Shared utilities
  // ================================================================

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Original template fit: shrink px font until the span fits its container.
  // Sizes are design-space pixels; the stage transform scales them uniformly.
  // With overflow-wrap: normal, words never split — long words force the font
  // smaller until the longest word fits the line.
  function fitPx(containerEl, spanEl, maxPx, minPx) {
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

  // ---------------- Design-space stage ----------------
  // The Vixi canvas uses a design space on the long edge (1920). Auto uses
  // the window ratio; presets and custom ratios use that ratio. Everything
  // renders at that size and the stage is scale()-transformed to fill the
  // canvas, so text, photo and chrome shrink or grow together.

  let stageScale = 1;
  let currentThemeRoot = null;
  let stageResizeObserver = null;

  function layoutFitStage(themeRoot) {
    if (!themeRoot || !themeRoot.isConnected) return false;
    const stage = themeRoot.querySelector(":scope > .dyn-fit-stage");
    if (!stage) return false;
    const rect = themeRoot.getBoundingClientRect();
    const rw = rect.width;
    const rh = rect.height;
    // Host often settles after mosaic→message handoff without a window resize.
    // Never fall back to innerWidth/Height — that locks an oversized scale and
    // looks like the capture "blew up" until something forces a reflow.
    if (rw < 8 || rh < 8) {
      if (!stage.dataset.dynFitPending) {
        stage.dataset.dynFitPending = "1";
        requestAnimationFrame(() => {
          delete stage.dataset.dynFitPending;
          if (themeRoot.isConnected) layoutFitStage(themeRoot);
        });
      }
      return false;
    }
    const rules = root.BGExtensionRules;
    const size =
      rules && typeof rules.resolveStageSize === "function"
        ? rules.resolveStageSize({ clientWidth: rw, clientHeight: rh })
        : {
            dw: rw >= rh ? 1920 : Math.max(1, Math.round(1920 * (rw / rh))),
            dh: rw >= rh ? Math.max(1, Math.round(1920 * (rh / rw))) : 1920,
            portrait: rh > rw,
            mode: "auto",
          };
    const dw = size.dw;
    const dh = size.dh;
    const flipped =
      (stage.dataset.dw && stage.dataset.dw !== String(dw)) ||
      (stage.dataset.dh && stage.dataset.dh !== String(dh));
    stage.dataset.dw = String(dw);
    stage.dataset.dh = String(dh);
    stage.style.width = dw + "px";
    stage.style.height = dh + "px";
    themeRoot.classList.toggle("dyn-portrait", Boolean(size.portrait));
    themeRoot.dataset.aspect =
      rules && typeof rules.stageAspectToken === "function"
        ? rules.stageAspectToken(size)
        : "auto";
    const mode = size.mode || "auto";
    const s =
      rules && typeof rules.stageContainScale === "function"
        ? rules.stageContainScale(rw, rh, dw, dh, mode)
        : Math.min(rw / dw, rh / dh, mode === "vixi" ? 1 : Infinity);
    stageScale = s;
    stage.style.left = ((rw - dw * s) / 2).toFixed(2) + "px";
    stage.style.top = ((rh - dh * s) / 2).toFixed(2) + "px";
    stage.style.transform = "scale(" + s.toFixed(5) + ")";
    return Boolean(flipped);
  }

  function watchFitStage(themeRoot) {
    currentThemeRoot = themeRoot;
    if (typeof ResizeObserver === "undefined") return;
    if (!stageResizeObserver) {
      stageResizeObserver = new ResizeObserver(() => {
        if (currentThemeRoot && currentThemeRoot.isConnected) {
          layoutFitStage(currentThemeRoot);
        }
      });
    }
    stageResizeObserver.disconnect();
    stageResizeObserver.observe(themeRoot);
  }

  function ensureFitStage(themeRoot) {
    let stage = themeRoot.querySelector(":scope > .dyn-fit-stage");
    if (!stage) {
      stage = document.createElement("div");
      stage.className = "dyn-fit-stage";
      themeRoot.appendChild(stage);
    }
    watchFitStage(themeRoot);
    layoutFitStage(themeRoot);
    return stage;
  }

  function loadFonts(specs) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([
      Promise.all(specs.map((s) => document.fonts.load(s).catch(() => {}))),
      wait(2500),
    ]);
  }

  function whenDecoded(img) {
    if (!img || !img.getAttribute("src")) return Promise.resolve();
    if (img.complete && img.naturalWidth) {
      return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    }
    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      setTimeout(done, 1200);
    });
  }

  function resetGrungePasteInline(themeRoot) {
    if (!themeRoot) return;
    themeRoot
      .querySelectorAll(".photo-paste, .msg-paste, .name-stamp, .scrap-a, .scrap-b")
      .forEach((el) => {
        el.style.removeProperty("opacity");
        el.style.removeProperty("animation");
        el.style.removeProperty("transform");
      });
  }

  function prepGrungeMessageTransition(themeRoot) {
    if (!themeRoot || themeRoot.dataset.theme !== "message-grunge-poster") return;
    themeRoot.classList.remove("dyn-grunge-paste-lock");
    resetGrungePasteInline(themeRoot);
  }

  function ensurePosterPasteVisible(themeRoot) {
    if (!themeRoot || themeRoot.dataset.theme !== "message-grunge-poster") return;
    if (!themeRoot.classList.contains("on") || themeRoot.classList.contains("off")) return;
    themeRoot.querySelectorAll(".photo-paste, .msg-paste, .name-stamp").forEach((el) => {
      if (themeRoot.classList.contains("no-photo") && el.classList.contains("photo-paste")) return;
      const opacity = Number.parseFloat(root.getComputedStyle(el).opacity || "0");
      if (opacity < 0.05) themeRoot.classList.add("dyn-grunge-paste-lock");
    });
  }

  function replayGuestMotion(themeRoot) {
    if (!themeRoot || !themeRoot.classList.contains("on")) return;
    const targets = themeRoot.querySelectorAll(".photo-paste, .msg-paste, .name-stamp");
    targets.forEach((el) => {
      el.style.animation = "none";
    });
    void themeRoot.offsetWidth;
    targets.forEach((el) => {
      el.style.animation = "";
    });
    if (themeRoot.dataset.theme === "message-grunge-poster") {
      root.setTimeout(() => ensurePosterPasteVisible(themeRoot), 920);
    }
  }

  function replayEnterMotion(themeRoot) {
    if (!themeRoot || !themeRoot.classList.contains("on")) return;
    const targets = themeRoot.querySelectorAll(
      ".photo-paste, .msg-paste, .name-stamp, .scrap-a, .scrap-b"
    );
    targets.forEach((el) => {
      el.style.animation = "none";
    });
    void themeRoot.offsetWidth;
    targets.forEach((el) => {
      el.style.animation = "";
    });
    root.setTimeout(() => ensurePosterPasteVisible(themeRoot), 920);
  }

  function photoStyleOf(settings) {
    const rules = root.BGExtensionRules;
    const raw =
      settings && settings.photoStyle != null
        ? settings.photoStyle
        : settings && typeof settings.colorPhotos === "boolean"
          ? settings.colorPhotos
          : undefined;
    if (rules && typeof rules.normalizePhotoStyle === "function") {
      return rules.normalizePhotoStyle(raw, "bw");
    }
    if (raw === true || raw === "true") return "color";
    if (PHOTO_STYLE_MODES.includes(raw)) return raw;
    return "bw";
  }

  const PHOTO_STYLE_MODES = ["bw", "color", "sepia"];

  function applyPhotoStyle(themeRoot, settings) {
    if (!themeRoot) return;
    const ps = photoStyleOf(settings || {});
    themeRoot.setAttribute("data-photo-style", ps);
    themeRoot.removeAttribute("data-color-photos");
    if (themeRoot.dataset.theme === "message-grunge-poster") {
      let filt = "grayscale(1) contrast(1.2) brightness(0.95)";
      if (ps === "color") filt = "contrast(1.05) brightness(0.98)";
      else if (ps === "sepia") filt = "sepia(0.88) contrast(1.08) brightness(0.92) saturate(0.85)";
      themeRoot.querySelectorAll(".photo-mat img").forEach((img) => {
        img.style.filter = filt;
      });
    }
  }

  function grungePaperColor(themeRoot, settings) {
    if (settings && settings.secondary != null && settings.secondary !== "") {
      return settings.secondary;
    }
    if (themeRoot && themeRoot.style) {
      const paper = themeRoot.style.getPropertyValue("--paper").trim();
      if (paper) return paper;
      const secondary = themeRoot.style.getPropertyValue("--secondary").trim();
      if (secondary) return secondary;
    }
    return "#d9c7a4";
  }

  /** Grunge paper sits under multiply textures — CSS vars alone rarely repaint live. */
  function grungeWallUrl() {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL("packs/assets/grunge-wall.webp");
      }
    } catch {
      /* not extension */
    }
    try {
      const path = String(location.pathname || "");
      const base = path.includes("/themes/") ? "assets/" : "themes/assets/";
      return new URL(base + "grunge-wall.webp", location.href).href;
    } catch {
      return "themes/assets/grunge-wall.webp";
    }
  }

  function applyGrungeWall(themeRoot) {
    if (!themeRoot || themeRoot.dataset.theme !== "message-grunge-poster") return;
    const rulesApi = root.BGExtensionRules;
    const hideWall =
      rulesApi &&
      typeof rulesApi.isStageBackgroundActive === "function" &&
      rulesApi.isStageBackgroundActive(themeRoot);
    themeRoot.querySelectorAll(".wall").forEach((el) => {
      if (hideWall) {
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
        el.style.setProperty("pointer-events", "none", "important");
        return;
      }
      el.style.removeProperty("visibility");
      el.style.removeProperty("opacity");
      el.style.removeProperty("pointer-events");
      const url = grungeWallUrl();
      if (el.getAttribute("data-dyn-wall") === url && (el.style.backgroundImage || "").indexOf("url(") !== -1) {
        return;
      }
      el.setAttribute("data-dyn-wall", url);
      el.style.setProperty("background-color", "#3a322c", "important");
      el.style.setProperty("background-image", 'url("' + url + '")', "important");
      el.style.setProperty("background-size", "cover", "important");
      el.style.setProperty("background-position", "center", "important");
      el.style.setProperty("background-repeat", "no-repeat", "important");
      el.style.removeProperty("mix-blend-mode");
    });
  }

  function ensureGrungeLiveStyle() {
    let style = document.getElementById("dyn-grunge-live-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "dyn-grunge-live-style";
      document.documentElement.appendChild(style);
    }
    style.textContent =
      '#dyn-message-theme[data-theme="message-grunge-poster"] .msg-paper::before,' +
      '#dyn-message-theme[data-theme="message-grunge-poster"] .msg-paper::after{display:none!important;}';
  }

  function applyGrungePresentation(themeRoot, settings) {
    if (!themeRoot || themeRoot.dataset.theme !== "message-grunge-poster") return;
    ensureGrungeLiveStyle();
    applyGrungeWall(themeRoot);
    const paper = grungePaperColor(themeRoot, settings);
    themeRoot.querySelectorAll(".photo-mat, .msg-paper").forEach((el) => {
      el.style.setProperty("background-color", paper, "important");
      el.style.setProperty("background-image", "none", "important");
    });
    const stampBg = "color-mix(in srgb, " + paper + " 88%, #fff)";
    themeRoot.querySelectorAll(".name-stamp").forEach((el) => {
      el.style.setProperty("background", stampBg, "important");
    });
  }

  function applyVars(themeRoot, settings) {
    if (!themeRoot || !settings) return;
    const wasOn = themeRoot.classList.contains("on");
    const prevMotion = themeRoot.getAttribute("data-motion") || "";
    const isGrunge = themeRoot.dataset.theme === "message-grunge-poster";
    if (settings.primary != null && settings.primary !== "") {
      themeRoot.style.setProperty("--primary", settings.primary);
      themeRoot.style.setProperty("--ink", settings.primary);
      if (isGrunge) themeRoot.style.setProperty("--stamp-ink", settings.primary);
    }
    if (settings.secondary != null && settings.secondary !== "") {
      themeRoot.style.setProperty("--secondary", settings.secondary);
      themeRoot.style.setProperty("--paper", settings.secondary);
    }
    if (settings.background != null && settings.background !== "") {
      themeRoot.style.setProperty("--background", settings.background);
      if (!isGrunge) themeRoot.style.setProperty("--wall", settings.background);
    } else if (isGrunge) {
      themeRoot.style.removeProperty("--background");
      themeRoot.style.removeProperty("--wall");
    }
    if (settings.frame != null && settings.frame !== "") {
      themeRoot.style.setProperty("--frame", settings.frame);
    }
    applyPhotoStyle(themeRoot, settings);
    themeRoot.style.setProperty("--reveal-ms", (settings.revealMs || 1000) + "ms");
    const nextMotion = settings.motion || "";
    if (nextMotion) themeRoot.setAttribute("data-motion", nextMotion);
    else themeRoot.removeAttribute("data-motion");
    if (wasOn && nextMotion !== prevMotion) replayEnterMotion(themeRoot);
    if (isGrunge) applyGrungePresentation(themeRoot, settings);
  }

  function commonShowPrep(themeRoot, state, extraClasses) {
    prepGrungeMessageTransition(themeRoot);
    themeRoot.classList.remove("on", "off", "idle", "held", "no-copy");
    (extraClasses || []).forEach((cls) => themeRoot.classList.remove(cls));
    if (state && state.idleTimer) {
      clearTimeout(state.idleTimer);
      state.idleTimer = 0;
    }
    layoutFitStage(themeRoot);
  }

  async function finishShow(themeRoot, images) {
    await Promise.all((images || []).filter(Boolean).map(whenDecoded));
    layoutFitStage(themeRoot);
    void themeRoot.offsetWidth;
    themeRoot.classList.remove("dyn-awaiting-show");
    themeRoot.classList.add("on");
    if (themeRoot.dataset.theme === "message-grunge-poster") {
      root.setTimeout(() => ensurePosterPasteVisible(themeRoot), 980);
    }
  }

  function armIdle(themeRoot, state, delayMs, className, onIdle) {
    if (!state) return;
    clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(() => {
      if (themeRoot.classList.contains("on") && !themeRoot.classList.contains("off")) {
        themeRoot.classList.add(className || "idle");
        if (onIdle) {
          try {
            onIdle();
          } catch {
            /* noop */
          }
        }
      }
    }, Math.max(0, delayMs || 0));
  }

  function hideTheme(themeRoot, state, waitMs, extraClasses) {
    if (!themeRoot.classList.contains("on")) return Promise.resolve();
    if (themeRoot.dataset.keepChrome === "1" && !themeRoot.classList.contains("is-parked")) {
      return Promise.resolve();
    }
    prepGrungeMessageTransition(themeRoot);
    if (state && state.idleTimer) {
      clearTimeout(state.idleTimer);
      state.idleTimer = 0;
    }
    themeRoot.classList.remove("idle", "held");
    themeRoot.classList.add("off");
    return wait(Math.max(120, waitMs)).then(() => {
      themeRoot.classList.add("dyn-awaiting-show");
      themeRoot.classList.remove("on", "off", "idle", "held");
      (extraClasses || []).forEach((cls) => themeRoot.classList.remove(cls));
    });
  }

  // On resize the stage transform is updated immediately (cheap, uniform
  // scaling). A refit remounts when the design size itself changed (window
  // ratio in auto, or a landscape/portrait flip).
  let activeRefit = null;
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    let flipped = false;
    if (currentThemeRoot && currentThemeRoot.isConnected) {
      const rulesApi = root.BGExtensionRules;
      if (rulesApi && typeof rulesApi.applyStageFrame === "function") {
        rulesApi.applyStageFrame(currentThemeRoot);
      }
      flipped = layoutFitStage(currentThemeRoot);
    }
    if (!flipped) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      try {
        if (activeRefit) activeRefit();
      } catch {
        /* noop */
      }
    }, 120);
  });

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

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ================================================================
  // LED Scoreboard: dot-matrix renderer (ported verbatim)
  // ================================================================

  const MATRIX_FONT = 'Anton, "Arial Narrow", sans-serif';
  const measureCtx = document.createElement("canvas").getContext("2d");

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

  function renderMatrix(canvas, boardEl, text, maxLines, primary) {
    const box = canvas.parentNode;
    if (!box) return;
    const w = box.clientWidth;
    const h = box.clientHeight;
    text = String(text || "").trim().toUpperCase();
    if (!w || !h || !text) {
      canvas.width = canvas.height = 0;
      canvas.style.width = canvas.style.height = "0px";
      return;
    }
    // Backing store matches physical pixels: design px x device ratio x stage scale.
    const dpr = Math.min(2.5, Math.max(0.5, (window.devicePixelRatio || 1) * (stageScale || 1)));
    const pitch = Math.max(4, Math.round(boardEl.clientHeight * 0.0062));
    const cols = Math.max(4, Math.floor(w / pitch));
    const rows = Math.max(4, Math.floor(h / pitch));
    const words = text.split(/\s+/);
    measureCtx.font = "100px " + MATRIX_FONT;
    measureCtx.letterSpacing = "7px";
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
    rctx.font = fpx.toFixed(2) + "px " + MATRIX_FONT;
    rctx.letterSpacing = (fpx * 0.07).toFixed(2) + "px";
    rctx.textAlign = "center";
    rctx.textBaseline = "middle";
    rctx.fillStyle = "#fff";
    const fatten = best.size >= 26;
    rctx.strokeStyle = "#fff";
    rctx.lineWidth = SS * 1.1;
    rctx.lineJoin = "round";
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

  // ================================================================
  // Neon Nightclub: procedural wobbly frame (ported verbatim)
  // ================================================================

  function neonRoundedRectPoint(x, y, w, h, r, t) {
    const sw = w - 2 * r;
    const sh = h - 2 * r;
    const arc = (Math.PI * r) / 2;
    const per = 2 * sw + 2 * sh + 4 * arc;
    let d = (((t % 1) + 1) % 1) * per;
    if (d < sw) return { x: x + r + d, y };
    d -= sw;
    if (d < arc) {
      const a = d / r;
      return { x: x + w - r + Math.sin(a) * r, y: y + r - Math.cos(a) * r };
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
      const a = d / r;
      return { x: x + r - Math.sin(a) * r, y: y + h - r + Math.cos(a) * r };
    }
    d -= arc;
    if (d < sh) return { x, y: y + h - r - d };
    d -= sh;
    const a = d / r;
    return { x: x + r - Math.cos(a) * r, y: y + r - Math.sin(a) * r };
  }

  function neonWobblyRectPath(rect, inset, jitter, seed, phase) {
    const rnd = mulberry32(seed);
    const x = rect.x - inset;
    const y = rect.y - inset;
    const w = rect.w + 2 * inset;
    const h = rect.h + 2 * inset;
    const r = Math.max(18, rect.r + inset * 0.85);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const N = 30;
    const raw = [];
    for (let i = 0; i < N; i += 1) raw.push((rnd() * 2 - 1) * jitter);
    const smoothJ = raw.map(
      (v, i) => (raw[(i + N - 1) % N] + v * 2 + raw[(i + 1) % N]) / 4
    );
    const pts = [];
    for (let i = 0; i < N; i += 1) {
      const p = neonRoundedRectPoint(x, y, w, h, r, i / N + phase);
      let nx = p.x - cx;
      let ny = p.y - cy;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      const j = smoothJ[i];
      const tj = (rnd() * 2 - 1) * jitter * 0.4;
      pts.push({ x: p.x + nx * j - ny * tj, y: p.y + ny * j + nx * tj });
    }
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} `;
    for (let i = 0; i < N; i += 1) {
      const p0 = pts[(i + N - 1) % N];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % N];
      const p3 = pts[(i + 2) % N];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `;
    }
    return d + "Z";
  }

  const NEON_PHOTO_RECT = { x: 92, y: 92, w: 516, h: 816, r: 54 };
  const NEON_TRACES = [
    { inset: 42, jitter: 13 },
    { inset: 24, jitter: 16 },
    { inset: 6, jitter: 13 },
    { inset: -11, jitter: 9 },
  ];

  function buildNeonFrame(frameSvg) {
    let html = "";
    for (let i = 0; i < NEON_TRACES.length; i += 1) {
      const t = NEON_TRACES[i];
      const seed = (Math.random() * 1e9) | 0;
      const d = neonWobblyRectPath(NEON_PHOTO_RECT, t.inset, t.jitter, seed, Math.random());
      html +=
        '<g class="trace">' +
        `<path class="tr glow2" d="${d}"/>` +
        `<path class="tr glow1" d="${d}"/>` +
        `<path class="tr core" d="${d}"/>` +
        `<path class="tr hot" d="${d}"/>` +
        "</g>";
    }
    frameSvg.innerHTML = html;
  }

  // ================================================================
  // Ultras Tifo helpers (ported verbatim)
  // ================================================================

  const TIFO_DEFS = `
<svg class="svg-defs" aria-hidden="true"><defs>
  <filter id="dynt-tear-xl" x="-25%" y="-25%" width="150%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="4" seed="11" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="42" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="dynt-tear-x2" x="-25%" y="-25%" width="150%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="0.016 0.024" numOctaves="4" seed="27" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="dynt-tear-lg" x="-25%" y="-25%" width="150%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="0.014 0.022" numOctaves="4" seed="5" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="dynt-tear-paper" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.028 0.04" numOctaves="4" seed="8" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="dynt-rough-fine" x="-15%" y="-15%" width="130%" height="130%">
    <feTurbulence type="fractalNoise" baseFrequency="0.09 0.09" numOctaves="2" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="dynt-pb1" x="-20%" y="-30%" width="140%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.045 0.08" numOctaves="3" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="dynt-pb2" x="-20%" y="-30%" width="140%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.05 0.075" numOctaves="3" seed="14" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="dynt-pb3" x="-20%" y="-30%" width="140%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.042 0.085" numOctaves="3" seed="22" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="dynt-pb4" x="-20%" y="-30%" width="140%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.048 0.07" numOctaves="3" seed="31" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="dynt-brush-text" x="-15%" y="-20%" width="130%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.07" numOctaves="4" seed="19" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="9" xChannelSelector="R" yChannelSelector="G" result="disp"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.14" numOctaves="3" seed="7" result="strk"/>
    <feComponentTransfer in="strk" result="mask">
      <feFuncA type="linear" slope="1.5" intercept="0.3"/>
    </feComponentTransfer>
    <feComposite in="disp" in2="mask" operator="in"/>
  </filter>
  <filter id="dynt-mottle" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="5" seed="6"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.1 0 0 0 -0.72"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="dynt-speck" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.32 0.28" numOctaves="2" seed="9"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 -0.25"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="dynt-roller" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0045 0.07" numOctaves="3" seed="13"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.7 0 0 0 -0.62"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="dynt-roller-dark" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.005 0.06" numOctaves="3" seed="21"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 -0.52"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
</defs></svg>`;

  function buildTifoStitches(svg) {
    const NS = "http://www.w3.org/2000/svg";
    const W = 300;
    const H = 400;
    const mx = 15;
    const my = 20;
    const half = 7;
    const jit = (a) => (Math.random() - 0.5) * a;
    function tick(x1, y1, x2, y2) {
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", x1.toFixed(1));
      l.setAttribute("y1", y1.toFixed(1));
      l.setAttribute("x2", x2.toFixed(1));
      l.setAttribute("y2", y2.toFixed(1));
      l.setAttribute("stroke", "#171310");
      l.setAttribute("stroke-width", (2 + Math.random() * 0.9).toFixed(2));
      l.setAttribute("stroke-linecap", "round");
      l.setAttribute("opacity", (0.75 + Math.random() * 0.25).toFixed(2));
      svg.appendChild(l);
    }
    let s;
    for (let x = mx + 9; x < W - mx - 4; x += 8 + Math.random() * 6) {
      s = jit(6);
      tick(x + s, my - half + jit(4), x - s + jit(3), my + half + jit(4));
      s = jit(6);
      tick(x + s + jit(4), H - my - half + jit(4), x - s + jit(3), H - my + half + jit(4));
    }
    for (let y = my + 10; y < H - my - 5; y += 8 + Math.random() * 6) {
      s = jit(6);
      tick(mx - half + jit(4), y + s, mx + half + jit(4), y - s + jit(3));
      s = jit(6);
      tick(W - mx - half + jit(4), y + s + jit(4), W - mx + half + jit(4), y - s + jit(3));
    }
  }

  function tifoSplitMessage(msg) {
    const words = String(msg || "").split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const totalLen = words.join(" ").length;
    const n = Math.max(1, Math.min(4, Math.ceil(totalLen / 8), words.length));
    const lines = [];
    let i = 0;
    let remChars = totalLen;
    for (let l = 0; l < n; l += 1) {
      if (l === n - 1) {
        lines.push(words.slice(i).join(" "));
        break;
      }
      const remLines = n - l;
      const target = remChars / remLines;
      const cur = [words[i]];
      let curLen = words[i].length;
      i += 1;
      while (
        i < words.length &&
        words.length - i > remLines - 2 &&
        curLen + 1 + words[i].length <= target
      ) {
        cur.push(words[i]);
        curLen += 1 + words[i].length;
        i += 1;
      }
      lines.push(cur.join(" "));
      remChars -= curLen + 1;
    }
    return lines.filter(Boolean);
  }

  const TIFO_ROTS = [-1.2, 0.8, -0.6, 0.9];
  const TIFO_MAX_BY_N = { 1: 400, 2: 330, 3: 290, 4: 210 };

  // ================================================================
  // Liquid Glass WebGL bubble field (ported verbatim)
  // ================================================================

  const LIQ_N = 24;
  const LIQ_VERT = "attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0); }";
  const LIQ_FRAG = [
    "precision highp float;",
    "uniform sampler2D uTex;",
    "uniform vec2 uRes;",
    "uniform float uTime;",
    "uniform float uHasTex;",
    "uniform float uScale;",
    "uniform vec3 uPrimary;",
    "uniform vec3 uSecondary;",
    "uniform vec4 uPhotoUv;",
    "uniform vec4 uBubbles[24];",
    "const float THRESH = 1.05;",
    "vec3 spectrum(float x){",
    "  return clamp(vec3(1.5-abs(4.0*x-1.0), 1.5-abs(4.0*x-2.0), 1.5-abs(4.0*x-3.0)), 0.0, 1.0);",
    "}",
    "float field(vec2 p){",
    "  float f = 0.0;",
    "  for (int i = 0; i < 24; i++) {",
    "    vec4 b = uBubbles[i];",
    "    float r = max(b.w * uScale, 0.0004);",
    "    float ang = uTime * (0.7 + fract(float(i) * 0.37) * 0.9) + float(i);",
    "    float c = cos(ang), s = sin(ang);",
    "    vec2 d = p - b.xy;",
    "    d = vec2(d.x * c - d.y * s, d.x * s + d.y * c);",
    "    float stretch = 1.0 + 0.28 * sin(uTime * 1.4 + float(i) * 1.7);",
    "    d.x *= stretch;",
    "    d.y /= stretch;",
    "    f += (r * r) / max(dot(d, d), 0.000012);",
    "  }",
    "  return f;",
    "}",
    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / uRes;",
    "  float aspect = uRes.y / uRes.x;",
    "  vec2 p = (uv - 0.5) * vec2(1.0, aspect);",
    "  float f = field(p);",
    "  if (f < THRESH) { gl_FragColor = vec4(0.0); return; }",
    "  vec2 e = vec2(0.0022, 0.0);",
    "  vec2 g = vec2(field(p + e.xy) - field(p - e.xy), field(p + e.yx) - field(p - e.yx));",
    "  float z = clamp((f - THRESH) / max(f, 0.001), 0.08, 0.95);",
    "  vec3 n = normalize(vec3(-g, z * 1.15));",
    "  vec3 rd = normalize(vec3(p, 2.0));",
    "  float NdotR = max(dot(n, -rd), 0.0);",
    "  float fres = pow(1.0 - NdotR, 3.4);",
    "  vec2 disp = -n.xy * 0.034;",
    "  vec3 col = mix(uPrimary, uSecondary, fres) * (0.16 + fres * 0.52);",
    "  if (uHasTex > 0.5) {",
    "    vec2 local = (uv + disp - uPhotoUv.xy) / max(uPhotoUv.zw, vec2(0.001));",
    "    if (local.x > 0.0 && local.x < 1.0 && local.y > 0.0 && local.y < 1.0) {",
    "      vec3 acc = vec3(0.0); vec3 wsum = vec3(0.0);",
    "      for (int k = 0; k < 4; k++) {",
    "        float wl = float(k) / 3.0;",
    "        vec3 w = spectrum(wl);",
    "        acc += texture2D(uTex, clamp(local + n.xy * 0.035 * (0.25 + wl), 0.0, 1.0)).rgb * w;",
    "        wsum += w;",
    "      }",
    "      col = acc / max(wsum, vec3(0.001));",
    "      col *= 0.88 + fres * 0.5;",
    "    }",
    "  }",
    "  vec3 ld = normalize(vec3(0.42, 0.86, -0.28));",
    "  float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 140.0);",
    "  col += spec * 1.7 + fres * 0.2;",
    "  col = 1.0 - abs(col + fres * 0.18 - 1.0);",
    "  float edge = smoothstep(THRESH, THRESH + 0.35, f);",
    "  float alpha = clamp(0.18 + fres * 0.55 + spec, 0.0, 0.88) * edge;",
    "  if (uHasTex > 0.5) {",
    "    vec2 local = (uv - uPhotoUv.xy) / max(uPhotoUv.zw, vec2(0.001));",
    "    if (local.x > 0.02 && local.x < 0.98 && local.y > 0.02 && local.y < 0.98) {",
    "      alpha *= 0.42;",
    "    }",
    "  }",
    "  gl_FragColor = vec4(clamp(col, 0.0, 1.0), alpha);",
    "}",
  ].join("\n");

  function liqFract(x) {
    return x - Math.floor(x);
  }

  function liqHexToRgb(hex) {
    const h = (hex || "#7ee8ff").replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  function liqWrap(v, min, max) {
    const span = max - min;
    let t = (v - min) % span;
    if (t < 0) t += span;
    return t + min;
  }

  function liqMotionTune(mode) {
    if (mode === "fizz") return { rise: 0.14, wander: 0.09, swirl: 1.55, split: 1.4 };
    if (mode === "slow") return { rise: 0.008, wander: 0.028, swirl: 0.42, split: 0.72 };
    return { rise: 0.038, wander: 0.055, swirl: 0.9, split: 1.0 };
  }

  // ================================================================
  // Themes
  // ================================================================

  const themes = {
    "led-scoreboard": {
      mount(themeRoot) {
        ensureFitStage(themeRoot).innerHTML =
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
            '<div class="board">' +
              '<div class="idle-glow"></div>' +
              '<div class="content">' +
                '<div class="photo-panel"><div class="well"><img alt=""></div></div>' +
                '<div class="right">' +
                  '<div class="msg-box"><canvas class="matrix msg-canvas"></canvas></div>' +
                  '<div class="name-row"><canvas class="matrix name-canvas"></canvas></div>' +
                  '<div class="ticks"></div>' +
                "</div>" +
              "</div>" +
              '<div class="sheen"></div>' +
            "</div>" +
          "</div>";
        const ticksEl = themeRoot.querySelector(".ticks");
        for (let i = 0; i < 52; i += 1) {
          const t = document.createElement("div");
          t.className = "tick";
          const h = i % 5 === 4 ? 22 : 45 + Math.round(Math.random() * 55);
          t.style.setProperty("--h", String(h));
          t.style.setProperty("--ts", (0.55 + Math.random() * 0.35).toFixed(2));
          t.style.setProperty("--td", (1.1 + Math.random() * 1.6).toFixed(2) + "s");
          t.style.setProperty("--tdel", (Math.random() * -3).toFixed(2) + "s");
          ticksEl.appendChild(t);
        }
        return {
          board: themeRoot.querySelector(".board"),
          photo: themeRoot.querySelector(".photo-panel img"),
          nameRow: themeRoot.querySelector(".name-row"),
          msgCanvas: themeRoot.querySelector(".msg-canvas"),
          nameCanvas: themeRoot.querySelector(".name-canvas"),
          ticksEl,
          msgText: "",
          nameText: "",
          primary: "#ffb300",
          idleTimer: 0,
        };
      },
      applySettings(themeRoot, state, settings) {
        applyVars(themeRoot, settings);
        state.primary = settings.primary;
        if (state.msgText || state.nameText) {
          renderMatrix(state.msgCanvas, state.board, state.msgText, 4, state.primary);
          renderMatrix(state.nameCanvas, state.board, state.nameText, 1, state.primary);
        }
      },
      async show(themeRoot, capture, state, settings) {
        commonShowPrep(themeRoot, state);
        const revealMs = (settings && settings.revealMs) || 1200;
        state.primary = (settings && settings.primary) || state.primary;
        state.photo.src = capture.src || "";
        const message = capture.message || "";
        const name = capture.name || "";
        if (message) {
          state.msgText = message;
          state.nameText = name;
          state.nameRow.classList.toggle("hidden", !name);
        } else if (name) {
          state.msgText = name;
          state.nameText = "";
          state.nameRow.classList.add("hidden");
        } else {
          state.msgText = "";
          state.nameText = "";
          state.nameRow.classList.add("hidden");
        }
        await loadFonts(["400 100px Anton"]);
        await whenDecoded(state.photo);
        const renderAll = () => {
          renderMatrix(state.msgCanvas, state.board, state.msgText, 4, state.primary);
          renderMatrix(state.nameCanvas, state.board, state.nameText, 1, state.primary);
        };
        renderAll();
        // ticks sweep during the tail of the reveal
        const kids = state.ticksEl.children;
        const span = revealMs * 0.55;
        const start = revealMs * 0.4;
        for (let i = 0; i < kids.length; i += 1) {
          kids[i].style.setProperty("--d", Math.round(start + (span * i) / kids.length) + "ms");
        }
        activeRefit = renderAll;
        await finishShow(themeRoot);
        themeRoot.classList.add("ticks-live");
        armIdle(themeRoot, state, Math.round(revealMs * 1.1), "held");
      },
      hide(themeRoot, state) {
        return hideTheme(themeRoot, state, 220);
      },
      unmount(themeRoot, state) {
        if (state && state.idleTimer) clearTimeout(state.idleTimer);
      },
    },

    "neon-nightclub": {
      mount(themeRoot) {
        ensureFitStage(themeRoot).innerHTML =
          '<div class="dyn-stage">' +
            '<div class="lasers">' +
              '<div class="beam wide" style="--x: 4vw;  --a: -26deg; --sweep: 21s;"></div>' +
              '<div class="beam wide" style="--x: 18vw; --a: -52deg; --sweep: 27s; animation-delay: -9s;"></div>' +
              '<div class="beam" style="--x: 1vw;  --a: -14deg; --sweep: 15s;"></div>' +
              '<div class="beam" style="--x: 6vw;  --a: -24deg; --sweep: 19s; animation-delay: -7s;"></div>' +
              '<div class="beam" style="--x: 11vw; --a: -35deg; --sweep: 23s; animation-delay: -3s;"></div>' +
              '<div class="beam" style="--x: 16vw; --a: -47deg; --sweep: 17s; animation-delay: -11s;"></div>' +
              '<div class="beam" style="--x: 22vw; --a: -58deg; --sweep: 25s; animation-delay: -5s;"></div>' +
              '<div class="beam" style="--x: 9vw;  --a: -66deg; --sweep: 20s; animation-delay: -14s;"></div>' +
            "</div>" +
            '<div class="fog f1"></div><div class="fog f2"></div><div class="fog f3"></div>' +
            '<div class="fog f4"></div><div class="fog f5"></div>' +
            '<div class="photo-wrap">' +
              '<div class="photo-holder"><img alt="" draggable="false"></div>' +
              '<svg class="neon-frame-svg" viewBox="0 0 700 1000" aria-hidden="true"></svg>' +
            "</div>" +
            '<div class="panel">' +
              '<div class="msg-box"></div>' +
              '<div class="msg-fit"><span></span></div>' +
              '<div class="name-script"><span></span></div>' +
            "</div>" +
            '<div class="vignette"></div>' +
          "</div>";
        const state = {
          photo: themeRoot.querySelector(".photo-holder img"),
          frameSvg: themeRoot.querySelector(".neon-frame-svg"),
          panel: themeRoot.querySelector(".panel"),
          msgFit: themeRoot.querySelector(".msg-fit"),
          msgSpan: themeRoot.querySelector(".msg-fit span"),
          nameRow: themeRoot.querySelector(".name-script"),
          nameSpan: themeRoot.querySelector(".name-script span"),
          idleTimer: 0,
        };
        buildNeonFrame(state.frameSvg);
        return state;
      },
      applySettings(themeRoot, _state, settings) {
        applyVars(themeRoot, settings);
      },
      async show(themeRoot, capture, state, settings) {
        commonShowPrep(themeRoot, state);
        const revealMs = (settings && settings.revealMs) || 1400;
        state.photo.src = capture.src || "";
        state.msgSpan.textContent = capture.message || "";
        state.nameSpan.textContent = capture.name || "";
        const hasMsg = !!capture.message;
        const hasName = !!capture.name;
        state.panel.classList.toggle("no-msg", !hasMsg);
        state.panel.classList.toggle("no-name", !hasName);
        state.panel.classList.toggle("gone", !hasMsg && !hasName);
        buildNeonFrame(state.frameSvg);
        await loadFonts(["400 100px Anton", '400 100px "Mr Dafoe"']);
        const refit = () => {
          if (hasMsg) fitPx(state.msgFit, state.msgSpan, 235, 22);
          if (hasName) fitPx(state.nameRow, state.nameSpan, hasMsg ? 185 : 260, 30);
        };
        refit();
        activeRefit = refit;
        await finishShow(themeRoot, [state.photo]);
        armIdle(themeRoot, state, Math.round(revealMs * 1.3), "idle");
      },
      hide(themeRoot, state) {
        return hideTheme(themeRoot, state, 740);
      },
      unmount(themeRoot, state) {
        if (state && state.idleTimer) clearTimeout(state.idleTimer);
      },
    },

    "ultras-tifo": {
      mount(themeRoot) {
        ensureFitStage(themeRoot).innerHTML =
          TIFO_DEFS +
          '<div class="scene">' +
            '<div class="smoke-back">' +
              '<div class="smoke w" style="width:860px;height:640px;top:-14%;right:-7%;  --tx:-70px; --ty:36px;  --ts:1.18; --dur:26s;"></div>' +
              '<div class="smoke w" style="width:520px;height:420px;top:0%;   right:14%;  --tx:50px;  --ty:-24px; --ts:1.1;  --dur:19s;"></div>' +
              '<div class="smoke w" style="width:720px;height:560px;bottom:-16%;left:-9%; --tx:60px;  --ty:-40px; --ts:1.2;  --dur:30s;"></div>' +
              '<div class="smoke d" style="width:920px;height:600px;bottom:-22%;left:28%; --tx:-80px; --ty:-20px; --ts:1.12; --dur:34s;"></div>' +
              '<div class="smoke d" style="width:640px;height:480px;top:-16%; left:4%;    --tx:70px;  --ty:30px;  --ts:1.15; --dur:28s;"></div>' +
            "</div>" +
            '<div class="stage">' +
              '<div class="banner">' +
                '<div class="b-black"></div>' +
                '<div class="b-black2"></div>' +
                '<div class="b-red">' +
                  '<div class="streak st1"></div><div class="streak st2"></div>' +
                  '<div class="streak st3"></div><div class="streak st4"></div>' +
                  '<svg class="grain mottle" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#fff" filter="url(#dynt-mottle)"/></svg>' +
                  '<svg class="grain roller" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#fff" filter="url(#dynt-roller)"/></svg>' +
                  '<svg class="grain rollerd" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#000" filter="url(#dynt-roller-dark)"/></svg>' +
                  '<svg class="grain speck" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#000" filter="url(#dynt-speck)"/></svg>' +
                  '<div class="stroke sk1"></div><div class="stroke sk2"></div>' +
                  '<div class="stroke sk3"></div><div class="stroke sk4"></div>' +
                  '<div class="stroke sk5"></div><div class="stroke sk6"></div>' +
                  '<div class="stroke sk7"></div><div class="stroke sk8"></div>' +
                  '<div class="stroke sk9"></div><div class="stroke sk10"></div>' +
                  '<div class="b-shade"></div>' +
                "</div>" +
                '<div class="content">' +
                  '<div class="patch-col">' +
                    '<div class="patch">' +
                      '<div class="patch-paper"></div>' +
                      '<img class="patch-photo" alt="">' +
                      '<svg class="patch-stitch" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true"></svg>' +
                    "</div>" +
                  "</div>" +
                  '<div class="msg-col">' +
                    '<div class="lines"></div>' +
                    '<div class="name-slot"><div class="name-wrap"><span class="nm"></span></div></div>' +
                  "</div>" +
                "</div>" +
              "</div>" +
              '<div class="puff p1"></div><div class="puff p2"></div><div class="puff p3"></div>' +
            "</div>" +
            '<div class="smoke-front">' +
              '<div class="smoke w" style="width:820px;height:600px;top:-18%;right:-7%;  opacity:.8; --tx:-60px; --ty:32px;  --ts:1.15; --dur:23s;"></div>' +
              '<div class="smoke w" style="width:540px;height:420px;top:-12%;right:17%;  opacity:.5; --tx:48px;  --ty:-20px; --ts:1.12; --dur:19s;"></div>' +
              '<div class="smoke w" style="width:700px;height:520px;bottom:-16%;left:-7%; opacity:.75;--tx:52px;  --ty:-30px; --ts:1.18; --dur:26s;"></div>' +
              '<div class="smoke w" style="width:420px;height:330px;top:26%;left:-9%;    opacity:.5; --tx:40px;  --ty:-24px; --ts:1.12; --dur:21s;"></div>' +
              '<div class="smoke d" style="width:560px;height:400px;bottom:-18%;right:20%;opacity:.6; --tx:-46px; --ty:-16px; --ts:1.1;  --dur:28s;"></div>' +
            "</div>" +
            '<div class="embers"></div>' +
          "</div>";
        buildTifoStitches(themeRoot.querySelector(".patch-stitch"));
        const state = {
          banner: themeRoot.querySelector(".banner"),
          photo: themeRoot.querySelector(".patch-photo"),
          linesEl: themeRoot.querySelector(".lines"),
          nameSlot: themeRoot.querySelector(".name-slot"),
          nameWrap: themeRoot.querySelector(".name-wrap"),
          nameText: themeRoot.querySelector(".nm"),
          embersEl: themeRoot.querySelector(".embers"),
          emberTimer: 0,
          idleTimer: 0,
        };
        state.emberTimer = setInterval(() => {
          if (document.hidden || !themeRoot.isConnected) return;
          if (state.embersEl.childElementCount > 64) return;
          const e = document.createElement("div");
          const flare = Math.random() < 0.14;
          e.className = "ember" + (flare ? " flare" : "");
          if (!flare) {
            const s = (5 + Math.random() * 4).toFixed(1) + "px";
            e.style.width = s;
            e.style.height = s;
          }
          e.style.left = 2 + Math.random() * 96 + "vw";
          e.style.setProperty("--dx", ((Math.random() - 0.5) * 16).toFixed(1) + "vw");
          e.style.setProperty("--dur", (5 + Math.random() * 6).toFixed(2) + "s");
          e.addEventListener("animationend", (ev) => {
            if (ev.animationName === "dynTifoEmber") e.remove();
          });
          state.embersEl.appendChild(e);
        }, 150);
        return state;
      },
      applySettings(themeRoot, _state, settings) {
        applyVars(themeRoot, settings);
      },
      async show(themeRoot, capture, state, settings) {
        commonShowPrep(themeRoot, state);
        const revealMs = (settings && settings.revealMs) || 900;
        const noMsg = !capture.message;
        state.banner.classList.toggle("no-msg", noMsg);
        state.photo.src = capture.src || "";
        const lines = tifoSplitMessage(capture.message || "");
        state.linesEl.replaceChildren();
        lines.forEach((txt, idx) => {
          const slot = document.createElement("div");
          slot.className = "line-slot";
          const line = document.createElement("div");
          line.className = "line";
          line.style.setProperty("--rot", TIFO_ROTS[idx % TIFO_ROTS.length] + "deg");
          line.style.setProperty("--d", (0.36 + idx * 0.14).toFixed(3));
          const block = document.createElement("i");
          block.className = "block";
          const span = document.createElement("span");
          span.className = "txt";
          span.textContent = txt;
          line.appendChild(block);
          line.appendChild(span);
          slot.appendChild(line);
          state.linesEl.appendChild(slot);
        });
        if (capture.name) {
          state.nameSlot.style.display = "";
          state.nameText.textContent = capture.name;
          state.nameWrap.style.setProperty("--dn", (0.4 + lines.length * 0.14 + 0.04).toFixed(3));
        } else {
          state.nameSlot.style.display = "none";
        }
        await loadFonts(["400 100px Anton"]);
        await whenDecoded(state.photo);
        void state.banner.offsetWidth;
        const refit = () => {
          const n = lines.length;
          if (n) {
            const slots = state.linesEl.children;
            const slotAvail = state.linesEl.clientHeight / n;
            const sizes = [];
            for (let idx = 0; idx < slots.length; idx += 1) {
              slots[idx].style.flex = "0 0 auto";
              slots[idx].style.height = "2000px";
              sizes.push(fitPx(slots[idx], slots[idx].firstChild, TIFO_MAX_BY_N[n] || 210, 26));
            }
            const uni = Math.min(Math.min.apply(null, sizes), Math.floor(slotAvail * 1.05));
            for (let idx = 0; idx < slots.length; idx += 1) {
              slots[idx].firstChild.style.fontSize = uni + "px";
              slots[idx].style.height = Math.round(uni * 0.93) + "px";
            }
          }
          if (capture.name && state.nameSlot.style.display !== "none") {
            const availH = state.nameSlot.clientHeight;
            state.nameSlot.style.height = "1000px";
            const size = fitPx(state.nameSlot, state.nameWrap, noMsg ? 170 : 112, 22);
            state.nameSlot.style.height = "";
            const capped = Math.min(size, Math.floor(availH * 0.97));
            state.nameWrap.style.fontSize = capped + "px";
          }
        };
        refit();
        activeRefit = refit;
        void themeRoot.offsetWidth;
        themeRoot.classList.add("on");
      },
      hide(themeRoot, state, settings) {
        const revealMs = (settings && settings.revealMs) || 900;
        return hideTheme(themeRoot, state, Math.min(520, revealMs * 0.55) + 90);
      },
      unmount(themeRoot, state) {
        if (state && state.emberTimer) clearInterval(state.emberTimer);
        if (state && state.idleTimer) clearTimeout(state.idleTimer);
      },
    },

    "holo-card": {
      mount(themeRoot) {
        ensureFitStage(themeRoot).innerHTML =
          '<div class="dyn-stage">' +
            '<div class="aurora"></div>' +
            '<div class="dust"></div>' +
            '<div class="layout">' +
              '<div class="rig">' +
                '<div class="card">' +
                  '<div class="well">' +
                    '<img alt="" draggable="false">' +
                    '<div class="foil"></div>' +
                    '<div class="glare"></div>' +
                  "</div>" +
                "</div>" +
              "</div>" +
              '<div class="copy">' +
                '<div class="msg-stack">' +
                  '<div class="msg-bloom" aria-hidden="true"><span></span></div>' +
                  '<div class="msg-fit"><span></span></div>' +
                "</div>" +
                '<div class="name-slot"><div class="name-fit"><span></span></div></div>' +
              "</div>" +
            "</div>" +
            '<div class="vignette"></div>' +
          "</div>";
        const dust = themeRoot.querySelector(".dust");
        for (let i = 0; i < 10; i += 1) {
          const s = document.createElement("div");
          s.className = "speck";
          s.style.left = Math.random() * 100 + "%";
          s.style.top = Math.random() * 100 + "%";
          const sz = (1.4 + Math.random() * 2.6).toFixed(1);
          s.style.width = s.style.height = sz + "px";
          s.style.setProperty("--dx", ((Math.random() - 0.5) * 80).toFixed(0) + "px");
          s.style.setProperty("--dy", ((Math.random() - 0.5) * 70).toFixed(0) + "px");
          s.style.setProperty("--dur", (12 + Math.random() * 18).toFixed(1) + "s");
          s.style.setProperty("--del", (-Math.random() * 16).toFixed(1) + "s");
          dust.appendChild(s);
        }
        return {
          photo: themeRoot.querySelector(".well img"),
          copy: themeRoot.querySelector(".copy"),
          msgFit: themeRoot.querySelector(".msg-fit"),
          msgSpan: themeRoot.querySelector(".msg-fit span"),
          msgBloom: themeRoot.querySelector(".msg-bloom span"),
          nameSlot: themeRoot.querySelector(".name-slot"),
          nameFit: themeRoot.querySelector(".name-fit"),
          nameSpan: themeRoot.querySelector(".name-fit span"),
          idleTimer: 0,
        };
      },
      applySettings(themeRoot, _state, settings) {
        applyVars(themeRoot, settings);
      },
      async show(themeRoot, capture, state, settings) {
        commonShowPrep(themeRoot, state);
        const revealMs = (settings && settings.revealMs) || 1200;
        state.photo.src = capture.src || "";
        state.msgSpan.textContent = capture.message || "";
        state.msgBloom.textContent = capture.message || "";
        state.nameSpan.textContent = capture.name || "";
        const hasMsg = !!capture.message;
        const hasName = !!capture.name;
        state.copy.classList.toggle("gone", !hasMsg && !hasName);
        state.copy.classList.toggle("no-msg", !hasMsg && hasName);
        state.copy.classList.toggle("no-name", hasMsg && !hasName);
        state.nameSlot.classList.toggle("hidden", !hasName);
        themeRoot.classList.toggle("no-copy", !hasMsg && !hasName);
        await loadFonts(['400 180px "Bebas Neue"', "600 80px Outfit"]);
        const refit = () => {
          if (hasMsg) {
            fitPx(state.msgFit, state.msgSpan, 280, 32);
            state.msgBloom.style.fontSize = state.msgSpan.style.fontSize;
          }
          if (hasName) fitPx(state.nameFit, state.nameSpan, hasMsg ? 120 : 180, 28);
        };
        refit();
        activeRefit = refit;
        await finishShow(themeRoot, [state.photo]);
        armIdle(themeRoot, state, Math.round(revealMs * 1.05), "idle");
      },
      hide(themeRoot, state, settings) {
        const revealMs = (settings && settings.revealMs) || 1200;
        return hideTheme(themeRoot, state, Math.round(revealMs * 0.55) + 40, ["no-copy"]);
      },
      unmount(themeRoot, state) {
        if (state && state.idleTimer) clearTimeout(state.idleTimer);
      },
    },

    "broadcast-tv": {
      mount(themeRoot) {
        ensureFitStage(themeRoot).innerHTML =
          '<div class="dyn-stage">' +
            '<div class="tv">' +
              '<div class="set">' +
                '<div class="crt">' +
                  '<div class="bezel"></div>' +
                  '<div class="glass">' +
                    '<div class="program">' +
                      '<img alt="" draggable="false">' +
                      '<div class="news">' +
                        '<div class="news-rule"></div>' +
                        '<div class="news-head"><div class="msg-fit"><span></span></div></div>' +
                        '<div class="news-slug"><div class="name-fit"><span></span></div></div>' +
                      "</div>" +
                    "</div>" +
                    '<div class="fx"></div>' +
                    '<div class="shine"></div>' +
                    '<div class="static"></div>' +
                    '<div class="roll"></div>' +
                  "</div>" +
                "</div>" +
                '<div class="panel">' +
                  '<div class="grill">' +
                    '<div class="speaker"></div>' +
                    '<div class="slats"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
                  "</div>" +
                  '<div class="knobs">' +
                    '<div class="knob-row">' +
                      '<div class="ctrl"><b>Power</b><i class="power"></i></div>' +
                      '<div class="ctrl"><b>Volume</b><i class="vol"></i></div>' +
                    "</div>" +
                    '<div class="ctrl"><b>Tuning</b><i class="tune"><i class="tune-needle"></i></i></div>' +
                  "</div>" +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>";
        // Show the TV chassis immediately so the idle backdrop isn't black.
        themeRoot.classList.add("ready");
        const state = {
          tv: themeRoot.querySelector(".tv"),
          photo: themeRoot.querySelector(".program img"),
          copy: themeRoot.querySelector(".news"),
          msgFit: themeRoot.querySelector(".msg-fit"),
          msgSpan: themeRoot.querySelector(".msg-fit span"),
          nameBand: themeRoot.querySelector(".news-slug"),
          nameFit: themeRoot.querySelector(".name-fit"),
          nameSpan: themeRoot.querySelector(".name-fit span"),
          needle: themeRoot.querySelector(".tune-needle"),
          tuneAngle: 0,
          tuneSpeed: 0,
          tuneMode: "stop",
          tuneTravel: 0,
          tuneLast: 0,
          tuneRaf: 0,
          idleTimer: 0,
          alive: true,
        };
        const IDLE_SPEED = 360 / 16;
        const RESET_SPEED = 780;
        function tickTune(now) {
          if (!state.alive) return;
          state.tuneRaf = requestAnimationFrame(tickTune);
          if (document.hidden) {
            state.tuneLast = 0;
            return;
          }
          if (!state.tuneLast) {
            state.tuneLast = now;
            return;
          }
          const dt = Math.min(0.05, (now - state.tuneLast) / 1000);
          state.tuneLast = now;
          if (state.tuneMode === "idle") {
            state.tuneSpeed += (IDLE_SPEED - state.tuneSpeed) * 0.08;
            state.tuneAngle += state.tuneSpeed * dt;
          } else if (state.tuneMode === "reset") {
            const rem = (360 - (state.tuneAngle % 360)) % 360;
            if (state.tuneTravel > 540 && rem < 70) {
              const step = Math.min(rem, Math.max(480 * dt, rem * 10 * dt));
              if (rem <= 0.6 || step >= rem) {
                state.tuneAngle += rem;
                state.tuneSpeed = 0;
                state.tuneMode = "stop";
              } else {
                state.tuneSpeed = step / dt;
                state.tuneAngle += step;
                state.tuneTravel += step;
              }
            } else {
              state.tuneSpeed += (RESET_SPEED - state.tuneSpeed) * 0.16;
              const spin = state.tuneSpeed * dt;
              state.tuneAngle += spin;
              state.tuneTravel += spin;
            }
          } else {
            state.tuneSpeed += (0 - state.tuneSpeed) * 0.2;
          }
          state.needle.style.transform = "translateX(-50%) rotate(" + state.tuneAngle + "deg)";
        }
        state.tuneRaf = requestAnimationFrame(tickTune);
        return state;
      },
      applySettings(themeRoot, _state, settings) {
        applyVars(themeRoot, settings);
      },
      async show(themeRoot, capture, state, settings) {
        const revealMs = (settings && settings.revealMs) || 1100;
        const keepChrome = themeRoot.dataset.keepChrome === "1";
        themeRoot.classList.remove("off", "idle");
        if (!keepChrome) themeRoot.classList.remove("on");
        if (state.idleTimer) {
          clearTimeout(state.idleTimer);
          state.idleTimer = 0;
        }
        themeRoot.classList.add("ready", "fizzing");
        state.photo.src = capture.src || "";
        state.msgSpan.textContent = capture.message || "";
        state.nameSpan.textContent = capture.name || "";
        const hasMsg = !!capture.message;
        const hasName = !!capture.name;
        state.copy.classList.toggle("gone", !hasMsg && !hasName);
        state.copy.classList.toggle("no-msg", !hasMsg && hasName);
        state.copy.classList.toggle("no-name", hasMsg && !hasName);
        state.nameBand.classList.toggle("hidden", !hasName);
        await loadFonts(['800 80px "Barlow Condensed"', "600 40px Oswald"]);
        const refit = () => {
          if (hasMsg) fitPx(state.msgFit, state.msgSpan, 56, 16);
          if (hasName) fitPx(state.nameFit, state.nameSpan, hasMsg ? 26 : 44, 14);
        };
        refit();
        activeRefit = refit;
        await whenDecoded(state.photo);
        const fizz = keepChrome
          ? Math.max(160, Math.round(revealMs * 0.18))
          : Math.max(280, Math.round(revealMs * 0.32));
        await wait(fizz);
        void themeRoot.offsetWidth;
        themeRoot.classList.add("on");
        await wait(keepChrome ? 80 : 160);
        themeRoot.classList.remove("fizzing");
        armIdle(themeRoot, state, Math.max(200, revealMs - fizz), "idle", () => {
          // spin the tuning needle while idle
          state.tuneMode = "idle";
        });
      },
      hide(themeRoot, state, settings) {
        if (!themeRoot.classList.contains("on")) return Promise.resolve();
        if (state.idleTimer) {
          clearTimeout(state.idleTimer);
          state.idleTimer = 0;
        }
        themeRoot.classList.remove("idle");
        if (themeRoot.dataset.keepChrome === "1") {
          themeRoot.classList.add("ready", "fizzing");
          return wait(160).then(() => {
            themeRoot.classList.add("dyn-awaiting-show");
            themeRoot.classList.remove("fizzing");
          });
        }
        const revealMs = (settings && settings.revealMs) || 1100;
        state.tuneMode = "reset";
        state.tuneTravel = 0;
        if (state.tuneSpeed < 360 / 16) state.tuneSpeed = 360 / 16;
        themeRoot.classList.add("fizzing", "off");
        return wait(Math.max(320, Math.round(revealMs * 0.38))).then(() => {
          themeRoot.classList.remove("on", "off", "fizzing");
        });
      },
      unmount(themeRoot, state) {
        if (state) {
          state.alive = false;
          if (state.tuneRaf) cancelAnimationFrame(state.tuneRaf);
          if (state.idleTimer) clearTimeout(state.idleTimer);
        }
      },
    },

    "liquid-glass": {
      mount(themeRoot) {
        ensureFitStage(themeRoot).innerHTML =
          '<div class="dyn-stage">' +
            '<div class="wash"></div>' +
            '<canvas class="gl"></canvas>' +
            '<div class="layout">' +
              '<div class="slab">' +
                '<div class="floater">' +
                  '<div class="slab-glass"></div>' +
                  '<div class="photo-well"><img alt="" draggable="false"></div>' +
                "</div>" +
              "</div>" +
            "</div>" +
            '<div class="copy">' +
              '<div class="msg-fit"><span></span></div>' +
              '<div class="name-slot"><div class="name-fit"><span></span></div></div>' +
            "</div>" +
          "</div>";
        const canvas = themeRoot.querySelector("canvas.gl");
        const state = {
          slab: themeRoot.querySelector(".slab"),
          photo: themeRoot.querySelector(".photo-well img"),
          copy: themeRoot.querySelector(".copy"),
          msgFit: themeRoot.querySelector(".msg-fit"),
          msgSpan: themeRoot.querySelector(".msg-fit span"),
          nameSlot: themeRoot.querySelector(".name-slot"),
          nameFit: themeRoot.querySelector(".name-fit"),
          nameSpan: themeRoot.querySelector(".name-fit span"),
          canvas,
          gl: canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: true }),
          program: null,
          locs: {},
          tex: null,
          hasTex: 0,
          running: false,
          raf: 0,
          t0: 0,
          scale: 0,
          scaleTarget: 0,
          seeds: [],
          bubbles: new Float32Array(LIQ_N * 4),
          lastTime: 0,
          settings: null,
          idleTimer: 0,
          alive: true,
        };
        const gl = state.gl;
        function compile(type, src) {
          const s = gl.createShader(type);
          gl.shaderSource(s, src);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
          return s;
        }
        if (gl) {
          const vs = compile(gl.VERTEX_SHADER, LIQ_VERT);
          const fs = compile(gl.FRAGMENT_SHADER, LIQ_FRAG);
          if (vs && fs) {
            const program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);
            if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
              state.program = program;
              gl.useProgram(program);
              const buf = gl.createBuffer();
              gl.bindBuffer(gl.ARRAY_BUFFER, buf);
              gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
              const aPos = gl.getAttribLocation(program, "aPos");
              gl.enableVertexAttribArray(aPos);
              gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
              ["uTex", "uRes", "uTime", "uHasTex", "uScale", "uPrimary", "uSecondary", "uPhotoUv"].forEach((k) => {
                state.locs[k] = gl.getUniformLocation(program, k);
              });
              state.locs.bubbles = [];
              for (let i = 0; i < LIQ_N; i += 1) {
                state.locs.bubbles[i] = gl.getUniformLocation(program, "uBubbles[" + i + "]");
              }
              state.tex = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, state.tex);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              gl.enable(gl.BLEND);
              gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            }
          }
        }
        seedLiqBubbles(state);
        return state;
      },
      applySettings(themeRoot, state, settings) {
        applyVars(themeRoot, settings);
        state.settings = settings;
      },
      async show(themeRoot, capture, state, settings) {
        commonShowPrep(themeRoot, state);
        const revealMs = (settings && settings.revealMs) || 1300;
        state.settings = settings || state.settings;
        state.photo.crossOrigin = "anonymous";
        state.photo.src = capture.src || "";
        state.msgSpan.textContent = capture.message || "";
        state.nameSpan.textContent = capture.name || "";
        const hasMsg = !!capture.message;
        const hasName = !!capture.name;
        state.copy.classList.toggle("gone", !hasMsg && !hasName);
        state.copy.classList.toggle("no-msg", !hasMsg && hasName);
        state.copy.classList.toggle("no-name", hasMsg && !hasName);
        state.nameSlot.classList.toggle("hidden", !hasName);
        themeRoot.classList.toggle("no-copy", !hasMsg && !hasName);
        await loadFonts(['italic 500 180px "Cormorant Garamond"', "500 80px Outfit"]);
        const refit = () => {
          if (hasMsg) fitPx(state.msgFit, state.msgSpan, 250, 32);
          if (hasName) fitPx(state.nameFit, state.nameSpan, hasMsg ? 110 : 170, 28);
        };
        refit();
        activeRefit = refit;
        await new Promise((resolve) => {
          if (state.photo.complete && state.photo.naturalWidth) {
            resolve();
            return;
          }
          state.photo.onload = () => resolve();
          state.photo.onerror = () => {
            state.photo.removeAttribute("crossorigin");
            state.photo.src = capture.src || "";
            resolve();
          };
          setTimeout(resolve, 2500);
        });
        uploadLiqPhoto(state);
        void themeRoot.offsetWidth;
        startLiqGL(state, themeRoot);
        themeRoot.classList.add("on");
        armIdle(themeRoot, state, Math.round(revealMs * 1.05), "idle");
      },
      hide(themeRoot, state, settings) {
        if (!themeRoot.classList.contains("on")) return Promise.resolve();
        const revealMs = (settings && settings.revealMs) || 1300;
        if (state.idleTimer) {
          clearTimeout(state.idleTimer);
          state.idleTimer = 0;
        }
        themeRoot.classList.remove("idle");
        state.scaleTarget = 0;
        themeRoot.classList.add("off");
        return wait(Math.round(revealMs * 0.5) + 40).then(() => {
          state.running = false;
          cancelAnimationFrame(state.raf);
          themeRoot.classList.remove("on", "off", "no-copy");
        });
      },
      unmount(themeRoot, state) {
        if (state) {
          state.alive = false;
          state.running = false;
          if (state.raf) cancelAnimationFrame(state.raf);
          if (state.idleTimer) clearTimeout(state.idleTimer);
        }
      },
    },

    "parallax-drift": {
      mount(themeRoot) {
        const GHOSTS = [
          { x: "4vw", y: "8vh", z: "-420px", ry: "28deg", op: 0.16, blur: "6px", dx: "5vw", dy: "-3vh", gd: 0.05, gdur: "24s" },
          { x: "78vw", y: "10vh", z: "-360px", ry: "-24deg", op: 0.18, blur: "5px", dx: "-4vw", dy: "2vh", gd: 0.12, gdur: "20s" },
          { x: "70vw", y: "58vh", z: "-280px", ry: "-16deg", op: 0.2, blur: "3px", dx: "-3vw", dy: "-2vh", gd: 0.18, gdur: "26s" },
          { x: "-2vw", y: "52vh", z: "-500px", ry: "32deg", op: 0.12, blur: "8px", dx: "6vw", dy: "3vh", gd: 0.08, gdur: "30s" },
          { x: "52vw", y: "-6vh", z: "-620px", ry: "10deg", op: 0.1, blur: "10px", dx: "3vw", dy: "4vh", gd: 0.22, gdur: "28s" },
          { x: "86vw", y: "36vh", z: "-180px", ry: "-30deg", op: 0.15, blur: "4px", dx: "-2vw", dy: "-3vh", gd: 0.15, gdur: "18s" },
        ];
        ensureFitStage(themeRoot).innerHTML =
          '<div class="dyn-stage">' +
            '<div class="bands"></div>' +
            '<div class="field"></div>' +
            '<div class="hero"><div class="frame"><img alt="" draggable="false"></div></div>' +
            '<div class="haze" aria-hidden="true">' +
              '<div class="haze-wash"></div>' +
              '<div class="haze-inner">' +
                '<div class="haze-msg"><span></span></div>' +
                '<div class="haze-name"><span></span></div>' +
              "</div>" +
            "</div>" +
            '<div class="plaque">' +
              '<div class="plaque-inner">' +
                '<div class="msg-fit"><span></span></div>' +
                '<div class="name-slot"><div class="name-fit"><span></span></div></div>' +
              "</div>" +
            "</div>" +
            '<div class="vignette"></div>' +
          "</div>";
        const bandsHost = themeRoot.querySelector(".bands");
        const tops = [8, 22, 38, 54, 70, 84];
        tops.forEach((top, i) => {
          const b = document.createElement("div");
          b.className = "band";
          b.style.top = top + "vh";
          b.style.setProperty("--band", i % 2 ? "var(--secondary)" : "var(--primary)");
          b.style.setProperty("--dur", 22 + i * 3 + "s");
          b.style.setProperty("--del", -i * 4 + "s");
          bandsHost.appendChild(b);
        });
        const field = themeRoot.querySelector(".field");
        const ghosts = [];
        GHOSTS.forEach((g) => {
          const el = document.createElement("div");
          el.className = "ghost";
          el.style.setProperty("--x", g.x);
          el.style.setProperty("--y", g.y);
          el.style.setProperty("--z", g.z);
          el.style.setProperty("--ry", g.ry);
          el.style.setProperty("--op", String(g.op));
          el.style.setProperty("--blur", g.blur);
          el.style.setProperty("--dx", g.dx);
          el.style.setProperty("--dy", g.dy);
          el.style.setProperty("--gd", String(g.gd));
          el.style.setProperty("--gdur", g.gdur);
          const img = document.createElement("img");
          img.alt = "";
          img.draggable = false;
          el.appendChild(img);
          field.appendChild(el);
          ghosts.push(img);
        });
        return {
          photo: themeRoot.querySelector(".frame img"),
          ghosts,
          plaque: themeRoot.querySelector(".plaque"),
          haze: themeRoot.querySelector(".haze"),
          msgFit: themeRoot.querySelector(".msg-fit"),
          msgSpan: themeRoot.querySelector(".msg-fit span"),
          msgBloom: themeRoot.querySelector(".haze-msg span"),
          nameSlot: themeRoot.querySelector(".name-slot"),
          hazeName: themeRoot.querySelector(".haze-name"),
          nameFit: themeRoot.querySelector(".name-fit"),
          nameSpan: themeRoot.querySelector(".name-fit span"),
          nameBloom: themeRoot.querySelector(".haze-name span"),
          idleTimer: 0,
        };
      },
      applySettings(themeRoot, _state, settings) {
        applyVars(themeRoot, settings);
      },
      async show(themeRoot, capture, state, settings) {
        commonShowPrep(themeRoot, state);
        const revealMs = (settings && settings.revealMs) || 1250;
        state.photo.src = capture.src || "";
        state.ghosts.forEach((img) => {
          img.src = capture.src || "";
        });
        state.msgSpan.textContent = capture.message || "";
        state.msgBloom.textContent = capture.message || "";
        state.nameSpan.textContent = capture.name || "";
        state.nameBloom.textContent = capture.name || "";
        const hasMsg = !!capture.message;
        const hasName = !!capture.name;
        state.plaque.classList.toggle("gone", !hasMsg && !hasName);
        state.plaque.classList.toggle("no-msg", !hasMsg && hasName);
        state.plaque.classList.toggle("no-name", hasMsg && !hasName);
        state.haze.classList.toggle("gone", !hasMsg && !hasName);
        state.haze.classList.toggle("no-msg", !hasMsg && hasName);
        state.haze.classList.toggle("no-name", hasMsg && !hasName);
        state.nameSlot.classList.toggle("hidden", !hasName);
        state.hazeName.classList.toggle("hidden", !hasName);
        themeRoot.classList.toggle("no-copy", !hasMsg && !hasName);
        await loadFonts(["400 180px Anton", "700 80px Syne"]);
        const refit = () => {
          if (hasMsg) {
            fitPx(state.msgFit, state.msgSpan, 280, 32);
            state.msgBloom.style.fontSize = state.msgSpan.style.fontSize;
          }
          if (hasName) {
            fitPx(state.nameFit, state.nameSpan, hasMsg ? 120 : 180, 28);
            state.nameBloom.style.fontSize = state.nameSpan.style.fontSize;
          }
        };
        refit();
        activeRefit = refit;
        await finishShow(themeRoot, [state.photo, ...state.ghosts]);
        armIdle(themeRoot, state, Math.round(revealMs * 1.12), "idle");
      },
      hide(themeRoot, state, settings) {
        const revealMs = (settings && settings.revealMs) || 1250;
        return hideTheme(themeRoot, state, Math.round(revealMs * 0.5) + 40, ["no-copy"]);
      },
      unmount(themeRoot, state) {
        if (state && state.idleTimer) clearTimeout(state.idleTimer);
      },
    },
  };

  // ---------------- Liquid Glass GL runtime ----------------

  function liqAspect(state) {
    const c = state && state.canvas;
    if (c && c.clientWidth && c.clientHeight) return c.clientHeight / c.clientWidth;
    return (window.innerHeight || 1) / (window.innerWidth || 1);
  }

  function seedLiqBubbles(state) {
    state.seeds = [];
    const aspect = liqAspect(state);
    for (let i = 0; i < LIQ_N; i += 1) {
      const cluster = Math.floor(i / 2);
      const role = i % 2;
      state.seeds.push({
        cluster,
        role,
        x: (liqFract(cluster * 0.6180339887 + 0.11) - 0.5) * 0.96,
        y: (liqFract(cluster * 0.4142135623 + 0.27) - 0.5) * aspect * 0.94,
        size: role === 0 ? 0.026 : 0.016,
        speed: 0.45 + liqFract(cluster * 0.27) * 0.8,
        wobble: 0.7 + role * 0.42,
        phase: cluster * 1.31 + role * 2.2,
        heading: liqFract(cluster * 0.73) * Math.PI * 2,
      });
    }
  }

  function uploadLiqPhoto(state) {
    state.hasTex = 0;
    const gl = state.gl;
    if (!gl || !state.program || !state.photo.naturalWidth) return;
    try {
      gl.bindTexture(gl.TEXTURE_2D, state.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, state.photo);
      state.hasTex = 1;
    } catch {
      state.hasTex = 0;
    }
  }

  function liqUpdateBubbles(state, time) {
    const dt = state.lastTime === 0 ? 0.016 : Math.min(0.05, Math.max(0, time - state.lastTime));
    state.lastTime = time;
    const aspect = liqAspect(state);
    const halfW = 0.58;
    const halfH = 0.58 * aspect;
    const tune = liqMotionTune((state.settings && state.settings.motion) || "drift");
    const homes = [];
    for (let i = 0; i < LIQ_N; i += 1) {
      const s = state.seeds[i];
      if (s.role !== 0) continue;
      s.x += Math.cos(s.heading + time * 0.18 * tune.swirl) * tune.wander * dt;
      s.y += tune.rise * (0.62 + s.speed * 0.4) * dt;
      s.y += Math.sin(s.heading * 1.3 + time * 0.16 * tune.swirl) * tune.wander * 0.5 * dt;
      s.x = liqWrap(s.x, -halfW, halfW);
      s.y = liqWrap(s.y, -halfH, halfH);
      homes[s.cluster] = s;
    }
    for (let i = 0; i < LIQ_N; i += 1) {
      const s = state.seeds[i];
      const home = homes[s.cluster] || s;
      const split = 0.5 + 0.5 * Math.sin(time * s.wobble * tune.swirl + s.cluster * 1.4);
      const localA = time * (0.65 + s.role * 0.5) * tune.swirl + s.phase;
      const localR = s.role === 0 ? 0.005 : 0.012 + split * 0.048 * tune.split;
      let grow = 0.78 + 0.32 * Math.sin(time * 1.05 + i * 0.8);
      if (s.role === 1) grow *= 0.5 + 0.75 * (1.0 - split);
      const j = i * 4;
      state.bubbles[j] = home.x + Math.cos(localA) * localR;
      state.bubbles[j + 1] = home.y + Math.sin(localA * 1.12) * localR * 0.85;
      state.bubbles[j + 2] = 0;
      state.bubbles[j + 3] = s.size * grow;
    }
  }

  function startLiqGL(state, themeRoot) {
    if (!state.gl || !state.program) return;
    state.t0 = performance.now() / 1000;
    state.lastTime = 0;
    seedLiqBubbles(state);
    state.scale = 0.2;
    state.scaleTarget = 1;
    state.running = true;
    cancelAnimationFrame(state.raf);

    const gl = state.gl;
    const canvas = state.canvas;

    function resize() {
      // Buffer tracks physical pixels of the scaled stage, capped for perf.
      const dpr = Math.min((window.devicePixelRatio || 1) * (stageScale || 1), 1.25);
      const w = Math.max(2, Math.round(canvas.clientWidth * dpr * 0.7));
      const h = Math.max(2, Math.round(canvas.clientHeight * dpr * 0.7));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function photoUv() {
      // UVs relative to the canvas (the design-space stage), not the window.
      const c = canvas.getBoundingClientRect();
      const rect = state.slab.getBoundingClientRect();
      if (!c.width || !c.height) return [0, 0, 0, 0];
      return [
        (rect.left - c.left) / c.width,
        1 - (rect.bottom - c.top) / c.height,
        rect.width / c.width,
        rect.height / c.height,
      ];
    }

    function frame(now) {
      if (!state.running || !state.alive) return;
      state.raf = requestAnimationFrame(frame);
      if (document.hidden || !themeRoot.isConnected) return;
      resize();
      const time = now / 1000 - state.t0;
      state.scale += (state.scaleTarget - state.scale) * 0.08;
      liqUpdateBubbles(state, time);
      const settings = state.settings || {};
      const p = liqHexToRgb(settings.primary || "#7ee8ff");
      const s = liqHexToRgb(settings.secondary || "#4dffc3");
      const uv = photoUv();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(state.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, state.tex);
      gl.uniform1i(state.locs.uTex, 0);
      gl.uniform2f(state.locs.uRes, canvas.width, canvas.height);
      gl.uniform1f(state.locs.uTime, time);
      gl.uniform1f(state.locs.uHasTex, state.hasTex);
      gl.uniform1f(state.locs.uScale, state.scale);
      gl.uniform3f(state.locs.uPrimary, p[0], p[1], p[2]);
      gl.uniform3f(state.locs.uSecondary, s[0], s[1], s[2]);
      gl.uniform4f(state.locs.uPhotoUv, uv[0], uv[1], uv[2], uv[3]);
      for (let i = 0; i < LIQ_N; i += 1) {
        const j = i * 4;
        gl.uniform4f(
          state.locs.bubbles[i],
          state.bubbles[j],
          state.bubbles[j + 1],
          state.bubbles[j + 2],
          state.bubbles[j + 3]
        );
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    state.raf = requestAnimationFrame(frame);
  }

  function isBackgroundMediaNode(node) {
    return Boolean(
      node &&
        typeof node.closest === "function" &&
        node.closest("#dyn-bg-media, #dyn-bg-embed, #preview-bg")
    );
  }

  /** Capture photo slot — never the selected Show-background media img. */
  function findMessagePhoto(themeRoot) {
    if (!themeRoot) return null;
    const preferred = themeRoot.querySelector(
      ".well img, [data-photo], .tm-hero-img, .photo-panel img, .photo-holder img, .photo-well img, .program img, .aurora-card img"
    );
    if (preferred && !isBackgroundMediaNode(preferred)) return preferred;
    const framePhoto = themeRoot.querySelector(".frame img");
    if (framePhoto && !isBackgroundMediaNode(framePhoto)) return framePhoto;
    return (
      [...themeRoot.querySelectorAll("img")].find((img) => !isBackgroundMediaNode(img)) || null
    );
  }

  function collectMessagePhotos(themeRoot, selector) {
    if (!themeRoot) return [];
    return [...themeRoot.querySelectorAll(selector || "[data-photo], img")].filter(
      (img) => !isBackgroundMediaNode(img)
    );
  }

  root.BGMessageThemes = {
    STYLE,
    FONTS,
    themes,
    fitText: fitPx,
    ensureFitStage,
    applyVars,
    ensurePosterPasteVisible,
    commonShowPrep,
    finishShow,
    hideTheme,
    replayGuestMotion,
    replayEnterMotion,
    whenDecoded,
    isBackgroundMediaNode,
    findMessagePhoto,
    collectMessagePhotos,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
