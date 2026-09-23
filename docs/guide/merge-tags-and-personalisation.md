# Merge tags and personalisation

Lit Pigeon does not personalise emails itself. It lets users insert
placeholders such as `{{first_name}}`, keeps them intact through MJML and HTML,
and writes row display conditions as `{{#if …}}` blocks. Your sending platform
(or `@lit-pigeon/ssr`, or a template engine) fills them in at send time.

The behaviour on this page is pinned by
[`examples/test/merge-tags.test.ts`](./examples/test/merge-tags.test.ts).

## Configuring merge tags

```text
interface MergeTagConfig {
  trigger?: string;     // declared, but has no effect in @lit-pigeon/editor 0.3.3
  tags?: MergeTag[];
}

interface MergeTag {
  name: string;         // inserted as-is, e.g. '{{first_name}}'
  label: string;        // shown in the picker
  category?: string;    // groups tags in the picker
  sample?: string;      // example value shown next to the label
}
```

<!-- snippet: src/merge-tags/static-tags.ts -->
```ts
import type { EditorConfig, MergeTag } from '@lit-pigeon/core';

// `name` is inserted verbatim, so include the braces your sending platform expects.
export const contactTags: MergeTag[] = [
  { name: '{{first_name}}', label: 'First name', category: 'Contact', sample: 'Ada' },
  { name: '{{last_name}}', label: 'Last name', category: 'Contact', sample: 'Lovelace' },
  { name: '{{order_number}}', label: 'Order number', category: 'Order', sample: 'A-1042' },
];

export const staticTagsConfig: Partial<EditorConfig> = {
  mergeTags: { tags: contactTags },
};
```

With `config.mergeTags` set, a **Tag** button appears in the text panel, the
HTML panel and the body panel (for the preview text). Choosing a tag inserts
`name` at the cursor:

- In the text and HTML panels' source fields and in the preview text, `name`
  is inserted exactly as written.
- While a text block is being edited inline on the canvas, the tag is inserted
  as a chip, and saved as `{{identifier}}`.

Use names of the form `{{identifier}}`, where the identifier matches
`[A-Za-z_][A-Za-z0-9_]*` (for example `{{first_name}}`). Only those are shown
as chips in inline editing and kept by the rich-text editor's sanitiser.
Dotted or indexed names (`{{user.name}}`, `{{items[0]}}`) and other syntaxes
(`*|FNAME|*`, `%%name%%`) can be typed or inserted into the source fields, but
the inline editor does not treat them as merge tags.

Without `config.mergeTags`, no Tag button is shown.

## Loading tags on demand: `pigeon:merge-tag-request`

If the tag list is large or depends on the user, set `mergeTags` without tags
(`{}` or `{ tags: [] }`). The Tag button is then shown, and each click fires
`pigeon:merge-tag-request` on the editor instead of opening the picker. Answer
with `setMergeTags(tags)`; the user's next click opens the picker.

<!-- snippet: src/merge-tags/lazy-tags.ts -->
```ts
import type { PigeonEditor } from '@lit-pigeon/editor';
import type { MergeTag } from '@lit-pigeon/core';

/**
 * Loads merge tags the first time the user clicks a Tag button. The editor
 * fires pigeon:merge-tag-request on every click while it has no tags, so load
 * once and ignore clicks while a request is in flight.
 */
export function provideMergeTagsOnDemand(editor: PigeonEditor, load: () => Promise<MergeTag[]>): void {
  // An empty mergeTags object shows the Tag button without any tags.
  editor.config = { ...editor.config, mergeTags: {} };
  let pending: Promise<void> | undefined;
  editor.addEventListener('pigeon:merge-tag-request', () => {
    pending ??= load()
      .then((tags) => editor.setMergeTags(tags))
      .catch(() => {
        pending = undefined;
      });
  });
}
```

Points to note:

