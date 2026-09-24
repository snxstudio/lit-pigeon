# @lit-pigeon/angular

## 0.3.0

### Minor Changes

- 11e5465: Add plain-text export for the `text/plain` alternative part. `documentToPlainText(doc)` in `@lit-pigeon/renderer-mjml` renders headings and paragraphs, lists, links as `text (url)`, buttons as `label: url`, images as their alt text and dividers as a rule, and keeps merge tags and row conditions verbatim. `@lit-pigeon/ssr` adds `renderDocumentToText(doc, { mergeTags })`, `@lit-pigeon/rest` adds `POST /render/text`, and the editor (and the Angular wrapper) gain a `documentToPlainText` property and `exportPlainText()`.
- 6c35111: Add a read-only mode and enforce `RowNode.locked`.

  - `<pigeon-editor readonly>` (reflected `readonly` property) renders the canvas without the palette, properties panel, row actions, drag handles, inline editing, undo/redo or templates. Every document change is dropped at the editor's central dispatch, so keyboard shortcuts and stray events can't edit either. Preview, export, device and fullscreen still work. The Vue, Svelte and Angular wrappers take a `readonly` prop/input, and the React wrapper forwards it as an element property.
  - A locked row can no longer be moved, duplicated, deleted, resized or restyled, and its blocks can't be added, edited, moved or removed. The core row, column and block commands now refuse those changes. In the editor, the row shows a "Locked" badge, keeps only "Save to library", has no block drag handles and does not open inline editing. Its properties panel is shown but disabled, with a note explaining why.

### Patch Changes

- Updated dependencies [c532903]
- Updated dependencies [706526a]
- Updated dependencies [e2f6771]
- Updated dependencies [cb51c66]
- Updated dependencies [59ea2d5]
- Updated dependencies [d8062d1]
- Updated dependencies [11e5465]
- Updated dependencies [0616ae2]
- Updated dependencies [6c35111]
- Updated dependencies [519cec3]
  - @lit-pigeon/core@0.4.0
  - @lit-pigeon/editor@0.4.0

## 0.2.0

### Minor Changes

- cb1b6de: Angular wrapper: new `renderer`, `documentToMjml`, `theme`, `themeOverrides`, `templateStorage` and `assetStorage` inputs, passed straight through to `<pigeon-editor>`, plus `exportMjml()` and `exportHtml()` methods, so a host can get `{ mjml, html }` for the current document. Binding `[document]` to a different object now loads it (including resetting back to the original document); binding the object the editor already holds does nothing.

  Editor: the toolbar's Export HTML now fires a single `pigeon:export-html` event with `{ document, html }`, where `html` comes from `renderer` (or is `null` without one). Export MJML and Export JSON now fire a single event too. Hosts previously received two events for each export, and the first had an empty payload.

### Patch Changes

- e5e36df: Build the Angular wrapper with ng-packagr (partial Ivy compilation, Angular Package Format) instead of plain Vite. The previous output had no Ivy metadata, so `PigeonEditorComponent` failed at runtime in AOT production builds. The peer range is now `@angular/core` >= 22, which is what the partial output from the Angular 22 compiler supports.
- Updated dependencies [cb1b6de]
- Updated dependencies [6cfa63f]
- Updated dependencies [599cf42]
- Updated dependencies [ba5c40a]
- Updated dependencies [14c1b54]
- Updated dependencies [e5c318b]
- Updated dependencies [8e29f49]
- Updated dependencies [82d1187]
- Updated dependencies [73b24ca]
  - @lit-pigeon/editor@0.3.3
  - @lit-pigeon/core@0.3.3

## 0.1.6

### Patch Changes

- fc043b1: Put the `types` condition first in `exports` — per the Node/TypeScript
  resolution spec it must precede `import`/`require`, otherwise it can never
  match. Types still resolved via the top-level `types` fallback, but this
  removes the bundler warning and makes conditional type resolution correct.
- Updated dependencies [a17bffa]
- Updated dependencies [fc043b1]
  - @lit-pigeon/editor@0.3.2
  - @lit-pigeon/core@0.3.2

## 0.1.5

### Patch Changes

- 697fc07: Packaging hygiene: every package now ships a `LICENSE` file and a `README` in
  its npm tarball (10 packages previously had no README on the registry), and
  declares `homepage`, `bugs`, `author`, and `keywords`. No API changes. Also
  corrects a stale repo link in the Svelte package README.
- Updated dependencies [697fc07]
  - @lit-pigeon/core@0.3.1
  - @lit-pigeon/editor@0.3.1

## 0.1.4

### Patch Changes

- Updated dependencies [d2cbd91]
  - @lit-pigeon/editor@0.3.0
  - @lit-pigeon/core@0.3.0

## 0.1.3

### Patch Changes

- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
  - @lit-pigeon/editor@0.2.0
  - @lit-pigeon/core@0.2.0

## 0.1.2

### Patch Changes

- Verify the automated CI publishing pipeline: this patch release is published
  by the Release workflow using the LIT_PIGEON_NPM_TOKEN secret with npm
  provenance, confirming end-to-end automation.
- Updated dependencies
  - @lit-pigeon/core@0.1.2
  - @lit-pigeon/editor@0.1.2

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
  - @lit-pigeon/editor@0.1.1
