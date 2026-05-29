import { describe, it, expect } from 'vitest';
import { accordionBlock } from '../src/index.js';
import { __accordion_parse } from '../src/blocks/accordion.js';

const make = (values: Record<string, unknown> = {}) => ({
  id: 'b1',
  type: 'accordion',
  values: { ...accordionBlock.defaultValues, ...values },
});

describe('accordionBlock parsing', () => {
  it('splits "Title :: Body" pairs per line', () => {
    const items = __accordion_parse('A :: 1\nB :: 2');
    expect(items).toEqual([
      { title: 'A', body: '1' },
      { title: 'B', body: '2' },
    ]);
  });

  it('treats lines without `::` as title-only', () => {
    expect(__accordion_parse('A')).toEqual([{ title: 'A', body: '' }]);
  });

  it('ignores blank lines', () => {
    expect(__accordion_parse('A :: 1\n\nB :: 2')).toHaveLength(2);
  });
});

describe('accordionBlock rendering', () => {
  it('emits an mj-accordion with one element per item', () => {
    const mjml = accordionBlock.renderMjml!(make());
    expect(mjml).toContain('<mj-accordion');
    expect((mjml.match(/<mj-accordion-element>/g) ?? []).length).toBe(2);
    expect(mjml).toContain('icon-position="right"');
  });

  it('respects iconAlign in the MJML attribute', () => {
    const mjml = accordionBlock.renderMjml!(make({ iconAlign: 'left' }));
    expect(mjml).toContain('icon-position="left"');
  });

  it('renders all items expanded on canvas', () => {
    const html = accordionBlock.renderCanvas!(make());
    expect(html).toContain('Checkout is at 11am.');
    expect(html).toContain('breakfast');
  });

  it('emits a comment when no items', () => {
    const mjml = accordionBlock.renderMjml!(make({ items: '' }));
    expect(mjml).toContain('<!--');
  });
});
