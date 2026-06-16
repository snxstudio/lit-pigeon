import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { FontDefinition, Renderer } from '@lit-pigeon/core';
import '../src/components/preview/pigeon-preview.js';
import type { PigeonPreview } from '../src/components/preview/pigeon-preview.js';

const FONTS: FontDefinition[] = [{ name: 'Inter', family: 'Inter, sans-serif', url: 'https://x/inter.css' }];

describe('pigeon-preview font passing', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('passes the fonts option to documentToMjml and renderer.render', async () => {
    const documentToMjml = vi.fn((_doc, _opts?) => '<mjml></mjml>');
    const renderSpy = vi.fn(async (_doc, _opts?) => ({ html: '<html></html>', errors: [] }));
    const renderer: Renderer = { render: renderSpy };

    const container = document.createElement('div');
    document.body.appendChild(container);
    render(
      html`<pigeon-preview
        .doc=${createDefaultDocument()}
        .documentToMjml=${documentToMjml}
        .renderer=${renderer}
        .fonts=${FONTS}
        ?open=${false}
      ></pigeon-preview>`,
      container,
    );
    const el = container.querySelector('pigeon-preview') as PigeonPreview;
    await el.updateComplete;
    el.open = true;
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));

    expect(documentToMjml).toHaveBeenCalledWith(expect.anything(), { fonts: FONTS });
    expect(renderSpy).toHaveBeenCalledWith(expect.anything(), { fonts: FONTS });
  });
});
