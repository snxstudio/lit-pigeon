import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import type { BrandKit } from '@lit-pigeon/core';
import '../src/components/palette/pigeon-brand-tab.js';
import type { PigeonBrandTab } from '../src/components/palette/pigeon-brand-tab.js';

function kit(): BrandKit {
  return {
    id: 'k', name: 'Kit',
    colors: [{ id: 'c1', name: 'Brand', value: '#4f46e5' }],
    fonts: [{ id: 'f1', name: 'Lora', family: 'Lora, serif' }],
    logos: [{ id: 'l1', name: 'Logo', src: 'https://x/logo.png' }],
    createdAt: '2020-01-01', updatedAt: '2020-01-01',
  };
}

async function mount(brandKit: BrandKit) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-brand-tab .brandKit=${brandKit}></pigeon-brand-tab>`, container);
  const el = container.querySelector('pigeon-brand-tab') as PigeonBrandTab;
  await el.updateComplete;
  return el;
}

describe('pigeon-brand-tab', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('renders one entry per color, font, and logo', async () => {
    const el = await mount(kit());
    expect(el.shadowRoot!.querySelectorAll('[data-color-id]').length).toBe(1);
    expect(el.shadowRoot!.querySelectorAll('[data-font-id]').length).toBe(1);
    expect(el.shadowRoot!.querySelectorAll('[data-logo-id]').length).toBe(1);
  });

  it('emits brand-color-apply when a color swatch is clicked', async () => {
    const el = await mount(kit());
    const events: CustomEvent[] = [];
    el.addEventListener('brand-color-apply', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('[data-color-id="c1"] .swatch') as HTMLButtonElement).click();
    expect(events[0].detail).toEqual({ value: '#4f46e5' });
  });

  it('emits brand-font-apply when a font is clicked', async () => {
    const el = await mount(kit());
    const events: CustomEvent[] = [];
    el.addEventListener('brand-font-apply', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('[data-font-id="f1"] .apply') as HTMLButtonElement).click();
    expect(events[0].detail).toEqual({ family: 'Lora, serif' });
  });

  it('emits brand-logo-insert when a logo is clicked', async () => {
    const el = await mount(kit());
    const events: CustomEvent[] = [];
    el.addEventListener('brand-logo-insert', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('[data-logo-id="l1"] .apply') as HTMLButtonElement).click();
    expect(events[0].detail.logo.id).toBe('l1');
  });

  it('emits brand-kit-edit with the color removed when delete is clicked', async () => {
    const el = await mount(kit());
    const events: CustomEvent[] = [];
    el.addEventListener('brand-kit-edit', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('[data-color-id="c1"] .delete') as HTMLButtonElement).click();
    expect(events[0].detail.kit.colors).toHaveLength(0);
    expect(events[0].detail.kit.id).toBe('k');
  });

  it('emits brand-kit-edit with a new color appended when Add Color is clicked', async () => {
    const el = await mount(kit());
    const events: CustomEvent[] = [];
    el.addEventListener('brand-kit-edit', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('.add-color') as HTMLButtonElement).click();
    expect(events[0].detail.kit.colors).toHaveLength(2);
    expect(events[0].detail.kit.colors[1].value).toBe('#000000');
  });
});
