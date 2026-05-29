import { describe, it, expect } from 'vitest';
import { tableBlock } from '../src/index.js';

const make = (values: Record<string, unknown> = {}) => ({
  id: 'b1',
  type: 'table',
  values: { ...tableBlock.defaultValues, ...values },
});

describe('tableBlock', () => {
  it('wraps real HTML in mj-table on export', () => {
    const mjml = tableBlock.renderMjml!(make());
    expect(mjml).toContain('<mj-table>');
    expect(mjml).toContain('<table');
    expect(mjml).toContain('<th');
    expect(mjml).toContain('<td');
  });

  it('renders header + body cells in pipe order', () => {
    const html = tableBlock.renderCanvas!(make());
    expect(html).toContain('Item');
    expect(html).toContain('Qty');
    expect(html).toContain('Price');
    expect(html).toContain('Coffee');
    expect(html).toContain('Muffin');
  });

  it('emits a comment when both header and body are empty', () => {
    const mjml = tableBlock.renderMjml!(make({ header: '', rows: '' }));
    expect(mjml).toContain('<!--');
  });

  it('works with body rows only (no header)', () => {
    const mjml = tableBlock.renderMjml!(make({ header: '', rows: 'a|b\nc|d' }));
    expect(mjml).toContain('<mj-table>');
    expect(mjml).not.toContain('<thead>');
    expect(mjml).toContain('<tbody>');
  });

  it('escapes cell content to prevent injection', () => {
    const mjml = tableBlock.renderMjml!(make({ rows: '<script>x</script>|safe' }));
    expect(mjml).not.toContain('<script>');
    expect(mjml).toContain('&lt;script&gt;');
  });
});
