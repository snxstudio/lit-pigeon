# Custom blocks

You can add your own block types without forking the editor. A block type is a
`BlockDefinition` registered in the global block registry of
`@lit-pigeon/core`. Once registered, it appears in the palette, renders on the
canvas, has an editable property panel, and exports to MJML.

The worked example below is tested in
[`examples/test/custom-blocks.test.ts`](./examples/test/custom-blocks.test.ts).

## `BlockDefinition`

From `@lit-pigeon/core` 0.3.3:

| Field | Type | Purpose |
|---|---|---|
| `type` | `string` | Unique type name stored in `block.type`. Must not clash with a built-in type. |
| `label` | `string` | Shown in the palette and as the property panel title. |
| `icon` | `string` | Shown in the palette as text (for example `'(!)'`); it is not an image or SVG. |
| `defaultValues` | `Record<string, unknown>` | Values for a new block. Deep-copied for each new block. |
| `propertySchema?` | `PropertyField[]` | Generates the property panel. Without it, selecting the block shows only its label. |
| `renderCanvas?` | `(block) => string` | HTML shown on the canvas. Without it, the canvas shows a labelled placeholder. |
| `renderMjml?` | `(block) => string` | An MJML fragment used on export. Without it, the block is written as an `<!-- Unknown block type: … -->` comment and does not appear in the email. |

`PropertyField` is `{ key, label, type, placeholder?, min?, max?, step?, options? }`,
where `type` is `'text'`, `'textarea'`, `'number'`, `'color'`, `'checkbox'` or
`'select'` (`options: { label, value }[]`). Each field reads and writes
`block.values[key]`; `number` fields store numbers and `checkbox` fields store
booleans. Edits go through the normal undo history.

`renderCanvas` and `renderMjml` receive `{ id, type, values }`.

## A complete example: a callout block

<!-- snippet: src/custom-blocks/callout-block.ts -->
```ts
import type { BlockDefinition, CustomBlock, RegisteredBlock } from '@lit-pigeon/core';

/** The values a callout block stores. Custom block values are an open record at runtime. */
export interface CalloutValues {
  title: string;
  body: string;
  tone: 'info' | 'warning';
  background: string;
  showIcon: boolean;
  padding: number;
}

export type CalloutBlock = CustomBlock & { type: 'callout'; values: CalloutValues };

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const read = (block: RegisteredBlock) => block.values as unknown as CalloutValues;

export const calloutBlock: BlockDefinition = {
  type: 'callout',
  label: 'Callout',
  // Shown as text in the palette, so keep it short.
  icon: '(!)',
  defaultValues: {
    title: 'Please note',
    body: 'Your order ships within two working days.',
    tone: 'info',
    background: '#eff6ff',
    showIcon: true,
    padding: 16,
  } satisfies CalloutValues,

  // Generates the property panel; edits are written to block.values[key].
  propertySchema: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'body', label: 'Text', type: 'textarea' },
    {
      key: 'tone',
      label: 'Tone',
      type: 'select',
      options: [
        { label: 'Information', value: 'info' },
        { label: 'Warning', value: 'warning' },
      ],
    },
    { key: 'background', label: 'Background', type: 'color' },
    { key: 'showIcon', label: 'Show icon', type: 'checkbox' },
    { key: 'padding', label: 'Padding (px)', type: 'number', min: 0, max: 48, step: 4 },
  ],

  // HTML for the canvas. It is inserted unsanitised, so escape every value.
  renderCanvas: (block) => {
    const v = read(block);
    const icon = v.showIcon ? (v.tone === 'warning' ? '⚠ ' : 'ℹ ') : '';
    return `<div style="background:${escapeHtml(v.background)};padding:${Number(v.padding)}px;font-family:sans-serif">
      <strong>${icon}${escapeHtml(v.title)}</strong><p style="margin:4px 0 0">${escapeHtml(v.body)}</p></div>`;
  },

  // MJML for export. Also inserted as-is, so escape here too.
  renderMjml: (block) => {
    const v = read(block);
    const icon = v.showIcon ? (v.tone === 'warning' ? '⚠ ' : 'ℹ ') : '';
    return `<mj-text container-background-color="${escapeHtml(v.background)}" padding="${Number(v.padding)}px">
      <strong>${icon}${escapeHtml(v.title)}</strong><br>${escapeHtml(v.body)}</mj-text>`;
  },
};
```

Notes on the example:

- **Escape everything.** `renderCanvas` output is inserted into the canvas with
  Lit's `unsafeHTML`, and `renderMjml` output is inserted into the MJML
  unchanged. Block values come from users and from stored documents, so treat
  them as untrusted.
- The canvas HTML is rendered inside the editor's shadow DOM, so your page's
  stylesheets do not reach it. Use inline styles.
- Keep `renderCanvas` a reasonable preview of `renderMjml`. The Preview button
  shows the real MJML output.

## Registering blocks

