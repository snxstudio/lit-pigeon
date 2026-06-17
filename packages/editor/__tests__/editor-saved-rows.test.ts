import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import { InMemoryRowLibraryStorage, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import type { EditorConfig, RowNode, PigeonDocument } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

function docWithRow(): PigeonDocument {
  const row = createRow([createColumn([createBlock('text')])]);
  return {
    version: '1.0',
    metadata: { name: 'Test', createdAt: '', updatedAt: '' },
    body: {
      attributes: { width: 600, backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', contentAlignment: 'center' },
      rows: [row],
    },
  };
}

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
    const el = await mount({ doc: docWithRow(), rowLibrary: storage });
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
    const el = await mount({ doc: docWithRow(), rowLibrary: storage });
    fire(el, 'row-save', { rowId: el.getDocument().body.rows[0].id });
    await new Promise((r) => setTimeout(r, 0));
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('row-insert-saved inserts a clone with fresh ids', async () => {
    const el = await mount({ doc: docWithRow() });
    const node: RowNode = createRow([createColumn([createBlock('text')])]);
    const before = el.getDocument().body.rows.length;
    fire(el, 'row-insert-saved', { index: before, node });
    const rows = el.getDocument().body.rows;
    expect(rows.length).toBe(before + 1);
    const inserted = rows[rows.length - 1];
    expect(inserted.id).not.toBe(node.id);
    expect(inserted.columns[0].id).not.toBe(node.columns[0].id);
  });

  it('library-insert (keyboard) appends a clone with fresh ids', async () => {
    const el = await mount({ doc: docWithRow() });
    const node: RowNode = createRow([createColumn([createBlock('text')])]);
    const before = el.getDocument().body.rows.length;
    fire(el, 'library-insert', { node });
    const rows = el.getDocument().body.rows;
    expect(rows.length).toBe(before + 1);
    expect(rows[rows.length - 1].id).not.toBe(node.id);
  });

  it('library-delete removes an entry from storage', async () => {
    const storage = new InMemoryRowLibraryStorage({ seed: [{ id: 'hero', name: 'Hero', kind: 'row', node: createRow([createColumn([createBlock('text')])]), createdAt: '', updatedAt: '' }] });
    const delSpy = vi.spyOn(storage, 'delete');
    const el = await mount({ doc: docWithRow(), rowLibrary: storage });
    fire(el, 'library-delete', { id: 'hero' });
    await new Promise((r) => setTimeout(r, 0));
    expect(delSpy).toHaveBeenCalledWith('hero');
  });
});
