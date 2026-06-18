import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument, InMemoryRowLibraryStorage } from '@lit-pigeon/core';
import type { PigeonDocument, RowLibraryStorage } from '@lit-pigeon/core';
import '../src/components/palette/pigeon-palette.js';
import type { PigeonPalette } from '../src/components/palette/pigeon-palette.js';

async function mount(doc: PigeonDocument, rowLibrary: RowLibraryStorage) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-palette .doc=${doc} .rowLibrary=${rowLibrary}></pigeon-palette>`, container);
  const el = container.querySelector('pigeon-palette') as PigeonPalette;
  await el.updateComplete;
  return el;
}

describe('pigeon-palette Saved tab', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('always shows the Saved tab', async () => {
    const el = await mount(createDefaultDocument(), new InMemoryRowLibraryStorage());
    expect(el.shadowRoot!.querySelector('#pigeon-tab-saved')).toBeTruthy();
  });

  it('renders pigeon-saved-tab after activating the Saved tab', async () => {
    const el = await mount(createDefaultDocument(), new InMemoryRowLibraryStorage());
    (el.shadowRoot!.querySelector('#pigeon-tab-saved') as HTMLButtonElement).click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 50)); // allow lazy import to resolve
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('pigeon-saved-tab')).toBeTruthy();
  });
});
