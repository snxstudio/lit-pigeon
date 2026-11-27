---
'@lit-pigeon/core': minor
'@lit-pigeon/renderer-mjml': minor
'@lit-pigeon/parser-mjml': minor
'@lit-pigeon/editor': minor
---

Keep a row's columns side by side on mobile. `RowNode.attributes.noStackOnMobile` renders the row's columns inside an MJML `<mj-group>`, so a logo beside a nav stays that way on a phone instead of stacking into two full-width bands. The row property panel exposes it as "Do not stack on mobile", and the MJML parser now reads `mj-group` onto the flag rather than discarding it — a grouped header imported from elsewhere used to come back stacking, silently. A section that mixes a group with loose columns, or holds more than one, cannot be described by a row-level flag, so it is flattened with a warning instead of quietly changing the other columns. Rows that do not set the flag render byte-identically to before.
