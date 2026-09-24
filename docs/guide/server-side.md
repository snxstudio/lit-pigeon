# Server-side rendering, REST and lint

Three packages run on the server (Node.js 18 or later) without a DOM:

| Package | Version | Use it to |
|---|---|---|
| `@lit-pigeon/ssr` | 0.1.5 | Render documents to HTML, parse MJML, validate, substitute merge tags. |
| `@lit-pigeon/rest` | 0.1.5 | Serve the same functions over HTTP, from your own server or a standalone one. |
| `@lit-pigeon/lint` | 0.1.5 | Check a document before sending: alt text, links, contrast, merge tags and more. |

The examples are tested in
[`examples/test/server-side.test.ts`](./examples/test/server-side.test.ts).
On the server, `mjml` runs natively, so no `mjml-browser` override is needed.

## Render on the server and send

Render from the template's MJML or JSON on the server at send time, rather
than sending HTML that was produced in a browser. That keeps the sent HTML
under your control and lets you personalise per recipient.

<!-- snippet: src/server-side/send-email.ts#load -->
```ts
/** Rebuild the document from what you stored; never send stored HTML as-is. */
export function loadForSending(stored: { mjml: string } | { document: unknown }): PigeonDocument {
  const candidate = 'mjml' in stored ? parseMjml(stored.mjml).document : stored.document;
  const check = validateDocumentSafe(candidate);
  if (!check.valid) throw new Error(`Invalid template: ${check.errors.map((e) => e.message).join('; ')}`);
  return candidate as PigeonDocument;
}
```

<!-- snippet: src/server-side/send-email.ts#send -->
```ts
export async function sendTemplate(
  transport: Transporter,
  document: PigeonDocument,
  subject: string,
  recipients: Recipient[],
): Promise<void> {
  // Pre-flight checks: refuse to send a template with errors (missing links, broken tags, …).
  const blocking = lintDocument(document).issues.filter(
    (issue) => issue.severity === 'error' && !isHeroAltText(document, issue.rule, issue.blockId),
  );
  if (blocking.length > 0) throw new Error(blocking.map((i) => i.message).join('; '));

  for (const recipient of recipients) {
    // Values are HTML-escaped; unknown {{tags}} are replaced with the fallback.
    const { html, errors } = await renderDocument(document, {
      mergeTags: { ...recipient },
      mergeTagFallback: '',
    });
    if (errors.length > 0) throw new Error(errors.map((e) => e.message).join('; '));
    await transport.sendMail({ from: 'news@example.com', to: recipient.email, subject, html });
  }
}

/** Hero blocks have no alt field, so lint's alt-text/missing error cannot be fixed for them. */
function isHeroAltText(document: PigeonDocument, rule: string, blockId?: string): boolean {
  if (rule !== 'alt-text/missing') return false;
  const blocks = document.body.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks));
  return blocks.some((b) => b.id === blockId && b.type === 'hero');
}
```

