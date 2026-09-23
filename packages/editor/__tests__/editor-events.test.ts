import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type EditorConfig,
} from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';
import source from '../src/editor.ts?raw';

const documented = [...source.matchAll(/@fires (\S+)/g)].map((m) => m[1]);

function makeDoc() {
  const doc = createDefaultDocument('Events');
  const text = createBlock('text', { content: '<p>Hi</p>' });
  const htmlBlock = createBlock('html', { content: '<b>Hi</b>' });
  const row = createRow([createColumn([text, htmlBlock])]);
  doc.body.rows = [row];
  return { doc, textId: text.id, htmlId: htmlBlock.id };
}

const fired: string[] = [];

async function mountEditor(config: Partial<EditorConfig> = {}) {
  const { doc, textId, htmlId } = makeDoc();
  const editor = document.createElement('pigeon-editor') as PigeonEditor;
  editor.document = doc;
  editor.config = config;
  for (const name of documented) editor.addEventListener(name, () => fired.push(name));
  document.body.appendChild(editor);
  await editor.updateComplete;
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  return { editor, textId, htmlId };
}

function toolbarButton(editor: PigeonEditor, selector: string) {
  const toolbar = editor.shadowRoot!.querySelector('pigeon-toolbar')!;
  return toolbar.shadowRoot!.querySelector(selector) as HTMLButtonElement;
}

async function openExportMenu(editor: PigeonEditor) {
  toolbarButton(editor, '[part~="toolbar-button-export"]').click();
  await editor.shadowRoot!.querySelector('pigeon-toolbar')!.updateComplete;
}

async function clickTagButton(editor: PigeonEditor, panelTag: string) {
  const properties = editor.shadowRoot!.querySelector('pigeon-properties')!;
  await properties.updateComplete;
  const panel = properties.shadowRoot!.querySelector(panelTag) as HTMLElement & {
    updateComplete: Promise<boolean>;
  };
  await panel.updateComplete;
  const button = panel.shadowRoot!.querySelector('.tag-btn') as HTMLButtonElement | null;
  expect(button, `${panelTag} shows the Tag button`).toBeTruthy();
  button!.click();
  await panel.updateComplete;
  return panel;
}

function selectBlock(editor: PigeonEditor, blockId: string) {
  editor.shadowRoot!.querySelector('pigeon-canvas')!.dispatchEvent(
    new CustomEvent('block-select', { detail: { blockId }, bubbles: true, composed: true }),
  );
  return editor.updateComplete;
}

describe('<pigeon-editor> documented events', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    fired.length = 0;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('documents the events this suite covers', () => {
    expect([...documented].sort()).toEqual([
      'pigeon:change',
      'pigeon:export',
      'pigeon:export-html',
      'pigeon:export-json',
      'pigeon:export-mjml',
      'pigeon:merge-tag-request',
      'pigeon:preview',
      'pigeon:ready',
      'pigeon:select',
    ]);
  });

  it('fires pigeon:ready, pigeon:change and pigeon:select', async () => {
    const { editor, textId } = await mountEditor();
    await selectBlock(editor, textId);
    expect(fired).toContain('pigeon:ready');
    expect(fired).toContain('pigeon:change');
    expect(fired).toContain('pigeon:select');
  });

  it('fires pigeon:preview from the toolbar', async () => {
    const { editor } = await mountEditor();
    toolbarButton(editor, '[part~="toolbar-button-preview"]').click();
    expect(fired).toContain('pigeon:preview');
  });

  it('fires pigeon:export when the Export menu opens, but not when it closes', async () => {
    const { editor } = await mountEditor();
    await openExportMenu(editor);
    expect(fired.filter((n) => n === 'pigeon:export')).toHaveLength(1);
    await openExportMenu(editor);
    expect(fired.filter((n) => n === 'pigeon:export')).toHaveLength(1);
  });

  it.each([
    ['pigeon:export-html', 0],
    ['pigeon:export-mjml', 1],
    ['pigeon:export-json', 2],
  ])('fires %s from the Export menu', async (name, index) => {
    const { editor } = await mountEditor();
    await openExportMenu(editor);
    const items = editor.shadowRoot!.querySelector('pigeon-toolbar')!.shadowRoot!
      .querySelectorAll('[role="menuitem"]');
    (items[index] as HTMLButtonElement).click();
    await vi.waitFor(() => expect(fired).toContain(name));
  });

  describe('pigeon:merge-tag-request', () => {
    it('fires from the body panel when merge tags are configured without static tags', async () => {
      const { editor } = await mountEditor({ mergeTags: { trigger: '{{' } });
      const panel = await clickTagButton(editor, 'pigeon-body-panel');
      expect(fired).toContain('pigeon:merge-tag-request');
      expect(panel.shadowRoot!.querySelector('pigeon-merge-tag-picker[open]')).toBeNull();
    });

    it('fires from the text panel', async () => {
      const { editor, textId } = await mountEditor({ mergeTags: {} });
      await selectBlock(editor, textId);
      await clickTagButton(editor, 'pigeon-text-panel');
      expect(fired).toContain('pigeon:merge-tag-request');
    });

    it('fires from the html panel', async () => {
      const { editor, htmlId } = await mountEditor({ mergeTags: { tags: [] } });
      await selectBlock(editor, htmlId);
      await clickTagButton(editor, 'pigeon-html-panel');
      expect(fired).toContain('pigeon:merge-tag-request');
    });

    it('opens the picker instead when static tags are configured', async () => {
      const { editor } = await mountEditor({
        mergeTags: { tags: [{ name: '{{firstName}}', label: 'First name' }] },
      });
      const panel = await clickTagButton(editor, 'pigeon-body-panel');
      expect(fired).not.toContain('pigeon:merge-tag-request');
      expect(panel.shadowRoot!.querySelector('pigeon-merge-tag-picker[open]')).toBeTruthy();
    });

    it('shows no Tag button when merge tags are not configured', async () => {
      const { editor } = await mountEditor();
      const properties = editor.shadowRoot!.querySelector('pigeon-properties')!;
      await properties.updateComplete;
      const panel = properties.shadowRoot!.querySelector('pigeon-body-panel')!;
      expect(panel.shadowRoot!.querySelector('.tag-btn')).toBeNull();
    });
  });
});
