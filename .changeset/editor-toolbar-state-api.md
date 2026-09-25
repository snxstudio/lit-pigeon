---
'@lit-pigeon/editor': minor
---

Add `canUndo()`, `canRedo()`, `showPreview()` and `hidePreview()` to `<pigeon-editor>`, so a host that hides the built-in toolbar and renders its own can reach the state it needs. `canUndo`/`canRedo` return what the built-in toolbar disables its buttons on, and are `false` under `readonly`. `showPreview()` follows the toolbar's contract: without a `renderer` it fires `pigeon:preview` and returns `false` rather than opening an empty panel.

Opening and closing the preview now fires `pigeon:preview-open` and `pigeon:preview-close` whatever moved it — the toolbar, the overlay, Escape, the panel's own × button, or these methods — so a host's own Preview button can stay in sync with the built-in one.

Fixes a bug this exposed: closing the preview with Escape or its × button left the editor's copy of the open state stale, so the toolbar's Preview button did nothing on the next click and the panel could not be reopened at all.
