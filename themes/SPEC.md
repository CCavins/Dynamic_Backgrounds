# Dynamic Backgrounds theme pack spec

You are writing a Dynamic Backgrounds theme pack. Follow this spec exactly. Output valid JSON and, if needed, a classic-script engine that calls `BGThemeEngines.define`. Do not invent fields.

This file is the contract. The parser and runtime reject anything that does not match it.

## What to produce

Two kinds of theme:

| Kind | Overlay | What it shows |
| --- | --- | --- |
| `message` | `#dyn-message-theme` | One live capture: photo, caption, name |
| `mosaic` | `#dyn-mosaic-theme` | Many live photos that swap over time |

Two ways to implement:

| Approach | Files | Use when |
| --- | --- | --- |
| JSON only | `my-theme.json` | Layout, typography, colors, CSS motion. Mosaic layouts `grid`, `row`, `scatter`, `ribbon` |
| JSON + engine | `my-theme.json` + `my-theme-engine.js` | Canvas, WebGL, custom tick/dealing, physics, or any JS beyond CSS |

JSON cannot run `<script>`, `javascript:` URLs, or inline handlers. Those are rejected. The JS engine is the only way to run code.

Decision tree:

1. If the look can be HTML + CSS (plus the built-in photo/text hooks), ship JSON only.
2. If you need a draw loop, WebGL, dealing, or custom mosaic motion, add an engine.
3. Do **not** set `"engine": "led-scoreboard"` (or another built-in id) unless you intentionally want that exact built-in runtime. A new design needs a **new** engine id.

## Deliverable files

- `my-theme.json` — required. Must parse as the schema below.
- `my-theme-engine.js` — required only when the pack uses a new engine. Classic script. Calls `BGThemeEngines.define({...})`.
- Import in the extension popup: select the JSON, or the JSON **and** the JS together. One JSON, at most one JS.
- `"engine"` in the JSON must match `id` in `BGThemeEngines.define`.
- `"engineFile"` is an optional human hint (`message-aurora-engine.js`). It is never fetched.

**Suggested naming (optional, not enforced):** prefix the pack with its kind, and append `-engine` on the JS file / engine id.

| Role | Pattern | Example |
| --- | --- | --- |
| Message JSON | `message-<name>.json` | `message-aurora.json` (`id`: `message-aurora`) |
| Message engine | `message-<name>-engine.js` | `message-aurora-engine.js` (`engine`: `message-aurora-engine`) |
| Mosaic JSON | `mosaic-<name>.json` | `mosaic-orbit-swap.json` |
| Mosaic engine | `mosaic-<name>-engine.js` | `mosaic-orbit-swap-engine.js` |
| JSON only | same kind prefix, no `-engine` file | `message-stamp.json`, `mosaic-ribbon.json` |

Any valid `id` / `engine` that passes the regex and reserved-id checks is fine — this pattern is only for keeping packs easy to spot.

Clone these examples:

| Goal | JSON | Engine |
| --- | --- | --- |
| JSON-only message (colors + motion) | `message-stamp.json` | none |
| JSON-only mosaic (size + frame color) | `mosaic-framed.json` | none |
| JSON-only mosaic (layout only) | `mosaic-ribbon.json` | none |
| Message + JS engine | `message-aurora.json` | `message-aurora-engine.js` (same file as `../extension/engines/message-aurora-engine.js`) |
| Mosaic + JS engine | `mosaic-orbit-swap.json` | `mosaic-orbit-swap-engine.js` (same file as `../extension/engines/mosaic-orbit-swap-engine.js`) |
| Message with all four settings | `tmpl-liquid-glass.json` | none (or wrap `"engine": "liquid-glass"`) |

Full HTML/CSS ports of built-ins (no JS): `tmpl-*.json`.

## JSON schema

Every field the parser keeps. Extra fields are ignored. Do not invent settings keys.

