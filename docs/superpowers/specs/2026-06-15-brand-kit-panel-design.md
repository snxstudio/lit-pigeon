# Brand-Kit Panel & Consumption — Design Spec

**Issue:** #6 `<pigeon-brand-kit-panel>` editor UI
**Date:** 2026-06-15
**Status:** Approved design — ready for implementation plan

## Goal

Make the editor consume and manage `EditorConfig.brandKit`. Saved brand
**colors** appear as swatches in color pickers, saved **fonts** appear as
font-family options, and a dedicated **Brand** tab in the palette lets users
create / edit / delete brand colors, fonts, and logos. Closes the last v0.5
coherence gap (the brand-kit data layer already exists; only the consuming UI
is missing).

## Decisions (locked)

- **Scope:** full management panel (create / edit / delete colors, fonts,
  logos) **plus** consumption (swatches in color pickers, fonts in the font
  picker).
- **Kit resolution — single active kit:** if `config.brandKit` is a plain
  `BrandKit` object, use it directly; if it is a `BrandKitStorage`, async-load
  `list()` and use the first kit (`[0]`). No kit-switcher UI.
- **Panel placement:** a new **Brand** tab in `<pigeon-palette>`, beside the
  existing Content / Layers tabs. Shown only when `config.brandKit` is
  provided.
- **No-storage edits:** edits always apply in-memory and the editor emits a
  public `brand-kit-change` event with the updated kit. When a
  `BrandKitStorage` is present, the editor also calls `storage.save(kit)`.
- **Brand-tab color-swatch click:** applies the color to the current
  selection's primary color via a mapping (below). A subtle hint shows when no
  compatible element is selected.

## Existing infrastructure (reuse — do not rebuild)

- `EditorConfig.brandKit?: BrandKit | BrandKitStorage`
  — `packages/core/src/types/editor.ts:63`
- `BrandKit` / `BrandColor` / `BrandFont` / `BrandLogo` / `BrandKitStorage`
  — `packages/core/src/types/brand-kit.ts`
  - `BrandColor { id; name; value }`
  - `BrandFont  { id; name; family; weights?; url? }`
  - `BrandLogo  { id; name; src; width? }`
  - `BrandKitStorage { list(); get(id); save(kit); delete(id) }` (all async)
- `InMemoryBrandKitStorage` — `packages/core/src/brand-kit/in-memory-storage.ts`
- `FsBrandKitStorage` — `packages/mcp-server/src/store/fs-brand-kit-storage.ts`
- Distribution pattern: `<pigeon-editor>` prop-drills shared data
  (`.mergeTags`, `.assetStorage`) → `<pigeon-properties>` → panels; panels emit
  bubbling/composed `CustomEvent`s back up. No `@lit/context` in the codebase.

## Architecture

Brand-kit state lives in the **`<pigeon-editor>` web component**, parallel to
`templateStorage` / `assetStorage` — NOT in the core document `EditorState`
(brand-kit edits are not document mutations and must stay out of undo/redo
history).

```
<pigeon-editor>
  ├─ _activeBrandKit: BrandKit | null     (reactive @state)
  ├─ _brandKitStorage: BrandKitStorage | null
  ├─ _resolveBrandKit()                   (duck-types .list ⇒ storage)
  ├─ prop-drills colors→swatches / fonts  ▼
  ├─ <pigeon-palette  .brandKit=…>         → Brand tab (CRUD + apply)
  └─ <pigeon-properties .brandKit=…>       → forwards to panels
        ├─ <pigeon-color-picker .swatches=…>   (new swatch row)
        └─ <pigeon-font-picker  .fonts=…>      (new reusable control)
```

### Components / units

1. **`_resolveBrandKit()` in `<pigeon-editor>`**
   - Input: `config.brandKit`. Output: sets `_activeBrandKit` + `_brandKitStorage`.
   - Storage detection: `typeof brandKit.list === 'function'`.
   - Storage branch is async (`firstUpdated`); object branch is sync.

