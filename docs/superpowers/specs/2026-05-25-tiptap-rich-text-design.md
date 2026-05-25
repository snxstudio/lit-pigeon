# TipTap inline rich-text editing — design spec

**Date:** 2026-05-25
**Scope:** v0.2 roadmap, largest remaining item
**Status:** Approved for implementation planning
**Companion spec:** `2026-05-25-image-upload-polish-design.md` (independent slice)

## Problem

The v0.2 roadmap line `[ ] Inline rich text editing (TipTap/ProseMirror integration)` is the largest unstarted item. Today, every text-bearing block stores HTML in a `string` field and the only way users author it is by hand-editing raw HTML in a `<textarea>` in the properties panel. There is no WYSIWYG affordance and no inline (on-canvas) editing.

## Findings from project survey

- `TextBlock.values.content: string` is already an HTML string, rendered into the canvas via `.innerHTML` in `pigeon-text-block.ts:56`.
- The MJML renderer (`packages/renderer-mjml/src/block-renderers/text.ts:16`) inlines the string directly inside `<mj-text>` — no escaping or transformation.
- The MJML parser (`packages/parser-mjml/src/parsers/block-parsers/text.ts:11`) reads the inner HTML straight back into `content` — symmetric.
- `HeroBlock.values.content: string` follows the same HTML-string pattern.
- `ButtonBlock.values.text: string` is plain text (no HTML).
- The merge-tag picker (`pigeon-merge-tag-picker`) inserts literal `{{varName}}` text at `textarea.selectionStart`.

The schema doesn't need to change for Text and Hero — `editor.getHTML()` slots into the existing string field, and MJML round-trip already works because both renderer and parser pass HTML through unchanged. The Button block requires a one-time breaking change to participate in rich text.

## Goals

- Real WYSIWYG rich-text editing inside Text, Hero, and Button blocks.
- Expressive formatting scope: bold, italic, underline, strikethrough, link, inline code, paragraphs, hard break, H1–H3, bullet and numbered lists, blockquote, text color, font family, font size.
- Click selects a block (existing semantics). Double-click enters edit mode. Escape / outside click exits.
- Merge tags rendered as visual chips inside the editor; serialized as literal `{{var}}` text so MJML output is unchanged.
- TipTap loaded lazily on first edit — `@lit-pigeon/editor` main bundle stays at its current 35 kB gzipped budget.
- Block-level styling (alignment, line-height, padding) continues to live in the properties sidebar. New sidebar controls for headings, lists, color, font family, font size.

## Non-goals

- Tables, image-in-text, embeds. Out of email-safe scope.
- Collaborative editing (CRDT).
- Auto-migration helper for legacy `ButtonBlock.values.text` documents. Pre-1.0 release; documented breaking change is acceptable.
- `<mj-style>` heading-margin reset for Outlook — separate follow-up ticket.
- React / Angular wrapper SSR support for the rich-text chunk.
- Drop-handle / on-canvas drag while inside edit mode. Use Escape, then drag.

## Design

### 1. Schema impact

**TextBlock, HeroBlock** — no change.

**ButtonBlock** — breaking field rename (one PR, no migration helper):

```ts
// Before
export interface ButtonBlock {
  id: string; type: 'button';
  values: { text: string; href: string; /* ... */ };
}
// After
export interface ButtonBlock {
  id: string; type: 'button';
  values: { content: string; href: string; /* ... */ };
}
```

`content` holds HTML produced by `editor.getHTML()`. Defaults change from `text: 'Button'` to `content: '<p>Button</p>'`.

Files updated:
- `packages/core/src/types/document.ts`
- `packages/core/src/schema/defaults.ts`
- `packages/renderer-mjml/src/block-renderers/button.ts` — body becomes inline HTML
- `packages/parser-mjml/src/parsers/block-parsers/button.ts` — read inner HTML, not text content
- `packages/editor/src/components/blocks/button-block.ts` — render via `.innerHTML`
- `packages/editor/src/components/properties/panels/button-panel.ts` — drop text input, gain rich-text panel

