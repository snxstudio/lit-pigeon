import { afterEach, describe, expect, it } from 'vitest';
import '@lit-pigeon/editor';
import type { PigeonEditor } from '@lit-pigeon/editor';
import { createBlock, getBlockDefinition, registerBlock, validateDocument, type ContentBlock } from '@lit-pigeon/core';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '@lit-pigeon/parser-mjml';
import { mjml } from '../src/custom-blocks/insert-programmatically.js';
import { createEditCounterPlugin } from '../src/custom-blocks/edit-counter-plugin.js';
import { starter } from './helpers.js';

type Updatable = HTMLElement & { updateComplete: Promise<unknown> };
const blocksOf = (el: PigeonEditor) => el.getDocument().body.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks));

function deepQueryAll(root: Element, selector: string): Element[] {
  const found: Element[] = [];
  const walk = (node: Element | ShadowRoot) => {
    found.push(...node.querySelectorAll(selector));
    for (const child of node.querySelectorAll('*')) if (child.shadowRoot) walk(child.shadowRoot);
  };
  walk(root.shadowRoot!);
  return found;
}

async function mount(setup: (el: PigeonEditor) => void = () => {}): Promise<PigeonEditor> {
  const el = document.createElement('pigeon-editor') as PigeonEditor;
  setup(el);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('custom blocks', () => {
  it('registers the callout and the standard catalogue', () => {
    expect(getBlockDefinition('callout')?.label).toBe('Callout');
    for (const type of ['video', 'countdown', 'accordion', 'table', 'carousel']) {
      expect(getBlockDefinition(type)).toBeDefined();
    }
  });

  it('exports escaped MJML through renderMjml', () => {
    expect(mjml).toContain('<strong>ℹ Delivery update</strong>');
    const block = createBlock('callout', { title: '<script>x</script>' }) as ContentBlock;
    const doc = starter();
    doc.body.rows[0].columns[0].blocks = [block];
    expect(documentToMjml(doc)).toContain('&lt;script&gt;x&lt;/script&gt;');
  });

  it('appears in the palette, renders on the canvas and edits through its property schema', async () => {
    const el = await mount((e) => (e.document = starter()));
    const palette = el.shadowRoot!.querySelector('pigeon-palette') as Updatable;
    await palette.updateComplete;
    const item = palette.shadowRoot!.querySelector('pigeon-palette-item[label="Callout"]') as Updatable;
    expect(item).not.toBeNull();
    await item.updateComplete;
    (item.shadowRoot!.querySelector('.item') as HTMLElement).click();
    await el.updateComplete;
    const callout = blocksOf(el).find((b) => (b.type as string) === 'callout')!;
    expect(callout.values).toMatchObject({ title: 'Please note', padding: 16 });
    await new Promise((r) => setTimeout(r, 0));
    const rendered = deepQueryAll(el, '.custom-block').map((n) => n.innerHTML).join('');
    expect(rendered).toContain('<strong>ℹ Please note</strong>');

    el.shadowRoot!.querySelector('pigeon-canvas')!.dispatchEvent(new CustomEvent('block-select', { detail: { blockId: callout.id }, bubbles: true, composed: true }));
    await el.updateComplete;
    const props = el.shadowRoot!.querySelector('pigeon-properties') as Updatable;
    await props.updateComplete;
    const panel = props.shadowRoot!.querySelector('pigeon-custom-panel') as Updatable;
    await panel.updateComplete;
    const title = panel.shadowRoot!.querySelector('input#title') as HTMLInputElement;
    title.value = 'Changed';
    title.dispatchEvent(new Event('change'));
    const padding = panel.shadowRoot!.querySelector('input#padding') as HTMLInputElement;
    padding.value = '24';
    padding.dispatchEvent(new Event('change'));
    expect(blocksOf(el).find((b) => b.id === callout.id)!.values).toMatchObject({ title: 'Changed', padding: 24 });
    expect(el.undo()).toBe(true);
  });

  it('is rejected by validateDocument and does not survive an MJML round trip', () => {
    const doc = starter();
    doc.body.rows[0].columns[0].blocks = [createBlock('callout') as ContentBlock];
    expect(validateDocument(doc)).toContainEqual({ path: 'body.rows[0].columns[0].blocks[0].type', message: 'Invalid block type: callout' });
    const reopened = mjmlToDocument(documentToMjml(doc)).document;
    expect(reopened.body.rows[0].columns[0].blocks[0].type).toBe('text');
  });

  it('a block registered after the editor connects is missing from its palette', async () => {
    const el = await mount();
    registerBlock({ type: 'late', label: 'Late block', icon: 'L', defaultValues: {} });
    const palette = el.shadowRoot!.querySelector('pigeon-palette') as Updatable;
    await palette.updateComplete;
    expect(palette.shadowRoot!.querySelector('pigeon-palette-item[label="Late block"]')).toBeNull();
  });

  it('plugins in config.plugins do not register their blocks', async () => {
    await mount((e) => (e.config = { plugins: [{ name: 'with-blocks', blocks: [{ type: 'never', label: 'Never', icon: 'N', defaultValues: {} }] }] }));
    expect(getBlockDefinition('never')).toBeUndefined();
  });

  it('state plugins receive every edit', async () => {
    const counts: number[] = [];
    const el = await mount((e) => {
      e.document = starter();
      e.config = { plugins: [createEditCounterPlugin((n) => counts.push(n))] };
    });
    const rowId = el.getDocument().body.rows[0].id;
    el.shadowRoot!.querySelector('pigeon-canvas')!.dispatchEvent(new CustomEvent('row-select', { detail: { rowId }, bubbles: true, composed: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(counts).toEqual([1, 2]);
  });
});
