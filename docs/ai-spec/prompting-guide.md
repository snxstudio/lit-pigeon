# Prompting Guide — Producing Lit Pigeon documents with an LLM

This guide gives you templates and rules for instructing any LLM (GPT-4, Gemini, local models, etc.) to author Lit Pigeon emails as JSON. Pair it with the [JSON Schema](./lit-pigeon-ai-spec.schema.json) for validation.

## System-prompt template (copy-paste ready)

```
You are an email author for Lit Pigeon. Produce a single JSON document that
conforms to the PigeonDocument 1.0 schema. Reply with the JSON only — no
prose, no markdown fences.

INVARIANTS (must hold in every output)
1. version === "1.0"
2. metadata.name is a non-empty string; metadata.createdAt and
   metadata.updatedAt are ISO-8601 timestamps.
3. body.attributes.width is between 300 and 800 (default 600).
4. Every row, column, and block has a unique, stable id string.
5. For every row, columnRatios.length === columns.length AND the
   ratios sum to 12. Allowed multi-column patterns: [12], [6,6],
   [8,4], [4,8], [4,4,4], [3,9], [9,3].
6. Block.values follows the schema for that block.type exactly.
   No extra fields, no missing required fields.
7. Text content is HTML. Allowed tags: p, br, strong, em, s, u, code, a,
   h1, h2, h3, ul, ol, li, blockquote, span. NO div, img, table, script,
   style, on* event handlers. Wrap plain text in <p>…</p>.
8. Merge tags are literal text written as {{identifier}} inside text or
   button content. Identifiers match [A-Za-z_][A-Za-z0-9_]*.
9. Spacing is { top, right, bottom, left } integers in pixels.

STYLE
- Default canvas width: 600.
- Default font family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'.
- Default canvas background: '#f5f7fb'. Default row background: '#ffffff'.
- Buttons: borderRadius 6, innerPadding { top: 12, right: 24, bottom: 12, left: 24 },
  fontSize 16, fontWeight '600'.
- One CTA per email is the norm. Use fullWidth: true only for primary CTAs in
  narrow rows.
- Hero blocks: 600x300 by default; use mode "fluid-height" unless the design
  pins the height.
```

## Few-shot pattern

Wrap your user prompt with an example pair to anchor structure:

```
USER: A welcome email for "Lumen App". Include a hero with the headline
"Welcome to Lumen", a paragraph thanking them, a CTA button to
https://lumen.app/start, and a small footer with social links.

ASSISTANT: {…valid PigeonDocument JSON…}
```

See `examples/welcome-email.json` for the kind of output the model should produce.

## Producing structured output

| Provider | Mechanism |
|---|---|
| **OpenAI** | `response_format: { type: "json_schema", json_schema: { …content of lit-pigeon-ai-spec.schema.json… } }`. |
| **Gemini** | `responseMimeType: "application/json"` + `responseSchema`. |
| **Local models (Ollama, llama.cpp)** | Use the system prompt; validate after with `isValidDocument(doc)`. |
| **Other providers** | Use the system prompt above + the provider's native structured-output / JSON-mode feature. Validate with `isValidDocument(doc)`. |

For agentic tools (Cursor, Windsurf, and other MCP-compatible clients), use `@lit-pigeon/mcp-server` instead — it exposes the same operations as live tools and removes the JSON-emission burden from the model.

## Common pitfalls (and the fix)

| Pitfall | Symptom | Fix |
|---|---|---|
| LLM emits Markdown in `text.content` | `**bold**` rendered as literal text in email clients | Pre-tell the model HTML only. Strip with sanitizer if it slips through. |
| `columnRatios` doesn't sum to 12 | Row clips or stretches in MJML | Reject the document; ask the model to re-emit. |
| `spacing` as strings (`"12px"`) | Validation fails | Tell the model integers, pixels. Reject + re-prompt. |
| Merge tag uses dots (`{{user.name}}`) | Renders as plain text, not a chip | Either pre-flatten variables to identifier-shape, or accept it as plain text. |
| Inline `<style>` or `<script>` inside text | Stripped by sanitizer on save | Use `html` block for inline `<style>` if needed, but it remains an escape hatch. |
| Hex colors as 3-digit (`#fff`) | Some email clients normalize awkwardly | Use 6-digit hex (`#ffffff`). |
| Decorative image with empty `alt` | Accessibility check fires in editor | `alt: ""` is valid and explicit. |

## Validating the output

Before storing or rendering, run:

```ts
import { isValidDocument } from '@lit-pigeon/core';

if (!isValidDocument(doc)) {
  // Re-prompt the model, or reject. Don't ship invalid JSON to consumers.
}
```

For deeper validation (every property, not just the structural skeleton), point your favourite JSON Schema validator (Ajv, Zod-from-schema, etc.) at `lit-pigeon-ai-spec.schema.json` and validate.

## What to put after the LLM call

Once you have a validated `PigeonDocument`, the pipelines you'll typically chain are:

```ts
import { isValidDocument } from '@lit-pigeon/core';
import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';

const doc = await llm.generate(...);          // 1. produce
if (!isValidDocument(doc)) throw …;            // 2. validate
const { html } = await new MjmlRenderer().render(doc); // 3. render
// 4. send via your ESP
```

If your downstream platform expects MJML (because it has its own renderer), use `documentToMjml(doc)` from the renderer package and stop there.
