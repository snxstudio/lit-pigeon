# @lit-pigeon/react

React wrapper for the [Lit Pigeon](https://github.com/snxstudio/lit-pigeon)
email editor. Wraps the `<pigeon-editor>` custom element with
[`@lit/react`](https://www.npmjs.com/package/@lit/react) so you get a real
React component with typed `on*` event props.

## Install

```bash
npm install @lit-pigeon/react
```

Requires `react` and `react-dom` (v18 or v19) as peer dependencies.

## Usage

```tsx
import { PigeonEditor } from '@lit-pigeon/react';
import type { PigeonDocument } from '@lit-pigeon/react';

function App() {
  return (
    <PigeonEditor
      onChange={(e) => console.log(e.detail.document)}
      onSelect={(e) => console.log(e.detail.selection)}
      onReady={() => console.log('ready')}
    />
  );
}
```

### Event props

| Prop | DOM event | Detail |
|---|---|---|
| `onChange` | `pigeon:change` | `{ document: PigeonDocument }` |
| `onSelect` | `pigeon:select` | `{ selection: Selection \| null }` |
| `onReady` | `pigeon:ready` | `void` |
| `onPreview` | `pigeon:preview` | `void` |
| `onExport` | `pigeon:export` | `void` |

Every element property is also a prop (`document`, `config`, `renderer`,
`documentToMjml`, `theme`, `themeOverrides`, `templateStorage`,
`assetStorage`), assigned as a DOM property rather than an attribute. Keep
object props stable between renders; a new `document` object reloads the
editor and resets undo history.

There are no props for the export, merge-tag or storage-error events, and no
methods on the component. Attach a `ref` (typed as `PigeonEditor` from
`@lit-pigeon/editor`) to call `exportHtml()`, `exportMjml()`,
`loadDocument()` and the rest, or to add other listeners. `pigeon:change` also
fires when a document is loaded and when only the selection changes.

Core types (`PigeonDocument`, `EditorConfig`, `Selection`, `ContentBlock`,
`RowNode`, `ColumnNode`, `BlockType`, `Spacing`) are re-exported. A full
example is in [Getting started](../../docs/guide/getting-started.md#react).

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
