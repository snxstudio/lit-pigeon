---
'@lit-pigeon/parser-mjml': patch
---

HTML comments inside mj-raw, mj-text, mj-button and the other raw tags are now kept on import. Previously they were dropped, which silently removed Outlook `<!--[if mso]>` conditional blocks.
