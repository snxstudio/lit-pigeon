---
'@lit-pigeon/editor': patch
---

Sandbox the preview iframe. Rendered email markup (for example an imported `mj-raw` with an `onerror` handler) used to run script in the preview with the host page's origin. Links in the preview still open in a new tab.
