import { describe, it, expect } from 'vitest';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { cssToLinkStyle, linkStyleToCss } from '@lit-pigeon/core';
import type { LinkStyle } from '@lit-pigeon/core';
import { mjmlToDocument } from '../src/index.js';

function head(style: string): { linkStyle?: LinkStyle; css?: string } {
  const { document } = mjmlToDocument(
    `<mjml><mj-head>${style}</mj-head><mj-body><mj-section><mj-column>
      <mj-text><a href="https://x.test">Track it</a></mj-text>
    </mj-column></mj-section></mj-body></mjml>`,
  );
  return document.body.attributes;
}

function marked(style: LinkStyle): string {
  return `<mj-style>${linkStyleToCss(style)}</mj-style>`;
}

describe('cssToLinkStyle', () => {
  it('reads back whatever linkStyleToCss wrote', () => {
    for (const style of [
      { color: '#e8590c', underline: true },
      { color: '#e8590c', underline: false },
      { color: 'rgb(232, 89, 12)' },
      { underline: true },
    ] as LinkStyle[]) {
      expect(cssToLinkStyle(linkStyleToCss(style)!)).toEqual(style);
    }
  });

  it('leaves CSS it did not write alone', () => {
    expect(cssToLinkStyle('a, a:visited { color: #e8590c; }')).toBeUndefined();
    expect(cssToLinkStyle('.promo a { color: #0071e3; }')).toBeUndefined();
  });

  it('has nothing to write for an empty link style', () => {
    expect(linkStyleToCss({})).toBeUndefined();
  });
});

describe('mj-head link styling', () => {
  it('lifts the generated block into linkStyle rather than into css', () => {
    const attrs = head(marked({ color: '#e8590c', underline: true }));
    expect(attrs.linkStyle).toEqual({ color: '#e8590c', underline: true });
    expect(attrs.css).toBeUndefined();
  });

  it('still collects a hand-written link rule as document CSS', () => {
    const attrs = head('<mj-style>a { color: #0071e3; }</mj-style>');
    expect(attrs.linkStyle).toBeUndefined();
    expect(attrs.css).toBe('a { color: #0071e3; }');
  });

  it('keeps a hand-written block alongside the generated one', () => {
    const attrs = head(`${marked({ color: '#e8590c' })}<mj-style>.promo { padding: 0; }</mj-style>`);
    expect(attrs.linkStyle).toEqual({ color: '#e8590c' });
    expect(attrs.css).toBe('.promo { padding: 0; }');
  });

  it('leaves linkStyle unset when the head says nothing about links', () => {
    expect(head('').linkStyle).toBeUndefined();
  });

  it('is stable across repeated export/import cycles', () => {
    let doc = mjmlToDocument(
      `<mjml><mj-head>${marked({ color: '#e8590c', underline: true })}</mj-head><mj-body><mj-section><mj-column>
        <mj-text><a href="https://x.test">Track it</a></mj-text>
      </mj-column></mj-section></mj-body></mjml>`,
    ).document;

    const first = documentToMjml(doc);
    for (let i = 0; i < 3; i++) {
      doc = mjmlToDocument(documentToMjml(doc)).document;
      // The generated rule must not accumulate as user CSS, which is what
      // would happen if the parser collected it like any other mj-style.
      expect(doc.body.attributes.css).toBeUndefined();
      expect(doc.body.attributes.linkStyle).toEqual({ color: '#e8590c', underline: true });
    }
    expect(documentToMjml(doc)).toBe(first);
  });
});
