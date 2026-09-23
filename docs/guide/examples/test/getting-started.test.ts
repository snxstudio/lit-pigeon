import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { mount } from '@vue/test-utils';
import { render, fireEvent } from '@testing-library/svelte';
import { findEditor, starter, tick } from './helpers.js';
import { EmailEditor } from '../src/getting-started/ReactEmailEditor.js';
import VueEmailEditor from '../src/getting-started/VueEmailEditor.vue';
import SvelteEmailEditor from '../src/getting-started/SvelteEmailEditor.svelte';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('getting started: vanilla', () => {
  it('renders, reports changes and exports MJML and HTML', async () => {
    const page = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/getting-started/index.html'), 'utf8');
    const body = /<body>([\s\S]*)<\/body>/.exec(page)![1].replace(/<script[\s\S]*?<\/script>/g, '');
    document.body.innerHTML = body;
    const { save, lastChange } = await import('../src/getting-started/main.js');
    const editor = await findEditor();
    editor.loadDocument(starter());
    expect(lastChange()?.metadata.name).toBe('Welcome');
    const { mjml, html } = await save();
    expect(mjml).toContain('<mjml>');
    expect(html).toMatch(/<!doctype html>/i);
  });
});

describe('getting started: React', () => {
  it('enables Save after a change and hands back MJML and HTML', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const saved: Array<{ mjml: string | null; html: string | null }> = [];
    const root = createRoot(host);
    await act(async () => {
      root.render(createElement(EmailEditor, { initial: starter(), onSave: (r) => saved.push(r) }));
    });
    const editor = await findEditor(host);
    expect(editor.getDocument().metadata.name).toBe('Welcome');
    const button = host.querySelector('button')!;
    expect(button.disabled).toBe(true);
    await act(async () => editor.loadDocument(starter('starter-promo')));
    expect(button.disabled).toBe(false);
    await act(async () => {
      button.click();
      await tick(50);
    });
    expect(saved[0].mjml).toContain('<mjml>');
    expect(saved[0].html).toMatch(/<!doctype html>/i);
    act(() => root.unmount());
  });
});

describe('getting started: Vue', () => {
  it('emits save with MJML and HTML', async () => {
    const wrapper = mount(VueEmailEditor, { props: { initial: starter() }, attachTo: document.body });
    const editor = await findEditor(wrapper.element.parentElement!);
    editor.loadDocument(starter('starter-newsletter'));
    await wrapper.find('button').trigger('click');
    await tick(50);
    const [[result]] = wrapper.emitted('save') as Array<[{ mjml: string; html: string }]>;
    expect(result.mjml).toContain('<mjml>');
    expect(result.html).toMatch(/<!doctype html>/i);
    wrapper.unmount();
  });
});

describe('getting started: Svelte', () => {
  it('calls onSave with MJML and HTML', async () => {
    const saved: Array<{ mjml: string; html: string }> = [];
    const { container, getByText } = render(SvelteEmailEditor, {
      props: { initial: starter(), onSave: (r: { mjml: string; html: string }) => saved.push(r) },
    });
    const editor = await findEditor(container);
    expect(editor.getDocument().metadata.name).toBe('Welcome');
    editor.loadDocument(starter('starter-promo'));
    await fireEvent.click(getByText('Save'));
    await tick(50);
    expect(saved[0].mjml).toContain('<mjml>');
    expect(saved[0].html).toMatch(/<!doctype html>/i);
  });
});
