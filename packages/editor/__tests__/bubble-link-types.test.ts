import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { SYSTEM_LINK_TYPES } from '@lit-pigeon/core';
import '../src/rich-text/ui/bubble.js';
import type { PigeonRichTextBubble } from '../src/rich-text/ui/bubble.js';

function fakeEditor() {
  const calls: Array<{ href: string }> = [];
  const chain: any = {};
  chain.focus = () => chain;
  chain.extendMarkRange = () => chain;
  chain.setLink = (attrs: { href: string }) => { calls.push(attrs); return chain; };
  chain.unsetLink = () => chain;
  chain.run = () => true;
  const editor: any = {
    chain: () => chain,
    isDestroyed: false,
    state: { selection: { from: 1, to: 5 } },
    isActive: () => false,
    getAttributes: () => ({}),
    view: { coordsAtPos: () => ({ top: 0, left: 0, right: 0, bottom: 0 }) },
    on: () => {},
    off: () => {},
  };
  return { editor, calls };
}

async function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-rich-text-bubble .linkTypes=${SYSTEM_LINK_TYPES}></pigeon-rich-text-bubble>`, container);
  const el = container.querySelector('pigeon-rich-text-bubble') as PigeonRichTextBubble;
  await el.updateComplete;
  return el;
}

describe('bubble special links', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('renders the link-type picker inside the open link popover', async () => {
    const el = await mount();
    (el as any)._linkPopoverOpen = true;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('pigeon-link-type-picker')).toBeTruthy();
  });

  it('applies a {{…}} template href via setLink on link-type-select', async () => {
    const el = await mount();
    const { editor, calls } = fakeEditor();
    el.editor = editor;
    (el as any)._linkPopoverOpen = true;
    await el.updateComplete;
    el.shadowRoot!.querySelector('pigeon-link-type-picker')!
      .dispatchEvent(new CustomEvent('link-type-select', { detail: { href: '{{unsubscribe_url}}' }, bubbles: true, composed: true }));
    expect(calls).toContainEqual({ href: '{{unsubscribe_url}}' });
  });

  it('applies a tel: href via setLink', async () => {
    const el = await mount();
    const { editor, calls } = fakeEditor();
    el.editor = editor;
    (el as any)._linkPopoverOpen = true;
    await el.updateComplete;
    el.shadowRoot!.querySelector('pigeon-link-type-picker')!
      .dispatchEvent(new CustomEvent('link-type-select', { detail: { href: 'tel:+15551234' }, bubbles: true, composed: true }));
    expect(calls).toContainEqual({ href: 'tel:+15551234' });
  });
});
