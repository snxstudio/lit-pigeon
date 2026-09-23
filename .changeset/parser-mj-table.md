---
'@lit-pigeon/parser-mjml': patch
---

`<mj-table>` is no longer dropped as an unknown element. It is imported as an html block holding the `<table>` mjml2html would render, with MJML's defaults applied for any missing width, cellpadding, cellspacing, border, color, font-family, font-size, line-height, align and padding.
