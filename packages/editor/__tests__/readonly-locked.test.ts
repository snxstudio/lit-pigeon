import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type PigeonDocument,
  type Renderer,
} from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

function makeDoc() {
  const lockedRow = createRow([createColumn([createBlock('text', { content: '<p>Header</p>' })])]);
  lockedRow.locked = true;
  const openRow = createRow([createColumn([createBlock('text', { content: '<p>Body</p>' })])]);
  const doc = createDefaultDocument('RO');
  doc.body.rows = [lockedRow, openRow];
  return { doc, lockedRow, openRow };
}

async function mount(doc: PigeonDocument, opts: { readonly?: boolean; renderer?: Renderer } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-editor .document=${doc} ?readonly=${opts.readonly} .renderer=${opts.renderer}></pigeon-editor>`,
    container,
  );
  const editor = container.querySelector('pigeon-editor') as PigeonEditor;
  await editor.updateComplete;
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  return editor;
}

const $ = (editor: PigeonEditor, sel: string) => editor.shadowRoot!.querySelector(sel) as HTMLElement | null;
const canvas = (editor: PigeonEditor) => $(editor, 'pigeon-canvas')!;
const rows = (editor: PigeonEditor) =>
  Array.from(canvas(editor).shadowRoot!.querySelectorAll('pigeon-row')) as Array<HTMLElement & { updateComplete: Promise<unknown> }>;
const column = (row: HTMLElement) => row.shadowRoot!.querySelector('pigeon-column') as HTMLElement & { updateComplete: Promise<unknown> };

function fire(editor: PigeonEditor, type: string, detail: unknown) {
  canvas(editor).dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

function press(opts: KeyboardEventInit) {
  document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...opts }));
}

async function settle(editor: PigeonEditor) {
  await editor.updateComplete;
  await canvas(editor).updateComplete;
  for (const row of rows(editor)) {
    await row.updateComplete;
    await column(row).updateComplete;
  }
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('<pigeon-editor readonly>', () => {
  it('reflects the readonly property and attribute', async () => {
    const editor = await mount(makeDoc().doc);
    expect(editor.readonly).toBe(false);
    editor.readonly = true;
    await editor.updateComplete;
    expect(editor.hasAttribute('readonly')).toBe(true);
    editor.removeAttribute('readonly');
    expect(editor.readonly).toBe(false);
  });

  it('hides the palette, properties panel and document-changing toolbar actions', async () => {
    const editor = await mount(makeDoc().doc, { readonly: true });
    expect($(editor, 'pigeon-palette')).toBeNull();
    expect($(editor, 'pigeon-properties')).toBeNull();
    const toolbar = $(editor, 'pigeon-toolbar')!.shadowRoot!;
    for (const part of ['undo', 'redo', 'templates']) {
      expect(toolbar.querySelector(`[part~="toolbar-button-${part}"]`)).toBeNull();
    }
    for (const part of ['preview', 'export', 'fullscreen']) {
      expect(toolbar.querySelector(`[part~="toolbar-button-${part}"]`)).not.toBeNull();
    }
    expect(toolbar.querySelectorAll('[part~="toolbar-device"]')).toHaveLength(3);
  });

  it('shows no row actions or block drag handles', async () => {
    const editor = await mount(makeDoc().doc, { readonly: true });
    await settle(editor);
    for (const row of rows(editor)) {
      expect(row.shadowRoot!.querySelector('.actions, .row-label')).toBeNull();
      expect(column(row).shadowRoot!.querySelector('.block-drag-handle')).toBeNull();
    }
  });

  it('ignores keyboard mutations', async () => {
    const { doc, openRow } = makeDoc();
    const editor = await mount(doc, { readonly: true });
    const before = editor.getDocument();
    fire(editor, 'block-select', { blockId: openRow.columns[0].blocks[0].id });
    press({ key: 'c', ctrlKey: true });
    for (const key of [{ key: 'Delete' }, { key: 'Backspace' }, { key: 'd', ctrlKey: true }, { key: 'v', ctrlKey: true }, { key: 'z', ctrlKey: true }]) {
      press(key);
    }
    fire(editor, 'row-select', { rowId: openRow.id });
    press({ key: 'Delete' });
    press({ key: 'd', ctrlKey: true });
    expect(editor.getDocument()).toBe(before);
  });

  it('ignores mutation events and undo from outside the UI', async () => {
    const { doc, openRow } = makeDoc();
    const editor = await mount(doc);
    const blockId = openRow.columns[0].blocks[0].id;
    $(editor, 'pigeon-properties')!.dispatchEvent(new CustomEvent('property-change', {
      detail: { rowId: openRow.id, columnId: openRow.columns[0].id, blockId, values: { content: '<p>edited</p>' } },
      bubbles: true,
      composed: true,
    }));
    const edited = editor.getDocument();
    expect(edited).not.toBe(doc);

    editor.readonly = true;
    await editor.updateComplete;
    fire(editor, 'row-delete', { rowId: openRow.id });
    fire(editor, 'row-move', { rowId: openRow.id, toIndex: 0 });
    fire(editor, 'row-drop', { index: 0, columnCount: 1 });
    fire(editor, 'block-drop', { rowId: openRow.id, columnId: openRow.columns[0].id, index: 0, dragData: { type: 'palette-block', blockType: 'divider' } });
    editor.dispatchEvent(new CustomEvent('brand-color-apply', { detail: { value: '#000' } }));
    $(editor, 'pigeon-toolbar')!.dispatchEvent(new CustomEvent('toolbar-undo', { bubbles: true, composed: true }));
    expect(editor.undo()).toBe(false);
    expect(editor.redo()).toBe(false);
    expect(editor.getDocument()).toBe(edited);
  });

  it('does not enter inline editing on double-click', async () => {
    const { doc, openRow } = makeDoc();
    const editor = await mount(doc, { readonly: true });
    fire(editor, 'block-enter-edit', { blockId: openRow.columns[0].blocks[0].id });
    await settle(editor);
    const text = column(rows(editor)[1]).shadowRoot!.querySelector('pigeon-text-block')!;
    expect(text.hasAttribute('editing')).toBe(false);
  });

  it('still exports, previews and switches device', async () => {
    const renderer: Renderer = { render: async () => ({ html: '<p>ok</p>', errors: [] }) };
    const editor = await mount(makeDoc().doc, { readonly: true, renderer });
    expect(await editor.exportHtml()).toBe('<p>ok</p>');
    $(editor, 'pigeon-toolbar')!.dispatchEvent(new CustomEvent('toolbar-device', { detail: { device: 'mobile' }, bubbles: true, composed: true }));
    await editor.updateComplete;
    expect((canvas(editor) as HTMLElement & { device: string }).device).toBe('mobile');
    $(editor, 'pigeon-toolbar')!.dispatchEvent(new CustomEvent('pigeon:preview', { bubbles: true, composed: true }));
    await editor.updateComplete;
    expect($(editor, 'pigeon-preview')!.hasAttribute('open')).toBe(true);
  });
});

describe('locked rows in the editor UI', () => {
  it('shows a locked badge and only the save action on a locked row', async () => {
    const editor = await mount(makeDoc().doc);
    await settle(editor);
    const [locked, open] = rows(editor);
    const titles = (row: HTMLElement) =>
      Array.from(row.shadowRoot!.querySelectorAll('.actions button')).map((b) => b.getAttribute('title'));
    expect(locked.shadowRoot!.querySelector('.row-label')!.textContent).toContain('Locked');
    expect(titles(locked)).toEqual(['Save to library']);
    expect(titles(open)).toContain('Delete');
    expect(column(locked).shadowRoot!.querySelector('.block-drag-handle')).toBeNull();
    expect(column(open).shadowRoot!.querySelector('.block-drag-handle')).not.toBeNull();
  });

  it('keeps keyboard delete and duplicate away from a locked row and its blocks', async () => {
    const { doc, lockedRow } = makeDoc();
    const editor = await mount(doc);
    const before = editor.getDocument();
    fire(editor, 'block-select', { blockId: lockedRow.columns[0].blocks[0].id });
    press({ key: 'Delete' });
    press({ key: 'd', ctrlKey: true });
    fire(editor, 'row-select', { rowId: lockedRow.id });
    press({ key: 'Backspace' });
    press({ key: 'd', ctrlKey: true });
    expect(editor.getDocument()).toBe(before);
  });

  it('does not enter inline editing on a locked block', async () => {
    const { doc, lockedRow } = makeDoc();
    const editor = await mount(doc);
    fire(editor, 'block-enter-edit', { blockId: lockedRow.columns[0].blocks[0].id });
    await settle(editor);
    const text = column(rows(editor)[0]).shadowRoot!.querySelector('pigeon-text-block')!;
    expect(text.hasAttribute('editing')).toBe(false);
  });

  it('disables the properties panel with an explanation', async () => {
    const { doc, lockedRow, openRow } = makeDoc();
    const editor = await mount(doc);
    const props = () => $(editor, 'pigeon-properties')!.shadowRoot!;

    fire(editor, 'block-select', { blockId: lockedRow.columns[0].blocks[0].id });
    await editor.updateComplete;
    await ($(editor, 'pigeon-properties') as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    expect(props().querySelector('.locked-note')!.textContent).toMatch(/locked/i);
    expect(props().querySelector('pigeon-text-panel')!.closest('[inert]')).not.toBeNull();

    fire(editor, 'row-select', { rowId: lockedRow.id });
    await editor.updateComplete;
    await ($(editor, 'pigeon-properties') as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    expect(props().querySelector('pigeon-row-panel')!.closest('[inert]')).not.toBeNull();

    fire(editor, 'block-select', { blockId: openRow.columns[0].blocks[0].id });
    await editor.updateComplete;
    await ($(editor, 'pigeon-properties') as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    expect(props().querySelector('.locked-note')).toBeNull();
    expect(props().querySelector('[inert]')).toBeNull();
  });
});
