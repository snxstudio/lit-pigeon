import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type PigeonDocument,
} from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

type Updatable = HTMLElement & { updateComplete: Promise<unknown> };

function makeDoc() {
  const hiddenBlock = createBlock('text', { content: '<p>Mobile only</p>', hideOnDesktop: true });
  const plainBlock = createBlock('text', { content: '<p>Everywhere</p>' });
  const hiddenColumn = createColumn([createBlock('text')]);
  hiddenColumn.attributes.hideOnMobile = true;
  const row = createRow([createColumn([hiddenBlock, plainBlock]), hiddenColumn]);
  const doc = createDefaultDocument('Vis');
  doc.body.rows = [row];
  return { doc, row, hiddenBlock, plainBlock, hiddenColumn };
}

async function mount(doc: PigeonDocument) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .document=${doc}></pigeon-editor>`, container);
  const editor = container.querySelector('pigeon-editor') as PigeonEditor;
  await editor.updateComplete;
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  return editor;
}

const $ = (editor: PigeonEditor, sel: string) => editor.shadowRoot!.querySelector(sel) as Updatable;
const rowEl = (editor: PigeonEditor) => $(editor, 'pigeon-canvas').shadowRoot!.querySelector('pigeon-row') as Updatable;

async function settle(editor: PigeonEditor) {
  await editor.updateComplete;
  await $(editor, 'pigeon-canvas').updateComplete;
  const row = rowEl(editor);
  await row.updateComplete;
  for (const col of Array.from(row.shadowRoot!.querySelectorAll('pigeon-column')) as Updatable[]) await col.updateComplete;
  await $(editor, 'pigeon-properties').updateComplete;
}

function setDevice(editor: PigeonEditor, device: string) {
  $(editor, 'pigeon-toolbar').dispatchEvent(new CustomEvent('toolbar-device', { detail: { device }, bubbles: true, composed: true }));
}

function blockWrappers(editor: PigeonEditor) {
  const col = rowEl(editor).shadowRoot!.querySelector('pigeon-column')!;
  return Array.from(col.shadowRoot!.querySelectorAll('.block-wrapper')) as HTMLElement[];
}

function columnWrappers(editor: PigeonEditor) {
  return Array.from(rowEl(editor).shadowRoot!.querySelectorAll('.column-wrapper')) as HTMLElement[];
}

function toggle(editor: PigeonEditor, label: string) {
  const input = Array.from($(editor, 'pigeon-properties').shadowRoot!.querySelectorAll('.visibility label'))
    .find((l) => l.textContent!.includes(label))!
    .querySelector('input') as HTMLInputElement;
  input.checked = !input.checked;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return input;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('device visibility in the canvas', () => {
  it('badges hidden blocks and columns', async () => {
    const editor = await mount(makeDoc().doc);
    await settle(editor);
    const [hidden, plain] = blockWrappers(editor);
    expect(hidden.querySelector('.visibility-badge')!.textContent).toContain('Hidden on desktop');
    expect(plain.querySelector('.visibility-badge')).toBeNull();
    expect(columnWrappers(editor)[1].querySelector('.visibility-badge')!.textContent).toContain('Hidden on mobile');
  });

  it('hides elements in the matching device preview only', async () => {
    const editor = await mount(makeDoc().doc);
    await settle(editor);
    const isHidden = (el: HTMLElement) => el.classList.contains('device-hidden');

    expect(isHidden(blockWrappers(editor)[0])).toBe(true);
    expect(isHidden(blockWrappers(editor)[1])).toBe(false);
    expect(isHidden(columnWrappers(editor)[1])).toBe(false);

    setDevice(editor, 'mobile');
    await settle(editor);
    expect(isHidden(blockWrappers(editor)[0])).toBe(false);
    expect(isHidden(columnWrappers(editor)[1])).toBe(true);

    setDevice(editor, 'tablet');
    await settle(editor);
    expect(isHidden(blockWrappers(editor)[0])).toBe(true);
    expect(isHidden(columnWrappers(editor)[1])).toBe(false);
  });
});

describe('device visibility in the properties panel', () => {
  it('toggles a block flag through an undoable edit', async () => {
    const { doc, plainBlock } = makeDoc();
    const editor = await mount(doc);
    $(editor, 'pigeon-canvas').dispatchEvent(new CustomEvent('block-select', { detail: { blockId: plainBlock.id }, bubbles: true, composed: true }));
    await settle(editor);

    expect(toggle(editor, 'Hide on mobile').checked).toBe(true);
    const block = () => editor.getDocument().body.rows[0].columns[0].blocks[1].values as { hideOnMobile?: boolean };
    expect(block().hideOnMobile).toBe(true);
    await settle(editor);
    expect(blockWrappers(editor)[1].querySelector('.visibility-badge')!.textContent).toContain('Hidden on mobile');

    editor.undo();
    expect(block().hideOnMobile).toBeUndefined();
  });

  it('toggles a row flag, badging and hiding the whole row', async () => {
    const { doc, row } = makeDoc();
    const editor = await mount(doc);
    $(editor, 'pigeon-properties').dispatchEvent(new CustomEvent('row-select', { detail: { rowId: row.id }, bubbles: true, composed: true }));
    await settle(editor);

    expect(toggle(editor, 'Hide on mobile').checked).toBe(true);
    const attrs = () => editor.getDocument().body.rows[0].attributes as { hideOnMobile?: boolean };
    expect(attrs().hideOnMobile).toBe(true);

    await settle(editor);
    const wrapper = () => rowEl(editor).shadowRoot!.querySelector('.row-wrapper') as HTMLElement;
    expect(wrapper().querySelector('.visibility-badge')!.textContent).toContain('Hidden on mobile');
    expect(wrapper().classList.contains('device-hidden')).toBe(false);

    setDevice(editor, 'mobile');
    await settle(editor);
    expect(wrapper().classList.contains('device-hidden')).toBe(true);

    editor.undo();
    expect(attrs().hideOnMobile).toBeUndefined();
  });

  it('refuses the change on a locked row, in the panel and at the command layer', async () => {
    const { doc, row } = makeDoc();
    doc.body.rows[0].locked = true;
    const editor = await mount(doc);
    $(editor, 'pigeon-properties').dispatchEvent(new CustomEvent('row-select', { detail: { rowId: row.id }, bubbles: true, composed: true }));
    await settle(editor);

    // The panel puts the toggles behind the lock guard's inert wrapper.
    expect($(editor, 'pigeon-properties').shadowRoot!.querySelector('.locked[inert] .visibility')).not.toBeNull();

    // A caller bypassing the UI is refused too — locking lives in the command.
    $(editor, 'pigeon-properties').dispatchEvent(
      new CustomEvent('row-property-change', { detail: { rowId: row.id, attributes: { hideOnMobile: true } }, bubbles: true, composed: true }),
    );
    await settle(editor);
    expect(editor.getDocument().body.rows[0].attributes.hideOnMobile).toBeUndefined();
  });

  it('toggles a column flag', async () => {
    const { doc, row, hiddenColumn } = makeDoc();
    const editor = await mount(doc);
    $(editor, 'pigeon-properties').dispatchEvent(new CustomEvent('column-select', { detail: { rowId: row.id, columnId: hiddenColumn.id }, bubbles: true, composed: true }));
    await settle(editor);

    expect(toggle(editor, 'Hide on mobile').checked).toBe(false);
    expect(toggle(editor, 'Hide on desktop').checked).toBe(true);
    expect(editor.getDocument().body.rows[0].columns[1].attributes).toMatchObject({ hideOnMobile: false, hideOnDesktop: true });
  });
});
