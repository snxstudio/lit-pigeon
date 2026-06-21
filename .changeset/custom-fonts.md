---
"@lit-pigeon/editor": minor
"@lit-pigeon/core": minor
"@lit-pigeon/renderer-mjml": minor
---

Custom font management. Register web fonts via `fontConfig`: the editor's font picker lists configured and brand fonts, the preview and export load them, and the MJML renderer emits `<mj-font>` for each registered font. `@lit-pigeon/core` adds the `FontDefinition` type and `fontConfig` / `RenderOptions.fonts`.
