---
'@lit-pigeon/renderer-mjml': patch
---

Keep display conditions and row repeats in the plain-text part.

`documentToPlainText` predates block-level display conditions and row repeats, and neither updated it, so the `text/plain` and `text/html` parts of the same email disagreed about what the reader gets.

- A block's `condition` was dropped entirely, so content the sender marked conditional was delivered to every recipient in the text part while the HTML part hid it correctly. Blocks are now wrapped in `{{#if …}}` the way the renderer already wraps them.
- A row's `repeat` was dropped, so an itemised row appeared once, with merge tags written to resolve against the item resolving against the root instead — the plain-text part of an order confirmation had no line items. Rows are now wrapped in `{{#each …}}`, nested inside any condition exactly as `renderRow` nests them.

A wrapper is only written around a body that produced text, so an empty block does not leave a bare `{{#if}}{{/if}}` in the message. A test now asserts the two parts carry the same wrappers, so the next feature of this kind cannot land in one renderer only.
