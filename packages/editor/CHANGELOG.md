# @lit-pigeon/editor

## 0.4.0

### Minor Changes

- c9b2881: Let a host choose which blocks the editor offers, with `EditorConfig.blocks`.

  The palette rendered every registered block unconditionally, so an embedder who needed a subset — a platform that cannot host arbitrary markup and must remove the `html` block, a transactional product that wants text, image and button only — had to fork the palette component.

  ```ts
  editor.config = { blocks: ['text', 'image', 'button'] };
  ```

  The list sets both membership and palette order. Unset means every registered block, which is the default, and a listed type nobody registered is skipped.

  The restriction is enforced in the `insertBlock` command rather than by hiding the palette chip, so the keyboard and paste paths are held to it too — a chip is only one of the routes into insertion. `DocumentStore.addBlock` in `@lit-pigeon/mcp-server` mutates the document directly instead of going through commands, so it checks availability itself and throws for an unavailable type.

  Availability gates insertion, not rendering: a document that already contains an omitted type still renders, so narrowing the palette never blanks a saved template.

  Like `locale`, the setting is global to the page — the last editor to apply it wins for every instance.

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
- 59ea2d5: Add built-in UI catalogs for es, fr, de, pt-BR, it, nl, ja, zh-CN, ar and hi, each loaded on demand with `loadLocale()` and passed to `config.messages`. They are machine-translated and flagged for native review. `BUILT_IN_LOCALES` lists the codes.
- bc942fc: Add `canUndo()`, `canRedo()`, `showPreview()` and `hidePreview()` to `<pigeon-editor>`, so a host that hides the built-in toolbar and renders its own can reach the state it needs. `canUndo`/`canRedo` return what the built-in toolbar disables its buttons on, and are `false` under `readonly`. `showPreview()` follows the toolbar's contract: without a `renderer` it fires `pigeon:preview` and returns `false` rather than opening an empty panel.

  Opening and closing the preview now fires `pigeon:preview-open` and `pigeon:preview-close` whatever moved it — the toolbar, the overlay, Escape, the panel's own × button, or these methods — so a host's own Preview button can stay in sync with the built-in one.

  Fixes a bug this exposed: closing the preview with Escape or its × button left the editor's copy of the open state stale, so the toolbar's Preview button did nothing on the next click and the panel could not be reopened at all.

- a8b808c: Keep a row's columns side by side on mobile. `RowNode.attributes.noStackOnMobile` renders the row's columns inside an MJML `<mj-group>`, so a logo beside a nav stays that way on a phone instead of stacking into two full-width bands. The row property panel exposes it as "Do not stack on mobile", and the MJML parser now reads `mj-group` onto the flag rather than discarding it — a grouped header imported from elsewhere used to come back stacking, silently. A section that mixes a group with loose columns, or holds more than one, cannot be described by a row-level flag, so it is flattened with a warning instead of quietly changing the other columns. Rows that do not set the flag render byte-identically to before.
- 11e5465: Add plain-text export for the `text/plain` alternative part. `documentToPlainText(doc)` in `@lit-pigeon/renderer-mjml` renders headings and paragraphs, lists, links as `text (url)`, buttons as `label: url`, images as their alt text and dividers as a rule, and keeps merge tags and row conditions verbatim. `@lit-pigeon/ssr` adds `renderDocumentToText(doc, { mergeTags })`, `@lit-pigeon/rest` adds `POST /render/text`, and the editor (and the Angular wrapper) gain a `documentToPlainText` property and `exportPlainText()`.
- 6c35111: Add a read-only mode and enforce `RowNode.locked`.

  - `<pigeon-editor readonly>` (reflected `readonly` property) renders the canvas without the palette, properties panel, row actions, drag handles, inline editing, undo/redo or templates. Every document change is dropped at the editor's central dispatch, so keyboard shortcuts and stray events can't edit either. Preview, export, device and fullscreen still work. The Vue, Svelte and Angular wrappers take a `readonly` prop/input, and the React wrapper forwards it as an element property.
  - A locked row can no longer be moved, duplicated, deleted, resized or restyled, and its blocks can't be added, edited, moved or removed. The core row, column and block commands now refuse those changes. In the editor, the row shows a "Locked" badge, keeps only "Save to library", has no block drag handles and does not open inline editing. Its properties panel is shown but disabled, with a note explaining why.

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

