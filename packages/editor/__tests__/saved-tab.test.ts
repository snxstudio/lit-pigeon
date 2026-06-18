import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { InMemoryRowLibraryStorage, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import type { LibraryEntry, RowLibraryStorage } from '@lit-pigeon/core';
import '../src/components/palette/pigeon-saved-tab.js';
import type { PigeonSavedTab } from '../src/components/palette/pigeon-saved-tab.js';

function entry(id: string): LibraryEntry {
  return { id, name: id, kind: 'row', node: createRow([createColumn([createBlock('text')])]), createdAt: '', updatedAt: '' };
}

async function mount(storage: RowLibraryStorage) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-saved-tab .storage=${storage}></pigeon-saved-tab>`, container);
  const el = container.querySelector('pigeon-saved-tab') as PigeonSavedTab;
  await el.updateComplete;
  await el.refresh();
  await el.updateComplete;
  return el;
}

describe('pigeon-saved-tab', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('lists saved entries', async () => {
    const store = new InMemoryRowLibraryStorage({ seed: [entry('hero'), entry('cta')] });
    const el = await mount(store);
    expect(el.shadowRoot!.querySelectorAll('[data-entry-id]').length).toBe(2);
  });

  it('emits library-delete when an entry delete is clicked', async () => {
    const store = new InMemoryRowLibraryStorage({ seed: [entry('hero')] });
    const el = await mount(store);
    const events: CustomEvent[] = [];
    el.addEventListener('library-delete', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('[data-entry-id="hero"] .delete') as HTMLButtonElement).click();
    expect(events[0].detail).toEqual({ id: 'hero' });
  });

  it('shows an empty state when there are no entries', async () => {
    const el = await mount(new InMemoryRowLibraryStorage());
    expect(el.shadowRoot!.querySelector('.empty')).toBeTruthy();
  });

  it('emits library-insert on Enter for keyboard users', async () => {
    const store = new InMemoryRowLibraryStorage({ seed: [entry('hero')] });
    const el = await mount(store);
    const events: CustomEvent[] = [];
    el.addEventListener('library-insert', (e) => events.push(e as CustomEvent));
    const chip = el.shadowRoot!.querySelector('[data-entry-id="hero"]') as HTMLElement;
    chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(events.length).toBe(1);
    expect(events[0].detail.node).toBeTruthy();
  });
});
