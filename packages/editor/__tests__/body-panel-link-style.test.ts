import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { LinkStyle, PigeonDocument } from '@lit-pigeon/core';
import '../src/components/properties/panels/body-panel.js';
import type { PigeonBodyPanel } from '../src/components/properties/panels/body-panel.js';

async function mount(linkStyle?: LinkStyle) {
  const doc: PigeonDocument = createDefaultDocument();
  if (linkStyle) doc.body.attributes.linkStyle = linkStyle;
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-body-panel .doc=${doc}></pigeon-body-panel>`, container);
  const el = container.querySelector('pigeon-body-panel') as PigeonBodyPanel;
  await el.updateComplete;

  const events: CustomEvent[] = [];
  el.addEventListener('body-property-change', (e) => events.push(e as CustomEvent));
  return { el, events };
}

function linkColorPicker(el: PigeonBodyPanel): HTMLElement {
  return [...el.shadowRoot!.querySelectorAll('pigeon-color-picker')].find(
    (p) => p.getAttribute('label') === 'Link Color',
  ) as HTMLElement;
}

function underlineToggle(el: PigeonBodyPanel): HTMLInputElement {
  const row = [...el.shadowRoot!.querySelectorAll('.toggle-row')].find(
    (r) => r.querySelector('.toggle-label')?.textContent?.trim() === 'Underline Links',
  )!;
  return row.querySelector('input[type="checkbox"]') as HTMLInputElement;
}

describe('pigeon-body-panel link styling', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('shows the current link style', async () => {
    const { el } = await mount({ color: '#e8590c', underline: true });
    expect((linkColorPicker(el) as HTMLElement & { value: string }).value).toBe('#e8590c');
    expect(underlineToggle(el).checked).toBe(true);
  });

  it('shows an empty colour and no underline for a document with no link style', async () => {
    const { el } = await mount();
    expect((linkColorPicker(el) as HTMLElement & { value: string }).value).toBe('');
    expect(underlineToggle(el).checked).toBe(false);
  });

  it('emits the colour as a linkStyle attribute', async () => {
    const { el, events } = await mount();
    linkColorPicker(el).dispatchEvent(new CustomEvent('color-change', { detail: { value: '#e8590c' } }));

    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ attribute: 'linkStyle', value: { color: '#e8590c' } });
  });

  it('keeps the colour when the underline toggle changes', async () => {
    const { el, events } = await mount({ color: '#e8590c' });
    const toggle = underlineToggle(el);
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(events[0].detail.value).toEqual({ color: '#e8590c', underline: true });
  });

  it('drops the whole field when the last part is cleared', async () => {
    const { el, events } = await mount({ color: '#e8590c' });
    linkColorPicker(el).dispatchEvent(new CustomEvent('color-change', { detail: { value: '' } }));

    expect(events[0].detail).toEqual({ attribute: 'linkStyle', value: undefined });
  });

  it('keeps the underline when only the colour is cleared', async () => {
    const { el, events } = await mount({ color: '#e8590c', underline: true });
    linkColorPicker(el).dispatchEvent(new CustomEvent('color-change', { detail: { value: '' } }));

    expect(events[0].detail.value).toEqual({ underline: true });
  });
});
