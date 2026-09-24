# @lit-pigeon/renderer-mjml

MJML-based HTML renderer for [Lit Pigeon](https://github.com/snxstudio/lit-pigeon).
Converts a `PigeonDocument` into a full MJML markup string, then compiles it to
email-client-safe, inlined-CSS, table-based HTML (with optional Outlook
`mso`/VML workarounds).

## Install

```bash
npm install @lit-pigeon/renderer-mjml
```

Depends on [`mjml`](https://mjml.io) 4, which runs in Node.js. In a browser
bundle, alias `mjml` to `mjml-browser` (for example with
`"overrides": { "mjml": "npm:mjml-browser@^4.18.0" }` in `package.json`), or
the build fails with `Could not resolve "fs"`.

## Usage

```ts
import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';
import { createDefaultDocument } from '@lit-pigeon/core';

const renderer = new MjmlRenderer();
const doc = createDefaultDocument();

const { html, errors } = await renderer.render(doc, {
  outlookWorkarounds: true, // default
  minify: false,
  fonts: [{ name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter' }],
});

// `html` is ready to send; `errors` is empty on success.
```

`render()` never rejects: MJML problems are returned in `errors`, and an
unrecoverable failure returns `html: ''` with one error. Options are
`outlookWorkarounds` (default `true`: Outlook `mso` styles, heading margin
reset and dark-mode `color-scheme` meta tags), `fonts` (emitted as
`<mj-font>`), `minify` and `beautify`. `inlineCss` is accepted but has no
effect; MJML always inlines CSS.

`MjmlRenderer` implements the core `Renderer` interface, so it can be passed
straight to the editor's preview/export path or the framework wrappers. Need
just the MJML markup (no HTML compile)? Use `documentToMjml(doc, { outlookWorkarounds?, fonts? })`.
Merge tags such as `{{first_name}}` are passed through unchanged, and a row's
`condition` is written as `{{#if …}}` … `{{/if}}` around its section. Custom
blocks are rendered with their `BlockDefinition.renderMjml`. The individual
block renderers (`renderTextBlock`, `renderImageBlock`, …) and `spacingToMjml`
are also exported.

For a DOM-free server pipeline (parse + validate + merge tags), see
[`@lit-pigeon/ssr`](../ssr).

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
