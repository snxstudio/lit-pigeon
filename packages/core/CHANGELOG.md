# @lit-pigeon/core

## 0.4.0

### Minor Changes

- c532903: Add block-level display conditions. Every built-in block accepts `values.condition`, which the renderer wraps around just that block as `<mj-raw>{{#if …}}</mj-raw>` … `<mj-raw>{{/if}}</mj-raw>` inside its column, the same way row conditions wrap a section. The parser reads the markers back into the block's condition (a hero block's condition nests inside its row's), and the properties panel shows a "Display condition" field under every block.
- e2f6771: Add eight starter templates: order confirmation, shipping update, password reset, invoice, event invite, product launch, abandoned cart and monthly digest. They are code-split and loaded with `loadGalleryTemplates()`, and `InMemoryTemplateStorage` merges them in on first access (unless `includeStarters: false`), so the editor's template picker and the MCP server's `list_templates` show all twelve without adding them to the eager bundle.
- cb51c66: Hide blocks and columns on mobile or desktop.

  - Core: optional `hideOnMobile` / `hideOnDesktop` on every built-in block's `values` and on `ColumnNode.attributes` (`DeviceVisibility`), plus an undoable `updateColumnAttributes(rowId, columnId, attributes)` command.
  - Renderer: adds `pigeon-hide-mobile` / `pigeon-hide-desktop` to the element's MJML `css-class`, next to any class already there. For html blocks the class goes on the raw wrapper div. The renderer also emits one `<mj-style>` with MJML's 479px mobile media query and `mso-hide: all` for Outlook, but only when an element uses a flag, so other documents render exactly as before.
  - Parser: reads those classes back into the flags and keeps any other classes in `cssClass`, without "css-class dropped" warnings.
  - Editor: a Visibility section in the properties panel for every block and for a selected column. In the canvas, a "Hidden on mobile/desktop" badge marks the element, and it is hidden in the matching device preview. Tablet follows desktop, as MJML does.

- 519cec3: Add repeat rows for array merge tags. `RowNode.attributes.repeat` (e.g. `"order.items"`) makes the renderer wrap the section in `<mj-raw>{{#each …}}</mj-raw>` … `<mj-raw>{{/each}}</mj-raw>` (Handlebars), inside any row `condition`. The parser reads the marker back into `repeat`, and the row panel gains a "Repeat for each" field.

### Patch Changes

- 6c35111: Add a read-only mode and enforce `RowNode.locked`.

  - `<pigeon-editor readonly>` (reflected `readonly` property) renders the canvas without the palette, properties panel, row actions, drag handles, inline editing, undo/redo or templates. Every document change is dropped at the editor's central dispatch, so keyboard shortcuts and stray events can't edit either. Preview, export, device and fullscreen still work. The Vue, Svelte and Angular wrappers take a `readonly` prop/input, and the React wrapper forwards it as an element property.
  - A locked row can no longer be moved, duplicated, deleted, resized or restyled, and its blocks can't be added, edited, moved or removed. The core row, column and block commands now refuse those changes. In the editor, the row shows a "Locked" badge, keeps only "Save to library", has no block drag handles and does not open inline editing. Its properties panel is shown but disabled, with a note explaining why.

## 0.3.3

### Patch Changes

- 14c1b54: Head styling now survives an MJML import and save:

  - `<mj-attributes>` defaults (`mj-all`, per-tag such as `<mj-text color>`, and `mj-class`) are resolved onto each element with MJML's precedence (element attribute > mj-class > tag > mj-all) before block values are read.
  - mj-text colour, font size and font family, which text blocks have no fields for, are kept as an inline `<span style>` in the content (inside block elements such as `<p>`), the same shape the rich-text editor writes. Values the renderer already produces are not repeated, so importing a saved template again does not add spans.
  - Non-inline `<mj-style>` CSS is kept on the new optional `body.attributes.css` and written back as `<mj-style>`, with `</mj-style` escaped.
  - `css-class` is kept on sections, columns, text, buttons and images through the new optional `cssClass` fields, and written back out. On other elements it is dropped with a parse warning.
  - `<mj-wrapper>` now reports a parse warning that its padding and background colour were dropped.

## 0.3.2

### Patch Changes

- fc043b1: Put the `types` condition first in `exports` — per the Node/TypeScript
  resolution spec it must precede `import`/`require`, otherwise it can never
  match. Types still resolved via the top-level `types` fallback, but this
  removes the bundler warning and makes conditional type resolution correct.

## 0.3.1

### Patch Changes

- 697fc07: Packaging hygiene: every package now ships a `LICENSE` file and a `README` in
  its npm tarball (10 packages previously had no README on the registry), and
  declares `homepage`, `bugs`, `author`, and `keywords`. No API changes. Also
  corrects a stale repo link in the Svelte package README.

## 0.3.0

### Minor Changes

- d2cbd91: Stock image integration in the asset manager. A new **Stock** tab searches Unsplash and Pexels directly (the host supplies API keys via `AssetManagerConfig.stock`) and inserts a photo by its hotlinked URL, with in-picker photographer/provider attribution and the required Unsplash download-ping. The stock UI and provider code are lazy-loaded, so they add nothing to the core editor bundle.

## 0.2.0

### Minor Changes

- a44ddbb: Custom font management. Register web fonts via `fontConfig`: the editor's font picker lists configured and brand fonts, the preview and export load them, and the MJML renderer emits `<mj-font>` for each registered font. `@lit-pigeon/core` adds the `FontDefinition` type and `fontConfig` / `RenderOptions.fonts`.
- a44ddbb: Saved / reusable rows (user content library). Save a row to a personal library from the row toolbar and re-insert it from the new Saved palette tab by dragging it onto the canvas. `@lit-pigeon/core` gains the row-library types, an in-memory storage implementation, and a clone helper; `@lit-pigeon/mcp-server` gains a file-system-backed `FsRowLibraryStorage`.
- a44ddbb: Special link types. Insert unsubscribe, view-in-browser, and custom system links via a link-type picker available in both the button property panel and the rich-text link editor. `@lit-pigeon/core` adds `LinkType`, `SYSTEM_LINK_TYPES`, and `EditorConfig.linkTypes`; the sanitizers now allow `tel:` and `{{…}}` template hrefs.

## 0.1.2

### Patch Changes

- Verify the automated CI publishing pipeline: this patch release is published
  by the Release workflow using the LIT_PIGEON_NPM_TOKEN secret with npm
  provenance, confirming end-to-end automation.

## 0.1.1

### Patch Changes

- Republish all packages at 0.1.1.

  The initial 0.1.0 release was left unusable: five packages (core, editor,
  angular, parser-mjml, renderer-mjml) were published and then unpublished —
  permanently burning the 0.1.0 version number — which broke the other nine
  packages that depend on `@lit-pigeon/core`. This release republishes all
  packages at a clean, fully-installable 0.1.1 and switches internal
  dependencies to `workspace:^` so they publish as caret ranges.
