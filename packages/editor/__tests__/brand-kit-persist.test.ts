import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import type { BrandKit, BrandKitStorage, EditorConfig } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [], fonts: [], logos: [], createdAt: '', updatedAt: '',
};
const NEXT: BrandKit = { ...KIT, colors: [{ id: 'c', name: 'Brand', value: '#000000' }] };

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

function fireEdit(el: PigeonEditor, kit: BrandKit) {
  el.dispatchEvent(new CustomEvent('brand-kit-edit', { detail: { kit }, bubbles: true, composed: true }));
}

describe('pigeon-editor brand-kit persistence', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('saves to storage and emits brand-kit-change on brand-kit-edit', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const storage = {
      list: async () => [KIT], get: async () => KIT, save, delete: async () => {},
    } as BrandKitStorage;
    const el = await mount({ brandKit: storage });
    await new Promise((r) => setTimeout(r, 0));

    const changes: CustomEvent[] = [];
    el.addEventListener('brand-kit-change', (e) => changes.push(e as CustomEvent));
    fireEdit(el, NEXT);
    await new Promise((r) => setTimeout(r, 0));

    expect(save).toHaveBeenCalledWith(NEXT);
    expect(changes[0].detail).toEqual({ brandKit: NEXT });
  });

  it('emits brand-kit-error but keeps the edit when save rejects', async () => {
    const storage = {
      list: async () => [KIT], get: async () => KIT,
      save: async () => { throw new Error('disk full'); }, delete: async () => {},
    } as BrandKitStorage;
    const el = await mount({ brandKit: storage });
    await new Promise((r) => setTimeout(r, 0));

    const errors: CustomEvent[] = [];
    const changes: CustomEvent[] = [];
    el.addEventListener('brand-kit-error', (e) => errors.push(e as CustomEvent));
    el.addEventListener('brand-kit-change', (e) => changes.push(e as CustomEvent));
    fireEdit(el, NEXT);
    await new Promise((r) => setTimeout(r, 0));

    expect(errors[0].detail.operation).toBe('save');
    expect(changes).toHaveLength(1); // optimistic change still emitted
  });

  it('emits brand-kit-change without a storage (plain BrandKit config)', async () => {
    const el = await mount({ brandKit: KIT });
    const changes: CustomEvent[] = [];
    el.addEventListener('brand-kit-change', (e) => changes.push(e as CustomEvent));
    fireEdit(el, NEXT);
    await new Promise((r) => setTimeout(r, 0));
    expect(changes[0].detail).toEqual({ brandKit: NEXT });
  });
});
