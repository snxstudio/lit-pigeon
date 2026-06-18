import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { InMemoryBrandKitStorage } from '@lit-pigeon/core';
import type { BrandKit, EditorConfig } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [{ id: 'c', name: 'Brand', value: '#4f46e5' }],
  fonts: [], logos: [], createdAt: '', updatedAt: '',
};

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

describe('pigeon-editor brand-kit resolution', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('passes a plain BrandKit straight to the palette', async () => {
    const el = await mount({ brandKit: KIT });
    await el.updateComplete;
    const palette = el.shadowRoot!.querySelector('pigeon-palette') as HTMLElement & { brandKit: BrandKit | null };
    expect(palette.brandKit).toEqual(KIT);
  });

  it('resolves the first kit from a BrandKitStorage', async () => {
    const storage = new InMemoryBrandKitStorage({ seed: [KIT] });
    const el = await mount({ brandKit: storage });
    await new Promise((r) => setTimeout(r, 0)); // async list() resolution
    await el.updateComplete;
    const palette = el.shadowRoot!.querySelector('pigeon-palette') as HTMLElement & { brandKit: BrandKit | null };
    expect(palette.brandKit?.id).toBe('k');
  });

  it('leaves brandKit null when config has none', async () => {
    const el = await mount({});
    const palette = el.shadowRoot!.querySelector('pigeon-palette') as HTMLElement & { brandKit: BrandKit | null };
    expect(palette.brandKit).toBeNull();
  });
});
