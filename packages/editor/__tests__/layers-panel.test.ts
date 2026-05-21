import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type PigeonDocument,
} from '@lit-pigeon/core';
import '../src/components/layers/pigeon-layers.js';
import type { PigeonLayers } from '../src/components/layers/pigeon-layers.js';

async function mount(doc: PigeonDocument): Promise<PigeonLayers> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-layers .doc=${doc}></pigeon-layers>`, container);
  const el = container.querySelector('pigeon-layers') as PigeonLayers;
  await el.updateComplete;
  return el;
}

function makeDoc(): { doc: PigeonDocument; rowId: string; blockId: string } {
  const doc = createDefaultDocument('Test');
  const block = createBlock('text', { content: 'Hello' });
  const row = createRow([createColumn([block])]);
  doc.body.rows = [row];
  return { doc, rowId: row.id, blockId: block.id };
}

describe('pigeon-layers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders nothing when doc is undefined', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(html`<pigeon-layers></pigeon-layers>`, container);
    const el = container.querySelector('pigeon-layers') as PigeonLayers;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.tree')).toBeNull();
  });

  it('renders one item per row and one per block', async () => {
    const { doc } = makeDoc();
    const el = await mount(doc);
    const items = el.shadowRoot!.querySelectorAll('.tree-item');
    // one row + one block
    expect(items).toHaveLength(2);
  });

  it('emits row-select with the row id when a row item is clicked', async () => {
    const { doc, rowId } = makeDoc();
    const el = await mount(doc);
    const events: CustomEvent[] = [];
    el.addEventListener('row-select', (e) => events.push(e as CustomEvent));

    const rowItem = el.shadowRoot!.querySelector('.tree-item.indent-1') as HTMLElement;
    rowItem.click();

    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ rowId });
  });

  it('emits block-select with the block id when a block item is clicked', async () => {
    const { doc, blockId } = makeDoc();
    const el = await mount(doc);
    const events: CustomEvent[] = [];
    el.addEventListener('block-select', (e) => events.push(e as CustomEvent));

    const blockItem = el.shadowRoot!.querySelector('.tree-item.indent-3') as HTMLElement;
    blockItem.click();

    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ blockId });
  });

  it('marks the currently selected block as selected', async () => {
    const { doc, rowId, blockId } = makeDoc();
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(
      html`<pigeon-layers
        .doc=${doc}
        .selection=${{ type: 'block', rowId, columnId: doc.body.rows[0].columns[0].id, blockId }}
      ></pigeon-layers>`,
      container,
    );
    const el = container.querySelector('pigeon-layers') as PigeonLayers;
    await el.updateComplete;

    const blockItem = el.shadowRoot!.querySelector('.tree-item.indent-3');
    expect(blockItem?.classList.contains('selected')).toBe(true);
  });
});
