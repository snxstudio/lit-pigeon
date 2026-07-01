# @lit-pigeon/ssr

Server-side rendering API for [Lit Pigeon](https://github.com/snxstudio/lit-pigeon).
Render, parse, validate, and merge-tag-substitute `PigeonDocument`s from Node
with **zero DOM dependencies** — built for transactional email pipelines and
edge/worker runtimes.

## Install

```bash
npm install @lit-pigeon/ssr
```

## Usage

```ts
import {
  renderDocument,
  parseMjml,
  validateDocumentSafe,
  applyMergeTags,
} from '@lit-pigeon/ssr';

// Validate, then render to email-safe HTML — with merge tags substituted.
const check = validateDocumentSafe(doc);
if (!check.valid) throw new Error(JSON.stringify(check.errors));

const { html, mjml, errors } = await renderDocument(doc, {
  mergeTags: { firstName: 'Ada', 'user.plan': 'Pro' },
  outlookWorkarounds: true,
});

// Import an existing MJML template into a document.
const { document, warnings } = parseMjml(existingMjml);

// Or substitute {{key}} placeholders into already-rendered HTML.
const personalised = applyMergeTags(html, { firstName: 'Grace' });
```

Also exported: `renderDocumentToMjml`, `renderTemplate` (render a stored
`Template` from `@lit-pigeon/core`), and `extractMergeTags`. Every function is
stateless — no globals, no editor instance. To serve these over HTTP, use
[`@lit-pigeon/rest`](../rest).

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
