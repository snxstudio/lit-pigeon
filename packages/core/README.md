# @lit-pigeon/core

The pure TypeScript engine behind the [Lit Pigeon](https://github.com/snxstudio/lit-pigeon)
email editor — document schema, immutable `EditorState` + `Transaction`
system, commands, undo/redo history, a ProseMirror-inspired plugin registry,
and the starter-template / brand-kit / asset / row-library storage
interfaces. Zero runtime UI dependencies, so it runs in the browser, Node, or
an edge worker.

## Install

```bash
npm install @lit-pigeon/core
```

## Usage

```ts
import {
  createDefaultDocument,
  EditorState,
  createHistoryPlugin,
  validateDocument,
  getStarterTemplates,
} from '@lit-pigeon/core';

// Start from a blank document, or a starter template.
const doc = createDefaultDocument();
const [welcome] = getStarterTemplates(); // welcome / newsletter / transactional / promo
// welcome.document is a PigeonDocument

// Drive edits through immutable transactions (with undo/redo history).
let state = EditorState.create({ doc, plugins: [createHistoryPlugin()] });
const tr = state.createTransaction();
// ...apply command steps to `tr`, then:
state = state.apply(tr);

// Validate before rendering / persisting.
const errors = validateDocument(state.doc);
```

`PigeonDocument` is a plain JSON tree (`body → rows → columns → blocks`), so it
serialises anywhere. Render it to email HTML with
[`@lit-pigeon/renderer-mjml`](../renderer-mjml) or
[`@lit-pigeon/ssr`](../ssr).

Also exported: the command set (`insertBlock`, `moveBlock`, `insertRow`,
`resizeColumns`, …), `createBlock`/`createRow` factories, `undo`/`redo`, the
block registry (`registerBlock`, `getBlockDefinition`), and in-memory storage
adapters (`InMemoryTemplateStorage`, `InMemoryBrandKitStorage`,
`InMemoryAssetStorage`, `InMemoryRowLibraryStorage`).

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