2. **`<pigeon-color-picker>` swatches** (`controls/color-picker.ts`)
   - New `@property({attribute:false}) swatches: BrandColor[] = []`.
   - Renders a swatch row below the existing color/hex inputs when non-empty.
   - Swatch click → set `value` + emit existing `color-change`. Backward
     compatible: empty `swatches` ⇒ identical to today.

3. **`<pigeon-font-picker>`** (new — `controls/font-picker.ts`)
   - `@property value`, `@property({attribute:false}) fonts: FontOption[]`.
   - Merges built-in default families (moved out of `body-panel.ts`) with brand
     fonts; brand fonts grouped/labelled. Emits `font-change`.
   - `body-panel.ts` swaps its inline `<select>` for this control. This is the
     seam #23 (`fontConfig`) will later feed additional fonts into.

4. **Brand tab in `<pigeon-palette>`** (`palette/pigeon-palette.ts` + a new
   `palette/pigeon-brand-tab.ts` for the CRUD body)
   - Tab appears only when `brandKit` is set.
   - Sections: Colors (swatch grid + add/edit/delete), Fonts (list +
     add/edit/delete), Logos (thumbnails + add/delete + click-to-insert image
     block).

### Data flow — CRUD

Brand tab dispatches bubbling/composed events:
`brand-color-add | brand-color-update | brand-color-delete`,
the same trio for `brand-font-*` and `brand-logo-*`, and `brand-logo-insert`.

`<pigeon-editor>` handlers:
1. Immutably update `_activeBrandKit` (and bump `updatedAt`).
2. If `_brandKitStorage` ⇒ `await storage.save(kit)`.
3. Emit public `brand-kit-change` `CustomEvent` (`detail: { brandKit }`).
4. `requestUpdate()` → swatches/fonts re-flow to all consumers.

`brand-logo-insert` reuses the existing image-block creation path to insert an
image block (`src = logo.src`) into the selected column, else at document end.

### Brand-tab color-apply mapping

When a brand color swatch in the Brand tab is clicked:

| Current selection | Property set |
|---|---|
| text block        | text color |
| button block      | button background color |
| body / no selection | body background color |
| other / incompatible | no-op + subtle "select a text or button block" hint |

Applied via the existing property-change transaction path (same events the
panels already emit), so it flows through undo/redo normally.

## Error handling

- `storage.list()` / `storage.save()` wrapped in try/catch. On failure: keep
  the optimistic in-memory edit, emit `brand-kit-error` (`detail: { error,
  operation }`), do not throw.
- Color control rejects invalid hex (existing regex); Brand-tab forms reject
  empty names.
- No `config.brandKit` ⇒ no Brand tab, `swatches`/`fonts` empty ⇒ controls
  behave exactly as today (no regression).

## Testing (vitest, `packages/editor/__tests__/`)

1. `_resolveBrandKit`: plain object used directly; storage ⇒ first kit from
   `list()`; neither ⇒ null (no Brand tab).
2. `<pigeon-color-picker>`: renders swatch row from `swatches`; swatch click
   emits `color-change` with the swatch value; empty `swatches` ⇒ no row.
3. `<pigeon-font-picker>`: merges defaults + brand fonts; emits `font-change`;
   `body-panel` uses it for `fontFamily`.
4. Brand tab CRUD: add/update/delete color/font/logo updates `_activeBrandKit`,
   calls `storage.save`, emits `brand-kit-change`.
5. `brand-logo-insert` ⇒ inserts an image block with the logo `src`.
6. Brand-tab color apply: text selection ⇒ text color tr; button ⇒ bg tr;
   none ⇒ body bg; incompatible ⇒ no-op.
7. Brand tab hidden when `config.brandKit` is absent.
8. `storage.save` rejection ⇒ keeps edit + emits `brand-kit-error`.

## Out of scope

- Kit-switcher UI / multiple simultaneous active kits.
- Editing brand-kit `weights` / web-font `url` *rendering* — that is #23
  (custom font management / `<mj-font>` emission). #6 only registers fonts as
  picker options.
- Logo resizing UI beyond inserting at the logo's stored `width`.
