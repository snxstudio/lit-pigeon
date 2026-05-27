# @lit-pigeon/svelte

Svelte wrapper for the [Lit Pigeon](https://github.com/snxstudio/unnlayer)
email editor. Renders the `<pigeon-editor>` custom element and bridges
object-shaped props + DOM `CustomEvent`s into idiomatic Svelte props and
events.

Works with **Svelte 4 and Svelte 5** (uses the legacy `export let` API, which
Svelte 5 fully supports).

## Install

```bash
npm install @lit-pigeon/svelte
```

## Usage

```svelte
<script lang="ts">
  import { PigeonEditor } from '@lit-pigeon/svelte';
  import type { PigeonDocument } from '@lit-pigeon/svelte';

  let doc: PigeonDocument | undefined;

  function onChange(event: CustomEvent<{ document: PigeonDocument }>) {
    doc = event.detail.document;
  }

  function onReady() {
    console.log('Pigeon editor ready');
  }
</script>

<PigeonEditor
  document={doc}
  on:change={onChange}
  on:ready={onReady}
  on:exportHtml={(e) => console.log(e.detail.html)}
/>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `document` | `PigeonDocument` | Initial document. Set as a DOM property — never stringified into an attribute. |
| `config` | `Partial<EditorConfig>` | Editor configuration (merge tags, asset manager, plugins). |
| `renderer` | `Renderer` | Optional renderer for preview mode (e.g. `MjmlRenderer`). |
| `documentToMjml` | `(doc: PigeonDocument) => string` | Custom document → MJML converter. |

## Events

All native `pigeon:*` events are re-emitted as Svelte events with the original
`event.detail` payload preserved:

| DOM event | Svelte event | Detail |
|---|---|---|
| `pigeon:change` | `change` | `{ document: PigeonDocument }` |
| `pigeon:select` | `select` | `{ selection: Selection \| null }` |
| `pigeon:ready` | `ready` | `void` |
| `pigeon:preview` | `preview` | `unknown` |
| `pigeon:export-html` | `exportHtml` | `{ html: string }` |
| `pigeon:export-mjml` | `exportMjml` | `{ mjml: string \| null }` |
| `pigeon:export-json` | `exportJson` | `{ document: PigeonDocument }` |
| `pigeon:merge-tag-request` | `mergeTagRequest` | `unknown` |

## Why a property, not an attribute?

`document`, `config`, `renderer`, and `documentToMjml` are object/function
shaped — serialising them to HTML attributes would lose identity, function
references, and prototype chains. The wrapper assigns them with `el.document
= value`, matching how the React, Vue, and Angular wrappers do it.

## License

MIT
