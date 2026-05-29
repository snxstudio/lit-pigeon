import { describe, it, expect } from 'vitest';
import { carouselBlock } from '../src/index.js';
import { __carousel_parse } from '../src/blocks/carousel.js';

const make = (values: Record<string, unknown> = {}) => ({
  id: 'b1',
  type: 'carousel',
  values: { ...carouselBlock.defaultValues, ...values },
});

describe('carouselBlock parsing', () => {
  it('reads `src | alt | href` per line, all three optional after src', () => {
    expect(__carousel_parse('a.jpg | First | https://x')).toEqual([
      { src: 'a.jpg', alt: 'First', href: 'https://x' },
    ]);
    expect(__carousel_parse('a.jpg')).toEqual([{ src: 'a.jpg', alt: '', href: '' }]);
  });
});

describe('carouselBlock rendering', () => {
  it('emits one mj-carousel-image per row', () => {
    const mjml = carouselBlock.renderMjml!(make({ images: 'a.jpg\nb.jpg | B' }));
    expect((mjml.match(/<mj-carousel-image/g) ?? []).length).toBe(2);
    expect(mjml).toContain('src="a.jpg"');
    expect(mjml).toContain('alt="B"');
  });

  it('omits thumbnails attribute when visible', () => {
    const mjml = carouselBlock.renderMjml!(make({ images: 'a.jpg' }));
    expect(mjml).not.toContain('thumbnails=');
  });

  it('adds thumbnails="hidden" when hidden', () => {
    const mjml = carouselBlock.renderMjml!(make({ images: 'a.jpg', thumbnails: 'hidden' }));
    expect(mjml).toContain('thumbnails="hidden"');
  });

  it('canvas shows the first image with a 1/N badge', () => {
    const html = carouselBlock.renderCanvas!(make({ images: 'a.jpg\nb.jpg\nc.jpg' }));
    expect(html).toContain('src="a.jpg"');
    expect(html).toContain('1/3');
  });

  it('canvas shows the empty-state hint when no images', () => {
    const html = carouselBlock.renderCanvas!(make({ images: '' }));
    expect(html).toContain('Add one image URL');
  });
});
