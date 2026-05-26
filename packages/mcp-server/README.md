# @lit-pigeon/mcp-server

Model Context Protocol server exposing Lit Pigeon email authoring + rendering as MCP tools. Plug it into any MCP-compatible client (Claude Code, Cursor, Windsurf, Codex, etc.) and ask the model to build emails for you.

This is the runtime implementation of the [AI authoring specification](../../docs/ai-spec/).

## Install

```bash
pnpm add @lit-pigeon/mcp-server
# or globally for direct `lit-pigeon-mcp` invocation
npm install -g @lit-pigeon/mcp-server
```

## Configure your client

### Claude Code (`~/.claude.json` or `.mcp.json` in a project)

```json
{
  "mcpServers": {
    "lit-pigeon": {
      "command": "npx",
      "args": ["-y", "@lit-pigeon/mcp-server"]
    }
  }
}
```

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "lit-pigeon": {
      "command": "npx",
      "args": ["-y", "@lit-pigeon/mcp-server"]
    }
  }
}
```

After restarting your client, ask: *"Use lit-pigeon to build a welcome email with a hero, an intro paragraph, and a Get-Started button to https://example.com."*

## Tools exposed

| Tool | Purpose |
|---|---|
| `create_document` | Make a new, empty `PigeonDocument`. Returns its id. |
| `list_documents` | Return ids, names, and updatedAt for every document in this session. |
| `get_document` | Return the full document JSON by id. |
| `validate_document` | Run `validateDocument()` and return any errors. |
| `set_document_metadata` | Patch `metadata.name` and/or `metadata.previewText`. |
| `set_body_attribute` | Update one of `width`, `backgroundColor`, `fontFamily`, `contentAlignment`. |
| `list_block_types` | Enumerate the supported block types. |
| `add_row` | Append a row with `columnCount` (1-4) or explicit `ratios` summing to 12. |
| `add_block` | Append a typed block (text/image/button/divider/spacer/social/html/hero/navbar) to a column, with partial `values` overrides. |
| `update_block` | Patch a block's `values`. Reverts on validation failure. |
| `delete_block` | Remove a block. |
| `render_to_mjml` | Serialize to MJML. |
| `render_to_html` | Render to email-client-safe HTML (with inline CSS). Returns `{ html, errors }`. |
| `import_figma_frame` | Fetch a Figma frame via the REST API, convert to a `PigeonDocument`, and load it into the store. Returns `{ documentId, warnings }`. |

Every tool takes a `documentId` after `create_document`. The id is opaque — keep it around for the rest of the conversation.

## Workflow example

```text
User:  Build me a welcome email for "Lumen App". One hero, one paragraph, one CTA button to https://lumen.app/start.

Model: [calls create_document { name: "Welcome to Lumen" }]
       [calls add_row { columnCount: 1 }]
       [calls add_block { blockType: "hero", values: { content: "<h1>Welcome to Lumen</h1>", backgroundUrl: "...", height: 280, ... } }]
       [calls add_row { columnCount: 1 }]
       [calls add_block { blockType: "text", values: { content: "<p>Thanks for joining ...</p>" } }]
       [calls add_row { columnCount: 1 }]
       [calls add_block { blockType: "button", values: { content: "<p>Get started</p>", href: "https://lumen.app/start" } }]
       [calls render_to_html { documentId }]
       Returns the HTML to the user.
```

## Programmatic embedding

You can also embed the server in your own Node process — e.g. behind an HTTP endpoint with the SSE transport:

```ts
import { buildServer } from '@lit-pigeon/mcp-server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const { server } = buildServer();
const transport = new SSEServerTransport('/mcp', responseWriter);
await server.connect(transport);
```

The `DocumentStore` is also exported if you want to persist documents elsewhere — supply your own via `buildServer({ store })`.

## Figma import (live)

```text
User: Use lit-pigeon to import this Figma frame as an email — file key
      abcd1234, frame id 12:34. Token: figd_…
Model: [calls import_figma_frame { fileKey, frameId, accessToken }]
       [calls render_to_html { documentId }]
       …returns the rendered HTML.
```

The tool fetches the Figma file via the REST API, converts the frame to a
`PigeonDocument`, and loads it into the same store as `create_document` —
follow it with `update_block`, `render_to_html`, etc. See
[`@lit-pigeon/figma-import`](../figma-import/) for the conversion heuristics.

## What's coming

- `save_template` / `load_template` — persist documents as reusable templates.

## License

MIT
