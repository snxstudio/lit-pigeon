# @lit-pigeon/editor

The [Lit](https://lit.dev) Web Components UI for the
[Lit Pigeon](https://github.com/snxstudio/lit-pigeon) email editor — canvas,
block palette, property panels, toolbar, drag-and-drop, layers, asset manager,
merge-tag picker, and keyboard shortcuts. Importing the package registers the
`<pigeon-editor>` custom element, so it works in any framework (or none).

## Install

```bash
npm install @lit-pigeon/editor
```

## Usage

Import the package once to define the custom element, then drop it into your
markup:

```html
<script type="module">
  import '@lit-pigeon/editor';
</script>

<pigeon-editor id="editor"></pigeon-editor>

<script type="module">
  const editor = document.querySelector('#editor');

  editor.addEventListener('pigeon:change', (e) => {
    console.log('document', e.detail.document);
  });
  editor.addEventListener('pigeon:ready', () => console.log('ready'));
</script>
```

`document` and `config` are set as live DOM **properties** (never stringified
attributes). The main component class is also exported for direct use or
type imports:

```ts
import { PigeonEditor } from '@lit-pigeon/editor';
```

Prefer a framework wrapper? See
[`@lit-pigeon/react`](../react), [`@lit-pigeon/vue`](../vue),
[`@lit-pigeon/angular`](../angular), and [`@lit-pigeon/svelte`](../svelte).

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
