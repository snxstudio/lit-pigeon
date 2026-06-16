# Saved / Reusable Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users save a row to a personal library and re-drag it from a "Saved" palette tab — backed by a `RowLibraryStorage` (in-memory + filesystem) mirroring `TemplateStorage`.

**Architecture:** New core `LibraryEntry`/`RowLibraryStorage` + `InMemoryRowLibraryStorage` + a `cloneRowWithNewIds` helper. A filesystem impl ships in mcp-server. In the editor: a "Save to library" action on the row toolbar, an always-present lazy "Saved" palette tab listing entries as drag chips, and a canvas drop path that deep-clones a saved row with fresh IDs before inserting.

**Tech Stack:** TypeScript, Lit 3, Vitest. Mirrors the existing `TemplateStorage` / template-picker / brand-tab patterns.

**Spec:** `docs/superpowers/specs/2026-06-16-saved-rows-design.md`
**Branch:** `feat/22-saved-rows` (stacked on `feat/23-custom-fonts`).

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/core/src/types/row-library.ts` (create) | `LibraryEntry`, `RowLibraryStorage` |
| `packages/core/src/row-library/in-memory-storage.ts` (create) | `InMemoryRowLibraryStorage` |
| `packages/core/src/row-library/clone.ts` (create) | `cloneRowWithNewIds(row)` |
| `packages/core/src/index.ts` (modify) | Re-export the above |
| `packages/core/src/types/editor.ts` (modify) | `EditorConfig.rowLibrary?` |
| `packages/mcp-server/src/store/fs-row-library-storage.ts` (create) | `FsRowLibraryStorage` |
| `packages/mcp-server/src/index.ts` (modify) | Export `FsRowLibraryStorage` |
| `packages/editor/src/components/canvas/pigeon-row.ts` (modify) | "Save to library" action → `row-save` |
| `packages/editor/src/dnd/drag-manager.ts` (modify) | `'library-row'` type + `node?: RowNode` |
| `packages/editor/src/components/canvas/pigeon-canvas.ts` (modify) | drop `library-row` → `row-insert-saved` |
| `packages/editor/src/components/palette/pigeon-saved-tab.ts` (create) | Saved tab body (drag chips + delete) |
| `packages/editor/src/components/palette/pigeon-palette.ts` (modify) | "Saved" tab (lazy) + `rowLibrary` prop |
| `packages/editor/src/editor.ts` (modify) | resolve storage; save/insert/delete handlers |

---

## Task 1: Core — types, in-memory storage, clone helper

**Files:**
- Create: `packages/core/src/types/row-library.ts`, `packages/core/src/row-library/in-memory-storage.ts`, `packages/core/src/row-library/clone.ts`
- Modify: `packages/core/src/index.ts`, `packages/core/src/types/editor.ts`
- Test: `packages/core/__tests__/row-library.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/__tests__/row-library.test.ts
import { describe, it, expect } from 'vitest';
import {
  InMemoryRowLibraryStorage,
  cloneRowWithNewIds,
  createRow,
  createColumn,
  createBlock,
} from '../src/index.js';
import type { LibraryEntry, RowNode } from '../src/index.js';

function sampleRow(): RowNode {
  const block = createBlock('text');
  return createRow([createColumn([block])]);
}

describe('InMemoryRowLibraryStorage', () => {
  it('saves, lists, gets and deletes entries (deep-cloned on read)', async () => {
    const store = new InMemoryRowLibraryStorage();
    const entry: LibraryEntry = {
      id: 'hero', name: 'Hero', kind: 'row', node: sampleRow(),
      createdAt: '', updatedAt: '',
    };
    await store.save(entry);
    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Hero');
    // deep clone: mutating the returned entry doesn't poison the store
    list[0].name = 'Mutated';
    expect((await store.get('hero'))!.name).toBe('Hero');
    await store.delete('hero');
    expect(await store.list()).toHaveLength(0);
  });
});

