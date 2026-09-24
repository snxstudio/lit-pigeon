import { describe, it, expect, afterEach, vi } from 'vitest';
import { createDefaultDocument, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

describe('html block frame sizing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('does not throw when the frame is detached before the resize observer fires', async () => {
    let fire = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          fire = () => cb([], this as unknown as ResizeObserver);
        }
        observe() {}
        disconnect() {}
      },
    );

    const doc = createDefaultDocument('Resize');
    doc.body.rows = [createRow([createColumn([createBlock('html', { content: '<p>Hi</p>' })])])];
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

    const frame = htmlBlock.shadowRoot!.querySelector('iframe')!;
    frame.dispatchEvent(new Event('load'));
    frame.remove();

    expect(frame.contentDocument).toBeNull();
    expect(() => fire()).not.toThrow();
  });
});
