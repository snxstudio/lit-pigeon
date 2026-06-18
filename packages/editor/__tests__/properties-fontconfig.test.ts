import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { BrandKit, FontDefinition, PigeonDocument } from '@lit-pigeon/core';
import '../src/components/properties/pigeon-properties.js';
import type { PigeonProperties } from '../src/components/properties/pigeon-properties.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [],
  fonts: [{ id: 'l', name: 'Lora', family: 'Lora, serif' }], logos: [],
  createdAt: '', updatedAt: '',
};
const FONT_CONFIG: FontDefinition[] = [
  { name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://x/inter.css' },
];

async function mount(doc: PigeonDocument, brandKit: BrandKit | null, fontConfig: FontDefinition[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-properties .doc=${doc} .selection=${null} .brandKit=${brandKit} .fontConfig=${fontConfig}></pigeon-properties>`,
    container,
  );
  const el = container.querySelector('pigeon-properties') as PigeonProperties;
  await el.updateComplete;
  return el;
}

describe('pigeon-properties fontConfig', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('passes fontConfig + brand fonts to the body panel font list', async () => {
    const el = await mount(createDefaultDocument(), KIT, FONT_CONFIG);
    const body = el.shadowRoot!.querySelector('pigeon-body-panel') as HTMLElement & {
      brandFonts: FontDefinition[]; updateComplete: Promise<unknown>;
    };
    await body.updateComplete;
    const families = body.brandFonts.map((f) => f.family);
    expect(families).toContain('Inter, Arial, sans-serif'); // from fontConfig
    expect(families).toContain('Lora, serif'); // from brand kit
  });

  it('the font picker lists an Inter option from fontConfig', async () => {
    const el = await mount(createDefaultDocument(), null, FONT_CONFIG);
    const body = el.shadowRoot!.querySelector('pigeon-body-panel') as HTMLElement & { updateComplete: Promise<unknown>; shadowRoot: ShadowRoot };
    await body.updateComplete;
    const picker = body.shadowRoot.querySelector('pigeon-font-picker') as HTMLElement & { updateComplete: Promise<unknown> };
    await picker.updateComplete;
    const values = Array.from(picker.shadowRoot!.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value);
    expect(values).toContain('Inter, Arial, sans-serif');
  });

  it('deduplicates by family, fontConfig entry wins on collision', async () => {
    const overrideKit: BrandKit = {
      ...KIT,
      fonts: [{ id: 'inter-kit', name: 'Inter Kit', family: 'Inter, Arial, sans-serif' }],
    };
    const el = await mount(createDefaultDocument(), overrideKit, FONT_CONFIG);
    const body = el.shadowRoot!.querySelector('pigeon-body-panel') as HTMLElement & {
      brandFonts: FontDefinition[]; updateComplete: Promise<unknown>;
    };
    await body.updateComplete;
    const interEntries = body.brandFonts.filter((f) => f.family === 'Inter, Arial, sans-serif');
    expect(interEntries).toHaveLength(1);
    expect(interEntries[0].name).toBe('Inter'); // the fontConfig entry, not 'Inter Kit'
  });
});
