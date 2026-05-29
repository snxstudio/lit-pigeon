import type { BlockDefinition, RegisteredBlock } from '@lit-pigeon/core';
import { esc, escAttr, splitRows } from '../util.js';

interface AccordionItem {
  title: string;
  body: string;
}

interface AccordionValues {
  items: string;
  titleColor: string;
  titleBackground: string;
  iconAlign: 'left' | 'right';
}

/**
 * Parse the textarea-encoded items into structured pairs. The format is one
 * item per line, `Title :: Body`. Empty lines are ignored; lines without `::`
 * are treated as title-only with empty body.
 */
function parseItems(raw: string): AccordionItem[] {
  return splitRows(raw).map((line) => {
    const idx = line.indexOf('::');
    if (idx < 0) return { title: line, body: '' };
    return {
      title: line.slice(0, idx).trim(),
      body: line.slice(idx + 2).trim(),
    };
  });
}

function read(block: RegisteredBlock): AccordionValues {
  const v = block.values as Partial<AccordionValues>;
  return {
    items: v.items ?? '',
    titleColor: v.titleColor ?? '#111827',
    titleBackground: v.titleBackground ?? '#f1f5f9',
    iconAlign: v.iconAlign === 'left' ? 'left' : 'right',
  };
}

/**
 * "Accordion" block. Uses `<mj-accordion>` on export — collapsible in Gmail
 * web, Apple Mail, and modern Outlook; falls back to stacked title+body
 * sections in clients that strip the `<details>` runtime. The canvas
 * preview renders the items expanded so authors see every panel at once.
 */
export const accordionBlock: BlockDefinition = {
  type: 'accordion',
  label: 'Accordion',
  icon: '☰',
  defaultValues: {
    items: 'What time is checkout? :: Checkout is at 11am.\nIs breakfast included? :: Yes, breakfast is served 7–10am.',
    titleColor: '#111827',
    titleBackground: '#f1f5f9',
    iconAlign: 'right',
  } satisfies AccordionValues,
  propertySchema: [
    {
      key: 'items',
      label: 'Items (one per line, `Title :: Body`)',
      type: 'textarea',
      placeholder: 'Question :: Answer\nAnother question :: Another answer',
    },
    { key: 'titleColor', label: 'Title color', type: 'color' },
    { key: 'titleBackground', label: 'Title background', type: 'color' },
    {
      key: 'iconAlign',
      label: 'Icon position',
      type: 'select',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
    },
  ],
  renderCanvas: (b) => {
    const v = read(b);
    const items = parseItems(v.items);
    if (items.length === 0) {
      return `<div style="padding:16px;background:#f1f5f9;color:#475569;border-radius:4px;text-align:center">Add accordion items, one per line: <code>Title :: Body</code></div>`;
    }
    return items
      .map(
        (item) => `<div style="border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;margin-bottom:4px">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:${escAttr(v.titleBackground)};color:${escAttr(v.titleColor)};font-weight:600">
            ${v.iconAlign === 'left' ? '<span style="margin-right:8px">▾</span>' : ''}
            <span style="flex:1">${esc(item.title)}</span>
            ${v.iconAlign === 'right' ? '<span style="margin-left:8px">▾</span>' : ''}
          </div>
          ${item.body ? `<div style="padding:10px 14px;color:#334155;font-size:14px">${esc(item.body)}</div>` : ''}
        </div>`,
      )
      .join('');
  },
  renderMjml: (b) => {
    const v = read(b);
    const items = parseItems(v.items);
    if (items.length === 0) return `<!-- accordion block: no items -->`;
    const inner = items
      .map(
        (item) => `<mj-accordion-element>
            <mj-accordion-title>${esc(item.title)}</mj-accordion-title>
            <mj-accordion-text>${esc(item.body)}</mj-accordion-text>
          </mj-accordion-element>`,
      )
      .join('');
    return `<mj-accordion icon-position="${escAttr(v.iconAlign)}">${inner}</mj-accordion>`;
  },
};

export type { AccordionValues, AccordionItem };
export const __accordion_parse = parseItems;
export const __accordion_read = read;
