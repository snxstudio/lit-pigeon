import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createBlock } from '@lit-pigeon/core';
import type { ImageBlock, AssetManagerConfig } from '@lit-pigeon/core';
import '../src/components/properties/panels/image-panel.js';
import type { PigeonImagePanel } from '../src/components/properties/panels/image-panel.js';

async function mount(
  block: ImageBlock,
  assetManagerConfig?: AssetManagerConfig,
): Promise<PigeonImagePanel> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-image-panel
      .block=${block}
      rowId="r1"
      columnId="c1"
      .assetManagerConfig=${assetManagerConfig}
    ></pigeon-image-panel>`,
    container,
  );
  const panel = container.querySelector('pigeon-image-panel') as PigeonImagePanel;
  await panel.updateComplete;
  return panel;
}

function makeBlock(): ImageBlock {
  return createBlock('image', { src: 'https://x/y.png', alt: 'hi' }) as ImageBlock;
}

describe('pigeon-image-panel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the "Upload Image" button by default', async () => {
    const panel = await mount(makeBlock());
    expect(panel.shadowRoot!.querySelector('.upload-btn')).toBeTruthy();
  });

  it('hides the "Upload Image" button when assetManagerConfig.enabled === false', async () => {
    const panel = await mount(makeBlock(), { enabled: false });
    expect(panel.shadowRoot!.querySelector('.upload-btn')).toBeNull();
  });

  it('emits property-change with the new src when the URL input changes', async () => {
    const panel = await mount(makeBlock());
    let detail: { values?: { src?: string } } | null = null;
    panel.addEventListener('property-change', (e) => {
      detail = (e as CustomEvent).detail;
    });

    const input = panel.shadowRoot!.querySelector('input[type=url]') as HTMLInputElement;
    input.value = 'https://new/img.png';
    input.dispatchEvent(new Event('change'));

    expect(detail).not.toBeNull();
    expect(detail!.values!.src).toBe('https://new/img.png');
  });
});
