import { afterEach, describe, expect, it } from 'vitest';
import { mount as mountVue } from '@vue/test-utils';
import { render } from '@testing-library/svelte';
import '@lit-pigeon/editor';
import type { PigeonEditor } from '@lit-pigeon/editor';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';
import { listen, type PigeonEditorEventMap } from '../src/events/event-map.js';
import { createDirtyTracker } from '../src/events/track-changes.js';
import VueEditorMethods from '../src/events/VueEditorMethods.vue';
import SvelteEditorMethods from '../src/events/SvelteEditorMethods.svelte';
import { findEditor, starter, tick } from './helpers.js';

async function mount(setup: (el: PigeonEditor) => void = () => {}): Promise<PigeonEditor> {
  const el = document.createElement('pigeon-editor') as PigeonEditor;
  setup(el);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function record<K extends keyof PigeonEditorEventMap>(el: PigeonEditor, type: K) {
  const seen: Array<PigeonEditorEventMap[K]['detail']> = [];
  listen(el, type, (e) => seen.push(e.detail));
  return seen;
}

const shadow = <T extends Element>(root: Element, selector: string) => root.shadowRoot!.querySelector(selector) as T & { updateComplete: Promise<unknown> };

afterEach(() => {
  document.body.innerHTML = '';
});

describe('events', () => {
  it('pigeon:ready fires once, after the first render', async () => {
    const el = document.createElement('pigeon-editor') as PigeonEditor;
    const ready = record(el, 'pigeon:ready');
    document.body.appendChild(el);
    await el.updateComplete;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(ready).toEqual([null]);
  });

  it('pigeon:change fires on load and on selection changes with the same object; only edits bring a new one', async () => {
    const el = await mount((e) => (e.document = starter()));
    const changes = record(el, 'pigeon:change');
    const selects = record(el, 'pigeon:select');
    const dirty: boolean[] = [];
    const tracker = createDirtyTracker(el, (d) => dirty.push(d));
    const loaded = starter('starter-promo');
    tracker.load(loaded);
    expect(changes.at(-1)!.document).toBe(loaded);
    expect(selects).toHaveLength(0);
    const block = shadow(el, 'pigeon-canvas');
    await block.updateComplete;
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(selects.at(-1)).toEqual({ selection: { type: 'body' } });
    expect(changes.at(-1)!.document).toBe(loaded);
    expect(dirty).toEqual([]);
    // An edit through a keyboard shortcut: select the first row, then duplicate it.
    const rowId = loaded.body.rows[0].id;
    el.shadowRoot!.querySelector('pigeon-canvas')!.dispatchEvent(new CustomEvent('row-select', { detail: { rowId }, bubbles: true, composed: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));
    expect(el.getDocument().body.rows).toHaveLength(loaded.body.rows.length + 1);
    expect(dirty).toEqual([true]);
    expect(Object.isFrozen(el.getDocument())).toBe(true);
    tracker.markSaved(el.getDocument());
    expect(dirty).toEqual([true, false]);
  });

  it('toolbar exports fire once each with document and output', async () => {
    const el = await mount((e) => {
      e.document = starter();
      e.renderer = new MjmlRenderer();
      e.documentToMjml = documentToMjml;
    });
    const html = record(el, 'pigeon:export-html');
    const mjml = record(el, 'pigeon:export-mjml');
    const json = record(el, 'pigeon:export-json');
    const menu = record(el, 'pigeon:export');
    const toolbar = shadow<HTMLElement & Record<string, () => void>>(el, 'pigeon-toolbar');
    toolbar._toggleExportMenu();
    toolbar._onExportHtml();
    toolbar._onExportMjml();
    toolbar._onExportJson();
    await tick(50);
    expect(menu).toEqual([null]);
    expect(html).toHaveLength(1);
    expect(html[0].html).toMatch(/<!doctype html>/i);
    expect(html[0].document).toBe(el.getDocument());
    expect(mjml).toHaveLength(1);
    expect(mjml[0].mjml).toContain('<mjml>');
    expect(json).toEqual([{ document: el.getDocument() }]);
  });

  it('export events carry null output without a renderer or documentToMjml', async () => {
    const el = await mount();
    const html = record(el, 'pigeon:export-html');
    const mjml = record(el, 'pigeon:export-mjml');
    const toolbar = shadow<HTMLElement & Record<string, () => void>>(el, 'pigeon-toolbar');
    toolbar._onExportHtml();
    toolbar._onExportMjml();
    await tick(20);
    expect(html[0].html).toBeNull();
    expect(mjml[0].mjml).toBeNull();
    expect(el.exportMjml()).toBeNull();
    expect(await el.exportHtml()).toBeNull();
  });

  it('pigeon:preview reaches the host twice without a renderer and once with one (known issue)', async () => {
    const el = await mount();
    const previews = record(el, 'pigeon:preview');
    const toolbar = shadow<HTMLElement & Record<string, () => void>>(el, 'pigeon-toolbar');
    toolbar._onPreview();
    expect(previews).toHaveLength(2);
    el.renderer = new MjmlRenderer();
    await el.updateComplete;
    toolbar._onPreview();
    expect(previews).toHaveLength(3);
  });

  it('keyboard shortcuts ignore key presses aimed at host widgets', async () => {
    const el = await mount((e) => (e.document = starter()));
    const input = document.createElement('input');
    document.body.appendChild(input);
    const rows = el.getDocument().body.rows.length;
    const rowId = el.getDocument().body.rows[0].id;
    el.shadowRoot!.querySelector('pigeon-canvas')!.dispatchEvent(new CustomEvent('row-select', { detail: { rowId }, bubbles: true, composed: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(el.getDocument().body.rows).toHaveLength(rows);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    expect(el.getDocument().body.rows).toHaveLength(rows - 1);
  });

  it('setMergeTags answers pigeon:merge-tag-request', async () => {
    const el = await mount((e) => (e.config = { mergeTags: {} }));
    el.setMergeTags([{ name: '{{first_name}}', label: 'First name' }]);
    expect(el.config.mergeTags?.tags?.[0].name).toBe('{{first_name}}');
  });
});

describe('wrappers: reaching the element', () => {
  it('Vue: $el is the <pigeon-editor> element, and plain attributes fall through', async () => {
    const wrapper = mountVue(VueEditorMethods, { attachTo: document.body });
    const el = await findEditor();
    expect(el.getAttribute('theme')).toBe('dark');
    expect(el.theme).toBe('dark');
    el.loadDocument(starter());
    expect(await (wrapper.vm as unknown as { exportHtml(): Promise<string | null> }).exportHtml()).toMatch(/<!doctype html>/i);
    wrapper.unmount();
  });

  it('Svelte: find the element inside a container', async () => {
    const { component } = render(SvelteEditorMethods);
    const el = await findEditor();
    el.loadDocument(starter());
    expect(await (component as unknown as { exportHtml(): Promise<string | null> }).exportHtml()).toMatch(/<!doctype html>/i);
  });
});
