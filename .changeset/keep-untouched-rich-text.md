---
'@lit-pigeon/editor': patch
---

Entering and leaving inline edit on a text block without changing anything (by blur or Escape) now keeps the stored HTML byte for byte. Previously TipTap's normalisation rewrote imported markup, such as inline `<span style="color:...">` or `<b>`, and added an undo step.
