# Load and save

The editor edits a `PigeonDocument`, a plain JSON tree
(`body → rows → columns → blocks`). How you persist templates is up to your
application. This page covers the two common choices:

- **MJML plus compiled HTML.** Load with `mjmlToDocument`, save with
  `documentToMjml` and `MjmlRenderer`, and store `{ mjml, html }`.
- **The JSON document** (plus the compiled HTML for sending).

The behaviour described here is pinned by
[`examples/test/load-and-save.test.ts`](./examples/test/load-and-save.test.ts).

## The MJML round trip

```text
stored { mjml, html }
   │  mjmlToDocument(mjml)            @lit-pigeon/parser-mjml
   ▼
PigeonDocument ──► <pigeon-editor> ──► edited PigeonDocument
                                          │  documentToMjml(doc)      @lit-pigeon/renderer-mjml
                                          │  new MjmlRenderer().render(doc)
                                          ▼
                                  stored { mjml, html }
```

### Opening a stored template

<!-- snippet: src/load-and-save/mjml-storage.ts#open -->
```ts
export function openTemplate(stored: StoredTemplate): {
  document: PigeonDocument;
  warnings: ParseWarning[];
} {
  const { document, warnings } = mjmlToDocument(stored.mjml);
  // Show warnings to the user: each one is something that will not survive the next save.
  return { document, warnings };
}
```

`mjmlToDocument(mjml, options?)` never throws on malformed MJML. It returns
`{ document, warnings }`, where each warning is `{ message, tag? }`. If there
is no `<mjml>` root or no `<mj-body>`, it returns an empty document and a
warning.

Two parts of the published types have no effect in `@lit-pigeon/parser-mjml`
0.1.7: the `ParseOptions.lenient` flag (unknown elements are always reported
as warnings) and `ParseWarning.line` (never set).

### Saving

<!-- snippet: src/load-and-save/mjml-storage.ts#save -->
```ts
const renderer = new MjmlRenderer();

export async function saveTemplate(
  document: PigeonDocument,
  fonts: FontDefinition[] = [],
): Promise<StoredTemplate & { errors: RenderError[] }> {
  // Pass the same fonts the editor uses (config.fontConfig) so both outputs load them.
  const mjml = documentToMjml(document, { fonts });
  const { html, errors } = await renderer.render(document, { fonts });
  return { mjml, html, errors };
}
```

`MjmlRenderer.render()` never rejects. MJML validation problems are returned
in `errors` (`{ message, line?, tagName? }`) alongside the HTML; an
unrecoverable compile failure returns `html: ''` and one error. Check `errors`
before storing.

Inside the editor you can call `editor.exportMjml()` and
`editor.exportHtml()` instead; they do the same thing and include the fonts
from `config.fontConfig` and the brand kit automatically. `exportHtml()` does
not return `errors`.

A template that has been saved once opens and saves again without further
changes: the output of `documentToMjml` is stable under a second round trip.
Column widths survive it — a 4:8 layout set in the editor is written out as
33.33%/66.67% and read back as 4:8.

### What the parser keeps

- Sections, columns and the blocks `mj-text`, `mj-image`, `mj-button`,
  `mj-divider`, `mj-spacer`, `mj-social`, `mj-navbar`, `mj-hero` and `mj-raw`
  (as an HTML block). `mj-table` becomes an HTML block containing the table
  MJML would render.
- `mj-body` width and background colour; `mj-preview` as the preview text.
- `<mj-attributes>` defaults (`mj-all`, per-tag and `mj-class`), resolved
  onto each element with MJML's precedence before values are read.
- `mj-text` colour, font size and font family, kept as an inline `<span style>`
  inside the content.
- Non-inline `<mj-style>` CSS, kept on `body.attributes.css`.
- `css-class` on sections, columns, text, buttons and images.
- HTML comments (including Outlook `<!--[if mso]>` blocks), void elements such
  as `<br>`, and escaped entities inside `mj-text`, `mj-button` and `mj-raw`.
- Row display conditions written by the renderer as
  `<mj-raw>{{#if …}}</mj-raw>` around a section.

### What the parser does not keep

With a warning:

| Input | What happens |
|---|---|
| `<mj-wrapper>` | Its sections are imported; its padding and background are dropped. |
| Unknown block elements (`mj-carousel`, `mj-accordion`, `mj-include`, custom components) | Dropped. |
| Unknown `mj-body` children | Dropped. |
| `mj-hero` children other than `mj-text` and `mj-button` | Dropped. |
| `css-class` on any element other than section, column, text, button or image | Dropped. |

