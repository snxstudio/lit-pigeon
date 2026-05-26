import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadRichTextEditor, _resetForTests } from '../src/rich-text/loader.js';
import '../src/rich-text/ui/format-panel.js';
import type { PigeonRichTextFormat } from '../src/rich-text/ui/format-panel.js';

async function mountFormatWithEditor(initialHTML: string) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const mod = await loadRichTextEditor();
  const panel = document.createElement('pigeon-rich-text-format') as PigeonRichTextFormat;
  document.body.appendChild(panel);
  await panel.updateComplete;
  const editor = mod.createEditor({ element: host, initialHTML });
  await new Promise((r) => setTimeout(r, 0));
  await panel.updateComplete;
  return { panel, editor, host };
}

describe('rich-text format panel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetForTests();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('hides its section when no editor is active', async () => {
    const panel = document.createElement('pigeon-rich-text-format') as PigeonRichTextFormat;
    document.body.appendChild(panel);
    await panel.updateComplete;
    const section = panel.shadowRoot!.querySelector('.section') as HTMLElement;
    expect(section.hasAttribute('hidden')).toBe(true);
  });

  it('shows its controls once the controller has an active editor', async () => {
    const { panel, editor, host } = await mountFormatWithEditor('<p>x</p>');
    const section = panel.shadowRoot!.querySelector('.section') as HTMLElement;
    expect(section.hasAttribute('hidden')).toBe(false);
    editor.destroy();
    host.remove();
  });

  it('Heading select sets H2 on the current paragraph', async () => {
    const { panel, editor, host } = await mountFormatWithEditor('<p>Title</p>');
    editor.commands.setTextSelection({ from: 1, to: 6 });
    await panel.updateComplete;

    const select = panel.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    await panel.updateComplete;

    expect(editor.getHTML()).toContain('<h2>');
    editor.destroy();
    host.remove();
  });

  it('Bullet toggle wraps selection in <ul><li>', async () => {
    const { panel, editor, host } = await mountFormatWithEditor('<p>One</p>');
    editor.commands.setTextSelection({ from: 1, to: 4 });
    await panel.updateComplete;

    const bulletBtn = panel.shadowRoot!.querySelectorAll('.toggle-btn')[0] as HTMLButtonElement;
    bulletBtn.click();
    await panel.updateComplete;

    expect(editor.getHTML()).toMatch(/<ul>\s*<li>/);
    editor.destroy();
    host.remove();
  });

  it('Font size select applies a font-size style on a textStyle mark', async () => {
    const { panel, editor, host } = await mountFormatWithEditor('<p>Hello</p>');
    editor.commands.setTextSelection({ from: 1, to: 6 });
    await panel.updateComplete;

    const selects = panel.shadowRoot!.querySelectorAll('select');
    const sizeSelect = selects[selects.length - 1] as HTMLSelectElement;
    sizeSelect.value = '24px';
    sizeSelect.dispatchEvent(new Event('change'));
    await panel.updateComplete;

    expect(editor.getHTML()).toMatch(/<span[^>]*font-size:\s*24px/);
    editor.destroy();
    host.remove();
  });
});
