import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { createRow, createColumn, type RowNode } from '@lit-pigeon/core';
import '../src/components/properties/panels/row-panel.js';
import type { PigeonRowPanel } from '../src/components/properties/panels/row-panel.js';

async function mount(row: RowNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-row-panel .row=${row}></pigeon-row-panel>`, container);
  const el = container.querySelector('pigeon-row-panel') as PigeonRowPanel;
  await el.updateComplete;
  return { el, input: el.shadowRoot!.querySelector('#row-repeat') as HTMLInputElement | null };
}

describe('row panel repeat field', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the current repeat path', async () => {
    const row = createRow([createColumn()]);
    row.attributes.repeat = 'order.items';
    const { input } = await mount(row);
    expect(input).toBeTruthy();
    expect(input!.value).toBe('order.items');
  });

  it('emits the trimmed path, or undefined when cleared', async () => {
    const row = createRow([createColumn()]);
    const { el, input } = await mount(row);
    const events: CustomEvent[] = [];
    el.addEventListener('row-property-change', (e) => events.push(e as CustomEvent));

    input!.value = ' order.items ';
    input!.dispatchEvent(new Event('change'));
    input!.value = '';
    input!.dispatchEvent(new Event('change'));

    expect(events.map((e) => e.detail)).toEqual([
      { rowId: row.id, attributes: { repeat: 'order.items' } },
      { rowId: row.id, attributes: { repeat: undefined } },
    ]);
  });
});
