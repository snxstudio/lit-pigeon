---
'@lit-pigeon/editor': patch
---

Fix the preview panel opening blank in Chrome.

The preview iframe was created with an empty `srcdoc` and given the rendered email a moment later. Chrome drops the second load on a sandboxed iframe, so the panel opened on a white page. The panel now creates a new iframe for each rendered email.

`pigeon:preview` now reaches the host once per click of the toolbar's Preview button. The toolbar's own event escaped the editor, so a host without a `renderer` received it twice.
