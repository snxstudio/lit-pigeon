# Migrating from GrapesJS

GrapesJS is a general web page builder; email templates built with it are
usually either **MJML** (with the `grapesjs-mjml` plugin) or **plain HTML**
(for example with `grapesjs-preset-newsletter`). Lit Pigeon imports MJML with
`@lit-pigeon/parser-mjml`. There is no importer for GrapesJS project JSON or
for arbitrary HTML.

The helpers on this page are tested in
[`examples/test/migrating.test.ts`](./examples/test/migrating.test.ts).

## 1. Get MJML out of GrapesJS

- **Templates built with `grapesjs-mjml`.** The editor's `getHtml()` returns
  the MJML source when the MJML plugin is active. If you stored that MJML,
  use it directly. If you stored only GrapesJS project data (`getProjectData()`)
  or compiled HTML, load each project into a headless GrapesJS instance with
  the MJML plugin once and call `getHtml()` to recover the MJML.
- **Plain HTML templates.** These cannot be converted automatically. Either
  keep them outside the new editor, or rebuild them in Lit Pigeon, which is
  usually quicker than it sounds for a small set of master templates. Putting
  an entire HTML email into one HTML block technically works but gives users
  nothing to edit visually.

## 2. Import the MJML

GrapesJS layouts often use uneven columns. `mjmlToDocument` reads the
`mj-column` widths and sets the row's column ratios from them, so the import is
just the parse plus whatever name you want on the document:

<!-- snippet: src/migrating/grapesjs.ts -->
```ts
import { mjmlToDocument, type ParseWarning } from '@lit-pigeon/parser-mjml';
import type { PigeonDocument } from '@lit-pigeon/core';

export interface GrapesJsImport {
  document: PigeonDocument;
  warnings: ParseWarning[];
}

/** Imports the MJML a grapesjs-mjml editor produced (editor.getHtml()). */
export function importGrapesJsMjml(mjml: string, name: string): GrapesJsImport {
  const { document, warnings } = mjmlToDocument(mjml);
  document.metadata.name = name;
  return { document, warnings };
}
```

Widths are rounded to twelfths, so a 30%/70% layout becomes 4:8 and renders
back as 33.33%/66.67%. Pixel widths are read against the body width, and
columns with no width take an equal share of what is left.

## 3. Check the warnings

MJML from GrapesJS commonly contains elements the document model does not
keep; see the full list in
[Load and save](./load-and-save.md#what-the-parser-does-not-keep). The ones to
look for in GrapesJS output are:

| In the source | What to do |
|---|---|
| `mj-wrapper` (warning) | Its background and padding are dropped. Move the background onto the rows or the body. |
| `mj-carousel`, `mj-accordion` (warning) | Dropped. Rebuild with the `carouselBlock` and `accordionBlock` from `@lit-pigeon/blocks`, or as [custom blocks](./custom-blocks.md). |
| Custom GrapesJS components (warning as unknown elements) | Dropped. Rebuild as custom blocks. |
| `mj-group` | Its columns are imported with their widths, but as ordinary columns, so they stack on mobile where the group kept them side by side. |
| `mj-font`, `mj-title`, inline `mj-style` | Dropped silently. Register fonts with `config.fontConfig`, and move inline styles into non-inline `mj-style` or the content. |
| Attributes GrapesJS may add, such as `id` | Dropped silently; they have no meaning in the document model. |

## 4. Store and switch over

- Store the imported templates as JSON documents. MJML is a lossy store: it
  keeps the layout, but not the ids, the locked flag or anything in the table
  above.
- GrapesJS's own concepts map as follows: the Asset Manager to
  `config.assetManager` ([Images and uploads](./images-and-uploads.md)), the
  Storage Manager to your own save calls ([Load and save](./load-and-save.md)),
  blocks and components to [custom blocks](./custom-blocks.md), commands and
  panels to the fixed toolbar and panels (the editor's layout is not
  configurable beyond [theming](./theming-and-customisation.md)).
- GrapesJS's canvas can run component scripts; Lit Pigeon does not run script
  in HTML blocks. Anything that relied on scripts in the canvas needs another
  approach.
