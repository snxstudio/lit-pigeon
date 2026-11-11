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
  const toggles = [...el.shadowRoot!.querySelectorAll('.toggle-row')];
  const row_ = toggles.find((t) => t.textContent?.includes('Do not stack on mobile'));
  return { el, input: row_?.querySelector('input[type="checkbox"]') as HTMLInputElement | undefined };
}

describe('row panel "do not stack on mobile" toggle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('is off for a row that does not set it', async () => {
    const { input } = await mount(createRow([createColumn()]));
    expect(input).toBeTruthy();
    expect(input!.checked).toBe(false);
  });

  it('is on for a row that does', async () => {
    const row = createRow([createColumn()]);
    row.attributes.noStackOnMobile = true;
    const { input } = await mount(row);
    expect(input!.checked).toBe(true);
  });

  it('emits true when ticked and undefined when cleared', async () => {
    const row = createRow([createColumn()]);
    const { el, input } = await mount(row);
    const events: CustomEvent[] = [];
    el.addEventListener('row-property-change', (e) => events.push(e as CustomEvent));

    input!.checked = true;
    input!.dispatchEvent(new Event('change'));
    input!.checked = false;
    input!.dispatchEvent(new Event('change'));

    expect(events.map((e) => e.detail)).toEqual([
      { rowId: row.id, attributes: { noStackOnMobile: true } },
      { rowId: row.id, attributes: { noStackOnMobile: undefined } },
    ]);
  });
});
