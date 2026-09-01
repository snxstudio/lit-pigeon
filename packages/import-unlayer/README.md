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
| `unsupported-block` | An Unlayer block with no Pigeon equivalent (`video`, `timer`, `form`). |
| `custom-tool` | A `custom#*` tool. Re-create it as a Lit Pigeon plugin block. |
| `display-condition-dropped` | See below. |
| `heading-level-clamped` | `h4`–`h6` imported as `h3`. |
| `empty-row` | A row with no columns was skipped. |
| `no-rows` | The design had no rows at all. |

**Display conditions are dropped deliberately.** Unlayer stores them as raw
`before`/`after` template fragments, not as the boolean expression Pigeon's
`condition` wraps in `{{#if}}`. Guessing a translation would silently change
who receives the content, so the importer reports the condition by name and
leaves the row unconditional for you to re-add.

Mobile `_override` values and `hideDesktop` / `hideMobile` are not yet mapped.

## Licence

MIT
