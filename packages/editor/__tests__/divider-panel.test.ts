import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { createBlock } from '@lit-pigeon/core';
import type { DividerBlock } from '@lit-pigeon/core';
import '../src/components/properties/panels/divider-panel.js';
import type { PigeonDividerPanel } from '../src/components/properties/panels/divider-panel.js';

async function mount(block: DividerBlock) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-divider-panel
      .block=${block}
      rowId="r1"
      columnId="c1"
    ></pigeon-divider-panel>`,
    container,
  );
  const panel = container.querySelector('pigeon-divider-panel') as PigeonDividerPanel;
  await panel.updateComplete;
  return { panel, container };
}

function captureEvents(panel: HTMLElement, type: string) {
  const events: CustomEvent[] = [];
  panel.addEventListener(type, (e) => events.push(e as CustomEvent));
  return events;
}

describe('pigeon-divider-panel', () => {
  let block: DividerBlock;

  beforeEach(() => {
    document.body.innerHTML = '';
    block = createBlock('divider') as DividerBlock;
  });

  it('renders its heading and the four controls', async () => {
    const { panel } = await mount(block);
    const shadow = panel.shadowRoot!;

    expect(shadow.querySelector('h3')?.textContent).toBe('Divider Properties');
    expect(shadow.querySelector('select')).toBeTruthy();
    expect(shadow.querySelector('pigeon-color-picker')).toBeTruthy();
    expect(shadow.querySelectorAll('pigeon-slider-input').length).toBeGreaterThanOrEqual(1);
    expect(shadow.querySelector('pigeon-spacing-input')).toBeTruthy();
  });

  it('emits property-change when border style changes', async () => {
    const { panel } = await mount(block);
    const events = captureEvents(panel, 'property-change');

    const select = panel.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = 'dashed';
    select.dispatchEvent(new Event('change'));

    expect(events).toHaveLength(1);
    expect(events[0].detail).toMatchObject({
      rowId: 'r1',
      columnId: 'c1',
      blockId: block.id,
      values: { borderStyle: 'dashed' },
    });
  });

  it('emits property-change when width text input changes', async () => {
    const { panel } = await mount(block);
    const events = captureEvents(panel, 'property-change');

    const widthInput = panel.shadowRoot!.querySelector('input[type="text"]') as HTMLInputElement;
    widthInput.value = '50%';
    widthInput.dispatchEvent(new Event('change'));

    expect(events).toHaveLength(1);
    expect(events[0].detail.values).toEqual({ width: '50%' });
  });

  it('property-change carries the block id, rowId and columnId in detail', async () => {
    const { panel } = await mount(block);
    const events = captureEvents(panel, 'property-change');

    const select = panel.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = 'dotted';
    select.dispatchEvent(new Event('change'));

    expect(events[0].detail.rowId).toBe('r1');
    expect(events[0].detail.columnId).toBe('c1');
    expect(events[0].detail.blockId).toBe(block.id);
  });
});
