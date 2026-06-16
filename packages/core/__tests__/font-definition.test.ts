import { describe, it, expect } from 'vitest';
import type { FontDefinition, EditorConfig, RenderOptions } from '../src/index.js';

describe('FontDefinition', () => {
  it('is exported and structurally usable in config + render options', () => {
    const font: FontDefinition = { name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://x/inter.css' };
    const cfg: EditorConfig = { fontConfig: [font] };
    const opts: RenderOptions = { fonts: [font] };
    expect(cfg.fontConfig?.[0].family).toBe('Inter, Arial, sans-serif');
    expect(opts.fonts?.[0].name).toBe('Inter');
    const bare: FontDefinition = { name: 'Serif', family: 'Georgia, serif' };
    expect(bare.url).toBeUndefined();
  });
});
