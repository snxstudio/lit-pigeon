import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { getStarterTemplates, loadGalleryTemplates } from '@lit-pigeon/core';
import { documentToMjml } from '../src/index.js';

const starters = [...getStarterTemplates(), ...(await loadGalleryTemplates())];

describe('starter templates compile through MJML', () => {
  it.each(starters.map((t) => [t.id, t] as const))('%s has no MJML validation errors', (_id, template) => {
    // `strict` throws on any validation error instead of collecting it.
    const { html } = mjml2html(documentToMjml(template.document), { validationLevel: 'strict' });
    expect(html).toContain('<!doctype html>');
  });
});
