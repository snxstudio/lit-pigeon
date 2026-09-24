# @lit-pigeon/parser-mjml

MJML → `PigeonDocument` parser for [Lit Pigeon](https://github.com/snxstudio/lit-pigeon).
Import an existing MJML email template into the editor's JSON document model —
the inverse of [`@lit-pigeon/renderer-mjml`](../renderer-mjml).

## Install

```bash
npm install @lit-pigeon/parser-mjml
```

## Usage

```ts
import { mjmlToDocument } from '@lit-pigeon/parser-mjml';

const mjml = `
  <mjml>
    <mj-body>
      <mj-section>
        <mj-column>
          <mj-text>Hello from MJML</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
`;

const { document, warnings } = mjmlToDocument(mjml);
// `document` is a PigeonDocument you can load into the editor.
// `warnings` lists unsupported tags that were skipped or approximated.
```

`mjmlToDocument` never throws. Each warning is `{ message, tag? }`, for
example for `mj-wrapper` styling, unknown elements such as `mj-carousel`, and
`css-class` on elements that cannot keep it. Some things are dropped without a
warning: `mj-column` widths (columns open with equal widths), `mj-font`,
`mj-title`, inline `mj-style`, and attributes the document model has no field
for. The full list is in
[Load and save](../../docs/guide/load-and-save.md#what-the-parser-does-not-keep).

The exported `ParseOptions`, `ParseResult`, and `ParseWarning` types describe
the input and output shapes. In 0.1.7, `ParseOptions.lenient` has no effect and
`ParseWarning.line` is never set.

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
