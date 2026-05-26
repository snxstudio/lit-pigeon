import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadRichTextEditor, _resetForTests } from '../src/rich-text/loader.js';
import { richTextController } from '../src/rich-text/controller.js';
import { sanitizeHTML } from '../src/rich-text/serialization.js';
import '../src/rich-text/ui/bubble.js';
import type { PigeonRichTextBubble } from '../src/rich-text/ui/bubble.js';

async function mountEditorWithBubble(initialHTML: string) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const mod = await loadRichTextEditor();
  const bubble = document.createElement('pigeon-rich-text-bubble') as PigeonRichTextBubble;
  document.body.appendChild(bubble);
  await bubble.updateComplete;
  const editor = mod.createEditor({ element: host, initialHTML });
  // Allow the controller subscription + element registration to settle.
  await new Promise((r) => setTimeout(r, 0));
  await bubble.updateComplete;
  return { bubble, editor, host };
}

describe('rich-text bubble menu', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetForTests();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('attaches to the controller-active editor on connect', async () => {
    const { bubble, editor, host } = await mountEditorWithBubble('<p>Hello world</p>');
    expect(bubble.editor).toBe(editor);
    editor.destroy();
    host.remove();
  });

  it('does not show when the selection is empty', async () => {
    const { bubble, editor, host } = await mountEditorWithBubble('<p>Hello world</p>');
    expect(bubble.hasAttribute('data-visible')).toBe(false);
    editor.destroy();
    host.remove();
  });

  it('shows when there is a non-empty selection', async () => {
    const { bubble, editor, host } = await mountEditorWithBubble('<p>Hello world</p>');
    // Select the word "Hello" (positions 1..6 in a single-paragraph doc).
    editor.commands.setTextSelection({ from: 1, to: 6 });
    await new Promise((r) => setTimeout(r, 0));
    await bubble.updateComplete;
    expect(bubble.hasAttribute('data-visible')).toBe(true);
    editor.destroy();
    host.remove();
  });

  it('toggling Bold via the bubble updates the editor state', async () => {
    const { bubble, editor, host } = await mountEditorWithBubble('<p>Hello world</p>');
    editor.commands.setTextSelection({ from: 1, to: 6 });
    await new Promise((r) => setTimeout(r, 0));
    await bubble.updateComplete;

    const boldBtn = bubble.shadowRoot!.querySelectorAll('button')[0] as HTMLButtonElement;
    expect(boldBtn.textContent).toContain('B');
    boldBtn.click();
    await bubble.updateComplete;

    expect(editor.isActive('bold')).toBe(true);
    editor.destroy();
    host.remove();
  });

  it('applying a link via the popover sets the link mark with the right href', async () => {
    const { bubble, editor, host } = await mountEditorWithBubble('<p>Click here</p>');
    editor.commands.setTextSelection({ from: 1, to: 6 });
    await new Promise((r) => setTimeout(r, 0));
    await bubble.updateComplete;

    // Open the link popover (last toolbar button is the link button)
    const buttons = bubble.shadowRoot!.querySelectorAll('button');
    const linkBtn = buttons[buttons.length - 1] as HTMLButtonElement;
    linkBtn.click();
    await bubble.updateComplete;

    const input = bubble.shadowRoot!.querySelector('input[type=url]') as HTMLInputElement;
    input.value = 'https://example.com/x';
    input.dispatchEvent(new Event('input'));
    await bubble.updateComplete;

    const applyBtn = bubble.shadowRoot!.querySelector('.link-popover .primary') as HTMLButtonElement;
    applyBtn.click();
    await bubble.updateComplete;

    const out = sanitizeHTML(editor.getHTML());
    expect(out).toContain('href="https://example.com/x"');
    expect(out).toContain('target="_blank"');
    editor.destroy();
    host.remove();
  });

  it('rejects unsafe schemes in the link popover (no link mark applied)', async () => {
    const { bubble, editor, host } = await mountEditorWithBubble('<p>Click here</p>');
    editor.commands.setTextSelection({ from: 1, to: 6 });
    await new Promise((r) => setTimeout(r, 0));
    await bubble.updateComplete;

    const buttons = bubble.shadowRoot!.querySelectorAll('button');
    const linkBtn = buttons[buttons.length - 1] as HTMLButtonElement;
    linkBtn.click();
    await bubble.updateComplete;

    const input = bubble.shadowRoot!.querySelector('input[type=url]') as HTMLInputElement;
    input.value = 'javascript:alert(1)';
    input.dispatchEvent(new Event('input'));
    await bubble.updateComplete;

    const applyBtn = bubble.shadowRoot!.querySelector('.link-popover .primary') as HTMLButtonElement;
    applyBtn.click();
    await bubble.updateComplete;

    expect(editor.isActive('link')).toBe(false);
    expect(sanitizeHTML(editor.getHTML())).not.toContain('href');
    editor.destroy();
    host.remove();
  });

  it('hides when the editor is destroyed (controller clears)', async () => {
    const { bubble, editor, host } = await mountEditorWithBubble('<p>Hi</p>');
    editor.destroy();
    await bubble.updateComplete;
    expect(bubble.editor).toBeNull();
    expect(richTextController.getActive()).toBeNull();
    host.remove();
  });
});
