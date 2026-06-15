import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import type { BrandKit, BrandLogo, EditorConfig, PigeonDocument } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [], fonts: [], logos: [], createdAt: '', updatedAt: '',
};

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

function fire(el: PigeonEditor, type: string, detail: unknown) {
  el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

describe('pigeon-editor brand apply/insert', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('applies a brand color to body background when nothing is selected', async () => {
    const el = await mount({ brandKit: KIT });
    fire(el, 'brand-color-apply', { value: '#123456' });
    const doc: PigeonDocument = el.getDocument();
    expect(doc.body.attributes.backgroundColor).toBe('#123456');
  });

  it('applies a brand font to the body fontFamily', async () => {
    const el = await mount({ brandKit: KIT });
    fire(el, 'brand-font-apply', { family: 'Lora, serif' });
    expect(el.getDocument().body.attributes.fontFamily).toBe('Lora, serif');
  });

  it('inserts an image block carrying the logo src', async () => {
    const el = await mount({ brandKit: KIT });
    const before = el.getDocument().body.rows.reduce(
      (n, r) => n + r.columns.reduce((m, c) => m + c.blocks.length, 0), 0);
    const logo: BrandLogo = { id: 'l', name: 'Logo', src: 'https://x/logo.png', width: 120 };
    fire(el, 'brand-logo-insert', { logo });
    const doc = el.getDocument();
    const blocks = doc.body.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks));
    expect(blocks.length).toBe(before + 1);
    const img = blocks.find((b) => b.type === 'image') as { values: { src: string; width: number } };
    expect(img.values.src).toBe('https://x/logo.png');
    expect(img.values.width).toBe(120);
  });
});
