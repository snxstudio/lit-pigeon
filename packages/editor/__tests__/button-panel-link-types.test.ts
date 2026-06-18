import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createBlock, SYSTEM_LINK_TYPES } from '@lit-pigeon/core';
import type { ButtonBlock } from '@lit-pigeon/core';
import '../src/components/properties/panels/button-panel.js';
import type { PigeonButtonPanel } from '../src/components/properties/panels/button-panel.js';

describe('pigeon-button-panel link types', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('emits property-change with the href from a link-type-select', async () => {
    const block = createBlock('button') as ButtonBlock;
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(html`<pigeon-button-panel .block=${block} .linkTypes=${SYSTEM_LINK_TYPES}></pigeon-button-panel>`, container);
    const panel = container.querySelector('pigeon-button-panel') as PigeonButtonPanel;
    await panel.updateComplete;
    const events: CustomEvent[] = [];
    panel.addEventListener('property-change', (e) => events.push(e as CustomEvent));
    panel.shadowRoot!.querySelector('pigeon-link-type-picker')!
      .dispatchEvent(new CustomEvent('link-type-select', { detail: { href: '{{unsubscribe_url}}' }, bubbles: true, composed: true }));
    expect(events[0].detail.values).toEqual({ href: '{{unsubscribe_url}}' });
  });
});
