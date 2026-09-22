# Design a theme

Read this file first. The full contract is [SPEC.md](SPEC.md). Before you write, read **How many settings** and **Pack assets** in that spec.

The repo is public and read-only. Copy a starting pack into your own folder. Do not push.

Preview (this is where you check a pack): https://vixi-custom-theme-extension.netlify.app/themes/preview.html

## Copy a starting point

Repo: https://github.com/CCavins/Dynamic_Backgrounds

| Look | Copy these files |
| --- | --- |
| JSON message (colors + motion) | `themes/message-stamp.json` |
| JSON message + extra questions | `themes/message-class-survey.json` |
| JSON mosaic | `themes/mosaic-framed.json` |
| Message with an engine | `themes/message-aurora.json` and `themes/message-aurora-engine.js` |
| Mosaic with an engine | `themes/mosaic-orbit-swap.json` and `themes/mosaic-orbit-swap-engine.js` |
| Drawn art (not a photo file) | `themes/message-xmas-bauble.json` and `themes/message-xmas-bauble-engine.js` |

Give the copy a new `id` and `label`. Do not reuse a built-in name (`led-scoreboard`, `coverflow`, and the other names already in the preview theme list).

## Images and fonts

- Select font files (`.woff2`, `.woff`, `.ttf`, `.otf`) in the same import as the JSON. Name them in `fontFile` or `fontFaces`.
- Import does not take PNG, WebP, JPG, or SVG. There is no `imageFile` field.
- A modest `data:` image is allowed while `css` stays under 256 KB and `html` under 50 KB. That 256 KB cap is ours, not the browser’s. A full-bleed photo still will not fit.
- A real photo on a live output is an `https://` URL in CSS, or art drawn by the engine. Christmas packs are drawn. They are not base64 photos.
- `url("assets/…")` can show in this site’s preview. It does not load on a Vixi output page.

## Check it in the preview

1. Open https://vixi-custom-theme-extension.netlify.app/themes/preview.html
2. Click **Import packs…**. In one selection, include the `.json`, the `*-engine.js` if the pack has one, and every font file the JSON names.
3. If a notice lists missing files, add those files and import again. That theme is not saved until the files are together.
4. Confirm the sample photo and message show (or the mosaic photos). Change a color setting and confirm the theme recolors. Turn on **Show QR** and **Show logo** and confirm the layout makes room. **Open viewer**, then click the picture or press F to hide the address bar.
5. Edit the local files and import again. The same `id` or `label` replaces the saved copy.

## Prompt

```
You are writing a Dynamic Themes theme pack. Read themes/DESIGN.md and themes/SPEC.md (How many settings and Pack assets). Copy the closest example from the public repo https://github.com/CCavins/Dynamic_Backgrounds into a local folder. Give it a new id and label. Do not push. Do not embed large base64 images. Then QC the pack at https://vixi-custom-theme-extension.netlify.app/themes/preview.html by importing the JSON, engine, and font files together.
```
