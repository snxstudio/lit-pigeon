---
"@lit-pigeon/core": patch
"@lit-pigeon/editor": patch
"@lit-pigeon/renderer-mjml": patch
"@lit-pigeon/parser-mjml": patch
"@lit-pigeon/react": patch
"@lit-pigeon/angular": patch
"@lit-pigeon/vue": patch
"@lit-pigeon/svelte": patch
"@lit-pigeon/ssr": patch
"@lit-pigeon/rest": patch
"@lit-pigeon/mcp-server": patch
"@lit-pigeon/figma-import": patch
"@lit-pigeon/blocks": patch
"@lit-pigeon/lint": patch
---

Packaging hygiene: every package now ships a `LICENSE` file and a `README` in
its npm tarball (10 packages previously had no README on the registry), and
declares `homepage`, `bugs`, `author`, and `keywords`. No API changes. Also
corrects a stale repo link in the Svelte package README.
