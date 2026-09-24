# Getting started

This page takes you from installation to a working editor that reports
changes and exports MJML and HTML, once for each supported way of embedding
it: the plain web component, React, Vue, Svelte and Angular. Pick the section
for your framework; the concepts are the same in all of them.

## How the pieces fit

| Package | What it does |
|---|---|
| `@lit-pigeon/editor` | Defines the `<pigeon-editor>` custom element. Importing it once registers the element. |
| `@lit-pigeon/core` | The document model (`PigeonDocument`), types and helpers. Installed with the editor. |
| `@lit-pigeon/renderer-mjml` | Converts a document to MJML (`documentToMjml`) and compiles it to email HTML (`MjmlRenderer`). |
| `@lit-pigeon/parser-mjml` | Converts existing MJML into a document (`mjmlToDocument`). |
| `@lit-pigeon/react`, `vue`, `svelte`, `angular` | Thin framework wrappers around `<pigeon-editor>`. |

The editor edits a JSON `PigeonDocument`. It does not render HTML by itself:
give it a `renderer` for the Preview button and `exportHtml()`, and a
`documentToMjml` function for `exportMjml()`. Without them, those calls return
`null`.

## Bundling the renderer for the browser

`@lit-pigeon/renderer-mjml` depends on `mjml`, which only runs in Node.js.
Every browser bundler (Vite, webpack, esbuild, the Angular CLI) fails with
errors such as `Could not resolve "fs"` until `mjml` is replaced by its
browser build, `mjml-browser`. Add an override to your application's
`package.json`, then reinstall from a clean tree (delete the lockfile and
`node_modules`):

<!-- snippet: src/angular/package-overrides.json -->
```json
{
  "overrides": {
    "mjml": "npm:mjml-browser@^4.18.0"
  }
}
```

pnpm uses `pnpm.overrides` and Yarn uses `resolutions`; the value is the same.
In Vite you can instead alias `mjml` to `mjml-browser` in `resolve.alias`.
If you only render on the server, you do not need this; see
[Server-side rendering](./server-side.md).

## Web component (no framework)

```bash
npm install @lit-pigeon/editor @lit-pigeon/renderer-mjml
```

Give the element a height. It fills its container and does not size itself.

<!-- snippet: src/getting-started/index.html -->
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Email editor</title>
    <style>
      html, body { height: 100%; margin: 0; }
      pigeon-editor { display: block; height: 100vh; }
    </style>
  </head>
  <body>
    <pigeon-editor></pigeon-editor>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

<!-- snippet: src/getting-started/main.ts -->
```ts
import '@lit-pigeon/editor';
import type { PigeonEditor } from '@lit-pigeon/editor';
import type { PigeonDocument } from '@lit-pigeon/core';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

const editor = document.querySelector<PigeonEditor>('pigeon-editor')!;

// Object and function values are set as properties, never as attributes.
editor.renderer = new MjmlRenderer();
editor.documentToMjml = documentToMjml;

let latest: PigeonDocument | undefined;
editor.addEventListener('pigeon:change', (event) => {
  latest = (event as CustomEvent<{ document: PigeonDocument }>).detail.document;
});

export async function save(): Promise<{ mjml: string | null; html: string | null }> {
  return { mjml: editor.exportMjml(), html: await editor.exportHtml() };
}

export function lastChange(): PigeonDocument | undefined {
  return latest;
}
```

Two details worth knowing:

- The published type declarations do not add `pigeon-editor` to
  `HTMLElementTagNameMap`, so pass the type to `querySelector` as above.
- `pigeon:change` fires on every edit, and also whenever a document is loaded
  (by setting `document` or calling `loadDocument()`).

## React

```bash
npm install @lit-pigeon/react @lit-pigeon/renderer-mjml
```

`@lit-pigeon/react` supports React 18 and 19. It exposes `onChange`,
`onSelect`, `onReady`, `onPreview` and `onExport`; use a ref for the element's
methods.

<!-- snippet: src/getting-started/ReactEmailEditor.tsx -->
```tsx
import { useRef, useState } from 'react';
import { PigeonEditor, type PigeonDocument } from '@lit-pigeon/react';
import type { PigeonEditor as PigeonEditorElement } from '@lit-pigeon/editor';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

// Create the renderer once, outside the component, so the prop stays stable.
const renderer = new MjmlRenderer();

interface Props {
  initial?: PigeonDocument;
  onSave: (result: { mjml: string | null; html: string | null }) => void;
}

export function EmailEditor({ initial, onSave }: Props) {
  const editorRef = useRef<PigeonEditorElement>(null);
  // Keep the initial document stable: a new object on every render reloads the editor.
  const [document] = useState(initial);
  const [dirty, setDirty] = useState(false);

  async function save() {
    const editor = editorRef.current;
    if (!editor) return;
    onSave({ mjml: editor.exportMjml(), html: await editor.exportHtml() });
    setDirty(false);
  }

  return (
    <>
      <PigeonEditor
        ref={editorRef}
        document={document}
        renderer={renderer}
        documentToMjml={documentToMjml}
        style={{ display: 'block', height: '80vh' }}
        // pigeon:change also fires when a document is loaded; only a new object is an edit.
        onChange={(e) => setDirty(e.detail.document !== document)}
      />
      <button type="button" onClick={save} disabled={!dirty}>
        Save
      </button>
    </>
  );
}
```

