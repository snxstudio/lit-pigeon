import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { createBlock } from '@lit-pigeon/core';
import type { TextBlock, MergeTag } from '@lit-pigeon/core';
import '../src/components/properties/panels/text-panel.js';
import type { PigeonTextPanel } from '../src/components/properties/panels/text-panel.js';

const SAMPLE_TAGS: MergeTag[] = [
  { name: '{{firstName}}', label: 'First name', category: 'Recipient' },
  { name: '{{lastName}}', label: 'Last name', category: 'Recipient' },
];

async function mount(
  block: TextBlock,
  mergeTags: MergeTag[] = [],
): Promise<PigeonTextPanel> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-text-panel
      .block=${block}
      rowId="r1"
      columnId="c1"
      .mergeTags=${mergeTags}
    ></pigeon-text-panel>`,
    container,
  );
  const panel = container.querySelector('pigeon-text-panel') as PigeonTextPanel;
  await panel.updateComplete;
  return panel;
}

describe('pigeon-text-panel', () => {
  let block: TextBlock;

  beforeEach(() => {
    document.body.innerHTML = '';
    block = createBlock('text', { content: 'Hello world' }) as TextBlock;
  });

  describe('without merge tags', () => {
    it('does not render the merge-tag trigger button', async () => {
      const panel = await mount(block, []);
      expect(panel.shadowRoot!.querySelector('.tag-btn')).toBeNull();
    });

    it('does not render the merge-tag picker', async () => {
      const panel = await mount(block, []);
      expect(panel.shadowRoot!.querySelector('pigeon-merge-tag-picker')).toBeNull();
    });
  });

  describe('with merge tags', () => {
    it('renders the trigger button and picker', async () => {
      const panel = await mount(block, SAMPLE_TAGS);
      expect(panel.shadowRoot!.querySelector('.tag-btn')).toBeTruthy();
      expect(panel.shadowRoot!.querySelector('pigeon-merge-tag-picker')).toBeTruthy();
    });

    it('inserts the tag name at the cursor position', async () => {
      const panel = await mount(block, SAMPLE_TAGS);
      const events: CustomEvent[] = [];
      panel.addEventListener('property-change', (e) => events.push(e as CustomEvent));

      const textarea = panel.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(6, 6); // cursor between "Hello " and "world"

      const picker = panel.shadowRoot!.querySelector('pigeon-merge-tag-picker') as HTMLElement;
      picker.dispatchEvent(
        new CustomEvent('merge-tag-insert', {
          detail: { tag: SAMPLE_TAGS[0] },
          bubbles: true,
          composed: true,
        }),
      );

      expect(textarea.value).toBe('Hello {{firstName}}world');
      expect(events).toHaveLength(1);
      expect(events[0].detail.values).toEqual({ content: 'Hello {{firstName}}world' });
    });

    it('places the cursor after the inserted tag', async () => {
      const panel = await mount(block, SAMPLE_TAGS);
      const textarea = panel.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(0, 0);

      const picker = panel.shadowRoot!.querySelector('pigeon-merge-tag-picker') as HTMLElement;
      picker.dispatchEvent(
        new CustomEvent('merge-tag-insert', {
          detail: { tag: SAMPLE_TAGS[0] },
          bubbles: true,
          composed: true,
        }),
      );

      expect(textarea.selectionStart).toBe('{{firstName}}'.length);
      expect(textarea.selectionEnd).toBe('{{firstName}}'.length);
    });

    it('replaces a selected range when inserting', async () => {
      block = createBlock('text', { content: 'Hello placeholder world' }) as TextBlock;
      const panel = await mount(block, SAMPLE_TAGS);
      const events: CustomEvent[] = [];
      panel.addEventListener('property-change', (e) => events.push(e as CustomEvent));

      const textarea = panel.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(6, 17); // selects "placeholder"

      const picker = panel.shadowRoot!.querySelector('pigeon-merge-tag-picker') as HTMLElement;
      picker.dispatchEvent(
        new CustomEvent('merge-tag-insert', {
          detail: { tag: SAMPLE_TAGS[1] },
          bubbles: true,
          composed: true,
        }),
      );

      expect(textarea.value).toBe('Hello {{lastName}} world');
      expect(events[0].detail.values).toEqual({ content: 'Hello {{lastName}} world' });
    });
  });
});
