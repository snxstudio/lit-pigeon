import { describe, it, expect } from 'vitest';
import { loadGalleryTemplates } from '@lit-pigeon/core';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

const templates = await loadGalleryTemplates();

/**
 * The shipped gallery is the closest thing this repo has to real templates, and
 * their layouts are the part of a round trip a user notices first. Three of
 * these eight lost every uneven row before the parser read column widths — the
 * invoice's 8:4 line items all came back 6:6 — so they are worth asserting
 * directly rather than only through hand-written fixtures.
 */
describe('the gallery templates survive an MJML round trip', () => {
  it('ships templates to check', () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  it.each(templates.map((t) => [t.name, t] as const))('%s keeps its column ratios', (_name, template) => {
    const before = template.document.body.rows.map((r) => r.columnRatios);
    const { document: after } = mjmlToDocument(documentToMjml(template.document));
    expect(after.body.rows.map((r) => r.columnRatios)).toEqual(before);
  });

  it.each(templates.map((t) => [t.name, t] as const))('%s re-exports byte-identically', (_name, template) => {
    const once = documentToMjml(template.document);
    expect(documentToMjml(mjmlToDocument(once).document)).toBe(once);
  });
});
