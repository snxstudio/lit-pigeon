import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setDragData, clearDragData } from '../src/dnd/drag-manager.js';
import '../src/components/canvas/pigeon-column.js';
import type { PigeonColumn } from '../src/components/canvas/pigeon-column.js';

async function mountColumn() {
  const col = document.createElement('pigeon-column') as PigeonColumn;
  // Minimal column model — empty so block-index math is trivial.
  (col as unknown as { column: unknown }).column = {
    id: 'c1',
    blocks: [],
    attributes: {
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      backgroundColor: '',
    },
  };
  (col as unknown as { rowId: string }).rowId = 'r1';
  document.body.appendChild(col);
  await col.updateComplete;
  return col;
}

function dispatchCancelable(target: EventTarget, type: string): Event {
  const e = new Event(type, { bubbles: true, cancelable: true });
  target.dispatchEvent(e);
  return e;
}

describe('column ignores row drags (they must bubble to the canvas)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    clearDragData();
  });
  afterEach(() => {
    document.body.innerHTML = '';
    clearDragData();
  });

  it('does NOT claim an existing-row dragover (lets it bubble)', async () => {
    const col = await mountColumn();
    const content = col.shadowRoot!.querySelector('.column-content') as HTMLElement;

    setDragData({ type: 'existing-row', rowId: 'r2' });
    const e = dispatchCancelable(content, 'dragover');
    // Not prevented => column declined => the drop bubbles to the canvas.
    expect(e.defaultPrevented).toBe(false);
  });

  it('does NOT dispatch block-drop for an existing-row drop', async () => {
    const col = await mountColumn();
    const content = col.shadowRoot!.querySelector('.column-content') as HTMLElement;

    let blockDrops = 0;
    document.addEventListener('block-drop', () => blockDrops++);

    setDragData({ type: 'existing-row', rowId: 'r2' });
    dispatchCancelable(content, 'drop');
    expect(blockDrops).toBe(0);
  });

  it('still claims a palette-block dragover', async () => {
    const col = await mountColumn();
    const content = col.shadowRoot!.querySelector('.column-content') as HTMLElement;

    setDragData({ type: 'palette-block', blockType: 'text' });
    const e = dispatchCancelable(content, 'dragover');
    expect(e.defaultPrevented).toBe(true);
  });

  it('still dispatches block-drop for a palette-block drop', async () => {
    const col = await mountColumn();
    const content = col.shadowRoot!.querySelector('.column-content') as HTMLElement;

    let blockDrops = 0;
    document.addEventListener('block-drop', () => blockDrops++);

    setDragData({ type: 'palette-block', blockType: 'text' });
    dispatchCancelable(content, 'drop');
    expect(blockDrops).toBe(1);
  });
});
