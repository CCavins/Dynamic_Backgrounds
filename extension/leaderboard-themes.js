(function (root) {
  const DESIGN_LONG = 1920;
  const METAL = { 1: "gold", 2: "silver", 3: "bronze" };

  const RAW_STYLE = `
html.dyn-leaderboard-on .v2-block[data-dyn-lb-native],
html.dyn-cover-leaderboard .v2-block[data-dyn-lb-native],
html.dyn-leaderboard-on .v2-block[data-dyn-lb-header],
html.dyn-cover-leaderboard .v2-block[data-dyn-lb-header],
html.dyn-lb-pending .v2-app-wrapper .v2-block {
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
#dyn-leaderboard-theme {
  --primary: #3dff8a;
  --secondary: #f5c542;
  --panel: #12182a;
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
  box-sizing: border-box;
  overflow: hidden;
  background: transparent;
  opacity: 0;
  transition: opacity 0.32s ease;
}
#dyn-leaderboard-theme.on { opacity: 1; }
#dyn-leaderboard-theme.dyn-awaiting-show { visibility: visible !important; opacity: 1 !important; }
#dyn-leaderboard-theme.dyn-awaiting-show > * { visibility: hidden !important; opacity: 0 !important; }
#dyn-leaderboard-theme, #dyn-leaderboard-theme * { box-sizing: border-box; }
#dyn-leaderboard-theme .dyn-fit-stage {
  position: absolute;
  transform-origin: top left;
  overflow: hidden;
  container-type: size;
}
#dyn-leaderboard-theme.on .dyn-fit-stage,
#dyn-leaderboard-theme.on .dyn-stage,
#dyn-leaderboard-theme.on .lb-header {
  visibility: visible !important;
  opacity: 1 !important;
}

/* ── Stage & header ── */
#dyn-leaderboard-theme .dyn-stage {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3cqh 4.5cqw 2.6cqh;
  color: #fff;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
#dyn-leaderboard-theme .lb-header {
  flex: 0 0 auto;
  width: min(72cqw, 100%);
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  font-size: 2.45cqh;
  margin: 0 0 2cqh;
  padding-bottom: 0.9cqh;
  color: rgba(255,255,255,0.92);
  border-bottom: 1px solid color-mix(in srgb, var(--secondary, #f5c542) 28%, rgba(255,255,255,0.16));
  text-shadow: 0 0.12cqh 0.7cqh rgba(0,0,0,0.55);
}
#dyn-leaderboard-theme .lb-body {
  flex: 1;
  min-height: 0;
  width: min(72cqw, 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
#dyn-leaderboard-theme .lb-glass {
  background: linear-gradient(180deg, color-mix(in srgb, var(--panel, #12182a) 62%, transparent), color-mix(in srgb, var(--panel, #12182a) 80%, #000));
  backdrop-filter: blur(10px) saturate(1.15);
  -webkit-backdrop-filter: blur(10px) saturate(1.15);
  border: 1px solid color-mix(in srgb, var(--secondary, #f5c542) 22%, rgba(255,255,255,0.14));
  box-shadow: 0 0.45cqh 1.8cqh rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.12);
}

/* ── Shared units ── */
#dyn-leaderboard-theme .lb-row,
#dyn-leaderboard-theme .lb-podium-slot,
#dyn-leaderboard-theme .lb-win-card,
#dyn-leaderboard-theme .lb-hero {
  opacity: 0;
  visibility: hidden;
}
#dyn-leaderboard-theme.on .lb-row.is-in,
#dyn-leaderboard-theme.on .lb-podium-slot.is-in,
#dyn-leaderboard-theme.on .lb-win-card.is-in,
#dyn-leaderboard-theme.on .lb-hero.is-in {
  visibility: visible !important;
  opacity: 1 !important;
  transform: translateX(0) translateY(0) scale(1);
}
#dyn-leaderboard-theme .lb-row {
  display: flex;
  align-items: center;
  gap: 1.1cqw;
  width: 100%;
  min-width: 0;
  transform: translateX(-1.6cqw);
  transition: opacity 0.36s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
#dyn-leaderboard-theme .lb-player {
  display: flex;
  align-items: center;
  gap: 1.1cqw;
  min-width: 0;
  flex: 1 1 auto;
}
#dyn-leaderboard-theme .lb-avatar {
  width: 6.4cqh;
  height: 6.4cqh;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255,255,255,0.1);
  flex: 0 0 auto;
  box-shadow: 0 0.2cqh 0.9cqh rgba(0,0,0,0.4);
}
#dyn-leaderboard-theme .lb-avatar.bordered {
  border: 0.22cqh solid color-mix(in srgb, var(--primary) 70%, #fff);
}
#dyn-leaderboard-theme .lb-avatar img,
#dyn-leaderboard-theme .lb-avatar .lb-avatar-sprite {
  width: 100%; height: 100%; min-width: 100%; min-height: 100%; display: block;
}
#dyn-leaderboard-theme .lb-avatar img { object-fit: cover; }
#dyn-leaderboard-theme .lb-avatar .lb-avatar-sprite { background-repeat: no-repeat; }
#dyn-leaderboard-theme .lb-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.28cqh;
  min-width: 0;
  flex: 1 1 auto;
}
#dyn-leaderboard-theme .lb-name {
  font-weight: 700;
  font-size: 2.55cqh;
  line-height: 1.12;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0.12cqh 0.55cqh rgba(0,0,0,0.55);
}
#dyn-leaderboard-theme .lb-score {
  display: inline-flex;
  align-items: center;
  gap: 0.55cqw;
  font-weight: 800;
  font-size: 2.45cqh;
  line-height: 1;
  color: var(--primary, #3dff8a);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0.1cqh 0.55cqh rgba(0,0,0,0.45);
}
#dyn-leaderboard-theme .lb-trophy,
#dyn-leaderboard-theme .lb-crown,
#dyn-leaderboard-theme .lb-wreath {
  display: block;
  object-fit: contain;
  pointer-events: none;
}
#dyn-leaderboard-theme .lb-gem { display: none !important; }
#dyn-leaderboard-theme .lb-score-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5cqw;
  padding: 0.38cqh 0.95cqw;
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel, #12182a) 72%, #000);
  border: 1px solid color-mix(in srgb, var(--secondary, #f5c542) 28%, rgba(255,255,255,0.12));
  font-weight: 800;
  font-size: 2.15cqh;
  font-variant-numeric: tabular-nums;
  color: var(--primary, #3dff8a);
  width: max-content;
  max-width: 100%;
}
#dyn-leaderboard-theme .lb-wreath-wrap {
  position: relative;
  width: 7.6cqh;
  height: 7.6cqh;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
}
#dyn-leaderboard-theme .lb-wreath-wrap .lb-wreath {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
#dyn-leaderboard-theme .lb-header[hidden],
#dyn-leaderboard-theme .lb-table[hidden],
#dyn-leaderboard-theme .lb-rest[hidden] { display: none !important; }
#dyn-leaderboard-theme .lb-wreath-wrap span {
  position: relative;
  z-index: 1;
  font-weight: 800;
  font-size: 1.85cqh;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0.1cqh 0.4cqh rgba(0,0,0,0.65);
  transform: translateY(0.25cqh);
}
@keyframes lb-glint {
  0% { filter: brightness(1); }
  45% { filter: brightness(1.2); }
  100% { filter: brightness(1); }
}
#dyn-leaderboard-theme.on .metal-gold.is-in > .lb-wreath-wrap .lb-wreath,
#dyn-leaderboard-theme.on .lb-podium-slot.metal-gold.is-in .lb-crown {
  animation: lb-glint 0.85s ease 0.28s 1;
}
#dyn-leaderboard-theme .metal-gold .lb-wreath-wrap span,
#dyn-leaderboard-theme .lb-wreath-wrap.metal-gold span { color: #ffe7a0; }
#dyn-leaderboard-theme .metal-silver .lb-wreath-wrap span,
#dyn-leaderboard-theme .lb-wreath-wrap.metal-silver span { color: #eef2f7; }
#dyn-leaderboard-theme .metal-bronze .lb-wreath-wrap span,
#dyn-leaderboard-theme .lb-wreath-wrap.metal-bronze span { color: #ffd2a0; }
#dyn-leaderboard-theme .metal-steel .lb-wreath-wrap span,
#dyn-leaderboard-theme .lb-wreath-wrap.metal-steel span { color: #d5dbe6; }
#dyn-leaderboard-theme .metal-steel .lb-wreath { filter: saturate(0.2) brightness(0.9); }
#dyn-leaderboard-theme .lb-rank-chip {
  position: absolute;
  left: -0.15cqh;
  bottom: -0.15cqh;
  min-width: 2.5cqh;
  height: 2.5cqh;
  padding: 0 0.45cqw;
  border-radius: 0.45cqh;
  background: #ff4f8b;
  color: #fff;
  font-weight: 800;
  font-size: 1.45cqh;
  line-height: 2.5cqh;
  text-align: center;
  box-shadow: 0 0.15cqh 0.5cqh rgba(0,0,0,0.4);
}

/* ── Crown podium ── */
#dyn-leaderboard-theme[data-theme^="podium"] .lb-body { gap: 1.8cqh; width: min(78cqw, 100%); }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2.4cqw;
  min-height: 46cqh;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot {
  flex: 1;
  max-width: 26cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateY(3.2cqh);
  transition: opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1), transform 0.48s cubic-bezier(0.22, 1, 0.36, 1);
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-1 { order: 2; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-2 { order: 1; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-3 { order: 3; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-cluster {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 1cqh;
  padding-top: 4.2cqh;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-1 .lb-podium-cluster { padding-top: 5cqh; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-crown {
  position: absolute;
  left: 50%;
  bottom: calc(100% - 1.55cqh);
  width: 8.4cqh;
  height: 6.4cqh;
  margin: 0;
  z-index: 3;
  opacity: 0;
  transform: translate(-50%, -1.2cqh) scale(0.86);
  transition: opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.16s, transform 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.16s;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.is-in .lb-crown {
  opacity: 1;
  transform: translate(-50%, 0);
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-1 .lb-crown {
  width: 10.4cqh;
  height: 7.6cqh;
  bottom: calc(100% - 1.9cqh);
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-3 .lb-crown {
  width: 6.9cqh;
  height: 5.25cqh;
  bottom: calc(100% - 1.25cqh);
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-id {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85cqh;
  width: 100%;
  min-width: 0;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-avatar-wrap { position: relative; flex: 0 0 auto; overflow: visible; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot .lb-avatar { width: 8.6cqh; height: 8.6cqh; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-1 .lb-avatar { width: 10.6cqh; height: 10.6cqh; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot .lb-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot .lb-name {
  width: 100%;
  font-size: 4.1cqh;
  line-height: 1.06;
  font-weight: 800;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  overflow-wrap: normal;
  word-break: normal;
  hyphens: none;
  max-height: 2.12em;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-pedestal {
  position: relative;
  width: 100%;
  border-radius: 0.55cqh 0.55cqh 0 0;
  background: linear-gradient(180deg, color-mix(in srgb, var(--panel, #12182a) 78%, #3a4876) 0%, color-mix(in srgb, var(--panel, #12182a) 90%, #000) 100%);
  border: 1px solid color-mix(in srgb, var(--secondary, #f5c542) 20%, rgba(255,255,255,0.16));
  border-bottom: none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 0.6cqh 1.6cqh rgba(0,0,0,0.35);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-pedestal::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 18%;
  background: linear-gradient(90deg, rgba(255,255,255,0.1), transparent);
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-pedestal-ord {
  font-weight: 800;
  font-size: 6.2cqh;
  letter-spacing: 0.06em;
  color: #fff;
  text-transform: lowercase;
  text-shadow: 0 0.18cqh 0.7cqh rgba(0,0,0,0.55);
  position: relative;
  z-index: 1;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-1 .lb-pedestal { height: 16.5cqh; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-2 .lb-pedestal { height: 12.2cqh; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-3 .lb-pedestal { height: 9.2cqh; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot.rank-1 .lb-pedestal {
  background: linear-gradient(180deg, color-mix(in srgb, var(--secondary, #f5c542) 32%, var(--panel, #12182a)) 0%, color-mix(in srgb, var(--panel, #12182a) 88%, #000) 52%, color-mix(in srgb, var(--panel, #12182a) 92%, #000) 100%);
  border-color: color-mix(in srgb, var(--secondary, #f5c542) 45%, transparent);
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-table {
  border-radius: 1cqh;
  padding: 1.1cqh 1.6cqw 1.2cqh;
  min-height: 0;
  flex: 1;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-thead,
#dyn-leaderboard-theme[data-theme^="podium"] .lb-row {
  display: grid;
  grid-template-columns: 10cqw minmax(0, 1fr) 14cqw;
  grid-template-areas: "place user score";
  align-items: center;
  gap: 1cqw;
  padding: 0.52cqh 1cqw;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-thead {
  padding: 0 1cqw 0.7cqh;
  font-size: 1.55cqh;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-thead span:nth-child(1),
#dyn-leaderboard-theme[data-theme^="podium"] .lb-col-place { grid-area: place; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-thead span:nth-child(2),
#dyn-leaderboard-theme[data-theme^="podium"] .lb-row > .lb-player { grid-area: user; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-thead span:nth-child(3),
#dyn-leaderboard-theme[data-theme^="podium"] .lb-col-score { grid-area: score; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-thead span:nth-child(3) { text-align: right; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-list { display: flex; flex-direction: column; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-row {
  border-top: 1px solid rgba(255,255,255,0.08);
  background: transparent;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-col-place {
  display: inline-flex;
  align-items: center;
  gap: 0.55cqw;
  font-weight: 800;
  font-size: 2.2cqh;
  color: rgba(255,255,255,0.86);
  font-variant-numeric: tabular-nums;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-col-place .lb-trophy { width: 2.2cqh; height: 2.2cqh; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-row > .lb-player {
  flex: 0 1 auto;
  min-width: 0;
  justify-content: flex-start;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-col-score {
  justify-self: end;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
#dyn-leaderboard-theme[data-theme^="podium"] .lb-row .lb-avatar { width: 5.2cqh; height: 5.2cqh; }
#dyn-leaderboard-theme[data-theme^="podium"] .lb-row .lb-name { font-size: 2.35cqh; }

/* ── Winner cards ── */
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-body { gap: 1.6cqh; width: min(80cqw, 100%); }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-winners {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 1.6cqw;
  min-height: 42cqh;
}
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card {
  flex: 1;
  max-width: 22cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.85cqh;
  padding: 1.6cqh 1.4cqw 1.8cqh;
  border-radius: 1.4cqh;
  text-align: center;
  transform: translateY(2.2cqh) scale(0.96);
  transition: opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.44s cubic-bezier(0.22, 1, 0.36, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: linear-gradient(180deg, color-mix(in srgb, var(--panel, #12182a) 70%, transparent), color-mix(in srgb, var(--panel, #12182a) 88%, #000));
  border: 1px solid color-mix(in srgb, var(--secondary, #f5c542) 22%, rgba(255,255,255,0.16));
  box-shadow: 0 0.5cqh 2cqh rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.16);
}
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card.rank-1 { order: 2; min-height: 42cqh; }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card.rank-2 { order: 1; min-height: 36cqh; align-self: end; }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card.rank-3 { order: 3; min-height: 33cqh; align-self: end; }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card.rank-1 {
  background: linear-gradient(180deg, color-mix(in srgb, var(--secondary, #f5c542) 34%, var(--panel, #12182a)), color-mix(in srgb, var(--panel, #12182a) 88%, #000));
  border-color: color-mix(in srgb, var(--secondary, #f5c542) 50%, transparent);
}
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card.rank-2 {
  background: linear-gradient(180deg, color-mix(in srgb, #7eb6ff 30%, var(--panel, #12182a)), color-mix(in srgb, var(--panel, #12182a) 88%, #000));
  border-color: color-mix(in srgb, #7eb6ff 45%, var(--panel, #12182a));
}
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card.rank-3 {
  background: linear-gradient(180deg, color-mix(in srgb, #e08aa8 30%, var(--panel, #12182a)), color-mix(in srgb, var(--panel, #12182a) 88%, #000));
  border-color: color-mix(in srgb, #e08aa8 45%, var(--panel, #12182a));
}
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card .lb-wreath-wrap { width: 8.4cqh; height: 8.4cqh; }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card .lb-wreath-wrap span { font-size: 2.05cqh; }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card .lb-avatar { width: 12cqh; height: 12cqh; }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card.rank-1 .lb-avatar { width: 14.5cqh; height: 14.5cqh; }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card .lb-info { align-items: center; width: 100%; }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-win-card .lb-name { font-size: 2.5cqh; max-width: 100%; }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-rest {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 1.1cqh;
  padding: 0.4cqh 1.4cqw;
  min-height: 0;
  flex: 1;
}
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-rest.is-wide {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 1.8cqw;
}
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-rest .lb-row {
  padding: 0.75cqh 0.4cqw;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-rest .lb-avatar { width: 5.4cqh; height: 5.4cqh; }
#dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-rest .lb-wreath-wrap { width: 6.4cqh; height: 6.4cqh; }

/* ── Wreath ranking ── */
#dyn-leaderboard-theme[data-theme^="compact-ladder"] .lb-body {
  width: min(56cqw, 100%);
  align-items: center;
}
#dyn-leaderboard-theme[data-theme^="compact-ladder"] .lb-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: max-content;
  max-width: 100%;
  margin: 0 auto;
  padding: 0.7cqh 1.5cqw 0.9cqh;
  border-radius: 1.2cqh;
  background: color-mix(in srgb, var(--panel, #12182a) 58%, transparent);
  border: 1px solid color-mix(in srgb, var(--secondary, #f5c542) 18%, rgba(255,255,255,0.1));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
#dyn-leaderboard-theme[data-theme^="compact-ladder"] .lb-row {
  justify-content: flex-start;
  gap: 0.85cqw;
  width: auto;
  padding: 0.75cqh 0.4cqw;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  background: transparent;
}
#dyn-leaderboard-theme[data-theme^="compact-ladder"] .lb-player {
  flex: 0 1 auto;
  min-width: 0;
  gap: 1cqw;
}
#dyn-leaderboard-theme[data-theme^="compact-ladder"] .lb-avatar { width: 7.2cqh; height: 7.2cqh; }
#dyn-leaderboard-theme[data-theme^="compact-ladder"] .lb-name { font-size: 2.7cqh; }
#dyn-leaderboard-theme[data-theme^="compact-ladder"] .lb-score { font-size: 2.35cqh; color: var(--primary, #3dff8a); }
#dyn-leaderboard-theme[data-theme^="compact-ladder"] .lb-wreath-wrap {
  width: 7.6cqh;
  height: 7.6cqh;
  margin: 0;
  flex: 0 0 auto;
  order: -1;
}
#dyn-leaderboard-theme[data-theme^="compact-ladder"] .metal-gold .lb-wreath-wrap .lb-wreath {
  filter: drop-shadow(0 0 0.6cqh rgba(245,197,66,0.35));
}

/* ── Gold spotlight ── */
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-body { gap: 2cqh; width: min(88cqw, 100%); }
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.35cqh;
  padding: 3.2cqh 2.2cqw 3.4cqh;
  border-radius: 1.6cqh;
  text-align: center;
  transform: translateY(1.4cqh) scale(0.97);
  transition: opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.44s cubic-bezier(0.22, 1, 0.36, 1);
  background: linear-gradient(180deg, color-mix(in srgb, var(--panel, #121028) 78%, transparent), color-mix(in srgb, var(--panel, #121028) 90%, #000));
  border: 1px solid color-mix(in srgb, var(--secondary, #6d4aff) 40%, transparent);
  box-shadow: 0 0.6cqh 2.2cqh rgba(0,0,0,0.35), 0 0 2.4cqh color-mix(in srgb, var(--secondary, #6d4aff) 18%, transparent);
}
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-hero-ribbon { display: none; }
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-avatar-ring {
  padding: 0.55cqh;
  border-radius: 50%;
  background: conic-gradient(from 210deg, var(--primary, #f5c542), #fff4c2, var(--secondary, #6d4aff), var(--primary, #f5c542));
  box-shadow: 0 0 1.8cqh color-mix(in srgb, var(--primary, #f5c542) 40%, transparent);
  transform-origin: center center;
}
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-hero .lb-avatar {
  width: 18.5cqh;
  height: 18.5cqh;
  border: none;
}
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-hero .lb-wreath-wrap { width: 13cqh; height: 9.4cqh; }
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-hero .lb-trophy { width: 4.6cqh; height: 4.6cqh; }
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-hero .lb-name { font-size: 4.4cqh; color: var(--primary, #f5c542); }
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-hero .lb-score { font-size: 3.9cqh; color: var(--primary, #f5c542); justify-content: center; }
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-side { display: flex; flex-direction: column; gap: 0.7cqh; flex: 1; min-height: 0; }
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-side .lb-row {
  padding: 0.7cqh 1.3cqw;
  border-radius: 999px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--panel, #121028) 70%, transparent), color-mix(in srgb, var(--panel, #121028) 48%, transparent));
  border: 1px solid color-mix(in srgb, var(--secondary, #6d4aff) 22%, rgba(255,255,255,0.1));
  backdrop-filter: blur(8px);
}
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-side .lb-rank {
  flex: 0 0 auto;
  min-width: 4.2cqh;
  font-weight: 800;
  font-size: 2.2cqh;
  color: rgba(255,255,255,0.9);
  font-variant-numeric: tabular-nums;
}
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-side .lb-avatar { width: 5.6cqh; height: 5.6cqh; }
#dyn-leaderboard-theme[data-theme^="hero-list"] .lb-side .lb-score-pill { margin-left: auto; }

@container (min-aspect-ratio: 1.15/1) {
  #dyn-leaderboard-theme[data-theme^="hero-list"] .lb-body {
    flex-direction: row;
    align-items: stretch;
    gap: 2.6cqw;
  }
  #dyn-leaderboard-theme[data-theme^="hero-list"] .lb-hero {
    flex: 0 0 38cqw;
    max-width: 42cqw;
  }
}

/* ── Broadcast pills ── */
#dyn-leaderboard-theme[data-theme^="ticker-strip"] .dyn-stage {
  justify-content: flex-end;
  align-items: flex-start;
  padding: 3.2cqh 4.2cqw 4.5cqh;
}
#dyn-leaderboard-theme[data-theme^="ticker-strip"] .lb-header {
  width: min(62cqw, 100%);
  text-align: left;
  border-bottom-color: color-mix(in srgb, var(--primary) 40%, transparent);
}
#dyn-leaderboard-theme[data-theme^="ticker-strip"] .lb-body {
  width: min(62cqw, 100%);
  margin-right: auto;
  flex: 0 1 auto;
}
#dyn-leaderboard-theme[data-theme^="ticker-strip"] .lb-list {
  display: flex;
  flex-direction: column;
  gap: 0.65cqh;
}
#dyn-leaderboard-theme[data-theme^="ticker-strip"] .lb-row {
  padding: 0.7cqh 1.2cqw;
  border-radius: 999px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--panel, #12182a) 78%, transparent) 0%, color-mix(in srgb, var(--panel, #12182a) 55%, transparent) 70%, color-mix(in srgb, var(--panel, #12182a) 18%, transparent) 100%);
  border: 1px solid color-mix(in srgb, var(--secondary, #3dff8a) 22%, rgba(255,255,255,0.12));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 0.25cqh 1cqh rgba(0,0,0,0.28);
}
#dyn-leaderboard-theme[data-theme^="ticker-strip"] .lb-rank {
  min-width: 3.8cqh;
  font-weight: 800;
  font-size: 2.15cqh;
  color: var(--primary, #f5c542);
  font-variant-numeric: tabular-nums;
}
#dyn-leaderboard-theme[data-theme^="ticker-strip"] .lb-avatar { width: 5.4cqh; height: 5.4cqh; }
#dyn-leaderboard-theme[data-theme^="ticker-strip"] .lb-name { font-size: 2.4cqh; flex: 1 1 auto; }
#dyn-leaderboard-theme[data-theme^="ticker-strip"] .lb-info { flex-direction: row; align-items: center; gap: 1cqw; }
#dyn-leaderboard-theme[data-theme^="ticker-strip"] .lb-score-pill { margin-left: auto; }

@container (max-aspect-ratio: 1/1) {
  #dyn-leaderboard-theme[data-theme^="podium"] .lb-body,
  #dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-body,
  #dyn-leaderboard-theme[data-theme^="compact-ladder"] .lb-body,
  #dyn-leaderboard-theme[data-theme^="hero-list"] .lb-body,
  #dyn-leaderboard-theme[data-theme^="ticker-strip"] .lb-body { width: min(92cqw, 100%); }
  #dyn-leaderboard-theme[data-theme^="stacked-cards"] .lb-rest.is-wide { grid-template-columns: 1fr; }
  #dyn-leaderboard-theme[data-theme^="podium"] .lb-podium-slot { max-width: 30cqw; }
  #dyn-leaderboard-theme[data-theme^="ticker-strip"] .dyn-stage { align-items: stretch; }
}

/* ── Idle motion (v1 breath/sheen, v2 float/sway) ── */
@keyframes lb-idle-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.045); }
}
@keyframes lb-idle-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.42cqh); }
}
@keyframes lb-idle-crown-bob {
  0%, 100% { transform: translate(-50%, 0); filter: brightness(1); }
  50% { transform: translate(-50%, -0.38cqh); filter: brightness(1.14); }
}
@keyframes lb-idle-crown-sway {
  0%, 100% { transform: translate(-50%, 0) rotate(0deg); }
  40% { transform: translate(-50%, -0.28cqh) rotate(-4.5deg); }
  70% { transform: translate(-50%, -0.12cqh) rotate(3.2deg); }
}
@keyframes lb-idle-wreath-turn {
  0%, 100% { transform: rotate(0deg); filter: brightness(1); }
  50% { transform: rotate(7deg); filter: brightness(1.12); }
}
@keyframes lb-idle-wreath-pulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.07); filter: brightness(1.16); }
}
@keyframes lb-idle-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.1); }
}
@keyframes lb-idle-score-glow {
  0%, 100% { text-shadow: 0 0.1cqh 0.55cqh rgba(0,0,0,0.45); }
  50% { text-shadow: 0 0 0.9cqh color-mix(in srgb, var(--primary, #3dff8a) 55%, transparent); }
}
@keyframes lb-idle-pill-glow {
  0%, 100% { box-shadow: 0 0 0 0 transparent; border-color: color-mix(in srgb, var(--secondary, #f5c542) 28%, rgba(255,255,255,0.12)); }
  50% { box-shadow: 0 0 1.1cqh color-mix(in srgb, var(--primary, #3dff8a) 38%, transparent); border-color: color-mix(in srgb, var(--primary, #3dff8a) 45%, rgba(255,255,255,0.2)); }
}
@keyframes lb-idle-sheen {
  0% { transform: translateX(-120%); opacity: 0; }
  18% { opacity: 0.55; }
  42% { transform: translateX(220%); opacity: 0; }
  100% { transform: translateX(220%); opacity: 0; }
}
@keyframes lb-idle-pedestal-sheen {
  0% { transform: translateX(-40%); opacity: 0.15; }
  45% { transform: translateX(480%); opacity: 0.7; }
  100% { transform: translateX(480%); opacity: 0; }
}
@keyframes lb-idle-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes lb-idle-trophy-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-0.35cqh) rotate(-6deg); }
}
@keyframes lb-idle-hero-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 1.8cqh color-mix(in srgb, var(--primary, #f5c542) 40%, transparent); }
  50% { transform: scale(1.055); box-shadow: 0 0 2.8cqh color-mix(in srgb, var(--primary, #f5c542) 62%, transparent); }
}
@keyframes lb-idle-hero-sway {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5.5deg); }
  75% { transform: rotate(5.5deg); }
}
@keyframes lb-idle-border-pulse {
  0%, 100% { box-shadow: 0 0.2cqh 0.9cqh rgba(0,0,0,0.4); }
  50% { box-shadow: 0 0 1.2cqh color-mix(in srgb, var(--primary) 42%, transparent); }
}

#dyn-leaderboard-theme[data-theme*="-idle-"] .lb-glass { position: relative; overflow: hidden; }
#dyn-leaderboard-theme[data-theme*="-idle-"] .lb-avatar { transform-origin: center center; }
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-glass::after,
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-win-card::after,
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-row::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 28%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
  pointer-events: none;
  animation: lb-idle-sheen 8.8s ease-in-out infinite;
}
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-win-card { position: relative; overflow: hidden; }
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-row { position: relative; overflow: hidden; }
#dyn-leaderboard-theme[data-theme^="compact-ladder"][data-theme*="-idle-"] .lb-row {
  overflow: visible;
}
#dyn-leaderboard-theme[data-theme^="compact-ladder"][data-theme$="-idle-v1"] .lb-row::after {
  display: none;
}
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-win-card.rank-2::after,
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-row:nth-child(2)::after { animation-delay: 1.4s; }
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-win-card.rank-3::after,
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-row:nth-child(3)::after { animation-delay: 2.6s; }
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-row:nth-child(4)::after { animation-delay: 3.4s; }
#dyn-leaderboard-theme[data-theme$="-idle-v1"] .lb-row:nth-child(5)::after { animation-delay: 4.1s; }

#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .is-in .lb-avatar {
  animation: lb-idle-breathe 5.6s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .rank-2.is-in .lb-avatar,
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-row:nth-child(2).is-in .lb-avatar { animation-delay: 0.7s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .rank-3.is-in .lb-avatar,
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-row:nth-child(3).is-in .lb-avatar { animation-delay: 1.4s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-podium-slot.is-in .lb-crown {
  animation: lb-idle-crown-bob 4.5s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-podium-slot.rank-2.is-in .lb-crown { animation-delay: 0.55s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-podium-slot.rank-3.is-in .lb-crown { animation-delay: 1.1s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-pedestal::after {
  animation: lb-idle-pedestal-sheen 7.2s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-podium-slot.rank-2 .lb-pedestal::after { animation-delay: 1.1s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-podium-slot.rank-3 .lb-pedestal::after { animation-delay: 2.2s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .is-in .lb-score {
  animation: lb-idle-score-glow 4.8s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .is-in .lb-score-pill {
  animation: lb-idle-pill-glow 5.2s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .is-in .lb-wreath {
  animation: lb-idle-wreath-pulse 6.2s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .rank-2.is-in .lb-wreath,
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-row:nth-child(2).is-in .lb-wreath { animation-delay: 0.9s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .rank-3.is-in .lb-wreath,
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-row:nth-child(3).is-in .lb-wreath { animation-delay: 1.7s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-win-card.is-in,
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .lb-hero.is-in {
  animation: lb-idle-glow 6.4s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme^="hero-list"][data-theme$="-idle-v1"] .lb-hero.is-in .lb-avatar-ring {
  animation: lb-idle-hero-pulse 3.8s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme^="hero-list"][data-theme$="-idle-v1"] .lb-hero.is-in .lb-avatar,
#dyn-leaderboard-theme.on[data-theme^="hero-list"][data-theme$="-idle-v1"] .lb-hero.is-in .lb-avatar.bordered {
  animation: none;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .is-in .lb-trophy {
  animation: lb-idle-glow 5s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v1"] .is-in .lb-avatar.bordered {
  animation: lb-idle-breathe 5.6s ease-in-out infinite, lb-idle-border-pulse 5.6s ease-in-out infinite;
}

#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .is-in .lb-avatar {
  animation: lb-idle-float 4.7s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .rank-2.is-in .lb-avatar,
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-row:nth-child(2).is-in .lb-avatar { animation-delay: 0.85s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .rank-3.is-in .lb-avatar,
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-row:nth-child(3).is-in .lb-avatar { animation-delay: 1.55s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-row:nth-child(4).is-in .lb-avatar { animation-delay: 0.4s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-row:nth-child(5).is-in .lb-avatar { animation-delay: 1.9s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-podium-slot.is-in .lb-crown {
  animation: lb-idle-crown-sway 5.8s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-podium-slot.rank-2.is-in .lb-crown { animation-delay: 0.7s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-podium-slot.rank-3.is-in .lb-crown { animation-delay: 1.3s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .is-in .lb-wreath {
  animation: lb-idle-wreath-turn 7.4s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .rank-2.is-in .lb-wreath,
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-row:nth-child(2).is-in .lb-wreath { animation-delay: 0.6s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .rank-3.is-in .lb-wreath,
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-row:nth-child(3).is-in .lb-wreath { animation-delay: 1.2s; }
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .is-in .lb-trophy {
  animation: lb-idle-trophy-bob 4.4s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-win-card.is-in .lb-info,
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-hero.is-in .lb-name {
  animation: lb-idle-glow 5.5s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-podium-slot.rank-1.is-in .lb-pedestal {
  animation: lb-idle-glow 6s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .is-in .lb-score-pill {
  animation: lb-idle-float 5.1s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .lb-row:nth-child(even).is-in .lb-score-pill { animation-delay: 0.9s; }
#dyn-leaderboard-theme.on[data-theme^="hero-list"][data-theme$="-idle-v2"] .lb-hero.is-in .lb-avatar-ring {
  animation: lb-idle-hero-sway 4.6s ease-in-out infinite;
}
#dyn-leaderboard-theme.on[data-theme^="hero-list"][data-theme$="-idle-v2"] .lb-hero.is-in .lb-avatar,
#dyn-leaderboard-theme.on[data-theme^="hero-list"][data-theme$="-idle-v2"] .lb-hero.is-in .lb-avatar.bordered {
  animation: none;
}
#dyn-leaderboard-theme.on[data-theme$="-idle-v2"] .is-in .lb-rank {
  animation: lb-idle-glow 4.6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-crown,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-avatar,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-wreath,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-score,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-score-pill,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-trophy,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-pedestal,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-pedestal::after,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-glass::after,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-win-card::after,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-row::after,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-avatar-ring,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-win-card.is-in,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-hero.is-in,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-info,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-name,
  #dyn-leaderboard-theme[data-theme*="-idle-"] .lb-rank {
    animation: none !important;
  }
}
`;

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function packAssetUrl(filename) {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL("packs/assets/" + filename);
      }
    } catch {
      /* not extension */
    }
    return "packs/assets/" + filename;
  }

  function markImg(cls, base) {
    return '<img class="' + cls + '" src="' + packAssetUrl(base + ".svg") + '" data-png="' + packAssetUrl(base + ".png") + '" alt="" aria-hidden="true">';
  }

  function preferPng(root) {
    if (!root) return;
    root.querySelectorAll("img[data-png]").forEach((img) => {
      const png = img.getAttribute("data-png");
      if (!png || img.dataset.pngTried) return;
      img.dataset.pngTried = "1";
      const probe = new Image();
      probe.onload = function () { img.src = png; };
      probe.src = png;
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function ordinal(rank) {
    const n = Number(rank);
    if (!isFinite(n)) return String(rank);
    const v = n % 100;
    if (v >= 11 && v <= 13) return n + "th";
    switch (n % 10) {
      case 1: return n + "st";
      case 2: return n + "nd";
      case 3: return n + "rd";
      default: return n + "th";
    }
  }

  function metalOf(rank) {
    return METAL[Number(rank)] || "steel";
  }

  function wreathBase(rank) {
    const m = metalOf(rank);
    if (m === "gold") return "lb-wreath-gold";
    if (m === "silver") return "lb-wreath-silver";
    return "lb-wreath-bronze";
  }

  function crownBase(rank) {
    const m = metalOf(rank);
    if (m === "gold") return "lb-crown-gold";
    if (m === "silver") return "lb-crown-silver";
    return "lb-crown-bronze";
  }

  function scoreHtml(leader, pill) {
    const inner = esc(leader.score || "");
    return pill
      ? '<div class="lb-score-pill">' + inner + "</div>"
      : '<div class="lb-score">' + inner + "</div>";
  }

  function wreathHtml(rank) {
    return '<div class="lb-wreath-wrap metal-' + metalOf(rank) + '">' + markImg("lb-wreath", wreathBase(rank)) + "<span>" + ordinal(rank) + "</span></div>";
  }

  function applyVars(themeRoot, settings) {
    if (!themeRoot || !settings) return;
    if (settings.primary) themeRoot.style.setProperty("--primary", settings.primary);
    if (settings.secondary) themeRoot.style.setProperty("--secondary", settings.secondary);
    if (settings.panel) themeRoot.style.setProperty("--panel", settings.panel);
    if (settings.background) themeRoot.style.setProperty("--background", settings.background);
  }

  function layoutStage(themeRoot) {
    const host = themeRoot.parentElement && themeRoot.parentElement.id === "dyn-theme-host" ? themeRoot.parentElement : themeRoot;
    const w = host.clientWidth || window.innerWidth || DESIGN_LONG;
    const h = host.clientHeight || window.innerHeight || 1080;
    const scale = Math.max(w, h) / DESIGN_LONG;
    const portrait = h > w;
    const stageW = portrait ? DESIGN_LONG * (w / h) : DESIGN_LONG;
    const stageH = portrait ? DESIGN_LONG : DESIGN_LONG * (h / w);
    let stage = themeRoot.querySelector(":scope > .dyn-fit-stage");
    if (!stage) { stage = document.createElement("div"); stage.className = "dyn-fit-stage"; themeRoot.appendChild(stage); }
    stage.style.width = stageW + "px";
    stage.style.height = stageH + "px";
    stage.style.transform = "scale(" + scale + ")";
    fitPodiumNames(themeRoot);
    return stage;
  }

  function podiumNameHtml(name) {
    const parts = String(name == null ? "" : name).trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return esc(parts[0]) + "<br>" + esc(parts.slice(1).join(" "));
    return esc(parts[0] || "");
  }

  function fitPodiumName(el) {
    if (!el || !el.isConnected) return;
    el.style.fontSize = "";
    if (el.clientWidth < 4) return;
    const overflows = () =>
      el.scrollHeight > el.clientHeight + 1.5 || el.scrollWidth > el.clientWidth + 1.5;
    if (!overflows()) return;
    const maxPx = parseFloat(getComputedStyle(el).fontSize) || 16;
    let size = maxPx;
    while (size > 10 && overflows()) {
      size -= 1;
      el.style.fontSize = size + "px";
    }
  }

  function fitPodiumNames(themeRoot) {
    if (!themeRoot || themeRoot.getAttribute("data-theme") !== "podium") return;
    themeRoot.querySelectorAll(".lb-podium-slot .lb-name").forEach(fitPodiumName);
  }

  function scheduleFitPodiumNames(themeRoot) {
    fitPodiumNames(themeRoot);
    requestAnimationFrame(() => {
      fitPodiumNames(themeRoot);
      requestAnimationFrame(() => fitPodiumNames(themeRoot));
    });
  }

  function mountAvatar(slot, leader) {
    if (!slot) return;
    slot.replaceChildren();
    const av = leader && leader.avatar;
    const src = (av && av.src) || (leader && leader.avatarSrc) || "";
    if (!src) return;
    if (av && av.sprite) {
      const el = document.createElement("span");
      el.className = "lb-avatar-sprite";
      el.setAttribute("aria-hidden", "true");
      el.style.backgroundImage = 'url("' + src.replace(/"/g, '\\"') + '")';
      el.style.backgroundSize = av.bgSize || "500% 500%";
      el.style.backgroundPosition = av.bgPosition || "50% 50%";
      el.style.backgroundRepeat = av.bgRepeat || "no-repeat";
      slot.appendChild(el);
      return;
    }
    const img = document.createElement("img");
    img.alt = "";
    img.src = src;
    slot.appendChild(img);
  }

  function hydrateAvatars(root, leaders) {
    if (!root || !leaders || !leaders.length) return;
    const byRank = new Map();
    leaders.forEach((l) => byRank.set(String(l.rank), l));
    root.querySelectorAll("[data-lb-avatar]").forEach((slot) => {
      mountAvatar(slot, byRank.get(String(slot.getAttribute("data-lb-avatar"))));
    });
    preferPng(root);
  }

  function playerCluster(leader, settings, opts) {
    const border = settings.avatarBorder !== false ? " bordered" : "";
    const pill = opts && opts.pill;
    return '<div class="lb-player"><div class="lb-avatar' + border + '" data-lb-avatar="' + leader.rank + '"></div><div class="lb-info"><div class="lb-name">' + esc(leader.name) + "</div>" + scoreHtml(leader, pill) + "</div></div>";
  }

  function rowHtml(leader, settings, mode) {
    const metal = " metal-" + metalOf(leader.rank);
    const border = settings.avatarBorder !== false ? " bordered" : "";
    if (mode === "table") {
      return '<div class="lb-row" data-rank="' + leader.rank + '"><div class="lb-col-place">' + markImg("lb-trophy", "lb-trophy") + ordinal(leader.rank) + '</div><div class="lb-player"><div class="lb-avatar' + border + '" data-lb-avatar="' + leader.rank + '"></div><div class="lb-name">' + esc(leader.name) + '</div></div><div class="lb-col-score">' + scoreHtml(leader, false) + "</div></div>";
    }
    if (mode === "wreath") {
      return '<div class="lb-row' + metal + '" data-rank="' + leader.rank + '">' + playerCluster(leader, settings, null) + wreathHtml(leader.rank) + "</div>";
    }
    if (mode === "pill") {
      return '<div class="lb-row" data-rank="' + leader.rank + '"><div class="lb-rank">#' + leader.rank + '</div><div class="lb-avatar' + border + '" data-lb-avatar="' + leader.rank + '"></div><div class="lb-name">' + esc(leader.name) + "</div>" + scoreHtml(leader, true) + "</div>";
    }
    return '<div class="lb-row' + metal + '" data-rank="' + leader.rank + '"><div class="lb-rank">#' + leader.rank + "</div>" + playerCluster(leader, settings, { pill: true }) + "</div>";
  }

  function renderList(el, leaders, settings, mode) {
    if (!el) return;
    el.innerHTML = (leaders || []).map((l) => rowHtml(l, settings, mode)).join("");
    hydrateAvatars(el, leaders);
  }

  function animateIn(themeRoot, settings) {
    const stagger = 52;
    const revealMs = Number(settings.revealMs) || 340;
    [...themeRoot.querySelectorAll(".lb-row, .lb-podium-slot, .lb-win-card, .lb-hero")].forEach((node, i) => {
      node.classList.remove("is-in");
      setTimeout(() => node.classList.add("is-in"), Math.min(revealMs, i * stagger));
    });
  }

  async function commonShow(themeRoot, capture, settings) {
    applyVars(themeRoot, settings);
    layoutStage(themeRoot);
    const header = themeRoot.querySelector(".lb-header");
    if (header) {
      header.textContent = capture.header || "LEADERS";
      header.hidden = settings.showHeader === false;
    }
    const alreadyOn = themeRoot.classList.contains("on");
    themeRoot.classList.remove("dyn-awaiting-show", "off");
    themeRoot.classList.add("on");
    if (!alreadyOn) {
      animateIn(themeRoot, settings);
      await wait(Math.max(160, Number(settings.revealMs) || 320));
    } else {
      themeRoot.querySelectorAll(".lb-row, .lb-podium-slot, .lb-win-card, .lb-hero").forEach((el) => el.classList.add("is-in"));
    }
  }

  function refreshTheme(themeRoot, capture, settings, fillFn) {
    applyVars(themeRoot, settings);
    layoutStage(themeRoot);
    const header = themeRoot.querySelector(".lb-header");
    if (header) {
      header.textContent = capture.header || "LEADERS";
      header.hidden = settings.showHeader === false;
    }
    if (typeof fillFn === "function") fillFn(themeRoot, capture, settings);
  }

  function hideTheme(themeRoot, settings) {
    if (!themeRoot.classList.contains("on")) return Promise.resolve();
    themeRoot.classList.add("off");
    themeRoot.querySelectorAll(".is-in").forEach((el) => el.classList.remove("is-in"));
    return wait(Math.max(120, Number(settings && settings.hideMs) || 220)).then(() => {
      themeRoot.classList.remove("on", "off");
    });
  }

  function mountShell(themeRoot, settings, inner) {
    layoutStage(themeRoot);
    const stage = themeRoot.querySelector(".dyn-fit-stage");
    stage.innerHTML = inner;
    applyVars(themeRoot, settings);
    return {};
  }

  function fillPodium(themeRoot, capture, settings) {
    const leaders = capture.leaders || [];
    const top = leaders.slice(0, 3);
    const rest = leaders.slice(3);
    const order = [1, 0, 2];
    const podium = themeRoot.querySelector(".lb-podium");
    const list = themeRoot.querySelector(".lb-list");
    const border = settings.avatarBorder !== false ? " bordered" : "";
    if (podium) {
      podium.innerHTML = order.map((idx) => {
        const l = top[idx];
        if (!l) return "";
        return (
          '<div class="lb-podium-slot rank-' + l.rank + " metal-" + metalOf(l.rank) + '" data-rank="' + l.rank + '">' +
            '<div class="lb-podium-cluster">' +
              '<div class="lb-podium-id">' +
                '<div class="lb-avatar-wrap">' + markImg("lb-crown", crownBase(l.rank)) + '<div class="lb-avatar' + border + '" data-lb-avatar="' + l.rank + '"></div></div>' +
                '<div class="lb-info"><div class="lb-name">' + podiumNameHtml(l.name) + "</div>" + scoreHtml(l, true) + "</div>" +
              "</div>" +
            "</div>" +
            '<div class="lb-pedestal"><span class="lb-pedestal-ord">' + ordinal(l.rank) + "</span></div>" +
          "</div>"
        );
      }).join("");
      hydrateAvatars(podium, top);
      scheduleFitPodiumNames(themeRoot);
    }
    const table = themeRoot.querySelector(".lb-table");
    if (table) table.hidden = rest.length === 0;
    if (list) renderList(list, rest, settings, "table");
  }

  function winCardHtml(leader, settings) {
    const border = settings.avatarBorder !== false ? " bordered" : "";
    return (
      '<div class="lb-win-card rank-' + leader.rank + " metal-" + metalOf(leader.rank) + '" data-rank="' + leader.rank + '">' +
        wreathHtml(leader.rank) +
        '<div class="lb-avatar' + border + '" data-lb-avatar="' + leader.rank + '"></div>' +
        '<div class="lb-info"><div class="lb-name">' + esc(leader.name) + "</div>" + scoreHtml(leader, false) + "</div>" +
      "</div>"
    );
  }

  function fillWinnerCards(themeRoot, capture, settings) {
    const leaders = capture.leaders || [];
    const top = leaders.slice(0, 3);
    const rest = leaders.slice(3);
    const winners = themeRoot.querySelector(".lb-winners");
    const restEl = themeRoot.querySelector(".lb-rest");
    const order = [1, 0, 2];
    if (winners) {
      winners.innerHTML = order.map((idx) => {
        const l = top[idx];
        return l ? winCardHtml(l, settings) : "";
      }).join("");
      hydrateAvatars(winners, top);
    }
    if (restEl) {
      restEl.hidden = rest.length === 0;
      restEl.classList.toggle("is-wide", rest.length >= 6);
      renderList(restEl, rest, settings, "wreath");
    }
  }

  function fillHero(themeRoot, capture, settings) {
    const leaders = capture.leaders || [];
    const hero = leaders[0];
    const heroEl = themeRoot.querySelector(".lb-hero");
    const side = themeRoot.querySelector(".lb-side");
    const border = settings.avatarBorder !== false ? " bordered" : "";
    if (hero && heroEl) {
      heroEl.innerHTML =
        wreathHtml(hero.rank) +
        '<div class="lb-avatar-ring"><div class="lb-avatar' + border + '" data-lb-avatar="' + hero.rank + '"></div></div>' +
        markImg("lb-trophy", "lb-trophy") +
        '<div class="lb-name">' + esc(hero.name) + "</div>" +
        scoreHtml(hero, false);
      mountAvatar(heroEl.querySelector("[data-lb-avatar]"), hero);
      preferPng(heroEl);
    } else if (heroEl) heroEl.innerHTML = "";
    if (side) renderList(side, leaders.slice(1), settings, "pill");
  }

  const themes = {
    podium: {
      mount(r, s) {
        return mountShell(r, s, '<div class="dyn-stage"><div class="lb-header">LEADERS</div><div class="lb-body"><div class="lb-podium"></div><div class="lb-table lb-glass"><div class="lb-thead"><span>Place</span><span>User</span><span>Score</span></div><div class="lb-list"></div></div></div></div>');
      },
      applySettings(r, st, s) { applyVars(r, s); },
      async show(r, cap, st, s) { fillPodium(r, cap, s); await commonShow(r, cap, s); },
      refresh(r, cap, st, s) {
        refreshTheme(r, cap, s, fillPodium);
        r.querySelectorAll(".lb-podium-slot, .lb-row").forEach((el) => el.classList.add("is-in"));
      },
      hide(r, st, s) { return hideTheme(r, s); },
      unmount() {},
    },
    "stacked-cards": {
      mount(r, s) {
        return mountShell(r, s, '<div class="dyn-stage"><div class="lb-header">LEADERS</div><div class="lb-body"><div class="lb-winners"></div><div class="lb-rest lb-glass"></div></div></div>');
      },
      applySettings(r, st, s) { applyVars(r, s); },
      async show(r, cap, st, s) { fillWinnerCards(r, cap, s); await commonShow(r, cap, s); },
      refresh(r, cap, st, s) {
        refreshTheme(r, cap, s, fillWinnerCards);
        r.querySelectorAll(".lb-win-card, .lb-row").forEach((el) => el.classList.add("is-in"));
      },
      hide(r, st, s) { return hideTheme(r, s); },
      unmount() {},
    },
    "compact-ladder": {
      mount(r, s) { return mountShell(r, s, '<div class="dyn-stage"><div class="lb-header">LEADERS</div><div class="lb-body"><div class="lb-list"></div></div></div>'); },
      applySettings(r, st, s) { applyVars(r, s); },
      async show(r, cap, st, s) { renderList(r.querySelector(".lb-list"), cap.leaders, s, "wreath"); await commonShow(r, cap, s); },
      refresh(r, cap, st, s) {
        refreshTheme(r, cap, s, (root, capture, settings) => {
          renderList(root.querySelector(".lb-list"), capture.leaders, settings, "wreath");
        });
        r.querySelectorAll(".lb-row").forEach((el) => el.classList.add("is-in"));
      },
      hide(r, st, s) { return hideTheme(r, s); },
      unmount() {},
    },
    "hero-list": {
      mount(r, s) { return mountShell(r, s, '<div class="dyn-stage"><div class="lb-header">LEADERS</div><div class="lb-body"><div class="lb-hero lb-glass"></div><div class="lb-side"></div></div></div>'); },
      applySettings(r, st, s) { applyVars(r, s); },
      async show(r, cap, st, s) { fillHero(r, cap, s); await commonShow(r, cap, s); },
      refresh(r, cap, st, s) {
        refreshTheme(r, cap, s, fillHero);
        r.querySelectorAll(".lb-hero, .lb-row").forEach((el) => el.classList.add("is-in"));
      },
      hide(r, st, s) { return hideTheme(r, s); },
      unmount() {},
    },
    "ticker-strip": {
      mount(r, s) { return mountShell(r, s, '<div class="dyn-stage"><div class="lb-header">LEADERS</div><div class="lb-body"><div class="lb-list"></div></div></div>'); },
      applySettings(r, st, s) { applyVars(r, s); },
      async show(r, cap, st, s) { renderList(r.querySelector(".lb-list"), cap.leaders, s, "pill"); await commonShow(r, cap, s); },
      refresh(r, cap, st, s) {
        refreshTheme(r, cap, s, (root, capture, settings) => {
          renderList(root.querySelector(".lb-list"), capture.leaders, settings, "pill");
        });
        r.querySelectorAll(".lb-row").forEach((el) => el.classList.add("is-in"));
      },
      hide(r, st, s) { return hideTheme(r, s); },
      unmount() {},
    },
  };

  ["podium", "stacked-cards", "compact-ladder", "hero-list", "ticker-strip"].forEach((id) => {
    themes[id + "-idle-v1"] = themes[id];
    themes[id + "-idle-v2"] = themes[id];
  });

  root.BGLeaderboardThemes = { STYLE: RAW_STYLE, themes, applyVars, layoutStage };
})(typeof globalThis !== "undefined" ? globalThis : window);
