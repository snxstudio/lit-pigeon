# Migrating from Unlayer

This guide moves an application from Unlayer's embeddable editor to Lit Pigeon:
converting stored designs with `@lit-pigeon/import-unlayer`, and replacing the
embed and its API calls. The conversion code is tested in
[`examples/test/migrating.test.ts`](./examples/test/migrating.test.ts) against a
real Unlayer export.

## 1. Inventory what you use

Before converting, list which Unlayer features your templates and integration
rely on. The ones that need attention are:

| Unlayer | In Lit Pigeon |
|---|---|
| Design JSON (`saveDesign`) | Converted by `unlayerToDocument`. |
| Text, heading, image, button, divider, HTML, menu, social | Converted to built-in blocks. |
| Video, timer, form tools | Not converted (`unsupported-block` warning). `@lit-pigeon/blocks` has video and countdown blocks you can rebuild them with. |
| Custom tools (`custom#…`) | Not converted (`custom-tool` warning). Rebuild them as [custom blocks](./custom-blocks.md). |
| Display conditions | Dropped (`display-condition-dropped` warning). Re-add as a row condition; see [Merge tags](./merge-tags-and-personalisation.md#row-display-conditions). Block-level conditions are coming in the next release ([#26](https://github.com/snxstudio/lit-pigeon/issues/26)). |
| Hide on desktop or mobile, mobile overrides | Not mapped. Device visibility is coming in the next release ([#69](https://github.com/snxstudio/lit-pigeon/issues/69)). |
| Locked rows | Imported as `locked: true`, but the editor does not yet enforce locking ([#65](https://github.com/snxstudio/lit-pigeon/issues/65)). |
| Merge tags | Configure them with `config.mergeTags` (conversion below). Tags in content are kept as text. |

## 2. Convert stored designs

`unlayerToDocument(design, { name? })` accepts the object or the JSON string
from `saveDesign()` and returns `{ document, warnings }`. It never throws:
anything it cannot represent is dropped and reported. Run the conversion once,
on the server, and keep the report:

<!-- snippet: src/migrating/unlayer-batch.ts -->
```ts
import { unlayerToDocument, type ImportWarning, type UnlayerDesign } from '@lit-pigeon/import-unlayer';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { renderDocument } from '@lit-pigeon/ssr';
import type { PigeonDocument } from '@lit-pigeon/core';

export interface UnlayerRecord {
  id: string;
  name: string;
  /** What Unlayer's editor.saveDesign() returned, as an object or a JSON string. */
  design: UnlayerDesign | string;
}

export interface MigratedTemplate {
  id: string;
  document: PigeonDocument;
  mjml: string;
  html: string;
  warnings: ImportWarning[];
}

/** Converts stored Unlayer designs and renders them, collecting warnings for review. */
export async function migrateUnlayerDesigns(records: UnlayerRecord[]): Promise<MigratedTemplate[]> {
  const migrated: MigratedTemplate[] = [];
  for (const record of records) {
    const { document, warnings } = unlayerToDocument(record.design, { name: record.name });
    const { html, errors } = await renderDocument(document);
    if (errors.length > 0) throw new Error(`${record.id}: ${errors.map((e) => e.message).join('; ')}`);
    migrated.push({ id: record.id, document, mjml: documentToMjml(document), html, warnings });
  }
  return migrated;
}
```

Each warning is `{ code, message, contentType? }`:

| Code | Meaning |
|---|---|
| `not-a-design` | The input was not valid JSON or had no `body`. |
| `no-rows` | The design had no rows. |
| `empty-row` | A row with no columns was skipped. |
| `unsupported-block` | A block with no equivalent (for example `video`, `timer`, `form`) was dropped. |
| `custom-tool` | A `custom#…` tool was dropped. |
| `display-condition-dropped` | A row's display condition was dropped. |
| `heading-level-clamped` | An `h4`–`h6` heading became `h3`. |

What the importer does with styling: Unlayer keeps font size and colour on the
block, but Lit Pigeon text blocks have no such fields, so the importer moves
them into an inline `<span style>` inside the content. Row widths (`cells`)
become the 12-column grid, and body width, background, font, alignment and
preheader become body attributes and preview text. See the
[package README](../../packages/import-unlayer/README.md) for the full mapping.

## 3. Review the results

- Open templates with warnings in the new editor and fix them by hand. The
  report says what to look for.
- Compare a sample of the rendered HTML against Unlayer's `exportHtml` output
  in the email clients you care about.
- Decide how to store the result. Keep the JSON document as the source of truth
  if you will use custom blocks or row locking; see
  [Load and save](./load-and-save.md#choosing-between-them).
- Keep the original Unlayer JSON until the migration is signed off.

Do not load third-party designs into the editor unreviewed: Unlayer HTML blocks
are passed through verbatim, and text content is currently shown on the canvas
without sanitising. See [Security](./security.md).

## 4. Replace the embed

| Unlayer | Lit Pigeon |
|---|---|
| `unlayer.init({ id, projectId, … })` or the React/Vue/Angular component | `<pigeon-editor>` or a wrapper; see [Getting started](./getting-started.md). Everything runs from your own bundle; there is no project id or remote script. |
| `editor.loadDesign(design)` | `editor.loadDocument(document)`, or the `document` property. |
| `editor.saveDesign(callback)` | `editor.getDocument()` (synchronous). |
| `editor.exportHtml(callback)` | `await editor.exportHtml()` for HTML, `editor.exportMjml()` for MJML (set `renderer` and `documentToMjml` first). |
| `editor.addEventListener('design:updated', …)` | `pigeon:change`; note it also fires for loads and selection changes ([details](./events-and-api.md#detecting-unsaved-changes)). |
| `editor.addEventListener('editor:ready', …)` | `pigeon:ready`. |
| `editor.registerCallback('image', …)` | `config.assetManager.uploadHandler`; see [Images and uploads](./images-and-uploads.md). |
| `mergeTags` option | `config.mergeTags` (conversion below). |
| `specialLinks` option | `config.linkTypes`; unsubscribe and view-in-browser links are built in. |
| `locale`, `translations` | `config.locale`, `config.messages`. |
| `appearance.theme` | The `theme` property (`light`, `dark`, `auto`) and design tokens; see [Theming](./theming-and-customisation.md). |
| `fonts` option | `config.fontConfig`. |
| `tools` option (enable or disable built-in tools) | No equivalent: all built-in blocks are always in the palette. |
| `registerTool` (custom tools) | `registerBlock()`; see [Custom blocks](./custom-blocks.md). |

### Merge tags

Unlayer's `mergeTags` option is an object of tags keyed by id, optionally
grouped. This converts it to Lit Pigeon's list, using group names as
categories:

<!-- snippet: src/migrating/unlayer-merge-tags.ts -->
```ts
import type { MergeTag } from '@lit-pigeon/core';

/** Unlayer's mergeTags option: tags keyed by id, optionally nested in named groups. */
export interface UnlayerMergeTag {
  name: string;
  value?: string;
  sample?: string;
  mergeTags?: Record<string, UnlayerMergeTag>;
}

/** Flattens Unlayer merge tags into Lit Pigeon's list, using group names as categories. */
export function convertUnlayerMergeTags(tags: Record<string, UnlayerMergeTag>, category?: string): MergeTag[] {
  return Object.entries(tags).flatMap(([id, tag]) =>
    tag.mergeTags
      ? convertUnlayerMergeTags(tag.mergeTags, tag.name)
      : [{ name: tag.value ?? `{{${id}}}`, label: tag.name, category, sample: tag.sample }],
  );
}
```

Tag values such as `{{first_name}}` in converted content are left as they are,
so your sending pipeline keeps working. Only simple identifiers are shown as
chips during inline editing; see
[Merge tags](./merge-tags-and-personalisation.md#configuring-merge-tags).

## 5. Things that work differently

- There is no hosted service: templates, uploads and fonts are stored where
  you choose. Supply your own storage for the template picker
  (`templateStorage`) and asset library (`assetStorage`).
- Uploads go to your API; there is no default image hosting. Without an upload
  adapter, images are stored as `data:` URLs.
- Rendering uses MJML, so output markup differs from Unlayer's even for
  equivalent designs.
- The editor's toolbar Export menu fires events; it does not download files.
