import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import type { BrandColor } from '@lit-pigeon/core';
import '../src/components/properties/controls/color-picker.js';
import type { PigeonColorPicker } from '../src/components/properties/controls/color-picker.js';

const SWATCHES: BrandColor[] = [
  { id: 'brand', name: 'Brand', value: '#4f46e5' },
  { id: 'accent', name: 'Accent', value: '#db2777' },
];

async function mount(swatches: BrandColor[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-color-picker label="Color" value="#000000" .swatches=${swatches}></pigeon-color-picker>`,
    container,
  );
  const el = container.querySelector('pigeon-color-picker') as PigeonColorPicker;
  await el.updateComplete;
  return el;
}

describe('pigeon-color-picker swatches', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('renders one swatch button per brand color', async () => {
    const el = await mount(SWATCHES);
    expect(el.shadowRoot!.querySelectorAll('.swatch').length).toBe(2);
  });

  it('renders no swatch row when swatches is empty', async () => {
    const el = await mount([]);
    expect(el.shadowRoot!.querySelector('.swatches')).toBeNull();
  });

  it('emits color-change with the swatch value when a swatch is clicked', async () => {
    const el = await mount(SWATCHES);
    const events: CustomEvent[] = [];
    el.addEventListener('color-change', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelectorAll('.swatch')[1] as HTMLButtonElement).click();
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ value: '#db2777' });
    expect(el.value).toBe('#db2777');
  });

  it('shows/hides the swatch row reactively when swatches changes', async () => {
    const el = await mount([]);
    expect(el.shadowRoot!.querySelector('.swatches')).toBeNull();
    el.swatches = SWATCHES;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('.swatch').length).toBe(2);
  });
});
