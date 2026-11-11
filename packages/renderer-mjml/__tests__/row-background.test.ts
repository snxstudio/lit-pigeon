import { describe, it, expect } from 'vitest';
import { createDefaultDocument, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import type { RowNode } from '@lit-pigeon/core';
import { documentToMjml } from '../src/index.js';

function docWithRowBackground(attributes: Partial<RowNode['attributes']>) {
  const doc = createDefaultDocument('Test');
  const row = createRow([createColumn([createBlock('text')])]);
  Object.assign(row.attributes, attributes);
  doc.body.rows = [row];
  return doc;
}

function sectionAttrs(mjml: string): Record<string, string> {
  const tag = /<mj-section ([^>]*)>/.exec(mjml);
  if (!tag) throw new Error('no mj-section in output');
  return Object.fromEntries(
    [...tag[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]),
  );
}

describe('row background image → MJML', () => {
  it('emits the row’s own repeat, size and position', () => {
    const mjml = documentToMjml(docWithRowBackground({
      backgroundImage: 'https://example.com/pattern.png',
      backgroundRepeat: 'repeat',
      backgroundSize: 'auto',
      backgroundPosition: 'center center',
    }));

    expect(sectionAttrs(mjml)).toMatchObject({
      'background-url': 'https://example.com/pattern.png',
      'background-repeat': 'repeat',
      'background-size': 'auto',
      'background-position': 'center center',
    });
  });

  it('keeps the legacy cover/no-repeat meaning for a document that predates the attributes', () => {
    // Documents written before these fields existed rendered as cover/no-repeat
    // with MJML's own `top center`. Widening the schema must not re-crop them.
    const mjml = documentToMjml(docWithRowBackground({
      backgroundImage: 'https://example.com/hero.jpg',
    }));

    expect(sectionAttrs(mjml)).toMatchObject({
      'background-size': 'cover',
      'background-repeat': 'no-repeat',
      'background-position': 'top center',
    });
  });

  it('emits no background attributes when the row has no image', () => {
    const attrs = sectionAttrs(documentToMjml(docWithRowBackground({})));

    expect(attrs['background-url']).toBeUndefined();
    expect(attrs['background-repeat']).toBeUndefined();
    expect(attrs['background-size']).toBeUndefined();
    expect(attrs['background-position']).toBeUndefined();
  });

  it('escapes a background URL that would otherwise break out of the attribute', () => {
    const mjml = documentToMjml(docWithRowBackground({
      backgroundImage: 'https://example.com/a".png',
    }));

    expect(mjml).not.toContain('background-url="https://example.com/a".png"');
  });
});
