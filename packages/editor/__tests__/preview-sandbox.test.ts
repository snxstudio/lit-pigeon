import { describe, it, expect, afterEach } from 'vitest';
import { createDefaultDocument } from '@lit-pigeon/core';
import '../src/components/preview/pigeon-preview.js';
import type { PigeonPreview } from '../src/components/preview/pigeon-preview.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('preview iframe', () => {
  it('is sandboxed so rendered email markup cannot run script or share the host origin', async () => {
    const el = document.createElement('pigeon-preview') as PigeonPreview;
    el.doc = createDefaultDocument('Test');
    document.body.appendChild(el);
    el.open = true;
    await el.updateComplete;

    const iframe = el.renderRoot.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.hasAttribute('sandbox')).toBe(true);
    const tokens = (iframe.getAttribute('sandbox') ?? '').split(/\s+/);
    expect(tokens).not.toContain('allow-scripts');
    expect(tokens).not.toContain('allow-same-origin');
  });
});
