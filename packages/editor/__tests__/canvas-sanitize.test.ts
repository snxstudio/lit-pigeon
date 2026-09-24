import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  registerBlock,
  type Renderer,
} from '@lit-pigeon/core';
import { sanitizeCanvasHTML } from '../src/components/blocks/canvas-html.js';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const PAYLOADS = {
  onerror: '<p>Hi <img src="x" onerror="window.__pigeonXss = \'onerror\'"></p>',
  script: '<script>window.__pigeonXss = \'script\'</script><p>Hi</p>',
  javascriptUrl: '<a href="javascript:window.__pigeonXss = \'href\'">Click</a>',
  iframe: '<iframe src="javascript:parent.__pigeonXss = \'iframe\'"></iframe><p>Hi</p>',
  svg: '<svg onload="window.__pigeonXss = \'svg\'"><circle r="1"/></svg>',
};

const DANGEROUS = 'script, iframe, object, embed, form, meta, base, link, svg, [onerror], [onload], [onclick], a[href^="javascript"]';

describe('sanitizeCanvasHTML', () => {
  it('strips event handlers', () => {
    const out = sanitizeCanvasHTML('<img src="a.png" onerror="x()" ONLOAD="y()"><span onclick="z()">t</span>');
    expect(out).toBe('<img src="a.png"><span>t</span>');
  });

  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
  ])('drops the unsafe URL %j', (url) => {
    const out = sanitizeCanvasHTML(`<a href="${url}">x</a><img src="${url}">`);
    expect(out).toBe('<a>x</a><img>');
  });

  it.each(['script', 'iframe', 'object', 'form', 'style', 'svg', 'math', 'noscript', 'template'])(
    'removes <%s> with its content',
    (tag) => {
      const out = sanitizeCanvasHTML(`<p>a</p><${tag}>bad</${tag}><p>b</p>`);
      expect(out).toBe('<p>a</p><p>b</p>');
    },
  );

  it.each(['embed src="x.swf"', 'meta http-equiv="refresh" content="0;url=https://evil.test"', 'base href="https://evil.test/"', 'link rel="stylesheet" href="https://evil.test/x.css"'])(
    'removes <%s>',
    (tag) => {
      expect(sanitizeCanvasHTML(`<p>a</p><${tag}><p>b</p>`)).toBe('<p>a</p><p>b</p>');
    },
  );

  // Browsers let a form's named controls shadow its own properties
  // (`<input name="remove">`); happy-dom does not, so shadow them by hand.
  it.each(['remove', 'localName', 'replaceWith', 'childNodes', 'attributes'])(
    'removes a <form> whose %s is clobbered by a named control',
    (name) => {
      const proto = HTMLFormElement.prototype;
      Object.defineProperty(proto, name, { configurable: true, get: () => document.createElement('input') });
      try {
        const out = sanitizeCanvasHTML(`<p>a</p><form><input name="${name}"><img src="x" onerror="x()"></form><p>b</p>`);
        expect(out).toBe('<p>a</p><p>b</p>');
      } finally {
        delete (proto as unknown as Record<string, unknown>)[name];
      }
    },
  );

  it('unwraps unknown elements but keeps their text', () => {
    expect(sanitizeCanvasHTML('<custom-thing onclick="x()">hello</custom-thing>')).toBe('hello');
  });

  it('keeps email markup: inline styles, tables, spans, links, images, br, hr and comments', () => {
    const input =
      '<!-- keep me --><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
      '<tbody><tr><td align="center" valign="top" bgcolor="#ffeeee" style="padding: 4px;">' +
      '<span style="color: #ff0000; font-weight: bold;">red</span><br>' +
      '<a href="https://example.com/?a=1&amp;b=2" target="_blank" rel="noopener" style="color: #00f;">link</a>' +
      '<a href="mailto:a@b.co">mail</a><a href="{{unsubscribe_url}}">unsub</a>' +
      '<img src="https://example.com/a.png" alt="A" width="10" height="10" style="display: block;">' +
      '<img src="data:image/png;base64,AAAA" alt="">' +
      '<hr><font color="#333" face="Arial">f</font><b>b</b><i>i</i><u>u</u><strong>s</strong><em>e</em>' +
      '</td></tr></tbody></table><h1 class="x" data-merge-tag="first_name">H</h1><ul><li>li</li></ul>';
    expect(sanitizeCanvasHTML(input)).toBe(input);
  });

  it('returns plain text unchanged', () => {
    expect(sanitizeCanvasHTML('Click me')).toBe('Click me');
  });
});

function canvasBlock(editor: PigeonEditor, tag: string) {
  const column = editor.shadowRoot!
    .querySelector('pigeon-canvas')!.shadowRoot!
    .querySelector('pigeon-row')!.shadowRoot!
    .querySelector('pigeon-column')!.shadowRoot!;
  return tag === 'custom' ? (column.querySelector('.custom-block') as HTMLElement) : column.querySelector(tag)!;
}

async function mount(type: string, values: Record<string, unknown>, renderer?: Renderer) {
  const doc = createDefaultDocument('XSS');
  const block = createBlock(type as 'text', values);
  doc.body.rows = [createRow([createColumn([block])])];
  const editor = document.createElement('pigeon-editor') as PigeonEditor;
  editor.document = doc;
  if (renderer) editor.renderer = renderer;
  document.body.appendChild(editor);
  await editor.updateComplete;
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  return editor;
}

const BLOCKS: Array<[string, string]> = [
  ['text', 'pigeon-text-block'],
  ['hero', 'pigeon-hero-block'],
  ['button', 'pigeon-button-block'],
];

describe('canvas rendering of imported HTML', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete (window as { __pigeonXss?: string }).__pigeonXss;
    registerBlock({
      type: 'xss-custom',
      label: 'XSS custom',
      icon: '',
      defaultValues: { content: '' },
      renderCanvas: (b) => (b.values as { content: string }).content,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe.each([...BLOCKS, ['xss-custom', 'custom']])('%s block', (type, tag) => {
    it.each(Object.entries(PAYLOADS))('does not render %s markup', async (_, content) => {
      const editor = await mount(type, { content });
      const el = canvasBlock(editor, tag);
      await (el as { updateComplete?: Promise<unknown> }).updateComplete;
      await new Promise((r) => setTimeout(r, 20));

      const root = (el.shadowRoot ?? el) as ParentNode;
      expect(root.querySelector(DANGEROUS)).toBeNull();
      expect((window as { __pigeonXss?: string }).__pigeonXss).toBeUndefined();

      const stored = editor.getDocument().body.rows[0].columns[0].blocks[0].values as { content: string };
      expect(stored.content).toBe(content);
    });
  });

  it.each(BLOCKS)('%s block still displays imported colours', async (type, tag) => {
    const content = '<p>Hello <span style="color:#FF0000;font-weight:bold">red</span></p>';
    const editor = await mount(type, { content });
    const el = canvasBlock(editor, tag);
    await (el as { updateComplete?: Promise<unknown> }).updateComplete;
    const span = el.shadowRoot!.querySelector('span[style]') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.getAttribute('style')).toBe('color:#FF0000;font-weight:bold');
  });

  it('hands the renderer the unsanitised stored content', async () => {
    const render = vi.fn<Renderer['render']>(async () => ({ html: '', errors: [] }));
    const editor = await mount('text', { content: PAYLOADS.onerror }, { render });
    await editor.exportHtml();
    const doc = render.mock.calls[0][0];
    expect((doc.body.rows[0].columns[0].blocks[0].values as { content: string }).content).toBe(PAYLOADS.onerror);
  });
});
