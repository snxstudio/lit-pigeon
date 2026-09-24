---
'@lit-pigeon/editor': patch
---

Load the TipTap rich-text chunk lazily again. A component shared by the properties panel and the bubble menu (the link-type picker) was bundled into `rich-text.js`, so `index.js` imported that chunk statically and every consumer downloaded TipTap up front. Initial JS for an npm consumer drops from 168.9 kB to 64.8 kB gzipped; TipTap (~142 kB gz) now loads on first text edit, as designed.
