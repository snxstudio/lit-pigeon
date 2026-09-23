import { describe, it, expect } from 'vitest';
import { mjmlToDocument } from '../src/index.js';

function parseHero(inner: string, head = '') {
  const { document, warnings } = mjmlToDocument(
    `<mjml><mj-head>${head}</mj-head><mj-body><mj-hero background-color="#13315c">${inner}</mj-hero></mj-body></mjml>`,
  );
  const block = document.body.rows[0].columns[0].blocks[0];
  if (block.type !== 'hero') throw new Error(`expected a hero block, got ${block.type}`);
  return { values: block.values, content: block.values.content, warnings };
}

describe('mj-hero content', () => {
  it('keeps each mj-text as its own block with its styling', () => {
    const { content } = parseHero(
      '<mj-text align="center" color="#ffffff" font-size="30px" line-height="38px" font-weight="bold">Peak season</mj-text>' +
        '<mj-text padding="0 20px">Book {{ cutoff_date }}</mj-text>',
    );
    expect(content).toBe(
      '<div style="font-weight:bold;line-height:38px;text-align:center;padding:10px 25px;">' +
        '<span style="color: #ffffff; font-size: 30px">Peak season</span></div>' +
        '<div style="line-height:1;padding:0 20px;"><span style="font-size: 13px">Book {{ cutoff_date }}</span></div>',
    );
  });

  it('applies mj-attributes defaults to hero text', () => {
    const { content } = parseHero(
      '<mj-text>Hi</mj-text><mj-text>There</mj-text>',
      '<mj-attributes><mj-text color="#eeeeee" align="center" /></mj-attributes>',
    );
    expect(content).toBe(
      '<div style="line-height:1;text-align:center;padding:10px 25px;"><span style="color: #eeeeee; font-size: 13px">Hi</span></div>' +
        '<div style="line-height:1;text-align:center;padding:10px 25px;"><span style="color: #eeeeee; font-size: 13px">There</span></div>',
    );
  });

  it('reads a lone mj-text as the hero content, with its padding as the inner padding', () => {
    const { values } = parseHero('<mj-text padding="12px 24px"><p>Only</p></mj-text>');
    expect(values.content).toBe('<div style="line-height:1;"><p><span style="font-size: 13px">Only</span></p></div>');
    expect(values.innerPadding).toEqual({ top: 12, right: 24, bottom: 12, left: 24 });
  });

  it('keeps mj-button as the button MJML renders, with its link and styling', () => {
    const { content } = parseHero(
      '<mj-button href="https://app.example.com/quote?lane=A&amp;b=1" background-color="#ffd166" color="#0b2545" ' +
        'font-size="16px" border-radius="6px" inner-padding="14px 28px">Get a quote</mj-button>',
    );
    expect(content).toBe(
      '<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr>' +
        '<td align="center" style="padding:10px 25px;">' +
        '<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;"><tr>' +
        '<td align="center" bgcolor="#ffd166" role="presentation" valign="middle" ' +
        'style="border:none;border-radius:6px;cursor:auto;mso-padding-alt:14px 28px;background:#ffd166;">' +
        '<a href="https://app.example.com/quote?lane=A&amp;b=1" target="_blank" ' +
        'style="display:inline-block;background:#ffd166;color:#0b2545;font-family:Ubuntu, Helvetica, Arial, sans-serif;' +
        'font-size:16px;font-weight:normal;line-height:120%;margin:0;text-decoration:none;text-transform:none;' +
        'padding:14px 28px;mso-padding-alt:0px;border-radius:6px;">Get a quote</a>' +
        '</td></tr></table></td></tr></table>',
    );
  });

  it('warns about hero children it cannot keep', () => {
    const { warnings } = parseHero('<mj-text>Hi</mj-text><mj-image src="a.png" />');
    expect(warnings).toEqual([{ message: 'Unsupported mj-hero child element: mj-image', tag: 'mj-image' }]);
  });
});
