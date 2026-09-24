# @lit-pigeon/vue

Vue 3 wrapper for the [Lit Pigeon](../../README.md) email editor.

## Install

```bash
npm install @lit-pigeon/vue vue
```

## Usage

```vue
<script setup lang="ts">
import { shallowRef } from 'vue';
import { PigeonEditor, type PigeonDocument } from '@lit-pigeon/vue';

const props = defineProps<{ initialDoc?: PigeonDocument }>();
// shallowRef: never wrap editor documents in a deep reactive proxy.
const latest = shallowRef<PigeonDocument | undefined>(props.initialDoc);

function onChange(payload: { document: PigeonDocument }) {
  latest.value = payload.document;
}
</script>

<template>
  <PigeonEditor :document="props.initialDoc" style="display: block; height: 80vh" @change="onChange" />
</template>
```

### Props

| Prop | Type | Description |
|---|---|---|
| `document` | `PigeonDocument` | Initial document. If omitted a blank document is created. |
| `config` | `Partial<EditorConfig>` | Editor configuration (asset manager, merge tags, etc.). |
| `renderer` | `Renderer` | Optional MJML/HTML renderer for preview + export. |
| `documentToMjml` | `(doc) => string` | Optional MJML serializer. |

Props left `undefined` are not passed on. Other attributes fall through to the
element, so `theme="dark"` works; `themeOverrides`, `templateStorage` and
`assetStorage` have no prop.

### Events

`change`, `select`, `ready`, `preview`, `exportHtml`, `exportMjml`,
`exportJson`, `mergeTagRequest` — each emits the original
`CustomEvent#detail` payload from the underlying `<pigeon-editor>`
custom element. The `exportHtml` payload is `{ document, html }`, with `html`
`null` when no renderer is set (the emit is declared as `{ html: string }`).

### Methods

The component exposes no methods. Its root element is the `<pigeon-editor>`
element, so use a template ref's `$el` to call `exportHtml()`,
`exportMjml()`, `loadDocument()` and the rest; see
[Events and API](../../docs/guide/events-and-api.md#vue-lit-pigeonvue-015).

## How it works

The component renders a `<pigeon-editor>` custom element via a
render function and binds props as live DOM properties (not stringified
attributes) so the Lit element receives them unchanged. Vue 3's
built-in custom-element interop makes this a single-file wrapper — no
adapter library required.

## License

MIT