### 2. New module: `packages/editor/src/rich-text/`

Dynamic-imported via `import('./rich-text')` only on first edit-mode entry. Vite/Rollup splits it into a separate chunk.

```
packages/editor/src/rich-text/
  index.ts                     # public surface: loadRichTextEditor()
  extensions/
    base.ts                    # StarterKit subset config
    underline.ts
    link.ts                    # http/https/mailto allowlist; target=_blank rel=noopener
    color.ts
    font-family.ts
    font-size.ts               # custom, text-style based
    merge-tag.ts               # custom atom node (chip)
  ui/
    bubble-menu.ts             # B/I/U/S/Code/Link controls
  serialization.ts             # output-side allowlist sanitizer
  preprocess.ts                # input-side {{tag}} → span[data-merge-tag]
  types.ts
```

Public surface (typed):

```ts
export interface RichTextModule {
  createEditor(opts: CreateEditorOptions): Editor;
}
export interface CreateEditorOptions {
  element: HTMLElement;
  initialHTML: string;
  mergeTags?: MergeTag[];
  onUpdate?: (html: string) => void;     // not fired per keystroke; fired on transactions
  onBlur?: (html: string) => void;       // commits final HTML
  onEscape?: () => void;
}
export async function loadRichTextEditor(): Promise<RichTextModule>;
```

`loadRichTextEditor()` memoises the module-level promise so repeat edits don't re-import.

TipTap dependencies added to `packages/editor/package.json`:

- `@tiptap/core`
- `@tiptap/pm` (peer)
- `@tiptap/starter-kit`
- `@tiptap/extension-underline`
- `@tiptap/extension-link`
- `@tiptap/extension-color`
- `@tiptap/extension-text-style`
- `@tiptap/extension-font-family`
- `@tiptap/extension-bubble-menu`

Versions: lock to a single minor across all `@tiptap/*` to avoid peer-dep drift.

### 3. Selection / editing state

New field on `EditorState`: `editingBlockId: string | null`. Default `null`.

State transitions:

| Action | `selection` | `editingBlockId` |
|---|---|---|
| Click rich-text block | `{ type: 'block', blockId }` | `null` |
| Double-click rich-text block | `{ type: 'block', blockId }` | `blockId` |
| Escape (in edit) | unchanged | `null` (commits HTML) |
| Click outside rich-text block | parent selection logic | `null` (commits HTML) |
| Select another block | new selection | `null` (commits HTML) |

The block component reacts to `editingBlockId === ownBlockId` by calling `loadRichTextEditor()` (first time) and mounting an editor instance attached to its content `<div>`. On state change away from edit mode, the editor instance is destroyed.

### 4. Keyboard event gating

In `editor.ts` `_onKeyDown`, an early-return when `editingBlockId !== null`:

```ts
if (this._state.editingBlockId !== null) {
  // TipTap owns input — bubble menu and editor extensions handle keys.
  return;
}
```

This bypasses the existing handlers for: Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, Delete, Cmd/Ctrl+D, Cmd/Ctrl+C, Cmd/Ctrl+V, arrows, Escape (Escape is handled by TipTap, which emits an event that the block component translates into `editingBlockId = null`).

### 5. Bubble menu (`@tiptap/extension-bubble-menu`)

Shown when there is a non-empty text selection inside an editing block. Six controls:

| Control | Behaviour |
|---|---|
| **B** | Toggle Bold mark |
| **I** | Toggle Italic mark |
| **U** | Toggle Underline mark |
| **S** | Toggle Strike mark |
| **`<>` Code** | Toggle Code mark (inline) |
| **Link** | If selection is unlinked → open small popover for href. If linked → unlink button + edit popover. |

Implemented as a Lit element living inside the rich-text module so it can be code-split with TipTap.

### 6. Sidebar additions

Three property panels gain a new "Format" section, conditionally rendered for rich-text blocks:

