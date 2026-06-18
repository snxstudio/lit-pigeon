import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { BrandColor, BrandFont, PigeonDocument } from '@lit-pigeon/core';
import '../src/components/properties/panels/body-panel.js';
import type { PigeonBodyPanel } from '../src/components/properties/panels/body-panel.js';

async function mount(doc: PigeonDocument, swatches: BrandColor[], brandFonts: BrandFont[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-body-panel .doc=${doc} .swatches=${swatches} .brandFonts=${brandFonts}></pigeon-body-panel>`,
    container,
  );
  const el = container.querySelector('pigeon-body-panel') as PigeonBodyPanel;
  await el.updateComplete;
  return el;
}

describe('pigeon-body-panel brand integration', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('renders a pigeon-font-picker instead of a bare select', async () => {
    const el = await mount(createDefaultDocument(), [], []);
    expect(el.shadowRoot!.querySelector('pigeon-font-picker')).toBeTruthy();
  });

  it('forwards swatches to the background color picker', async () => {
    const swatches: BrandColor[] = [{ id: 'b', name: 'Brand', value: '#4f46e5' }];
    const el = await mount(createDefaultDocument(), swatches, []);
    const picker = el.shadowRoot!.querySelector('pigeon-color-picker') as HTMLElement & { swatches: BrandColor[] };
    expect(picker.swatches).toEqual(swatches);
  });

  it('emits body-property-change for fontFamily from the font picker', async () => {
    const el = await mount(createDefaultDocument(), [], []);
    const events: CustomEvent[] = [];
    el.addEventListener('body-property-change', (e) => events.push(e as CustomEvent));
    const fp = el.shadowRoot!.querySelector('pigeon-font-picker')!;
    fp.dispatchEvent(new CustomEvent('font-change', { detail: { value: 'Georgia, Times, serif' } }));
    expect(events[0].detail).toEqual({ attribute: 'fontFamily', value: 'Georgia, Times, serif' });
  });
});
