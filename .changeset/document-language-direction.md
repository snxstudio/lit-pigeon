---
'@lit-pigeon/core': minor
'@lit-pigeon/renderer-mjml': minor
'@lit-pigeon/parser-mjml': minor
'@lit-pigeon/import-unlayer': minor
'@lit-pigeon/editor': minor
---

Give the document a language and a text direction. `body.attributes.language` (a BCP 47 tag) and `body.attributes.direction` are written out as `lang` and `dir` on `<mjml>`, which MJML copies onto `<html>` and onto the `role="article"` wrapper it adds for clients that strip `<html>`. Until now every exported email asserted `lang="und"` — the code for "undetermined" — so a screen reader had nothing to pick a voice from. `direction` defaults to the natural direction of `language`, via a new `resolveDirection` export that the editor chrome now shares instead of keeping its own RTL list.

`metadata.name` is now rendered as `<mj-title>`, which fills the previously empty `<title>` and the wrapper's `aria-label`. The parser reads all three back, so the name of an imported template survives instead of always becoming `'Imported Template'`, and `import-unlayer` carries `language` and `textDirection` across, warning on a direction it does not recognise. The body panel gains a language field and a direction control that defaults to Auto.

A document that sets neither attribute renders exactly as before.
