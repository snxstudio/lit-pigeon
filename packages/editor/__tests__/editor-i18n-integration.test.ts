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

describe('editor i18n integration', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('localizes a visible toolbar string from a host catalog', async () => {
    const el = await mount({ locale: 'fr', messages: { fr: { 'toolbar.preview': 'Aperçu' } } });
    await el.updateComplete;
    const toolbar = el.shadowRoot!.querySelector('pigeon-toolbar')!;
    await (toolbar as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(toolbar.shadowRoot!.innerHTML).toContain('Aperçu');
  });

  it('falls back to English chrome with the default config', async () => {
    const el = await mount({});
    const toolbar = el.shadowRoot!.querySelector('pigeon-toolbar')!;
    await (toolbar as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(toolbar.shadowRoot!.innerHTML).toContain('Preview');
  });
});
