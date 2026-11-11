import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument, resolveDirection } from '@lit-pigeon/core';
import type { PigeonDocument } from '@lit-pigeon/core';
import '../src/components/properties/panels/body-panel.js';
import type { PigeonBodyPanel } from '../src/components/properties/panels/body-panel.js';

async function mount(doc: PigeonDocument) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-body-panel .doc=${doc}></pigeon-body-panel>`, container);
  const el = container.querySelector('pigeon-body-panel') as PigeonBodyPanel;
  await el.updateComplete;
  return el;
}

function docWith(attrs: Partial<PigeonDocument['body']['attributes']>) {
  const d = createDefaultDocument();
  Object.assign(d.body.attributes, attrs);
  return d;
}

const directionButtons = (el: PigeonBodyPanel) =>
  [...el.shadowRoot!.querySelectorAll('.field')]
    .find((f) => f.querySelector('label')?.textContent?.includes('Text Direction'))!
    .querySelectorAll('button');

const languageInput = (el: PigeonBodyPanel) =>
  [...el.shadowRoot!.querySelectorAll('.field')]
    .find((f) => f.querySelector('label')?.textContent?.trim() === 'Language')!
    .querySelector('input') as HTMLInputElement;

function changed(el: PigeonBodyPanel, run: () => void) {
  let detail: Record<string, unknown> | undefined;
  el.addEventListener('body-property-change', (e) => { detail = (e as CustomEvent).detail; });
  run();
  return detail;
}

describe('pigeon-body-panel language and direction', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('shows the document language', async () => {
    const el = await mount(docWith({ language: 'pt-BR' }));
    expect(languageInput(el).value).toBe('pt-BR');
  });

  it('emits a language change', async () => {
    const el = await mount(docWith({}));
    const input = languageInput(el);
    const detail = changed(el, () => {
      input.value = 'ar';
      input.dispatchEvent(new Event('change'));
    });
    expect(detail).toEqual({ attribute: 'language', value: 'ar' });
  });

  it('clears the language when the field is emptied', async () => {
    const el = await mount(docWith({ language: 'ar' }));
    const input = languageInput(el);
    const detail = changed(el, () => {
      input.value = '  ';
      input.dispatchEvent(new Event('change'));
    });
    expect(detail).toEqual({ attribute: 'language', value: undefined });
  });

  it('marks Auto active while no direction is set', async () => {
    const el = await mount(docWith({ language: 'ar' }));
    const [auto, ltr, rtl] = directionButtons(el);
    expect(auto.classList.contains('active')).toBe(true);
    expect(ltr.classList.contains('active')).toBe(false);
    expect(rtl.classList.contains('active')).toBe(false);
  });

  it('shows the direction the language implies as the Auto hint', async () => {
    const el = await mount(docWith({ language: 'he' }));
    expect(directionButtons(el)[0].title).toBe('Right to left');
    expect(resolveDirection('he')).toBe('rtl');
  });

  it('emits an explicit direction override', async () => {
    const el = await mount(docWith({ language: 'ar' }));
    const detail = changed(el, () => directionButtons(el)[1].click());
    expect(detail).toEqual({ attribute: 'direction', value: 'ltr' });
  });

  it('returns to Auto by emitting undefined', async () => {
    const el = await mount(docWith({ language: 'ar', direction: 'ltr' }));
    const detail = changed(el, () => directionButtons(el)[0].click());
    expect(detail).toEqual({ attribute: 'direction', value: undefined });
  });
});
