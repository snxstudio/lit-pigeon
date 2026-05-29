import { describe, it, expect } from 'vitest';
import { videoBlock } from '../src/index.js';

const make = (values: Record<string, unknown> = {}) => ({
  id: 'b1',
  type: 'video',
  values: { ...videoBlock.defaultValues, ...values },
});

describe('videoBlock', () => {
  it('exposes a propertySchema with 5 fields', () => {
    expect(videoBlock.propertySchema).toHaveLength(5);
    expect(videoBlock.propertySchema?.map((f) => f.key)).toEqual([
      'posterUrl',
      'videoUrl',
      'alt',
      'width',
      'playButtonColor',
    ]);
  });

  it('renderMjml emits a linked mj-image when poster + video URLs are set', () => {
    const mjml = videoBlock.renderMjml!(make({ posterUrl: 'p.jpg', videoUrl: 'https://v.com/x', width: 480 }));
    expect(mjml).toContain('<mj-image');
    expect(mjml).toContain('src="p.jpg"');
    expect(mjml).toContain('href="https://v.com/x"');
    expect(mjml).toContain('width="480px"');
  });

  it('renderMjml emits a comment when no posterUrl is set', () => {
    const mjml = videoBlock.renderMjml!(make());
    expect(mjml).toContain('<!--');
    expect(mjml).not.toContain('<mj-image');
  });

  it('renderCanvas shows a placeholder when no posterUrl', () => {
    const html = videoBlock.renderCanvas!(make());
    expect(html).toContain('Set a poster image');
  });

  it('renderCanvas overlays a play button when a poster is set', () => {
    const html = videoBlock.renderCanvas!(make({ posterUrl: 'p.jpg' }));
    expect(html).toContain('<img');
    expect(html).toContain('▶');
  });

  it('escapes user-provided URLs to prevent attribute injection', () => {
    const mjml = videoBlock.renderMjml!(make({ posterUrl: '"><x', videoUrl: '"><y' }));
    expect(mjml).not.toContain('"><x');
    expect(mjml).toContain('&quot;');
  });
});
