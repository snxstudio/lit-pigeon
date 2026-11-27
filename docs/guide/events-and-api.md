# Events and API

This is the reference for `<pigeon-editor>`'s events and methods (from
`@lit-pigeon/editor` 0.3.3) and for each framework wrapper's inputs, outputs
and methods. The event behaviour described here is pinned by
[`examples/test/events.test.ts`](./examples/test/events.test.ts).

## Events

All events are `CustomEvent`s dispatched on the `<pigeon-editor>` element with
`bubbles: true` and `composed: true`.

| Event | `detail` | Fires when |
|---|---|---|
| `pigeon:ready` | `null` | Once, after the element's first render. Moving the element in the DOM does not fire it again. |
| `pigeon:change` | `{ document: PigeonDocument }` | After every change of editor state: every edit, every selection change, and every document load (setting `document` or calling `loadDocument()`). |
| `pigeon:select` | `{ selection: Selection \| null }` | After every edit and selection change (not on document load). |
| `pigeon:preview` | `null` | The toolbar's Preview button is clicked. With a `renderer`, the built-in preview also opens. See the known issue below. |
| `pigeon:export` | `null` | The toolbar's Export menu is opened. |
| `pigeon:export-html` | `{ document, html: string \| null }` | The user chooses Export HTML. `html` comes from `renderer` and is `null` without one. Fires after rendering, so it is asynchronous. |
| `pigeon:export-mjml` | `{ document, mjml: string \| null }` | The user chooses Export MJML. `mjml` is `null` without `documentToMjml`. |
| `pigeon:export-json` | `{ document }` | The user chooses Export JSON. |
| `pigeon:preview-open` | `null` | The built-in preview opens, however it was opened — the toolbar button or `showPreview()`. Not fired when it was already open. |
| `pigeon:preview-close` | `null` | The built-in preview closes, however it was closed — its own × button, Escape, a click on the overlay, or `hidePreview()`. Not fired when it was already closed. |
| `pigeon:merge-tag-request` | `null` | The user clicks a Tag button while `config.mergeTags` is set but has no tags. Answer with `setMergeTags()`. |
| `brand-kit-change` | `{ brandKit: BrandKit }` | The user edits the active brand kit in the Brand tab. Fires before the storage `save()`. |
| `brand-kit-error` | `{ error, operation: 'list' \| 'save' }` | A `BrandKitStorage` call from `config.brandKit` rejected. |
| `row-library-error` | `{ error, operation: 'save' \| 'delete' }` | A `RowLibraryStorage` call from `config.rowLibrary` rejected. |

`Selection` is `{ type: 'block' | 'row' | 'column' | 'body'; rowId?; columnId?; blockId? }`.

The editor's toolbar exports do not download anything; they only fire these
events. Your application decides what Export means.

Other events bubble out of the element's shadow DOM (for example
`property-change` and `block-select`). They are internal and may change without
notice; do not rely on them.

### Typed listeners

The package does not declare an event map for TypeScript, so a small helper is
useful:

<!-- snippet: src/events/event-map.ts -->
```ts
import type { PigeonEditor } from '@lit-pigeon/editor';
import type { BrandKit, PigeonDocument, Selection } from '@lit-pigeon/core';

/** The public events of <pigeon-editor>, with their `detail` types. */
export interface PigeonEditorEventMap {
  'pigeon:ready': CustomEvent<null>;
  'pigeon:change': CustomEvent<{ document: PigeonDocument }>;
  'pigeon:select': CustomEvent<{ selection: Selection | null }>;
  'pigeon:preview': CustomEvent<null>;
  'pigeon:export': CustomEvent<null>;
  'pigeon:export-html': CustomEvent<{ document: PigeonDocument; html: string | null }>;
  'pigeon:export-mjml': CustomEvent<{ document: PigeonDocument; mjml: string | null }>;
  'pigeon:export-json': CustomEvent<{ document: PigeonDocument }>;
  'pigeon:merge-tag-request': CustomEvent<null>;
  'brand-kit-change': CustomEvent<{ brandKit: BrandKit }>;
  'brand-kit-error': CustomEvent<{ error: unknown; operation: 'list' | 'save' }>;
  'row-library-error': CustomEvent<{ error: unknown; operation: 'save' | 'delete' }>;
}

/** Adds a typed listener and returns a function that removes it. */
export function listen<K extends keyof PigeonEditorEventMap>(
  editor: PigeonEditor,
  type: K,
  handler: (event: PigeonEditorEventMap[K]) => void,
): () => void {
  const listener = (event: Event) => handler(event as PigeonEditorEventMap[K]);
  editor.addEventListener(type, listener);
  return () => editor.removeEventListener(type, listener);
}
```

