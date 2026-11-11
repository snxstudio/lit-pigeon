import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, render } from 'lit';
import { setAvailableBlockTypes, type EditorConfig } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mountEditor(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  const palette = el.shadowRoot!.querySelector('pigeon-palette') as HTMLElement & {
    updateComplete: Promise<unknown>;
  };
  await palette.updateComplete;
  return palette;
}

function paletteTypes(palette: HTMLElement) {
  return [...palette.shadowRoot!.querySelectorAll('pigeon-palette-item[drag-type="palette-block"]')]
    .map((item) => item.getAttribute('block-type'));
}

describe('EditorConfig.blocks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => setAvailableBlockTypes(undefined));

  it('shows every block when the host sets none', async () => {
    const types = paletteTypes(await mountEditor({}));

    expect(types).toContain('text');
    expect(types).toContain('html');
    expect(types.length).toBeGreaterThanOrEqual(7);
  });

  it('shows only the host’s blocks, in the order given', async () => {
    const types = paletteTypes(await mountEditor({ blocks: ['button', 'text'] }));

    expect(types).toEqual(['button', 'text']);
  });

  it('leaves the registry unrestricted for the next editor', async () => {
    // The availability list is module-global, so an editor that sets one must
    // not leak it into an editor mounted afterwards with no list of its own.
    await mountEditor({ blocks: ['text'] });
    document.body.innerHTML = '';
    const types = paletteTypes(await mountEditor({}));

    expect(types).toContain('html');
  });
});
