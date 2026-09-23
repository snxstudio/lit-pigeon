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
<pigeon-editor style="display: block; height: 100vh"></pigeon-editor>

<script type="module">
  import '@lit-pigeon/editor';
  import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

  const editor = document.querySelector('pigeon-editor');
  editor.renderer = new MjmlRenderer(); // enables Preview and exportHtml()
  editor.documentToMjml = documentToMjml; // enables exportMjml()

  editor.addEventListener('pigeon:change', (e) => {
    console.log('document', e.detail.document);
  });
</script>
```

The element fills its container, so give the container a height. Object and
function values (`document`, `config`, `renderer`, `documentToMjml`,
`themeOverrides`, `templateStorage`, `assetStorage`) are set as **properties**,
never as attributes; `theme` (`light`, `dark`, `auto`) is also an attribute.
In a browser bundle, alias `mjml` to `mjml-browser` for the renderer; see
[Getting started](../../docs/guide/getting-started.md#bundling-the-renderer-for-the-browser).

## API summary

- **Methods**: `getDocument()`, `loadDocument(doc)`, `undo()`, `redo()`,
  `exportJson()`, `exportMjml()`, `exportHtml()`, `setMergeTags(tags)`.
- **Events** (all `CustomEvent`s that bubble and are composed): `pigeon:ready`,
  `pigeon:change` (`{ document }`), `pigeon:select` (`{ selection }`),
  `pigeon:preview`, `pigeon:export`, `pigeon:export-html` (`{ document, html }`),
  `pigeon:export-mjml` (`{ document, mjml }`), `pigeon:export-json`
  (`{ document }`), `pigeon:merge-tag-request`, plus `brand-kit-change`,
  `brand-kit-error` and `row-library-error`.
- **Configuration**: `config` is a `Partial<EditorConfig>` from
  `@lit-pigeon/core`.
- **Styling**: `--pigeon-*` design tokens set on the element, and `::part()`
  names `toolbar`, `palette`, `canvas`, `properties`, `canvas-area`, `panel`,
  `palette-tab`, `palette-item`, `toolbar-button` and `toolbar-button-*`.

The `PigeonEditor` class is exported for type imports. The published types do
not register `pigeon-editor` in `HTMLElementTagNameMap`, so type queries as
`document.querySelector<PigeonEditor>('pigeon-editor')`.

Full reference: [Events and API](../../docs/guide/events-and-api.md) and
[Configuration](../../docs/guide/configuration.md).

Known issue in 0.3.3: development builds that load Lit's development build
fail with `currentDirective._$initialize is not a function`; see
[Troubleshooting](../../docs/guide/troubleshooting.md#currentdirective_initialize-is-not-a-function-in-development).

Prefer a framework wrapper? See
[`@lit-pigeon/react`](../react), [`@lit-pigeon/vue`](../vue),
[`@lit-pigeon/angular`](../angular), and [`@lit-pigeon/svelte`](../svelte).

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
