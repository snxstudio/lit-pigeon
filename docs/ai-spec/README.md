# Lit Pigeon — AI Authoring Specification

**Version 1.0** · This directory is the canonical contract between AI tools (LLMs, CLIs, agents) and Lit Pigeon. Anything that wants to author Lit Pigeon emails programmatically — from a prompted GPT-4 to an MCP server to a Figma importer — should target what's here.

## What's in this folder

| File | Purpose |
|---|---|
| [`lit-pigeon-ai-spec.schema.json`](./lit-pigeon-ai-spec.schema.json) | JSON Schema (Draft 2020-12) for the `PigeonDocument` shape. The machine-readable contract. |
| [`prompting-guide.md`](./prompting-guide.md) | How to instruct an LLM to produce valid `PigeonDocument` JSON. System-prompt templates included. |
| [`examples/welcome-email.json`](./examples/welcome-email.json) | A complete, minimal welcome email. |
| [`examples/promo-email.json`](./examples/promo-email.json) | A two-column promo with hero, button, social row. |

## The 30-second mental model

A Lit Pigeon email is a JSON document with this shape:

```
PigeonDocument
├── version: "1.0"
├── metadata: { name, previewText, createdAt, updatedAt }
└── body
    ├── attributes: { width, backgroundColor, fontFamily, contentAlignment }
    └── rows: Row[]
        └── columns: Column[]              ← columnRatios sum to 12
            └── blocks: Block[]            ← typed content (text/image/button/…)
```

Layout uses a 12-column grid per row. The renderer converts this to MJML, which in turn produces email-client-safe HTML with inline CSS.

## Block types

| Type | Purpose | Required fields (in `values`) |
|---|---|---|
| `text` | Rich text paragraph with inline HTML | `content`, `padding`, `lineHeight`, `textAlign` |
| `image` | Single image with optional link | `src`, `alt`, `width`, `padding`, `alignment` |
| `button` | Call-to-action button | `content`, `href`, `backgroundColor`, `textColor`, `borderRadius`, `padding`, `innerPadding`, `fontSize`, `fontWeight`, `alignment`, `fullWidth` |
| `divider` | Horizontal rule | `borderColor`, `borderWidth`, `borderStyle`, `padding`, `width` |
| `spacer` | Vertical whitespace | `height` |
| `social` | Social-network icon row | `icons`, `iconSize`, `spacing`, `alignment`, `padding` |
| `html` | Raw HTML/MJML escape hatch (avoid when possible) | `content`, `padding` |
| `hero` | Background-image banner with overlaid content | `backgroundUrl`, `backgroundPosition`, `mode`, `width`, `height`, `verticalAlign`, `padding`, `innerPadding`, `backgroundColor`, `content` |
| `navbar` | Top navigation links | `links`, `hamburger`, `alignment`, `padding`, `linkColor`, `linkFontSize`, `linkPadding` |

See the [JSON Schema](./lit-pigeon-ai-spec.schema.json) for every field, its type, and any enum values.

## Conventions an LLM must follow

1. **Always emit `version: "1.0"`.**
2. **IDs must be unique strings.** Any non-empty stable string works. A short opaque slug is fine (`row-1`, `block-cta`).
3. **`columnRatios.length === columns.length`** and they sum to 12. Common patterns: `[12]` single-column, `[6,6]` two equal, `[8,4]` or `[4,8]` sidebar, `[4,4,4]` three equal.
4. **Text content is HTML**, not Markdown. Allowed tags: `p, br, strong, em, s, u, code, a, h1-h3, ul, ol, li, blockquote, span`. Anything else is stripped on the way to the canvas.
5. **Merge tags** are literal text written as `{{identifier}}` inside a text block. They render as chips in the editor and pass through to MJML unchanged. Identifier must match `[A-Za-z_][A-Za-z0-9_]*` — `{{user.name}}` and `{{items[0]}}` are NOT supported.
6. **Spacing is four-sided integers in pixels.** Use `{ top: 12, right: 12, bottom: 12, left: 12 }`, not strings.
7. **Width is 600 by default.** Don't pick exotic widths — most email clients clip past 640.
8. **Use `text/button/image` first.** `html` is a last resort; the editor and renderer pipelines are richer for typed blocks.
9. **`metadata.createdAt` / `updatedAt` are ISO-8601 timestamps.** When in doubt, use `new Date().toISOString()`.

## Rendering pipeline

```
PigeonDocument (JSON)
        ↓ documentToMjml(doc)      ← from @lit-pigeon/renderer-mjml
   MJML string
        ↓ mjml2html()              ← MJML library
   HTML string (inline CSS, email-safe)
```

Parsers exist in the other direction: `mjmlToDocument(mjml)` round-trips MJML back to a `PigeonDocument`.

## How to consume this spec

- **LLMs / prompted models**: include the [prompting guide](./prompting-guide.md) in your system prompt. Reference the JSON Schema URL above for validation.
- **MCP-compatible tools**: install `@lit-pigeon/mcp-server` (coming next) — it exposes the same operations as live tools.
- **Custom CLIs / agents**: parse the JSON Schema, generate structured output, hand the result to `@lit-pigeon/core`'s `isValidDocument(doc)` before storing or rendering.
- **Figma → Pigeon**: see `@lit-pigeon/figma-import` (coming next) — converts a Figma frame to a `PigeonDocument` you can hand off here.

## Versioning

This spec is versioned independently from the npm packages. Spec changes that break existing documents bump the major version (`2.0`); additive changes bump the minor (`1.1`). Track changes in [`CHANGELOG.md`](./CHANGELOG.md) (once it exists).

The `PigeonDocument.version` field locks each document to a spec major. Documents at the wrong version should be rejected.
