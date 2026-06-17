import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import type { EditorConfig } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

describe('pigeon-editor i18n + dir', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('sets dir="ltr" on the host by default', async () => {
    const el = await mount({});
    expect(el.getAttribute('dir')).toBe('ltr');
  });

  it('sets dir="rtl" for an RTL locale', async () => {
    const el = await mount({ locale: 'ar' });
    expect(el.getAttribute('dir')).toBe('rtl');
  });

  it('honors an explicit dir override', async () => {
    const el = await mount({ locale: 'ar', dir: 'ltr' });
    expect(el.getAttribute('dir')).toBe('ltr');
  });
});
