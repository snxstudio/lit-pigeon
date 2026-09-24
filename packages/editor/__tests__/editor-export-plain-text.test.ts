import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import type { PigeonDocument } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

describe('pigeon-editor exportPlainText', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('passes the current document to documentToPlainText', async () => {
    const el = await mount();
    const documentToPlainText = vi.fn((_doc: PigeonDocument) => 'Hello\n');
    el.documentToPlainText = documentToPlainText;
    expect(el.exportPlainText()).toBe('Hello\n');
    expect(documentToPlainText).toHaveBeenCalledWith(el.getDocument());
  });

  it('returns null when documentToPlainText is not set', async () => {
    const el = await mount();
    expect(el.exportPlainText()).toBeNull();
  });
});
