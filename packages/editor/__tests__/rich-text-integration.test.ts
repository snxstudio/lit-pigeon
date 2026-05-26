import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, render } from 'lit';
import {
  createDefaultDocument,
  createBlock,
  createRow,
  createColumn,
  type PigeonDocument,
} from '@lit-pigeon/core';
import { _resetForTests } from '../src/rich-text/loader.js';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mountEditor(doc: PigeonDocument): Promise<PigeonEditor> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .document=${doc}></pigeon-editor>`, container);
  const editor = container.querySelector('pigeon-editor') as PigeonEditor;
  await editor.updateComplete;
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  return editor;
}

function makeTextDoc() {
  const doc = createDefaultDocument('Test');
  const block = createBlock('text', { content: '<p>Hello</p>' });
  const row = createRow([createColumn([block])]);
  doc.body.rows = [row];
  return { doc, rowId: row.id, blockId: block.id, columnId: row.columns[0].id };
}

describe('rich-text integration (text-block double-click)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetForTests();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('double-click on a text block enters edit mode (mounts TipTap)', async () => {
    const { doc, blockId } = makeTextDoc();
    const editor = await mountEditor(doc);

    const tb = editor.shadowRoot!
      .querySelector('pigeon-canvas')!.shadowRoot!
      .querySelector('pigeon-row')!.shadowRoot!
      .querySelector('pigeon-column')!.shadowRoot!
      .querySelector('pigeon-text-block') as HTMLElement;

    tb.dispatchEvent(new CustomEvent('block-enter-edit', {
      detail: { blockId },
      bubbles: true,
      composed: true,
    }));
    await editor.updateComplete;
    // Allow the dynamic import to resolve.
    await new Promise((r) => setTimeout(r, 50));

    expect(tb.hasAttribute('editing')).toBe(true);
  });

  it('block-exit-edit commits the new content via a single transaction', async () => {
    const { doc, blockId } = makeTextDoc();
    const editor = await mountEditor(doc);

    const canvas = editor.shadowRoot!.querySelector('pigeon-canvas') as HTMLElement;
    // Enter edit
    canvas.dispatchEvent(new CustomEvent('block-enter-edit', {
      detail: { blockId },
      bubbles: true,
      composed: true,
    }));
    await editor.updateComplete;

    // Exit edit with new HTML
    canvas.dispatchEvent(new CustomEvent('block-exit-edit', {
      detail: { blockId, content: '<p>Hello world</p>' },
      bubbles: true,
      composed: true,
    }));
    await editor.updateComplete;

    expect(editor.getDocument().body.rows[0].columns[0].blocks[0].values).toMatchObject({
      content: '<p>Hello world</p>',
    });
  });

  it('Cmd/Ctrl+Z after exiting edit undoes the whole edit atomically', async () => {
    const { doc, blockId } = makeTextDoc();
    const editor = await mountEditor(doc);

    const canvas = editor.shadowRoot!.querySelector('pigeon-canvas') as HTMLElement;
    canvas.dispatchEvent(new CustomEvent('block-enter-edit', {
      detail: { blockId },
      bubbles: true,
      composed: true,
    }));
    await editor.updateComplete;

    canvas.dispatchEvent(new CustomEvent('block-exit-edit', {
      detail: { blockId, content: '<p>Hello world</p>' },
      bubbles: true,
      composed: true,
    }));
    await editor.updateComplete;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true }));
    await editor.updateComplete;

    expect(editor.getDocument().body.rows[0].columns[0].blocks[0].values).toMatchObject({
      content: '<p>Hello</p>',
    });
  });

  it('Delete keydown is suppressed while editing (TipTap owns keys)', async () => {
    const { doc, blockId } = makeTextDoc();
    const editor = await mountEditor(doc);

    const canvas = editor.shadowRoot!.querySelector('pigeon-canvas') as HTMLElement;
    canvas.dispatchEvent(new CustomEvent('block-enter-edit', {
      detail: { blockId },
      bubbles: true,
      composed: true,
    }));
    await editor.updateComplete;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    await editor.updateComplete;

    // Block must still exist — Delete must NOT have removed it.
    expect(editor.getDocument().body.rows[0].columns[0].blocks).toHaveLength(1);
  });
});