describe('cloneRowWithNewIds', () => {
  it('assigns fresh ids to the row, columns, and blocks', () => {
    const row = sampleRow();
    const clone = cloneRowWithNewIds(row);
    expect(clone.id).not.toBe(row.id);
    expect(clone.columns[0].id).not.toBe(row.columns[0].id);
    expect(clone.columns[0].blocks[0].id).not.toBe(row.columns[0].blocks[0].id);
    // structure/values otherwise preserved
    expect(clone.columns[0].blocks[0].type).toBe(row.columns[0].blocks[0].type);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run __tests__/row-library.test.ts`
Expected: FAIL — exports not found.

- [ ] **Step 3: Implement**

Create `packages/core/src/types/row-library.ts`:

```ts
import type { RowNode } from './document.js';

/** A user-saved reusable row. */
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

Create `packages/core/src/row-library/clone.ts`:

```ts
import type { RowNode } from '../types/document.js';
import { generateId } from '../utils/id.js';

/**
 * Deep-clone a row and assign fresh ids to the row, every column, and every
 * block. Used when inserting a saved library row so it never collides with
 * existing node ids. (Same id-regeneration the `duplicateRow` command performs.)
 */
export function cloneRowWithNewIds(row: RowNode): RowNode {
  const clone = structuredClone(row);
  clone.id = generateId();
  clone.columns.forEach((col) => {
    col.id = generateId();
    col.blocks.forEach((block) => {
      block.id = generateId();
    });
  });
  return clone;
}
```

Create `packages/core/src/row-library/in-memory-storage.ts`:

```ts
import type { LibraryEntry, RowLibraryStorage } from '../types/row-library.js';

export interface InMemoryRowLibraryStorageOptions {
  /** Entries to seed the store with on construction. */
  seed?: LibraryEntry[];
}

/**
 * Default `RowLibraryStorage` — `Map`-backed, per-process. Mirrors
 * `InMemoryTemplateStorage`: deep-clones on read so callers can't poison the
 * store by mutating returned objects.
 */
export class InMemoryRowLibraryStorage implements RowLibraryStorage {
  private readonly _byId = new Map<string, LibraryEntry>();

  constructor(opts: InMemoryRowLibraryStorageOptions = {}) {
    if (opts.seed) {
      for (const e of opts.seed) this._byId.set(e.id, e);
    }
  }

  async list(): Promise<LibraryEntry[]> {
    return Array.from(this._byId.values()).map((e) => structuredClone(e));
  }

  async get(id: string): Promise<LibraryEntry | null> {
    const e = this._byId.get(id);
    return e ? structuredClone(e) : null;
  }

  async save(entry: LibraryEntry): Promise<void> {
    if (!entry.id) throw new Error('LibraryEntry.id is required');
    const clone = structuredClone(entry);
    clone.updatedAt = new Date().toISOString();
    if (!this._byId.has(clone.id)) clone.createdAt = clone.updatedAt;
    this._byId.set(clone.id, clone);
  }

  async delete(id: string): Promise<void> {
    this._byId.delete(id);
  }
}
```

In `packages/core/src/index.ts`, add (near the other type + impl exports):

```ts
export type { LibraryEntry, RowLibraryStorage } from './types/row-library.js';
export { InMemoryRowLibraryStorage } from './row-library/in-memory-storage.js';
export { cloneRowWithNewIds } from './row-library/clone.js';
```

In `packages/core/src/types/editor.ts`, add to `EditorConfig` (after `fontConfig`):

```ts
  /**
   * Optional persistence for the user's saved-rows library. When unset, the
   * editor falls back to an in-memory store so the "Saved" palette tab works
   * in-session. A filesystem implementation ships in `@lit-pigeon/mcp-server`.
   */
  rowLibrary?: RowLibraryStorage;
```
And import the type at the top: `import type { RowLibraryStorage } from './row-library.js';`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run __tests__/row-library.test.ts` then `cd packages/core && npm run build`.
Expected: PASS; build clean.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types/row-library.ts packages/core/src/row-library packages/core/src/index.ts packages/core/src/types/editor.ts packages/core/__tests__/row-library.test.ts
git commit -m "feat(core): row-library types, in-memory storage, clone helper (#22)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 2: mcp-server — FsRowLibraryStorage

**Files:**
- Create: `packages/mcp-server/src/store/fs-row-library-storage.ts`
- Modify: `packages/mcp-server/src/index.ts`
- Test: `packages/mcp-server/__tests__/fs-row-library-storage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/mcp-server/__tests__/fs-row-library-storage.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { createRow, createColumn, createBlock } from '@lit-pigeon/core';
import type { LibraryEntry } from '@lit-pigeon/core';
import { FsRowLibraryStorage } from '../src/store/fs-row-library-storage.js';

const dirs: string[] = [];
async function tmpDir(): Promise<string> {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), 'rowlib-'));
  dirs.push(d);
  return d;
}
afterEach(async () => { for (const d of dirs.splice(0)) await fs.rm(d, { recursive: true, force: true }); });

function entry(id: string): LibraryEntry {
  return { id, name: id, kind: 'row', node: createRow([createColumn([createBlock('text')])]), createdAt: '', updatedAt: '' };
}

describe('FsRowLibraryStorage', () => {
  it('saves, lists, gets and deletes entries as JSON files', async () => {
    const dir = await tmpDir();
    const store = new FsRowLibraryStorage({ dir });
    await store.save(entry('hero'));
    expect(await store.list()).toHaveLength(1);
    expect((await store.get('hero'))!.name).toBe('hero');
    await store.delete('hero');
    expect(await store.get('hero')).toBeNull();
  });

  it('rejects unsafe ids on save and returns null on unsafe get', async () => {
    const dir = await tmpDir();
    const store = new FsRowLibraryStorage({ dir });
    await expect(store.save(entry('../escape'))).rejects.toThrow();
    expect(await store.get('../escape')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/mcp-server && npx vitest run __tests__/fs-row-library-storage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `packages/mcp-server/src/store/fs-row-library-storage.ts` (mirrors `FsTemplateStorage` but with NO starter seeding):

```ts
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { LibraryEntry, RowLibraryStorage } from '@lit-pigeon/core';

export interface FsRowLibraryStorageOptions {
  /** Directory for entry JSON files. Defaults to `~/.lit-pigeon/row-library`. */
  dir?: string;
}

/** Allowed shape for entry ids — safe to use as a filename. */
const ID_RE = /^[a-z0-9][a-z0-9-]*$/i;

function assertSafeId(id: string): void {
  if (!ID_RE.test(id)) {
    throw new Error(
      `Invalid library entry id: ${JSON.stringify(id)}. Must match ${ID_RE} (alphanumeric + hyphens, no slashes, no dotfiles).`,
    );
  }
}
function isSafeId(id: string): boolean {
  return ID_RE.test(id);
}
function defaultDir(): string {
  return path.join(os.homedir(), '.lit-pigeon', 'row-library');
}

/**
 * Filesystem-backed `RowLibraryStorage` — one JSON file per entry under a
 * configurable directory (default `~/.lit-pigeon/row-library`). Drop-in
 * compatible with `InMemoryRowLibraryStorage`.
 */
export class FsRowLibraryStorage implements RowLibraryStorage {
  readonly dir: string;
  private ready: Promise<void> | null = null;

  constructor(opts: FsRowLibraryStorageOptions = {}) {
    this.dir = opts.dir ?? defaultDir();
  }

  private async ensureDir(): Promise<void> {
    if (!this.ready) this.ready = fs.mkdir(this.dir, { recursive: true }).then(() => undefined);
    return this.ready;
  }

  private filePath(id: string): string {
    return path.join(this.dir, `${id}.json`);
  }

  async list(): Promise<LibraryEntry[]> {
    await this.ensureDir();
    let entries: string[];
    try {
      entries = await fs.readdir(this.dir);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const out: LibraryEntry[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      const full = path.join(this.dir, entry);
      try {
        out.push(JSON.parse(await fs.readFile(full, 'utf-8')) as LibraryEntry);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[FsRowLibraryStorage] Skipping unreadable file ${full}:`, (err as Error).message);
      }
    }
    out.sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
    return out;
  }

  async get(id: string): Promise<LibraryEntry | null> {
    if (!isSafeId(id)) return null;
    await this.ensureDir();
    try {
      return JSON.parse(await fs.readFile(this.filePath(id), 'utf-8')) as LibraryEntry;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async save(entry: LibraryEntry): Promise<void> {
    if (!entry.id) throw new Error('LibraryEntry.id is required');
    assertSafeId(entry.id);
    await this.ensureDir();
    const now = new Date().toISOString();
    let createdAt = entry.createdAt || now;
    const existing = await this.get(entry.id);
    if (existing?.createdAt) createdAt = existing.createdAt;
    const clone: LibraryEntry = { ...entry, createdAt, updatedAt: now };
    await fs.writeFile(this.filePath(entry.id), JSON.stringify(clone, null, 2), 'utf-8');
  }

  async delete(id: string): Promise<void> {
    if (!isSafeId(id)) return;
    await this.ensureDir();
    try {
      await fs.unlink(this.filePath(id));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw err;
    }
  }
}
```

In `packages/mcp-server/src/index.ts`, add an export alongside the other `Fs*Storage` exports:

```ts
export { FsRowLibraryStorage } from './store/fs-row-library-storage.js';
```
(Check the existing export style for `FsTemplateStorage` and match it.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/mcp-server && npx vitest run __tests__/fs-row-library-storage.test.ts` then `cd packages/mcp-server && npm run build`.
Expected: PASS; build clean.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/store/fs-row-library-storage.ts packages/mcp-server/src/index.ts packages/mcp-server/__tests__/fs-row-library-storage.test.ts
git commit -m "feat(mcp-server): FsRowLibraryStorage (#22)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 3: Row toolbar "Save to library" action

**Files:**
- Modify: `packages/editor/src/components/canvas/pigeon-row.ts`
- Test: `packages/editor/__tests__/row-save-action.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/row-save-action.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createRow, createColumn, createBlock } from '@lit-pigeon/core';
import type { RowNode } from '@lit-pigeon/core';
import '../src/components/canvas/pigeon-row.js';
import type { PigeonRow } from '../src/components/canvas/pigeon-row.js';

async function mount(row: RowNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-row .row=${row} .index=${0} .totalRows=${1}></pigeon-row>`, container);
  const el = container.querySelector('pigeon-row') as PigeonRow;
  await el.updateComplete;
  return el;
}

describe('pigeon-row save action', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('renders a Save to library button and emits row-save', async () => {
    const row = createRow([createColumn([createBlock('text')])]);
    const el = await mount(row);
    const events: CustomEvent[] = [];
    el.addEventListener('row-save', (e) => events.push(e as CustomEvent));
    const btn = el.shadowRoot!.querySelector('.action-btn[title="Save to library"]') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ rowId: row.id });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/row-save-action.test.ts`
Expected: FAIL — no Save button.

- [ ] **Step 3: Implement**

In `pigeon-row.ts`, add a button to the `.actions` group (place it right before the Duplicate button) — a bookmark icon:

```ts
          <button
            class="action-btn"
            title="Save to library"
            @click=${this._onSave}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
```

Add the handler near `_onDuplicate`:

```ts
  private _onSave(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('row-save', {
      detail: { rowId: this.row.id },
      bubbles: true,
      composed: true,
    }));
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/row-save-action.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/canvas/pigeon-row.ts packages/editor/__tests__/row-save-action.test.ts
git commit -m "feat(editor): row toolbar Save-to-library action (#22)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 4: DnD + canvas support for dropping a saved row

**Files:**
- Modify: `packages/editor/src/dnd/drag-manager.ts`
- Modify: `packages/editor/src/components/canvas/pigeon-canvas.ts`
- Test: `packages/editor/__tests__/canvas-library-drop.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/canvas-library-drop.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import type { PigeonDocument, RowNode } from '@lit-pigeon/core';
import { setDragData, clearDragData } from '../src/dnd/drag-manager.js';
import '../src/components/canvas/pigeon-canvas.js';
import type { PigeonCanvas } from '../src/components/canvas/pigeon-canvas.js';

async function mount(doc: PigeonDocument) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-canvas .doc=${doc}></pigeon-canvas>`, container);
  const el = container.querySelector('pigeon-canvas') as PigeonCanvas;
  await el.updateComplete;
  return el;
}

