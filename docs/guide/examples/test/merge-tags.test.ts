import { afterEach, describe, expect, it, vi } from 'vitest';
import '@lit-pigeon/editor';
import type { PigeonEditor } from '@lit-pigeon/editor';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '@lit-pigeon/parser-mjml';
import { applyMergeTags, renderDocument } from '@lit-pigeon/ssr';
import { staticTagsConfig } from '../src/merge-tags/static-tags.js';
import { provideMergeTagsOnDemand } from '../src/merge-tags/lazy-tags.js';
import { compileForSending } from '../src/merge-tags/conditions.js';
import { starter, tick } from './helpers.js';

type Updatable = HTMLElement & { updateComplete: Promise<unknown> };

async function mountWithTextSelected(setup: (el: PigeonEditor) => void) {
  const el = document.createElement('pigeon-editor') as PigeonEditor;
  el.document = starter('starter-transactional');
  setup(el);
  document.body.appendChild(el);
  await el.updateComplete;
  const doc = el.getDocument();
  const block = doc.body.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks)).find((b) => b.type === 'text')!;
  el.shadowRoot!.querySelector('pigeon-canvas')!.dispatchEvent(new CustomEvent('block-select', { detail: { blockId: block.id }, bubbles: true, composed: true }));
  await el.updateComplete;
  const props = el.shadowRoot!.querySelector('pigeon-properties') as Updatable;
  await props.updateComplete;
  const panel = props.shadowRoot!.querySelector('pigeon-text-panel') as Updatable;
  await panel.updateComplete;
  return { el, panel };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('merge tags in the editor', () => {
  it('shows the Tag button and the picker for static tags', async () => {
    const { panel } = await mountWithTextSelected((el) => (el.config = staticTagsConfig));
    const button = panel.shadowRoot!.querySelector('.tag-btn') as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    await panel.updateComplete;
    const picker = panel.shadowRoot!.querySelector('pigeon-merge-tag-picker') as Updatable;
    await picker.updateComplete;
    expect(picker.shadowRoot!.textContent).toContain('First name');
    expect(picker.shadowRoot!.textContent).toContain('Ada');
  });

  it('has no Tag button without mergeTags', async () => {
    const { panel } = await mountWithTextSelected(() => {});
    expect(panel.shadowRoot!.querySelector('.tag-btn')).toBeNull();
  });

  it('requests tags once on demand and supplies them with setMergeTags', async () => {
    const load = vi.fn(async () => [{ name: '{{first_name}}', label: 'First name' }]);
    const { el, panel } = await mountWithTextSelected((e) => provideMergeTagsOnDemand(e, load));
    const requests: Event[] = [];
    el.addEventListener('pigeon:merge-tag-request', (e) => requests.push(e));
    const button = panel.shadowRoot!.querySelector('.tag-btn') as HTMLButtonElement;
    button.click();
    button.click();
    await tick(10);
    expect(requests).toHaveLength(2);
    expect(load).toHaveBeenCalledTimes(1);
    expect(el.config.mergeTags?.tags?.[0].label).toBe('First name');
  });
});

describe('merge tags and conditions in the output', () => {
  it('passes merge tags through to MJML and HTML unchanged', async () => {
    const doc = starter();
    (doc.body.rows[1].columns[0].blocks[0].values as { content: string }).content = '<p>Hi {{first_name}}</p>';
    const mjml = documentToMjml(doc);
    expect(mjml).toContain('{{first_name}}');
    const { html } = await renderDocument(doc);
    expect(html).toContain('{{first_name}}');
    expect(applyMergeTags(html, { first_name: '<Ada>' })).toContain('&lt;Ada&gt;');
  });

  it('evaluates row conditions and tags per recipient with a template engine', async () => {
    const template = await compileForSending();
    expect(template({ is_member: true, first_name: 'Ada' })).toContain('Your members-only offer, Ada.');
    expect(template({ is_member: false, first_name: 'Ada' })).not.toContain('members-only');
  });

  it('round-trips a row condition through MJML', async () => {
    const doc = starter();
    doc.body.rows[1].attributes.condition = 'user.premium';
    const reopened = mjmlToDocument(documentToMjml(doc)).document;
    expect(reopened.body.rows[1].attributes.condition).toBe('user.premium');
  });
});
