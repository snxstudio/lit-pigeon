# @lit-pigeon/renderer-mjml

MJML-based HTML renderer for [Lit Pigeon](https://github.com/snxstudio/lit-pigeon).
Converts a `PigeonDocument` into a full MJML markup string, then compiles it to
email-client-safe, inlined-CSS, table-based HTML (with optional Outlook
`mso`/VML workarounds).

## Install

```bash
npm install @lit-pigeon/renderer-mjml
```

Bundles [`mjml`](https://mjml.io) as a dependency.

## Usage

```ts
import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';
import { createDefaultDocument } from '@lit-pigeon/core';

const renderer = new MjmlRenderer();
const doc = createDefaultDocument();

const { html, errors } = await renderer.render(doc, {
  outlookWorkarounds: true, // default
  minify: false,
});

// `html` is ready to send; `errors` is empty on success.
```

`MjmlRenderer` implements the core `Renderer` interface, so it can be passed
straight to the editor's preview/export path or the framework wrappers. Need
just the MJML markup (no HTML compile)? Use `documentToMjml(doc, options)`.

For a DOM-free server pipeline (parse + validate + merge tags), see
[`@lit-pigeon/ssr`](../ssr).

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
