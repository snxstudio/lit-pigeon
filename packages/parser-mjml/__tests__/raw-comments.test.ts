import { describe, it, expect } from 'vitest';
import { mjmlToDocument } from '../src/index.js';

function firstBlock(inner: string) {
  const { document } = mjmlToDocument(
    `<mjml><mj-body><mj-section><mj-column>${inner}</mj-column></mj-section></mj-body></mjml>`,
  );
  return document.body.rows[0].columns[0].blocks[0];
}

describe('HTML comments inside raw content', () => {
  it('keeps Outlook conditional comments in mj-raw', () => {
    const raw =
      '<!--[if mso]><table role="presentation"><tr><td><![endif]-->' +
      '<!--[if !mso]><!--><div class="web">Hi</div><!--<![endif]-->' +
      '<!--[if mso]></td></tr></table><![endif]-->';
    const block = firstBlock(`<mj-raw>${raw}</mj-raw>`);
    expect(block.type === 'html' && block.values.content).toBe(raw);
  });

  it('keeps comments in mj-text', () => {
    const block = firstBlock(
      '<mj-text><p>Hello</p><!-- body starts --><!--[if mso]><span>Outlook</span><![endif]--></mj-text>',
    );
    expect(block.type === 'text' && block.values.content).toBe(
      '<p>Hello</p><!-- body starts --><!--[if mso]><span>Outlook</span><![endif]-->',
    );
  });

  it('keeps comments in mj-button', () => {
    const block = firstBlock('<mj-button href="#">Go<!--[if mso]>&nbsp;<![endif]--></mj-button>');
    expect(block.type === 'button' && block.values.content).toBe('<p>Go<!--[if mso]>&nbsp;<![endif]--></p>');
  });
});
