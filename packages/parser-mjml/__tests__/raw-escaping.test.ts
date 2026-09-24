import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

function textOf(source: string): string {
  const { document } = mjmlToDocument(source);
  const block = document.body.rows[0].columns[0].blocks[0] as { values: { content: string } };
  return block.values.content;
}

const inText = (inner: string) =>
  `<mjml><mj-body><mj-section><mj-column><mj-text>${inner}</mj-text></mj-column></mj-section></mj-body></mjml>`;

describe('raw content escaping', () => {
  it('keeps escaped markup in text as text', () => {
    expect(textOf(inText('Use &lt;b&gt; for bold &amp; more'))).toBe(
      '<span style="font-size: 13px">Use &lt;b&gt; for bold &amp; more</span>',
    );
  });

  it('keeps double quotes inside attribute values', () => {
    const content = textOf(inText(`<span style='font-family:"Open Sans", Arial'>Hi</span>`));
    expect(content).toBe('<span style="font-size: 13px"><span style="font-family:&quot;Open Sans&quot;, Arial">Hi</span></span>');
  });

  it('keeps ampersands in link hrefs valid', () => {
    expect(textOf(inText('<a href="https://x.test/?a=1&amp;b=2">l</a>'))).toBe(
      '<span style="font-size: 13px"><a href="https://x.test/?a=1&amp;b=2">l</a></span>',
    );
  });

  it('leaves style and script text untouched', () => {
    const { document } = mjmlToDocument(
      `<mjml><mj-body><mj-section><mj-column><mj-raw><style>a > b { color: red; }</style></mj-raw></mj-column></mj-section></mj-body></mjml>`,
    );
    const block = document.body.rows[0].columns[0].blocks[0] as { values: { content: string } };
    expect(block.values.content).toBe('<style>a > b { color: red; }</style>');
  });

  it('renders a quoted font family through the full round trip', () => {
    const { document } = mjmlToDocument(inText(`<span style='font-family:"Open Sans", Arial'>Hi</span>`));
    const html = mjml2html(documentToMjml(document)).html;
    expect(html).toContain('font-family:&quot;Open Sans&quot;, Arial');
  });

  it('does not double-escape plain-text labels', () => {
    const { document } = mjmlToDocument(
      `<mjml><mj-head><mj-preview>Tom &amp; Jerry</mj-preview></mj-head><mj-body><mj-section><mj-column>` +
      `<mj-navbar><mj-navbar-link href="https://x.test/">Rates &amp; quotes</mj-navbar-link></mj-navbar>` +
      `</mj-column></mj-section></mj-body></mjml>`,
    );
    const mjml = documentToMjml(document);
    expect(mjml).toContain('<mj-preview>Tom &amp; Jerry</mj-preview>');
    expect(mjml).toContain('>Rates &amp; quotes</mj-navbar-link>');
  });
});
