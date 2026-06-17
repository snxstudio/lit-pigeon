import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import { SYSTEM_LINK_TYPES } from '@lit-pigeon/core';
import '../src/components/properties/controls/pigeon-link-type-picker.js';
import type { PigeonLinkTypePicker } from '../src/components/properties/controls/pigeon-link-type-picker.js';

async function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-link-type-picker .linkTypes=${SYSTEM_LINK_TYPES}></pigeon-link-type-picker>`, container);
  const el = container.querySelector('pigeon-link-type-picker') as PigeonLinkTypePicker;
  await el.updateComplete;
  return el;
}
function select(el: PigeonLinkTypePicker, id: string) {
  const sel = el.shadowRoot!.querySelector('select') as HTMLSelectElement;
  sel.value = id;
  sel.dispatchEvent(new Event('change'));
}

describe('pigeon-link-type-picker', () => {
  afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

  it('emits link-type-select with the template href for a system link', async () => {
    const el = await mount();
    const events: CustomEvent[] = [];
    el.addEventListener('link-type-select', (e) => events.push(e as CustomEvent));
    select(el, 'unsubscribe');
    expect(events[0].detail).toEqual({ href: '{{unsubscribe_url}}' });
  });

  it('builds mailto: from an email prompt', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('a@b.com');
    const el = await mount();
    const events: CustomEvent[] = [];
    el.addEventListener('link-type-select', (e) => events.push(e as CustomEvent));
    select(el, 'email');
    expect(events[0].detail).toEqual({ href: 'mailto:a@b.com' });
  });

  it('builds tel: from a phone prompt', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('+15551234');
    const el = await mount();
    const events: CustomEvent[] = [];
    el.addEventListener('link-type-select', (e) => events.push(e as CustomEvent));
    select(el, 'phone');
    expect(events[0].detail).toEqual({ href: 'tel:+15551234' });
  });

  it('does not emit when the prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    const el = await mount();
    const events: CustomEvent[] = [];
    el.addEventListener('link-type-select', (e) => events.push(e as CustomEvent));
    select(el, 'email');
    expect(events).toHaveLength(0);
  });
});