Import `@lit-pigeon/editor` as a type only, as above; the React package already
registers the element.

## Vue

```bash
npm install @lit-pigeon/vue @lit-pigeon/renderer-mjml
```

`@lit-pigeon/vue` requires Vue 3.4 or later. It re-emits the element's events
as `change`, `select`, `ready`, `preview`, `exportHtml`, `exportMjml`,
`exportJson` and `mergeTagRequest`, each with the original `detail` as the
payload. The wrapper does not expose the element's methods, so this example
renders with the renderer directly.

<!-- snippet: src/getting-started/VueEmailEditor.vue -->
```vue
<script setup lang="ts">
import { shallowRef } from 'vue';
import { PigeonEditor, type PigeonDocument } from '@lit-pigeon/vue';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

const props = defineProps<{ initial?: PigeonDocument }>();
const emit = defineEmits<{ save: [result: { mjml: string; html: string }] }>();

const renderer = new MjmlRenderer();
// shallowRef: the editor's documents must not be wrapped in a deep reactive proxy.
const latest = shallowRef<PigeonDocument | undefined>(props.initial);

function onChange(payload: { document: PigeonDocument }) {
  latest.value = payload.document;
}

async function save() {
  if (!latest.value) return;
  const mjml = documentToMjml(latest.value);
  const { html } = await renderer.render(latest.value);
  emit('save', { mjml, html });
}
</script>

<template>
  <PigeonEditor
    :document="props.initial"
    :renderer="renderer"
    :document-to-mjml="documentToMjml"
    style="display: block; height: 80vh"
    @change="onChange"
  />
  <button type="button" @click="save">Save</button>
</template>
```

Store documents in `shallowRef` (or `markRaw` them). A deep `ref` wraps the
document in a proxy, and passing the proxy back as `:document` is a different
object from the one the editor holds, which makes it reload.

## Svelte

```bash
npm install @lit-pigeon/svelte @lit-pigeon/renderer-mjml
```

`@lit-pigeon/svelte` supports Svelte 4 and 5 (it uses the `export let` props
syntax, which Svelte 5 still accepts). Events are the same as in Vue and are
listened to with `on:`.

<!-- snippet: src/getting-started/SvelteEmailEditor.svelte -->
```svelte
<script lang="ts">
  import { PigeonEditor, type PigeonDocument } from '@lit-pigeon/svelte';
  import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

  export let initial: PigeonDocument | undefined = undefined;
  export let onSave: (result: { mjml: string; html: string }) => void = () => {};

  const renderer = new MjmlRenderer();
  let latest: PigeonDocument | undefined = initial;

  function handleChange(event: CustomEvent<{ document: PigeonDocument }>) {
    latest = event.detail.document;
  }

  async function save() {
    if (!latest) return;
    const mjml = documentToMjml(latest);
    const { html } = await renderer.render(latest);
    onSave({ mjml, html });
  }
</script>

<div style="height: 80vh">
  <PigeonEditor document={initial} {renderer} {documentToMjml} on:change={handleChange} />
</div>
<button type="button" on:click={save}>Save</button>
```

Bind `document` to the initial document, not to `latest`, unless you bind
exactly the object from the change event (see
[Events and API](./events-and-api.md#echoing-the-document-back)).

## Angular

```bash
npm install @lit-pigeon/angular @lit-pigeon/renderer-mjml
```

`@lit-pigeon/angular` 0.2.0 requires Angular 22 or later. Import the standalone
`PigeonEditorComponent`; its selector is `pigeon-editor-wrapper`.

<!-- snippet: src/getting-started/email-editor.component.ts -->
```ts
import { Component, output, viewChild } from '@angular/core';
import { PigeonEditorComponent } from '@lit-pigeon/angular';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

@Component({
  selector: 'app-email-editor',
  imports: [PigeonEditorComponent],
  template: `
    <pigeon-editor-wrapper
      [renderer]="renderer"
      [documentToMjml]="toMjml"
      (pigeonChange)="dirty = true"
      style="display: block; height: 80vh"
    />
    <button type="button" (click)="save()" [disabled]="!dirty">Save</button>
  `,
})
export class EmailEditorComponent {
  readonly saved = output<{ mjml: string | null; html: string | null }>();

  protected readonly renderer = new MjmlRenderer();
  protected readonly toMjml = documentToMjml;
  protected dirty = false;

  private readonly editor = viewChild.required(PigeonEditorComponent);

  async save(): Promise<void> {
    const editor = this.editor();
    this.saved.emit({ mjml: editor.exportMjml(), html: await editor.exportHtml() });
    this.dirty = false;
  }
}
```

Angular needs a few build settings (the `mjml-browser` override,
`allowedCommonJsDependencies`, a lazy route for the bundle budget, and a
workaround for development builds). They are described in
[Angular](./angular.md).

## Next steps

- [Load and save](./load-and-save.md): store templates as MJML and HTML, or as
  JSON.
- [Images and uploads](./images-and-uploads.md): send uploads to your own API.
- [Merge tags and personalisation](./merge-tags-and-personalisation.md).
- [Configuration](./configuration.md): every `EditorConfig` field.
