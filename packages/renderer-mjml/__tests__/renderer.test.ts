import { describe, it, expect } from 'vitest';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
} from '@lit-pigeon/core';
import { documentToMjml, MjmlRenderer } from '../src/index.js';

describe('documentToMjml', () => {
  it('should produce valid MJML for empty document', () => {
    const doc = createDefaultDocument('Test');
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('<mjml>');
    expect(mjml).toContain('<mj-head>');
    expect(mjml).toContain('<mj-body');
    expect(mjml).toContain('width="600px"');
    expect(mjml).toContain('</mjml>');
  });

  it('should include preview text', () => {
    const doc = createDefaultDocument('Test');
    doc.metadata.previewText = 'Hello preview';
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('<mj-preview>Hello preview</mj-preview>');
  });

  it('should render a row as mj-section', () => {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [createRow()];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('<mj-section');
    expect(mjml).toContain('<mj-column');
    expect(mjml).toContain('</mj-section>');
  });

  it('should render text block as mj-text', () => {
    const doc = createDefaultDocument('Test');
    const textBlock = createBlock('text', { content: '<p>Hello World</p>' });
    doc.body.rows = [createRow([createColumn([textBlock])])];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('<mj-text');
    expect(mjml).toContain('<p>Hello World</p>');
    expect(mjml).toContain('</mj-text>');
  });

  it('should render image block as mj-image', () => {
    const doc = createDefaultDocument('Test');
    const imgBlock = createBlock('image', {
      src: 'https://example.com/img.png',
      alt: 'Test image',
    });
    doc.body.rows = [createRow([createColumn([imgBlock])])];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('<mj-image');
    expect(mjml).toContain('src="https://example.com/img.png"');
    expect(mjml).toContain('alt="Test image"');
  });

  it('should render button block as mj-button', () => {
    const doc = createDefaultDocument('Test');
    const btnBlock = createBlock('button', { text: 'Click me', href: 'https://example.com' });
    doc.body.rows = [createRow([createColumn([btnBlock])])];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('<mj-button');
    expect(mjml).toContain('Click me');
    expect(mjml).toContain('href="https://example.com"');
  });

  it('should render divider block as mj-divider', () => {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [createRow([createColumn([createBlock('divider')])])];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('<mj-divider');
  });

  it('should render spacer block as mj-spacer', () => {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [createRow([createColumn([createBlock('spacer')])])];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('<mj-spacer');
  });

  it('should render html block as mj-raw', () => {
    const doc = createDefaultDocument('Test');
    const htmlBlock = createBlock('html', { content: '<div>Custom HTML</div>' });
    doc.body.rows = [createRow([createColumn([htmlBlock])])];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('<mj-raw');
    expect(mjml).toContain('Custom HTML');
  });

  it('should handle two-column layout', () => {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [
      createRow(
        [createColumn([createBlock('text')]), createColumn([createBlock('text')])],
        [6, 6],
      ),
    ];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('width="50%"');
    const columnCount = (mjml.match(/<mj-column/g) || []).length;
    expect(columnCount).toBe(2);
  });

  it('should handle column ratios correctly', () => {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [
      createRow(
        [createColumn(), createColumn()],
        [4, 8],
      ),
    ];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('width="33.33%"');
    expect(mjml).toContain('width="66.67%"');
  });

  it('should set row full-width attribute', () => {
    const row = createRow();
    row.attributes.fullWidth = true;
    const doc = createDefaultDocument('Test');
    doc.body.rows = [row];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('full-width="full-width"');
  });

  it('should set row background color', () => {
    const row = createRow();
    row.attributes.backgroundColor = '#ff0000';
    const doc = createDefaultDocument('Test');
    doc.body.rows = [row];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('background-color="#ff0000"');
  });
});

describe('MjmlRenderer', () => {
  it('should render empty document to HTML', async () => {
    const renderer = new MjmlRenderer();
    const doc = createDefaultDocument('Test');
    const result = await renderer.render(doc);

    expect(result.html).toContain('<!doctype html>');
    expect(result.html).toContain('</html>');
    expect(result.errors).toHaveLength(0);
  });

  it('should render document with content to HTML', async () => {
    const renderer = new MjmlRenderer();
    const doc = createDefaultDocument('Test');
    doc.body.rows = [
      createRow([
        createColumn([
          createBlock('text', { content: '<p>Hello email!</p>' }),
        ]),
      ]),
    ];

    const result = await renderer.render(doc);

    expect(result.html).toContain('Hello email!');
    expect(result.errors).toHaveLength(0);
  });

  it('should support minify option', async () => {
    const renderer = new MjmlRenderer();
    const doc = createDefaultDocument('Test');
    doc.body.rows = [createRow([createColumn([createBlock('text')])])];

    const normal = await renderer.render(doc);
    const minified = await renderer.render(doc, { minify: true });

    expect(minified.html.length).toBeLessThanOrEqual(normal.html.length);
  });
});
