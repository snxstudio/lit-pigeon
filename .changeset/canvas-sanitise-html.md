---
'@lit-pigeon/editor': patch
---

Sanitise the HTML that text, hero, button and custom `renderCanvas` blocks show in the canvas. Imported content such as `<img onerror>`, `<script>`, `<iframe>` or `javascript:` links no longer runs in the host page, while inline styles, tables, fonts, links, images and comments still display. Stored content and exported MJML/HTML are unchanged.
