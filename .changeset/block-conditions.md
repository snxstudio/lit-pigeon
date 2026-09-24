---
'@lit-pigeon/core': minor
'@lit-pigeon/renderer-mjml': minor
'@lit-pigeon/parser-mjml': minor
'@lit-pigeon/editor': minor
---

Add block-level display conditions. Every built-in block accepts `values.condition`, which the renderer wraps around just that block as `<mj-raw>{{#if …}}</mj-raw>` … `<mj-raw>{{/if}}</mj-raw>` inside its column, the same way row conditions wrap a section. The parser reads the markers back into the block's condition (a hero block's condition nests inside its row's), and the properties panel shows a "Display condition" field under every block.
