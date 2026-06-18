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
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
  });
});
