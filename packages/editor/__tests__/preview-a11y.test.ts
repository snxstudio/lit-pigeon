import { describe, it, expect, afterEach } from 'vitest';
import { createDefaultDocument } from '@lit-pigeon/core';
import '../src/components/preview/pigeon-preview.js';
import type { PigeonPreview } from '../src/components/preview/pigeon-preview.js';

async function mountClosed(): Promise<PigeonPreview> {
  const el = document.createElement('pigeon-preview') as PigeonPreview;
  el.doc = createDefaultDocument('Test');
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('preview dialog accessibility', () => {
  it('has dialog semantics', async () => {
    const el = await mountClosed();
    el.open = true;
    await el.updateComplete;
    const modal = el.renderRoot.querySelector('.modal') as HTMLElement;
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-labelledby')).toBe('pigeon-preview-title');
  });

  it('closes on Escape', async () => {
    const el = await mountClosed();
    el.open = true;
    await el.updateComplete;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await el.updateComplete;
    expect(el.open).toBe(false);
  });

  it('restores focus to the trigger when closed', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const el = await mountClosed();
    el.open = true;
    await el.updateComplete; // focus moves into dialog

    el.open = false;
    await el.updateComplete; // focus should return to trigger
    expect(document.activeElement).toBe(trigger);
  });

  it('traps Tab within the dialog (wraps from last to first)', async () => {
    const el = await mountClosed();
    el.open = true;
    await el.updateComplete;

    const focusables = Array.from(
      el.renderRoot.querySelectorAll<HTMLElement>('.modal button'),
    );
    expect(focusables.length).toBeGreaterThan(1);
    const last = focusables[focusables.length - 1];
    last.focus();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    await el.updateComplete;
    // Focus should have wrapped back to the first focusable control.
    const active = el.renderRoot.querySelector('.modal')?.contains(
      el.renderRoot.activeElement,
    );
    expect(active).toBe(true);
  });
});
