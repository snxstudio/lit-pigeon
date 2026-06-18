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
    // Target whichever element carries the @drop handler (read the template;
    // it is the `.canvas-area` element or the element with @drop=${this._onDrop}).
    const dropTarget = (el.shadowRoot!.querySelector('[part="canvas-area"]')
      ?? el.shadowRoot!.querySelector('.canvas-area')
      ?? el.shadowRoot!.firstElementChild) as HTMLElement;
    dropTarget.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));

    expect(events).toHaveLength(1);
    expect(events[0].detail.node.id).toBe(node.id);
    expect(typeof events[0].detail.index).toBe('number');
  });
});