### Detecting unsaved changes

Because `pigeon:change` also fires for loads and selection changes, do not
treat every event as an edit. Every edit produces a **new** document object,
and a document that has been edited is frozen, so compare references:

<!-- snippet: src/events/track-changes.ts -->
```ts
import type { PigeonEditor } from '@lit-pigeon/editor';
import type { PigeonDocument } from '@lit-pigeon/core';
import { listen } from './event-map.js';

/**
 * Tracks unsaved changes. pigeon:change fires for loads and selection changes
 * as well as edits, so compare the current document with the last loaded or
 * saved one: every edit produces a new document object.
 */
export function createDirtyTracker(editor: PigeonEditor, onDirtyChange: (dirty: boolean) => void) {
  let baseline = editor.getDocument();
  let dirty = false;
  const update = () => {
    const next = editor.getDocument() !== baseline;
    if (next !== dirty) onDirtyChange((dirty = next));
  };
  const stop = listen(editor, 'pigeon:change', update);
  return {
    /** Load a document without marking the editor dirty. */
    load(document: PigeonDocument) {
      baseline = document;
      editor.loadDocument(document);
    },
    /** Call after a successful save, with the document that was saved. */
    markSaved(document: PigeonDocument) {
      baseline = document;
      update();
    },
    stop,
  };
}
```

Undo also produces a new document object, even when it restores the saved
content, so this tracker reports unsaved changes after undoing back to the
saved state. If that matters, compare `document.body` with the saved one using
`deepEqual` from `@lit-pigeon/core` (`metadata.updatedAt` is not restored by
undo, so compare the body only).

### Known issue: duplicate `pigeon:preview`

In `@lit-pigeon/editor` 0.3.3, the toolbar's own `pigeon:preview` event is not
stopped at the editor boundary. Without a `renderer`, the host receives
`pigeon:preview` **twice** per click; with a `renderer`, it receives it once
while the built-in preview opens. If you handle Preview yourself, debounce the
handler or ignore the second event in the same task.

## Methods

| Method | Returns | Description |
|---|---|---|
| `getDocument()` | `PigeonDocument` | The current document. The same object the last `pigeon:change` carried. |
| `loadDocument(doc)` | `void` | Replaces the document, clears undo history and fires `pigeon:change`. Plugins from `config.plugins` are re-initialised. |
| `undo()` | `boolean` | Undoes the last change; `false` if there was nothing to undo. |
| `redo()` | `boolean` | Redoes the last undone change; `false` if there was nothing to redo. |
| `canUndo()` | `boolean` | Whether `undo()` would change anything. Always `false` under `readonly`. Use it to enable your own Undo button — the built-in toolbar disables on the same value. |
| `canRedo()` | `boolean` | Whether `redo()` would change anything. Always `false` under `readonly`. |
| `showPreview()` | `boolean` | Opens the built-in preview and returns `true`. Without a `renderer` there is nothing to preview, so it fires `pigeon:preview` for you to handle and returns `false` — the same contract as the toolbar's own button. |
| `hidePreview()` | `void` | Closes the built-in preview. |
| `exportJson()` | `PigeonDocument` | Same as `getDocument()`. |
| `exportMjml()` | `string \| null` | `documentToMjml(doc, { fonts })`, or `null` without `documentToMjml`. |
| `exportPlainText()` | `string \| null` | `documentToPlainText(doc)`, or `null` without `documentToPlainText`. |
| `exportHtml()` | `Promise<string \| null>` | The HTML from `renderer.render(doc, { fonts })`, or `null` without a renderer. Render errors are discarded; call the renderer yourself if you need them. |
| `setMergeTags(tags)` | `void` | Replaces `config` with a copy whose `mergeTags.tags` is `tags`. A later assignment of `config` overwrites it. |