`pigeon-text-panel`, `pigeon-hero-panel`, `pigeon-button-panel`:
- Block format select: Paragraph / H1 / H2 / H3 / Blockquote
- List toggle buttons: Bullet / Numbered
- Text color (reuse `color-picker` control)
- Font family (select)
- Font size (select — discrete values 10/12/14/16/18/24/32/48)

Existing controls unchanged: text-align, line-height, padding.

Sidebar controls dispatch TipTap chain commands when the corresponding block is the editing block; otherwise they update the saved HTML directly via the existing `property-change` event (sets a default style on whole content). Implementation hooks the editor instance via a shared `RichTextController` (singleton) that tracks the currently-mounted editor.

### 7. Merge-tag chip node

Custom atom node `mergeTag`:

```ts
Node.create({
  name: 'mergeTag',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return { name: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'span[data-merge-tag]' }];
  },
  renderHTML({ node }) {
    // What MJML downstream sees — literal text.
    return ['', `{{${node.attrs.name}}}`];
  },
  renderText({ node }) {
    return `{{${node.attrs.name}}}`;
  },
  addNodeView() {
    // Visual: chip in editor view only.
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.classList.add('pigeon-merge-tag');
      dom.contentEditable = 'false';
      dom.textContent = `{{${node.attrs.name}}}`;
      return { dom };
    };
  },
});
```

Caveat: TipTap's `renderHTML` produces serialized output via `editor.getHTML()`. The `['', text]` form returns a text node only (no wrapping element). Confirm at implementation time this is the right serializer signature; fallback is a custom serializer in `serialization.ts` that walks the schema and emits text for `mergeTag` nodes.

**Input preprocessing** (`preprocess.ts`): when initialising TipTap with stored HTML, run a string transform that wraps `{{[A-Za-z_][A-Za-z0-9_]*}}` patterns in `<span data-merge-tag="$1"></span>`. TipTap's `parseHTML` rule then converts those spans into chip nodes. The regex is restricted to identifier-shaped tokens to avoid false positives on `{{ }}` style brace usage.

**Picker integration**: `pigeon-merge-tag-picker` checks if a TipTap editor is the current focus (via the `RichTextController` singleton). If yes, it calls `editor.chain().insertContent({ type: 'mergeTag', attrs: { name } }).focus().run()`. If no editor is focused, it falls back to today's behaviour (insertion at textarea selection — preserved as a fallback for non-rich-text blocks if any remain).

### 8. Undo coordination

- TipTap's `History` extension stays **enabled** inside the rich-text module's StarterKit config.
- The top-level keydown handler returns early when `editingBlockId !== null` (see §4), so Cmd/Ctrl+Z is delivered to TipTap and runs keystroke-level undo.
- On blur or Escape, the block component:
  1. Calls `editor.getHTML()` and passes it through `serialization.ts`'s allowlist pass.
  2. Dispatches a single `updateBlock` transaction to the editor core.
  3. Editor's history-plugin records one snapshot.
  4. Destroys the TipTap editor instance.

Post-edit Cmd/Ctrl+Z therefore undoes the whole text-block change atomically.

### 9. Output sanitisation

TipTap's schema already restricts what can land in the doc — anything pasted is filtered to allowed nodes/marks. As defence in depth, `serialization.ts` runs a final allowlist pass on `editor.getHTML()`:

- Allowed tags: `p, br, strong, em, s, u, code, a, h1, h2, h3, ul, ol, li, blockquote, span`
- Allowed attributes by tag:
  - `a`: `href` (http/https/mailto only), `target`, `rel`
  - `span`: `style` (limited to color / font-family / font-size declarations), `data-merge-tag` (handled separately)
  - all others: no attributes
- Strip: `script, style, iframe, object, embed`, all `on*` event handlers, `javascript:` hrefs.

Implementation: small inline sanitizer using `htmlparser2` (already a dep via parser-mjml) or `DOMParser` if running in browser. ~80 LOC. No `dompurify` dep.

### 10. Bundle / size-limit

Update `.size-limit.json`:

