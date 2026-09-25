import { describe, it, expect, afterEach } from 'vitest';
import { createDefaultDocument } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const stubRenderer = { render: async () => ({ html: '<p>hi</p>', errors: [] }) };

async function mount(opts: { readonly?: boolean; renderer?: boolean } = {}): Promise<PigeonEditor> {
  const el = document.createElement('pigeon-editor') as PigeonEditor;
  el.document = createDefaultDocument('T');
  if (opts.readonly) el.readonly = true;
  if (opts.renderer !== false) {
    (el as unknown as { renderer: unknown }).renderer = stubRenderer;
  }
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

/** A real undoable edit, made the way the properties panel makes one. */
async function edit(el: PigeonEditor) {
  el.renderRoot.querySelector('pigeon-properties')!.dispatchEvent(
    new CustomEvent('body-property-change', {
      detail: { attribute: 'backgroundColor', value: '#123456' },
      bubbles: true,
      composed: true,
    }),
  );
  await el.updateComplete;
}

const panelOf = (el: PigeonEditor) =>
  el.renderRoot.querySelector('pigeon-preview') as HTMLElement & { open: boolean; updateComplete: Promise<unknown> };

afterEach(() => { document.body.innerHTML = ''; });

describe('canUndo / canRedo', () => {
  it('is false on a freshly loaded document', async () => {
    const el = await mount();
    expect(el.canUndo()).toBe(false);
    expect(el.canRedo()).toBe(false);
  });

  it('tracks the history state across an edit, an undo and a redo', async () => {
    const el = await mount();
    await edit(el);
    expect(el.canUndo()).toBe(true);
    expect(el.canRedo()).toBe(false);

    el.undo();
    await el.updateComplete;
    expect(el.canUndo()).toBe(false);
    expect(el.canRedo()).toBe(true);

    el.redo();
    await el.updateComplete;
    expect(el.canUndo()).toBe(true);
    expect(el.canRedo()).toBe(false);
  });

  it('agrees with what the built-in toolbar disables on', async () => {
    const el = await mount();
    await edit(el);
    const toolbar = el.renderRoot.querySelector('pigeon-toolbar') as HTMLElement & {
      canUndo: boolean; canRedo: boolean;
    };
    expect(el.canUndo()).toBe(toolbar.canUndo);
    expect(el.canRedo()).toBe(toolbar.canRedo);
  });

  it('is false in readonly mode, matching undo() refusing to run', async () => {
    const el = await mount({ readonly: true });
    expect(el.canUndo()).toBe(false);
    expect(el.canRedo()).toBe(false);
    expect(el.undo()).toBe(false);
    expect(el.redo()).toBe(false);
  });
});

describe('showPreview / hidePreview', () => {
  it('opens and closes the panel', async () => {
    const el = await mount();
    expect(el.showPreview()).toBe(true);
    await el.updateComplete;
    const panel = panelOf(el);
    await panel.updateComplete;
    expect(panel.open).toBe(true);

    el.hidePreview();
    await el.updateComplete;
    await panel.updateComplete;
    expect(panel.open).toBe(false);
  });

  it('emits pigeon:preview-open and pigeon:preview-close', async () => {
    const el = await mount();
    const seen: string[] = [];
    el.addEventListener('pigeon:preview-open', () => seen.push('open'));
    el.addEventListener('pigeon:preview-close', () => seen.push('close'));

    el.showPreview();
    await el.updateComplete;
    el.hidePreview();
    await el.updateComplete;

    expect(seen).toEqual(['open', 'close']);
  });

  it('does not emit when the state does not change', async () => {
    const el = await mount();
    el.showPreview();
    await el.updateComplete;

    let extra = 0;
    el.addEventListener('pigeon:preview-open', () => { extra += 1; });
    el.showPreview();
    await el.updateComplete;
    expect(extra).toBe(0);
  });

  it('reopens after the panel closes itself via Escape', async () => {
    const el = await mount();
    el.showPreview();
    await el.updateComplete;
    const panel = panelOf(el);
    await panel.updateComplete;
    expect(panel.open).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await el.updateComplete;
    await panel.updateComplete;
    expect(panel.open).toBe(false);

    expect(el.showPreview()).toBe(true);
    await el.updateComplete;
    await panel.updateComplete;
    expect(panel.open).toBe(true);
  });

  it('reports the self-close to the host as pigeon:preview-close', async () => {
    const el = await mount();
    el.showPreview();
    await el.updateComplete;
    await panelOf(el).updateComplete;

    let closed = 0;
    el.addEventListener('pigeon:preview-close', () => { closed += 1; });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await el.updateComplete;
    expect(closed).toBe(1);
  });

  it('falls back to the pigeon:preview event with no renderer set', async () => {
    const el = await mount({ renderer: false });
    let asked = 0;
    el.addEventListener('pigeon:preview', () => { asked += 1; });

    expect(el.showPreview()).toBe(false);
    await el.updateComplete;
    expect(asked).toBe(1);
    expect(panelOf(el).open).toBe(false);
  });
});
