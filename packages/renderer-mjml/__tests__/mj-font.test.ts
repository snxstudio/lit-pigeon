import { describe, it, expect } from 'vitest';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { FontDefinition } from '@lit-pigeon/core';
import { documentToMjml } from '../src/document-to-mjml.js';

const FONTS: FontDefinition[] = [
  { name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://fonts.example/inter.css' },
  { name: 'No URL', family: 'NoUrl, serif' },
];

describe('documentToMjml <mj-font> emission', () => {
  it('emits <mj-font> with the primary family token as name for url fonts', () => {
    const mjml = documentToMjml(createDefaultDocument(), { fonts: FONTS });
    expect(mjml).toContain('<mj-font name="Inter" href="https://fonts.example/inter.css" />');
  });

  it('skips fonts without a url', () => {
    const mjml = documentToMjml(createDefaultDocument(), { fonts: FONTS });
    expect(mjml).not.toContain('NoUrl');
  });

  it('dedupes by href', () => {
    const dup: FontDefinition[] = [
      { name: 'A', family: 'Inter, sans-serif', url: 'https://x/u1.css' },
      { name: 'B', family: 'Inter Tight, sans-serif', url: 'https://x/u1.css' },
    ];
    const mjml = documentToMjml(createDefaultDocument(), { fonts: dup });
    expect((mjml.match(/<mj-font /g) ?? []).length).toBe(1);
  });

  it('emits no <mj-font> when no fonts option is given', () => {
    const mjml = documentToMjml(createDefaultDocument());
    expect(mjml).not.toContain('<mj-font');
  });

  it('places <mj-font> before <mj-attributes>', () => {
    const mjml = documentToMjml(createDefaultDocument(), { fonts: FONTS });
    expect(mjml.indexOf('<mj-font')).toBeLessThan(mjml.indexOf('<mj-attributes>'));
  });
});
