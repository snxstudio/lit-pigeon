import { describe, it, expect, afterEach } from 'vitest';
import type { ContentBlock, PropertyField } from '@lit-pigeon/core';
import '../src/components/properties/panels/custom-panel.js';
import type { PigeonCustomPanel } from '../src/components/properties/panels/custom-panel.js';

const SCHEMA: PropertyField[] = [
  { key: 'text', label: 'Quote text', type: 'textarea' },
  { key: 'size', label: 'Size', type: 'number', min: 8, max: 72 },
  { key: 'accent', label: 'Accent', type: 'color' },
  { key: 'boxed', label: 'Boxed', type: 'checkbox' },
  {
    key: 'align',
    label: 'Align',
    type: 'select',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
  },
];

function makeBlock(): ContentBlock {
  return {
    id: 'b1',
    type: 'quote',
    values: { text: 'Hello', size: 16, accent: '#ff0000', boxed: false, align: 'left' },
  } as unknown as ContentBlock;
}

async function mount(): Promise<PigeonCustomPanel> {
  const el = document.createElement('pigeon-custom-panel') as PigeonCustomPanel;
  el.block = makeBlock();
  el.rowId = 'r1';
  el.columnId = 'c1';
  el.label = 'Quote';
  el.schema = SCHEMA;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('pigeon-custom-panel (registry property form)', () => {
  it('renders a control per schema field with the block label', async () => {
    const el = await mount();
    expect(el.renderRoot.querySelector('h3')?.textContent).toBe('Quote');
    expect(el.renderRoot.querySelector('textarea')).not.toBeNull();
    expect(el.renderRoot.querySelector('input[type="number"]')).not.toBeNull();
    expect(el.renderRoot.querySelector('pigeon-color-picker')).not.toBeNull();
    expect(el.renderRoot.querySelector('input[type="checkbox"]')).not.toBeNull();
    expect(el.renderRoot.querySelector('select')).not.toBeNull();
  });

  it('emits property-change with the edited key on text input', async () => {
    const el = await mount();
    let detail: { rowId: string; columnId: string; blockId: string; values: Record<string, unknown> } | null = null;
    el.addEventListener('property-change', (e) => {
      detail = (e as CustomEvent).detail;
    });

    const textarea = el.renderRoot.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Updated quote';
    textarea.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    expect(detail).not.toBeNull();
    expect(detail!.rowId).toBe('r1');
    expect(detail!.columnId).toBe('c1');
    expect(detail!.blockId).toBe('b1');
    expect(detail!.values).toEqual({ text: 'Updated quote' });
  });

  it('coerces number fields to a number', async () => {
    const el = await mount();
    let value: unknown;
    el.addEventListener('property-change', (e) => {
      value = (e as CustomEvent).detail.values.size;
    });
    const num = el.renderRoot.querySelector('input[type="number"]') as HTMLInputElement;
    num.value = '32';
    num.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    expect(value).toBe(32);
    expect(typeof value).toBe('number');
  });

  it('emits a boolean for checkbox fields', async () => {
    const el = await mount();
    let value: unknown;
    el.addEventListener('property-change', (e) => {
      value = (e as CustomEvent).detail.values.boxed;
    });
    const cb = el.renderRoot.querySelector('input[type="checkbox"]') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    expect(value).toBe(true);
  });
});
