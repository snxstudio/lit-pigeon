# Custom Font Management (fontConfig + web-font export) — Design Spec

**Issue:** #23 Custom font management (fontConfig + web-font export)
**Date:** 2026-06-16
**Status:** Approved design — ready for implementation plan
**Branch:** `feat/23-custom-fonts` (stacked on `feat/6-brand-kit-panel`)

## Goal

Let hosts register brand/web fonts so they (a) appear as options in the editor
font picker and (b) are emitted by the MJML renderer as `<mj-font>` so email
clients load them, falling back via email-safe family stacks. This is the
registration + render side that complements #6 (which made brand-kit fonts
*selectable* but not *rendered*).

## Decisions (locked)

- **Emit scope:** the renderer emits a load tag for **every** registered font
  that has a `url` (not just document-used fonts). Simple, predictable.
- **Mechanism:** `<mj-font name="…" href="…" />` where the URL is a CSS
  stylesheet (e.g. Google Fonts). No raw `@font-face`/font-file support in this
  issue.
- **Brand-font unification:** rendering is driven by `fontConfig` **plus**
  brand-kit fonts that carry a `url`. A brand font you can select and that has a
  URL will also load in the export — closing the #6 deferral.

## New type (core)

`packages/core/src/types/font.ts` (exported from the core index):

```ts
export interface FontDefinition {
  /** Display name shown in the font picker. */
  name: string;
  /** CSS font-family stack, including email-safe fallbacks (e.g. "Inter, Arial, sans-serif"). */
  family: string;
  /** Optional stylesheet URL that loads the web font (e.g. a Google Fonts CSS link). */
  url?: string;
}
```

`BrandFont` (`{ id; name; family; weights?; url? }`) is structurally a superset
of `FontDefinition`, so a `BrandFont` is assignable to `FontDefinition` — brand
fonts and fontConfig fonts can be merged into one `FontDefinition[]`.

## Config / options surface (core)

- `EditorConfig.fontConfig?: FontDefinition[]` — `packages/core/src/types/editor.ts:44`.
- `RenderOptions.fonts?: FontDefinition[]` — `packages/core/src/types/editor.ts:166`.

## Architecture

```
host config.fontConfig ─┐
                        ├─► editor merges → font picker (selection)
brandKit.fonts ─────────┘            │
                                     └─► editor render-set = fontConfig + brand fonts with url
                                                │
                              ┌─────────────────┴───────────────────┐
                              ▼                                      ▼
                  preview render call               host export: renderer.render(doc, { fonts })
                  (documentToMjml/renderer                          │
                   with { fonts })                                  ▼
                              └────────────────────►  renderHead() emits <mj-font name href>
```

### Renderer (`@lit-pigeon/renderer-mjml`)

1. `DocumentToMjmlOptions` gains `fonts?: FontDefinition[]`
   (`document-to-mjml.ts:171`).
2. `renderHead()` (`document-to-mjml.ts:223`) emits, for each font in
   `options.fonts` that has a non-empty `url`, font-load tags placed in
   `<mj-head>` **before** `<mj-attributes>`:
   ```
   <mj-font name="Inter" href="https://fonts.googleapis.com/css?family=Inter" />
   <mj-raw><link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter"></mj-raw>
   ```
   - `name` (on `<mj-font>`) = the primary family token:
     `family.split(',')[0].trim()` with surrounding quotes stripped.
   - **Why both tags:** MJML's `<mj-font>` only injects a stylesheet into the
     HTML when the font's family is *actually used* in the document. The agreed
     decision is to load **all** registered fonts with a URL (not just used
     ones), so a companion `<mj-raw><link rel="stylesheet">` guarantees the
     stylesheet loads regardless of usage. (Verified empirically:
     `<mj-font>` alone emits zero URLs for an unused font.)
   - Deduped by `href` (a font registered twice, or two fonts sharing a URL,
     emit one pair of tags).
   - URL and name go through the existing `escapeAttr`.
   - Fonts without a `url` are skipped (selection-only).
   - *Known minor:* when a registered font IS the document font, its URL appears
     redundantly (mj-font `<link>` + mj-font `@import` + the raw `<link>`);
     clients dedupe by URL. A follow-up could switch to raw-link-only.
