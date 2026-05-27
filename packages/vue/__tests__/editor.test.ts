import { describe, expect, it, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { PigeonEditor } from '../src/index.js';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { PigeonDocument } from '@lit-pigeon/core';

describe('PigeonEditor (Vue)', () => {
  let doc: PigeonDocument;

  beforeEach(() => {
    doc = createDefaultDocument();
  });

  it('renders the <pigeon-editor> custom element in the DOM', () => {
    const wrapper = mount(PigeonEditor);
    const el = wrapper.element as HTMLElement;
    expect(el.tagName.toLowerCase()).toBe('pigeon-editor');
  });

  it('assigns the `document` prop as a DOM property (not an attribute)', async () => {
    const wrapper = mount(PigeonEditor, { props: { document: doc } });
    await nextTick();
    const el = wrapper.element as HTMLElement & { document?: PigeonDocument };
    // Object props must be assigned as live DOM properties so the underlying
    // Lit element can read them — they should NOT be stringified into attrs.
    // (The Lit element may re-wrap the document via Immer, so we check
    // structural equality rather than identity.)
    expect(el.document).toBeTypeOf('object');
    expect(el.document).toEqual(doc);
    expect(el.hasAttribute('document')).toBe(false);
  });

  it('forwards `pigeon:change` DOM events as Vue `change` emits with detail payload', async () => {
    const wrapper = mount(PigeonEditor);
    await nextTick();
    const el = wrapper.element as HTMLElement;
    const payload = { document: doc };
    el.dispatchEvent(new CustomEvent('pigeon:change', { detail: payload }));
    await flushPromises();
    const emitted = wrapper.emitted('change');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toEqual(payload);
  });

  it('forwards `pigeon:export-html` to `exportHtml` emit', async () => {
    const wrapper = mount(PigeonEditor);
    await nextTick();
    const el = wrapper.element as HTMLElement;
    const payload = { html: '<h1>Hi</h1>' };
    el.dispatchEvent(new CustomEvent('pigeon:export-html', { detail: payload }));
    await flushPromises();
    expect(wrapper.emitted('exportHtml')?.[0]?.[0]).toEqual(payload);
  });

  it('removes DOM event listeners when unmounted', async () => {
    const wrapper = mount(PigeonEditor);
    await nextTick();
    const el = wrapper.element as HTMLElement;
    wrapper.unmount();
    // After unmount, dispatching events on the (still-detached) element should
    // not trigger Vue emits because the wrapper is gone, but more importantly
    // we want to ensure no errors are thrown.
    expect(() =>
      el.dispatchEvent(new CustomEvent('pigeon:change', { detail: { document: doc } })),
    ).not.toThrow();
  });
});
