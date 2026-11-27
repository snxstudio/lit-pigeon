---
'@lit-pigeon/core': minor
'@lit-pigeon/renderer-mjml': minor
'@lit-pigeon/parser-mjml': minor
'@lit-pigeon/editor': minor
'@lit-pigeon/import-unlayer': minor
---

Give buttons a border, so the outlined half of the standard two-button pattern survives. `ButtonBlock.values.border` is an optional `{ width, style, color }` — structured in the document, serialised to `mj-button`'s `border` attribute on the way out and read back by the parser, which treats MJML's own `border: none` default and a zero width as no border. The button property panel gains style, width and colour controls, and `import-unlayer` maps Unlayer's `values.border`. A button without a border renders exactly as before.
