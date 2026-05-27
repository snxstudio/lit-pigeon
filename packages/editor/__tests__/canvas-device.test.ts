import { describe, it, expect, afterEach } from 'vitest';
import { createDefaultDocument, type PigeonDocument } from '@lit-pigeon/core';
import '../src/components/canvas/pigeon-canvas.js';
import type { PigeonCanvas } from '../src/components/canvas/pigeon-canvas.js';

async function mount(
  device: 'desktop' | 'tablet' | 'mobile',
  previewWidth: number,
): Promise<PigeonCanvas> {
  const doc: PigeonDocument = createDefaultDocument('Test');
  const el = document.createElement('pigeon-canvas') as PigeonCanvas;
  el.doc = doc;
  el.device = device;
  el.previewWidth = previewWidth;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('pigeon-canvas device preview', () => {
  it('renders no device frame on desktop', async () => {
    const el = await mount('desktop', 0);
    expect(el.renderRoot.querySelector('.device-frame')).toBeNull();
    expect(el.renderRoot.querySelector('.canvas-area')).not.toBeNull();
  });

  it('renders a mobile device frame at 375px', async () => {
    const el = await mount('mobile', 375);
    const frame = el.renderRoot.querySelector('.device-frame--mobile');
    expect(frame).not.toBeNull();
    expect(frame!.querySelector('.canvas-area')).not.toBeNull();
    expect(el.renderRoot.querySelector('.device-bar')?.textContent).toContain(
      '375px',
    );
  });

  it('renders a tablet device frame at 768px', async () => {
    const el = await mount('tablet', 768);
    expect(el.renderRoot.querySelector('.device-frame--tablet')).not.toBeNull();
    expect(el.renderRoot.querySelector('.device-bar')?.textContent).toContain(
      '768px',
    );
  });

  it('constrains the canvas-area width to the preview width', async () => {
    const el = await mount('mobile', 375);
    const area = el.renderRoot.querySelector('.canvas-area') as HTMLElement;
    expect(area.style.maxWidth).toBe('375px');
  });
});