<!-- snippet: src/custom-blocks/register.ts -->
```ts
import { registerBlock } from '@lit-pigeon/core';
import { registerStandardBlocks } from '@lit-pigeon/blocks';
import { calloutBlock } from './callout-block.js';

// Register once, before any <pigeon-editor> is created: the palette reads the
// registry when it connects. The registry is global to the page.
registerBlock(calloutBlock);

// Optional: the ready-made catalogue (video, countdown, accordion, table, carousel).
registerStandardBlocks();
```

- The palette reads the registry when it connects. A block registered after an
  editor is on the page does not appear in that editor's palette.
- The registry is a single, page-wide map shared by every editor and by the
  renderer. Registering the same `type` again replaces the definition.
- Register on the server too if you render there: `documentToMjml` looks up
  `renderMjml` in the same registry. Without it, the block is written as a
  comment.
- `PigeonPlugin.blocks` is **not** a way to register blocks in the editor.
  `<pigeon-editor>` does not register the blocks of plugins passed in
  `config.plugins`; only `PluginRegistry.register()` does, and the editor does
  not use it. Call `registerBlock()` directly.

## Creating blocks in code

<!-- snippet: src/custom-blocks/insert-programmatically.ts -->
```ts
import { createBlock, createColumn, createDefaultDocument, createRow, type ContentBlock } from '@lit-pigeon/core';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import './register.js';

// createBlock accepts any registered type and fills in its defaultValues.
const callout = createBlock('callout', { title: 'Delivery update' });

const document = createDefaultDocument('Shipping notice');
// ColumnNode.blocks is typed as the built-in union, so custom blocks need a cast.
document.body.rows.push(createRow([createColumn([callout as ContentBlock])]));

export const mjml = documentToMjml(document);
```

`createBlock(type, overrides?)` throws for a type that is neither built in nor
registered. The document types model only the nine built-in blocks
(`ContentBlock`), so code that handles custom blocks works with `CustomBlock`
or `AnyBlock` and casts at the boundary.

## Validation and custom blocks

`validateDocument()` (and `validateDocumentSafe()` in `@lit-pigeon/ssr`) only
accept the built-in block types. A document containing a custom block fails
with `Invalid block type: callout`, and the `@lit-pigeon/rest` `/render`,
`/render/mjml` and `/lint` endpoints reject it with HTTP 400.

If you validate documents that may contain registered blocks, filter those
errors yourself (for example, ignore `Invalid block type` errors whose type is
known to `getBlockDefinition()`), and render with `@lit-pigeon/ssr` directly
rather than through the REST endpoints.

## Custom blocks and MJML storage

`renderMjml` output is ordinary MJML. When the MJML is parsed again with
`mjmlToDocument`, the block comes back as built-in blocks (the callout above
becomes a text block) and its type and values are lost. If you use custom
blocks, store the JSON document as the source of truth; see
[Load and save](./load-and-save.md#choosing-between-them).

## The standard block catalogue

`@lit-pigeon/blocks` 0.1.5 provides five ready-made definitions: `videoBlock`,
`countdownBlock`, `accordionBlock`, `tableBlock` and `carouselBlock`.
`registerStandardBlocks()` registers all of them; `standardBlocks` is the same
list as an array. They have the same validation and MJML storage caveats as
your own blocks.

## State plugins

A `PigeonPlugin` can keep state that follows every transaction. This example
counts edits and reports each one:

<!-- snippet: src/custom-blocks/edit-counter-plugin.ts -->
```ts
import type { PigeonPlugin } from '@lit-pigeon/core';

export const EDIT_COUNTER = 'edit-counter';

/**
 * A state plugin: counts transactions that changed the document, and reports
 * each change. Pass it in config.plugins before the editor connects.
 */
export function createEditCounterPlugin(onEdit: (count: number) => void): PigeonPlugin {
  return {
    name: EDIT_COUNTER,
    init: () => 0,
    apply: (tr, count) => (tr.steps.length > 0 ? (count as number) + 1 : count),
    onStateChange: (next, previous) => {
      const count = next.plugins.get(EDIT_COUNTER) as number;
      if (count !== previous.plugins.get(EDIT_COUNTER)) onEdit(count);
    },
  };
}
```

- `init(state)` runs when the editor creates its state: when it first
  connects and on every document load. `apply(tr, pluginState)` runs for every
  transaction, including undo and redo, and returns the next state.
  `onStateChange(next, previous)` is for side effects and must not dispatch.
- Pass plugins in `config.plugins` before the editor connects, and see
  [Configuration](./configuration.md) for how the history plugin is added.
- `PigeonPlugin.commands` are not reachable from `<pigeon-editor>`: the editor
  has no method to run a named command. Use commands with your own
  `EditorState` from `@lit-pigeon/core`.
- The editor does not expose its `EditorState`, so reading plugin state from
  outside means capturing it in `onStateChange`, as above.

The lower-level plugin reference, with the `Command`, `Step` and
`Transaction` contracts, is [`docs/plugins/`](../plugins/README.md).