3. `documentToMjml(doc, options)` resolves `fonts: options?.fonts ?? []` into
   the `Required<DocumentToMjmlOptions>` shape and passes it to `renderHead`.
4. `mjml-renderer.ts` threads `options.fonts` from `RenderOptions` into its
   `documentToMjml(doc, { …, fonts })` call.
5. With no `fonts` (or all URL-less), output is **byte-identical** to today
   (regression-safe).

### Editor (`@lit-pigeon/editor`)

1. **Picker listing.** `<pigeon-properties>` gains a `fontConfig:
   FontDefinition[]` property (passed from `<pigeon-editor>` =
   `config.fontConfig ?? []`). Its existing font-list getter now returns the
   deduped merge `[...fontConfig, ...(brandKit?.fonts ?? [])]` and forwards it
   to `<pigeon-body-panel>` → `<pigeon-font-picker>`. The picker prop
   (`brandFonts`) is widened to `FontDefinition[]` (BrandFont[] stays
   assignable) and keeps de-duping by `family`. Prop name unchanged to avoid
   churn; documented as "selectable fonts beyond the built-in defaults".
2. **Render-set.** `<pigeon-editor>` exposes a `_renderFonts()` helper:
   `dedupeByFamily([...(config.fontConfig ?? []), ...brandFontsWithUrl])` where
   `brandFontsWithUrl = this._activeBrandKit?.fonts.filter(f => f.url) ?? []`.
3. **Preview loads fonts.** `<pigeon-preview>` gains `fonts?: FontDefinition[]`;
   `_loadPreview()` calls `this.documentToMjml(this.doc, { fonts: this.fonts })`
   and `this.renderer.render(this.doc, { fonts: this.fonts })`. The
   `documentToMjml` prop type widens to `(doc, options?) => string`
   (backward-compatible: a host fn ignoring the 2nd arg still works). The editor
   binds `.fonts=${this._renderFonts()}` on `<pigeon-preview>`.
4. **Export includes fonts.** `exportMjml()` / `exportHtml()` pass
   `{ fonts: this._renderFonts() }` to `documentToMjml` / `renderer.render`.

## Data flow

1. Host sets `config.fontConfig`. Picker lists those fonts + brand-kit fonts.
2. User selects a font → sets `body.attributes.fontFamily` (existing path).
3. On preview/export, the editor passes the render-set; on a host's own export,
   the host passes `fontConfig` to `renderer.render(doc, { fonts })`.
4. `renderHead` emits `<mj-font>` for each URL-bearing font; `<mj-all
   font-family>` continues to set the document font; clients load the
   stylesheet and fall back through the family stack.

## Error handling

- URL-less fonts are skipped for `<mj-font>` (still selectable).
- Duplicate hrefs deduped; render-set deduped by family.
- Nothing throws; family stacks are trusted to carry fallbacks (the host
  supplies email-safe stacks). No `fonts` option ⇒ no behavior change.

## Testing (vitest)

**Renderer** (`packages/renderer-mjml/__tests__/`):
1. `documentToMjml(doc, { fonts })` emits `<mj-font name href>` for each
   URL-bearing font, with `name` = primary family token.
2. URL-less fonts emit no `<mj-font>`.
3. Two fonts sharing a URL (or one font listed twice) emit a single tag (dedup).
4. No `fonts` option ⇒ output unchanged (snapshot/contains assertion vs current).
5. `mjml-renderer.render(doc, { fonts })` produces HTML whose head includes the
   font stylesheet link (mjml2html turns `<mj-font>` into a `<link>`/`@import`).

**Editor** (`packages/editor/__tests__/`):
6. Properties/body-panel font picker lists `fontConfig` fonts merged with brand
   fonts (dedup by family).
7. `<pigeon-preview>` calls `documentToMjml`/`renderer.render` with the `fonts`
   option (spy/mock asserts the option is passed).
8. Editor `_renderFonts()` = fontConfig + brand fonts with a URL, deduped; brand
   fonts without a URL are excluded from the render-set (but still selectable).

## Out of scope

- Raw `@font-face` / self-hosted font-file emission (woff2 `src`, weights,
  formats). Only stylesheet-URL `<mj-font>` here.
- Per-block font-family (the document model has no block-level font field).
- A UI to *author* `fontConfig` inside the editor (it is host-provided config;
  brand-kit fonts are the in-editor authoring path, via #6).
