# @lit-pigeon/renderer-mjml

## 0.3.0

### Minor Changes

- c532903: Add block-level display conditions. Every built-in block accepts `values.condition`, which the renderer wraps around just that block as `<mj-raw>{{#if …}}</mj-raw>` … `<mj-raw>{{/if}}</mj-raw>` inside its column, the same way row conditions wrap a section. The parser reads the markers back into the block's condition (a hero block's condition nests inside its row's), and the properties panel shows a "Display condition" field under every block.
- 9d63a2a: Give buttons a border, so the outlined half of the standard two-button pattern survives. `ButtonBlock.values.border` is an optional `{ width, style, color }` — structured in the document, serialised to `mj-button`'s `border` attribute on the way out and read back by the parser, which treats MJML's own `border: none` default and a zero width as no border. The button property panel gains style, width and colour controls, and `import-unlayer` maps Unlayer's `values.border`. A button without a border renders exactly as before.
- cb51c66: Hide blocks and columns on mobile or desktop.

  - Core: optional `hideOnMobile` / `hideOnDesktop` on every built-in block's `values` and on `ColumnNode.attributes` (`DeviceVisibility`), plus an undoable `updateColumnAttributes(rowId, columnId, attributes)` command.
  - Renderer: adds `pigeon-hide-mobile` / `pigeon-hide-desktop` to the element's MJML `css-class`, next to any class already there. For html blocks the class goes on the raw wrapper div. The renderer also emits one `<mj-style>` with MJML's 479px mobile media query and `mso-hide: all` for Outlook, but only when an element uses a flag, so other documents render exactly as before.
  - Parser: reads those classes back into the flags and keeps any other classes in `cssClass`, without "css-class dropped" warnings.
  - Editor: a Visibility section in the properties panel for every block and for a selected column. In the canvas, a "Hidden on mobile/desktop" badge marks the element, and it is hidden in the matching device preview. Tablet follows desktop, as MJML does.

- dbe6173: Give the document a language and a text direction. `body.attributes.language` (a BCP 47 tag) and `body.attributes.direction` are written out as `lang` and `dir` on `<mjml>`, which MJML copies onto `<html>` and onto the `role="article"` wrapper it adds for clients that strip `<html>`. Until now every exported email asserted `lang="und"` — the code for "undetermined" — so a screen reader had nothing to pick a voice from. `direction` defaults to the natural direction of `language`, via a new `resolveDirection` export that the editor chrome now shares instead of keeping its own RTL list.

  `metadata.name` is now rendered as `<mj-title>`, which fills the previously empty `<title>` and the wrapper's `aria-label`. The parser reads all three back, so the name of an imported template survives instead of always becoming `'Imported Template'`, and `import-unlayer` carries `language` and `textDirection` across, warning on a direction it does not recognise. The body panel gains a language field and a direction control that defaults to Auto.

  A document that sets neither attribute renders exactly as before.

- 33a9939: Style links for a whole document. `body.attributes.linkStyle` is an optional `{ color, underline }`, rendered as one `<mj-style>` rule targeting `a` — with the `[x-apple-data-detectors]` reset Apple Mail needs — instead of each link having to be styled by hand and restyled on every paste. The body property panel exposes colour and underline, `import-unlayer` maps Unlayer's `body.values.linkStyle`, and the parser lifts the generated rule back into `linkStyle` rather than collecting it as document CSS, so repeated export/import cycles are stable. A document without `linkStyle` renders exactly as before.
- a8b808c: Keep a row's columns side by side on mobile. `RowNode.attributes.noStackOnMobile` renders the row's columns inside an MJML `<mj-group>`, so a logo beside a nav stays that way on a phone instead of stacking into two full-width bands. The row property panel exposes it as "Do not stack on mobile", and the MJML parser now reads `mj-group` onto the flag rather than discarding it — a grouped header imported from elsewhere used to come back stacking, silently. A section that mixes a group with loose columns, or holds more than one, cannot be described by a row-level flag, so it is flattened with a warning instead of quietly changing the other columns. Rows that do not set the flag render byte-identically to before.
- 11e5465: Add plain-text export for the `text/plain` alternative part. `documentToPlainText(doc)` in `@lit-pigeon/renderer-mjml` renders headings and paragraphs, lists, links as `text (url)`, buttons as `label: url`, images as their alt text and dividers as a rule, and keeps merge tags and row conditions verbatim. `@lit-pigeon/ssr` adds `renderDocumentToText(doc, { mergeTags })`, `@lit-pigeon/rest` adds `POST /render/text`, and the editor (and the Angular wrapper) gain a `documentToPlainText` property and `exportPlainText()`.
- 519cec3: Add repeat rows for array merge tags. `RowNode.attributes.repeat` (e.g. `"order.items"`) makes the renderer wrap the section in `<mj-raw>{{#each …}}</mj-raw>` … `<mj-raw>{{/each}}</mj-raw>` (Handlebars), inside any row `condition`. The parser reads the marker back into `repeat`, and the row panel gains a "Repeat for each" field.
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

