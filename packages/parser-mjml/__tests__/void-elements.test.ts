import { describe, it, expect } from 'vitest';
import { mjmlToDocument } from '../src/index.js';

function firstBlock(inner: string) {
  const { document } = mjmlToDocument(
    `<mjml><mj-body><mj-section><mj-column>${inner}</mj-column></mj-section></mj-body></mjml>`,
  );
  return document.body.rows[0].columns[0].blocks[0];
}

describe('void elements inside raw content', () => {
  it('serialises <br/> in mj-text without a closing tag', () => {
    const block = firstBlock('<mj-text>a<br/>b</mj-text>');
    expect(block.type === 'text' && block.values.content).toBe('<span style="font-size: 13px">a<br>b</span>');
  });

  it('serialises every void element without a closing tag', () => {
    const block = firstBlock(
      '<mj-raw><img src="x.png" alt="x"><hr/><br><input type="text"><wbr></mj-raw>',
    );
    expect(block.type === 'html' && block.values.content).toBe(
      '<img src="x.png" alt="x"><hr><br><input type="text"><wbr>',
    );
  });

  it('keeps the raw tag open after a void element so later content is captured', () => {
    const block = firstBlock('<mj-text><p>one<br/>two</p><p>three</p></mj-text>');
    expect(block.type === 'text' && block.values.content).toBe(
      '<p><span style="font-size: 13px">one<br>two</span></p><p><span style="font-size: 13px">three</span></p>',
    );
  });
});
