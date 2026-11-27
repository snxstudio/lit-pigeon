---
'@lit-pigeon/core': minor
'@lit-pigeon/renderer-mjml': minor
'@lit-pigeon/parser-mjml': minor
'@lit-pigeon/editor': minor
'@lit-pigeon/import-unlayer': minor
---

Style links for a whole document. `body.attributes.linkStyle` is an optional `{ color, underline }`, rendered as one `<mj-style>` rule targeting `a` — with the `[x-apple-data-detectors]` reset Apple Mail needs — instead of each link having to be styled by hand and restyled on every paste. The body property panel exposes colour and underline, `import-unlayer` maps Unlayer's `body.values.linkStyle`, and the parser lifts the generated rule back into `linkStyle` rather than collecting it as document CSS, so repeated export/import cycles are stable. A document without `linkStyle` renders exactly as before.