```json
{
  "format": "dynamic-backgrounds-theme",
  "version": 1,
  "kind": "message",
  "id": "my-theme",
  "label": "My Theme",
  "engine": "",
  "engineFile": "",
  "css": "",
  "html": "",
  "fonts": "",
  "settings": {},
  "revealMs": 1000,
  "hideMs": 320,
  "fit": [],
  "layout": "grid",
  "cols": 4,
  "rows": 3,
  "count": 8,
  "interval": 2800
}
```

| Field | Required | Type | Rules |
| --- | --- | --- | --- |
| `format` | yes | string | Must be `dynamic-backgrounds-theme` |
| `version` | yes | number | Must be `1` |
| `kind` | yes | string | `message` or `mosaic` |
| `id` | yes | string | `/^[a-z][a-z0-9-]{1,40}$/`. Cannot be reserved |
| `label` | yes | string | Popup name, max 80 characters |
| `engine` | no | string | Built-in theme id **or** a new engine id. Same id regex. Cannot reuse a reserved id unless it is a built-in of the same `kind` (wrap path) |
| `engineFile` | no | string | Basename ending in `.js`, max 80 chars. Hint only |
| `css` | no | string | Max 100 KB. Scoped selectors required |
| `html` | message unless `engine` | string | Max 50 KB. Message themes need `html` or `engine` |
| `fonts` | no | string | Must start with `https://fonts.googleapis.com/`. Anything else is dropped |
| `settings` | no | object | Keys only: `primary`, `secondary`, `background`, `motion`, `scale` |
| `revealMs` | no | number | Message enter. Clamped 200–4000. Default 1000 |
| `hideMs` | no | number | Message leave. Clamped 120–2000. Default 320 |
| `fit` | no | array | Message text fit rules. See below |
| `layout` | mosaic unless `engine` | string | `grid`, `row`, `scatter`, or `ribbon`. Default `grid` |
| `cols` | mosaic grid | number | 1–8. Default 4 |
| `rows` | mosaic grid | number | 1–6. Default 3 |
| `count` | mosaic | number | 3–24. Default 8. Used by row / scatter / ribbon |
| `interval` | mosaic | number | 800–12000 ms. `0` / omitted means the engine default |

### settings

Each present key is `{ "label": "…", "default": "…" }`. `label` max 40 characters. Do not invent keys beyond this list.

| Key | Kind | `default` | Popup control | Runtime |
| --- | --- | --- | --- | --- |
| `primary` | both | `#rrggbb` | color | `--primary` |
| `secondary` | both | `#rrggbb` | color | `--secondary` |
| `background` | both | `#rrggbb` | color | `--background` |
| `motion` | message only | `slow` / `drift` / `fizz` | select | `data-motion` on the theme root |
| `scale` | mosaic | number `0.7`–`1.5` | slider 70%–150% | `--scale` (`1` = the default look) |

Invalid colors fall back to `#d52265` / `#fec651`. Mosaic packs that set `motion` are ignored. Wrapping a built-in (`"engine": "polaroid"`) inherits that engine’s sliders; pack `settings` override labels and defaults only.

#### Message settings

The runtime writes `--primary`, `--secondary`, `--background`, `--reveal-ms`, and `data-motion` on `#dyn-message-theme`. `BGMessageThemes.applyVars(themeRoot, settings)` does this. JSON-only packs get it from `applySettings` after mount and whenever the popup colors change. Engines should call `applyVars` from `applySettings` (and may also read `settings` in `show`).

Color change does not remount — only `applySettings` runs. Motion modes that rebuild a canvas (Liquid Glass) may remount from the preview dock; on output, `applySettings` is enough if the engine honors `data-motion` live.

JSON-only example — Ink / Paper / Background / Motion, clone `message-stamp.json`:

```json
"settings": {
  "primary": { "label": "Ink", "default": "#d52265" },
  "secondary": { "label": "Paper", "default": "#f4ead8" },
  "background": { "label": "Background", "default": "#1b1b1b" },
  "motion": { "label": "Motion", "default": "drift" }
}
```