describe('pigeon-canvas library-row drop', () => {
  afterEach(() => { document.body.innerHTML = ''; clearDragData(); });

  it('emits row-insert-saved with the node when a library-row is dropped', async () => {
    const el = await mount(createDefaultDocument());
    const node: RowNode = createRow([createColumn([createBlock('text')])]);
    const events: CustomEvent[] = [];
    el.addEventListener('row-insert-saved', (e) => events.push(e as CustomEvent));

    setDragData({ type: 'library-row', node });
    const area = el.shadowRoot!.querySelector('.canvas-area') as HTMLElement;
    area.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));

    expect(events).toHaveLength(1);
    expect(events[0].detail.node.id).toBe(node.id);
    expect(typeof events[0].detail.index).toBe('number');
  });
});
```

> If `.canvas-area` is not the element bound to `@drop`, the implementer should
> target whichever element carries the `@drop=${this._onDrop}` binding (read the
> template). The assertion is what matters: a `library-row` drop emits
> `row-insert-saved { index, node }`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/canvas-library-drop.test.ts`
Expected: FAIL — no `row-insert-saved` emitted.

- [ ] **Step 3: Implement**

In `drag-manager.ts`:
- Add `'library-row'` to the `DragItemType` union.
- Add to `DragData`: `/** Saved row node for library-row drags. */ node?: RowNode;` and import the type: `import type { RowNode } from '@lit-pigeon/core';`

