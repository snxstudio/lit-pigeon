# @lit-pigeon/import-unlayer

Import an [Unlayer](https://unlayer.com/) design JSON into a Lit Pigeon
`PigeonDocument` — migrate existing templates instead of rebuilding them.

Pairs with [`@lit-pigeon/parser-mjml`](../parser-mjml) (MJML → document) and
[`@lit-pigeon/figma-import`](../figma-import) (Figma frame → document).

## Install

```bash
npm install @lit-pigeon/import-unlayer
```

## Usage

Feed it whatever `editor.saveDesign()` gave you — the parsed object or the raw
JSON string:

```ts
import { unlayerToDocument } from '@lit-pigeon/import-unlayer';

const { document, warnings } = unlayerToDocument(design);

for (const warning of warnings) {
  console.warn(`[${warning.code}] ${warning.message}`);
}
```

Then render it, or load it straight into the editor:

```ts
import { documentToMjml } from '@lit-pigeon/renderer-mjml';

const mjml = documentToMjml(document);
```

### Options

| Option | Default | Description |
| --- | --- | --- |
| `name` | `'Imported from Unlayer'` | Name for the imported template. |

## What gets imported

| Unlayer | Lit Pigeon | Notes |
| --- | --- | --- |
| `text` | `text` | Block-level font size and colour are inlined (see below). |
| `heading` | `text` | Wrapped in its `<h1>`–`<h3>` tag; `h4`–`h6` clamp to `h3`. |
| `image` | `image` | Link, alt text, explicit and auto widths. |
| `button` | `button` | Colours, radius, inner/outer padding. `size.autoWidth` inverts to `fullWidth`. |
| `divider` | `divider` | Border colour, width, and style. |
| `html` | `html` | Passed through verbatim. |
| `menu` | `navbar` | Items, alignment, link colour and size. |
| `social` | `social` | Known platforms map by name; anything else becomes a `custom` icon. |
| rows / `cells` | rows / `columnRatios` | Relative widths convert to the 12-column grid (`[1, 2]` → `[4, 8]`). |
| body `values` | body attributes | Width, background, font family, alignment, preheader. |
| `video` | `video` | From `@lit-pigeon/blocks`; carries the video URL and the poster image. |
| `timer` | `countdown` | From `@lit-pigeon/blocks`; carries `endTime` as the fallback label. |

### Why colours end up in a `<span>`

Unlayer stores font size and colour on the *content block*. A Lit Pigeon
`TextBlock` only carries `content`, `padding`, `lineHeight` and `textAlign`, so
dropping them would lose the design — a template with `textColor: #ffffff` on a
black body would import as black-on-black.

The importer pushes that typography into the HTML instead. The editor's
rich-text sanitiser keeps `style` on `<span>` only, and only for `color`,
`font-family` and `font-size`, so the styling wraps the *inner* content of each
top-level element:

```html
<!-- Unlayer: { text: "<p>Hi</p>", color: "#ffffff", fontSize: "17px" } -->
<p><span style="color: #ffffff; font-size: 17px">Hi</span></p>
```

## What does not survive

Import is best-effort and never throws. Anything that cannot be represented is
dropped and reported in `warnings`, so a migration UI can tell the user exactly
what needs a second look.

| Code | Meaning |
| --- | --- |
| `not-a-design` | Input was not valid JSON, or had no `body` key. |
| `unsupported-block` | An Unlayer block with no Pigeon equivalent (`form`). |
| `plugin-block` | Converted to a block from `@lit-pigeon/blocks`, which is not registered. See below. |
| `custom-tool` | A `custom#*` tool. Re-create it as a Lit Pigeon plugin block. |
| `display-condition-dropped` | See below. |
| `heading-level-clamped` | `h4`–`h6` imported as `h3`. |
| `empty-row` | A row with no columns was skipped. |
| `no-rows` | The design had no rows at all. |

**`video` and `timer` need the standard catalog.** They convert to the `video`
and `countdown` blocks from `@lit-pigeon/blocks`, which this package does not
depend on — that would pull the whole catalog into every migration. The
importer emits the block by type name, so if the host has not installed the
package and called `registerStandardBlocks()`, the block shows as the
registry's labelled placeholder rather than rendering, and a `plugin-block`
warning says so. A timer's hosted countdown image is generated per open and is
not in the design JSON, so the block arrives with Unlayer's `endTime` as its
fallback label and a countdown image URL for you to paste in.

**Display conditions are dropped deliberately.** Unlayer stores them as raw
`before`/`after` template fragments, not as the boolean expression Pigeon's
`condition` wraps in `{{#if}}`. Guessing a translation would silently change
who receives the content, so the importer reports the condition by name and
leaves the row unconditional for you to re-add.

Mobile `_override` values and `hideDesktop` / `hideMobile` are not yet mapped.
Rows Unlayer marks as locked are imported with `locked: true`, but the editor
does not enforce locking yet
([#65](https://github.com/snxstudio/lit-pigeon/issues/65)). HTML blocks are
passed through verbatim, so review imported designs before loading them into
the editor; see [Security](../../docs/guide/security.md).

A step-by-step migration, including mapping Unlayer's API calls and merge
tags, is in [Migrating from Unlayer](../../docs/guide/migrating-from-unlayer.md).

## Licence

MIT
