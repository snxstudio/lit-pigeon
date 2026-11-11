---
'@lit-pigeon/import-unlayer': minor
---

Import Unlayer's `video` and `timer` blocks instead of dropping them. They convert to the `video` and `countdown` blocks from `@lit-pigeon/blocks`, emitted by type name so the importer does not take a dependency on the catalog — a new `plugin-block` warning says when the host has not registered it. `form` still warns, because it genuinely has no equivalent.