- 706526a: Sanitise the HTML that text, hero, button and custom `renderCanvas` blocks show in the canvas. Imported content such as `<img onerror>`, `<script>`, `<iframe>` or `javascript:` links no longer runs in the host page, while inline styles, tables, fonts, links, images and comments still display. Stored content and exported MJML/HTML are unchanged.
- d8062d1: Stop the HTML block's resize observer throwing `Cannot read properties of null (reading 'body')` after the document is replaced and its preview frame is detached.
- 0616ae2: Keep HTML comments, tables, images and wrapper attributes when a text, hero or button block is edited. Outlook `<!--[if mso]>` blocks and a hero button's `<table>`/`<div>` styling used to be destroyed the moment the user typed, because TipTap's schema has no node for them. They are now held out of the schema and restored on commit. Pressing Escape in a hero or button block also commits through the sanitiser again, as blur always did.
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

## 0.3.4

### Patch Changes

- 0fc684b: Stop bundling `lit/directives/ref.js` (and with it lit's directive base classes) into the editor. Every `lit`, `lit-html` and `@lit/*` import is now external. The bundled copy was built in lit's production mode, so hosts that load lit's development build (e.g. `ng serve` / `nx serve`) crashed with `currentDirective._$initialize is not a function`.
- 92a495b: Load the TipTap rich-text chunk lazily again. A component shared by the properties panel and the bubble menu (the link-type picker) was bundled into `rich-text.js`, so `index.js` imported that chunk statically and every consumer downloaded TipTap up front. Initial JS for an npm consumer drops from 168.9 kB to 64.8 kB gzipped; TipTap (~142 kB gz) now loads on first text edit, as designed.

## 0.3.3

### Patch Changes

- cb1b6de: Angular wrapper: new `renderer`, `documentToMjml`, `theme`, `themeOverrides`, `templateStorage` and `assetStorage` inputs, passed straight through to `<pigeon-editor>`, plus `exportMjml()` and `exportHtml()` methods, so a host can get `{ mjml, html }` for the current document. Binding `[document]` to a different object now loads it (including resetting back to the original document); binding the object the editor already holds does nothing.

  Editor: the toolbar's Export HTML now fires a single `pigeon:export-html` event with `{ document, html }`, where `html` comes from `renderer` (or is `null` without one). Export MJML and Export JSON now fire a single event too. Hosts previously received two events for each export, and the first had an empty payload.

- 6cfa63f: `pigeon:export` and `pigeon:merge-tag-request` now actually fire. `pigeon:export` fires when the toolbar's Export menu opens. When `config.mergeTags` is set without static `tags`, the text, HTML and body panels show the Tag button, and clicking it fires `pigeon:merge-tag-request` so the host can supply tags with `setMergeTags()`.
- 599cf42: Entering and leaving inline edit on a text block without changing anything (by blur or Escape) now keeps the stored HTML byte for byte. Previously TipTap's normalisation rewrote imported markup, such as inline `<span style="color:...">` or `<b>`, and added an undo step.
- ba5c40a: The merge-tag picker now opens directly under the Tag button that opened it. Its viewport coordinates were being applied as an offset from wherever the picker sat in the panel, so it appeared far from the button.
- e5c318b: Sandbox the preview iframe. Rendered email markup (for example an imported `mj-raw` with an `onerror` handler) used to run script in the preview with the host page's origin. Links in the preview still open in a new tab.
- 8e29f49: Moving `<pigeon-editor>` in the DOM (a host dialog or tab re-attaching it) no longer resets the document and undo history to the initial `document`. State is created once and kept across disconnect and reconnect, and keyboard shortcuts keep working after the move.
- 82d1187: HTML blocks no longer run script in the editor canvas. Their markup (for example imported `mj-raw` with `<img onerror>`, `<script>` or `javascript:` links) is now shown in a sandboxed iframe without script permission, sized to its content. The stored content and the exported MJML/HTML are unchanged.
- 73b24ca: Keyboard shortcuts now only act on key presses aimed at the editor (or at nothing in particular). Embedded in a host app, Delete/Backspace, arrows and Cmd+C/V pressed in the host's own widgets no longer edit or hijack the email.
- Updated dependencies [14c1b54]
  - @lit-pigeon/core@0.3.3

## 0.3.2

### Patch Changes

- a17bffa: Fix two editor bugs that broke the first-run experience:
  - **Rich-text engine now actually lazy-loads from the published bundle.** The
    build was placing the statically-imported loader/controller modules inside
    the `rich-text` chunk, so `dist/index.js` ended up with a static import of
    that chunk — eagerly pulling TipTap (~150 kB gz) into every consumer bundle
    and defeating the lazy-load design. They now live in a tiny
    `rich-text-bridge` chunk (~0.7 kB gz) and TipTap is only fetched on first
    text edit.
  - **Palette items now add a block on click.** Items exposed
    `role="button"` + "Add block" labels but only responded to drag and
    Enter/Space — a plain mouse click did nothing. Click now dispatches the same
    `palette-item-activate` event (with a guard so the click that can follow a
    drag gesture is ignored).

- Updated dependencies [fc043b1]
  - @lit-pigeon/core@0.3.2

## 0.3.1

### Patch Changes

- 697fc07: Packaging hygiene: every package now ships a `LICENSE` file and a `README` in
  its npm tarball (10 packages previously had no README on the registry), and
  declares `homepage`, `bugs`, `author`, and `keywords`. No API changes. Also
  corrects a stale repo link in the Svelte package README.
- Updated dependencies [697fc07]
  - @lit-pigeon/core@0.3.1

## 0.3.0

### Minor Changes

- d2cbd91: Stock image integration in the asset manager. A new **Stock** tab searches Unsplash and Pexels directly (the host supplies API keys via `AssetManagerConfig.stock`) and inserts a photo by its hotlinked URL, with in-picker photographer/provider attribution and the required Unsplash download-ping. The stock UI and provider code are lazy-loaded, so they add nothing to the core editor bundle.

### Patch Changes

- Updated dependencies [d2cbd91]
  - @lit-pigeon/core@0.3.0

## 0.2.0

### Minor Changes

- a44ddbb: Drag content blocks to reorder them within a column. Each block now exposes a hover-revealed drag handle (mirroring the row drag handle) that emits an `existing-block` drag, leaving click-to-select and inline text editing unaffected. A latent same-column off-by-one is fixed: the visual drop index is translated through the post-removal splice index and no-op drops are skipped.
- a44ddbb: Add a brand-kit panel (`<pigeon-brand-kit-panel>`): a Brand tab in the palette to apply brand colors and fonts and insert brand logos. Brand-kit edits are persisted, the active kit is resolved and prop-drilled into the editor, and public events are emitted on change.
- a44ddbb: Custom font management. Register web fonts via `fontConfig`: the editor's font picker lists configured and brand fonts, the preview and export load them, and the MJML renderer emits `<mj-font>` for each registered font. `@lit-pigeon/core` adds the `FontDefinition` type and `fontConfig` / `RenderOptions.fonts`.
- a44ddbb: Editor UI localization (i18n) and RTL support. All toolbar, palette, property-panel, preview, template, asset-manager, and rich-text strings are now translatable via `configureI18n`, and the editor sets its text direction automatically (`resolveDir`) so right-to-left locales render correctly.
- a44ddbb: Saved / reusable rows (user content library). Save a row to a personal library from the row toolbar and re-insert it from the new Saved palette tab by dragging it onto the canvas. `@lit-pigeon/core` gains the row-library types, an in-memory storage implementation, and a clone helper; `@lit-pigeon/mcp-server` gains a file-system-backed `FsRowLibraryStorage`.
- a44ddbb: Special link types. Insert unsubscribe, view-in-browser, and custom system links via a link-type picker available in both the button property panel and the rich-text link editor. `@lit-pigeon/core` adds `LinkType`, `SYSTEM_LINK_TYPES`, and `EditorConfig.linkTypes`; the sanitizers now allow `tel:` and `{{…}}` template hrefs.

### Patch Changes

- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
  - @lit-pigeon/core@0.2.0

## 0.1.3

### Patch Changes

- af5896c: Fix the TS2322 strictFunctionTypes error in the FontSize TipTap extension: the `renderHTML` callback parameter is now contextually typed by TipTap's `Attribute` interface instead of an over-narrow explicit annotation. The package now passes `tsc --noEmit` with zero errors.
- ccb858f: Properties-panel polish: replace the box-model diamond spacing editor with a compact Figma-style segmented row (T/R/B/L), render schema-driven checkbox fields as toggle switches, hoist the toggle-switch and secondary-button styles into the shared panel stylesheet (deduped from button/row panels), and style the image Upload button to match the input chrome.

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
