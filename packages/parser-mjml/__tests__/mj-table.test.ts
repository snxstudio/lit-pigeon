import { describe, it, expect } from 'vitest';
import { mjmlToDocument } from '../src/index.js';

function parseColumn(inner: string) {
  const { document, warnings } = mjmlToDocument(
    `<mjml><mj-body><mj-section><mj-column>${inner}</mj-column></mj-section></mj-body></mjml>`,
  );
  return { blocks: document.body.rows[0].columns[0].blocks, warnings };
}

describe('mj-table', () => {
  it('imports as an html block with the table MJML renders, using MJML defaults', () => {
    const { blocks, warnings } = parseColumn(
      '<mj-table><tr><td>Container</td><td>{{ container_no }}</td></tr></mj-table>',
    );
    expect(warnings).toEqual([]);
    expect(blocks).toHaveLength(1);
    const block = blocks[0];
    expect(block.type).toBe('html');
    if (block.type !== 'html') return;
    expect(block.values.content).toBe(
      '<table cellpadding="0" cellspacing="0" width="100%" border="0" ' +
        'style="color:#000000;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:13px;' +
        'line-height:22px;table-layout:auto;width:100%;border:none;">' +
        '<tr><td>Container</td><td>{{ container_no }}</td></tr></table>',
    );
    expect(block.values.padding).toEqual({ top: 10, right: 25, bottom: 10, left: 25 });
  });

  it('carries over the table attributes that are set', () => {
    const { blocks } = parseColumn(
      '<mj-table width="400px" cellpadding="6" cellspacing="2" border="1px solid #d9e2ec" ' +
        'color="#1f2933" font-family="Nunito, Arial" font-size="14px" line-height="20px" ' +
        'align="center" padding="0 10px" role="presentation">' +
        '<tr style="background-color:#0b2545"><th>Charge</th></tr></mj-table>',
    );
    const block = blocks[0];
    expect(block.type).toBe('html');
    if (block.type !== 'html') return;
    expect(block.values.content).toBe(
      '<table align="center" cellpadding="6" cellspacing="2" role="presentation" width="400" border="0" ' +
        'style="color:#1f2933;font-family:Nunito, Arial;font-size:14px;line-height:20px;' +
        'table-layout:auto;width:400px;border:1px solid #d9e2ec;border-collapse:separate;">' +
        '<tr style="background-color:#0b2545"><th>Charge</th></tr></table>',
    );
    expect(block.values.padding).toEqual({ top: 0, right: 10, bottom: 0, left: 10 });
  });
});
