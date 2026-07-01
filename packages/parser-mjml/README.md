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

Pass `{ lenient: true }` to silently skip unknown elements instead of warning.
The exported `ParseOptions`, `ParseResult`, and `ParseWarning` types describe
the input and output shapes.

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
