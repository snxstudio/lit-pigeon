import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
} from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

function makeDoc() {
  const doc = createDefaultDocument('Reattach');
  const block = createBlock('text', { content: '<p>Original</p>' });
  const row = createRow([createColumn([block])]);
  doc.body.rows = [row];
  return { doc, rowId: row.id, columnId: row.columns[0].id, blockId: block.id };
}

async function settle(editor: PigeonEditor) {
  await editor.updateComplete;
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
}

function contentOf(editor: PigeonEditor) {
  return (editor.getDocument().body.rows[0].columns[0].blocks[0].values as { content: string }).content;
}

describe('<pigeon-editor> re-attach (host moves the element)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps edits and undo history across remove and re-append', async () => {
    const { doc, rowId, columnId, blockId } = makeDoc();
    const editor = document.createElement('pigeon-editor') as PigeonEditor;
    editor.document = doc;
    document.body.appendChild(editor);
    await settle(editor);

    const edit = (content: string) =>
      editor.shadowRoot!.querySelector('pigeon-properties')!.dispatchEvent(
        new CustomEvent('property-change', {
          detail: { rowId, columnId, blockId, values: { content } },
          bubbles: true,
          composed: true,
        }),
      );
    edit('<p>First</p>');
    edit('<p>Second</p>');
    expect(contentOf(editor)).toBe('<p>Second</p>');

    editor.remove();
    const dialog = document.createElement('div');
    document.body.appendChild(dialog);
    dialog.appendChild(editor);
    await settle(editor);

    expect(contentOf(editor)).toBe('<p>Second</p>');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true }));
    await editor.updateComplete;
    expect(contentOf(editor)).toBe('<p>First</p>');

    expect(editor.undo()).toBe(true);
    expect(contentOf(editor)).toBe('<p>Original</p>');
  });
});