```css
#dyn-message-theme[data-theme="message-stamp"] {
  background: var(--background, #1b1b1b);
  --ink: var(--primary);
  --paper: var(--secondary);
}
#dyn-message-theme[data-theme="message-stamp"][data-motion="slow"].on .stamp {
  animation-duration: 1.2s;
}
#dyn-message-theme[data-theme="message-stamp"][data-motion="fizz"].on .stamp {
  animation-name: stamp-fizz;
}
```

Engine `settings` object: `{ primary, secondary, background?, motion?, revealMs }`. See `message-aurora.json` + engine, and `tmpl-liquid-glass.json` for all four keys.

#### Mosaic settings

`scale` is `1` at the built-in default size. The runtime sets `--scale` on `#dyn-mosaic-theme`. JSON-only host layouts (`grid`, `row`, `scatter`, `ribbon`) multiply card width by `--scale`. Bigger photos take more space. Grid keeps `cols`×`rows` and grows cards inside cells.

Colors are the same hex keys as messages. Use `label` for the popup name (Frame, Edge, Ribbon).

JSON-only example — clone `mosaic-framed.json`:

```json
"settings": {
  "scale": { "label": "Photo size", "default": 1 },
  "primary": { "label": "Frame", "default": "#ffffff" }
}
```

```css
#dyn-mosaic-theme[data-theme="mosaic-framed"] .dyn-card {
  background: var(--primary, #fff);
  width: calc(18% * var(--scale, 1));
}
```

Engine signatures: `mount(root, pool, api, settings)` and optional `applySettings(root, state, settings)`. Scale changes remount (Polaroid grid, flip wall cols/rows, live mosaic camera, cube count). Color can update live in `applySettings` (Polaroid frame, flip-wall edge, cube color, pedestal metal). Wrapping `"engine": "polaroid"` shows Polaroid’s photo-size slider plus any `primary` you declare as Frame. Wrapping `"engine": "pedestals"` shows Pedestal color.

### fit

Array of `{ "box", "text", "max", "min" }`. Selectors are queried inside the theme root. `max` / `min` are design-space px. Default max 160, min 18. Entries without `box` and `text` are dropped.

## Reserved ids

Do not use these as a new pack `id` or a new engine `id`:

`off`, `led-scoreboard`, `neon-nightclub`, `ultras-tifo`, `holo-card`, `broadcast-tv`, `liquid-glass`, `parallax-drift`, `decks`, `decks-brand`, `spotlight`, `coverflow`, `fan`, `filmstrip`, `scatter`, `cascade`, `orbit`, `billboard`, `reels`, `polaroid`, `polaroid-brand`, `flipwall`, `flipwall-brand`, `livewall`, `livewall-brand`, `cubes`, `cubes-brand`, `depthfield`, `pedestals`

Wrapping a built-in: set `"engine"` to one of those built-in ids (matching `kind`) and give the pack a **new** `id`. That reuses the built-in JS as-is. You cannot redesign that JS from JSON. Brand-aware wrap ids end in `-brand` (popup label with `*`).

## Reject list

The import is refused if CSS or HTML contains any of:

- `<script`
- `javascript:`
- `data:text/html`
- inline handlers matching `on*=` (for example `onclick=`)

Engine JS is refused if it:

- uses `import` or `export` (ESM)
- does not call `BGThemeEngines.define(`
- omits `id` / `kind` in that define object
- uses a reserved id
- exceeds ~200 KB
- does not register `mount`

Engines are never fetched from the network. Do not put a URL in `engine` or `engineFile`.

Hard limits: 24 imported packs. Re-importing the same `id` replaces the previous pack. Engine JS is stored per engine id; removing the last pack that uses it removes the stored engine.

## CSS contract

Scope every rule:

- Message: `#dyn-message-theme[data-theme="your-id"]`
- Mosaic: `#dyn-mosaic-theme[data-theme="your-id"]`

