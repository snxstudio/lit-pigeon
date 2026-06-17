import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { buildLinkExtension } from '../src/rich-text/extensions/link.js';

function makeEditor() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return new Editor({ element: el, extensions: [StarterKit, buildLinkExtension()], content: '<p>hello</p>' });
}

describe('link extension allowed hrefs (real TipTap)', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('keeps a {{…}} template href through setLink', () => {
    const ed = makeEditor();
    ed.chain().focus().selectAll().setLink({ href: '{{unsubscribe_url}}' }).run();
    expect(ed.getHTML()).toContain('href="{{unsubscribe_url}}"');
    ed.destroy();
  });

  it('keeps a tel: href through setLink', () => {
    const ed = makeEditor();
    ed.chain().focus().selectAll().setLink({ href: 'tel:+15551234' }).run();
    expect(ed.getHTML()).toContain('href="tel:+15551234"');
    ed.destroy();
  });
});
