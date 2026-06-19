import { describe, it, expect, afterEach } from 'vitest';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
} from '@lit-pigeon/core';
import { setDragData, clearDragData } from '../src/dnd/drag-manager.js';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';
import '../src/components/canvas/pigeon-column.js';
import type { PigeonColumn } from '../src/components/canvas/pigeon-column.js';

function fireDrag(target: EventTarget, type: string, clientY = 99999) {
  const e = new Event(type, { bubbles: true, cancelable: true, composed: true }) as DragEvent;
  Object.defineProperty(e, 'clientY', { value: clientY });
  Object.defineProperty(e, 'clientX', { value: 10 });
  Object.defineProperty(e, 'dataTransfer', {
    value: {
      setData() {},
      getData() {
        return '';
      },
      setDragImage() {},
      dropEffect: '',
      effectAllowed: '',
    },
  });
  target.dispatchEvent(e);
  return e;
}

async function mountEditor(blockContents: string[]) {
  const doc = createDefaultDocument('Repro');
  doc.body.rows = [
    createRow([
      createColumn(blockContents.map((c) => createBlock('text', { content: c }))),
    ]),
  ];
  const el = document.createElement('pigeon-editor') as PigeonEditor;
  document.body.appendChild(el);
  el.document = doc;
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

function getColumn(el: PigeonEditor) {
  const canvas = el.shadowRoot!.querySelector('pigeon-canvas')!;
  const row = canvas.shadowRoot!.querySelector('pigeon-row')!;
  return row.shadowRoot!.querySelector('pigeon-column') as PigeonColumn;
}

function blockOrder(el: PigeonEditor): string[] {
  return el
    .getDocument()
    .body.rows[0].columns[0].blocks.map(
      (b) => (b as { values: { content: string } }).values.content,
    );
}

describe('block drag-to-reorder', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    clearDragData();
  });

  it('exposes a drag handle on a content block', async () => {
    const el = await mountEditor(['<p>A</p>', '<p>B</p>']);
    const col = getColumn(el);
    const handle = col.shadowRoot!.querySelector('.block-drag-handle');
    expect(handle, 'each block should render a .block-drag-handle').toBeTruthy();
  });

  it('dragging block A past block B swaps their order', async () => {
    const el = await mountEditor(['<p>A</p>', '<p>B</p>']);
    const col = getColumn(el);

    const handle = col.shadowRoot!.querySelector('.block-drag-handle') as HTMLElement;
    expect(handle).toBeTruthy();
    fireDrag(handle, 'dragstart');

    const content = col.shadowRoot!.querySelector('.column-content') as HTMLElement;
    fireDrag(content, 'dragover', 99999); // drop at the bottom
    fireDrag(content, 'drop', 99999);
    await el.updateComplete;

    expect(blockOrder(el)).toEqual(['<p>B</p>', '<p>A</p>']);
  });

  it('same-column downward move lands in the right slot (no off-by-one)', async () => {
    // Mount a column directly so we can give the blocks real layout rects
    // (jsdom returns zeroed rects, which collapses the drop-index math).
    const doc = createDefaultDocument('Repro');
    doc.body.rows = [
      createRow([
        createColumn([
          createBlock('text', { content: '<p>A</p>' }),
          createBlock('text', { content: '<p>B</p>' }),
          createBlock('text', { content: '<p>C</p>' }),
        ]),
      ]),
    ];
    const column = doc.body.rows[0].columns[0];
    const aId = column.blocks[0].id;

    const col = document.createElement('pigeon-column') as PigeonColumn;
    (col as unknown as { column: unknown }).column = column;
    (col as unknown as { rowId: string }).rowId = doc.body.rows[0].id;
    document.body.appendChild(col);
    await col.updateComplete;

    // Lay the three text blocks out at y = 0/10/20 (height 10 each).
    const blockEls = Array.from(
      col.shadowRoot!.querySelectorAll('pigeon-text-block'),
    ) as HTMLElement[];
    blockEls.forEach((b, i) => {
      b.getBoundingClientRect = () =>
        ({ top: i * 10, height: 10, bottom: i * 10 + 10, left: 0, right: 100, width: 100, x: 0, y: i * 10 } as DOMRect);
    });

    let dispatchedIndex = -1;
    col.addEventListener('block-drop', (e) => {
      dispatchedIndex = (e as CustomEvent).detail.index;
    });

    // Drag A (index 0) to the gap between B and C (visual index 2).
    setDragData({
      type: 'existing-block',
      blockId: aId,
      rowId: doc.body.rows[0].id,
      columnId: column.id,
    });
    const content = col.shadowRoot!.querySelector('.column-content') as HTMLElement;
    fireDrag(content, 'dragover', 22); // 22 is below B's mid (15), above C's mid (25)
    fireDrag(content, 'drop', 22);

    // Visual drop index is 2; after removing the source at 0, the splice index
    // must be 1 so A ends up between B and C ([B, A, C]) — not appended.
    expect(dispatchedIndex).toBe(1);
  });
});
