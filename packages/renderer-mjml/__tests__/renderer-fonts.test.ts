import { describe, it, expect } from 'vitest';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { FontDefinition } from '@lit-pigeon/core';
import { MjmlRenderer } from '../src/mjml-renderer.js';

const FONTS: FontDefinition[] = [
  { name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://fonts.googleapis.com/css?family=Inter' },
];

describe('MjmlRenderer font loading', () => {
  it('includes the registered font stylesheet URL in the rendered HTML head', async () => {
    const renderer = new MjmlRenderer();
    const result = await renderer.render(createDefaultDocument(), { fonts: FONTS });
    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('https://fonts.googleapis.com/css?family=Inter');
  });

  it('does not include any external font URL when no fonts are passed', async () => {
    const renderer = new MjmlRenderer();
    const result = await renderer.render(createDefaultDocument());
    expect(result.html).not.toContain('fonts.googleapis.com');
  });
});
