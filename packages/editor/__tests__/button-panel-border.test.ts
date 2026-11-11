import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { createBlock } from '@lit-pigeon/core';
import type { ButtonBlock } from '@lit-pigeon/core';
import '../src/components/properties/panels/button-panel.js';
import type { PigeonButtonPanel } from '../src/components/properties/panels/button-panel.js';

async function mount(block: ButtonBlock) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-button-panel .block=${block} rowId="r1" columnId="c1"></pigeon-button-panel>`,
    container,
  );
  const panel = container.querySelector('pigeon-button-panel') as PigeonButtonPanel;
  await panel.updateComplete;
  return panel;
}

function captureEvents(panel: HTMLElement) {
  const events: CustomEvent[] = [];
  panel.addEventListener('property-change', (e) => events.push(e as CustomEvent));
  return events;
}

/** The panel has a select for font weight too, so find this one by its label. */
function borderSelect(panel: PigeonButtonPanel): HTMLSelectElement {
  const field = [...panel.shadowRoot!.querySelectorAll('.field')].find(
    (el) => el.querySelector('label')?.textContent === 'Border',
  )!;
  return field.querySelector('select') as HTMLSelectElement;
}

function labelled(panel: PigeonButtonPanel, tag: string, label: string): Element | undefined {
  return [...panel.shadowRoot!.querySelectorAll(tag)].find((el) => el.getAttribute('label') === label);
}

describe('pigeon-button-panel border controls', () => {
  let block: ButtonBlock;

  beforeEach(() => {
    document.body.innerHTML = '';
    block = createBlock('button') as ButtonBlock;
  });

  it('shows only the style select for a borderless button', async () => {
    const panel = await mount(block);
    const select = borderSelect(panel);

    expect(select.value).toBe('none');
    expect(labelled(panel, 'pigeon-slider-input', 'Border Width')).toBeUndefined();
    expect(labelled(panel, 'pigeon-color-picker', 'Border Color')).toBeUndefined();
  });

  it('starts a new border from the text colour at 1px', async () => {
    const panel = await mount(block);
    const events = captureEvents(panel);

    const select = borderSelect(panel);
    select.value = 'solid';
    select.dispatchEvent(new Event('change'));

    expect(events).toHaveLength(1);
    expect(events[0].detail.values).toEqual({
      border: { width: 1, style: 'solid', color: block.values.textColor },
    });
  });

  it('reveals the width and colour controls once a border is set', async () => {
    block.values.border = { width: 2, style: 'dashed', color: '#e8590c' };
    const panel = await mount(block);

    expect(borderSelect(panel).value).toBe('dashed');
    expect(labelled(panel, 'pigeon-slider-input', 'Border Width')).toBeTruthy();
    expect(labelled(panel, 'pigeon-color-picker', 'Border Color')).toBeTruthy();
  });

  it('keeps the width and colour when only the style changes', async () => {
    block.values.border = { width: 3, style: 'solid', color: '#e8590c' };
    const panel = await mount(block);
    const events = captureEvents(panel);

    const select = borderSelect(panel);
    select.value = 'dotted';
    select.dispatchEvent(new Event('change'));

    expect(events[0].detail.values).toEqual({
      border: { width: 3, style: 'dotted', color: '#e8590c' },
    });
  });

  it('clears the border rather than storing a zero width when set to None', async () => {
    block.values.border = { width: 2, style: 'solid', color: '#e8590c' };
    const panel = await mount(block);
    const events = captureEvents(panel);

    const select = borderSelect(panel);
    select.value = 'none';
    select.dispatchEvent(new Event('change'));

    expect(events[0].detail.values).toEqual({ border: undefined });
  });

  it('emits the edited width and colour against the existing border', async () => {
    block.values.border = { width: 2, style: 'solid', color: '#e8590c' };
    const panel = await mount(block);
    const events = captureEvents(panel);

    labelled(panel, 'pigeon-slider-input', 'Border Width')!.dispatchEvent(
      new CustomEvent('slider-change', { detail: { value: 5 }, bubbles: true, composed: true }),
    );

    labelled(panel, 'pigeon-color-picker', 'Border Color')!.dispatchEvent(
      new CustomEvent('color-change', { detail: { value: '#0071e3' }, bubbles: true, composed: true }),
    );

    expect(events.map((e) => e.detail.values)).toEqual([
      { border: { width: 5, style: 'solid', color: '#e8590c' } },
      { border: { width: 2, style: 'solid', color: '#0071e3' } },
    ]);
  });
});