The popup **Stage → Aspect** setting resizes Vixi’s output canvas to a chosen ratio (`16:9`, `9:16`, `4:3`, `1:1`, `21:9`, or any `W:H`). The canvas contain-fits the window — it grows until it touches a pair of edges, then letterboxes the other axis. `auto` follows the window. Message themes still draw in a `.dyn-fit-stage` at a 1920-long-edge design size and `scale()` it to fill that canvas. Prefer `cqh` / `cqw`. The root gets `dyn-portrait` when height > width, and `data-aspect` (`16-9`, `9-16`, `4-3`, …).

Vixi’s background, QR, and logo are hidden while a theme is on. Mosaic and message each have their own **Show background** / **Show QR code** / **Show logo** toggles. Mosaic chrome never clones onto a message theme, and the reverse. The background fills the same contain-fitted canvas as the live kind (`object-fit: cover`). QR and logo return only if that kind’s theme has a slot (or the default corner chrome). Mosaic cards stay **2:3**; portrait restacks placement, it does not flip the crop to 3:2.

Root classes the runtime toggles:

- `on` — message is showing (play enter animations)
- `off` — message is hiding (play leave animations)
- `no-photo` — capture has no image
- `no-copy` — no message and no name
- `no-name` — no name
- `dyn-portrait` — stage is taller than wide (auto on a tall window, or any portrait ratio)
- `data-aspect` — `16-9`, `9-16`, or the forced ratio (`4-3`, `1-1`, `21-9`, …)
- `dyn-show-bg` / `dyn-show-qr` / `dyn-show-logo` — that kind’s popup toggles are on
- `html.dyn-kind-message` / `html.dyn-kind-mosaic` — which output kind is live
- `html.dyn-show-bg` — the live kind’s event background is visible and fitted to the stage; that kind’s theme backdrops go transparent so the asset shows through

Add portrait overrides under `#dyn-message-theme.dyn-portrait[data-theme="your-id"]` (or the mosaic equivalent). Photo-above-copy and banner-above-photo both work; pick the one that fits the theme.

Variables set from settings: `--primary`, `--secondary`, `--background`, `--reveal-ms`, `--scale`. Message themes also get `data-motion`.

## Message HTML hooks

Put these on elements the JSON-only compiler (or your engine) should fill:

- `data-photo` on the image (or the first `img` is also collected)
- `data-message` on the caption node
- `data-name` on the name node (can appear more than once)
- `data-qr` on the box that should receive this kind’s Vixi QR when **Show QR code** is on
- `data-logo` on the box that should receive this kind’s Vixi logo when **Show logo** is on

If you omit `data-qr` / `data-logo`, the runtime uses a default corner chrome (logo top-left, QR bottom-right). Style those slots for size and placement. Leave them out of the layout only if the theme should never show brand marks.

### Conditional chrome layouts (recommended)

The theme root gets toggle classes you can target in CSS:

| Class on `#dyn-*-theme` | Meaning |
|---|---|
| `dyn-show-qr` | Show QR is on for this kind |
| `dyn-show-logo` | Show logo is on for this kind |
| `dyn-show-bg` | Show background is on for this kind |

Use them to move content and place chrome differently for each combination:

```css
/* Default slots — exact placement is yours */
#dyn-message-theme[data-theme="my-theme"] [data-logo] {
  position: absolute; top: 4%; left: 4%; width: 12%;
}
#dyn-message-theme[data-theme="my-theme"] [data-qr] {
  position: absolute; right: 4%; bottom: 4%; width: 12%;
}

/* Neither chrome: full-bleed content */
#dyn-message-theme[data-theme="my-theme"]:not(.dyn-show-qr):not(.dyn-show-logo) .content {
  inset: 0;
}

/* Logo only */
#dyn-message-theme[data-theme="my-theme"].dyn-show-logo:not(.dyn-show-qr) .content {
  top: 12%;
}

/* QR only */
#dyn-message-theme[data-theme="my-theme"].dyn-show-qr:not(.dyn-show-logo) .content {
  right: 18%;
}

/* Both */
#dyn-message-theme[data-theme="my-theme"].dyn-show-qr.dyn-show-logo .content {
  right: 18%;
  top: 10%;
}
```

