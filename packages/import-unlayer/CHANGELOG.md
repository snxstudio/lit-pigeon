# @lit-pigeon/import-unlayer

## 0.3.0

### Minor Changes

- 9d63a2a: Give buttons a border, so the outlined half of the standard two-button pattern survives. `ButtonBlock.values.border` is an optional `{ width, style, color }` — structured in the document, serialised to `mj-button`'s `border` attribute on the way out and read back by the parser, which treats MJML's own `border: none` default and a zero width as no border. The button property panel gains style, width and colour controls, and `import-unlayer` maps Unlayer's `values.border`. A button without a border renders exactly as before.
- dbe6173: Give the document a language and a text direction. `body.attributes.language` (a BCP 47 tag) and `body.attributes.direction` are written out as `lang` and `dir` on `<mjml>`, which MJML copies onto `<html>` and onto the `role="article"` wrapper it adds for clients that strip `<html>`. Until now every exported email asserted `lang="und"` — the code for "undetermined" — so a screen reader had nothing to pick a voice from. `direction` defaults to the natural direction of `language`, via a new `resolveDirection` export that the editor chrome now shares instead of keeping its own RTL list.

  `metadata.name` is now rendered as `<mj-title>`, which fills the previously empty `<title>` and the wrapper's `aria-label`. The parser reads all three back, so the name of an imported template survives instead of always becoming `'Imported Template'`, and `import-unlayer` carries `language` and `textDirection` across, warning on a direction it does not recognise. The body panel gains a language field and a direction control that defaults to Auto.

  A document that sets neither attribute renders exactly as before.

- 33a9939: Style links for a whole document. `body.attributes.linkStyle` is an optional `{ color, underline }`, rendered as one `<mj-style>` rule targeting `a` — with the `[x-apple-data-detectors]` reset Apple Mail needs — instead of each link having to be styled by hand and restyled on every paste. The body property panel exposes colour and underline, `import-unlayer` maps Unlayer's `body.values.linkStyle`, and the parser lifts the generated rule back into `linkStyle` rather than collecting it as document CSS, so repeated export/import cycles are stable. A document without `linkStyle` renders exactly as before.
- 669c833: Import Unlayer's `video` and `timer` blocks instead of dropping them. They convert to the `video` and `countdown` blocks from `@lit-pigeon/blocks`, emitted by type name so the importer does not take a dependency on the catalog — a new `plugin-block` warning says when the host has not registered it. `form` still warns, because it genuinely has no equivalent.
- e0b4b49: Give a row's background image a repeat, size and position.

  A row stored only a background URL, and each layer then invented its own sizing: the renderer hardcoded `cover`/`no-repeat`, the canvas hardcoded `cover`/`center`, and the parser and Unlayer importer both read the URL and discarded everything else. A tiled background therefore came back as one stretched copy of the tile, and the canvas previewed a different crop from the one that shipped.

  - Core: optional `backgroundRepeat`, `backgroundSize` and `backgroundPosition` on `RowNode.attributes`, plus `resolveRowBackground(row)` — the single place that decides what a row's background means, so the canvas and the renderer cannot drift apart again.
  - Renderer: emits all three from the row, including the `background-position` it never wrote before. A row with none of them set still renders `cover`/`no-repeat`/`top center`, so existing documents are delivered exactly as they were.
  - Parser: reads the three attributes through the existing MJML defaults table, so an attribute nobody set means what MJML would actually render (`repeat`/`auto`/`top center`) and a tiled background survives import and re-export.
  - import-unlayer: maps `backgroundImage.repeat` (both the boolean older designs use and the CSS keyword newer ones use), `.size`, and `.customPosition`/`.center`. A single-axis `repeat-x`/`repeat-y` is imported as a full repeat with a new `background-repeat-clamped` warning rather than being dropped silently.
  - Editor: repeat, size and position controls on the row panel, shown once the row has a background image, and a canvas that paints the resolved values so the preview matches the export.

- 3448501: Extend device visibility to rows. `RowNode.attributes` now takes `hideOnMobile` / `hideOnDesktop`, rendered as the existing `pigeon-hide-*` classes on `mj-section` and read back by the parser, with a toggle and canvas badge to match blocks and columns. The mobile restore rule gained a `table` selector, without which a hidden full-width row never came back on mobile — MJML wraps a full-width section in a table rather than a div.

  `@lit-pigeon/import-unlayer` now maps Unlayer's `hideDesktop` and `_override.mobile.hideMobile` onto these flags for rows, columns and blocks, instead of dropping them.

### Patch Changes

- 34ab438: Read the button font weight from the Unlayer design instead of pinning every imported button to `600`. Keyword weights (`normal`, `bold`) and numeric ones are both carried across, whether the design stores the number as a number or as a string; designs that leave the field unset still import as `600`.
- Updated dependencies [c9b2881]
- Updated dependencies [c532903]
- Updated dependencies [9d63a2a]
- Updated dependencies [e2f6771]
- Updated dependencies [cb51c66]
- Updated dependencies [dbe6173]
- Updated dependencies [33a9939]
- Updated dependencies [ee2d70d]
- Updated dependencies [a8b808c]
- Updated dependencies [6c35111]
- Updated dependencies [519cec3]
- Updated dependencies [e0b4b49]
- Updated dependencies [3448501]
  - @lit-pigeon/core@0.4.0

## 0.2.0

### Minor Changes

- 3f2a47c: Add `@lit-pigeon/import-unlayer` — converts an Unlayer design JSON export into a `PigeonDocument`, so existing Unlayer templates can be migrated instead of rebuilt.

  Covers text, heading, image, button, divider, html, menu and social blocks, plus row/column structure, relative column widths and body-level styling. Import is best-effort and never throws: anything without a Pigeon equivalent is dropped and reported through typed `warnings`.

### Patch Changes

- Updated dependencies [14c1b54]
  - @lit-pigeon/core@0.3.3
