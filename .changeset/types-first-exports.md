---
'@lit-pigeon/core': patch
'@lit-pigeon/renderer-mjml': patch
'@lit-pigeon/parser-mjml': patch
'@lit-pigeon/angular': patch
'@lit-pigeon/react': patch
---

Put the `types` condition first in `exports` — per the Node/TypeScript
resolution spec it must precede `import`/`require`, otherwise it can never
match. Types still resolved via the top-level `types` fallback, but this
removes the bundler warning and makes conditional type resolution correct.
