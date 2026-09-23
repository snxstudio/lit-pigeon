---
'@lit-pigeon/parser-mjml': patch
---

Void elements (`<br>`, `<img>`, `<hr>` and the rest) inside mj-text, mj-raw and other raw tags are no longer re-emitted with a closing tag. Previously `<br/>` became `<br></br>`, which browsers render as two line breaks.
