import type { BlockDefinition, CustomBlock, RegisteredBlock } from '@lit-pigeon/core';

/** The values a callout block stores. Custom block values are an open record at runtime. */
export interface CalloutValues {
  title: string;
  body: string;
  tone: 'info' | 'warning';
  background: string;
  showIcon: boolean;
  padding: number;
}

export type CalloutBlock = CustomBlock & { type: 'callout'; values: CalloutValues };

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const read = (block: RegisteredBlock) => block.values as unknown as CalloutValues;

export const calloutBlock: BlockDefinition = {
  type: 'callout',
  label: 'Callout',
  // Shown as text in the palette, so keep it short.
  icon: '(!)',
  defaultValues: {
    title: 'Please note',
    body: 'Your order ships within two working days.',
    tone: 'info',
    background: '#eff6ff',
    showIcon: true,
    padding: 16,
  } satisfies CalloutValues,

  // Generates the property panel; edits are written to block.values[key].
  propertySchema: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'body', label: 'Text', type: 'textarea' },
    {
      key: 'tone',
      label: 'Tone',
      type: 'select',
      options: [
        { label: 'Information', value: 'info' },
        { label: 'Warning', value: 'warning' },
      ],
    },
    { key: 'background', label: 'Background', type: 'color' },
    { key: 'showIcon', label: 'Show icon', type: 'checkbox' },
    { key: 'padding', label: 'Padding (px)', type: 'number', min: 0, max: 48, step: 4 },
  ],

  // HTML for the canvas. It is inserted unsanitised, so escape every value.
  renderCanvas: (block) => {
    const v = read(block);
    const icon = v.showIcon ? (v.tone === 'warning' ? '⚠ ' : 'ℹ ') : '';
    return `<div style="background:${escapeHtml(v.background)};padding:${Number(v.padding)}px;font-family:sans-serif">
      <strong>${icon}${escapeHtml(v.title)}</strong><p style="margin:4px 0 0">${escapeHtml(v.body)}</p></div>`;
  },

  // MJML for export. Also inserted as-is, so escape here too.
  renderMjml: (block) => {
    const v = read(block);
    const icon = v.showIcon ? (v.tone === 'warning' ? '⚠ ' : 'ℹ ') : '';
    return `<mj-text container-background-color="${escapeHtml(v.background)}" padding="${Number(v.padding)}px">
      <strong>${icon}${escapeHtml(v.title)}</strong><br>${escapeHtml(v.body)}</mj-text>`;
  },
};
