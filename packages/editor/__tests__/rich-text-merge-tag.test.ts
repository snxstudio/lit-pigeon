import { describe, it, expect, beforeEach } from 'vitest';
import { loadRichTextEditor, _resetForTests } from '../src/rich-text/loader.js';
import { preprocessForEditor } from '../src/rich-text/preprocess.js';
import { sanitizeHTML } from '../src/rich-text/serialization.js';
import { richTextController } from '../src/rich-text/controller.js';

describe('merge-tag preprocess', () => {
  it('wraps {{identifier}} text in a span marker', () => {
    expect(preprocessForEditor('<p>Hi {{firstName}}</p>'))
      .toBe('<p>Hi <span data-merge-tag="firstName">{{firstName}}</span></p>');
  });

  it('leaves non-identifier patterns untouched', () => {
    // dots, brackets, spaces — all skipped
    expect(preprocessForEditor('<p>{{user.name}} {{items[0]}} {{ }}</p>'))
      .toBe('<p>{{user.name}} {{items[0]}} {{ }}</p>');
  });

  it('does not rewrite patterns inside tag attributes', () => {
    expect(preprocessForEditor('<a href="?ref={{foo}}">x</a>'))
      .toBe('<a href="?ref={{foo}}">x</a>');
  });

  it('wraps multiple identifiers in the same string', () => {
    expect(preprocessForEditor('<p>{{a}} and {{b}}</p>'))
      .toBe('<p><span data-merge-tag="a">{{a}}</span> and <span data-merge-tag="b">{{b}}</span></p>');
  });
});

describe('merge-tag sanitizer round-trip', () => {
  it('unwraps span[data-merge-tag] back into plain {{name}} text', () => {
    expect(sanitizeHTML('<p>Hi <span data-merge-tag="firstName">{{firstName}}</span></p>'))
      .toBe('<p>Hi {{firstName}}</p>');
  });

  it('rejects spans whose data-merge-tag fails the identifier regex', () => {
    // A span with `data-merge-tag="user.name"` should not be unwrapped —
    // fall through to normal span serialization (and lose the bad attr).
    const out = sanitizeHTML('<p><span data-merge-tag="user.name">x</span></p>');
    expect(out).not.toContain('user.name');
    expect(out).toContain('x');
  });
});

describe('merge-tag chip — full round-trip via TipTap', () => {
  beforeEach(() => _resetForTests());

  it('parses {{firstName}} on load and serializes back to {{firstName}} after sanitize', async () => {
    const mod = await loadRichTextEditor();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = mod.createEditor({
      element: host,
      initialHTML: '<p>Hi {{firstName}}</p>',
    });

    // After load, the doc should have a mergeTag node.
    const json = editor.getJSON();
    const paragraph = (json.content?.[0] ?? {}) as { content?: Array<{ type: string; attrs?: { name?: string } }> };
    const chipNode = paragraph.content?.find((n) => n.type === 'mergeTag');
    expect(chipNode).toBeDefined();
    expect(chipNode!.attrs?.name).toBe('firstName');

    // And getHTML() → sanitize round-trips back to plain text.
    const out = sanitizeHTML(editor.getHTML());
    expect(out).toBe('<p>Hi {{firstName}}</p>');

    editor.destroy();
    host.remove();
  });

  it('insertContent({ type: "mergeTag", ... }) inserts a chip at the cursor', async () => {
    const mod = await loadRichTextEditor();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = mod.createEditor({
      element: host,
      initialHTML: '<p>Greetings,</p>',
    });
    editor.chain().focus('end').insertContent({ type: 'mergeTag', attrs: { name: 'firstName' } }).run();

    const out = sanitizeHTML(editor.getHTML());
    expect(out).toBe('<p>Greetings,{{firstName}}</p>');

    editor.destroy();
    host.remove();
  });

  it('richTextController.getActive() returns the most recently focused editor', async () => {
    const mod = await loadRichTextEditor();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = mod.createEditor({
      element: host,
      initialHTML: '<p>x</p>',
    });

    expect(richTextController.getActive()).toBe(editor);

    editor.destroy();
    host.remove();
    expect(richTextController.getActive()).toBeNull();
  });
});
