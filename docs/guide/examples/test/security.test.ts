// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getStarterTemplates, type PigeonDocument } from '@lit-pigeon/core';
import { checkDocument } from '../src/security/check-document.js';
import { starter } from './helpers.js';

const firstBlockValues = (doc: PigeonDocument) => doc.body.rows[1].columns[0].blocks[0].values as Record<string, unknown>;

describe('security: server-side document check', () => {
  it('accepts the starter templates', () => {
    for (const t of getStarterTemplates()) expect(checkDocument(t.document).problems).toEqual([]);
  });

  it('rejects script, event handlers and javascript: URLs', () => {
    const doc = starter();
    firstBlockValues(doc).content = '<p><img src=x onerror="alert(1)"></p>';
    expect(checkDocument(doc).problems).toEqual(['body.rows[1].columns[0].blocks[0].values.content: unsafe HTML']);
    const button = starter();
    const cta = button.body.rows[2].columns[0].blocks[0].values as Record<string, unknown>;
    cta.href = 'javascript:alert(1)';
    expect(checkDocument(button).problems).toContain('body.rows[2].columns[0].blocks[0].values.href: unsafe URL');
  });

  it('rejects values that would break out of an MJML attribute', () => {
    const doc = starter();
    doc.body.rows[0].attributes.backgroundColor = '#fff" css-class="x';
    doc.body.rows[1].attributes.condition = 'x}}{{> evil';
    expect(checkDocument(doc).problems).toEqual([
      'body.rows[0].attributes.backgroundColor: invalid colour',
      'body.rows[1].attributes.condition: unexpected characters',
    ]);
  });

  it('allows merge-tag hrefs and rejects invalid documents', () => {
    const doc = starter();
    (doc.body.rows[2].columns[0].blocks[0].values as Record<string, unknown>).href = '{{unsubscribe_url}}';
    expect(checkDocument(doc).problems).toEqual([]);
    expect(checkDocument({ version: '1.0' }).problems.length).toBeGreaterThan(0);
  });
});
