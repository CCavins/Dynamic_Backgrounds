# Dynamic Backgrounds

Themes for live Vixi output, plus a gallery of full-screen animated backgrounds. The Chrome extension restyles matching output pages with mosaic themes, message themes, and optional iframe backgrounds.

**Live site:** [ccavins.github.io/Dynamic_Backgrounds](https://ccavins.github.io/Dynamic_Backgrounds/)

The site has four pages:

| Page | What it is |
| --- | --- |
| [Themes](https://ccavins.github.io/Dynamic_Backgrounds/) | Home. Live mini-previews of every built-in message and mosaic theme |
| [Backgrounds](https://ccavins.github.io/Dynamic_Backgrounds/backgrounds.html) | Animated scene gallery |
| [Extension](https://ccavins.github.io/Dynamic_Backgrounds/extension.html) | Install and how the popup works |
| [Create](https://ccavins.github.io/Dynamic_Backgrounds/create.html) | Import a custom theme JSON (start with `example-stamp.json`) |

Theme tiles on the home page are a catalog, not links. They mount the real theme engines with sample captures from `samples/patriots/` when a card scrolls into view.

## Scenes

| Scene | What it is |
| --- | --- |
| [Universe](backgrounds/universe.html) | A Three.js starfield of twinkling stars and nebula color bands |
| [Aurora](backgrounds/aurora.html) | Shader ribbons of northern lights over a cold night sky |
| [Synthwave](backgrounds/synthwave.html) | A neon perspective grid racing toward a striped sun |
| [Fluid Ink](backgrounds/fluid-ink.html) | Slow-folding ink and smoke in layered color |
| [Plexus](backgrounds/plexus.html) | Drifting nodes that connect when they drift close |
| [Ocean](backgrounds/ocean.html) | Underwater rays, surface caustics, and rising bubbles |
| [Fireflies](backgrounds/fireflies.html) | Soft glowing insects over a midnight forest |
| [Lava Lamp](backgrounds/lava-lamp.html) | Molten blobs that rise, merge, and split |
| [Matrix Rain](backgrounds/matrix.html) | Cascading glyph columns with a bright leading head |
| [Silk Waves](backgrounds/silk-waves.html) | Layered gradient silk that ripples across the frame |
| [Clouds](backgrounds/clouds.html) | Soft volumetric cloud cover drifting over an open sky |

## How to use backgrounds

1. Open the [Backgrounds](https://ccavins.github.io/Dynamic_Backgrounds/backgrounds.html) tab and click a card. Thumbnails are short recorded loops of the real scenes, not live WebGL, so the gallery stays light.
2. Press **Space** to open settings. Change colors, speed, density, and other scene-specific options.
3. Press **Space** again to hide the panel. **Reset** restores the defaults.
4. Settings are saved per background in `localStorage`, so they persist on the next visit.
5. **Copy iframe** copies a full-screen embed of the scene with your current colors and settings baked into the URL. Paste it on another page and put your own content on top. The embed uses the `cfg` in the URL, not the visitor’s saved preferences.

## Embed

Open any scene, press **Space**, set colors and sliders, then **Copy iframe**. The clipboard gets a full-viewport snippet like:

```html
<iframe
  src="https://ccavins.github.io/Dynamic_Backgrounds/backgrounds/ocean.html?embed=1&cfg=..."
  style="position:fixed;inset:0;width:100%;height:100%;border:0;z-index:-1"
  title="Ocean"
></iframe>
```

Paste it on another page and layer your own content on top. The `cfg` value is the configured look. Embedded pages hide the gallery button and settings, and they do not read or write the visitor’s `localStorage`.

## Chrome extension

The site header has a **Download Chrome extension** link (`extension.zip`). Chrome cannot install from that click. Unzip the file, then:

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the unzipped `extension` folder

The popup has a master **On / Off** switch:

- **Off** leaves every page alone.
- **Specific output URLs** apply one iframe to one matching output URL. A match always wins.
- **Any output URL** is a fallback iframe for recognized output pages that do not match a specific row. Leave it blank to skip unmatched pages.

Tokens and extra query params on an output URL are ignored when matching. Staging and production stay separate.

The popup **Stage** control resizes the output canvas to a chosen ratio (16:9, 9:16, 4:3, 1:1, 21:9, or any width:height). Auto still follows the window. Themes restack for portrait without flipping photo crops. Mosaic and message each have their own background / QR / logo toggles. Those stay hidden unless you turn them on for that kind. The background fills the stage at the current aspect; the theme places QR and logo.

If you change files in `extension/`, rebuild the zip from the repo root:

```bash
rm -f extension.zip && zip -r extension.zip extension -x "*.DS_Store"
```

## Run locally

These pages are static HTML. Any local server works:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. Universe loads Three.js from a CDN, so a local server is required for that scene.

## Preview clips

Background gallery cards play short muted MP4 loops in `previews/`. They are cheaper than GIFs and much cheaper than running every scene live. To recapture them after a visual change:

```bash
python3 -m http.server 8080
cd scripts && npm install && node record-previews.mjs
```

## Deploy

The site is published from the `main` branch root with [GitHub Pages](https://pages.github.com/). Push to `main` and Pages rebuilds automatically.
