import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentToMjml, MjmlRenderer } from '../src/index.js';
import type { PigeonDocument } from '@lit-pigeon/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = join(__dirname, '..', '..', '..', 'docs', 'ai-spec', 'examples');

function readDoc(name: string): PigeonDocument {
  return JSON.parse(readFileSync(join(EXAMPLES_DIR, `${name}.json`), 'utf8'));
}

describe('AI spec examples — render end-to-end', () => {
  it('welcome-email.json produces valid MJML containing the headline', () => {
    const doc = readDoc('welcome-email');
    const mjml = documentToMjml(doc);
    expect(mjml).toContain('<mjml>');
    expect(mjml).toContain('Welcome to Lumen');
    expect(mjml).toContain('Get started');
    expect(mjml).toContain('href="https://lumen.app/start"');
  });

  it('promo-email.json produces valid MJML with a two-column row', () => {
    const doc = readDoc('promo-email');
    const mjml = documentToMjml(doc);
    expect(mjml).toContain('SPRING30');
    // Two-column row → expect two mj-column elements within at least one mj-section.
    const sections = mjml.match(/<mj-section[\s\S]*?<\/mj-section>/g) ?? [];
    const twoColSection = sections.find((s) => (s.match(/<mj-column/g) ?? []).length === 2);
    expect(twoColSection).toBeDefined();
  });

  it('renderer produces email-safe HTML from each example', async () => {
    const renderer = new MjmlRenderer();
    for (const name of ['welcome-email', 'promo-email']) {
      const { html, errors } = await renderer.render(readDoc(name));
      expect(errors).toEqual([]);
      expect(html).toContain('<!doctype html>');
      // HTML should have inline styles (MJML's calling card).
      expect(html).toContain('style=');
    }
  });
});
