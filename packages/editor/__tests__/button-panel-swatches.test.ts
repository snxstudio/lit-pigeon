import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createBlock } from '@lit-pigeon/core';
import type { BrandColor, ButtonBlock } from '@lit-pigeon/core';
import '../src/components/properties/panels/button-panel.js';
import type { PigeonButtonPanel } from '../src/components/properties/panels/button-panel.js';

const SWATCHES: BrandColor[] = [{ id: 'b', name: 'Brand', value: '#4f46e5' }];

describe('pigeon-button-panel swatches', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('forwards swatches to both color pickers', async () => {
    const block = createBlock('button') as ButtonBlock;
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(
      html`<pigeon-button-panel .block=${block} .swatches=${SWATCHES}></pigeon-button-panel>`,
      container,
    );
    const panel = container.querySelector('pigeon-button-panel') as PigeonButtonPanel;
    await panel.updateComplete;
    const pickers = Array.from(panel.shadowRoot!.querySelectorAll('pigeon-color-picker')) as Array<
      HTMLElement & { swatches: BrandColor[] }
    >;
    expect(pickers).toHaveLength(2);
    expect(pickers.every((p) => p.swatches === SWATCHES)).toBe(true);
  });
});
