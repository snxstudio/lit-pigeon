---
'@lit-pigeon/core': minor
'@lit-pigeon/renderer-mjml': patch
'@lit-pigeon/parser-mjml': patch
---

Stop the renderer's own `<mj-style>` blocks being read back as document CSS. A document with a hidden block gained roughly 400 bytes of generated device-visibility rules in `body.attributes.css` on every export/import cycle, unbounded, and the copy then shadowed the real rules whenever a later release changed them. Generated blocks now open with a `/* pigeon-generated: … */` marker that the parser skips, so repeated cycles produce byte-identical MJML. CSS a user wrote is collected exactly as before.
