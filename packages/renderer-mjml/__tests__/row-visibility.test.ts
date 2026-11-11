import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { createDefaultDocument, createRow, createColumn, createBlock, type PigeonDocument } from '@lit-pigeon/core';
import { documentToMjml } from '../src/index.js';

function rowDoc(attrs: Record<string, unknown>): PigeonDocument {
  const doc = createDefaultDocument('Row visibility');
  const row = createRow([createColumn([createBlock('text')])]);
  Object.assign(row.attributes, attrs);
  doc.body.rows = [row];
  return doc;
}

/** The class MJML puts on the element carrying `css-class`, per compiled tag. */
function classedTags(html: string, cls: string): string[] {
  return [...html.matchAll(new RegExp(`<(\\w+)[^>]*class="[^"]*${cls}[^"]*"`, 'g'))].map((m) => m[1]);
}

describe('row-level device visibility', () => {
  it('adds the hide class to the section', () => {
    expect(documentToMjml(rowDoc({ hideOnMobile: true }))).toMatch(
      /<mj-section [^>]*css-class="pigeon-hide-mobile"/,
    );
  });

  it('merges with the row css-class', () => {
    expect(documentToMjml(rowDoc({ cssClass: 'promo', hideOnDesktop: true }))).toMatch(
      /<mj-section [^>]*css-class="promo pigeon-hide-desktop"/,
    );
  });

  it('emits the media query for a row that hides, with no column or block flags', () => {
    const mjml = documentToMjml(rowDoc({ hideOnDesktop: true }));
    expect(mjml).toContain('@media only screen and (max-width:479px)');
    expect(documentToMjml(rowDoc({}))).not.toContain('pigeon-hide');
  });

  it('hides a hero row, which renders as mj-hero rather than a section', () => {
    const doc = createDefaultDocument('Hero row');
    const row = createRow([createColumn([createBlock('hero')])]);
    row.attributes.hideOnMobile = true;
    doc.body.rows = [row];
    expect(documentToMjml(doc)).toMatch(/<mj-hero [^>]*css-class="pigeon-hide-mobile"/);
  });

  it('unions the row and hero flags rather than letting one win', () => {
    const doc = createDefaultDocument('Hero row');
    const row = createRow([createColumn([createBlock('hero', { hideOnDesktop: true })])]);
    row.attributes.hideOnMobile = true;
    doc.body.rows = [row];
    expect(documentToMjml(doc)).toMatch(/<mj-hero [^>]*css-class="pigeon-hide-mobile pigeon-hide-desktop"/);
  });

  // MJML wraps a full-width section in a table and a normal one in a div, so a
  // restore rule naming only td and div leaves a hidden full-width row hidden
  // on mobile too.
  it('restores a full-width row on mobile, which MJML renders as a table', () => {
    const { html, errors } = mjml2html(documentToMjml(rowDoc({ fullWidth: true, hideOnDesktop: true })));
    expect(errors).toEqual([]);
    expect(classedTags(html, 'pigeon-hide-desktop')).toContain('table');
    expect(html).toContain('table.pigeon-hide-desktop { display: table !important; }');
  });

  it('restores a normal row on mobile, which MJML renders as a div', () => {
    const { html, errors } = mjml2html(documentToMjml(rowDoc({ hideOnDesktop: true })));
    expect(errors).toEqual([]);
    expect(classedTags(html, 'pigeon-hide-desktop')).toContain('div');
    expect(html).toContain('div.pigeon-hide-desktop { display: block !important; }');
  });

  it('keeps a full-width row hidden on mobile when it hides on both', () => {
    const { html } = mjml2html(documentToMjml(rowDoc({ fullWidth: true, hideOnMobile: true, hideOnDesktop: true })));
    const media = html.slice(html.indexOf('@media only screen and (max-width:479px)'));
    expect(media.indexOf('table.pigeon-hide-mobile')).toBeGreaterThan(media.indexOf('table.pigeon-hide-desktop'));
  });
});
