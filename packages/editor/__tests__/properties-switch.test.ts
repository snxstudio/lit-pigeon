import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type PigeonDocument,
  type Selection,
  type BlockType,
} from '@lit-pigeon/core';
import '../src/components/properties/pigeon-properties.js';
import type { PigeonProperties } from '../src/components/properties/pigeon-properties.js';

async function mount(
  doc: PigeonDocument,
  selection: Selection | null = null,
): Promise<PigeonProperties> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-properties .doc=${doc} .selection=${selection}></pigeon-properties>`,
    container,
  );
  const el = container.querySelector('pigeon-properties') as PigeonProperties;
  await el.updateComplete;
  return el;
}

function makeDocWithBlock(type: BlockType): {
  doc: PigeonDocument;
  rowId: string;
  columnId: string;
  blockId: string;
} {
  const doc = createDefaultDocument('Test');
  const block = createBlock(type);
  const column = createColumn([block]);
  const row = createRow([column]);
  doc.body.rows = [row];
  return { doc, rowId: row.id, columnId: column.id, blockId: block.id };
}

describe('pigeon-properties switch', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the body panel when nothing is selected', async () => {
    const doc = createDefaultDocument('Test');
    const el = await mount(doc, null);
    expect(el.shadowRoot!.querySelector('pigeon-body-panel')).toBeTruthy();
  });

  it('shows the body panel when selection.type is "body"', async () => {
    const doc = createDefaultDocument('Test');
    const el = await mount(doc, { type: 'body' });
    expect(el.shadowRoot!.querySelector('pigeon-body-panel')).toBeTruthy();
  });

  it('shows the row panel for a row selection', async () => {
    const { doc, rowId } = makeDocWithBlock('text');
    const el = await mount(doc, { type: 'row', rowId });
    expect(el.shadowRoot!.querySelector('pigeon-row-panel')).toBeTruthy();
  });

  const blockCases: Array<{ type: BlockType; tag: string }> = [
    { type: 'text', tag: 'pigeon-text-panel' },
    { type: 'image', tag: 'pigeon-image-panel' },
    { type: 'button', tag: 'pigeon-button-panel' },
    { type: 'divider', tag: 'pigeon-divider-panel' },
    { type: 'spacer', tag: 'pigeon-spacer-panel' },
    { type: 'social', tag: 'pigeon-social-panel' },
    { type: 'html', tag: 'pigeon-html-panel' },
    { type: 'hero', tag: 'pigeon-hero-panel' },
    { type: 'navbar', tag: 'pigeon-navbar-panel' },
  ];

  for (const { type, tag } of blockCases) {
    it(`renders <${tag}> for a "${type}" block selection`, async () => {
      const { doc, rowId, columnId, blockId } = makeDocWithBlock(type);
      const el = await mount(doc, { type: 'block', rowId, columnId, blockId });
      expect(el.shadowRoot!.querySelector(tag)).toBeTruthy();
    });
  }

  it('renders a breadcrumb for a block selection and "Row" jumps to the parent row', async () => {
    const { doc, rowId, columnId, blockId } = makeDocWithBlock('text');
    const el = await mount(doc, { type: 'block', rowId, columnId, blockId });

    const crumbs = el.shadowRoot!.querySelectorAll('.breadcrumb .crumb');
    // Row, Column, and the (current) block label.
    expect(crumbs.length).toBe(3);
    expect(crumbs[0].textContent?.trim()).toBe('Row');
    expect(crumbs[2].textContent?.trim()).toBe('Text');

    let rowSelectId: string | null = null;
    el.addEventListener('row-select', (e) => {
      rowSelectId = (e as CustomEvent<{ rowId: string }>).detail.rowId;
    });
    (crumbs[0] as HTMLButtonElement).click();
    expect(rowSelectId).toBe(rowId);
  });

  it('breadcrumb "Column" emits column-select with the right ids', async () => {
    const { doc, rowId, columnId, blockId } = makeDocWithBlock('text');
    const el = await mount(doc, { type: 'block', rowId, columnId, blockId });

    let detail: { rowId: string; columnId: string } | null = null;
    el.addEventListener('column-select', (e) => {
      detail = (e as CustomEvent<{ rowId: string; columnId: string }>).detail;
    });
    const colCrumb = el.shadowRoot!.querySelectorAll('.breadcrumb .crumb')[1] as HTMLButtonElement;
    expect(colCrumb.textContent?.trim()).toBe('Column');
    colCrumb.click();
    expect(detail).toEqual({ rowId, columnId });
  });

  it('does not render a breadcrumb for a row selection', async () => {
    const { doc, rowId } = makeDocWithBlock('text');
    const el = await mount(doc, { type: 'row', rowId });
    expect(el.shadowRoot!.querySelector('.breadcrumb')).toBeNull();
  });

  it('forwards mergeTags down to the text panel', async () => {
    const { doc, rowId, columnId, blockId } = makeDocWithBlock('text');
    const tags = [{ name: '{{x}}', label: 'X' }];
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(
      html`<pigeon-properties
        .doc=${doc}
        .selection=${{ type: 'block', rowId, columnId, blockId }}
        .mergeTags=${tags}
      ></pigeon-properties>`,
      container,
    );
    const el = container.querySelector('pigeon-properties') as PigeonProperties;
    await el.updateComplete;
    const textPanel = el.shadowRoot!.querySelector('pigeon-text-panel') as HTMLElement & { mergeTags: unknown };
    expect(textPanel.mergeTags).toEqual(tags);
  });
});
