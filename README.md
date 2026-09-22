# Dynamic Backgrounds

Themes for live Vixi output, plus a gallery of full-screen animated backgrounds. The Chrome extension restyles matching output pages with mosaic themes, message themes, and optional iframe backgrounds.

**Live site:** [vixi-custom-theme-extension.netlify.app](https://vixi-custom-theme-extension.netlify.app/)

**Designing a theme:** [themes/DESIGN.md](themes/DESIGN.md) — copy a starting pack, then check it in the preview. Read that before [themes/SPEC.md](themes/SPEC.md).

The site has four pages:

| Page | What it is |
| --- | --- |
| [Themes](https://vixi-custom-theme-extension.netlify.app/) | Home. Theme catalog; hover runs one live engine preview |
| [Backgrounds](https://vixi-custom-theme-extension.netlify.app/backgrounds.html) | Animated scene gallery |
| [Extension](https://vixi-custom-theme-extension.netlify.app/extension.html) | Install and how the popup works |
| [Create](https://vixi-custom-theme-extension.netlify.app/create.html) | Import a custom theme JSON (start with `message-stamp.json`) |

Theme tiles on the home page are a catalog, not links. Idle cards show a quiet pattern placeholder. Hover (or keyboard focus) mounts the real theme engine for that tile only — at most one live preview at a time — and tears it down when you leave or when the tab is hidden. WebGL (Cube field / Depth Field) loads only when those tiles are previewed.

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

1. Open the [Backgrounds](https://vixi-custom-theme-extension.netlify.app/backgrounds.html) tab and click a card. Thumbnails are short recorded loops of the real scenes, not live WebGL, so the gallery stays light.
2. Press **Space** to open settings. Change colors, speed, density, and other scene-specific options.
3. Press **Space** again to hide the panel. **Reset** restores the defaults.
4. Settings are saved per background in `localStorage`, so they persist on the next visit.
5. **Copy iframe** copies a full-screen embed of the scene with your current colors and settings baked into the URL. Paste it on another page and put your own content on top. The embed uses the `cfg` in the URL, not the visitor’s saved preferences.

## Embed

Open any scene, press **Space**, set colors and sliders, then **Copy iframe**. The clipboard gets a full-viewport snippet like:

```html
<iframe
  src="https://vixi-custom-theme-extension.netlify.app/backgrounds/ocean.html?embed=1&cfg=..."
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
5. Complete **Finish setup** (Chrome opens a setup tab on first install)

### Finish setup (required for imported engines)

Built-in themes work immediately. Packs imported with a `*-engine.js` file need one Chrome opt-in, or they show a **black screen** on Vixi:

1. Open `chrome://extensions` → **Dynamic Backgrounds** → **Details** (or use **Open extension details** in the popup / setup tab)
2. Turn on **Allow User Scripts** (Chrome 138+). Older Chrome: keep **Developer mode** on
3. Reload the extension if you just flipped the toggle
4. Confirm the popup’s **Finish setup** banner is gone (or green on the setup tab), then hard-refresh the Vixi output tab

JSON-only packs do not need Allow User Scripts. More detail: [Extension](https://vixi-custom-theme-extension.netlify.app/extension.html) · [Create](https://vixi-custom-theme-extension.netlify.app/create.html).

The popup has a master **Replace Vixi themes** switch:

- **Off** leaves every page alone.
- **Specific output URLs** apply one iframe to one matching output URL. A match always wins.
- **Any output URL** is a fallback iframe for recognized output pages that do not match a specific row. Leave it blank to skip unmatched pages.

Tokens and extra query params on an output URL are ignored when matching. Staging and production stay separate.

The popup **Stage** control follows Vixi’s canvas by default (**Match Vixi**). **Match the window** fills the browser and tracks its size. Presets (16:9, 9:16, 4:3, 1:1, 21:9, or any width:height) letterbox the leftover window in black. Themes restack for portrait without flipping photo crops. Mosaic and message each have their own background / QR / logo toggles. Those stay hidden unless you turn them on for that kind. The background fills the stage at the current aspect; the theme places QR and logo.

### Mosaic themes

Built-in mosaic looks (popup **Mosaic theme**):

| Theme | Notes |
| --- | --- |
| Spotlight, Coverflow, Cascade, Orbit, Reels, Depth Field, Pedestals | Standard layouts |
| Card decks*, Fan*, Polaroid wall*, 3D flip wall*, Live mosaic*, Cube field* | **Brand-aware** — when Show QR / Show logo are on, content reflows to leave room for chrome (no hard mid-screen crop). With both off, they use the full stage |

`*` in the name means the theme is optimized for QR/logo placement. The popup explains this under the mosaic dropdown.

Mosaic photo updates: feed add/remove only refreshes the **pool**. On-screen cards change through each theme’s own transitions (for example Polaroid’s drop/toss/place), not by flashing every card when membership changes. After a CTA (or other native beat), mosaic remounts so those enter animations play immediately instead of showing the parked wall.

### Message themes

Built-ins include LED Scoreboard, Neon Nightclub, Ultras Tifo, Holo Card, Broadcast TV, Liquid Glass, Parallax Drift, and **Text Message** (large photo + iPhone chat that keeps prior bubbles on back-to-back captures). Text Message exposes Phone / Accent / Stage colors and an optional chat wallpaper upload.

Message themes stay black until the first capture `show()` finishes, so a cold load does not flash QR/logo alone before the layout paints. Mosaic ↔ message handoffs crossfade under cover so stock Vixi layers and leftover cards do not sit on top of the other beat. Back-to-back messages stay themed; CTA, stream, live, video, and URL items stay native. Mosaic remounts when it returns so enter animations (Polaroid drop/toss/place, and the rest) play instead of showing the parked wall.

### Background

The popup **Background** section can use:

1. **Vixi — event background** — reads the live event background URL/asset from the page and injects it the same way as a pasted media URL (Vixi’s own logo/QR stay out of that layer)  
2. **Link / iframe** — paste a URL or iframe HTML  
3. **Backgrounds folder** — pick a folder once on disk; add files in Finder and **Rescan** (no extension reload). Chrome remembers the folder path; each time you open the popup, click **Allow access** once before the file list can load (File System Access security).  
4. **Upload file** — one-off import into extension storage  

Choosing a folder file or upload while Source is Vixi or Link switches Source to Media so that file is what actually shows. Stored files remain available if you switch back to Vixi later.

**Size limits**

| Source | Max file size |
| --- | --- |
| Backgrounds folder | About **64 MB** per file |
| One-off upload | About **3.5 MB** (JPEG/PNG/WebP/BMP stills are compressed; GIF/video/SVG/AVIF use the raw file) |

**Supported formats** (folder scan + upload)

| Kind | Extensions |
| --- | --- |
| Still images | `.jpg` / `.jpeg`, `.png`, `.webp`, `.bmp`, `.avif`, `.svg` |
| Animated image | `.gif` |
| Video | `.mp4`, `.webm`, `.mov`, `.m4v`, `.ogv` / `.ogg` |

Chrome must be able to decode the file in an `<img>` or `<video>` tag. Prefer **H.264 MP4** or **WebM** for video. Exotic codecs (some ProRes MOV, HEVC-only, MKV) may list in the folder but fail to play — export to MP4/WebM if that happens. HEIC/HEIF from iPhone is not supported; convert to JPEG or PNG first.

When a theme is on, turn on that theme’s **Show background** to keep the custom background behind it. Fit modes: Fill / Fit / Stretch / Center.

### Custom themes

Build and import your own packs — see [themes/README.md](themes/README.md) and the contract in [themes/SPEC.md](themes/SPEC.md). The Create page on the live site walks through import. Preview packs in [`themes/preview.html`](themes/preview.html) (Import packs… and Open viewer) before going live on Vixi. You can place QR/logo exactly with `data-qr` / `data-logo` and reflow layout with `dyn-show-qr` / `dyn-show-logo` CSS.

**Extra Vixi questions:** first on-screen text is `message`, second is `name`, then `question1`, `question2`, … in DOM order. Bind extras with `data-field="question1"` or `data-question="1"`. [Class Survey](themes/message-class-survey.json) is the downloadable example (demo on the Themes page and in preview; Import packs… to use on output). Labels for those hooks live in the pack `notes` object (JSON has no `//` comments). Details: [themes/SPEC.md — Extra Vixi questions](themes/SPEC.md#extra-vixi-questions).

**Import packs…** accepts a mixed selection from a themes folder: `.json`, optional `*-engine.js`, and optional font files (`.woff2` / `.woff` / `.ttf` / `.otf`). Engines match by `engine` / filename; fonts match by each JSON `fontFile` / `fontFaces[].fontFile`. Several packs can share one font file (stored once). Re-importing the same theme `id`, engine id, or font file replaces the previous copy. Engine packs only run after **Allow User Scripts** is enabled (see Finish setup above).

Google Fonts: JSON `fonts` as one CSS URL (multiple `family=` params OK) or an array of URLs. Custom faces:

```json
"fontFaces": [
  { "fontFile": "BrandDisplay.woff2", "fontFamily": "Brand Display" },
  { "fontFile": "BrandBody.woff2", "fontFamily": "Brand Body" }
]
```

Singular `fontFile` / `fontFamily` still works for one face. Prefer `.woff2` (about **2 MB** max per font). Reference families in CSS the usual way. Google + custom can both be on the same pack.

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

To host on [Render](https://render.com) instead (or in parallel), connect this repo as a **Static Site**, or use the Blueprint in [`render.yaml`](render.yaml) (publish directory `.`, no build).