Same pattern works for mosaic themes (`#dyn-mosaic-theme`). Built-in themes marked with `*` use this idea: they reflow or reserve a rail when chrome is on, and use the full stage when it is off.

**Avoid hard mid-stage crops.** Prefer laying content out so cards/slots never need to sit under the QR/logo, and let edges bleed a little if needed. Do not rely on `overflow: hidden` on a half-width frame — that draws a straight cut through photos.

For JSON-only message themes, `html` is required and is written into `.dyn-fit-stage`.

## Engine JS file shape (locked)

Classic script. No `"use strict"` module, no `import`/`export`. The file **must** call:

```js
BGThemeEngines.define({
  id: "my-theme",
  kind: "message",
  mount(themeRoot, settings) { /* return state */ },
  applySettings(themeRoot, state, settings) {},
  async show(themeRoot, capture, state, settings) {},
  hide(themeRoot, state) { /* return Promise */ },
  unmount(themeRoot, state) {}
});
```

The same file works:

- shipped as `extension/engines/my-theme-engine.js` (listed in `extension/engines.json`, then `node scripts/sync-engine-manifest.cjs`)
- sideloaded: stored in Chrome storage. Output pages use a bundled file if the engine id is already in the extension (`engines/*.js`). `new Function` is only used on pages that allow it (local preview). Chrome’s extension CSP blocks eval in the popup and in content scripts.

`id` and `kind` must be string literals in the define object so the importer can peek them.

### Message engine signatures

```
mount(themeRoot, settings) → state
applySettings(themeRoot, state, settings)
show(themeRoot, capture, state, settings) → void | Promise
hide(themeRoot, state) → void | Promise
unmount(themeRoot, state)
```

- `themeRoot` is `#dyn-message-theme`
- `capture` is `{ src, message, name }` — `src` is a photo URL or empty
- `settings` is `{ primary, secondary, background?, motion?, revealMs }`
- `state` is whatever `mount` returned. Keep timers and rAF ids on it
- `hide` must resolve after the leave animation
- `unmount` must cancel rAF, timers, and WebGL

### Mosaic engine signatures

```
interval: number
mount(root, pool, api, settings) → state
tick(root, pool, state, api)
applySettings(root, state, settings)
unmount(root, state)
```

- `root` is `#dyn-mosaic-theme`
- `settings` is `{ scale?, primary?, secondary?, background? }`. `scale` is `0.7`–`1.5`, default `1`
- `applySettings` is optional. Use it for live color (and CSS `--scale` on JSON-only layouts). Scale that changes card count should remount
- `pool` is the current live mosaic list for this tick. Photos that left the mosaic are omitted. An empty pool means show no photos. Do not snapshot `pool` from `mount` and reuse it forever — read the `pool` argument on each `tick`, or call `api.nextUrl()`
- Treat feed add/remove as a **pool** update. Do not mass-swap every on-screen card when membership changes; use your theme’s enter/exit motion (or `api.nextUrl()`) so the wall stays stable between intentional transitions
- The host may fade leftover `.dyn-card` photos that are leaving for host-managed layouts. Self-animated themes (Polaroid, flip wall, cubes, …) typically own replacement themselves. Cards stay hidden until their photo has decoded.
- After a CTA / stream / live / video / URL beat, the host remounts mosaic (`mount` again) so enter motion plays immediately. Do not assume `state` from before the native item is still mounted.
- `api` is `{ nextUrl(avoid), isRetiring(src), hasIncoming() }`
  - `nextUrl(avoid)` prefers unseen incoming photos, then the live pool, skipping photos that are cycling out. Avoid `avoid` (string or iterable of URLs)
  - `isRetiring(src)` is true while a photo is leaving the mosaic
- Cards: `BGMosaicThemes.makeCard(src, className?)` → `div.dyn-card > img`
- `interval` is milliseconds between `tick` calls. JSON `interval` overrides when set
- Read `dyn-show-qr` / `dyn-show-logo` on the theme root (or `themeRoot.classList`) if your layout should reflow for chrome

