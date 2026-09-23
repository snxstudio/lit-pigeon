---
'@lit-pigeon/editor': patch
---

HTML blocks no longer run script in the editor canvas. Their markup (for example imported `mj-raw` with `<img onerror>`, `<script>` or `javascript:` links) is now shown in a sandboxed iframe without script permission, sized to its content. The stored content and the exported MJML/HTML are unchanged.
