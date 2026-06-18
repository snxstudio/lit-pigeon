# Special Link Types (unsubscribe, view-in-browser, custom) — Design Spec

**Issue:** #24 Special link types (unsubscribe, view-in-browser, custom)
**Date:** 2026-06-17
**Status:** Approved design — ready for implementation plan
**Branch:** `feat/24-special-links` (stacked on `feat/22-saved-rows`)

## Goal

Give email authors first-class "system" links — unsubscribe, view-in-browser,
email, phone — plus host-registered custom link types, surfaced in both the
rich-text link editor and the button panel. Widen the href sanitizers (which
today allow only http/https/mailto) to also permit `tel:` and `{{…}}` template
hrefs.

## Decisions (locked)

- **Set:** built-in system links (Unsubscribe, View-in-browser, Email, Phone)
  **plus** host customs via `EditorConfig.linkTypes`.
- **UI:** a special-link picker in **both** the rich-text link popover and the
  button panel.
- **Template format:** system links emit **fixed** `{{unsubscribe_url}}` /
  `{{view_in_browser_url}}` placeholders, independent of the merge-tag `trigger`
  config (conventional ESP tokens; the host/SSR resolves them at send time).
- **Email/Phone:** `window.prompt` for the address/number; build `mailto:`/`tel:`.
  Empty/cancel → no-op.

## New type + built-ins (core) — `packages/core/src/types/link-type.ts`

```ts
export interface LinkType {
  /** Stable id (also the option value in the picker). */
  id: string;
  /** Label shown in the picker. */
  label: string;
  /** Href template inserted on select (e.g. "{{unsubscribe_url}}"). Omitted for guided types. */
  href?: string;
  /** When set, the picker prompts for a value and builds `mailto:`/`tel:`. */
  prompt?: 'email' | 'tel';
}
```

Built-ins, exported from core (e.g. `packages/core/src/link-types/system-link-types.ts`):

```ts
export const SYSTEM_LINK_TYPES: LinkType[] = [
  { id: 'unsubscribe', label: 'Unsubscribe', href: '{{unsubscribe_url}}' },
  { id: 'view-in-browser', label: 'View in browser', href: '{{view_in_browser_url}}' },
  { id: 'email', label: 'Email address', prompt: 'email' },
  { id: 'phone', label: 'Phone number', prompt: 'tel' },
];
```

`LinkType` + `SYSTEM_LINK_TYPES` re-exported from the core index.
`EditorConfig.linkTypes?: LinkType[]` (host customs, appended after the built-ins).

## Sanitizer changes (all three href gates)

Today only `http`/`https`/`mailto` (+ `#`/`/`) are allowed. Widen each to also
permit `tel:` and merge-tag-style `{{…}}` template hrefs:

1. **`packages/editor/src/rich-text/extensions/link.ts`** — add `'tel'` to
   `protocols`. A `{{…}}` href has no scheme; verify `setLink({ href:
   '{{unsubscribe_url}}' })` keeps it. If TipTap's built-in URI validation
   strips it, add a `validate`/`isAllowedUri` that also accepts a leading `{{`.
2. **`packages/editor/src/rich-text/ui/bubble.ts`** `_applyLink` — extend the
   guard regex from `/^(https?:|mailto:|#|\/)/i` to also accept `tel:` and a
   leading `{{`:
   ```ts
   if (!/^(https?:|mailto:|tel:|#|\/|\{\{)/i.test(href)) return;
   ```
3. **`packages/editor/src/rich-text/serialization.ts`** — add `'tel:'` to
   `SAFE_HREF_PROTOCOLS`, and add an explicit branch in `isSafeHref` allowing a
   merge-tag template href (e.g. `/^\{\{[\w.]+\}\}$/`) rather than relying on the
   relative-URL fallthrough. `javascript:` etc. remain blocked.

> The button block's href is rendered by the renderer (not the rich-text
> sanitizer); button hrefs are validated at the panel input (below). Template/
> `tel:` hrefs in buttons render verbatim, as today.

