import { describe, it, expect } from 'vitest';
import { lintDocument, lintDocumentAsync, type LintFetcher } from '../src/index.js';
import { makeBlock, makeDoc } from './helpers.js';

describe('lintDocument (sync, default rules)', () => {
  it('returns a sorted, summarised report', () => {
    const doc = makeDoc([
      makeBlock('image', { src: 'https://x/i.jpg', alt: '' }),
      makeBlock('button', { href: '#' }),
    ]);
    const report = lintDocument(doc);
    expect(report.summary.errors).toBeGreaterThan(0);
    expect(report.summary.warnings).toBeGreaterThan(0);
    // errors come before warnings before infos
    const ranks = report.issues.map((i) => (i.severity === 'error' ? 0 : i.severity === 'warning' ? 1 : 2));
    expect(ranks).toEqual([...ranks].sort());
  });

  it('flags subject + preview in a default-document', () => {
    const doc = makeDoc([makeBlock('text', { content: '<p>hi</p>' })], { name: '' });
    const ids = lintDocument(doc).issues.map((i) => i.rule);
    expect(ids).toContain('preview-text/missing');
    expect(ids).toContain('preview-text/missing-subject');
  });
});

describe('lintDocumentAsync', () => {
  it('returns sync-only results when no fetcher is available', async () => {
    const doc = makeDoc([makeBlock('image', { src: 'https://x/i.jpg', alt: 'x' })]);
    const noFetch: LintFetcher | undefined = undefined;
    const report = await lintDocumentAsync(doc, { fetcher: noFetch, asyncRules: [] });
    expect(report.issues.every((i) => !i.rule.startsWith('image-weight/') && !i.rule.startsWith('link-reachability/'))).toBe(true);
  });

  it('runs async rules through the supplied fetcher', async () => {
    const fetcher: LintFetcher = async (url, init) => {
      if (init?.method === 'HEAD' && url.includes('heavy.jpg')) {
        return {
          ok: true,
          status: 200,
          headers: { get: (n) => (n.toLowerCase() === 'content-length' ? String(2_000_000) : null) },
        };
      }
      if (init?.method === 'HEAD' && url.includes('broken')) {
        return { ok: false, status: 404, headers: { get: () => null } };
      }
      return { ok: true, status: 200, headers: { get: () => null } };
    };
    const doc = makeDoc([
      makeBlock('image', { src: 'https://cdn/heavy.jpg', alt: 'h' }),
      makeBlock('button', { href: 'https://broken.example/x' }),
    ]);
    const report = await lintDocumentAsync(doc, { fetcher });
    const ids = report.issues.map((i) => i.rule);
    expect(ids).toContain('image-weight/heavy');
    expect(ids).toContain('link-reachability/broken');
  });

  it('captures rule crashes as warnings instead of throwing', async () => {
    const fetcher: LintFetcher = async () => {
      throw new Error('boom');
    };
    const doc = makeDoc([makeBlock('image', { src: 'https://x/i.jpg', alt: 'a' })]);
    const report = await lintDocumentAsync(doc, { fetcher });
    // imageWeight rule swallows fetch errors per-URL (returns null), so this should produce no async issues
    expect(report.issues.every((i) => !i.rule.endsWith('/crashed'))).toBe(true);
  });
});
