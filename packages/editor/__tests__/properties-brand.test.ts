import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { BrandKit, BrandColor, PigeonDocument, Selection } from '@lit-pigeon/core';
import '../src/components/properties/pigeon-properties.js';
import type { PigeonProperties } from '../src/components/properties/pigeon-properties.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [{ id: 'b', name: 'Brand', value: '#4f46e5' }],
  fonts: [{ id: 'l', name: 'Lora', family: 'Lora, serif' }], logos: [],
  createdAt: '', updatedAt: '',
};

async function mount(doc: PigeonDocument, selection: Selection | null, brandKit: BrandKit | null) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-properties .doc=${doc} .selection=${selection} .brandKit=${brandKit}></pigeon-properties>`,
    container,
  );
  const el = container.querySelector('pigeon-properties') as PigeonProperties;
  await el.updateComplete;
  return el;
}

describe('pigeon-properties brand forwarding', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('forwards swatches + brandFonts to the body panel', async () => {
    const el = await mount(createDefaultDocument(), null, KIT);
    const body = el.shadowRoot!.querySelector('pigeon-body-panel') as HTMLElement & {
      swatches: BrandColor[]; brandFonts: unknown[]; updateComplete: Promise<unknown>;
    };
    await body.updateComplete;
    expect(body.swatches).toEqual(KIT.colors);
    expect(body.brandFonts).toEqual(KIT.fonts);
  });

  it('passes empty arrays when brandKit is null', async () => {
    const el = await mount(createDefaultDocument(), null, null);
    const body = el.shadowRoot!.querySelector('pigeon-body-panel') as HTMLElement & { swatches: BrandColor[] };
    expect(body.swatches).toEqual([]);
  });
});