Silently:

| Input | What happens |
|---|---|
| `mj-column` `width` | Rounded to the nearest twelfth of the 12-column grid, so a 30%/70% layout opens as 4:8 and saves back as 33.33%/66.67%. Widths that overflow the body warn and are scaled to fit. |
| `mj-group` | Its columns are imported with their widths, but as ordinary columns, so they stack on mobile where the group kept them side by side. |
| `mj-font` | Dropped. Register fonts with `config.fontConfig` and pass them to `documentToMjml` and `render`. |
| `mj-title`, `mj-breakpoint`, `mj-html-attributes` | Dropped. |
| `<mj-style inline="inline">` | Dropped, so its rules are no longer inlined into the HTML. Move them to a non-inline `mj-style` or into the content. |
| Attributes the document model has no field for (for example section borders, image height, button width) | Dropped. The fields each block keeps are listed in [`packages/core/src/types/document.ts`](../../packages/core/src/types/document.ts). |
| `metadata.name` | Always `'Imported Template'`. Keep the template's name in your own record. |
| Ids | New ids are generated on every open, so ids are not stable across loads. |
| `RowNode.locked` | Always `false`. |
| Custom blocks | Their `renderMjml` output is plain MJML, so it opens as built-in blocks (or is dropped). See [Custom blocks](./custom-blocks.md). |

When the source omits an attribute, the parser's fallback values differ from
MJML's own defaults in some places, so an imported template can shift
slightly. This is tracked in
[#96](https://github.com/snxstudio/lit-pigeon/issues/96).

Editing a text block in the editor can also drop HTML comments and hero button
styling from that block's content
([#97](https://github.com/snxstudio/lit-pigeon/issues/97)). Leaving inline
editing without changing anything keeps the stored HTML exactly as it was
(`@lit-pigeon/editor` 0.3.3 and later).

## Storing the JSON document

The alternative is to store the document itself, and the compiled HTML
alongside it for sending:

<!-- snippet: src/load-and-save/json-storage.ts -->
```ts
import { validateDocument, type PigeonDocument } from '@lit-pigeon/core';

/** Store the document itself, plus the rendered HTML for sending. */
export interface StoredDocument {
  document: string;
  html: string;
}

export function serialiseDocument(document: PigeonDocument): string {
  return JSON.stringify(document);
}

export function parseStoredDocument(json: string): PigeonDocument {
  const value: unknown = JSON.parse(json);
  const errors = validateDocument(value);
  if (errors.length > 0) {
    throw new Error(`Invalid document: ${errors.map((e) => `${e.path} ${e.message}`).join('; ')}`);
  }
  return value as PigeonDocument;
}
```

`validateDocument` returns `{ path, message }` errors for anything that does
not match the schema (`version` must be `'1.0'`). It only accepts the nine
built-in block types, so documents containing custom blocks fail validation;
see [Custom blocks](./custom-blocks.md#validation-and-custom-blocks).

## Choosing between them

| | MJML plus HTML | JSON document plus HTML |
|---|---|---|
| Fidelity | Loses everything in the tables above on every open. | Lossless for everything the editor can produce: ids, `locked`, conditions, custom blocks, name. |
| Portability | Standard MJML; readable and editable by other MJML tools and people. | Lit Pigeon's own schema (`version: '1.0'`). Export MJML when you need it. |
| Existing templates | Import directly. | Convert once with `mjmlToDocument`, then store JSON. |
| Load cost | Parse on every open; warnings to show. | `JSON.parse` and `validateDocument`. |
| Re-rendering | Recompile the stored MJML with any MJML tool. | Re-render with `@lit-pigeon/ssr` when the renderer changes. |
| Schema changes | Unaffected. | Pre-1.0 releases may change block fields; there is no migration helper. |

A practical approach for a production application is to store all three:
the JSON document as the source of truth for editing, the MJML for
portability, and the HTML for sending. If MJML must remain the source of
truth, show the parse warnings to users when a template opens, and avoid
features that do not survive the round trip (custom blocks, row locking).

In every case, treat stored HTML as untrusted: it was produced in a browser
you do not control. Re-render it on the server from the MJML or JSON before
sending; see [Security](./security.md) and
[Server-side rendering](./server-side.md).
