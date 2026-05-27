# @lit-pigeon/vue

Vue 3 wrapper for the [Lit Pigeon](../../README.md) email editor.

## Install

```bash
npm install @lit-pigeon/vue vue
```

## Usage

```vue
<script setup lang="ts">
import { PigeonEditor, type PigeonDocument } from '@lit-pigeon/vue';

function onChange(payload: { document: PigeonDocument }) {
  console.log(payload.document);
}
</script>

<template>
  <PigeonEditor
    :document="initialDoc"
    @change="onChange"
    @ready="() => console.log('Ready')"
  />
</template>
```

### Props

| Prop | Type | Description |
|---|---|---|
| `document` | `PigeonDocument` | Initial document. If omitted a blank document is created. |
| `config` | `Partial<EditorConfig>` | Editor configuration (asset manager, merge tags, etc.). |
| `renderer` | `Renderer` | Optional MJML/HTML renderer for preview + export. |
| `documentToMjml` | `(doc) => string` | Optional MJML serializer. |

### Events

`change`, `select`, `ready`, `preview`, `exportHtml`, `exportMjml`,
`exportJson`, `mergeTagRequest` — each emits the original
`CustomEvent#detail` payload from the underlying `<pigeon-editor>`
custom element.

## How it works

The component renders a `<pigeon-editor>` custom element via a
render function and binds props as live DOM properties (not stringified
attributes) so the Lit element receives them unchanged. Vue 3's
built-in custom-element interop makes this a single-file wrapper — no
adapter library required.

## License

MIT
