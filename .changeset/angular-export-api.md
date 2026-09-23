---
'@lit-pigeon/angular': minor
'@lit-pigeon/editor': patch
---

Angular wrapper: new `renderer`, `documentToMjml`, `theme`, `themeOverrides`, `templateStorage` and `assetStorage` inputs, passed straight through to `<pigeon-editor>`, plus `exportMjml()` and `exportHtml()` methods, so a host can get `{ mjml, html }` for the current document. Binding `[document]` to a different object now loads it (including resetting back to the original document); binding the object the editor already holds does nothing.

Editor: the toolbar's Export HTML now fires a single `pigeon:export-html` event with `{ document, html }`, where `html` comes from `renderer` (or is `null` without one). Hosts previously received two events, and the first had no `html`.