In `pigeon-canvas.ts`:
- In `_onDragOver`, include `library-row` in the condition that computes `_rowDropIndex`:
```ts
    if (
      dragData.type === 'palette-row' ||
      dragData.type === 'existing-row' ||
      dragData.type === 'library-row' ||
      this.doc.body.rows.length === 0
    ) {
```
- In `_onDrop`, add a branch (after the `palette-row` branch):
```ts
    } else if (dragData.type === 'library-row' && dragData.node) {
      const index = this._rowDropIndex >= 0 ? this._rowDropIndex : this.doc.body.rows.length;
      this.dispatchEvent(new CustomEvent('row-insert-saved', {
        detail: { index, node: dragData.node },
        bubbles: true,
        composed: true,
      }));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/canvas-library-drop.test.ts __tests__/drop-zones.test.ts`
Expected: PASS (new + existing drop tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/dnd/drag-manager.ts packages/editor/src/components/canvas/pigeon-canvas.ts packages/editor/__tests__/canvas-library-drop.test.ts
git commit -m "feat(editor): canvas accepts dropped saved rows (#22)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 5: Saved tab component + palette wiring

**Files:**
- Create: `packages/editor/src/components/palette/pigeon-saved-tab.ts`
- Modify: `packages/editor/src/components/palette/pigeon-palette.ts`
- Test: `packages/editor/__tests__/saved-tab.test.ts`, `packages/editor/__tests__/palette-saved-tab.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/__tests__/saved-tab.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { InMemoryRowLibraryStorage, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import type { LibraryEntry, RowLibraryStorage } from '@lit-pigeon/core';
import '../src/components/palette/pigeon-saved-tab.js';
import type { PigeonSavedTab } from '../src/components/palette/pigeon-saved-tab.js';

function entry(id: string): LibraryEntry {
  return { id, name: id, kind: 'row', node: createRow([createColumn([createBlock('text')])]), createdAt: '', updatedAt: '' };
}

async function mount(storage: RowLibraryStorage) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-saved-tab .storage=${storage}></pigeon-saved-tab>`, container);
  const el = container.querySelector('pigeon-saved-tab') as PigeonSavedTab;
  await el.updateComplete;
  await el.refresh();
  await el.updateComplete;
  return el;
}

