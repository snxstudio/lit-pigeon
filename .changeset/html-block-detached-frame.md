---
'@lit-pigeon/editor': patch
---

Stop the HTML block's resize observer throwing `Cannot read properties of null (reading 'body')` after the document is replaced and its preview frame is detached.