`fonts` is `config.fontConfig` plus any brand-kit fonts that have a `url`,
without duplicate families.

As a Lit element, `<pigeon-editor>` also has `updateComplete`, a promise that
resolves after pending renders; await it in tests before inspecting the
element.

## Echoing the document back

The `document` property is compared by reference with the document the editor
currently holds:

- The same object (for example, the one from the latest `pigeon:change`) does
  nothing.
- A different object is loaded with `loadDocument()`: undo history is reset
  and `pigeon:change` fires again.

So it is safe to bind the exact document from the change event back into the
`document` property, as frameworks with two-way binding tend to. It is not safe
to bind a **copy** (from `structuredClone`, a spread, a JSON round trip, a
deep reactive proxy, or a store that copies on write), or to bind an older
document after a delay. Both reload the editor and can lose edits or loop.
[Angular](./angular.md#binding-document-safely) shows the recommended pattern.

## Keyboard shortcuts

Shortcuts act only when the key press is aimed at the editor, or at nothing in
particular (the page body), and never inside inputs, text areas, selects or
content-editable elements. Before `@lit-pigeon/editor` 0.3.3 they also acted on
key presses in the host page's own widgets.

| Keys | Action |
|---|---|
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z, Ctrl+Y | Redo |
| Delete, Backspace | Delete the selected block or row |
| Cmd/Ctrl+D | Duplicate the selected block or row |
| Cmd/Ctrl+C, Cmd/Ctrl+V | Copy the selected block; paste it after the selected block or into the selected column (in-memory clipboard, per editor) |
| Arrow Up, Arrow Down | Select the previous or next block or row |
| Escape | Select the body (clear the block or row selection) |

While a block is in inline text editing, the rich-text editor handles all keys.

## Framework wrappers

### React (`@lit-pigeon/react` 0.1.6)

`PigeonEditor` is created with `@lit/react`'s `createComponent`, so every
element property is also a prop (`document`, `config`, `renderer`,
`documentToMjml`, `theme`, `themeOverrides`, `templateStorage`,
`assetStorage`), set as a property rather than an attribute.

| Prop | Event | `detail` |
|---|---|---|
| `onChange` | `pigeon:change` | `{ document }` |
| `onSelect` | `pigeon:select` | `{ selection }` |
| `onReady` | `pigeon:ready` | `null` |
| `onPreview` | `pigeon:preview` | `null` |
| `onExport` | `pigeon:export` | `null` |

There are no props for the export, merge-tag or storage-error events. Attach a
`ref` (typed as the `PigeonEditor` class from `@lit-pigeon/editor`), and call
the element's methods or `addEventListener` on it. Keep object props stable
between renders (`useState`, `useMemo` or module scope); a new `document`
object on every render reloads the editor.

### Vue (`@lit-pigeon/vue` 0.1.5)

| Prop | Type |
|---|---|
| `document` | `PigeonDocument` |
| `config` | `Partial<EditorConfig>` |
| `renderer` | `Renderer` |
| `documentToMjml` | `(doc) => string` |

| Emit | Event | Payload (the event's `detail`) |
|---|---|---|
| `change` | `pigeon:change` | `{ document }` |
| `select` | `pigeon:select` | `{ selection }` |
| `ready` | `pigeon:ready` | `null` |
| `preview` | `pigeon:preview` | `null` |
| `exportHtml` | `pigeon:export-html` | `{ document, html }` (declared as `{ html: string }`) |
| `exportMjml` | `pigeon:export-mjml` | `{ document, mjml }` |
| `exportJson` | `pigeon:export-json` | `{ document }` |
| `mergeTagRequest` | `pigeon:merge-tag-request` | `null` |

Other attributes fall through to the element, so `theme="dark"` works;
`themeOverrides`, `templateStorage` and `assetStorage` have no prop. The
component exposes no methods, but its root element is the `<pigeon-editor>`
element:

<!-- snippet: src/events/VueEditorMethods.vue -->
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { PigeonEditor } from '@lit-pigeon/vue';
import type { PigeonEditor as PigeonEditorElement } from '@lit-pigeon/editor';
import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';

const renderer = new MjmlRenderer();
const wrapper = ref<{ $el: PigeonEditorElement } | null>(null);

// The wrapper's root element is the <pigeon-editor> element itself.
async function exportHtml(): Promise<string | null> {
  return (await wrapper.value?.$el.exportHtml()) ?? null;
}

defineExpose({ exportHtml });
</script>

<template>
  <PigeonEditor ref="wrapper" :renderer="renderer" theme="dark" style="display: block; height: 80vh" />
</template>
```

Props left `undefined` are not passed on. Keep documents in `shallowRef` or
`markRaw` (see [Getting started](./getting-started.md#vue)).

### Svelte (`@lit-pigeon/svelte` 0.1.5)

Props and events are the same as Vue's (`document`, `config`, `renderer`,
`documentToMjml`; `on:change`, `on:select`, `on:ready`, `on:preview`,
`on:exportHtml`, `on:exportMjml`, `on:exportJson`, `on:mergeTagRequest`).
`exportHtml` is declared as `{ html: string }` but also carries `document`, and
`html` can be `null`. Extra attributes are not passed on, so `theme` and
`themeOverrides` must be set on the element. The component exposes no methods
or element reference; find the element inside a container you own:

<!-- snippet: src/events/SvelteEditorMethods.svelte -->
```svelte
<script lang="ts">
  import { PigeonEditor } from '@lit-pigeon/svelte';
  import type { PigeonEditor as PigeonEditorElement } from '@lit-pigeon/editor';
  import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';

  const renderer = new MjmlRenderer();
  let container: HTMLDivElement;

  // The wrapper does not expose the element, so find it inside a container you own.
  export async function exportHtml(): Promise<string | null> {
    const editor = container.querySelector<PigeonEditorElement>('pigeon-editor');
    return (await editor?.exportHtml()) ?? null;
  }
</script>

<div bind:this={container} style="height: 80vh">
  <PigeonEditor {renderer} />
</div>
```

### Angular (`@lit-pigeon/angular` 0.2.0)

Inputs: `document`, `config`, `renderer`, `documentToMjml`, `theme`,
`themeOverrides`, `templateStorage`, `assetStorage`.
Outputs: `pigeonChange`, `pigeonSelect`, `pigeonReady`, `pigeonPreview`,
`pigeonExport`, `pigeonExportJson`, `pigeonExportMjml`, `pigeonExportHtml`.
Methods: `getDocument()`, `loadDocument(doc)`, `undo()`, `redo()`,
`exportMjml()`, `exportHtml()`.
Details, payload types and caveats are in [Angular](./angular.md#inputs-outputs-and-methods).

### Wrapper coverage at a glance

| | React | Vue | Svelte | Angular |
|---|---|---|---|---|
| `document`, `config`, `renderer`, `documentToMjml` | Yes | Yes | Yes | Yes |
| `theme` | Yes | As an attribute | No | Yes |
| `themeOverrides`, `templateStorage`, `assetStorage` | Yes | No | No | Yes |
| Change, select, ready, preview events | Yes | Yes | Yes | Yes |
| `pigeon:export` | Yes | No | No | Yes |
| Export HTML, MJML, JSON events | No | Yes | Yes | Yes |
| `pigeon:merge-tag-request` | No | Yes | Yes | No |
| Methods | Through a ref | Through `$el` | Through a container | On the component |

For anything a wrapper lacks, use the element directly.
