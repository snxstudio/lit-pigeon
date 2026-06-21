---
"@lit-pigeon/editor": minor
---

Drag content blocks to reorder them within a column. Each block now exposes a hover-revealed drag handle (mirroring the row drag handle) that emits an `existing-block` drag, leaving click-to-select and inline text editing unaffected. A latent same-column off-by-one is fixed: the visual drop index is translated through the post-removal splice index and no-op drops are skipped.
