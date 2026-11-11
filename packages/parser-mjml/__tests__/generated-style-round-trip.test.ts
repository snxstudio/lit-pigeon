import { describe, it, expect } from 'vitest';
import { createBlock, createColumn, createDefaultDocument, createRow, generatedStyleName } from '@lit-pigeon/core';
import type { PigeonDocument } from '@lit-pigeon/core';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

function hidingDocument(): PigeonDocument {
  const doc = createDefaultDocument('Visibility');
  doc.body.rows = [
    createRow([createColumn([createBlock('text', { content: '<p>Desktop only</p>', hideOnMobile: true })])], [12]),
  ];
  return doc;
}

describe('generated style blocks', () => {
  it('marks the visibility block so it is recognisable', () => {
    const mjml = documentToMjml(hidingDocument());
    expect(mjml).toContain('/* pigeon-generated: visibility */');
  });

  it('does not collect the visibility block as document CSS', () => {
    const doc = mjmlToDocument(documentToMjml(hidingDocument())).document;
    expect(doc.body.attributes.css).toBeUndefined();
  });

  it('keeps the hide flags, which is what the block was there for', () => {
    const doc = mjmlToDocument(documentToMjml(hidingDocument())).document;
    expect(doc.body.rows[0].columns[0].blocks[0].values.hideOnMobile).toBe(true);
  });

  it('does not grow the document on repeated export/import cycles', () => {
    // Every cycle used to copy ~400 bytes of generated CSS into
    // body.attributes.css, and the export after that emitted it twice.
    let doc = hidingDocument();
    const first = documentToMjml(doc);

    for (let i = 0; i < 5; i++) {
      doc = mjmlToDocument(documentToMjml(doc)).document;
    }

    expect(documentToMjml(doc)).toBe(first);
    expect(doc.body.attributes.css).toBeUndefined();
  });

  it('still collects CSS the user wrote, alongside a generated block', () => {
    const doc = hidingDocument();
    doc.body.attributes.css = '.promo { padding: 0; }';
    const again = mjmlToDocument(documentToMjml(doc)).document;

    expect(again.body.attributes.css).toBe('.promo { padding: 0; }');
    expect(documentToMjml(again)).toBe(documentToMjml(doc));
  });

  it('drops a generated block it has no field to put back, rather than keeping it as CSS', () => {
    // A block from a newer renderer than this parser: skipped, not collected,
    // because the renderer that understands it will emit it again anyway.
    const { document } = mjmlToDocument(
      `<mjml><mj-head>
        <mj-style>/* pigeon-generated: something-new */ .x { color: red; }</mj-style>
      </mj-head><mj-body><mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-body></mjml>`,
    );
    expect(document.body.attributes.css).toBeUndefined();
  });
});

describe('generatedStyleName', () => {
  it('reads the name out of a marked block', () => {
    expect(generatedStyleName('/* pigeon-generated: visibility */\n.x {}')).toBe('visibility');
    expect(generatedStyleName('  \n  /* pigeon-generated:link-style */')).toBe('link-style');
  });

  it('does not claim CSS the renderer did not write', () => {
    expect(generatedStyleName('.x { color: red; }')).toBeUndefined();
    expect(generatedStyleName('/* hand-written */ .x {}')).toBeUndefined();
    // Only the opening comment counts, or a user could be robbed of their CSS
    // by pasting the marker further down.
    expect(generatedStyleName('.x {} /* pigeon-generated: visibility */')).toBeUndefined();
  });
});
