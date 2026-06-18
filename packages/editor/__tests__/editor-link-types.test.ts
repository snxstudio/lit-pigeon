import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { SYSTEM_LINK_TYPES } from '@lit-pigeon/core';
import type { EditorConfig, LinkType } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

describe('pigeon-editor link types', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('passes system + custom link types to the rich-text bubble', async () => {
    const custom: LinkType = { id: 'survey', label: 'Survey', href: '{{survey_url}}' };
    const el = await mount({ linkTypes: [custom] });
    await el.updateComplete;
    const bubble = el.shadowRoot!.querySelector('pigeon-rich-text-bubble') as HTMLElement & { linkTypes: LinkType[] };
    const ids = bubble.linkTypes.map((t) => t.id);
    expect(ids).toEqual([...SYSTEM_LINK_TYPES.map((t) => t.id), 'survey']);
  });
});
