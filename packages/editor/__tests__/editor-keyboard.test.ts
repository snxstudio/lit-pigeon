import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, render } from 'lit';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type PigeonDocument,
} from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mountEditor(doc: PigeonDocument): Promise<PigeonEditor> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .document=${doc}></pigeon-editor>`, container);
  const editor = container.querySelector('pigeon-editor') as PigeonEditor;
  await editor.updateComplete;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  return editor;
}

function selectBlockOnEditor(editor: PigeonEditor, rowId: string, blockId: string) {
  const canvas = editor.shadowRoot!.querySelector('pigeon-canvas') as HTMLElement;
  canvas.dispatchEvent(
    new CustomEvent('block-select', {
      detail: { blockId },
      bubbles: true,
      composed: true,
    }),
  );
  return { rowId };
}

function selectRowOnEditor(editor: PigeonEditor, rowId: string) {
  const canvas = editor.shadowRoot!.querySelector('pigeon-canvas') as HTMLElement;
  canvas.dispatchEvent(
    new CustomEvent('row-select', {
      detail: { rowId },
      bubbles: true,
      composed: true,
    }),
  );
}

function pressKey(opts: KeyboardEventInit) {
  document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...opts }));
}

function makeDoc(): { doc: PigeonDocument; rowId: string; blockId: string } {
  const doc = createDefaultDocument('Test');
  const block = createBlock('text', { content: 'Hello' });
  const row = createRow([createColumn([block])]);
  doc.body.rows = [row];
  return { doc, rowId: row.id, blockId: block.id };
}

describe('pigeon-editor keyboard shortcuts', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Delete / Backspace', () => {
    it('removes the selected block', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);

      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      pressKey({ key: 'Delete' });
      await editor.updateComplete;

      const after = editor.getDocument();
      expect(after.body.rows[0].columns[0].blocks).toHaveLength(0);
    });

    it('Backspace also removes the selected block', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);
      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      pressKey({ key: 'Backspace' });
      await editor.updateComplete;

      expect(editor.getDocument().body.rows[0].columns[0].blocks).toHaveLength(0);
    });

    it('removes the selected row', async () => {
      const { doc, rowId } = makeDoc();
      const editor = await mountEditor(doc);
      selectRowOnEditor(editor, rowId);
      await editor.updateComplete;

      pressKey({ key: 'Delete' });
      await editor.updateComplete;

      expect(editor.getDocument().body.rows).toHaveLength(0);
    });

    it('does nothing when focus is in an INPUT', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);
      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
      await editor.updateComplete;

      expect(editor.getDocument().body.rows[0].columns[0].blocks).toHaveLength(1);
    });
  });

  describe('Cmd/Ctrl+D duplicate', () => {
    it('duplicates the selected block', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);
      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      pressKey({ key: 'd', metaKey: true });
      await editor.updateComplete;

      const blocks = editor.getDocument().body.rows[0].columns[0].blocks;
      expect(blocks).toHaveLength(2);
      expect(blocks[0].id).not.toBe(blocks[1].id);
      expect(blocks[0].type).toBe(blocks[1].type);
    });

    it('duplicates the selected row', async () => {
      const { doc, rowId } = makeDoc();
      const editor = await mountEditor(doc);
      selectRowOnEditor(editor, rowId);
      await editor.updateComplete;

      pressKey({ key: 'd', ctrlKey: true });
      await editor.updateComplete;

      expect(editor.getDocument().body.rows).toHaveLength(2);
    });
  });

  describe('Cmd/Ctrl+Z undo and redo', () => {
    it('undoes the last change', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);
      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      pressKey({ key: 'Delete' });
      await editor.updateComplete;
      expect(editor.getDocument().body.rows[0].columns[0].blocks).toHaveLength(0);

      pressKey({ key: 'z', metaKey: true });
      await editor.updateComplete;
      expect(editor.getDocument().body.rows[0].columns[0].blocks).toHaveLength(1);
    });

    it('redoes via Shift+Cmd+Z', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);
      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      pressKey({ key: 'Delete' });
      await editor.updateComplete;
      pressKey({ key: 'z', metaKey: true });
      await editor.updateComplete;
      expect(editor.getDocument().body.rows[0].columns[0].blocks).toHaveLength(1);

      pressKey({ key: 'z', metaKey: true, shiftKey: true });
      await editor.updateComplete;
      expect(editor.getDocument().body.rows[0].columns[0].blocks).toHaveLength(0);
    });

    it('redoes via Ctrl+Y', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);
      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      pressKey({ key: 'Delete' });
      await editor.updateComplete;
      pressKey({ key: 'z', ctrlKey: true });
      await editor.updateComplete;
      pressKey({ key: 'y', ctrlKey: true });
      await editor.updateComplete;

      expect(editor.getDocument().body.rows[0].columns[0].blocks).toHaveLength(0);
    });
  });

  describe('ArrowDown / ArrowUp block navigation', () => {
    async function makeMultiBlockEditor() {
      const doc = createDefaultDocument('Test');
      const b1 = createBlock('text', { content: 'one' });
      const b2 = createBlock('text', { content: 'two' });
      const b3 = createBlock('text', { content: 'three' });
      const col1 = createColumn([b1, b2]);
      const col2 = createColumn([b3]);
      const row = createRow([col1, col2]);
      doc.body.rows = [row];
      const editor = await mountEditor(doc);
      return { editor, rowId: row.id, b1: b1.id, b2: b2.id, b3: b3.id };
    }

    it('ArrowDown moves selection to the next block in document order', async () => {
      const { editor, rowId, b1, b2 } = await makeMultiBlockEditor();
      selectBlockOnEditor(editor, rowId, b1);
      await editor.updateComplete;

      let sel: { blockId?: string } | null = null;
      editor.addEventListener('pigeon:select', (e) => {
        sel = (e as CustomEvent).detail.selection;
      });

      pressKey({ key: 'ArrowDown' });
      await editor.updateComplete;

      expect(sel).not.toBeNull();
      expect(sel!.blockId).toBe(b2);
    });

    it('ArrowDown crosses column boundaries', async () => {
      const { editor, rowId, b2, b3 } = await makeMultiBlockEditor();
      selectBlockOnEditor(editor, rowId, b2);
      await editor.updateComplete;

      let sel: { blockId?: string } | null = null;
      editor.addEventListener('pigeon:select', (e) => {
        sel = (e as CustomEvent).detail.selection;
      });

      pressKey({ key: 'ArrowDown' });
      await editor.updateComplete;

      expect(sel!.blockId).toBe(b3);
    });

    it('ArrowUp moves selection to the previous block', async () => {
      const { editor, rowId, b1, b3 } = await makeMultiBlockEditor();
      selectBlockOnEditor(editor, rowId, b3);
      await editor.updateComplete;

      let sel: { blockId?: string } | null = null;
      editor.addEventListener('pigeon:select', (e) => {
        sel = (e as CustomEvent).detail.selection;
      });

      pressKey({ key: 'ArrowUp' });
      await editor.updateComplete;
      pressKey({ key: 'ArrowUp' });
      await editor.updateComplete;

      expect(sel!.blockId).toBe(b1);
    });

    it('ArrowDown at the last block is a no-op', async () => {
      const { editor, rowId, b3 } = await makeMultiBlockEditor();
      selectBlockOnEditor(editor, rowId, b3);
      await editor.updateComplete;

      let selectChangeCount = 0;
      editor.addEventListener('pigeon:select', () => {
        selectChangeCount++;
      });

      pressKey({ key: 'ArrowDown' });
      await editor.updateComplete;

      expect(selectChangeCount).toBe(0);
    });

    it('ArrowDown does nothing when no block is selected', async () => {
      const doc = createDefaultDocument('Test');
      const block = createBlock('text', { content: 'hi' });
      doc.body.rows = [createRow([createColumn([block])])];
      const editor = await mountEditor(doc);

      // Default selection is null / body
      let selectChangeCount = 0;
      editor.addEventListener('pigeon:select', () => {
        selectChangeCount++;
      });

      pressKey({ key: 'ArrowDown' });
      await editor.updateComplete;

      expect(selectChangeCount).toBe(0);
    });
  });

  describe('Cmd/Ctrl+C and Cmd/Ctrl+V copy + paste', () => {
    it('Cmd+C copies the block and Cmd+V pastes it after the selection', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);
      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      pressKey({ key: 'c', metaKey: true });
      await editor.updateComplete;
      pressKey({ key: 'v', metaKey: true });
      await editor.updateComplete;

      const blocks = editor.getDocument().body.rows[0].columns[0].blocks;
      expect(blocks).toHaveLength(2);
      expect(blocks[0].id).not.toBe(blocks[1].id);
      expect(blocks[0].type).toBe(blocks[1].type);
      // Source unchanged, pasted is positioned right after
      expect(blocks[0].id).toBe(blockId);
    });

    it('Cmd+V with an empty clipboard does nothing', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);
      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      pressKey({ key: 'v', metaKey: true });
      await editor.updateComplete;

      expect(editor.getDocument().body.rows[0].columns[0].blocks).toHaveLength(1);
    });

    it('Cmd+V can be triggered multiple times to paste multiple copies', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);
      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      pressKey({ key: 'c', metaKey: true });
      await editor.updateComplete;
      pressKey({ key: 'v', metaKey: true });
      await editor.updateComplete;
      pressKey({ key: 'v', metaKey: true });
      await editor.updateComplete;

      const blocks = editor.getDocument().body.rows[0].columns[0].blocks;
      expect(blocks).toHaveLength(3);
      const ids = new Set(blocks.map(b => b.id));
      expect(ids.size).toBe(3);
    });
  });

  describe('Escape', () => {
    it('clears selection back to body', async () => {
      const { doc, rowId, blockId } = makeDoc();
      const editor = await mountEditor(doc);
      selectBlockOnEditor(editor, rowId, blockId);
      await editor.updateComplete;

      let lastSelect: { type?: string } | null = null;
      editor.addEventListener('pigeon:select', (e) => {
        lastSelect = (e as CustomEvent).detail.selection;
      });

      pressKey({ key: 'Escape' });
      await editor.updateComplete;

      expect(lastSelect).not.toBeNull();
      expect(lastSelect!.type).toBe('body');
    });
  });
});