## New control — `packages/editor/src/components/properties/controls/pigeon-link-type-picker.ts`

`<pigeon-link-type-picker>`:
- `@property linkTypes: LinkType[]` (built-ins + customs, passed in).
- Renders a compact `<select>`/menu labelled "Special link" with one option per
  type (placeholder first option = "— Special link —", non-selecting).
- On select: if the type has `prompt`, `window.prompt('Email address'|'Phone
  number')`; empty/cancel → reset selection, no emit; else build
  `mailto:<addr>` / `tel:<num>`. If no `prompt`, use `type.href`.
- Emits `link-type-select` `{ href }` (bubbles + composed). Resets its own value
  after emit so the same type can be picked again.

Shared by both consumers; each applies the emitted href its own way.

## Editor wiring (`packages/editor/src/editor.ts`)

- `_linkTypes(): LinkType[]` = `[...SYSTEM_LINK_TYPES, ...(this.config.linkTypes ?? [])]`.
- Bind `.linkTypes=${this._linkTypes()}` on `<pigeon-rich-text-bubble>` and on
  `<pigeon-properties>` (forwarded to the button panel).

## Consumers

- **Rich-text bubble** (`bubble.ts` `_renderLinkPopover`): add
  `<pigeon-link-type-picker .linkTypes=${this.linkTypes}>` beside the URL input.
  Handle `link-type-select`: set `this._linkValue = e.detail.href` and call
  `_applyLink()` (which now accepts the widened hrefs). Add a `linkTypes`
  property to the bubble component.
- **Button panel** (`button-panel.ts`): add the picker beside the Link URL
  field; on `link-type-select`, `this._emit({ href: e.detail.href })`. Add a
  `linkTypes` property; `pigeon-properties` forwards `.linkTypes` to it.

## Data flow

1. Host sets `config.linkTypes` (optional). Editor merges with `SYSTEM_LINK_TYPES`.
2. User opens the link popover (text) or focuses the button Link URL, picks a
   special link → picker resolves the href (prompt for email/phone) → emits
   `link-type-select { href }`.
3. Bubble sets the link mark / button panel sets `href`. Sanitizers accept the
   template/`tel:` href.
4. On render/export, the href is emitted verbatim; the host resolves `{{…}}` at
   send time (same as merge tags).

## Error handling

- Empty/cancelled prompt → no emit, picker resets.
- Widened sanitizers still reject `javascript:`, `data:`, etc.
- Unknown/extra `LinkType` fields ignored; a type with neither `href` nor
  `prompt` is skipped by the picker.

## Testing

**core** (`packages/core/__tests__/`):
1. `SYSTEM_LINK_TYPES` contains unsubscribe/view-in-browser/email/phone with the
   expected hrefs/prompts; `LinkType`/`EditorConfig.linkTypes` usable.

**editor — sanitizers** (`packages/editor/__tests__/`):
2. `serialization.sanitizeHTML`: an `<a href="tel:+15551234">` and an
   `<a href="{{unsubscribe_url}}">` survive; `<a href="javascript:alert(1)">` is
   stripped (extend the existing rich-text-sanitizer test).
3. Bubble `_applyLink` accepts `tel:` and `{{…}}` (and still rejects `javascript:`).

**editor — picker + consumers**:
4. `<pigeon-link-type-picker>`: selecting Unsubscribe emits `link-type-select`
   with `{ href: '{{unsubscribe_url}}' }`; selecting Email with a stubbed
   `window.prompt` returning `a@b.com` emits `{ href: 'mailto:a@b.com' }`;
   cancelled prompt → no emit.
5. Button panel: a `link-type-select` from the picker emits `property-change`
   with the new `href`.
6. Bubble integration: `linkTypes` flow renders the picker in the link popover.

## Out of scope

- Resolving `{{…}}` placeholders (host/SSR concern, not the editor).
- A UI to *author* custom link types inside the editor (host-provided config).
- Per-link tracking params / UTM builders.
- Validating that an `{{…}}` token actually maps to a known merge tag.
