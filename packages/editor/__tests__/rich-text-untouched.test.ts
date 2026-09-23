import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDefaultDocument, createBlock, createRow, createColumn } from '@lit-pigeon/core';
import { _resetForTests } from '../src/rich-text/loader.js';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const IMPORTED =
  '<p style="margin: 0;">Hello <span style="color:#FF0000;font-weight:bold">red</span> <b>world</b></p>';

async function editTextBlock() {
  const doc = createDefaultDocument('Untouched');
  const block = createBlock('text', { content: IMPORTED });
  doc.body.rows = [createRow([createColumn([block])])];
  const editor = document.createElement('pigeon-editor') as PigeonEditor;
  editor.document = doc;
  document.body.appendChild(editor);
  await editor.updateComplete;
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  const textBlock = editor.shadowRoot!
    .querySelector('pigeon-canvas')!.shadowRoot!
    .querySelector('pigeon-row')!.shadowRoot!
    .querySelector('pigeon-column')!.shadowRoot!
    .querySelector('pigeon-text-block')!;
  textBlock.dispatchEvent(
    new CustomEvent('block-enter-edit', { detail: { blockId: block.id }, bubbles: true, composed: true }),
  );
  await editor.updateComplete;
  // The first mount loads the TipTap chunk, which can take over a second under a parallel run.
  await vi.waitFor(() => expect(textBlock.shadowRoot!.querySelector('.pigeon-rich-text')).toBeTruthy(), {
    timeout: 5000,
  });
  const editable = textBlock.shadowRoot!.querySelector('.pigeon-rich-text') as HTMLElement;
  return { editor, editable };
}

function storedContent(editor: PigeonEditor) {
  return (editor.getDocument().body.rows[0].columns[0].blocks[0].values as { content: string }).content;
}

describe('leaving inline edit without typing', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetForTests();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps the imported HTML byte for byte on blur', async () => {
    const { editor, editable } = await editTextBlock();
    editable.dispatchEvent(new FocusEvent('blur'));
    await editor.updateComplete;
    expect(storedContent(editor)).toBe(IMPORTED);
    expect(editor.undo()).toBe(false);
  });

  it('keeps the imported HTML byte for byte on Escape', async () => {
    const { editor, editable } = await editTextBlock();
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await editor.updateComplete;
    expect(storedContent(editor)).toBe(IMPORTED);
    expect(editor.undo()).toBe(false);
  });
});
