---
'@lit-pigeon/editor': patch
---

Keep HTML comments, tables, images and wrapper attributes when a text, hero or button block is edited. Outlook `<!--[if mso]>` blocks and a hero button's `<table>`/`<div>` styling used to be destroyed the moment the user typed, because TipTap's schema has no node for them. They are now held out of the schema and restored on commit. Pressing Escape in a hero or button block also commits through the sanitiser again, as blur always did.
