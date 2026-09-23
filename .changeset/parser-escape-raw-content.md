---
'@lit-pigeon/parser-mjml': patch
---

Re-escape text and attribute values captured from `mj-text`, `mj-button` and `mj-raw`. The parser decodes entities, so `&lt;b&gt;` used to come back as a real `<b>` tag and `style='font-family:"Open Sans"'` was written back as a broken attribute. `<style>`/`<script>` text and plain-text labels (preview, social, navbar) are left as they were.
