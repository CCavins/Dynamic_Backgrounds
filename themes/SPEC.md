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
| JSON + engine | `my-theme.json` + `my-theme.js` | Canvas, WebGL, custom tick/dealing, physics, or any JS beyond CSS |

JSON cannot run `<script>`, `javascript:` URLs, or inline handlers. Those are rejected. The JS engine is the only way to run code.

Decision tree:

1. If the look can be HTML + CSS (plus the built-in photo/text hooks), ship JSON only.
2. If you need a draw loop, WebGL, dealing, or custom mosaic motion, add an engine.
3. Do **not** set `"engine": "led-scoreboard"` (or another built-in id) unless you intentionally want that exact built-in runtime. A new design needs a **new** engine id.

## Deliverable files

- `my-theme.json` — required. Must parse as the schema below.
- `my-theme.js` — required only when the pack uses a new engine. Classic script. Calls `BGThemeEngines.define({...})`.
- Import in the extension popup: select the JSON, or the JSON **and** the JS together. One JSON, at most one JS.
- `"engine"` in the JSON must match `id` in `BGThemeEngines.define`.
- `"engineFile"` is an optional human hint (`example-aurora.js`). It is never fetched.

Clone these examples:

| Goal | JSON | Engine |
| --- | --- | --- |
| JSON-only message | `example-stamp.json` | none |
| JSON-only mosaic | `example-ribbon.json` | none |
| Message + JS engine | `example-engine.json` | `example-aurora.js` (same file as `../extension/engines/example-aurora.js`) |
| Mosaic + JS engine | `example-mosaic-engine.json` | `example-orbit-swap.js` (same file as `../extension/engines/example-orbit-swap.js`) |

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
| `settings` | no | object | Keys only: `primary`, `secondary`, `background`, `motion` |
| `revealMs` | no | number | Message enter. Clamped 200–4000. Default 1000 |
| `hideMs` | no | number | Message leave. Clamped 120–2000. Default 320 |
| `fit` | no | array | Message text fit rules. See below |
| `layout` | mosaic unless `engine` | string | `grid`, `row`, `scatter`, or `ribbon`. Default `grid` |
| `cols` | mosaic grid | number | 1–8. Default 4 |
| `rows` | mosaic grid | number | 1–6. Default 3 |
| `count` | mosaic | number | 3–24. Default 8. Used by row / scatter / ribbon |
| `interval` | mosaic | number | 800–12000 ms. `0` / omitted means the engine default |

### settings

Each present key is `{ "label": "…", "default": "…" }`.

- `primary`, `secondary`, `background`: `default` must be `#rrggbb`. Invalid colors fall back to `#d52265` / `#fec651`.
- `motion`: string (built-in liquid-glass uses `slow`, `drift`, `fizz`). Not a color.
- `label` max 40 characters.
- These become CSS variables `--primary`, `--secondary`, `--background` and `data-motion` on the theme root.

### fit

Array of `{ "box", "text", "max", "min" }`. Selectors are queried inside the theme root. `max` / `min` are design-space px. Default max 160, min 18. Entries without `box` and `text` are dropped.

## Reserved ids

Do not use these as a new pack `id` or a new engine `id`:

`off`, `led-scoreboard`, `neon-nightclub`, `ultras-tifo`, `holo-card`, `broadcast-tv`, `liquid-glass`, `parallax-drift`, `decks`, `spotlight`, `coverflow`, `fan`, `filmstrip`, `scatter`, `cascade`, `orbit`, `billboard`, `reels`, `polaroid`, `flipwall`, `livewall`, `cubes`, `pedestals`

Wrapping a built-in: set `"engine"` to one of those built-in ids (matching `kind`) and give the pack a **new** `id`. That reuses the built-in JS as-is. You cannot redesign that JS from JSON.

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

The message overlay mounts a `.dyn-fit-stage` at **1920×1080** or **1080×1920** (portrait when the overlay is taller than wide) and `scale()`s it to the window. Prefer `cqh` / `cqw` so chrome tracks the stage. The root gets `dyn-portrait` in portrait.

Root classes the runtime toggles:

- `on` — message is showing (play enter animations)
- `off` — message is hiding (play leave animations)
- `no-photo` — capture has no image
- `no-copy` — no message and no name
- `no-name` — no name
- `dyn-portrait` — portrait stage

Variables set from settings: `--primary`, `--secondary`, `--background`, `--reveal-ms`.

## Message HTML hooks

Put these on elements the JSON-only compiler (or your engine) should fill:

- `data-photo` on the image (or the first `img` is also collected)
- `data-message` on the caption node
- `data-name` on the name node (can appear more than once)

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

- shipped as `extension/engines/my-theme.js` (listed in `extension/engines.json`, then `node scripts/sync-engine-manifest.cjs`)
- sideloaded: popup compiles it with `new Function("BGThemeEngines", source)` in the isolated content-script world

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
mount(root, pool, api) → state
tick(root, pool, state, api)
unmount(root, state)
```

- `root` is `#dyn-mosaic-theme`
- `pool` is an array of photo URLs
- `api` is `{ nextUrl(avoid), isRetiring(src), hasIncoming() }`
  - `nextUrl(avoid)` prefers unseen incoming photos, then the pool, avoiding `avoid` (string or iterable of URLs)
- Cards: `BGMosaicThemes.makeCard(src, className?)` → `div.dyn-card > img`
- `interval` is milliseconds between `tick` calls. JSON `interval` overrides when set

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

1. `mount` once with the current photo pool
2. `tick` on `interval`
3. `unmount` when the theme is turned off or replaced

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
- Invent settings keys
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
- Settings keys other than `primary` / `secondary` / `background` / `motion`
- Colors that are not `#rrggbb`
- `<script>` or `onclick=` in JSON
- ESM `import`/`export` in the engine
- Forgetting `.on` / `.off` enter/leave
- Leaking `requestAnimationFrame` after hide/unmount
- Using `"engine": "led-scoreboard"` when the brief is a new design
- Mosaic engine that creates `img` nodes instead of `BGMosaicThemes.makeCard`
- Fetching the engine from a URL
