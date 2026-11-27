---
'@lit-pigeon/parser-mjml': patch
---

Read `mj-column` widths on import instead of splitting every row evenly. A section whose columns declare widths — as a percentage, in pixels, or a bare number MJML reads as pixels — now sets the row's column ratios from them, so a 33/67 sidebar layout no longer comes back as 50/50. Pixel widths are resolved against the body width, columns that declare no width take an equal share of what is left, and a section whose widths overflow the body warns rather than silently rescaling. Sections whose columns declare no width at all are unchanged.
