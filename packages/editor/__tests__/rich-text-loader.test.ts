import { describe, it, expect, beforeEach } from 'vitest';
import { loadRichTextEditor, _resetForTests } from '../src/rich-text/loader.js';

describe('rich-text lazy loader', () => {
  beforeEach(() => {
    _resetForTests();
  });

  it('returns a module exposing createEditor', async () => {
    const mod = await loadRichTextEditor();
    expect(typeof mod.createEditor).toBe('function');
  });

  it('memoises the dynamic import — repeat calls share one promise', async () => {
    const first = loadRichTextEditor();
    const second = loadRichTextEditor();
    expect(first).toBe(second);
    await first;
  });
});

describe('rich-text createEditor', () => {
  it('mounts a TipTap editor and returns its initial HTML', async () => {
    const mod = await loadRichTextEditor();
    const host = document.createElement('div');
    document.body.appendChild(host);

    const editor = mod.createEditor({
      element: host,
      initialHTML: '<p>Hello</p>',
    });

    expect(editor.getHTML()).toContain('Hello');
    editor.destroy();
    host.remove();
  });

  it('fires onBlur with the editor HTML when the underlying editor blurs', async () => {
    const mod = await loadRichTextEditor();
    const host = document.createElement('div');
    document.body.appendChild(host);

    let lastBlur = '';
    const editor = mod.createEditor({
      element: host,
      initialHTML: '<p>Bye</p>',
      onBlur: (html) => { lastBlur = html; },
    });

    // TipTap exposes the inner ProseMirror EditorView; trigger its blur event.
    editor.view.dom.dispatchEvent(new FocusEvent('blur'));
    // Wait a tick for TipTap to process.
    await new Promise((r) => setTimeout(r, 0));

    expect(lastBlur).toContain('Bye');
    editor.destroy();
    host.remove();
  });
});
