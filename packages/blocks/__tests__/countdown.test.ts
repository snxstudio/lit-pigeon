import { describe, it, expect } from 'vitest';
import { countdownBlock } from '../src/index.js';

const make = (values: Record<string, unknown> = {}) => ({
  id: 'b1',
  type: 'countdown',
  values: { ...countdownBlock.defaultValues, ...values },
});

describe('countdownBlock', () => {
  it('prefers an imageUrl when one is set', () => {
    const mjml = countdownBlock.renderMjml!(make({ imageUrl: 'https://x/c.png', href: 'https://shop/sale' }));
    expect(mjml).toContain('<mj-image');
    expect(mjml).toContain('href="https://shop/sale"');
  });

  it('falls back to an mj-text label when no imageUrl but a label is set', () => {
    const mjml = countdownBlock.renderMjml!(make({ endDateLabel: 'Sale ends Dec 31' }));
    expect(mjml).toContain('<mj-text');
    expect(mjml).toContain('Sale ends Dec 31');
  });

  it('emits a comment when nothing is configured', () => {
    const mjml = countdownBlock.renderMjml!(make());
    expect(mjml).toContain('<!--');
  });

  it('canvas renders a styled label when no image but a fallback exists', () => {
    const html = countdownBlock.renderCanvas!(make({ endDateLabel: 'Hurry' }));
    expect(html).toContain('Hurry');
    expect(html).toContain('⏱');
  });
});