describe('pigeon-saved-tab', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('lists saved entries', async () => {
    const store = new InMemoryRowLibraryStorage({ seed: [entry('hero'), entry('cta')] });
    const el = await mount(store);
    expect(el.shadowRoot!.querySelectorAll('[data-entry-id]').length).toBe(2);
  });

  it('emits library-delete when an entry delete is clicked', async () => {
    const store = new InMemoryRowLibraryStorage({ seed: [entry('hero')] });
    const el = await mount(store);
    const events: CustomEvent[] = [];
    el.addEventListener('library-delete', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('[data-entry-id="hero"] .delete') as HTMLButtonElement).click();
    expect(events[0].detail).toEqual({ id: 'hero' });
  });

  it('shows an empty state when there are no entries', async () => {
    const el = await mount(new InMemoryRowLibraryStorage());
    expect(el.shadowRoot!.querySelector('.empty')).toBeTruthy();
  });
});
```

```ts
// packages/editor/__tests__/palette-saved-tab.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument, InMemoryRowLibraryStorage } from '@lit-pigeon/core';
import type { PigeonDocument, RowLibraryStorage } from '@lit-pigeon/core';
import '../src/components/palette/pigeon-palette.js';
import type { PigeonPalette } from '../src/components/palette/pigeon-palette.js';

async function mount(doc: PigeonDocument, rowLibrary: RowLibraryStorage) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-palette .doc=${doc} .rowLibrary=${rowLibrary}></pigeon-palette>`, container);
  const el = container.querySelector('pigeon-palette') as PigeonPalette;
  await el.updateComplete;
  return el;
}

describe('pigeon-palette Saved tab', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('always shows the Saved tab', async () => {
    const el = await mount(createDefaultDocument(), new InMemoryRowLibraryStorage());
    expect(el.shadowRoot!.querySelector('#pigeon-tab-saved')).toBeTruthy();
  });

  it('renders pigeon-saved-tab after activating the Saved tab', async () => {
    const el = await mount(createDefaultDocument(), new InMemoryRowLibraryStorage());
    (el.shadowRoot!.querySelector('#pigeon-tab-saved') as HTMLButtonElement).click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 50)); // allow the lazy import to resolve
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('pigeon-saved-tab')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/editor && npx vitest run __tests__/saved-tab.test.ts __tests__/palette-saved-tab.test.ts`
Expected: FAIL — element/tab not defined.

- [ ] **Step 3: Implement**

Create `packages/editor/src/components/palette/pigeon-saved-tab.ts`:

```ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { writeDragTransfer } from '../../dnd/drag-manager.js';
import type { LibraryEntry, RowLibraryStorage } from '@lit-pigeon/core';

/**
 * `<pigeon-saved-tab>` — the Saved palette tab body. Lists saved rows from the
 * `RowLibraryStorage` as drag chips (drag-type `library-row`, carrying the
 * row node) and offers per-entry delete. Re-list via `refresh()`.
 */
@customElement('pigeon-saved-tab')
export class PigeonSavedTab extends LitElement {
  @property({ attribute: false })
  storage?: RowLibraryStorage;

  @state() private _entries: LibraryEntry[] = [];

  static styles = css`
    :host { display: block; }
    .section { padding: 12px; }
    .empty { font-size: 12px; color: var(--pigeon-text-muted, #94a3b8); font-family: var(--pigeon-font); }
    .row {
      display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-bottom: 6px;
      border: 1px solid var(--pigeon-border, #e2e8f0); border-radius: var(--pigeon-radius, 6px);
      background: var(--pigeon-bg, #ffffff); cursor: grab; font-family: var(--pigeon-font); font-size: 13px;
    }
    .row:hover { border-color: var(--pigeon-primary, #3b82f6); background: var(--pigeon-surface, #f8fafc); }
    .name { flex: 1; color: var(--pigeon-text, #1e293b); }
    .delete {
      background: none; border: none; cursor: pointer; color: var(--pigeon-text-muted, #94a3b8);
      font-size: 14px; line-height: 1; padding: 2px;
    }
    .delete:hover { color: var(--pigeon-danger, #dc2626); }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.refresh();
  }

  /** Re-load entries from storage. */
  async refresh(): Promise<void> {
    if (!this.storage) { this._entries = []; return; }
    try {
      this._entries = await this.storage.list();
    } catch {
      this._entries = [];
    }
  }

  render() {
    return html`
      <div class="section">
        ${this._entries.length === 0
          ? html`<div class="empty">No saved rows yet. Use the bookmark action on a row to save it here.</div>`
          : this._entries.map(
              (e) => html`<div
                class="row" data-entry-id=${e.id} draggable="true"
                @dragstart=${(ev: DragEvent) => this._onDragStart(ev, e)}
              >
                <span class="name">${e.name}</span>
                <button class="delete" type="button" title="Delete" aria-label=${`Delete ${e.name}`}
                  @click=${() => this._onDelete(e)}>×</button>
              </div>`,
            )}
      </div>
    `;
  }

  private _onDragStart(ev: DragEvent, entry: LibraryEntry) {
    writeDragTransfer(ev, { type: 'library-row', node: entry.node });
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'copy';
  }

  private _onDelete(entry: LibraryEntry) {
    this.dispatchEvent(new CustomEvent('library-delete', {
      detail: { id: entry.id }, bubbles: true, composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-saved-tab': PigeonSavedTab;
  }
}
```

In `pigeon-palette.ts`:
- Add a lazy loader near `loadBrandTab`:
```ts
let _savedTabPromise: Promise<unknown> | null = null;
function loadSavedTab(): Promise<unknown> {
  if (!_savedTabPromise) _savedTabPromise = import('./pigeon-saved-tab.js');
  return _savedTabPromise;
}
```
- Add `'saved'` to `PaletteTab`: `type PaletteTab = 'content' | 'layers' | 'brand' | 'saved';`
- Import the type: add `RowLibraryStorage` to the `@lit-pigeon/core` type import.
- Add properties + state:
```ts
  @property({ attribute: false })
  rowLibrary: RowLibraryStorage | null = null;

  @state()
  private _savedTabLoaded = false;
```
- Add the Saved tab button after the Brand tab button (always present):
```ts
        <button
          part="palette-tab"
          role="tab"
          id="pigeon-tab-saved"
          aria-selected=${this._activeTab === 'saved'}
          aria-controls="pigeon-tabpanel"
          class="tab ${this._activeTab === 'saved' ? 'active' : ''}"
          @click=${this._handleSavedTabClick}
        >Saved</button>
```
- Extend the tabpanel `aria-labelledby` and body to handle `'saved'`. Update the `aria-labelledby` expression to map `'saved'` → `'pigeon-tab-saved'`, and the body conditional to call `this._renderSavedTab()` when active. (Convert the existing nested ternaries to include the `saved` case.)
- Add the handler + renderer:
```ts
  private _handleSavedTabClick = async () => {
    this._activeTab = 'saved';
    if (!this._savedTabLoaded) {
      await loadSavedTab();
      this._savedTabLoaded = true;
    }
  };

  private _renderSavedTab() {
    if (!this._savedTabLoaded) return html``;
    return html`<pigeon-saved-tab .storage=${this.rowLibrary}></pigeon-saved-tab>`;
  }
```
- Update the existing `aria-labelledby`/body ternary. For clarity, replace it with a small helper or a flat conditional that covers content/layers/brand/saved (read the current expression and extend it; ensure the `saved` branch maps to `pigeon-tab-saved` and `_renderSavedTab()`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/editor && npx vitest run __tests__/saved-tab.test.ts __tests__/palette-saved-tab.test.ts __tests__/palette-brand-tab.test.ts __tests__/palette-a11y.test.ts`
Expected: PASS (new + existing palette tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/palette/pigeon-saved-tab.ts packages/editor/src/components/palette/pigeon-palette.ts packages/editor/__tests__/saved-tab.test.ts packages/editor/__tests__/palette-saved-tab.test.ts
git commit -m "feat(editor): Saved palette tab (#22)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 6: Editor wiring — resolve storage, save / insert / delete

**Files:**
- Modify: `packages/editor/src/editor.ts`
- Test: `packages/editor/__tests__/editor-saved-rows.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/editor-saved-rows.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import { InMemoryRowLibraryStorage, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import type { EditorConfig, RowNode } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}
function fire(el: PigeonEditor, type: string, detail: unknown) {
  el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

describe('pigeon-editor saved rows', () => {
  afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

  it('row-save prompts, clones the row, and persists a LibraryEntry', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('My Hero');
    const storage = new InMemoryRowLibraryStorage();
    const saveSpy = vi.spyOn(storage, 'save');
    const doc = { ...createDoc() };
    const el = await mount({ doc, rowLibrary: storage });
    const firstRow = el.getDocument().body.rows[0];

    fire(el, 'row-save', { rowId: firstRow.id });
    await new Promise((r) => setTimeout(r, 0));

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const entry = saveSpy.mock.calls[0][0];
    expect(entry.name).toBe('My Hero');
    expect(entry.kind).toBe('row');
    expect(entry.node.id).toBe(firstRow.id);
  });

  it('row-save does nothing when the prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    const storage = new InMemoryRowLibraryStorage();
    const saveSpy = vi.spyOn(storage, 'save');
    const el = await mount({ doc: createDoc(), rowLibrary: storage });
    fire(el, 'row-save', { rowId: el.getDocument().body.rows[0].id });
    await new Promise((r) => setTimeout(r, 0));
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('row-insert-saved inserts a clone with fresh ids', async () => {
    const el = await mount({ doc: createDoc() });
    const node: RowNode = createRow([createColumn([createBlock('text')])]);
    const before = el.getDocument().body.rows.length;
    fire(el, 'row-insert-saved', { index: before, node });
    const rows = el.getDocument().body.rows;
    expect(rows.length).toBe(before + 1);
    const inserted = rows[rows.length - 1];
    expect(inserted.id).not.toBe(node.id); // regenerated
    expect(inserted.columns[0].id).not.toBe(node.columns[0].id);
  });
});

function createDoc() {
  // A doc with one real row so row-save has something to save.
  const doc = createDefaultDocWithRow();
  return doc;
}
function createDefaultDocWithRow() {
  const row = createRow([createColumn([createBlock('text')])]);
  return {
    version: '1.0' as const,
    metadata: { name: 'Test', createdAt: '', updatedAt: '' },
    body: { attributes: { width: 600, backgroundColor: '#fff', fontFamily: 'Arial, sans-serif', contentAlignment: 'center' as const }, rows: [row] },
  };
}
```

> The implementer may simplify the doc fixture using `createDefaultDocument()` +
> inserting a row if cleaner — the key assertions are: row-save persists an entry
> whose `node` matches the saved row; cancel → no save; row-insert-saved inserts a
> clone with fresh ids.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/editor-saved-rows.test.ts`
Expected: FAIL — handlers not wired.

- [ ] **Step 3: Implement**

In `editor.ts`:
- Add to the `@lit-pigeon/core` imports: type `RowLibraryStorage`, type `LibraryEntry`, and the values `InMemoryRowLibraryStorage`, `cloneRowWithNewIds`.
- Add a lazily-initialised default + resolver (mirror `_resolveTemplateStorage`):
```ts
  private _defaultRowLibrary?: RowLibraryStorage;

  private _resolveRowLibrary(): RowLibraryStorage {
    if (this.config.rowLibrary) return this.config.rowLibrary;
    if (!this._defaultRowLibrary) this._defaultRowLibrary = new InMemoryRowLibraryStorage();
    return this._defaultRowLibrary;
  }
```
- In `render()`, bind `.rowLibrary=${this._resolveRowLibrary()}` on `<pigeon-palette>`, and add the handlers `@row-save`, `@row-insert-saved`, `@library-delete` (the canvas/palette events bubble to the editor; bind these on the elements that they pass through, or on the editor host — to match the existing handler style, bind `@row-save` and `@row-insert-saved` on `<pigeon-canvas>` since those originate there, and `@library-delete` on `<pigeon-palette>`).
- Add the handlers:
```ts
  private async _handleRowSave(e: CustomEvent<{ rowId: string }>) {
    const row = this._state.doc.body.rows.find((r) => r.id === e.detail.rowId);
    if (!row) return;
    const name = window.prompt('Name this saved row');
    if (!name || !name.trim()) return;
    const now = new Date().toISOString();
    const entry: LibraryEntry = {
      id: slugify(name),
      name: name.trim(),
      kind: 'row',
      node: structuredClone(row),
      createdAt: now,
      updatedAt: now,
    };
    try {
      await this._resolveRowLibrary().save(entry);
      await this._refreshSavedTab();
    } catch (error) {
      this._emitRowLibraryError(error, 'save');
    }
  }

  private _handleRowInsertSaved(e: CustomEvent<{ index: number; node: RowNode }>) {
    const clone = cloneRowWithNewIds(e.detail.node);
    insertRow(clone, e.detail.index)(this._state, this._dispatch);
  }

  private async _handleLibraryDelete(e: CustomEvent<{ id: string }>) {
    try {
      await this._resolveRowLibrary().delete(e.detail.id);
      await this._refreshSavedTab();
    } catch (error) {
      this._emitRowLibraryError(error, 'delete');
    }
  }

  private async _refreshSavedTab() {
    const tab = this.renderRoot.querySelector('pigeon-palette')?.renderRoot?.querySelector('pigeon-saved-tab') as
      | (HTMLElement & { refresh: () => Promise<void> })
      | null
      | undefined;
    if (tab) { await tab.refresh(); }
  }

  private _emitRowLibraryError(error: unknown, operation: 'save' | 'delete') {
    this.dispatchEvent(new CustomEvent('row-library-error', {
      detail: { error, operation }, bubbles: true, composed: true,
    }));
  }
```
- `RowNode` type: add to the `@lit-pigeon/core` type import if not already present.
- `slugify` and `insertRow` already exist in editor.ts (reuse them).

> Note on `_refreshSavedTab`: reaching through two shadow roots is acceptable
> here (the editor owns both components). If the saved tab isn't loaded/open yet,
> the query returns null and refresh is skipped — the tab re-lists on its own
> `connectedCallback` when next opened. If cleaner, the implementer may instead
> bump a reactive `_savedRev` counter passed to the palette/saved-tab to trigger
> a re-list; either approach is fine as long as a save/delete is reflected when
> the Saved tab is viewed.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/editor-saved-rows.test.ts`
Expected: PASS. Then full editor suite: `cd packages/editor && npm test`.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor.ts packages/editor/__tests__/editor-saved-rows.test.ts
git commit -m "feat(editor): save/insert/delete saved rows wiring (#22)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 7: Full verification

- [ ] **Step 1: Per-package suites**
Run: `cd packages/core && npm test`, `cd packages/mcp-server && npm test`, `cd packages/editor && npm test`. All pass; stop and report BLOCKED on any failure.

- [ ] **Step 2: Builds**
Run: `cd packages/core && npm run build && cd ../mcp-server && npm run build && cd ../editor && npm run build`. No TS errors.

- [ ] **Step 3: Bundle size**
The saved-tab is lazy-loaded, so the editor base-bundle delta should be small (palette `rowLibrary` prop + Saved tab button + editor handlers). Run `cd packages/editor && npm run build` and check the `size-limit` editor chunk vs `.size-limit.json` (currently 45.3 kB). If WITHIN, change nothing. If EXCEEDS, report DONE_WITH_CONCERNS with the delta and what grew — do not bump the budget yourself.

- [ ] **Step 4: Workspace tests**
Run: `cd /Users/mayurrawte/snxstudio/lit-pigeon && pnpm -r test`. All packages pass.

- [ ] **Step 5: Commit (only if step 3 required a change).**

---

## Self-Review (against spec)

- **Spec coverage:** types + storage (Task 1); fs impl (Task 2); row-toolbar save action (Task 3); DnD type + canvas drop (Task 4); Saved tab + palette, always-present + lazy (Task 5); editor resolve/save/insert/delete + prompt + id-regen (Task 6); verification incl. size (Task 7). ✓
- **Type consistency:** `LibraryEntry`/`RowLibraryStorage` identical across core/mcp-server/editor; `cloneRowWithNewIds` defined Task 1, used Task 6; `'library-row'` + `node` on `DragData` defined Task 4, written by saved-tab Task 5, read by canvas Task 4 and editor Task 6; events `row-save`/`row-insert-saved`/`library-delete` consistent between emitters (Tasks 3/4/5) and handlers (Task 6). ✓
- **Decisions honored:** rows only; name prompt; Saved tab always shown (in-memory default); fs impl in mcp-server; drop regenerates ids. ✓
- **Placeholders:** none — every step has concrete code.
