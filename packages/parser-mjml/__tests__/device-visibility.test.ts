import { describe, it, expect } from 'vitest';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type BlockType,
  type ContentBlock,
} from '@lit-pigeon/core';
import { mjmlToDocument } from '../src/index.js';

function firstBlock(mjml: string): ContentBlock {
  return mjmlToDocument(mjml).document.body.rows[0].columns[0].blocks[0];
}

describe('device visibility on import', () => {
  it.each(['text', 'image', 'button', 'divider', 'spacer', 'social', 'navbar', 'html'])(
    'round-trips hide flags on a %s block without warnings',
    (type) => {
      const doc = createDefaultDocument('RT');
      doc.body.rows = [createRow([createColumn([createBlock(type as BlockType, { hideOnMobile: true, hideOnDesktop: true })])])];
      const result = mjmlToDocument(documentToMjml(doc));
      const block = result.document.body.rows[0].columns[0].blocks[0];
      expect(block.type).toBe(type);
      expect(block.values).toMatchObject({ hideOnMobile: true, hideOnDesktop: true });
      expect((block.values as { cssClass?: string }).cssClass).toBeUndefined();
      expect(result.warnings.filter((w) => w.message.includes('css-class'))).toEqual([]);
    },
  );

  it('round-trips an html block without flags through its lp-html wrapper', () => {
    const doc = createDefaultDocument('Html');
    doc.body.rows = [createRow([createColumn([createBlock('html', { content: '<p>Raw</p>', padding: { top: 4, right: 0, bottom: 4, left: 0 } })])])];
    const block = firstBlock(documentToMjml(doc));
    expect(block.values).toEqual({ content: '<p>Raw</p>', padding: { top: 4, right: 0, bottom: 4, left: 0 } });
  });

  it('round-trips a hero section', () => {
    const doc = createDefaultDocument('Hero');
    doc.body.rows = [createRow([createColumn([createBlock('hero', { hideOnDesktop: true })])])];
    const block = firstBlock(documentToMjml(doc));
    expect(block.type).toBe('hero');
    expect(block.values).toMatchObject({ hideOnDesktop: true });
  });

  it('separates hide classes from other css classes on blocks and columns', () => {
    const block = firstBlock(`<mjml><mj-body><mj-section>
      <mj-column css-class="col pigeon-hide-desktop"><mj-text css-class="pigeon-hide-mobile brand">Hi</mj-text></mj-column>
    </mj-section></mj-body></mjml>`);
    expect(block.values).toMatchObject({ hideOnMobile: true, cssClass: 'brand' });
    expect((block.values as { hideOnDesktop?: boolean }).hideOnDesktop).toBeUndefined();

    const column = mjmlToDocument(`<mjml><mj-body><mj-section>
      <mj-column css-class="col pigeon-hide-desktop"><mj-text>Hi</mj-text></mj-column>
    </mj-section></mj-body></mjml>`).document.body.rows[0].columns[0];
    expect(column.attributes).toMatchObject({ hideOnDesktop: true, cssClass: 'col' });
  });

  it('leaves hide classes on a section in its cssClass', () => {
    const row = mjmlToDocument('<mjml><mj-body><mj-section css-class="pigeon-hide-mobile"><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-body></mjml>').document.body.rows[0];
    expect(row.attributes.cssClass).toBe('pigeon-hide-mobile');
  });

  it('adds no visibility fields to elements without hide classes', () => {
    const block = firstBlock('<mjml><mj-body><mj-section><mj-column><mj-text css-class="brand">Hi</mj-text></mj-column></mj-section></mj-body></mjml>');
    expect(block.values).not.toHaveProperty('hideOnMobile');
    expect(block.values).not.toHaveProperty('hideOnDesktop');
  });
});
