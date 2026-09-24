import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { createDefaultDocument, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import { documentToMjml } from '../src/index.js';

function htmlOf(content: string): string {
  const doc = createDefaultDocument('Test');
  doc.body.attributes.fontFamily = 'Georgia, serif';
  doc.body.rows = [createRow([createColumn([createBlock('html', { content })])])];
  return mjml2html(documentToMjml(doc)).html;
}

describe('html block typography', () => {
  it('restores a readable font size inside the column, which MJML sets to 0px', () => {
    const html = htmlOf('Unstyled text');
    expect(html).toMatch(/font-size:0px/);
    const wrapper = /<div[^>]*style="([^"]*)"[^>]*>Unstyled text<\/div>/.exec(html);
    expect(wrapper).not.toBeNull();
    expect(wrapper![1]).toMatch(/font-size: 14px/);
    expect(wrapper![1]).toMatch(/line-height: 1\.5/);
  });

  it('uses the body font family, which mj-all does not apply to mj-raw', () => {
    const wrapper = /<div[^>]*style="([^"]*)"[^>]*>Unstyled text<\/div>/.exec(htmlOf('Unstyled text'));
    expect(wrapper![1]).toMatch(/font-family: Georgia, serif/);
  });

  it('leaves sizes set inside the content alone', () => {
    expect(htmlOf('<p style="font-size:10px">Small</p>')).toContain('<p style="font-size:10px">Small</p>');
  });
});
