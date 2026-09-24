import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDefaultDocument, createBlock, createRow, createColumn } from '@lit-pigeon/core';
import { holdRawFragments, RawStore } from '../src/rich-text/raw-html.js';
import { sanitizeHTML } from '../src/rich-text/serialization.js';
import { loadRichTextEditor, _resetForTests } from '../src/rich-text/loader.js';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

/** Hold fragments out, then put them back — the identity the editor relies on. */
function roundTrip(html: string): string {
  const store = new RawStore();
  return sanitizeHTML(holdRawFragments(html, store), store);
}

const MSO = '<!--[if mso]><table><tr><td>Outlook only</td></tr></table><![endif]-->';

const HERO_BUTTON =
  '<div style="text-align: center;">' +
  '<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: separate; line-height: 100%;">' +
  '<tbody><tr><td align="center" bgcolor="#ff6b35" style="border-radius: 3px;">' +
  '<a href="https://example.com" style="display: inline-block; background: #ff6b35; color: #ffffff; padding: 10px 25px;">Click me</a>' +
  '</td></tr></tbody></table></div>';

describe('holding email scaffolding out of the schema', () => {
  it('round-trips an Outlook conditional comment', () => {
    expect(roundTrip(`<p>Hi</p>${MSO}`)).toBe(`<p>Hi</p>${MSO}`);
  });

  it('round-trips a comment inside a paragraph', () => {
    expect(roundTrip('<p>Hi <!-- keep me --> there</p>')).toBe('<p>Hi <!-- keep me --> there</p>');
  });

  it('round-trips a hero button with its table, cell and wrapper styling', () => {
    expect(roundTrip(HERO_BUTTON)).toBe(HERO_BUTTON);
  });

  it('round-trips an image', () => {
    const html = '<p>Logo <img src="https://example.com/a.png" alt="A" width="10"></p>';
    expect(roundTrip(html)).toBe(html);
  });

  it('keeps wrapper attributes other than style', () => {
    const html = '<div class="mob" align="center" data-x="1"><p>Body</p></div>';
    expect(roundTrip(html)).toBe(html);
  });

  it('leaves markup the schema can hold alone', () => {
    const html = '<h2>Title</h2><ul><li><strong>one</strong></li></ul>';
    expect(roundTrip(html)).toBe(html);
  });

  it('does not hold out markup the sanitiser is meant to strip', () => {
    expect(roundTrip('<p>Hi</p><script>alert(1)</script>')).toBe('<p>Hi</p>alert(1)');
  });

  it('ends a held comment where the parser ends it, leaving the rest to the sanitiser', () => {
    const out = roundTrip('<p>Hi</p><!--[if mso]> --> <script>alert(1)</script><![endif]-->');
    expect(out).toContain('<!--[if mso]> -->');
    expect(out).not.toContain('<script');
  });

  it('ignores a forged marker in stored content', () => {
    const store = new RawStore();
    const held = holdRawFragments('<div data-pigeon-raw="r0"></div><p>Hi</p>' + MSO, store);
    // The real conditional still round-trips; the forged marker resolves to nothing.
    const out = sanitizeHTML(held, store);
    expect(out).toBe(`<p>Hi</p>${MSO}`);
  });

  it('drops a marker whose id the store does not know', () => {
    expect(sanitizeHTML('<p>Hi</p><div data-pigeon-raw="r9"></div>', new RawStore())).toBe('<p>Hi</p>');
  });

  it('unwraps a wrapper marker whose id the store does not know', () => {
    expect(sanitizeHTML('<div data-pigeon-wrap="w9"><p>Hi</p></div>', new RawStore())).toBe('<p>Hi</p>');
  });
});

describe('editing a block that contains scaffolding', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetForTests();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function editAndCommit(initialHTML: string, edit: (editor: import('@tiptap/core').Editor) => void | Promise<void>) {
    const mod = await loadRichTextEditor();
    const host = document.createElement('div');
    document.body.appendChild(host);
    let committed = '';
    const editor = mod.createEditor({
      element: host,
      initialHTML,
      onUpdate: (html) => {
        committed = html;
      },
    });
    await edit(editor);
    editor.destroy();
    host.remove();
    return committed;
  }

  it('keeps the Outlook conditional after the user types', async () => {
    const out = await editAndCommit(`<p>Hi</p>${MSO}`, (editor) => {
      editor.chain().focus('start').insertContent('Oh ').run();
    });
    expect(out).toContain('Oh Hi');
    expect(out).toContain(MSO);
  });

  it('keeps the hero button table and wrapper styling after the user types', async () => {
    const out = await editAndCommit(`<p>Headline</p>${HERO_BUTTON}`, (editor) => {
      editor.chain().focus('start').insertContent('New ').run();
    });
    expect(out).toContain('New Headline');
    expect(out).toContain(HERO_BUTTON);
  });

  it.each([
    ['an Outlook conditional', `<p>Hi</p>${MSO}`, MSO],
    ['a hero button', `<p>Headline</p>${HERO_BUTTON}`, HERO_BUTTON.slice(HERO_BUTTON.indexOf('<table'), HERO_BUTTON.indexOf('</div>'))],
  ])('keeps %s that ends the block when the user types at the autofocus position', async (_, html, kept) => {
    const out = await editAndCommit(html, async (editor) => {
      await new Promise((r) => editor.on('create', r));
      editor.commands.insertContent('!');
    });
    expect(out).toContain(kept);
    expect(out).toContain('!');
  });

  it('keeps an inline comment after the user types', async () => {
    const out = await editAndCommit('<p>Hi <!-- keep me --> there</p>', (editor) => {
      editor.chain().focus('end').insertContent('!').run();
    });
    expect(out).toContain('<!-- keep me -->');
    expect(out).toContain('there!');
  });
});

describe('leaving a hero block with Escape', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetForTests();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('commits the edit with the hero button markup intact', async () => {
    const content = `<p>Headline</p>${HERO_BUTTON}`;
    const doc = createDefaultDocument('Hero');
    const block = createBlock('hero', { content });
    doc.body.rows = [createRow([createColumn([block])])];
    const editor = document.createElement('pigeon-editor') as PigeonEditor;
    editor.document = doc;
    document.body.appendChild(editor);
    await editor.updateComplete;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    const heroBlock = editor.shadowRoot!
      .querySelector('pigeon-canvas')!.shadowRoot!
      .querySelector('pigeon-row')!.shadowRoot!
      .querySelector('pigeon-column')!.shadowRoot!
      .querySelector('pigeon-hero-block')!;
    heroBlock.dispatchEvent(
      new CustomEvent('block-enter-edit', { detail: { blockId: block.id }, bubbles: true, composed: true }),
    );
    await editor.updateComplete;
    await vi.waitFor(() => expect(heroBlock.shadowRoot!.querySelector('.pigeon-rich-text')).toBeTruthy(), {
      timeout: 5000,
    });

    const editable = heroBlock.shadowRoot!.querySelector('.pigeon-rich-text') as HTMLElement;
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await editor.updateComplete;

    const stored = editor.getDocument().body.rows[0].columns[0].blocks[0].values as { content: string };
    expect(stored.content).toBe(content);
  });
});
