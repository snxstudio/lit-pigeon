---
'@lit-pigeon/renderer-mjml': patch
---

Fix invisible text in exported html blocks. `mj-raw` sits inside a column cell with `font-size: 0px` and gets neither `mj-all` nor `mj-text` defaults, so unstyled html-block text rendered at 0px in the email. The renderer now inlines `font-size: 14px; line-height: 1.5` and the body font family on the html-block wrapper, matching text blocks. Sizes set inside the content still win.
