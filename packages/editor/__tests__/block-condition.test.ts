import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type BlockType,
} from '@lit-pigeon/core';
import '../src/components/properties/pigeon-properties.js';
import type { PigeonProperties } from '../src/components/properties/pigeon-properties.js';

async function mountWithBlock(type: BlockType, condition?: string) {
  const doc = createDefaultDocument('Test');
  const block = createBlock(type, condition ? { condition } : {});
  const column = createColumn([block]);
  const row = createRow([column]);
  doc.body.rows = [row];
  const selection = { type: 'block' as const, rowId: row.id, columnId: column.id, blockId: block.id };

  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-properties .doc=${doc} .selection=${selection}></pigeon-properties>`, container);
  const el = container.querySelector('pigeon-properties') as PigeonProperties;
  await el.updateComplete;
  const field = el.shadowRoot!.querySelector('pigeon-block-condition')!;
  await (field as unknown as { updateComplete: Promise<void> }).updateComplete;
  const input = field?.shadowRoot?.querySelector('input') as HTMLInputElement | null;
  return { el, input, ids: { rowId: row.id, columnId: column.id, blockId: block.id } };
}

describe('block display condition field', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it.each(['text', 'image', 'button', 'divider', 'spacer'] as BlockType[])(
    'is shown for %s blocks with the current condition',
    async (type) => {
      const { input } = await mountWithBlock(type, 'user.vip');
      expect(input).toBeTruthy();
      expect(input!.value).toBe('user.vip');
    },
  );

  it('emits a property-change with the trimmed condition', async () => {
    const { el, input, ids } = await mountWithBlock('text');
    const events: CustomEvent[] = [];
    el.addEventListener('property-change', (e) => events.push(e as CustomEvent));

    input!.value = '  cart.items  ';
    input!.dispatchEvent(new Event('change'));

    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ ...ids, values: { condition: 'cart.items' } });
  });

  it('clears the condition to undefined when emptied', async () => {
    const { el, input } = await mountWithBlock('button', 'user.vip');
    const events: CustomEvent[] = [];
    el.addEventListener('property-change', (e) => events.push(e as CustomEvent));

    input!.value = '   ';
    input!.dispatchEvent(new Event('change'));

    expect(events[0].detail.values).toEqual({ condition: undefined });
  });
});
