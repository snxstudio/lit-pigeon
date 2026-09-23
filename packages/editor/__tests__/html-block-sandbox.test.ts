import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDefaultDocument, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const PAYLOADS = {
  onerror: '<img src="x" onerror="window.__pigeonXss = \'onerror\'">',
  script: '<script>window.__pigeonXss = \'script\'</script><p>Hi</p>',
  javascriptUrl: '<a href="javascript:window.__pigeonXss = \'href\'">Click</a>',
};

async function mountHtmlBlock(content: string) {
  const doc = createDefaultDocument('XSS');
  const block = createBlock('html', { content });
  doc.body.rows = [createRow([createColumn([block])])];
  const editor = document.createElement('pigeon-editor') as PigeonEditor;
  editor.document = doc;
  document.body.appendChild(editor);
  await editor.updateComplete;
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  const htmlBlock = editor.shadowRoot!
    .querySelector('pigeon-canvas')!.shadowRoot!
    .querySelector('pigeon-row')!.shadowRoot!
    .querySelector('pigeon-column')!.shadowRoot!
    .querySelector('pigeon-html-block')!;
  await htmlBlock.updateComplete;
  return { editor, htmlBlock };
}

describe('html block canvas rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete (window as { __pigeonXss?: string }).__pigeonXss;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each(Object.entries(PAYLOADS))('does not run %s markup in the editor document', async (_, content) => {
    const { editor, htmlBlock } = await mountHtmlBlock(content);
    await new Promise((r) => setTimeout(r, 20));

    const root = htmlBlock.shadowRoot!;
    expect(root.querySelector('img, script, a, [onerror]')).toBeNull();

    const frame = root.querySelector('iframe')!;
    expect(frame).toBeTruthy();
    expect(frame.hasAttribute('sandbox')).toBe(true);
    expect(frame.getAttribute('sandbox')).not.toContain('allow-scripts');
    expect(frame.srcdoc).toContain(content);

    expect((window as { __pigeonXss?: string }).__pigeonXss).toBeUndefined();

    const stored = editor.getDocument().body.rows[0].columns[0].blocks[0].values as { content: string };
    expect(stored.content).toBe(content);
  });
});
