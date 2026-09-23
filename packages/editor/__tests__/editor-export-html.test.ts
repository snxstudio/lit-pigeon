import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import type { PigeonDocument, Renderer } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mount(renderer?: Renderer) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .renderer=${renderer}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

async function clickExportHtml(el: PigeonEditor) {
  const events: CustomEvent<{ document: PigeonDocument; html: string | null }>[] = [];
  document.addEventListener('pigeon:export-html', (e) => events.push(e as CustomEvent));
  const toolbar = el.shadowRoot!.querySelector('pigeon-toolbar')!;
  toolbar.dispatchEvent(new CustomEvent('pigeon:export-html', { bubbles: true, composed: true }));
  await new Promise((r) => setTimeout(r, 0));
  return events;
}

describe('pigeon-editor export-html', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('fires exactly one event, carrying the rendered html', async () => {
    const renderer: Renderer = { render: async () => ({ html: '<p>rendered</p>', errors: [] }) };
    const el = await mount(renderer);
    const events = await clickExportHtml(el);
    expect(events).toHaveLength(1);
    expect(events[0].detail.html).toBe('<p>rendered</p>');
    expect(events[0].detail.document).toBe(el.getDocument());
  });

  it('sends html: null when no renderer is set', async () => {
    const el = await mount();
    const events = await clickExportHtml(el);
    expect(events).toHaveLength(1);
    expect(events[0].detail.html).toBeNull();
  });
});

describe('pigeon-editor export-mjml and export-json', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  async function clickExport(el: PigeonEditor, type: 'pigeon:export-mjml' | 'pigeon:export-json') {
    const events: CustomEvent[] = [];
    const listener = (e: Event) => events.push(e as CustomEvent);
    document.addEventListener(type, listener);
    const toolbar = el.shadowRoot!.querySelector('pigeon-toolbar')!;
    toolbar.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true }));
    document.removeEventListener(type, listener);
    return events;
  }

  it('fires exactly one export-mjml event, carrying the mjml', async () => {
    const el = await mount();
    el.documentToMjml = () => '<mjml></mjml>';
    const events = await clickExport(el, 'pigeon:export-mjml');
    expect(events).toHaveLength(1);
    expect(events[0].detail.mjml).toBe('<mjml></mjml>');
  });

  it('fires exactly one export-json event, carrying the document', async () => {
    const el = await mount();
    const events = await clickExport(el, 'pigeon:export-json');
    expect(events).toHaveLength(1);
    expect(events[0].detail.document).toBe(el.getDocument());
  });
});
