---
'@lit-pigeon/editor': patch
---

`pigeon:export` and `pigeon:merge-tag-request` now actually fire. `pigeon:export` fires when the toolbar's Export menu opens. When `config.mergeTags` is set without static `tags`, the text, HTML and body panels show the Tag button, and clicking it fires `pigeon:merge-tag-request` so the host can supply tags with `setMergeTags()`.