`transport` is a [Nodemailer](https://nodemailer.com/) transporter; any mail
API that accepts an HTML body works the same way. For large sends, render once
without `mergeTags` and substitute per recipient with `applyMergeTags`, or hand
the rendered HTML to your email service provider's own templating.

A `text/plain` alternative part is not generated yet; plain-text export is
coming in the next release
([#67](https://github.com/snxstudio/lit-pigeon/issues/67)).

## `@lit-pigeon/ssr` API

| Function | Returns | Notes |
|---|---|---|
| `renderDocument(doc, options?)` | `Promise<{ html, mjml, errors }>` | Renders with `MjmlRenderer`, then applies `options.mergeTags` if given. Never rejects; check `errors`. |
| `renderTemplate(template, options?)` | Same | Renders `template.document` (a `Template` from `@lit-pigeon/core`). |
| `renderDocumentToMjml(doc, { outlookWorkarounds? })` | `string` | MJML only. Does not take `fonts`; use `documentToMjml` from `@lit-pigeon/renderer-mjml` when you need them. |
| `parseMjml(mjml, options?)` | `{ document, warnings }` | Same as `mjmlToDocument`. |
| `validateDocumentSafe(value)` | `{ valid, errors }` | Accepts any value. Rejects custom block types; see [Custom blocks](./custom-blocks.md#validation-and-custom-blocks). |
| `applyMergeTags(html, values, { fallback?, escape? })` | `string` | Replaces `{{key}}` and `{{a.b}}` placeholders. |
| `extractMergeTags(html)` | `string[]` | Distinct placeholder paths, sorted. |

`renderDocument` options are the renderer's `RenderOptions` plus two fields:

| Option | Default | Effect |
|---|---|---|
| `outlookWorkarounds` | `true` | Outlook (`mso`) conditional styles, heading margin reset and dark-mode `color-scheme` meta tags. |
| `fonts` | `[]` | `FontDefinition[]`; fonts with a `url` are emitted as `<mj-font>` in the HTML. The returned `mjml` string does not include them. |
| `minify`, `beautify` | `false` | Passed to MJML. |
| `inlineCss` | none | Declared in the types but has no effect: MJML always inlines CSS. |
| `mergeTags` | none | Values for `{{key}}` placeholders. Nested objects are read with dotted paths: `{ user: { plan: 'Pro' } }` fills `{{user.plan}}`. A flat key containing a dot (`{ 'user.plan': 'Pro' }`) does **not** match. |
| `mergeTagFallback` | none | Replacement for placeholders with no value. Without it, they are left in place for a later step. |

`applyMergeTags` HTML-escapes values (`& < > " '`) unless you pass
`escape: false`. Placeholders are matched by `{{\s*[\w.-]+\s*}}`, so
Handlebars blocks such as `{{#if …}}` and `{{/if}}` are left untouched; see
[Merge tags](./merge-tags-and-personalisation.md#row-display-conditions) for
evaluating them.

## REST API

`@lit-pigeon/rest` exposes the SSR and lint functions over HTTP. Mount the
handler in your own server so it sits behind your authentication:

<!-- snippet: src/server-side/rest-server.ts -->
```ts
import express from 'express';
import { createHandler } from '@lit-pigeon/rest';

export function createApp(token: string) {
  const app = express();
  // Express strips the /email prefix, so the handler sees /render, /parse, …
  app.use(
    '/email',
    createHandler({
      bearerToken: token,
      // Same-origin only; set an explicit origin if a browser calls it cross-origin.
      cors: false,
      maxBodyBytes: 2 * 1024 * 1024,
    }),
  );
  return app;
}
```

`createHandler(options)` returns a Node.js `(req, res)` handler, so it also
works with `http.createServer`, Connect and Fastify's middleware support. It
reads and parses the JSON body itself; do not put a JSON body parser in front
of it. It answers every path it receives, so mount it under a prefix.

| Option | Default | Effect |
|---|---|---|
| `bearerToken` | none | Every request (except `OPTIONS`) must send `Authorization: Bearer <token>`, or gets 401. |
| `maxBodyBytes` | 5 MB | Larger bodies get 413. |
| `cors` | `'*'` | `Access-Control-Allow-Origin` value; `false` sends no CORS headers. The allowed methods header lists only `GET, POST, OPTIONS`. |
| `brandKitStorage` | none | Enables the `/brand-kits` routes (503 without it). |
| `assetStorage` | none | Enables the `/assets` and `/asset-folders` routes (503 without it). |

Endpoints:

| Method and path | Body | Response |
|---|---|---|
| `GET /health` | | `{ ok: true }` (the bearer token is required here too) |
| `POST /render` | `{ document, options? }` (`options` as for `renderDocument`) | `{ html, mjml, errors }`, or 400 with `validationErrors` |
| `POST /render/mjml` | `{ document, options? }` | MJML as `text/plain` |
| `POST /validate` | `{ document }` | `{ valid, errors }` |
| `POST /parse` | `{ mjml }` | `{ document, warnings }` |
| `POST /lint` | `{ document }` | Lint report |
| `POST /lint/async` | `{ document }` | Lint report including network checks |
| `GET /brand-kits`, `GET /brand-kits/:id` | | `{ brandKits }`, `{ brandKit }` |
| `POST /brand-kits`, `DELETE /brand-kits/:id` | `{ brandKit }` | `{ ok: true }` |
| `GET /assets?folder=&search=&tags=&limit=&offset=`, `GET /assets/:id` | | `{ assets }`, `{ asset }` |
| `POST /assets`, `DELETE /assets/:id` | `{ asset }` | `{ ok: true }` |
| `GET /asset-folders` | | `{ folders }` |

Errors are `{ error }` JSON with 400 (bad body or invalid document), 401, 404,
405, 413, 500 or 503. `/render`, `/render/mjml` and `/lint` validate the
document first, so documents with custom blocks are rejected.

Standalone use:

- `createServer({ port, host, ...handlerOptions })` returns
  `{ server, ready }`; it binds to `127.0.0.1` and a random port by default.
- The `lit-pigeon-rest` command reads `PORT` (or `LIT_PIGEON_REST_PORT`),
  `HOST` (or `LIT_PIGEON_REST_HOST`) and `LIT_PIGEON_REST_TOKEN`.

Before exposing it:

- It has one shared token, no per-user authorisation and no rate limiting
  (rate limiting is tracked in
  [#15](https://github.com/snxstudio/lit-pigeon/issues/15)). Put it behind your
  own authentication.
- The default CORS origin is `*`. Set `cors` to your origin or `false`.
- `/lint/async` makes outbound requests to every URL in the submitted
  document. Do not expose it to untrusted callers (it can be used to probe
  your internal network), or run it where outbound traffic is restricted.

## `@lit-pigeon/lint`

`lintDocument(doc, { rules? })` runs synchronous checks and returns
`{ issues, summary: { errors, warnings, infos } }`. Each issue has `rule`,
`severity` (`error`, `warning` or `info`), `message`, `path` (for example
`body.rows[0].columns[1].blocks[2].values.alt`) and, where it applies,
`blockId`.

| Rule | Checks |
|---|---|
| `altTextRule` | Images (and hero, video, countdown, carousel blocks) have alt text under 125 characters. |
| `linksRule` | Every link uses an absolute `http(s)`, `mailto` or `tel` URL. |
| `contrastRule` | Button text meets WCAG AA contrast against its background. |
| `previewTextRule` | Preview text is set and between 35 and 90 characters. |
| `spamScoreRule` | The subject and first text block for common spam-filter triggers. |
| `mergeTagsRule` | `{{…}}` placeholders are balanced, non-empty and use `[\w.-]` characters. |
| `emptyContentRule` | Rows and the body contain at least one block. |

`lintDocumentAsync(doc, { asyncRules?, fetcher?, timeoutMs?, concurrency? })`
adds network checks (`imageWeightRule`: hosted images over 1 MB warn and over
3 MB are errors; `linkReachabilityRule`: links must answer 2xx or 3xx) using `fetch`
(timeout 5 s, 8 requests at a time by default). A rule that throws is reported
as a `<rule>/crashed` warning rather than failing the run.

Hero blocks always produce an `alt-text/missing` error, because the hero block
has no alt text field. The example above ignores that error for hero blocks.

## Choosing where to render

| | In the browser (`exportHtml()`) | On the server (`@lit-pigeon/ssr`) |
|---|---|---|
| Bundle cost | `mjml-browser`, about 1.2 MB raw | None in the browser |
| Trust | The HTML comes from the user's browser | You produce the HTML |
| Personalisation | Leaves placeholders for later | `mergeTags` per recipient |
| Typical use | Preview, and storing a copy of the HTML | What you actually send |

A common split is: preview in the browser with `renderer`, store MJML or JSON,
and render on the server at send time. If you do that, you can drop the
browser renderer entirely and handle Preview yourself with the
`pigeon:preview` event and a `/render` call.
