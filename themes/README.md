# Custom themes

You can build a message or mosaic theme as a JSON file outside the extension, then import it from the popup. Imported themes stay in Chrome storage and show up in the theme dropdowns with `(imported)` after the name.

## Import

1. Reload the unpacked extension (or reinstall `extension.zip`).
2. Open the extension popup.
3. Under **Imported themes**, click **Import theme.json**.
4. Choose one of the examples in this folder, or your own file.
5. Select the imported theme in **Message theme** or **Mosaic theme**.
6. Open a Vixi output page. The sideloaded theme should apply like a built-in one.

Examples to try:

- `example-stamp.json` — message theme (postage-stamp card)
- `example-ribbon.json` — mosaic theme (photos on a diagonal ribbon)

To preview without a live output, open `themes/preview.html` in a browser.

Remove an imported theme from the same popup section. If that theme was selected, the dropdown returns to Off.

## File format

The file must be JSON with this shape:

```json
{
  "format": "dynamic-backgrounds-theme",
  "version": 1,
  "kind": "message",
  "id": "my-theme",
  "label": "My Theme",
  "css": "/* selectors go here */",
  "html": "<div class=\"dyn-stage\">...</div>"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `format` | yes | Must be `dynamic-backgrounds-theme` |
| `version` | yes | Must be `1` |
| `kind` | yes | `message` or `mosaic` |
| `id` | yes | Lowercase letters, numbers, dashes. Cannot reuse a built-in id |
| `label` | yes | Name shown in the popup |
| `css` | no | Styled against `#dyn-message-theme[data-theme="your-id"]` or `#dyn-mosaic-theme[data-theme="your-id"]` |
| `html` | message yes | Markup mounted into the 1920×1080 (or 1080×1920) design stage |
| `fonts` | no | Google Fonts stylesheet URL only |
| `settings` | no | Color pickers: `primary`, `secondary`, `background`, each `{ "label", "default" }` |
| `revealMs` / `hideMs` | no | Message in/out timing |
| `fit` | no | Message text fitting: `{ "box", "text", "max", "min" }` |
| `layout` | mosaic | `grid`, `row`, `scatter`, or `ribbon` |
| `cols` / `rows` | mosaic grid | Defaults 4×3 |
| `count` | mosaic | Card count for row / scatter / ribbon |
| `interval` | mosaic | Milliseconds between photo swaps |

### Message HTML hooks

Put these attributes on elements the extension should fill:

- `data-photo` on the image (or the first `img`)
- `data-message` on the caption node
- `data-name` on the name node (can appear more than once)

The theme root gets class `on` when a message is shown and `off` while it hides. Use those for enter/leave animations. Color settings become CSS variables `--primary`, `--secondary`, and optionally `--background`.

Prefer `cqh` / `cqw` units so the layout scales with the design stage.

### Mosaic layouts

Imported mosaic themes reuse the live photo pool. You do not need `html` unless you want extra chrome. `css` can restyle the cards and background.

Script tags, `javascript:` URLs, and inline event handlers are rejected. Themes are data, not executable code.

## Limits

Up to 24 imported themes. CSS max 100 KB, HTML max 50 KB per file. Importing the same `id` again replaces the previous pack.
