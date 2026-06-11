---
'@lit-pigeon/editor': patch
---

Fix the TS2322 strictFunctionTypes error in the FontSize TipTap extension: the `renderHTML` callback parameter is now contextually typed by TipTap's `Attribute` interface instead of an over-narrow explicit annotation. The package now passes `tsc --noEmit` with zero errors.
