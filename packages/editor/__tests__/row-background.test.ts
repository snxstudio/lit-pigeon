import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { createRow, createColumn, resolveRowBackground, type RowNode } from '@lit-pigeon/core';
import '../src/components/canvas/pigeon-row.js';
import '../src/components/properties/panels/row-panel.js';
import type { PigeonRowPanel } from '../src/components/properties/panels/row-panel.js';

async function mountCanvasRow(row: RowNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-row .row=${row}></pigeon-row>`, container);
  const el = container.querySelector('pigeon-row') as HTMLElement & { updateComplete: Promise<unknown> };
  await el.updateComplete;
  return (el.shadowRoot!.querySelector('.row-wrapper') as HTMLElement).getAttribute('style') ?? '';
}

async function mountPanel(row: RowNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-row-panel .row=${row}></pigeon-row-panel>`, container);
  const el = container.querySelector('pigeon-row-panel') as PigeonRowPanel;
  await el.updateComplete;
  return el;
}

describe('row background image in the canvas', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('paints the row with the values the renderer emits', async () => {
    const row = createRow([createColumn()]);
    Object.assign(row.attributes, {
      backgroundImage: '/tile.png',
      backgroundRepeat: 'repeat' as const,
      backgroundSize: '40px 40px',
      backgroundPosition: 'bottom right',
    });

    const style = await mountCanvasRow(row);

    expect(style).toContain('background-image: url(/tile.png)');
    expect(style).toContain('background-repeat: repeat');
    expect(style).toContain('background-size: 40px 40px');
    expect(style).toContain('background-position: bottom right');
  });

  it('crops an unattributed background the way the renderer resolves it', async () => {
    // The canvas used to hardcode `center` while the export left MJML to apply
    // `top center`, so a tall image previewed at a crop it would never be
    // delivered at. Both sides now read the same resolver, which is the
    // invariant worth pinning: the renderer emits these values too.
    const row = createRow([createColumn()]);
    row.attributes.backgroundImage = '/hero.jpg';

    const style = await mountCanvasRow(row);
    const resolved = resolveRowBackground(row)!;

    expect(resolved.position).toBe('top center');
    expect(style).toContain(`background-position: ${resolved.position}`);
    expect(style).toContain(`background-size: ${resolved.size}`);
    expect(style).toContain(`background-repeat: ${resolved.repeat}`);
  });

  it('paints no background image when the row has none', async () => {
    const style = await mountCanvasRow(createRow([createColumn()]));

    expect(style).not.toContain('background-image');
  });
});

describe('row panel background controls', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('stays hidden until the row has a background image', async () => {
    const el = await mountPanel(createRow([createColumn()]));

    expect(el.shadowRoot!.querySelectorAll('select').length).toBe(0);
  });

  it('emits the chosen repeat, size and position', async () => {
    const row = createRow([createColumn()]);
    row.attributes.backgroundImage = '/bg.png';
    const el = await mountPanel(row);
    const events: CustomEvent[] = [];
    el.addEventListener('row-property-change', (e) => events.push(e as CustomEvent));

    const selects = [...el.shadowRoot!.querySelectorAll('select')] as HTMLSelectElement[];
    const size = el.shadowRoot!.querySelector('input[placeholder="cover"]') as HTMLInputElement;

    selects[0].value = 'repeat';
    selects[0].dispatchEvent(new Event('change'));
    size.value = ' contain ';
    size.dispatchEvent(new Event('change'));
    selects[1].value = 'bottom center';
    selects[1].dispatchEvent(new Event('change'));

    expect(events.map((e) => e.detail.attributes)).toEqual([
      { backgroundRepeat: 'repeat' },
      { backgroundSize: 'contain' },
      { backgroundPosition: 'bottom center' },
    ]);
  });

  it('clears the size back to the default when emptied', async () => {
    const row = createRow([createColumn()]);
    Object.assign(row.attributes, { backgroundImage: '/bg.png', backgroundSize: 'contain' });
    const el = await mountPanel(row);
    const events: CustomEvent[] = [];
    el.addEventListener('row-property-change', (e) => events.push(e as CustomEvent));

    const size = el.shadowRoot!.querySelector('input[placeholder="cover"]') as HTMLInputElement;
    size.value = '';
    size.dispatchEvent(new Event('change'));

    expect(events[0].detail.attributes).toEqual({ backgroundSize: undefined });
  });
});