- Keep editor entry at **35 kB gzipped**. Add explicit `ignore` for the rich-text chunk path so size-limit measures only the synchronous main entry. (Verify size-limit's measurement of dynamically-imported chunks; if needed, switch to per-entry config.)
- New entry: `@lit-pigeon/editor (rich-text chunk)` measuring `packages/editor/dist/rich-text-*.js` at **~120 kB gzipped** target. Generated by Vite's automatic chunk-naming for dynamic imports.

If Vite's chunk hash makes the path unpredictable, use a glob: `packages/editor/dist/rich-text-*.js` or configure Rollup with `output.manualChunks` to give the chunk a stable name (`rich-text.js`). The latter is preferred for size-limit predictability.

### 11. MJML round-trip

No changes required for Text and Hero — both pass HTML through. Button needs renderer + parser updates for the field rename only.

Heading default margins differ across email clients (Outlook in particular). Out of scope for this slice; track as separate follow-up to inject `<mj-style inline="inline">h1, h2, h3, blockquote { margin: 0 0 0.5em; }</mj-style>` or similar.

## Files touched

| File | Status | Purpose |
|---|---|---|
| `packages/editor/src/rich-text/index.ts` | NEW | Lazy entry, `loadRichTextEditor` |
| `packages/editor/src/rich-text/extensions/base.ts` | NEW | StarterKit config |
| `packages/editor/src/rich-text/extensions/underline.ts` | NEW | (thin wrapper) |
| `packages/editor/src/rich-text/extensions/link.ts` | NEW | URL allowlist |
| `packages/editor/src/rich-text/extensions/color.ts` | NEW | (thin wrapper) |
| `packages/editor/src/rich-text/extensions/font-family.ts` | NEW | (thin wrapper) |
| `packages/editor/src/rich-text/extensions/font-size.ts` | NEW | Custom text-style based |
| `packages/editor/src/rich-text/extensions/merge-tag.ts` | NEW | Chip node |
| `packages/editor/src/rich-text/ui/bubble-menu.ts` | NEW | Bubble Lit element |
| `packages/editor/src/rich-text/serialization.ts` | NEW | Allowlist sanitizer |
| `packages/editor/src/rich-text/preprocess.ts` | NEW | `{{tag}}` → span |
| `packages/editor/src/rich-text/controller.ts` | NEW | `RichTextController` singleton |
| `packages/editor/src/rich-text/types.ts` | NEW | Public types |
| `packages/editor/src/editor.ts` | MOD | `editingBlockId`, keydown gate, edit-mode transitions |
| `packages/editor/src/components/blocks/text-block.ts` | MOD | Double-click handler, lazy mount |
| `packages/editor/src/components/blocks/hero-block.ts` | MOD | Same |
| `packages/editor/src/components/blocks/button-block.ts` | MOD | Same + render new `content` field |
| `packages/editor/src/components/properties/panels/text-panel.ts` | MOD | Replace textarea with format controls |
| `packages/editor/src/components/properties/panels/hero-panel.ts` | MOD | Same |
| `packages/editor/src/components/properties/panels/button-panel.ts` | MOD | Same + adapt to `content` |
| `packages/editor/src/components/merge-tags/pigeon-merge-tag-picker.ts` | MOD | Dispatch TipTap insertContent when editor live |
| `packages/editor/package.json` | MOD | `@tiptap/*` deps |
| `packages/core/src/types/document.ts` | MOD | `ButtonBlock.values.text` → `content` |
| `packages/core/src/schema/defaults.ts` | MOD | Button default `content` |
| `packages/renderer-mjml/src/block-renderers/button.ts` | MOD | Emit `content` HTML inside `<mj-button>` |
| `packages/parser-mjml/src/parsers/block-parsers/button.ts` | MOD | Read inner HTML |
| `.size-limit.json` | MOD | Add rich-text chunk entry |
| `README.md` | MOD | Usage docs, breaking-change note, roadmap check |
| `packages/editor/__tests__/rich-text-mount.test.ts` | NEW | Double-click triggers lazy load + mount |
| `packages/editor/__tests__/rich-text-undo.test.ts` | NEW | TipTap-local undo during edit, atomic snapshot after blur |
| `packages/editor/__tests__/rich-text-merge-tag.test.ts` | NEW | Chip node round-trip |
| `packages/editor/__tests__/rich-text-button-schema.test.ts` | NEW | Button render/parse round-trip with `content` |
| `packages/editor/__tests__/rich-text-sanitizer.test.ts` | NEW | Allowlist stripping |
| `packages/editor/__tests__/rich-text-bubble.test.ts` | NEW | Bubble menu toggles marks |
| `packages/editor/__tests__/rich-text-sidebar.test.ts` | NEW | Sidebar controls fire correct chain commands |

Approx 13 new files in `src/rich-text/`, 7 new test files, 14 modified files.

## Tests (≈25 new cases)

1. **rich-text-mount.test.ts** (3): double-click loads module, mounts editor, focuses; second double-click on same session does not re-import; destroy on blur.
2. **rich-text-undo.test.ts** (4): Cmd+Z inside edit → TipTap state; Escape commits one history entry; post-blur Cmd+Z undoes whole edit; redo restores.
3. **rich-text-merge-tag.test.ts** (5): picker inserts node when editor live; serialized HTML is `{{name}}`; `{{name}}` text in stored HTML reloads as chip; nested merge tags within marks (e.g. `<strong>{{name}}</strong>`) round-trip; non-identifier `{{}}` patterns left as plain text.
4. **rich-text-button-schema.test.ts** (3): render button → MJML contains `<p>Label</p>`; parse MJML button back → `values.content` matches; default block has `content: '<p>Button</p>'`.
5. **rich-text-sanitizer.test.ts** (4): script tags stripped; `javascript:` href dropped; allowed style declarations preserved; disallowed style declarations dropped.
6. **rich-text-bubble.test.ts** (3): selection shows bubble; each of B/I/U/S/Code toggles the mark; link popover applies href.
7. **rich-text-sidebar.test.ts** (3): heading select changes block to H2; bullet-list toggle wraps selection; font-size select applies inline style span.

## Verification

- `pnpm --filter @lit-pigeon/editor test` — all new tests pass alongside existing 55 editor tests
- `pnpm test` — full workspace, 150 + ~25 = ~175 pass
- `pnpm lint` — clean
- `pnpm size` — editor entry ≤ 35 kB; rich-text chunk ≤ 120 kB
- `pnpm --filter @lit-pigeon/editor build` — produces a split `rich-text-*.js` chunk
- Manual playground exercise: double-click each block type, exercise bubble + sidebar, insert a merge tag, blur, verify MJML output preserves `{{name}}` literal and renders correctly

## Risks

- **TipTap API version drift**: lock all `@tiptap/*` to a single minor (`^X.Y.0` style only across all packages). Revisit each minor.
- **Custom font-size extension**: TipTap has no first-class one; the text-style-based pattern is community-standard and could break under TipTap's `@tiptap/extension-text-style` API changes.
- **ButtonBlock breaking change**: no migration. Document loudly in README. Pre-1.0 release acceptable.
- **Vite chunk naming for size-limit**: chunk hashes may make size-limit globs brittle. Mitigate by setting `output.manualChunks` in `vite.config.ts` for `./rich-text` to produce a stable `rich-text.js` name.
- **TipTap `renderHTML(['', text])` shape**: assumption based on TipTap docs; confirm during implementation. Fallback: implement a custom serializer.
- **Bubble-menu coordinate stability under shadow DOM**: TipTap's bubble menu uses Tippy positioning. Lit's shadow DOM may need `popper`/`appendTo` config. Implementation will need to verify in the playground.

## Out of scope (deferred)

- Tables, embeds, image-in-text
- Collaborative editing
- Auto-migration helper for legacy `button.values.text` documents
- Outlook heading-margin reset via `<mj-style>`
- React / Angular wrapper SSR
- Drop-handle reordering during edit mode
