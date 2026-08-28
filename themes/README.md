# Custom themes

Build a message or mosaic theme as JSON (and optional JS) outside the extension, then import it from the popup. Imported themes stay in Chrome storage and show up in the dropdowns with `(imported)` after the name.

**Contract:** [SPEC.md](SPEC.md) — every field, clamp, reserved id, CSS hook, and engine signature.

**Site walkthrough:** [Create](https://ccavins.github.io/Dynamic_Backgrounds/create.html) · live catalog on [Themes](https://ccavins.github.io/Dynamic_Backgrounds/).

## Hand this to an AI

To have a model build a pack:

1. Attach [SPEC.md](SPEC.md) (the contract).
2. Attach the closest example:
   - JSON-only message: `example-stamp.json`
   - JSON-only mosaic: `example-ribbon.json`
   - Message with JS: `example-engine.json` + `example-aurora.js`
   - Mosaic with JS: `example-mosaic-engine.json` + `example-orbit-swap.js`
3. Paste this prompt, then describe the look:

```
You are writing a Dynamic Backgrounds theme pack. Read themes/SPEC.md and clone the closest example. Follow the spec exactly. Output valid JSON and, if the brief needs JS, a classic-script engine that calls BGThemeEngines.define. Do not invent fields. Do not use reserved ids. Scope all CSS. If you add an engine, id in define() must match JSON "engine". Prefer data-qr / data-logo slots and dyn-show-qr / dyn-show-logo layout variants when the brief mentions QR or logo.
```

## Import

1. Reload the unpacked extension (or reinstall `extension.zip`).
2. Open the extension popup.
3. Under **Imported themes**, click **Import theme.json + engine.js**.
4. Choose one JSON, or a JSON plus its `engine.js`.
5. Select the imported theme in **Message theme** or **Mosaic theme**.
6. Under **Stage**, pick a canvas ratio (or Custom width:height). Under **Mosaic theme** and **Message theme**, turn **Show background** / **Show QR code** / **Show logo** on only for that kind. Mosaic and message chrome stay separate.
7. Open a Vixi output page.

A pack that includes JS runs on matching output pages. Only import engines you wrote or trust. The popup warns the first time.

Examples to try:

- `example-stamp.json` — postage-stamp message card (JSON only)
- `example-ribbon.json` — diagonal photo ribbon (JSON only)
- `example-engine.json` + `example-aurora.js` — message card with a canvas aurora (same JS as `extension/engines/example-aurora.js`)
- `example-mosaic-engine.json` + `example-orbit-swap.js` — orbiting mosaic with photo swaps (same JS as `extension/engines/example-orbit-swap.js`)
- `tmpl-*.json` — full HTML/CSS ports of the built-in themes

To preview without a live output, open `preview.html` in a browser.

Remove an imported theme from the same popup section. If that theme was selected, the dropdown returns to Off.

## QR, logo, and background

While a theme is on, Vixi’s stock background / QR / logo stay hidden unless **that kind’s** popup toggles are on.

| Goal | How |
| --- | --- |
| Exact QR / logo placement | Put `data-qr` and `data-logo` on boxes in your HTML; style size and position in CSS |
| Default corners only | Omit those attributes — runtime adds logo top-left and QR bottom-right |
| Never show brand marks | Omit slots and leave Show QR / Show logo off |
| Different layouts when chrome is on/off | Use root classes `dyn-show-qr`, `dyn-show-logo`, `dyn-show-bg` (see SPEC) |

Built-in mosaics whose names end in `*` (Card decks*, Polaroid wall*, …) already reflow when QR/logo are enabled. Prefer **placing** content away from the chrome rail rather than clipping with `overflow: hidden` mid-stage — a hard cut through photos looks wrong.

## Mosaic photo pool

For mosaic engines: treat `pool` on each `tick` as the live set. Do not mass-rewrite every on-screen card when the pool changes. Prefer your theme’s normal enter/exit motion (or `api.nextUrl()`) so adds and removes feel like the rest of the theme.

Self-animated themes (Polaroid, flip wall, cubes, …) often own card replacement entirely; the host still updates `pool` for you.

## Built-in-style examples

The `tmpl-*.json` files are complete importable themes: HTML, CSS, fonts, text-fit, and color settings. They use new ids (`tmpl-led-scoreboard`, …) so you can import them beside the originals.

JSON cannot run the built-in canvas / WebGL / dealing scripts. For that exact runtime, add `"engine": "led-scoreboard"` (or `neon-nightclub`, `liquid-glass`, `parallax-drift`, `decks`, `polaroid`, `livewall`, …). Brand-aware wrap ids (`decks-brand`, `polaroid-brand`, …) are also reserved. For a **new** design with the same class of power, write a JS engine (see SPEC.md).

## Limits

Up to 24 imported themes. CSS max 100 KB, HTML max 50 KB, engine JS max ~200 KB. Importing the same `id` again replaces the previous pack. Full rules are in [SPEC.md](SPEC.md).
