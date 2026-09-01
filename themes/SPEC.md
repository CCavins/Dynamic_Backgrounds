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
- Optional font file(s) — `.woff2` / `.woff` / `.ttf` / `.otf` when the pack uses `fontFile` / `fontFaces` (see [Custom fonts](#custom-fonts)).
- Import in the extension popup (**Import packs…**): select one or many `.json` files from a themes folder, plus each pack’s `*-engine.js` if needed, plus any custom fonts those packs name. Matching is automatic (engines by `engine` / filename; fonts by each `fontFile` basename).
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
| Custom fonts | any basename; prefer `.woff2` | `BrandDisplay.woff2`, `BrandBody.woff2` (listed in `fontFaces`) |

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
  "fontFaces": [],
  "fontFile": "",
  "fontFamily": "",
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
| `fonts` | no | string or string[] | Google Fonts stylesheet URL(s) only: each must start with `https://fonts.googleapis.com/`. One URL may list several families (`family=…&family=…`). Or pass an array of URLs (max 8). Dropped if not Google Fonts. Works together with `fontFaces` |
| `fontFaces` | no | array | Custom fonts for this pack (max 12). Each item: `{ "fontFile": "Face.woff2", "fontFamily": "Face Name" }`. Preferred when you need more than one face |
| `fontFile` | no | string | Legacy single custom font basename (`.woff2`, `.woff`, `.ttf`, `.otf`). Used only when `fontFaces` is omitted. Same matching / sharing rules |
| `fontFamily` | no | string | CSS `font-family` for singular `fontFile` (max 80). Defaults from the filename stem if omitted |
| `settings` | no | object | Keys: `primary`, `secondary`, `background`, `motion`, `scale`, `frame`, `photoStyle`, plus `type: "select"` / `type: "toggle"` extras |
| `revealMs` | no | number | Message enter. Clamped 200–4000. Default 1000 |
| `hideMs` | no | number | Message leave. Clamped 120–2000. Default 320 |
| `fit` | no | array | Message text fit rules. See below |
| `layout` | mosaic unless `engine` | string | `grid`, `row`, `scatter`, or `ribbon`. Default `grid` |
| `cols` | mosaic grid | number | 1–8. Default 4 |
| `rows` | mosaic grid | number | 1–6. Default 3 |
| `count` | mosaic | number | 3–24. Default 8. Used by row / scatter / ribbon |
| `interval` | mosaic | number | 800–12000 ms. `0` / omitted means the engine default |

### Custom fonts

Use **Google Fonts** and/or **imported files**. Both can appear on the same pack. Custom files are **copied into extension storage** at import time (not live-linked to a folder on disk).

**Google Fonts** — one URL with several families, or an array of URLs:

```json
"fonts": "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@600&display=swap"
```

```json
"fonts": [
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&display=swap"
]
```

**Custom files** — prefer `fontFaces` for multiple faces:

```json
{
  "format": "dynamic-backgrounds-theme",
  "version": 1,
  "kind": "message",
  "id": "my-theme",
  "label": "My Theme",
  "fonts": "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
  "fontFaces": [
    { "fontFile": "BrandDisplay.woff2", "fontFamily": "Brand Display" },
    { "fontFile": "BrandBody.woff2", "fontFamily": "Brand Body" }
  ],
  "css": "#dyn-message-theme .title { font-family: \"Brand Display\", \"Playfair Display\", serif; }\n#dyn-message-theme .caption { font-family: \"Brand Body\", Inter, sans-serif; }",
  "html": "…"
}
```

Single-font shorthand (still supported):

```json
"fontFile": "BrandDisplay.woff2",
"fontFamily": "Brand Display"
```

**Steps**

1. Put each `.woff2` / `.woff` / `.ttf` / `.otf` beside the pack (prefer `.woff2`, about **2 MB** max each).
2. List them in `fontFaces` (or use singular `fontFile` / `fontFamily`).
3. Optionally set `fonts` to one or more Google Fonts CSS URLs.
4. In **Import packs…**, multi-select the `.json`, every named font file, and the `*-engine.js` if the pack has one.
5. The runtime injects Google `<link>`s and `@font-face` for imported files. Use the same family names in CSS (and in any engine-drawn text).

**Rules**

- Each `fontFile` is a **basename only** (no paths). Case-insensitive match against selected files.
- Several packs in one batch may share one font file → stored **once**.
- Re-importing the same theme `id`, engine id, or font file **replaces** the previous copy.
- Missing font files in the batch note a warning; the pack still imports and reuses a stored copy of that file if one exists.
- `fontFaces` wins when present; singular `fontFile` / `fontFamily` are ignored in that case (except as the first-face mirror written after import).

### settings

Each present key is `{ "label": "…", "default": "…" }`. Optional `"type": "select"` with `"options": [{ "value", "label" }, …]` or `"type": "toggle"`. `label` max 40 characters.

| Key | Kind | `default` | Popup control | Runtime |
| --- | --- | --- | --- | --- |
| `primary` | both | `#rrggbb` | color | `--primary` |
| `secondary` | both | `#rrggbb` | color | `--secondary` |
| `background` | both | `#rrggbb` | color | `--background` |
| `motion` | message only | `slow` / `drift` / `fizz` | select | `data-motion` on the theme root |
| `scale` | mosaic | number `0.7`–`1.5` | slider 70%–150% | `--scale` (`1` = the default look) |
| `frame` | mosaic | `#rrggbb` | color | `--frame` (card border / mat; see Slant Rows) |
| `photoStyle` | both | `bw` / `color` / `sepia` | select | `data-photo-style` on the theme root (+ photo `filter` in CSS or live apply) |

Invalid colors fall back to `#d52265` / `#fec651`. Mosaic packs that set `motion` are ignored. Wrapping a built-in (`"engine": "polaroid"`) inherits that engine’s sliders; pack `settings` override labels and defaults only.

#### Live settings for imported themes (pack authors)

**Imported packs use the same live-settings pipeline as bundled themes.** After **Import packs…**, the popup reads your `settings` block, stores values in Chrome storage, and the output page applies them without remounting whenever you change a control while that theme is live.

You do **not** need to ship anything extra for the standard keys below — only correct JSON + CSS (or engine `applySettings`).

| Key | Works on import? | What the runtime sets | What you must do in the pack |
| --- | --- | --- | --- |
| `primary` | yes | `--primary` on the theme root | Use `var(--primary)` (or an alias like `--ink: var(--primary)`) in CSS — not a fixed hex on elements that should recolor |
| `secondary` | yes | `--secondary` | Same — e.g. `--paper: var(--secondary)` then `background: var(--paper)` |
| `background` | yes | `--background` | Same — e.g. `background: var(--background)` on the theme root or a `.wall` layer |
| `motion` | yes (message) | `data-motion` (`slow` / `drift` / `fizz`) | Target `[data-motion="slow"]`, `[data-motion="drift"]`, `[data-motion="fizz"]` on `#dyn-message-theme` for enter timing/name. Motion affects **enter** animation; mid-card replay is best-effort (see note below) |
| `photoStyle` | yes | `data-photo-style` (`bw` / `color` / `sepia`) | Scope img `filter` rules to `[data-photo-style="bw"]` etc. on the theme root |
| `scale` | yes (mosaic) | `--scale` | Multiply card size with `calc(… * var(--scale, 1))`. Large scale changes may remount (card count layouts) |
| `frame` | yes (mosaic) | `--frame` | Card mat/border: `background: var(--frame)` or `border-color: var(--frame)` |

**JSON-only message** — declare `settings`, wire CSS to the variables above. The compiler’s `applySettings` already calls `BGMessageThemes.applyVars`. Clone `message-stamp.json` (Ink / Paper / Background / Motion) or `message-grunge-poster.json` (Ink / Paper / Photos).

**JSON-only mosaic** — declare `settings`, use `--primary`, `--secondary`, `--background`, `--scale`, `--frame`, and `[data-photo-style]` in CSS. `applyMosaicVars` runs on every popup change. Clone `mosaic-framed.json` or `mosaic-slant-rows.json`.

**Message engine** — in `applySettings`, call helpers at runtime:

```js
applySettings(themeRoot, _state, settings) {
  const helpers = globalThis.BGMessageThemes || {};
  if (helpers.applyVars) helpers.applyVars(themeRoot, settings);
  // Also update any canvas/WebGL colors you draw from settings here
}
```

**Mosaic engine** — implement `applySettings(root, state, settings)` and mirror whatever you did in `mount` for colors, `--frame`, and photo filters. Slant Rows is the reference (`mosaic-slant-rows-engine.js`).

**Checklist when creating a theme**

1. Add each control under `"settings"` with `"label"` and `"default"` (`#rrggbb` for colors; `"type": "select"` + `"options"` for Photos).
2. Scope all CSS to `#dyn-message-theme[data-theme="your-id"]` or `#dyn-mosaic-theme[data-theme="your-id"]`.
3. Never hardcode popup-driven colors on layers that should update live — use `var(--primary)` / `var(--secondary)` / `var(--background)` / `var(--frame)`.
4. For textured surfaces, put the **tint** on `background-color: var(--paper)` (or `--background`) on the element itself. Avoid heavy `::after` multiply textures on user-tinted layers — they hide live Paper/Background changes. See [Pack assets](#pack-assets-images-and-textures) and [Grunge Poster](#grunge-poster-bundled-reference-message-theme).
5. For Photos, always key off `data-photo-style` on the theme root (the runtime sets it on every change).
6. Import the pack, reload the extension, hard-refresh the output tab, then change each popup control **while the theme is on air** to verify.

**Common pitfalls**

- **Hardcoded hex in CSS** — popup changes nothing visible.
- **Only the theme root uses vars** — child layers with fixed `#d9c7a4` never update. Point `background-color` at a variable on each painted layer.
- **Photos** — if `[data-photo-style]` CSS is missing, the select does nothing visible.
- **Motion while a card is showing** — `data-motion` updates immediately, but CSS enter animations usually run once per `show`. The next capture replays with the new mode. Prefer testing motion by changing the popup, then triggering a new message.
- **Engine themes without `applySettings`** — colors freeze after mount until you call `applyVars`.
- **New setting keys** — only the keys in the table above are supported in pack JSON today. A brand-new key (e.g. `"glow": …`) needs extension work (next section).
- **Large `data:` URIs inside `css`** — a single embedded WebP/PNG (tens of KB of base64 in one rule) can exceed the **100 KB** CSS cap *and* break stylesheet parsing in Chrome, so rules after the bad block never apply. **Ship textures as separate files** under `assets/` (see [Pack assets](#pack-assets-images-and-textures)) and reference them with `url(...)` or paint from JS.
- **Multiply / opacity overlays on `::before` / `::after`** — if a user-facing color (Paper, Wall, Frame) sits *under* a textured pseudo-element, live popup changes look stuck. Either keep the tint on `background-color` with **no** opaque texture on top, or repaint the flat fill from `applySettings` / `applyVars` (bundled Grunge does this — see below).
- **Wall tint stacks** — brown washes, gradients, `mix-blend-mode`, and film grain on a `.wall` layer hide a brick photo. If the design is “show this image as the backdrop”, use the image alone (`background-image: cover`) with no color wash unless `background` is an explicit popup setting.

Examples to copy: `message-stamp.json`, `message-grunge-poster.json`, `mosaic-framed.json`, `mosaic-slant-rows.json` + engine, `message-aurora.json` + engine.

#### Pack assets (images and textures)

Pack JSON `css` is capped at **100 KB**. Do **not** embed large textures as `data:image/...;base64,...` inside `css`.

| Approach | When | Notes |
| --- | --- | --- |
| **External file** | Textures, brick, grain, SVG masks | Put files beside the pack, e.g. `themes/assets/my-texture.webp` and `extension/packs/assets/my-texture.webp` (keep both copies in sync for gallery preview + bundled extension). Reference with a relative `url("assets/…")` in CSS **only if** the URL resolves on every host (preview page). |
| **JS paint on mount / live apply** | Extension + preview must share one asset path model | Bundled **Grunge Poster** sets `.wall { background-image }` from `BGMessageThemes.applyGrungeWall()` using `chrome.runtime.getURL('packs/assets/grunge-wall.webp')` on output and `assets/grunge-wall.webp` relative to `themes/preview.html` in the gallery. Add matching files to `web_accessible_resources` when content scripts load them on Vixi pages. |
| **Small SVG / tiny PNG** | Icons, simple masks under ~2 KB | Inline `data:` URIs are fine when the whole `css` string stays well under 100 KB and you have verified parsing in DevTools. |
| **`background` color setting** | Solid stage / wall tint the user picks in the popup | **Best default for imported packs.** Declare `background` under `settings`, use `background: var(--background)` or `--wall: var(--background)` in CSS. No image file needed — works on import, preview, and live output via `applyVars`. Clone `message-stamp.json`. |
| **Public HTTPS `url(...)`** | Imported pack with a hosted texture | `background-image: url("https://…")` in pack CSS can work on output if the host page allows loading that URL. You maintain the hosted file; there is no import-time copy into storage (unlike fonts). |
| **Bundled extension asset + JS** | Large fixed backdrop (Grunge brick wall) | Ship `extension/packs/assets/…`, resolve with `chrome.runtime.getURL`, mirror under `themes/assets/` for preview, list in `web_accessible_resources`. Optional helper in `message-themes.js` if CSS `url()` cannot resolve on Vixi pages. |

After changing assets or CSS, hard-refresh the output tab and `themes/preview.html`. In DevTools, confirm the themed layer’s `background-image` is non-`none` and that `#dyn-custom-theme-style` contains your scoped rules without truncation.

**Imported packs vs bundled image backdrops**

Import **does** copy custom **font** files into extension storage (select them beside the JSON in **Import packs…**). Import **does not** yet copy arbitrary image files the same way — there is no `imageFile` field or batch import for `.webp` / `.png` today.

| Author goal | Supported on import? | What to do |
| --- | --- | --- |
| User-pickable **solid** backdrop | **Yes** | `settings.background` + `var(--background)` in CSS |
| **Small** texture (few KB) in CSS | **Yes** | Inline `data:` URI; keep total `css` under 100 KB |
| **Large** texture baked into `css` | **No** | Breaks parsing and/or exceeds cap — same failure mode Grunge hit before v1.24.24 |
| Relative `url("assets/foo.webp")` in imported CSS only | **No** on Vixi output | Injected pack CSS resolves URLs against the **page** origin, not the extension; the file is not on the event site |
| Fixed image backdrop like Grunge | **Bundled only** (today) | Ship with the extension (`packs/assets/` + JS), or use a public HTTPS URL in CSS, or a small inline texture |
| Gallery **preview** only | Relative `themes/assets/…` | Fine for `preview.html` on the site; does not automatically fix live output for imported JSON alone |

External `.webp` files are **not preview-only** — they are the correct approach for **bundled** themes on both preview and extension. For **imported** JSON-only packs, prefer the **`background` color** setting unless the texture is small enough to inline or hosted at a stable HTTPS URL.

#### Grunge Poster (bundled reference message theme)

`message-grunge-poster.json` is the reference for **layered paper + external wall texture + Photos**.

| Popup control | Maps to | Implementation |
| --- | --- | --- |
| **Ink** | Message text + name-stamp border/text | `--ink` / `--stamp-ink` from `primary` |
| **Paper** | Photo mat, message paper, name-stamp fill | `--paper` from `secondary`; live output also calls `applyGrungePresentation()` to set flat `background-color` on `.photo-mat` and `.msg-paper` (texture pseudo-elements are disabled so Paper matches photo mat) |
| **Photos** | Hero photo filter | `data-photo-style` + inline `img.style.filter` on `.photo-mat img` |

There is **no** Wall tint control — the brick backdrop is a fixed asset (`grunge-wall.webp`), not `--background`. Do not add brown washes or grain on `.wall` when cloning this look.

Extension wiring (do not duplicate in imported JSON-only packs unless you need the same workaround):

- `extension/message-themes.js` — `applyVars` → `applyGrungePresentation` → `applyGrungeWall` + flat paper fills
- `extension/packs/assets/grunge-wall.webp` — wall image (also copied to `themes/assets/` for preview)
- Harness: `themes/grunge-settings-check.html` — changes Ink / Paper / Photos while live and asserts vars + computed fills

Importing `message-grunge-poster.json` alone gives layout, Ink/Paper/Photos CSS, and live vars — **not** the bundled wall asset or `applyGrungeWall` JS. For the brick wall on output, use the extension’s bundled pack or host a texture yourself (see [Imported packs vs bundled image backdrops](#imported-packs-vs-bundled-image-backdrops)).

#### Slant Rows (bundled reference mosaic theme)

`mosaic-slant-rows.json` + `mosaic-slant-rows-engine.js` is the reference for **slanted card rows + external asphalt texture + Frame / Photos**.

| Popup control | Maps to | Implementation |
| --- | --- | --- |
| **Background** | Stage fill under texture | `--background` on root and `.sr-texture` |
| **Frame** | Card border / mat | `--frame`; live output sets `.dyn-card` background in `applySlantRowsPresentation()` |
| **Photos** | Hero filters on row images | `data-photo-style` + inline filter on `.sr-well img` |

The asphalt overlay is a fixed asset (`slant-asphalt.webp`), not a popup color — applied via `--sr-texture` from `applySlantAsphalt()` in `extension/custom-themes.js` (same dual-path asset URLs as Grunge wall).

Extension wiring:

- `extension/custom-themes.js` — `applyMosaicVars` → `applySlantRowsPresentation` → `applySlantAsphalt`
- `extension/packs/assets/slant-asphalt.webp` — texture (also in `themes/assets/` for preview and gallery homepage)
- Harness: `themes/slant-settings-check.html`

Importing JSON + engine alone does **not** copy the asphalt WebP — bundled extension or hosted URL required for the same texture on output.

#### Preview harness (`themes/preview.html`)

Use the gallery preview to iterate on packs **before** a Vixi output tab:

- Loads the same `rules.js`, `message-themes.js`, `custom-themes.js`, and pack JSON as the extension (cache-busted script query params).
- **Live settings** in the dock call `applySettings` only (same as popup on output), not a full remount — except when `photoStyle` or mosaic `scale` requires it.
- **Message cycle** uses the same visible exit → swap → enter pattern as `extension/message.js` `present()`.
- **Stage background** in the dock is like **Show background** + a uploaded still/video — it sits inside `#dyn-message-theme` above the theme backdrop and below cards. Grunge keeps `.wall` / `.dyn-stage` visible; do not strip `.wall` in preview-only CSS.
- URL params: `?theme=message-grunge-poster`, `&primary=…`, `&secondary=…`, `&aspect=16:9`, etc.

When preview and extension diverge, fix the **shared** path (`applyVars`, pack CSS, asset URLs) — not a preview-only fork.

Other harness pages: `themes/settings-check.html` (general), `themes/grunge-settings-check.html`, `themes/slant-settings-check.html`.

#### Live settings on output (extension authors)

Popup color and select changes must update the **live** theme without remounting. The pipeline is:

1. **Pack JSON** — declare the key under `settings` with a `label` and `default` (and `type` / `options` for selects).
2. **Meta registration** — `applyCustomThemeMeta` in `extension/rules.js` picks up hex colors and selects automatically when the pack loads.
3. **Normalize + resolve** — `normalizeOneThemeSettings` and `mergeResolvedThemeSettings` in `extension/rules.js` must preserve the key from stored popup values. New keys need **explicit** handling (same tier as `primary` / `secondary`), not only the generic `defaults` loop — otherwise live output can keep working colors while dropping newer keys like `frame` or `photoStyle`.
4. **Live apply** — when storage changes, content scripts call `applySettings` / `applyVars` without remounting:
   - **Message JSON** — `BGMessageThemes.applyVars` sets CSS vars, `data-motion`, and `data-photo-style`. Use `var(--…)` in pack CSS so imported themes update live without extension changes. Photo filters: `[data-photo-style]` CSS is usually enough; bundled Grunge also sets hero `img.style.filter` inline when CSS alone is too subtle.
   - **Mosaic JSON** — `BGCustomThemes.applyMosaicVars` sets `--primary`, `--secondary`, `--background`, `--scale`, `--frame`, `data-photo-style`.
   - **Mosaic engine** — `applySettings` must mirror mount-time color / photo-style logic (Slant Rows sets card background and `.sr-well img` filter in `applySettings`, not only on first mount).
5. **Harness** — add or extend `themes/*-settings-check.html` (or `themes/settings-check.html`) to change each new key while the theme is live and assert DOM / computed style.
6. **Version** — bump `extension/manifest.json` and gallery `#ext-version` fallbacks when behavior changes.

Reference implementations: **Slant Rows** (`frame`, `photoStyle`, mosaic engine) and **Grunge Poster** (Ink, Paper, Photos; external wall asset + `applyGrungePresentation` in `message-themes.js` — see [Grunge Poster](#grunge-poster-bundled-reference-message-theme)).

#### Message settings

The runtime writes `--primary`, `--secondary`, `--background`, `--reveal-ms`, `data-motion`, and `data-photo-style` on `#dyn-message-theme`. `BGMessageThemes.applyVars(themeRoot, settings)` does this. JSON-only packs get it from `applySettings` after mount and whenever the popup colors change. Engines should call `applyVars` from `applySettings` (and may also read `settings` in `show`).

**Photos (`photoStyle`)** — use a select with `bw`, `color`, and/or `sepia`. Scope CSS to the theme root:

```css
#dyn-message-theme[data-theme="my-theme"][data-photo-style="bw"] .photo-mat img {
  filter: grayscale(1) contrast(1.08);
}
#dyn-message-theme[data-theme="my-theme"][data-photo-style="color"] .photo-mat img {
  filter: contrast(1.05);
}
```

On live output, `applyPhotoStyle` (called from `applyVars`) sets `data-photo-style` on every theme. Pack CSS keyed off that attribute is enough for most imported themes. Bundled Grunge also sets hero `img.style.filter` inline when CSS alone is too subtle (`message-grunge-poster` in `extension/message-themes.js`) — only needed for extension-shipped fixes, not for new imports if your CSS filters are scoped correctly.

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

Engine `settings` object: `{ primary, secondary, background?, motion?, revealMs, photoStyle? }`. See `message-aurora.json` + engine, `message-stamp.json`, and `tmpl-liquid-glass.json`.

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

Engine signatures: `mount(root, pool, api, settings)` and optional `applySettings(root, state, settings)`. Scale changes remount (Polaroid grid, flip wall cols/rows, live mosaic camera, cube count). Color, frame, and photo style can update live in `applySettings` (Polaroid frame, flip-wall edge, cube color, Slant Rows card border and photo filter). Wrapping `"engine": "polaroid"` shows Polaroid’s photo-size slider plus any `primary` you declare as Frame. Wrapping `"engine": "pedestals"` shows Pedestal color.

**Frame (`frame`)** — hex color for card borders / mats (not accent shapes). Example (Slant Rows):

```json
"settings": {
  "scale": { "label": "Photo size", "default": 1 },
  "primary": { "label": "Accent", "default": "#e31b23" },
  "secondary": { "label": "Accent 2", "default": "#f36c1b" },
  "background": { "label": "Background", "default": "#141414" },
  "frame": { "label": "Frame", "default": "#ffffff" },
  "photoStyle": {
    "label": "Photos",
    "type": "select",
    "default": "bw",
    "options": [
      { "value": "bw", "label": "Black & white" },
      { "value": "color", "label": "Color" },
      { "value": "sepia", "label": "Sepia" }
    ]
  }
}
```

```css
#dyn-mosaic-theme[data-theme="mosaic-slant-rows"] .dyn-card {
  background: var(--frame, #fff);
}
#dyn-mosaic-theme[data-theme="mosaic-slant-rows"][data-photo-style="bw"] .sr-well img {
  filter: grayscale(1) contrast(1.08);
}
```

Engines that draw cards must update `--frame`, card `background`, and photo `filter` in `applySettings`, not only in `mount`.

### fit

Array of `{ "box", "text", "max", "min" }`. Selectors are queried inside the theme root. `max` / `min` are design-space px. Default max 160, min 18. Entries without `box` and `text` are dropped.

## Reserved ids

Do not use these as a new pack `id` or a new engine `id`:

`off`, `led-scoreboard`, `neon-nightclub`, `ultras-tifo`, `holo-card`, `broadcast-tv`, `liquid-glass`, `parallax-drift`, `text-message`, `decks`, `decks-brand`, `spotlight`, `coverflow`, `fan`, `filmstrip`, `scatter`, `cascade`, `orbit`, `billboard`, `reels`, `polaroid`, `polaroid-brand`, `flipwall`, `flipwall-brand`, `livewall`, `livewall-brand`, `cubes`, `cubes-brand`, `depthfield`, `pedestals`

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

The popup **Stage → Aspect** setting chooses the output canvas. **Match Vixi** (default) uses the ratio Vixi is already showing. **Match the window** fills the browser and tracks its size. Presets (`16:9`, `9:16`, `4:3`, `1:1`, `21:9`, or any `W:H`) contain-fit the window and letterbox the other axis. Message themes still draw in a `.dyn-fit-stage` and `scale()` it to fill that canvas. Prefer `cqh` / `cqw`. The root gets `dyn-portrait` when height > width, and `data-aspect` (`vixi`, `auto`, `16-9`, `9-16`, `4-3`, …).

Vixi’s background, QR, and logo are hidden while a theme is on. Mosaic and message each have their own **Show background** / **Show QR code** / **Show logo** toggles. Mosaic chrome never clones onto a message theme, and the reverse. The background fills the same contain-fitted canvas as the live kind (`object-fit: cover`). QR and logo return only if that kind’s theme has a slot (or the default corner chrome). Mosaic cards stay **2:3**; portrait restacks placement, it does not flip the crop to 3:2.

Root classes the runtime toggles:

- `on` — message is showing (play enter animations)
- `off` — message is hiding (play leave animations)
- `no-photo` — capture has no image
- `no-copy` — no message and no name
- `no-name` — no name
- `dyn-portrait` — stage is taller than wide (auto on a tall window, or any portrait ratio)
- `data-aspect` — `vixi` when matching Vixi’s canvas, `auto` when matching the window, otherwise the forced ratio (`16-9`, `9-16`, `4-3`, `1-1`, `21-9`, …)
- `dyn-show-bg` / `dyn-show-qr` / `dyn-show-logo` — that kind’s popup toggles are on
- `html.dyn-kind-message` / `html.dyn-kind-mosaic` — which output kind is live
- `html.dyn-show-bg` — the live kind’s selected / event background is visible and fitted to the stage. With a **selected custom** image/video/iframe, that asset sits **above** the theme’s Background color and **below** cards/copy, so PNG/GIF transparency shows the theme color through. Without a custom asset, theme root backdrops go transparent so Vixi’s own event background can show through.

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
- sideloaded via **Import packs…** (JSON + engine.js): stored in Chrome storage (`customEngines`). On matching output pages the service worker registers them with `chrome.userScripts` (CSP-exempt `USER_SCRIPT` world) plus a small host that talks to content scripts over `window.postMessage`.

### Sideload / Allow User Scripts (required)

Chrome MV3 blocks running imported engine source inside normal content scripts. Sideloaded engines therefore need an explicit opt-in:

1. First install opens `extension/setup.html` (**Finish setup**).
2. **Chrome 138+:** `chrome://extensions` → Dynamic Backgrounds → **Details** → turn on **Allow User Scripts**.
3. **Older Chrome:** keep **Developer mode** on at `chrome://extensions`.
4. Reload the extension if you just changed the toggle, confirm the popup setup banner is clear, then hard-refresh the Vixi output tab.

Without that opt-in, mount fails and the stage stays black. JSON-only packs do not need it. Bundled engines in `engines/*.js` still win when the same id is shipped. `new Function` is only used on pages that allow it (local preview). Chrome’s extension CSP blocks eval in the popup and in content scripts.

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
- `settings` is `{ primary, secondary, background?, motion?, revealMs, photoStyle? }`
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
- `settings` is `{ scale?, primary?, secondary?, background?, frame?, photoStyle? }`. `scale` is `0.7`–`1.5`, default `1`
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
| `ensureFitStage(themeRoot)` | Creates/returns `.dyn-fit-stage` (1920 on the long edge, matching the window or the forced ratio) |
| `applyVars(themeRoot, settings)` | Sets `--primary`, `--secondary`, `--background`, `--reveal-ms`, `data-motion`, `data-photo-style` |
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
- Invent settings keys other than `primary` / `secondary` / `background` / `motion` / `scale` / `frame` / `photoStyle` (plus documented `select` / `toggle` extras)
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
- Settings keys other than `primary` / `secondary` / `background` / `motion` / `scale` / `frame` / `photoStyle`
- Colors that are not `#rrggbb`
- `<script>` or `onclick=` in JSON
- ESM `import`/`export` in the engine
- Forgetting `.on` / `.off` enter/leave
- Leaking `requestAnimationFrame` after hide/unmount
- Using `"engine": "led-scoreboard"` when the brief is a new design
- Mosaic engine that creates `img` nodes instead of `BGMosaicThemes.makeCard`
- Fetching the engine from a URL
