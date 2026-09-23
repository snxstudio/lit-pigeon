---
'@lit-pigeon/editor': patch
---

Moving `<pigeon-editor>` in the DOM (a host dialog or tab re-attaching it) no longer resets the document and undo history to the initial `document`. State is created once and kept across disconnect and reconnect, and keyboard shortcuts keep working after the move.
