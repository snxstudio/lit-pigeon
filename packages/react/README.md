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

Set the initial document and config as props (they are assigned as live DOM
properties, never stringified). Core types — `PigeonDocument`, `EditorConfig`,
`Selection`, `ContentBlock`, and friends — are re-exported for convenience.

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
