---
'@lit-pigeon/editor': minor
'@lit-pigeon/core': patch
'@lit-pigeon/vue': minor
'@lit-pigeon/svelte': minor
'@lit-pigeon/angular': minor
---

Add a read-only mode and enforce `RowNode.locked`.

- `<pigeon-editor readonly>` (reflected `readonly` property) renders the canvas without the palette, properties panel, row actions, drag handles, inline editing, undo/redo or templates. Every document change is dropped at the editor's central dispatch, so keyboard shortcuts and stray events can't edit either. Preview, export, device and fullscreen still work. The Vue, Svelte and Angular wrappers take a `readonly` prop/input, and the React wrapper forwards it as an element property.
- A locked row can no longer be moved, duplicated, deleted, resized or restyled, and its blocks can't be added, edited, moved or removed. The core row, column and block commands now refuse those changes. In the editor, the row shows a "Locked" badge, keeps only "Save to library", has no block drag handles and does not open inline editing. Its properties panel is shown but disabled, with a note explaining why.
