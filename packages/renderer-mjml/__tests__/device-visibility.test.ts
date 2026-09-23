import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type BlockType,
  type PigeonDocument,
} from '@lit-pigeon/core';
import { documentToMjml } from '../src/index.js';
import { withCssClass } from '../src/utils/visibility.js';

function docWith(type: BlockType, values: Record<string, unknown>, columnAttrs: Record<string, unknown> = {}): PigeonDocument {
  const doc = createDefaultDocument('Visibility');
  const column = createColumn([createBlock(type, values)]);
  Object.assign(column.attributes, columnAttrs);
  doc.body.rows = [createRow([column, createColumn([createBlock('text')])])];
  return doc;
}

const ROOT_TAG: Record<string, RegExp> = {
  text: /<mj-text [^>]*css-class="pigeon-hide-mobile"/,
  image: /<mj-image [^>]*css-class="pigeon-hide-mobile"/,
  button: /<mj-button [^>]*css-class="pigeon-hide-mobile"/,
  divider: /<mj-divider [^>]*css-class="pigeon-hide-mobile"/,
  spacer: /<mj-spacer [^>]*css-class="pigeon-hide-mobile"/,
  social: /<mj-social [^>]*css-class="pigeon-hide-mobile"/,
  navbar: /<mj-navbar [^>]*css-class="pigeon-hide-mobile"/,
  hero: /<mj-text [^>]*css-class="pigeon-hide-mobile"/,
  html: /<mj-raw><div style="padding: [^"]*;" class="pigeon-hide-mobile">/,
};

describe('device visibility in MJML', () => {
  it.each(Object.entries(ROOT_TAG))('adds the hide class to a %s block root', (type, pattern) => {
    expect(documentToMjml(docWith(type as BlockType, { hideOnMobile: true }))).toMatch(pattern);
  });

  it('merges with an existing css-class and supports hide on desktop', () => {
    const mjml = documentToMjml(docWith('text', { cssClass: 'brand', hideOnDesktop: true }));
    expect(mjml).toMatch(/<mj-text [^>]*css-class="brand pigeon-hide-desktop"/);
  });

  it('adds the hide class to a column', () => {
    const mjml = documentToMjml(docWith('text', {}, { cssClass: 'col', hideOnMobile: true }));
    expect(mjml).toMatch(/<mj-column [^>]*css-class="col pigeon-hide-mobile"/);
  });

  it('adds the hide class to a hero rendered as mj-hero', () => {
    const doc = createDefaultDocument('Hero');
    doc.body.rows = [createRow([createColumn([createBlock('hero', { hideOnDesktop: true })])])];
    expect(documentToMjml(doc)).toMatch(/<mj-hero [^>]*css-class="pigeon-hide-desktop"/);
  });

  it('emits the visibility media query once, only when an element uses it', () => {
    const plain = docWith('text', {});
    expect(documentToMjml(plain)).not.toContain('pigeon-hide');

    const mjml = documentToMjml(docWith('text', { hideOnMobile: true }, { hideOnDesktop: true }));
    expect(mjml.match(/<mj-style>/g)).toHaveLength(1);
    expect(mjml).toContain('@media only screen and (max-width:479px)');
  });

  it('compiles to HTML that carries the classes and the media query', () => {
    const { html, errors } = mjml2html(documentToMjml(docWith('text', { hideOnMobile: true }, { hideOnDesktop: true })));
    expect(errors).toEqual([]);
    expect(html).toMatch(/class="[^"]*pigeon-hide-mobile/);
    expect(html).toMatch(/class="[^"]*pigeon-hide-desktop/);
    expect(html).toContain('pigeon-hide-desktop-outlook');
    expect(html).toContain('@media only screen and (max-width:479px)');
  });

  it('adds the class in linear time on markup built from repeated dashes', () => {
    const markup = `<mj-${'-'.repeat(50_000)}`;
    const start = performance.now();
    expect(withCssClass(markup, 'pigeon-hide-mobile')).toBe(markup);
    expect(withCssClass(`${markup}>`, 'x')).toBe(`${markup} css-class="x">`);
    expect(performance.now() - start).toBeLessThan(100);
  });

  it('keeps self-closing tags well formed', () => {
    expect(withCssClass('<mj-image src="a.png" />', 'x')).toBe('<mj-image src="a.png" css-class="x" />');
    expect(withCssClass('<mj-raw><div>x</div></mj-raw>', 'x')).toBe('<mj-raw><div>x</div></mj-raw>');
  });
});
