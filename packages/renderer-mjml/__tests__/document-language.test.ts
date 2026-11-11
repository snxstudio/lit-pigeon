import { describe, it, expect } from 'vitest';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { PigeonDocument } from '@lit-pigeon/core';
import { documentToMjml } from '../src/document-to-mjml.js';
import { MjmlRenderer } from '../src/mjml-renderer.js';

function doc(attrs: Partial<PigeonDocument['body']['attributes']>, name = 'Order confirmed'): PigeonDocument {
  const d = createDefaultDocument(name);
  Object.assign(d.body.attributes, attrs);
  return d;
}

const htmlTag = (html: string) => html.match(/<html[^>]*>/)![0];
// Webmail strips <html>, so MJML repeats lang/dir on a role="article" wrapper.
const articleTag = (html: string) => html.match(/<div[^>]*role="article"[^>]*>/s)![0];

describe('document language and direction', () => {
  it('emits lang and dir on the mjml root', () => {
    const mjml = documentToMjml(doc({ language: 'pt-BR' }));
    expect(mjml).toContain('<mjml lang="pt-BR" dir="ltr">');
  });

  it('reaches both the html tag and the article wrapper', async () => {
    const { html, errors } = await new MjmlRenderer().render(doc({ language: 'ar' }));
    expect(errors).toHaveLength(0);
    expect(htmlTag(html)).toContain('lang="ar"');
    expect(htmlTag(html)).toContain('dir="rtl"');
    expect(articleTag(html)).toContain('lang="ar"');
    expect(articleTag(html)).toContain('dir="rtl"');
  });

  it('derives rtl from the language without an explicit direction', () => {
    expect(documentToMjml(doc({ language: 'he' }))).toContain('dir="rtl"');
  });

  it('lets an explicit direction override the language default', () => {
    const mjml = documentToMjml(doc({ language: 'ar', direction: 'ltr' }));
    expect(mjml).toContain('<mjml lang="ar" dir="ltr">');
  });

  it('emits dir alone when only a direction is set', () => {
    expect(documentToMjml(doc({ direction: 'rtl' }))).toContain('<mjml dir="rtl">');
  });

  it('leaves the root bare when neither is set, keeping MJML lang="und"', async () => {
    const d = doc({});
    expect(documentToMjml(d)).toContain('<mjml>');
    const { html } = await new MjmlRenderer().render(d);
    expect(htmlTag(html)).toContain('lang="und"');
  });

  it('escapes a language that carries markup', () => {
    expect(documentToMjml(doc({ language: 'en"><script>' }))).toContain('lang="en&quot;&gt;&lt;script&gt;"');
  });
});

describe('document title', () => {
  it('renders metadata.name as mj-title and the wrapper aria-label', async () => {
    const { html, errors } = await new MjmlRenderer().render(doc({}, 'Order confirmed'));
    expect(errors).toHaveLength(0);
    expect(html).toContain('<title>Order confirmed</title>');
    expect(articleTag(html)).toContain('aria-label="Order confirmed"');
  });

  it('escapes markup in the name', () => {
    expect(documentToMjml(doc({}, 'Tom & <b>Jerry</b>')))
      .toContain('<mj-title>Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;</mj-title>');
  });

  it('omits mj-title for a document with a blank name', () => {
    expect(documentToMjml(doc({}, '   '))).not.toContain('mj-title');
  });
});
