import type { HtmlBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';
import { getAttr } from '../../utils/parse-attributes.js';

// mj-table's defaultAttributes in MJML 4
const TABLE_DEFAULTS: Record<string, string> = {
  align: 'left',
  border: 'none',
  cellpadding: '0',
  cellspacing: '0',
  color: '#000000',
  'font-family': 'Ubuntu, Helvetica, Arial, sans-serif',
  'font-size': '13px',
  'line-height': '22px',
  padding: '10px 25px',
  'table-layout': 'auto',
  width: '100%',
};

/**
 * mj-table has no block of its own, so it becomes an html block holding the
 * same <table> mjml2html renders for it.
 */
export function parseTableBlock(attrs: Record<string, string>, innerHtml: string): HtmlBlock {
  const a = { ...TABLE_DEFAULTS, ...attrs };
  const width = a.width.endsWith('%') || a.width === 'auto' ? a.width : String(parseInt(a.width, 10));
  const cellspacing = parseFloat(a.cellspacing.replace(/[^\d.]/g, ''));

  const style = [
    `color:${a.color}`,
    `font-family:${a['font-family']}`,
    `font-size:${a['font-size']}`,
    `line-height:${a['line-height']}`,
    `table-layout:${a['table-layout']}`,
    `width:${a.width}`,
    `border:${a.border}`,
    ...(cellspacing > 0 ? ['border-collapse:separate'] : []),
  ].map((decl) => `${decl};`).join('');

  const tableAttrs: string[] = [];
  // MJML aligns the table through the column cell; a left-aligned table needs nothing
  if (a.align !== 'left') tableAttrs.push(`align="${escapeAttr(a.align)}"`);
  tableAttrs.push(`cellpadding="${escapeAttr(a.cellpadding)}"`, `cellspacing="${escapeAttr(a.cellspacing)}"`);
  if (attrs.role) tableAttrs.push(`role="${escapeAttr(attrs.role)}"`);
  tableAttrs.push(`width="${escapeAttr(width)}"`, 'border="0"', `style="${escapeAttr(style)}"`);

  return {
    id: generateId(),
    type: 'html',
    values: {
      content: `<table ${tableAttrs.join(' ')}>${innerHtml.trim()}</table>`,
      padding: parseSpacing(getAttr(a, 'padding'), 0),
    },
  };
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
