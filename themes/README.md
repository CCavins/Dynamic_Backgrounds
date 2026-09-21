# Custom themes

Build a message or mosaic theme as JSON (and optional JS) outside the extension, then import it from the popup. Imported themes stay in Chrome storage and show up in the dropdowns with `(imported)` after the name.

**Contract:** [SPEC.md](SPEC.md) — every field, clamp, reserved id, CSS hook, and engine signature.

**Site walkthrough:** [Create](https://ccavins.github.io/Dynamic_Backgrounds/create.html) · live catalog on [Themes](https://ccavins.github.io/Dynamic_Backgrounds/).

## Hand this to an AI

To have a model build a pack:

1. Attach [SPEC.md](SPEC.md) (the contract).
2. Attach the closest example:
   - JSON-only message (colors + motion): `message-stamp.json`
   - JSON-only message + extra Vixi questions: `message-class-survey.json`
   - JSON-only mosaic with size + frame: `mosaic-framed.json`
   - JSON-only mosaic layout: `mosaic-ribbon.json`
   - Message with JS: `message-aurora.json` + `message-aurora-engine.js`
   - Mosaic with JS: `mosaic-orbit-swap.json` + `mosaic-orbit-swap-engine.js`
3. Paste this prompt, then describe the look:

```
You are writing a Dynamic Backgrounds theme pack. Read themes/SPEC.md and clone the closest example. Follow the spec exactly. Output valid JSON and, if the brief needs JS, a classic-script engine that calls BGThemeEngines.define. Do not invent fields. Do not use reserved ids. Scope all CSS. If you add an engine, id in define() must match JSON "engine". Prefer data-qr / data-logo slots and dyn-show-qr / dyn-show-logo layout variants when the brief mentions QR or logo. Suggested file names: message-<name>.json / message-<name>-engine.js or mosaic-<name>.json / mosaic-<name>-engine.js (optional, not required).
```

## Import

1. Reload the unpacked extension (or reinstall `extension.zip`). On first install, complete the **Finish setup** tab.
2. **If the pack includes `*-engine.js`:** open extension details → turn on **Allow User Scripts** (Chrome 138+), or keep **Developer mode** on for older Chrome. The popup shows a red **Finish setup** banner until this is done. JSON-only packs can skip this. Without the opt-in, engine themes mount as a black screen on Vixi.
3. Open the extension popup.
4. Under **Imported themes**, click **Import packs…**.
5. Select one or many theme `.json` files, plus each pack’s `*-engine.js` if it has one. Matching is automatic by `engine` / filename.
6. Select the imported theme in **Message theme** or **Mosaic theme**.
7. Under **Stage**, pick a canvas ratio (or Custom width:height). Under **Mosaic theme** and **Message theme**, turn **Show background** / **Show QR code** / **Show logo** on only for that kind. Mosaic and message chrome stay separate.
8. Open a Vixi output page and hard-refresh after enabling User Scripts or importing an engine.

A pack that includes JS runs on matching output pages only after Allow User Scripts is on. Only import engines you wrote or trust. The popup warns the first time.

Examples to try:

- `message-class-survey.json` — kindergarten class survey example (Themes page demo + preview; sideload with Import packs… — not in the extension catalog). Name + 4 extra questions + message; Pencil, Paper, Desk, Photos. See **Extra Vixi questions** in SPEC.md. Field labels live in the pack `notes` object.
- `message-stamp.json` — postage-stamp message card (JSON only; Ink, Paper, Background, Motion)
- `message-grunge-poster.json` — torn-paper grunge poster (JSON only; **Ink**, **Paper**, **Photos**). Brick wall is a separate asset (`assets/grunge-wall.webp`), not a popup color — see SPEC.md.
- `mosaic-framed.json` — framed photo scatter (JSON only; Photo size + Frame color)
- `mosaic-ribbon.json` — diagonal photo ribbon (JSON only)
- `message-aurora.json` + `message-aurora-engine.js` — message card with a canvas aurora (same JS as `extension/engines/message-aurora-engine.js`)
- `mosaic-orbit-swap.json` + `mosaic-orbit-swap-engine.js` — orbiting mosaic with photo swaps (same JS as `extension/engines/mosaic-orbit-swap-engine.js`)
- `mosaic-slant-rows.json` + `mosaic-slant-rows-engine.js` — slanted photo rows (Frame + Photos settings; asphalt texture is `assets/slant-asphalt.webp`, not inline in CSS — see SPEC.md)
- `message-xmas-bauble.json` (+ `message-xmas-bauble-engine`) / `message-xmas-postcard.json` / `message-xmas-mantel.json` — Christmas message options
- `mosaic-xmas-snowfall.json` (+ `mosaic-xmas-snowfall-engine`) — scatter mosaic with particles.js–style canvas snow
- `mosaic-xmas-wreath.json` + `mosaic-xmas-wreath-engine.js` — Christmas wreath mosaic
- `mosaic-xmas-tree.json` + `mosaic-xmas-tree-engine.js` — Christmas tree mosaic
- `tmpl-*.json` — full HTML/CSS ports of the built-in themes

To preview without a live output, open [`preview.html`](preview.html) in a browser (also on the [live site](https://vixi-custom-theme-extension.netlify.app/themes/preview.html)). It uses the same pack CSS, `applyVars` / `applySettings` live path, and message enter/exit timing as the Chrome extension. Use the dock for Ink / Paper / Photos (or mosaic controls) while the theme is on screen. **Import packs…** loads a local `.json` plus its `*-engine.js` and font files and keeps them in this browser until you **Remove** them. The same id or label replaces that import. Built-in names are not replaced. **Open viewer** shows that theme with the dock hidden. Click the picture or press F there to hide the browser address bar. **Show QR** and **Show logo** in the preview dock use the same `dyn-show-qr` / `dyn-show-logo` classes as the extension, so a theme that makes room for them reflows the same way. They place a placeholder QR (the word Placeholder across the middle of the square) and a transparent Vixi V logo. Themes with `data-qr` / `data-logo` use those slots. Themes without them get the default corners. Optional **Stage background** upload behaves like Show background on output.

**Do not** embed large textures as base64 inside pack `css` — keep `css` under 100 KB and ship images as files under `assets/` for **bundled** themes. Grunge Poster is the reference (wall WebP + flat Paper fills). Details: [SPEC.md — Pack assets](SPEC.md#pack-assets-images-and-textures).

**Background on imported packs:** the **`background` color** setting (solid fill via `var(--background)`) is the supported path — see [Imported packs vs bundled image backdrops](SPEC.md#imported-packs-vs-bundled-image-backdrops). Import copies **fonts** with the pack, not image files; large base64 in CSS is not safe; relative `url(assets/…)` in CSS does not resolve on Vixi output.

Harness pages for automated checks: `grunge-settings-check.html`, `slant-settings-check.html`, `settings-check.html` (load over HTTP, not `file://`, so bundled packs fetch correctly).

Remove an imported theme from the same popup section. If that theme was selected, the dropdown returns to Off.

## QR, logo, and background

While a theme is on, Vixi’s stock background / QR / logo stay hidden unless **that kind’s** popup toggles are on.

| Goal | How |
| --- | --- |
| Exact QR / logo placement | Put `data-qr` and `data-logo` on boxes in your HTML; style size and position in CSS |
| Default corners only | Omit those attributes — runtime adds logo top-left and QR bottom-right |
| Never show brand marks | Omit slots and leave Show QR / Show logo off |
| Different layouts when chrome is on/off | Use root classes `dyn-show-qr`, `dyn-show-logo`, `dyn-show-bg` (see SPEC) |

Built-in mosaics whose names end in `*` (Card decks*, Polaroid wall*, …) already reflow when QR/logo are enabled. Prefer **placing** content away from the chrome rail rather than clipping with `overflow: hidden` mid-stage — a hard cut through photos looks wrong. Circular layouts (Orbit Swap) can put logo and QR in the top corners so they sit in empty space without a brand reflow.

## Mosaic photo pool

For mosaic engines: treat `pool` on each `tick` as the live set. Do not mass-rewrite every on-screen card when the pool changes. Prefer your theme’s normal enter/exit motion (or `api.nextUrl()`) so adds and removes feel like the rest of the theme.

Self-animated themes (Polaroid, flip wall, cubes, …) often own card replacement entirely; the host still updates `pool` for you.

## Built-in-style examples

The `tmpl-*.json` files are complete importable themes: HTML, CSS, fonts, text-fit, and color settings. They use new ids (`tmpl-led-scoreboard`, …) so you can import them beside the originals.

After import, pick the theme in the popup. **Imported and bundled themes share the same live-settings behavior** — declare keys under `settings` in your JSON and wire CSS to `--primary`, `--secondary`, `--background`, `--scale`, `--frame`, `data-motion`, and `data-photo-style` (see **Live settings for imported themes** in [SPEC.md](SPEC.md)). Message packs can show Ink/Paper/Background/Motion and **Photos**; mosaic packs can show photo size, accent colors, **Frame**, and **Photos**. Some built-in mosaics (Polaroid wall, Live mosaic, 3D flip wall, Cube field, Depth Field, Pedestals) have the same controls without importing.

## Live settings when creating a theme

Popup controls only work on output if the pack cooperates with the runtime hooks. **You do not need to modify the extension** for the standard keys (`primary`, `secondary`, `background`, `motion`, `scale`, `frame`, `photoStyle`).

1. **Declare** each control in the pack `"settings"` object (label + default; `type: "select"` for Photos).
2. **CSS** — use `var(--primary)`, `var(--secondary)`, `var(--background)`, `var(--frame)`, and `calc(… * var(--scale, 1))`. Drive motion off `[data-motion="…"]` and photo treatment off `[data-photo-style="…"]` on the scoped theme root selector.
3. **JSON-only message** — no engine code; the import compiler wires `applySettings` → `applyVars` automatically.
4. **JSON-only mosaic** — same via `applyMosaicVars`.
5. **JS engine** — call `BGMessageThemes.applyVars(themeRoot, settings)` (message) or update colors/filters in `applySettings` (mosaic) the same way you do in `mount`.
6. **Test live** — import the pack, reload the extension, hard-refresh the Vixi output tab, go on air with the theme, then change each popup control without switching themes.

Clone these examples:

| Goal | Pack |
| --- | --- |
| Message colors + motion | `message-stamp.json` |
| Message + extra Vixi questions | `message-class-survey.json` |
| Message + Photos + flat paper + image wall | `message-grunge-poster.json` + `assets/grunge-wall.webp` |
| Mosaic size + frame color | `mosaic-framed.json` |
| Mosaic frame + Photos (engine) | `mosaic-slant-rows.json` + `mosaic-slant-rows-engine.js` |
| Message engine + colors | `message-aurora.json` + `message-aurora-engine.js` |

Full rules, pitfalls, and tables: [SPEC.md — Live settings for imported themes](SPEC.md#live-settings-for-imported-themes-pack-authors).

## Adding or changing popup settings (extension authors)

When you add a new theme setting (like `frame` or `photoStyle`), wire it through the full live pipeline — not just the pack JSON and popup UI. See **Live settings on output** in [SPEC.md](SPEC.md). In short:

1. Declare the key in pack `settings` (hex default, or `type: "select"` with options).
2. Ensure `normalizeOneThemeSettings` and `mergeResolvedThemeSettings` in `extension/rules.js` preserve it (explicit handling for new keys).
3. Apply it on live output in `applyVars` / `applyMosaicVars` / engine `applySettings` without remounting.
4. Add a row to `themes/*-settings-check.html` and bump the extension version.

Slant Rows (`frame`, `photoStyle`) and Grunge Poster (Ink, Paper, Photos; wall asset + `applyGrungePresentation`) are reference implementations. Imported copies of those JSON packs get the same live behavior after import — except bundled-only JS helpers (Grunge wall URL resolution) ship with the extension, not in the JSON import.

JSON cannot run the built-in canvas / WebGL / dealing scripts. For that exact runtime, add `"engine": "led-scoreboard"` (or `neon-nightclub`, `liquid-glass`, `parallax-drift`, `decks`, `polaroid`, `livewall`, …). Brand-aware wrap ids (`decks-brand`, `polaroid-brand`, …) are also reserved. For a **new** design with the same class of power, write a JS engine (see SPEC.md).

## Limits

Up to 24 imported themes. CSS max 100 KB, HTML max 50 KB, engine JS max ~200 KB. **Keep textures out of `css`** — use separate asset files so stylesheets parse reliably and stay under the cap. Importing the same `id` again replaces the previous pack. Full rules are in [SPEC.md](SPEC.md).
