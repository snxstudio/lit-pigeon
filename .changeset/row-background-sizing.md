---
'@lit-pigeon/core': minor
'@lit-pigeon/renderer-mjml': minor
'@lit-pigeon/parser-mjml': minor
'@lit-pigeon/import-unlayer': minor
'@lit-pigeon/editor': minor
---

Give a row's background image a repeat, size and position.

A row stored only a background URL, and each layer then invented its own sizing: the renderer hardcoded `cover`/`no-repeat`, the canvas hardcoded `cover`/`center`, and the parser and Unlayer importer both read the URL and discarded everything else. A tiled background therefore came back as one stretched copy of the tile, and the canvas previewed a different crop from the one that shipped.

- Core: optional `backgroundRepeat`, `backgroundSize` and `backgroundPosition` on `RowNode.attributes`, plus `resolveRowBackground(row)` — the single place that decides what a row's background means, so the canvas and the renderer cannot drift apart again.
- Renderer: emits all three from the row, including the `background-position` it never wrote before. A row with none of them set still renders `cover`/`no-repeat`/`top center`, so existing documents are delivered exactly as they were.
- Parser: reads the three attributes through the existing MJML defaults table, so an attribute nobody set means what MJML would actually render (`repeat`/`auto`/`top center`) and a tiled background survives import and re-export.
- import-unlayer: maps `backgroundImage.repeat` (both the boolean older designs use and the CSS keyword newer ones use), `.size`, and `.customPosition`/`.center`. A single-axis `repeat-x`/`repeat-y` is imported as a full repeat with a new `background-repeat-clamped` warning rather than being dropped silently.
- Editor: repeat, size and position controls on the row panel, shown once the row has a background image, and a canvas that paints the resolved values so the preview matches the export.
