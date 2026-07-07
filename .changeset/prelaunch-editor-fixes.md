---
'@lit-pigeon/editor': patch
---

Fix two editor bugs that broke the first-run experience:

- **Rich-text engine now actually lazy-loads from the published bundle.** The
  build was placing the statically-imported loader/controller modules inside
  the `rich-text` chunk, so `dist/index.js` ended up with a static import of
  that chunk — eagerly pulling TipTap (~150 kB gz) into every consumer bundle
  and defeating the lazy-load design. They now live in a tiny
  `rich-text-bridge` chunk (~0.7 kB gz) and TipTap is only fetched on first
  text edit.
- **Palette items now add a block on click.** Items exposed
  `role="button"` + "Add block" labels but only responded to drag and
  Enter/Space — a plain mouse click did nothing. Click now dispatches the same
  `palette-item-activate` event (with a guard so the click that can follow a
  drag gesture is ignored).
