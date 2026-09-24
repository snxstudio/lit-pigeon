# @lit-pigeon/renderer-mjml

## 0.3.0

### Minor Changes

- c532903: Add block-level display conditions. Every built-in block accepts `values.condition`, which the renderer wraps around just that block as `<mj-raw>{{#if …}}</mj-raw>` … `<mj-raw>{{/if}}</mj-raw>` inside its column, the same way row conditions wrap a section. The parser reads the markers back into the block's condition (a hero block's condition nests inside its row's), and the properties panel shows a "Display condition" field under every block.
- cb51c66: Hide blocks and columns on mobile or desktop.

  - Core: optional `hideOnMobile` / `hideOnDesktop` on every built-in block's `values` and on `ColumnNode.attributes` (`DeviceVisibility`), plus an undoable `updateColumnAttributes(rowId, columnId, attributes)` command.
  - Renderer: adds `pigeon-hide-mobile` / `pigeon-hide-desktop` to the element's MJML `css-class`, next to any class already there. For html blocks the class goes on the raw wrapper div. The renderer also emits one `<mj-style>` with MJML's 479px mobile media query and `mso-hide: all` for Outlook, but only when an element uses a flag, so other documents render exactly as before.
  - Parser: reads those classes back into the flags and keeps any other classes in `cssClass`, without "css-class dropped" warnings.
  - Editor: a Visibility section in the properties panel for every block and for a selected column. In the canvas, a "Hidden on mobile/desktop" badge marks the element, and it is hidden in the matching device preview. Tablet follows desktop, as MJML does.

- 11e5465: Add plain-text export for the `text/plain` alternative part. `documentToPlainText(doc)` in `@lit-pigeon/renderer-mjml` renders headings and paragraphs, lists, links as `text (url)`, buttons as `label: url`, images as their alt text and dividers as a rule, and keeps merge tags and row conditions verbatim. `@lit-pigeon/ssr` adds `renderDocumentToText(doc, { mergeTags })`, `@lit-pigeon/rest` adds `POST /render/text`, and the editor (and the Angular wrapper) gain a `documentToPlainText` property and `exportPlainText()`.
- 519cec3: Add repeat rows for array merge tags. `RowNode.attributes.repeat` (e.g. `"order.items"`) makes the renderer wrap the section in `<mj-raw>{{#each …}}</mj-raw>` … `<mj-raw>{{/each}}</mj-raw>` (Handlebars), inside any row `condition`. The parser reads the marker back into `repeat`, and the row panel gains a "Repeat for each" field.

### Patch Changes

- 76d5b0c: Fix quadratic backtracking in the `<mj-raw>` escape applied to html-block content. A block whose content held a `<` followed by a long run of whitespace, or many `<mj-raw` with no `>` after them, could occupy the renderer for minutes — reachable by anyone who can POST a document to a hosted `/render`. The pattern accepts exactly the same strings as before.
- Updated dependencies [c532903]
- Updated dependencies [e2f6771]
- Updated dependencies [cb51c66]
- Updated dependencies [6c35111]
- Updated dependencies [519cec3]
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
