---
'@lit-pigeon/renderer-mjml': minor
'@lit-pigeon/ssr': minor
'@lit-pigeon/rest': minor
'@lit-pigeon/editor': minor
'@lit-pigeon/angular': minor
---

Add plain-text export for the `text/plain` alternative part. `documentToPlainText(doc)` in `@lit-pigeon/renderer-mjml` renders headings and paragraphs, lists, links as `text (url)`, buttons as `label: url`, images as their alt text and dividers as a rule, and keeps merge tags and row conditions verbatim. `@lit-pigeon/ssr` adds `renderDocumentToText(doc, { mergeTags })`, `@lit-pigeon/rest` adds `POST /render/text`, and the editor (and the Angular wrapper) gain a `documentToPlainText` property and `exportPlainText()`.
