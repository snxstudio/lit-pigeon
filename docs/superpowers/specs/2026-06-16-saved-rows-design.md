# Saved / Reusable Rows (user content library) — Design Spec

**Issue:** #22 Saved / reusable rows and blocks (user content library)
**Date:** 2026-06-16
**Status:** Approved design — ready for implementation plan
**Branch:** `feat/22-saved-rows` (stacked on `feat/23-custom-fonts`)

## Goal

Let users save any row to a personal library and re-drag it from a palette tab
— Unlayer's flagship "Saved Rows". Mirrors the existing `TemplateStorage`
pattern (in-memory + filesystem).

## Decisions (locked)

- **Scope: rows only.** A "Save to library" action on the row hover toolbar.
  Blocks are out of scope (the `kind` field leaves room to add them later).
- **Naming: prompt.** On save, `prompt()` for a name; empty/cancel → no save.
- **Saved tab: always shown.** Storage resolves to a lazily-created
  `InMemoryRowLibraryStorage` when no persistent store is configured, so the tab
  works in-session out of the box (like the template picker). Entries persist
  across reloads only when the host supplies a `RowLibraryStorage`.
- **Filesystem impl in `@lit-pigeon/mcp-server`**, next to `FsTemplateStorage` /
  `FsBrandKitStorage`, under `~/.lit-pigeon/row-library`.

## New types (core) — `packages/core/src/types/row-library.ts`

```ts
import type { RowNode } from './document.js';

export interface LibraryEntry {
  /** Stable, URL-safe slug; doubles as filename when persisted. */
  id: string;
  /** Display name shown in the Saved tab. */
  name: string;
  /** What the entry holds. Only 'row' is supported now. */
  kind: 'row';
  /** The saved row (with its columns/blocks). */
  node: RowNode;
  /** ISO-8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

/** Pluggable persistence for the row library. Mirrors {@link TemplateStorage}. */
export interface RowLibraryStorage {
  list(): Promise<LibraryEntry[]>;
  get(id: string): Promise<LibraryEntry | null>;
  save(entry: LibraryEntry): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Both re-exported from the core index. `EditorConfig.rowLibrary?: RowLibraryStorage`.

## Implementations

- `InMemoryRowLibraryStorage` — `packages/core/src/row-library/in-memory-storage.ts`,
  mirroring `InMemoryTemplateStorage` (Map-backed, deep-clones on read). Exported
  from core.
- `FsRowLibraryStorage` — `packages/mcp-server/src/store/fs-row-library-storage.ts`,
  mirroring `FsTemplateStorage` (one JSON file per entry, id `^[a-z0-9][a-z0-9-]*$/i`,
  dir default `~/.lit-pigeon/row-library`).

## Architecture / components

```
row hover toolbar (pigeon-row.ts)
   └─ "Save to library" button → row-save { rowId } ──► <pigeon-editor>
                                                          ├─ prompt(name)
                                                          ├─ clone row node
                                                          ├─ storage.save(entry)
                                                          └─ refresh Saved tab
<pigeon-palette> "Saved" tab (lazy <pigeon-saved-tab>)
   ├─ lists storage.list() as draggable items (drag-type library-row, node payload)
   └─ delete per entry → library-delete { id } ──► editor → storage.delete → refresh
canvas row drop-zone
   └─ drop library-row ──► editor clones node + regenerates IDs + insertRow at index
