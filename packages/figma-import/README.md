# @lit-pigeon/figma-import

Convert a Figma frame into a Lit Pigeon `PigeonDocument`. Standalone library — also reachable via the `import_figma_frame` tool in [`@lit-pigeon/mcp-server`](../mcp-server/).

## Install

```bash
pnpm add @lit-pigeon/figma-import
```

## Usage

```ts
import { importFromFigma } from '@lit-pigeon/figma-import';
import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';

const { document, warnings } = await importFromFigma(
  'FILE_KEY',        // segment after /file/ or /design/ in a Figma URL
  '0:1',             // node-id of the frame, URL-decoded
  process.env.FIGMA_TOKEN!,
  {
    documentName: 'Welcome to Lumen',
    previewText: 'Glad you joined us.',
  },
);

console.log(warnings); // soft warnings — skipped nodes, guesses

const { html } = await new MjmlRenderer().render(document);
```

Already have the Figma frame JSON (e.g. from a cached fetch)? Skip the network round-trip:

```ts
import { figmaFrameToDocument } from '@lit-pigeon/figma-import';
const { document } = figmaFrameToDocument(frameNode, { imageUrls: myImageMap });
```

## Conversion heuristics

| Figma node | Becomes | Notes |
|---|---|---|
| Top FRAME | `PigeonDocument.body` | Width clamped to [300, 800]; solid background fill becomes `body.backgroundColor`. |
| Direct child FRAME with `layoutMode: HORIZONTAL` (+ >1 visible kids) | Multi-column row | `columnRatios` projected onto a 12-grid from measured widths (every column gets at least 1). |
| Any other direct child | Single-column row | One block per row. |
| `TEXT` | `text` block | Colour, font-size, font-weight, font-family, alignment, and line-height are extracted. |
| FRAME/INSTANCE with corner-radius, one TEXT child, height ≤ 80px, solid fill | `button` block | Heuristic — won't trigger for non-button shapes. |
| RECTANGLE/FRAME with an IMAGE fill | `image` block | Requires `imageUrls[imageRef]` to resolve. `importFromFigma` fetches that map automatically. |
| `VECTOR`, `ELLIPSE`, decorative shapes | _skipped, warned_ | The library returns soft warnings; the import still succeeds. |

What you don't get yet (planned):
- Hero blocks (image background + text overlay) — currently lands as a plain image + adjacent text.
- Multi-line rich-text formatting per character — text is rendered as a single styled `<p>`.
- Dividers and spacers — Figma's pixel-perfect dividers don't map cleanly; use a text block for now.

## Getting a Figma access token

1. Visit https://www.figma.com/developers/api#access-tokens.
2. Create a personal-access token (`file:read` scope is sufficient for this library).
3. Pass it as the third argument to `importFromFigma`.

## From a Figma URL

```
https://www.figma.com/design/abcd1234/My-Email?node-id=12%3A34
                              ─┬─────         ──┬───
                          fileKey         encoded frameId
```

URL-decode the `node-id` query param to get the frame id (`12:34` in this case).

## Via MCP

If you're using `@lit-pigeon/mcp-server`, you don't need to write any code:

```text
You: Use lit-pigeon to import this Figma frame as an email — file key
     abcd1234, frame id 12:34. Token: figd_…
Model: [calls import_figma_frame { fileKey, frameId, accessToken }]
       [calls render_to_html { documentId }]
       …returns the rendered HTML.
```

## License

MIT
