import { afterEach, describe, expect, it } from 'vitest';
import '@lit-pigeon/editor';
import type { PigeonEditor } from '@lit-pigeon/editor';
import { InMemoryAssetStorage, createDefaultDocument } from '@lit-pigeon/core';
import { createEditorConfig } from '../src/configuration/full-config.js';

async function mount(setup: (el: PigeonEditor) => void): Promise<PigeonEditor> {
  const el = document.createElement('pigeon-editor') as PigeonEditor;
  setup(el);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('configuration', () => {
  it('accepts every EditorConfig field', async () => {
    const el = await mount((e) => (e.config = createEditorConfig(() => 't', new InMemoryAssetStorage())));
    expect(el.getDocument().metadata.name).toBe('New campaign');
    expect(el.getAttribute('dir')).toBe('ltr');
    const toolbar = el.shadowRoot!.querySelector('pigeon-toolbar') as HTMLElement & { updateComplete: Promise<unknown> };
    await toolbar.updateComplete;
    expect(toolbar.shadowRoot!.innerHTML).toContain('Aperçu');
  });

  it('prefers the document property over config.doc', async () => {
    const el = await mount((e) => {
      e.document = createDefaultDocument('From property');
      e.config = { doc: createDefaultDocument('From config') };
    });
    expect(el.getDocument().metadata.name).toBe('From property');
  });

  it('derives dir from the locale when dir is not set', async () => {
    const el = await mount((e) => (e.config = { locale: 'ar' }));
    expect(el.getAttribute('dir')).toBe('rtl');
  });

  it('ignores config.doc after the editor has connected', async () => {
    const el = await mount(() => {});
    el.config = { doc: createDefaultDocument('Too late') };
    await el.updateComplete;
    expect(el.getDocument().metadata.name).toBe('Untitled');
  });

  it('applies plugins from the first config, or on the next loadDocument', async () => {
    let early = 0;
    let late = 0;
    const el = await mount((e) => (e.config = { plugins: [{ name: 'early', init: () => ++early }] }));
    el.config = { plugins: [{ name: 'late', init: () => ++late }] };
    await el.updateComplete;
    expect([early, late]).toEqual([1, 0]);
    el.loadDocument(createDefaultDocument());
    expect(late).toBe(1);
  });
});
