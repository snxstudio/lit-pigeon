# @lit-pigeon/editor

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
