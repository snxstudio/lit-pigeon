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

`mjmlToDocument` ignores `mj-column` widths (every column in a section gets an
equal share), and GrapesJS layouts often use uneven columns. This importer
restores them after parsing:

<!-- snippet: src/migrating/grapesjs.ts -->
```ts
import { mjmlToDocument, type ParseWarning } from '@lit-pigeon/parser-mjml';
import type { PigeonDocument } from '@lit-pigeon/core';
import { restoreColumnWidths } from './column-widths.js';

export interface GrapesJsImport {
  document: PigeonDocument;
  warnings: ParseWarning[];
  /** Column widths restored after parsing, for the migration report. */
  columnNotes: string[];
}

/** Imports the MJML a grapesjs-mjml editor produced (editor.getHtml()). */
export function importGrapesJsMjml(mjml: string, name: string): GrapesJsImport {
  const { document, warnings } = mjmlToDocument(mjml);
  document.metadata.name = name;
  const columnNotes = restoreColumnWidths(mjml, document);
  return { document, warnings, columnNotes };
}
```

<!-- snippet: src/migrating/column-widths.ts -->
```ts
import { Parser } from 'htmlparser2';
import type { PigeonDocument } from '@lit-pigeon/core';

/**
 * mjmlToDocument gives every column in a section an equal width. This reads
 * the mj-column widths from the source and applies them to the imported rows,
 * rounded to the editor's 12-column grid. Rows come from mj-section and
 * mj-hero elements in source order, which is the order the parser uses.
 */
export function restoreColumnWidths(mjml: string, document: PigeonDocument, bodyWidth = document.body.attributes.width): string[] {
  const sections: Array<Array<string | undefined>> = [];
  let current: Array<string | undefined> | null = null;
  new Parser(
    {
      onopentag(name, attrs) {
        if (name === 'mj-section' || name === 'mj-hero') sections.push((current = []));
        else if (name === 'mj-column' && current) current.push(attrs.width);
      },
      onclosetag(name) {
        if (name === 'mj-section' || name === 'mj-hero') current = null;
      },
    },
    { lowerCaseTags: true, recognizeSelfClosing: true },
  ).end(mjml);

  const notes: string[] = [];
  sections.forEach((widths, index) => {
    const row = document.body.rows[index];
    if (!row || widths.length !== row.columns.length || widths.every((w) => w === undefined)) return;
    const percents = widths.map((w) => (w === undefined ? NaN : w.endsWith('%') ? parseFloat(w) : (parseFloat(w) / bodyWidth) * 100));
    const known = percents.filter((p) => !Number.isNaN(p));
    const share = (100 - known.reduce((a, b) => a + b, 0)) / (percents.length - known.length || 1);
    const ratios = percents.map((p) => Math.max(1, Math.round(((Number.isNaN(p) ? share : p) / 100) * 12)));
    if (ratios.join() !== row.columnRatios.join()) {
      notes.push(`row ${index + 1}: columns ${widths.map((w) => w ?? 'auto').join(' / ')} → ${ratios.join(':')} of 12`);
      row.columnRatios = ratios;
    }
  });
  return notes;
}
```

`htmlparser2` is already a dependency of `@lit-pigeon/parser-mjml`; add it to
your own `package.json` if you use it directly. Widths are rounded to twelfths
(a 30%/70% layout becomes 4:8, which renders as 33.33%/66.67%). The helper
assumes one row per `mj-section` or `mj-hero` in source order, which holds
unless the parser dropped a section's unknown parent; check the parse warnings.

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
| `mj-group` | Imported as ordinary columns; the columns may now stack on mobile. |
| `mj-font`, `mj-title`, inline `mj-style` | Dropped silently. Register fonts with `config.fontConfig`, and move inline styles into non-inline `mj-style` or the content. |
| Attributes GrapesJS may add, such as `id` | Dropped silently; they have no meaning in the document model. |

## 4. Store and switch over

- Store the imported templates as JSON documents. If you store MJML instead,
  run `restoreColumnWidths` every time a template is opened: the parser
  ignores column widths in any MJML, including the MJML Lit Pigeon writes.
- GrapesJS's own concepts map as follows: the Asset Manager to
  `config.assetManager` ([Images and uploads](./images-and-uploads.md)), the
  Storage Manager to your own save calls ([Load and save](./load-and-save.md)),
  blocks and components to [custom blocks](./custom-blocks.md), commands and
  panels to the fixed toolbar and panels (the editor's layout is not
  configurable beyond [theming](./theming-and-customisation.md)).
- GrapesJS's canvas can run component scripts; Lit Pigeon does not run script
  in HTML blocks. Anything that relied on scripts in the canvas needs another
  approach.
