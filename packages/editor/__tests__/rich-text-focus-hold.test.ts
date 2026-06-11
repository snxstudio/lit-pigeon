import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadRichTextEditor, _resetForTests } from '../src/rich-text/loader.js';
import { richTextController } from '../src/rich-text/controller.js';
import '../src/rich-text/ui/bubble.js';
import '../src/rich-text/ui/format-panel.js';
import type { PigeonRichTextBubble } from '../src/rich-text/ui/bubble.js';
import type { PigeonRichTextFormat } from '../src/rich-text/ui/format-panel.js';

describe('rich-text focus retention (formatting controls)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetForTests();
    richTextController.releaseFocus();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    richTextController.releaseFocus();
  });

  it('a held blur keeps the editor active and does not commit', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const mod = await loadRichTextEditor();
    const onBlur = vi.fn();
    const editor = mod.createEditor({ element: host, initialHTML: '<p>Hello</p>', onBlur });

    // Focus is held (user is operating a formatting control): blurring the
    // editable must NOT clear the active binding nor commit content.
    richTextController.holdFocus();
    editor.view.dom.dispatchEvent(new FocusEvent('blur'));
    expect(onBlur).not.toHaveBeenCalled();
    expect(richTextController.getActive()).toBe(editor);

    // A genuine blur (nothing held) commits and clears as before.
    richTextController.releaseFocus();
    editor.view.dom.dispatchEvent(new FocusEvent('blur'));
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(richTextController.getActive()).toBeNull();

    editor.destroy();
    host.remove();
  });

  it('bubble toolbar swallows mousedown so the editable keeps focus', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const mod = await loadRichTextEditor();
    const bubble = document.createElement('pigeon-rich-text-bubble') as PigeonRichTextBubble;
    document.body.appendChild(bubble);
    await bubble.updateComplete;
    const editor = mod.createEditor({ element: host, initialHTML: '<p>Hello world</p>' });
    editor.commands.setTextSelection({ from: 1, to: 6 });
    await new Promise((r) => setTimeout(r, 0));
    await bubble.updateComplete;

    const boldBtn = bubble.shadowRoot!.querySelectorAll('button')[0] as HTMLButtonElement;
    const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    boldBtn.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);

    editor.destroy();
    host.remove();
  });

  it('format-panel pointerdown holds focus across the control interaction', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const mod = await loadRichTextEditor();
    const panel = document.createElement('pigeon-rich-text-format') as PigeonRichTextFormat;
    document.body.appendChild(panel);
    await panel.updateComplete;
    const editor = mod.createEditor({ element: host, initialHTML: '<p>Hello</p>' });
    await new Promise((r) => setTimeout(r, 0));
    await panel.updateComplete;

    expect(richTextController.isHeld()).toBe(false);
    const select = panel.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    // Held synchronously so the editor survives the focus shift to the select.
    expect(richTextController.isHeld()).toBe(true);

    editor.destroy();
    host.remove();
  });

  it('font-size select applies even after the editable was blurred (held)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const mod = await loadRichTextEditor();
    const panel = document.createElement('pigeon-rich-text-format') as PigeonRichTextFormat;
    document.body.appendChild(panel);
    await panel.updateComplete;
    const editor = mod.createEditor({ element: host, initialHTML: '<p>Hello</p>' });
    await new Promise((r) => setTimeout(r, 0));
    await panel.updateComplete;

    const selects = panel.shadowRoot!.querySelectorAll('select');
    const sizeSelect = selects[selects.length - 1] as HTMLSelectElement;
    // Simulate the real gesture: a selection exists, pointerdown holds, the
    // editable blurs, then the user picks an option and `change` fires. (Set
    // the selection immediately before the gesture — happy-dom collapses the
    // editor selection across an `await` since it has no real DOM selection.)
    editor.commands.setTextSelection({ from: 1, to: 6 });
    sizeSelect.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    editor.view.dom.dispatchEvent(new FocusEvent('blur'));
    sizeSelect.value = '24px';
    sizeSelect.dispatchEvent(new Event('change'));

    expect(editor.getHTML()).toMatch(/font-size:\s*24px/);
    editor.destroy();
    host.remove();
  });
});
