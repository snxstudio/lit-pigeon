# Security

An email editor handles HTML from people and from stored templates, and
produces HTML that other systems send. This page describes what the editor
protects against in `@lit-pigeon/editor` 0.3.3, what it does not, and what a
host application must do itself.

## How HTML is handled in the editor

| Where | Content | Handling in 0.3.3 |
|---|---|---|
| Canvas: text, hero and button blocks | Block `content` HTML | **Rendered unsanitised** into the page (Lit `unsafeHTML`). Script in imported or stored content, such as `<img onerror>`, runs with your application's origin when the block is displayed. A fix that sanitises this HTML is in review ([#95](https://github.com/snxstudio/lit-pigeon/issues/95)) and is coming in the next release. |
| Canvas: HTML blocks | Block `content` HTML | Rendered in an `<iframe sandbox="allow-same-origin">` with no script permission (since 0.3.3). Stored content is unchanged. |
| Canvas: custom blocks | `renderCanvas()` output | Rendered unsanitised. Escape values yourself; see [Custom blocks](./custom-blocks.md). |
| Inline rich-text editing | What the user types or pastes | TipTap's schema plus an allowlist sanitiser: `p`, `br`, `strong`, `em`, `s`, `u`, `code`, `a`, `h1`–`h3`, `ul`, `ol`, `li`, `blockquote`, `span`; `href` only for `http`, `https`, `mailto`, `tel`, relative and `{{tag}}` URLs; `style` only on `span` and only `color`, `font-family`, `font-size`. Applied only when the content changes; leaving inline editing without a change keeps the stored HTML exactly. |
| Preview | Rendered email HTML | Shown in an `<iframe sandbox="allow-popups allow-popups-to-escape-sandbox">`: no script, no access to your origin, links open in a new tab (since 0.3.3). |
| Export (`exportMjml()`, `exportHtml()`) | The whole document | Not sanitised. HTML blocks and text content are passed through, because email HTML must contain them. Attribute values are escaped, but `href` schemes are not checked, and some values (row and column background colours, text line height and alignment) are written into the MJML as they are. |

Until the canvas fix ships, **only load documents into the editor from sources
you trust**, or sanitise the `content` of text, hero and button blocks before
loading (for example with DOMPurify, keeping inline styles). This matters most
when importing third-party MJML or Unlayer designs.

## What the host application must do

### Validate documents on the server

Everything the editor produces comes from a browser you do not control, and
anyone with the endpoint can send you a hand-written document. Check it before
storing or rendering. The example below rejects documents that fail schema
validation or contain script, event handlers, unsafe URLs, malformed colours
or unexpected condition syntax:

<!-- snippet: src/security/check-document.ts -->
```ts
import { validateDocument, type PigeonDocument } from '@lit-pigeon/core';

const MAX_BYTES = 1024 * 1024;
const SAFE_HREF = /^(https?:|mailto:|tel:|#|\{\{[\w.]+\}\}$)/i;
const COLOUR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i;
const UNSAFE_HTML = /<\s*(script|iframe|object|embed|form|base|meta)\b|\son\w+\s*=|javascript:/i;
const HTML_FIELDS = ['content'];
const URL_FIELDS = ['href', 'src', 'backgroundUrl', 'backgroundImage'];
const COLOUR_FIELDS = ['backgroundColor', 'textColor', 'borderColor', 'linkColor'];

/**
 * Server-side policy check for documents received from the browser. It rejects
 * rather than repairs; pair it with a proper HTML sanitiser if you need to
 * accept arbitrary HTML blocks.
 */
export function checkDocument(input: unknown): { document?: PigeonDocument; problems: string[] } {
  if (JSON.stringify(input).length > MAX_BYTES) return { problems: ['document too large'] };
  const problems = validateDocument(input).map((e) => `${e.path}: ${e.message}`);
  if (problems.length > 0) return { problems };
  const document = input as PigeonDocument;

  const inspect = (path: string, values: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(values)) {
      if (typeof value !== 'string' || value === '') continue;
      if (HTML_FIELDS.includes(key) && UNSAFE_HTML.test(value)) problems.push(`${path}.${key}: unsafe HTML`);
      if (URL_FIELDS.includes(key) && !SAFE_HREF.test(value.trim())) problems.push(`${path}.${key}: unsafe URL`);
      if (COLOUR_FIELDS.includes(key) && !COLOUR.test(value.trim())) problems.push(`${path}.${key}: invalid colour`);
    }
  };

  inspect('body.attributes', document.body.attributes);
  document.body.rows.forEach((row, r) => {
    inspect(`body.rows[${r}].attributes`, row.attributes);
    if (row.attributes.condition && !/^[\w.! ]+$/.test(row.attributes.condition)) {
      problems.push(`body.rows[${r}].attributes.condition: unexpected characters`);
    }
    row.columns.forEach((column, c) => {
      inspect(`body.rows[${r}].columns[${c}].attributes`, column.attributes);
      column.blocks.forEach((block, b) => inspect(`body.rows[${r}].columns[${c}].blocks[${b}].values`, block.values));
    });
  });
  return { document: problems.length ? undefined : document, problems };
}
```