```

### Editor wiring (`packages/editor/src/editor.ts`)

- `_resolveRowLibrary(): RowLibraryStorage` — returns `config.rowLibrary` if set,
  else a lazily-created `InMemoryRowLibraryStorage` (mirrors
  `_resolveTemplateStorage`).
- `row-save` handler: `prompt('Name this row')`; if non-empty, deep-clone the row
  node, build `LibraryEntry { id: slugify(name) || generateId(), name, kind:'row',
  node, createdAt, updatedAt }`, `await storage.save(entry)`, refresh the saved
  tab (call its `refresh()` like the template picker).
- `library-delete` handler: `await storage.delete(id)`, refresh.
- Drop handler for `library-row`: clone + regenerate IDs (see below) + `insertRow`
  via the existing row-insert command, at the drop index.
- Pass `.rowLibrary=${this._resolveRowLibrary()}` to `<pigeon-palette>`.

### Row toolbar (`packages/editor/src/components/canvas/pigeon-row.ts`)

Add a "Save to library" `action-btn` (bookmark icon) to the `.actions` group,
emitting `row-save` `{ rowId }` (bubbles + composed), consistent with the
existing `row-duplicate`/`row-delete` buttons.

### Saved tab (`packages/editor/src/components/palette/pigeon-saved-tab.ts`, new, lazy)

- A 4th palette tab "Saved", always present. Lazy-loaded via dynamic `import()`
  on first activation (mirrors the Brand tab / template-picker code-split, to
  respect the editor size budget).
- Receives the resolved `RowLibraryStorage`; on connect/refresh calls `list()`
  and renders each entry as a `<pigeon-palette-item>`-style draggable chip with
  `drag-type="library-row"` plus a delete button.
- The drag payload carries the entry's `node` (see DnD).

### DnD (`packages/editor/src/dnd/drag-manager.ts`)

- Add `'library-row'` to `DragItemType` and a `node?: RowNode` field to
  `DragData`. The Saved-tab chip writes `{ type: 'library-row', node }` on
  dragstart.
- **ID regeneration helper** (core, `packages/core/src/row-library/clone.ts` or
  reuse a duplicate helper): deep-clone a `RowNode` and assign fresh `generateId()`
  values to the row, every column, and every block. Used on drop so a re-inserted
  saved row never collides with existing IDs. (If `duplicateRow` already exposes
  such cloning, reuse it.)

## Data flow

1. **Save:** row toolbar → `row-save` → editor prompts, clones, `storage.save`,
   refresh tab.
2. **Reuse:** drag chip from Saved tab → drop on canvas row zone → editor clones
   node, regenerates IDs, `insertRow` at index → new row in document.
3. **Delete:** Saved tab delete → `library-delete` → `storage.delete` → refresh.
4. **Persistence:** in-memory by default (in-session); `FsRowLibraryStorage`
   (mcp-server) or any host `RowLibraryStorage` for durable storage.

## Error handling

- `storage.list/get/save/delete` wrapped in try/catch → emit `row-library-error`
  `{ error, operation }`; never throw to the user.
- Empty/cancelled name → no save.
- ID regeneration on insert guarantees no collisions with existing nodes.

## Testing

**core** (`packages/core/__tests__/`):
1. `InMemoryRowLibraryStorage` CRUD (save/list/get/delete; deep-clone on read).
2. ID-regen clone helper: cloned row + all columns/blocks get new ids; structure
   and values otherwise preserved.

**mcp-server** (`packages/mcp-server/__tests__/`):
3. `FsRowLibraryStorage` CRUD against a temp dir (mirror `fs-template-storage` test).

**editor** (`packages/editor/__tests__/`):
4. Row toolbar renders a "Save to library" button and emits `row-save` `{ rowId }`.
5. Editor save flow: `row-save` with a stubbed `prompt` → `storage.save` called
   with a `LibraryEntry` whose `node` equals the row; cancel (empty) → no save.
6. Saved tab lists entries from storage and emits `library-delete` on delete.
7. Drop of a `library-row` inserts a row whose id (and all column/block ids)
   differ from the saved entry's node ids (no collision), and whose structure
   matches.
8. Saved tab is present in the palette by default (no config).

## Out of scope

- Saving individual blocks (the `kind` field reserves this for a follow-up).
- Categories/folders/search in the Saved tab.
- Thumbnails/previews of saved rows.
- Renaming saved entries (delete + re-save covers it for now).