### Helpers (use these, do not reimplement)

On `BGMessageThemes`:

| Helper | Role |
| --- | --- |
| `ensureFitStage(themeRoot)` | Creates/returns `.dyn-fit-stage` (1920×1080 or 1080×1920) |
| `applyVars(themeRoot, settings)` | Sets `--primary`, `--secondary`, `--background`, `--reveal-ms`, `data-motion` |
| `commonShowPrep(themeRoot, state, extraClasses?)` | Clears `on`/`off`/`idle` and idle timers |
| `fitText(boxEl, textEl, maxPx, minPx)` | Shrinks font until text fits |
| `finishShow(themeRoot, images?)` | Waits for image decode, then adds `on` |
| `hideTheme(themeRoot, state, waitMs, extraClasses?)` | Adds `off`, waits, clears classes |
| `whenDecoded(img)` | Resolves when an image is ready |

On `BGMosaicThemes`: `makeCard(src, className?)`.

Look helpers up at call time: `globalThis.BGMessageThemes`. Do not close over them at define time if you can avoid it.

## Lifecycle

Message:

1. `mount` once when the theme is selected
2. `applySettings` when colors change
3. `show` for each new capture
4. `hide` when the capture ends (must return a promise)
5. `unmount` when the theme is turned off or replaced

Mosaic:

1. `mount` once with the current photo pool and settings
2. `applySettings` when colors change (scale typically remounts)
3. `tick` on `interval`
4. `unmount` when the theme is turned off or replaced

Stay inside the theme root. Do not inject `<script>` into the page. Do not fetch engine code.

## Built-in wrap vs new engine

- `"engine": "liquid-glass"` (etc.) reuses that built-in’s JS. Your CSS may not restyle its internals unless you also target `[data-engine="liquid-glass"]`. You are not rewriting the WebGL.
- `"engine": "my-aurora"` plus `my-aurora.js` is a new runtime, on par with a built-in.

## Must / must not

Must:

- Use the exact `format` / `version` / `kind`
- Scope CSS to the theme root selector
- Clean up rAF, timers, and GL in `unmount` / `hide`
- Use `#rrggbb` for color defaults
- Give new packs and new engines unused ids

Must not:

- Use camelCase or underscored ids
- Put `<script>` or handlers in JSON
- Use ESM in the engine
- Fetch remote engines
- Reuse reserved ids for a new design
- Invent settings keys other than `primary` / `secondary` / `background` / `motion` / `scale`
- Assume only landscape — handle `dyn-portrait`

## Copy-paste prompt

```
You are writing a Dynamic Backgrounds theme pack. Read themes/SPEC.md and clone the closest example. Follow the spec exactly. Output valid JSON and, if the brief needs JS, a classic-script engine that calls BGThemeEngines.define. Do not invent fields. Do not use reserved ids. Scope all CSS. If you add an engine, id in define() must match JSON "engine".
```

Then describe the look, kind (message or mosaic), and whether it needs canvas/WebGL.

## AI mistake list

- Wrong `format` or `version` (not `dynamic-backgrounds-theme` / `1`)
- camelCase ids (`MyTheme`) — must be `my-theme`
- Reserved ids (`polaroid`, `decks`, `orbit`, …)
- Unscoped CSS (rules that leak onto the host page)
- px-only layout that does not scale with `.dyn-fit-stage`
- Settings keys other than `primary` / `secondary` / `background` / `motion` / `scale`
- Colors that are not `#rrggbb`
- `<script>` or `onclick=` in JSON
- ESM `import`/`export` in the engine
- Forgetting `.on` / `.off` enter/leave
- Leaking `requestAnimationFrame` after hide/unmount
- Using `"engine": "led-scoreboard"` when the brief is a new design
- Mosaic engine that creates `img` nodes instead of `BGMosaicThemes.makeCard`
- Fetching the engine from a URL
