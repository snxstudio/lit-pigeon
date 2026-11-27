---
'@lit-pigeon/core': minor
'@lit-pigeon/renderer-mjml': minor
'@lit-pigeon/parser-mjml': minor
'@lit-pigeon/import-unlayer': minor
'@lit-pigeon/editor': minor
---

Extend device visibility to rows. `RowNode.attributes` now takes `hideOnMobile` / `hideOnDesktop`, rendered as the existing `pigeon-hide-*` classes on `mj-section` and read back by the parser, with a toggle and canvas badge to match blocks and columns. The mobile restore rule gained a `table` selector, without which a hidden full-width row never came back on mobile — MJML wraps a full-width section in a table rather than a div.

`@lit-pigeon/import-unlayer` now maps Unlayer's `hideDesktop` and `_override.mobile.hideMobile` onto these flags for rows, columns and blocks, instead of dropping them.
