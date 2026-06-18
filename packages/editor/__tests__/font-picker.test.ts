import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import type { BrandFont } from '@lit-pigeon/core';
import '../src/components/properties/controls/font-picker.js';
import type { PigeonFontPicker } from '../src/components/properties/controls/font-picker.js';

const BRAND: BrandFont[] = [{ id: 'lora', name: 'Lora', family: 'Lora, Georgia, serif' }];

async function mount(value: string, brandFonts: BrandFont[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-font-picker label="Font Family" .value=${value} .brandFonts=${brandFonts}></pigeon-font-picker>`,
    container,
  );
  const el = container.querySelector('pigeon-font-picker') as PigeonFontPicker;
  await el.updateComplete;
  return el;
}

describe('pigeon-font-picker', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('lists default families plus brand fonts', async () => {
    const el = await mount('Arial, Helvetica, sans-serif', BRAND);
    const options = Array.from(el.shadowRoot!.querySelectorAll('option')) as HTMLOptionElement[];
    expect(options.some((o) => o.value === 'Lora, Georgia, serif')).toBe(true);
    expect(options.length).toBeGreaterThan(BRAND.length);
  });

  it('does not duplicate a brand font already in the defaults', async () => {
    const dup: BrandFont[] = [{ id: 'arial', name: 'Arial', family: 'Arial, Helvetica, sans-serif' }];
    const el = await mount('Arial, Helvetica, sans-serif', dup);
    const values = Array.from(el.shadowRoot!.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value);
    expect(values.filter((v) => v === 'Arial, Helvetica, sans-serif')).toHaveLength(1);
  });

  it('emits font-change with the selected family', async () => {
    const el = await mount('Arial, Helvetica, sans-serif', BRAND);
    const events: CustomEvent[] = [];
    el.addEventListener('font-change', (e) => events.push(e as CustomEvent));
    const select = el.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = 'Lora, Georgia, serif';
    select.dispatchEvent(new Event('change'));
    expect(events[0].detail).toEqual({ value: 'Lora, Georgia, serif' });
  });
});