- The event has no `detail`; it does not say which field asked.
- `setMergeTags()` replaces the element's `config` with a copy. If your
  framework later assigns a new `config`, include the tags in it, or they are
  lost. In Angular, update the bound `[config]` instead; see
  [Angular](./angular.md#standalone-import).
- Wrappers: Vue and Svelte re-emit the event as `mergeTagRequest`. React and
  Angular have no output for it; listen on the element (React ref) or the host
  element (Angular).

## Special links

The link editor and the button panel offer link types that insert template
URLs. Built in (`SYSTEM_LINK_TYPES` in `@lit-pigeon/core`):

| Id | Label | Inserts |
|---|---|---|
| `unsubscribe` | Unsubscribe | `{{unsubscribe_url}}` |
| `view-in-browser` | View in browser | `{{view_in_browser_url}}` |
| `email` | Email address | Prompts for an address and builds `mailto:` |
| `phone` | Phone number | Prompts for a number and builds `tel:` |

Add your own with `config.linkTypes`, for example
`{ id: 'preferences', label: 'Email preferences', href: '{{preferences_url}}' }`
(see [Configuration](./configuration.md)). Hrefs of the form `{{name}}` or
`{{a.b}}` are accepted by the link sanitiser.

## What happens at render time

Merge tags are text. `documentToMjml` and `MjmlRenderer` pass them through
unchanged, so the exported MJML and HTML still contain `{{first_name}}`. Fill
them in with:

- your email service provider's own template language, if it uses the same
  syntax;
- `applyMergeTags(html, values)` or `renderDocument(doc, { mergeTags })` from
  `@lit-pigeon/ssr`, which replace `{{key}}` and dotted `{{a.b}}` paths,
  HTML-escape values by default, and leave unknown tags in place (or use
  `mergeTagFallback`); see [Server-side](./server-side.md);
- a template engine such as Handlebars, which also evaluates conditions (below).

`@lit-pigeon/ssr` does not evaluate `{{#if}}` blocks; it leaves them in place.

`@lit-pigeon/lint`'s `merge-tags` rule reports malformed placeholders
(unbalanced braces, empty `{{}}`, characters outside `[\w.-]`) before you send.

## Row display conditions

A row can carry a display condition. The editor's row panel has a
"Display condition" field; in code it is `RowNode.attributes.condition`:

<!-- snippet: src/merge-tags/conditions.ts#condition -->
```ts
const offer = createBlock('text') as TextBlock;
offer.values.content = '<p>Your members-only offer, {{first_name}}.</p>';
const row = createRow([createColumn([offer])]);
// Only rows can carry a condition. It is written out verbatim as {{#if …}}.
row.attributes.condition = 'is_member';

const document = createDefaultDocument('Offer');
document.body.rows.push(row);
```

The renderer wraps the row's section in `<mj-raw>{{#if is_member}}</mj-raw>`
… `<mj-raw>{{/if}}</mj-raw>`, so the compiled HTML contains
`{{#if is_member}}` … `{{/if}}` around the row's table. The expression is
copied verbatim, in Handlebars-style syntax; it is not validated.
The MJML parser reads these markers back into `condition`, so conditions
survive the MJML round trip.

Something must evaluate the condition before the email is sent. With
Handlebars:

<!-- snippet: src/merge-tags/conditions.ts#send -->
```ts
/** Compiles the email once, then evaluates merge tags and conditions per recipient. */
export async function compileForSending() {
  // No mergeTags here: every {{…}} is left in place for the template engine.
  const { html, errors } = await renderDocument(document);
  if (errors.length) throw new Error(errors.map((e) => e.message).join('; '));
  return Handlebars.compile(html);
}
```

`compileForSending()` returns a function; calling it with
`{ is_member: true, first_name: 'Ada' }` includes the row, and with
`is_member: false` omits it. Handlebars HTML-escapes `{{…}}` values by default.

If your sending platform uses a different syntax (for example Liquid's
`{% if %}`), convert the markers when you compile, or evaluate conditions
yourself before sending.

Conditions are only supported on rows. Because the expression is inserted into
the HTML unchanged, treat it as template code: restrict who can set it, and do
not let recipients' data reach it. See [Security](./security.md).

## Not yet available

The following are not in the current release. They are listed here so you can
plan for them; do not build against them yet.

| Feature | Status |
|---|---|
| Display conditions on individual blocks | Coming in the next release ([#26](https://github.com/snxstudio/lit-pigeon/issues/26)) |
| Loops or repeat blocks for arrays (for example order line items) | Coming in the next release ([#99](https://github.com/snxstudio/lit-pigeon/issues/99)) |
| Hiding rows or blocks on mobile or desktop | Coming in the next release ([#69](https://github.com/snxstudio/lit-pigeon/issues/69), [#25](https://github.com/snxstudio/lit-pigeon/issues/25)) |

Until then, repeated content such as line items can go in an HTML block that
contains your template engine's loop syntax, rendered by your sending
pipeline. `@lit-pigeon/lint` reports such block helpers (`{{#each …}}`) as
`merge-tags/invalid-name` warnings, which you can ignore for those blocks.