This is a policy check, not a sanitiser: pattern matching can be bypassed by
unusual markup. If your users need HTML blocks with arbitrary markup, run the
content through a maintained server-side HTML sanitiser configured for email
(tables and inline styles allowed; script, event handlers and `javascript:`
URLs removed), and still render the result in a sandbox wherever you display
it. The example is tested in
[`examples/test/security.test.ts`](./examples/test/security.test.ts).

When a template is stored as MJML, parse it with `mjmlToDocument` on the
server and apply the same check to the result.

### Never trust stored HTML

The `html` you store alongside a template was produced in the user's browser.
Do not send it or display it as-is:

- **Sending**: re-render from the validated MJML or JSON on the server at send
  time with `@lit-pigeon/ssr`; see [Server-side](./server-side.md).
- **Displaying** (template lists, thumbnails, approval screens): show it in an
  `<iframe sandbox>` without `allow-scripts` and without `allow-same-origin`,
  or from a separate origin. Never insert it into your application's DOM.

### Treat conditions and merge-tag values as template code

- A row's display condition is copied verbatim into the HTML as
  `{{#if …}}`. If your sending pipeline runs a template engine over the HTML,
  a condition is code that runs in it. Restrict who can set conditions and
  what characters they may contain (as the check above does).
- The same applies to any `{{…}}` text in content: if you run Handlebars or
  Liquid over the whole email, a user who can edit content can use its
  helpers. Prefer an engine configuration without dangerous helpers.
- Merge-tag **values** usually come from recipients' data.
  `applyMergeTags` HTML-escapes them by default; keep `escape: true`.
  Handlebars `{{…}}` also escapes; avoid `{{{…}}}`.

### Validate uploads on the server

The asset manager checks `acceptedTypes` and `maxFileSize` in the browser, and
reads the type from `file.type`, which the browser derives from the file name.
Both checks are for convenience only. On the upload endpoint (or when signing a
presigned upload):

- enforce size and content type, and check the file's actual content;
- consider rejecting SVG, which can contain script;
- serve uploaded files from a separate domain with `Content-Type` set and
  `X-Content-Type-Options: nosniff`;
- authorise the request as you would any other API call; the editor sends
  whatever headers your `uploadHandler` or `uploadHeaders` add.

### Keep secrets out of the browser

Everything in `config` is visible to the user. Stock photo keys
(`assetManager.stock`) are used from the browser by design, so use keys that
are meant to be public. Do not put API secrets in `uploadHeaders`; use the
signed-in user's own short-lived token.

### Server packages

`@lit-pigeon/rest` allows any origin by default, uses one shared bearer token,
has no rate limiting, and its `/lint/async` endpoint fetches every URL in a
submitted document. Mount it behind your own authentication and restrict
`cors`; see [Server-side](./server-side.md#rest-api).

## Content Security Policy

Measured with the production Angular 22 verification application in Chromium:

| Directive | What the editor needs |
|---|---|
| `script-src 'self'` | Sufficient: no `unsafe-inline` or `unsafe-eval` needed for editing, preview, upload, save or export. `mjml-browser` probes `new Function` once, which is reported as a violation but does not stop rendering. |
| `style-src` | Needs `'unsafe-inline'`. The rich-text engine inserts a `<style>` element, and inline `style` attributes are set while editing. The editor's own component styles use constructable stylesheets and are not affected. Angular's component styles also need it, unless you use Angular's nonce support. |
| `img-src` | Your image CDN, `data:` (only if you allow the `data:` upload fallback), and `images.unsplash.com` / `images.pexels.com` for stock photos. |
| `connect-src` | Your API and upload endpoint, your storage bucket for presigned uploads, and `api.unsplash.com` / `api.pexels.com` for stock search. |
| `font-src`, `style-src` | Any web font hosts in `fontConfig` (for example `fonts.googleapis.com` and `fonts.gstatic.com`), for the preview. |
| `frame-src` | Nothing extra: the preview and HTML blocks use `srcdoc` iframes, which inherit the page's policy. |

Because the preview and HTML-block iframes inherit your policy, a strict
`img-src` or `style-src` also applies to the email being previewed.

Angular itself adds an inline `onload` handler to its inlined critical CSS in
production builds, which `script-src 'self'` blocks. If you use a strict
`script-src`, set `"optimization": { "styles": { "inlineCritical": false } }`
in the production configuration.

## Reporting vulnerabilities

See [`SECURITY.md`](../../SECURITY.md) in the repository.