- ee2d70d: Stop the renderer's own `<mj-style>` blocks being read back as document CSS. A document with a hidden block gained roughly 400 bytes of generated device-visibility rules in `body.attributes.css` on every export/import cycle, unbounded, and the copy then shadowed the real rules whenever a later release changed them. Generated blocks now open with a `/* pigeon-generated: … */` marker that the parser skips, so repeated cycles produce byte-identical MJML. CSS a user wrote is collected exactly as before.
- 76d5b0c: Fix quadratic backtracking in the `<mj-raw>` escape applied to html-block content. A block whose content held a `<` followed by a long run of whitespace, or many `<mj-raw` with no `>` after them, could occupy the renderer for minutes — reachable by anyone who can POST a document to a hosted `/render`. The pattern accepts exactly the same strings as before.
- 0cc4966: Keep display conditions and row repeats in the plain-text part.

  `documentToPlainText` predates block-level display conditions and row repeats, and neither updated it, so the `text/plain` and `text/html` parts of the same email disagreed about what the reader gets.

  - A block's `condition` was dropped entirely, so content the sender marked conditional was delivered to every recipient in the text part while the HTML part hid it correctly. Blocks are now wrapped in `{{#if …}}` the way the renderer already wraps them.
  - A row's `repeat` was dropped, so an itemised row appeared once, with merge tags written to resolve against the item resolving against the root instead — the plain-text part of an order confirmation had no line items. Rows are now wrapped in `{{#each …}}`, nested inside any condition exactly as `renderRow` nests them.

  A wrapper is only written around a body that produced text, so an empty block does not leave a bare `{{#if}}{{/if}}` in the message. A test now asserts the two parts carry the same wrappers, so the next feature of this kind cannot land in one renderer only.

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

## 0.2.5

### Patch Changes

- e8a8ad5: Fix invisible text in exported html blocks. `mj-raw` sits inside a column cell with `font-size: 0px` and gets neither `mj-all` nor `mj-text` defaults, so unstyled html-block text rendered at 0px in the email. The renderer now inlines `font-size: 14px; line-height: 1.5` and the body font family on the html-block wrapper, matching text blocks. Sizes set inside the content still win.

## 0.2.4

### Patch Changes

- 14c1b54: Head styling now survives an MJML import and save:

  - `<mj-attributes>` defaults (`mj-all`, per-tag such as `<mj-text color>`, and `mj-class`) are resolved onto each element with MJML's precedence (element attribute > mj-class > tag > mj-all) before block values are read.
  - mj-text colour, font size and font family, which text blocks have no fields for, are kept as an inline `<span style>` in the content (inside block elements such as `<p>`), the same shape the rich-text editor writes. Values the renderer already produces are not repeated, so importing a saved template again does not add spans.
  - Non-inline `<mj-style>` CSS is kept on the new optional `body.attributes.css` and written back as `<mj-style>`, with `</mj-style` escaped.
  - `css-class` is kept on sections, columns, text, buttons and images through the new optional `cssClass` fields, and written back out. On other elements it is dropped with a parse warning.
  - `<mj-wrapper>` now reports a parse warning that its padding and background colour were dropped.

- Updated dependencies [14c1b54]
  - @lit-pigeon/core@0.3.3

## 0.2.3

### Patch Changes

- fc043b1: Put the `types` condition first in `exports` — per the Node/TypeScript
  resolution spec it must precede `import`/`require`, otherwise it can never
  match. Types still resolved via the top-level `types` fallback, but this
  removes the bundler warning and makes conditional type resolution correct.
- Updated dependencies [fc043b1]
  - @lit-pigeon/core@0.3.2

## 0.2.2

### Patch Changes

- 697fc07: Packaging hygiene: every package now ships a `LICENSE` file and a `README` in
  its npm tarball (10 packages previously had no README on the registry), and
  declares `homepage`, `bugs`, `author`, and `keywords`. No API changes. Also
  corrects a stale repo link in the Svelte package README.
- Updated dependencies [697fc07]
  - @lit-pigeon/core@0.3.1

## 0.2.1

### Patch Changes

- Updated dependencies [d2cbd91]
  - @lit-pigeon/core@0.3.0

## 0.2.0

### Minor Changes

- a44ddbb: Custom font management. Register web fonts via `fontConfig`: the editor's font picker lists configured and brand fonts, the preview and export load them, and the MJML renderer emits `<mj-font>` for each registered font. `@lit-pigeon/core` adds the `FontDefinition` type and `fontConfig` / `RenderOptions.fonts`.

### Patch Changes

- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
  - @lit-pigeon/core@0.2.0

## 0.1.2

### Patch Changes

- Verify the automated CI publishing pipeline: this patch release is published
  by the Release workflow using the LIT_PIGEON_NPM_TOKEN secret with npm
  provenance, confirming end-to-end automation.
- Updated dependencies
  - @lit-pigeon/core@0.1.2

## 0.1.1

### Patch Changes

- Republish all packages at 0.1.1.

  The initial 0.1.0 release was left unusable: five packages (core, editor,
  angular, parser-mjml, renderer-mjml) were published and then unpublished —
  permanently burning the 0.1.0 version number — which broke the other nine
  packages that depend on `@lit-pigeon/core`. This release republishes all
  packages at a clean, fully-installable 0.1.1 and switches internal
  dependencies to `workspace:^` so they publish as caret ranges.

- Updated dependencies
  - @lit-pigeon/core@0.1.1
