import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import type { BrandKit, FontDefinition, EditorConfig, PigeonDocument } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [],
  fonts: [
    { id: 'lora', name: 'Lora', family: 'Lora, serif', url: 'https://x/lora.css' },
    { id: 'noweb', name: 'NoWeb', family: 'NoWeb, serif' },
  ],
  logos: [], createdAt: '', updatedAt: '',
};
const FONT_CONFIG: FontDefinition[] = [{ name: 'Inter', family: 'Inter, sans-serif', url: 'https://x/inter.css' }];

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

describe('pigeon-editor render-set', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('exportMjml passes fontConfig + brand fonts with a URL (excludes URL-less brand fonts)', async () => {
    const documentToMjml = vi.fn((_doc: PigeonDocument, _opts?: unknown) => '<mjml></mjml>');
    const el = await mount({ brandKit: KIT, fontConfig: FONT_CONFIG });
    el.documentToMjml = documentToMjml as unknown as (doc: PigeonDocument) => string;
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));

    el.exportMjml();
    const passedFonts = (documentToMjml.mock.calls[0][1] as { fonts: FontDefinition[] }).fonts;
    const families = passedFonts.map((f) => f.family);
    expect(families).toContain('Inter, sans-serif'); // fontConfig
    expect(families).toContain('Lora, serif');        // brand font with url
    expect(families).not.toContain('NoWeb, serif');   // brand font without url excluded
  });
});
