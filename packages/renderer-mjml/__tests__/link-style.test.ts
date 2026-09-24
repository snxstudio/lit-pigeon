import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { createBlock, createColumn, createDefaultDocument, createRow } from '@lit-pigeon/core';
import type { LinkStyle, PigeonDocument } from '@lit-pigeon/core';
import { documentToMjml } from '../src/index.js';

function docWithLink(linkStyle?: LinkStyle): PigeonDocument {
  const doc = createDefaultDocument('Links');
  doc.body.rows = [
    createRow([createColumn([createBlock('text', { content: '<p><a href="https://x.test">Track it</a></p>' })])], [12]),
  ];
  if (linkStyle) doc.body.attributes.linkStyle = linkStyle;
  return doc;
}

describe('document link styling', () => {
  it('renders colour and underline as one rule targeting links', () => {
    const mjml = documentToMjml(docWithLink({ color: '#e8590c', underline: true }));
    expect(mjml).toContain('a, a:visited { color: #e8590c; text-decoration: underline; }');
  });

  it('writes text-decoration: none when underline is off', () => {
    const mjml = documentToMjml(docWithLink({ color: '#e8590c', underline: false }));
    expect(mjml).toContain('text-decoration: none;');
  });

  it('writes only the part that is set', () => {
    expect(documentToMjml(docWithLink({ color: '#e8590c' }))).toContain(
      'a, a:visited { color: #e8590c; }',
    );
    expect(documentToMjml(docWithLink({ underline: true }))).toContain(
      'a, a:visited { text-decoration: underline; }',
    );
  });

  it('survives into the compiled HTML, where the link picks the colour up', () => {
    const { html } = mjml2html(documentToMjml(docWithLink({ color: '#e8590c', underline: true })));
    expect(html).toContain('a, a:visited { color: #e8590c; text-decoration: underline; }');
    expect(html).toContain('<a href="https://x.test">Track it</a>');
  });

  it('resets Apple Mail\'s data detectors so they keep the text around them', () => {
    const mjml = documentToMjml(docWithLink({ color: '#e8590c' }));
    expect(mjml).toContain('a[x-apple-data-detectors] { color: inherit !important;');
  });

  it('renders byte-identically to a document with no link style', () => {
    expect(documentToMjml(docWithLink())).toBe(documentToMjml(docWithLink({})));
    expect(documentToMjml(docWithLink())).not.toContain('a, a:visited');
  });

  it('puts the rule before the document CSS, so a hand-written rule still wins', () => {
    const doc = docWithLink({ color: '#e8590c' });
    doc.body.attributes.css = '.promo a { color: #0071e3; }';
    const mjml = documentToMjml(doc);
    expect(mjml.indexOf('a, a:visited')).toBeLessThan(mjml.indexOf('.promo a'));
  });
});
