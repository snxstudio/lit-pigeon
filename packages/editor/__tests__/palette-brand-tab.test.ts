import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { BrandKit, PigeonDocument } from '@lit-pigeon/core';
import '../src/components/palette/pigeon-palette.js';
import type { PigeonPalette } from '../src/components/palette/pigeon-palette.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [], fonts: [], logos: [], createdAt: '', updatedAt: '',
};

async function mount(doc: PigeonDocument, brandKit: BrandKit | null) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-palette .doc=${doc} .brandKit=${brandKit}></pigeon-palette>`, container);
  const el = container.querySelector('pigeon-palette') as PigeonPalette;
  await el.updateComplete;
  return el;
}

describe('pigeon-palette brand tab', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('hides the Brand tab when no kit is set', async () => {
    const el = await mount(createDefaultDocument(), null);
    expect(el.shadowRoot!.querySelector('#pigeon-tab-brand')).toBeNull();
  });

  it('shows the Brand tab when a kit is set', async () => {
    const el = await mount(createDefaultDocument(), KIT);
    expect(el.shadowRoot!.querySelector('#pigeon-tab-brand')).toBeTruthy();
  });

  it('renders pigeon-brand-tab when the Brand tab is selected', async () => {
    const el = await mount(createDefaultDocument(), KIT);
    (el.shadowRoot!.querySelector('#pigeon-tab-brand') as HTMLButtonElement).click();
    // Brand tab is dynamically imported on first activation — let macrotasks settle.
    await new Promise((r) => setTimeout(r, 50));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('pigeon-brand-tab')).toBeTruthy();
  });

  it('does not render pigeon-brand-tab before the Brand tab is selected', async () => {
    const el = await mount(createDefaultDocument(), KIT);
    expect(el.shadowRoot!.querySelector('pigeon-brand-tab')).toBeNull();
  });

  it('falls back to the Content tab when brandKit becomes null while Brand is active', async () => {
    const el = await mount(createDefaultDocument(), KIT);
    (el.shadowRoot!.querySelector('#pigeon-tab-brand') as HTMLButtonElement).click();
    // Brand tab is dynamically imported on first activation — let macrotasks settle.
    await new Promise((r) => setTimeout(r, 50));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('pigeon-brand-tab')).toBeTruthy();
    el.brandKit = null;
    await el.updateComplete;
    await el.updateComplete; // allow the updated() re-render to flush
    expect(el.shadowRoot!.querySelector('pigeon-brand-tab')).toBeNull();
    expect(el.shadowRoot!.querySelector('#pigeon-tab-brand')).toBeNull();
    // Content tab is now active again
    expect(el.shadowRoot!.querySelector('.tab.active')?.id).toBe('pigeon-tab-content');
  });
});
