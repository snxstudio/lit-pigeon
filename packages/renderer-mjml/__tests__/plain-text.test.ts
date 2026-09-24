import { describe, it, expect } from 'vitest';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type ContentBlock,
} from '@lit-pigeon/core';
import { documentToPlainText } from '../src/index.js';

function docWith(...blocks: ContentBlock[]) {
  const doc = createDefaultDocument('Test');
  doc.body.rows = [createRow([createColumn(blocks)])];
  return doc;
}

describe('documentToPlainText', () => {
  it('renders headings and paragraphs as separate paragraphs', () => {
    const text = documentToPlainText(
      docWith(createBlock('text', { content: '<h1>Welcome</h1><p>Hello <strong>there</strong>,<br>friend.</p>' })),
    );
    expect(text).toBe('Welcome\n\nHello there,\nfriend.\n');
  });

  it('renders unordered and ordered lists', () => {
    const text = documentToPlainText(
      docWith(
        createBlock('text', { content: '<ul><li><p>One</p></li><li>Two</li></ul><ol><li>First</li><li>Second</li></ol>' }),
      ),
    );
    expect(text).toBe('- One\n- Two\n\n1. First\n2. Second\n');
  });

  it('renders links as "text (url)"', () => {
    const text = documentToPlainText(
      docWith(createBlock('text', { content: '<p>Read <a href="https://example.com/a?x=1&amp;y=2">the docs</a> now.</p>' })),
    );
    expect(text).toBe('Read the docs (https://example.com/a?x=1&y=2) now.\n');
  });

  it('does not repeat a link whose text is its url, and drops placeholder hrefs', () => {
    const text = documentToPlainText(
      docWith(
        createBlock('text', {
          content: '<p><a href="https://example.com">https://example.com</a> <a href="#">here</a></p>',
        }),
      ),
    );
    expect(text).toBe('https://example.com here\n');
  });

  it('reads href and alt, not attributes that end in those names', () => {
    const text = documentToPlainText(
      docWith(
        createBlock('html', {
          content: '<a data-href="https://other.test" href="https://x.test">Go</a> <img data-alt="no" alt="Logo">',
        }),
      ),
    );
    expect(text).toBe('Go (https://x.test) Logo\n');
  });

  it('renders buttons as "LABEL: url"', () => {
    const text = documentToPlainText(
      docWith(createBlock('button', { content: '<p>Shop now</p>', href: 'https://shop.example.com' })),
    );
    expect(text).toBe('Shop now: https://shop.example.com\n');
  });

  it('renders images as their alt text, with the link when present', () => {
    const text = documentToPlainText(
      docWith(
        createBlock('image', { src: 'a.png', alt: 'Company logo' }),
        createBlock('image', { src: 'b.png', alt: 'Sale banner', href: 'https://example.com/sale' }),
        createBlock('image', { src: 'c.png', alt: '' }),
      ),
    );
    expect(text).toBe('Company logo\n\nSale banner (https://example.com/sale)\n');
  });

  it('renders dividers as a rule and skips spacers', () => {
    const text = documentToPlainText(
      docWith(
        createBlock('text', { content: '<p>Above</p>' }),
        createBlock('spacer'),
        createBlock('divider'),
        createBlock('text', { content: '<p>Below</p>' }),
      ),
    );
    expect(text).toBe('Above\n\n----------\n\nBelow\n');
  });

  it('keeps merge tags verbatim in text, links and buttons', () => {
    const text = documentToPlainText(
      docWith(
        createBlock('text', {
          content: '<p>Hi <span data-merge-tag="first_name">{{first_name}}</span>, see <a href="{{order_url}}">your order</a>.</p>',
        }),
        createBlock('button', { content: '<p>Track {{order_id}}</p>', href: '{{tracking_url}}' }),
      ),
    );
    expect(text).toBe('Hi {{first_name}}, see your order ({{order_url}}).\n\nTrack {{order_id}}: {{tracking_url}}\n');
  });

  it('decodes entities and ignores style and script content', () => {
    const text = documentToPlainText(
      docWith(
        createBlock('html', {
          content: '<style>p{color:red}</style><p>Fish &amp; chips&nbsp;&#8212; &lt;fresh&gt;</p><script>x()</script>',
        }),
      ),
    );
    expect(text).toBe('Fish & chips — <fresh>\n');
  });

  it('keeps the space before a link and leaves unknown or invalid entities alone', () => {
    const text = documentToPlainText(
      docWith(createBlock('text', { content: '<p>Read<a href="https://x.test"> docs</a> &constructor; &#99999999;</p>' })),
    );
    expect(text).toBe('Read docs (https://x.test) &constructor; &#99999999;\n');
  });

  it('drops HTML comments, including ones closed with --!>', () => {
    const text = documentToPlainText(
      docWith(createBlock('html', { content: '<p>A<!-- one -->B<!-- two --!>C</p>' })),
    );
    expect(text).toBe('ABC\n');
  });

  it('stays fast on unterminated comments and tags', () => {
    const started = performance.now();
    documentToPlainText(docWith(createBlock('html', { content: '<!--'.repeat(50_000) })));
    documentToPlainText(docWith(createBlock('html', { content: '<a'.repeat(50_000) })));
    expect(performance.now() - started).toBeLessThan(500);
  });

  it('stays fast on many links, one after another or nested', () => {
    const started = performance.now();
    const text = documentToPlainText(
      docWith(createBlock('html', { content: '<a href="https://x.test">t</a> '.repeat(25_000) })),
    );
    documentToPlainText(
      docWith(createBlock('html', { content: '<a href="https://x.test">t'.repeat(25_000) + '</a>'.repeat(25_000) })),
    );
    expect(performance.now() - started).toBeLessThan(1000);
    expect(text.startsWith('t (https://x.test) t (https://x.test) ')).toBe(true);
  });

  it('renders social icons, navbar links and hero content', () => {
    const text = documentToPlainText(
      docWith(
        createBlock('navbar', {
          links: [
            { href: 'https://example.com', text: 'Home' },
            { href: '#', text: 'About' },
          ],
        }),
        createBlock('hero', { content: '<p>Big news</p>' }),
        createBlock('social', {
          icons: [
            { type: 'facebook', href: 'https://facebook.com/acme' },
            { type: 'custom', href: 'https://acme.blog', label: 'Blog' },
          ],
        }),
      ),
    );
    expect(text).toBe(
      'Home (https://example.com) | About\n\nBig news\n\nFacebook: https://facebook.com/acme\nBlog: https://acme.blog\n',
    );
  });

  it('walks rows and columns in order', () => {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [
      createRow([
        createColumn([createBlock('text', { content: '<p>Left</p>' })]),
        createColumn([createBlock('text', { content: '<p>Right</p>' })]),
      ]),
      createRow([createColumn([createBlock('text', { content: '<p>Footer</p>' })])]),
    ];
    expect(documentToPlainText(doc)).toBe('Left\n\nRight\n\nFooter\n');
  });

  it('wraps a conditional row in the same {{#if}} markers as the HTML', () => {
    const doc = docWith(createBlock('text', { content: '<p>Premium only</p>' }));
    doc.body.rows[0].attributes.condition = 'user.premium';
    expect(documentToPlainText(doc)).toBe('{{#if user.premium}}\nPremium only\n{{/if}}\n');
  });

  it('returns an empty string for an empty document', () => {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [];
    expect(documentToPlainText(doc)).toBe('');
  });
});
