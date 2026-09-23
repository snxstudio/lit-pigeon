---
'@lit-pigeon/renderer-mjml': patch
---

Fix quadratic backtracking in the `<mj-raw>` escape applied to html-block content. A block whose content held a `<` followed by a long run of whitespace could occupy the renderer for minutes — reachable by anyone who can POST a document to a hosted `/render`. The pattern accepts exactly the same strings as before.
