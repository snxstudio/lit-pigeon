import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { createBlock } from '@lit-pigeon/core';
import type { SpacerBlock } from '@lit-pigeon/core';
import '../src/components/properties/panels/spacer-panel.js';
import type { PigeonSpacerPanel } from '../src/components/properties/panels/spacer-panel.js';

async function mount(block: SpacerBlock) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-spacer-panel
      .block=${block}
      rowId="r1"
      columnId="c1"
    ></pigeon-spacer-panel>`,
    container,
  );
  const panel = container.querySelector('pigeon-spacer-panel') as PigeonSpacerPanel;
  await panel.updateComplete;
  return panel;
}

describe('pigeon-spacer-panel', () => {
  let block: SpacerBlock;

  beforeEach(() => {
    document.body.innerHTML = '';
    block = createBlock('spacer') as SpacerBlock;
  });

  it('renders the height slider only', async () => {
    const panel = await mount(block);
    const shadow = panel.shadowRoot!;

    expect(shadow.querySelector('h3')?.textContent).toBe('Spacer Properties');
    expect(shadow.querySelectorAll('pigeon-slider-input').length).toBe(1);
  });

  it('emits property-change with the new height when the slider fires', async () => {
    const panel = await mount(block);
    const events: CustomEvent[] = [];
    panel.addEventListener('property-change', (e) => events.push(e as CustomEvent));

    const slider = panel.shadowRoot!.querySelector('pigeon-slider-input') as HTMLElement;
    slider.dispatchEvent(
      new CustomEvent('slider-change', { detail: { value: 48 }, bubbles: true, composed: true }),
    );

    expect(events).toHaveLength(1);
    expect(events[0].detail).toMatchObject({
      rowId: 'r1',
      columnId: 'c1',
      blockId: block.id,
      values: { height: 48 },
    });
  });
});
