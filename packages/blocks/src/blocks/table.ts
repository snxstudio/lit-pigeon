import type { BlockDefinition, RegisteredBlock } from '@lit-pigeon/core';
import { esc, escAttr, splitRows } from '../util.js';

interface TableValues {
  header: string;
  rows: string;
  borderColor: string;
  headerBackground: string;
  headerColor: string;
  cellPadding: number;
  align: 'left' | 'center' | 'right';
}

function parseRow(line: string): string[] {
  return line.split('|').map((cell) => cell.trim());
}

function read(block: RegisteredBlock): TableValues {
  const v = block.values as Partial<TableValues>;
  return {
    header: v.header ?? '',
    rows: v.rows ?? '',
    borderColor: v.borderColor ?? '#e2e8f0',
    headerBackground: v.headerBackground ?? '#f8fafc',
    headerColor: v.headerColor ?? '#0f172a',
    cellPadding: typeof v.cellPadding === 'number' ? v.cellPadding : 8,
    align: v.align === 'center' || v.align === 'right' ? v.align : 'left',
  };
}

function buildTable(values: TableValues): string | null {
  const headerCells = values.header ? parseRow(values.header) : [];
  const bodyRows = splitRows(values.rows).map(parseRow);
  if (headerCells.length === 0 && bodyRows.length === 0) return null;

  const borderStyle = `1px solid ${escAttr(values.borderColor)}`;
  const cellStyle = `padding:${values.cellPadding}px;border:${borderStyle};text-align:${escAttr(values.align)};font-size:14px;vertical-align:top`;
  const headerCellStyle = `${cellStyle};background:${escAttr(values.headerBackground)};color:${escAttr(values.headerColor)};font-weight:600`;

  const headerHtml =
    headerCells.length > 0
      ? `<thead><tr>${headerCells.map((c) => `<th style="${headerCellStyle}">${esc(c)}</th>`).join('')}</tr></thead>`
      : '';
  const bodyHtml =
    bodyRows.length > 0
      ? `<tbody>${bodyRows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td style="${cellStyle}">${esc(cell)}</td>`).join('')}</tr>`,
          )
          .join('')}</tbody>`
      : '';
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%">${headerHtml}${bodyHtml}</table>`;
}

/**
 * "Table" block. Renders a real HTML table inside `<mj-table>`. Perfect for
 * receipts, invoices, and structured data — works across every major email
 * client because tables are the most-supported layout primitive in email.
 *
 * Authoring format: pipe-separated cells, one row per line. The optional
 * "Header" field becomes a styled `<thead>`.
 */
export const tableBlock: BlockDefinition = {
  type: 'table',
  label: 'Table',
  icon: '⊞',
  defaultValues: {
    header: 'Item | Qty | Price',
    rows: 'Coffee | 2 | $8.00\nMuffin | 1 | $4.50',
    borderColor: '#e2e8f0',
    headerBackground: '#f8fafc',
    headerColor: '#0f172a',
    cellPadding: 8,
    align: 'left',
  } satisfies TableValues,
  propertySchema: [
    {
      key: 'header',
      label: 'Header row (pipe-separated)',
      type: 'text',
      placeholder: 'Item | Qty | Price',
    },
    {
      key: 'rows',
      label: 'Body rows (one per line, pipe-separated)',
      type: 'textarea',
      placeholder: 'Coffee | 2 | $8.00\nMuffin | 1 | $4.50',
    },
    { key: 'borderColor', label: 'Border color', type: 'color' },
    { key: 'headerBackground', label: 'Header background', type: 'color' },
    { key: 'headerColor', label: 'Header text', type: 'color' },
    { key: 'cellPadding', label: 'Cell padding (px)', type: 'number', min: 0, max: 32 },
    {
      key: 'align',
      label: 'Cell alignment',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
  ],
  renderCanvas: (b) => {
    const html = buildTable(read(b));
    return (
      html ??
      `<div style="padding:16px;background:#f1f5f9;color:#475569;border-radius:4px;text-align:center">Set a header and/or body rows (pipe-separated cells)</div>`
    );
  },
  renderMjml: (b) => {
    const html = buildTable(read(b));
    if (!html) return `<!-- table block: no rows -->`;
    return `<mj-table>${html}</mj-table>`;
  },
};

export type { TableValues };
export const __table_build = buildTable;
export const __table_read = read;
