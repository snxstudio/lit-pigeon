import { describe, it, expect, afterEach } from 'vitest';
import '../src/components/palette/pigeon-palette-item.js';
import type { PigeonPaletteItem } from '../src/components/palette/pigeon-palette-item.js';

async function mountItem(
  dragType: 'palette-block' | 'palette-row',
  attrs: Partial<{ label: string; blockType: string; columnCount: number }> = {},
): Promise<PigeonPaletteItem> {
  const el = document.createElement('pigeon-palette-item') as PigeonPaletteItem;
  el.dragType = dragType;
  el.label = attrs.label ?? 'Text';
  if (attrs.blockType) el.blockType = attrs.blockType;
  if (attrs.columnCount) el.columnCount = attrs.columnCount;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('palette item accessibility', () => {
  it('exposes the draggable item as a focusable button with a label', async () => {
    const el = await mountItem('palette-block', { label: 'Image' });
    const item = el.renderRoot.querySelector('.item') as HTMLElement;
    expect(item.getAttribute('role')).toBe('button');
    expect(item.getAttribute('tabindex')).toBe('0');
    expect(item.getAttribute('aria-label')).toBe('Add block: Image');
  });

  it('labels layout items with "Add layout"', async () => {
    const el = await mountItem('palette-row', { label: '2 Columns', columnCount: 2 });
    const item = el.renderRoot.querySelector('.item') as HTMLElement;
    expect(item.getAttribute('aria-label')).toBe('Add layout: 2 Columns');
  });

  it('dispatches palette-item-activate on Enter', async () => {
    const el = await mountItem('palette-block', { blockType: 'text' });
    const item = el.renderRoot.querySelector('.item') as HTMLElement;

    let detail: { type: string; blockType: string } | null = null;
    el.addEventListener('palette-item-activate', (e) => {
      detail = (e as CustomEvent).detail;
    });

    item.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }),
    );

    expect(detail).not.toBeNull();
    expect(detail!.type).toBe('palette-block');
    expect(detail!.blockType).toBe('text');
  });

  it('also activates on Space', async () => {
    const el = await mountItem('palette-row', { columnCount: 3 });
    const item = el.renderRoot.querySelector('.item') as HTMLElement;

    let fired = false;
    el.addEventListener('palette-item-activate', () => (fired = true));
    item.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }),
    );
    expect(fired).toBe(true);
  });

  it('dispatches palette-item-activate on click', async () => {
    const el = await mountItem('palette-block', { blockType: 'image' });
    const item = el.renderRoot.querySelector('.item') as HTMLElement;

    let detail: { type: string; blockType: string } | null = null;
    el.addEventListener('palette-item-activate', (e) => {
      detail = (e as CustomEvent).detail;
    });

    item.click();

    expect(detail).not.toBeNull();
    expect(detail!.type).toBe('palette-block');
    expect(detail!.blockType).toBe('image');
  });

  it('suppresses the click that follows a drag gesture', async () => {
    const el = await mountItem('palette-block', { blockType: 'text' });
    const item = el.renderRoot.querySelector('.item') as HTMLElement;

    let fired = 0;
    el.addEventListener('palette-item-activate', () => (fired += 1));

    item.dispatchEvent(new DragEvent('dragstart', { bubbles: true, composed: true }));
    item.dispatchEvent(new DragEvent('dragend', { bubbles: true, composed: true }));
    item.click(); // same-gesture click, before the reset tick
    expect(fired).toBe(0);

    // After the reset tick a fresh click activates again.
    await new Promise((r) => setTimeout(r, 0));
    item.click();
    expect(fired).toBe(1);
  });
});
