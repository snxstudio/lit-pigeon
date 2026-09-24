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
  EditorState,
  createBlock,
  createColumn,
  createDefaultDocument,
  createHistoryPlugin,
  createRow,
  getStarterTemplate,
  insertRow,
  undo,
  validateDocument,
} from '@lit-pigeon/core';

// Start from a blank document, or a starter template
// (starter-welcome, starter-newsletter, starter-transactional, starter-promo).
const doc = createDefaultDocument('Welcome email');
const welcome = getStarterTemplate('starter-welcome')?.document;

// Edits are commands that dispatch transactions; state is immutable.
let state = EditorState.create({ doc, plugins: [createHistoryPlugin()] });
const dispatch = (tr: Parameters<typeof state.apply>[0]) => {
  state = state.apply(tr);
};
insertRow(createRow([createColumn([createBlock('text')])]), 0)(state, dispatch);
undo(state, dispatch);

// Validate untrusted input before rendering or storing it.
const errors = validateDocument(welcome); // [] when valid; [{ path, message }] otherwise
```

`PigeonDocument` is a plain JSON tree (`body → rows → columns → blocks`), so it
serialises anywhere. Render it to email HTML with
[`@lit-pigeon/renderer-mjml`](../renderer-mjml) or
[`@lit-pigeon/ssr`](../ssr).

## API summary

- **Types**: `PigeonDocument`, `RowNode`, `ColumnNode`, the nine built-in block
  types (`TextBlock`, `ImageBlock`, `ButtonBlock`, `DividerBlock`,
  `SpacerBlock`, `SocialBlock`, `HtmlBlock`, `HeroBlock`, `NavBarBlock`),
  `CustomBlock`/`AnyBlock`, `EditorConfig` and its parts (`AssetManagerConfig`,
  `MergeTagConfig`, `FontDefinition`, `LinkType`), `PigeonPlugin`,
  `BlockDefinition`, `Renderer`/`RenderOptions`/`RenderResult`.
- **State**: `EditorState`, `Transaction`, `createDocStep`, selection helpers.
- **Commands**: `insertBlock`, `deleteBlock`, `updateBlock`, `moveBlock`,
  `duplicateBlock`, `insertRow`, `deleteRow`, `moveRow`, `duplicateRow`,
  `updateRowAttributes`, `addColumn`, `removeColumn`, `resizeColumns`.
- **History**: `createHistoryPlugin`, `undo`, `redo`, `canUndo`, `canRedo`.
- **Factories and schema**: `createDefaultDocument`, `createBlock` (built-in or
  registered types), `createRow`, `createColumn`, `validateDocument`,
  `isValidDocument`. Validation accepts only the built-in block types.
- **Block registry**: `registerBlock`, `getBlockDefinition`,
  `getAllBlockDefinitions`, `isKnownBlockType`.
- **Templates and storage**: `getStarterTemplates`, `getStarterTemplate`,
  storage interfaces and in-memory implementations (`InMemoryTemplateStorage`,
  `InMemoryBrandKitStorage`, `InMemoryAssetStorage`,
  `InMemoryRowLibraryStorage`), `cloneRowWithNewIds`, `SYSTEM_LINK_TYPES`.

See the [developer guide](../../docs/guide/README.md) for how these fit
together.

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
