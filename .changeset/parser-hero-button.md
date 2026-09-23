---
'@lit-pigeon/parser-mjml': patch
---

mj-hero keeps its button and text styling on import. Each mj-text becomes its own block, so separate texts no longer run together. Colour, font size and font family go in the same inline span as other text, and alignment, weight, line height and padding go on a wrapping `<div>`. Each mj-button becomes the button table MJML renders, keeping its link, colours, font and padding, where previously only the label text survived. A lone mj-text (the shape the renderer writes) is read back unchanged, with its padding as the hero's inner padding, so saved templates import again unchanged. Other hero children are reported with a parse warning instead of being dropped silently.
