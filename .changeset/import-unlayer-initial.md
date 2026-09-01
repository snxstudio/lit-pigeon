---
'@lit-pigeon/import-unlayer': minor
---

Add `@lit-pigeon/import-unlayer` — converts an Unlayer design JSON export into a `PigeonDocument`, so existing Unlayer templates can be migrated instead of rebuilt.

Covers text, heading, image, button, divider, html, menu and social blocks, plus row/column structure, relative column widths and body-level styling. Import is best-effort and never throws: anything without a Pigeon equivalent is dropped and reported through typed `warnings`.
