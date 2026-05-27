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
    const btnBlock = createBlock('button', { content: '<p>Click me</p>', href: 'https://example.com' });
    doc.body.rows = [createRow([createColumn([btnBlock])])];
    const mjml = documentToMjml(doc);

    expect(mjml).toContain('<mj-button');
    expect(mjml).toContain('Click me');
    expect(mjml).toContain('href="https://example.com"');
    // Outer <p> is stripped — mj-button renders inline.
    expect(mjml).not.toMatch(/<mj-button[^>]*>\s*<p>/);
  });

  it('preserves inline HTML formatting inside the button content', () => {
    const doc = createDefaultDocument('Test');
    const btnBlock = createBlock('button', { content: '<p><strong>Buy</strong> now</p>' });
    doc.body.rows = [createRow([createColumn([btnBlock])])];
    const mjml = documentToMjml(doc);
    expect(mjml).toContain('<strong>Buy</strong> now');
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

  describe('html block injection safety', () => {
    it('should not allow </mj-raw> in content to break out of the raw block', () => {
      const doc = createDefaultDocument('Test');
      const malicious = '</mj-raw><mj-text>INJECTED</mj-text><mj-raw>';
      const htmlBlock = createBlock('html', { content: malicious });
      doc.body.rows = [createRow([createColumn([htmlBlock])])];
      // Disable Outlook workarounds so the only <mj-raw> blocks come from the
      // html block under test (the head emits its own <mj-raw> wrappers).
      const mjml = documentToMjml(doc, { outlookWorkarounds: false });

      const rawOpen = (mjml.match(/<mj-raw>/g) || []).length;
      const rawClose = (mjml.match(/<\/mj-raw>/g) || []).length;
      expect(rawOpen).toBe(1);
      expect(rawClose).toBe(1);

      expect(mjml).not.toMatch(/<\/mj-raw>\s*<mj-text>INJECTED<\/mj-text>/);
    });

    it('should neutralize case- and whitespace-variant closing tags', () => {
      const doc = createDefaultDocument('Test');
      const htmlBlock = createBlock('html', {
        content: '</ MJ-RAW ><mj-text>X</mj-text>< /mj-raw>',
      });
      doc.body.rows = [createRow([createColumn([htmlBlock])])];
      const mjml = documentToMjml(doc);

      const rawOpen = (mjml.match(/<mj-raw>/gi) || []).length;
      const rawClose = (mjml.match(/<\/\s*mj-raw\s*>/gi) || []).length;
      expect(rawOpen).toBe(rawClose);
    });

    it('should preserve benign html content unchanged', () => {
      const doc = createDefaultDocument('Test');
      const htmlBlock = createBlock('html', {
        content: '<div class="my-widget">Hello <strong>world</strong></div>',
      });
      doc.body.rows = [createRow([createColumn([htmlBlock])])];
      const mjml = documentToMjml(doc);

      expect(mjml).toContain('<div class="my-widget">');
      expect(mjml).toContain('Hello <strong>world</strong>');
    });
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

  describe('Outlook and dark-mode workarounds', () => {
    it('emits the heading-margin reset <mj-style> by default', () => {
      const doc = createDefaultDocument('Test');
      const mjml = documentToMjml(doc);

      expect(mjml).toContain('<mj-style inline="inline">');
      expect(mjml).toMatch(/h1,\s*h2,\s*h3,\s*blockquote\s*\{\s*margin:\s*0 0 0\.5em;?\s*\}/);
    });

    it('emits both dark-mode color-scheme <meta> tags by default', () => {
      const doc = createDefaultDocument('Test');
      const mjml = documentToMjml(doc);

      expect(mjml).toContain('<meta name="color-scheme" content="light dark"');
      expect(mjml).toContain('<meta name="supported-color-schemes" content="light dark"');
    });

    it('emits the [if mso] conditional block at the top of <mj-head>', () => {
      const doc = createDefaultDocument('Test');
      const mjml = documentToMjml(doc);

      expect(mjml).toContain('<!--[if mso]>');
      expect(mjml).toContain('<![endif]-->');
      // Arial fallback only fires inside MSO.
      expect(mjml).toMatch(/<!--\[if mso\]>[\s\S]*font-family:\s*Arial,\s*Helvetica,\s*sans-serif[\s\S]*<!\[endif\]-->/);
      // blockquote margin reset inside the mso block.
      expect(mjml).toMatch(/<!--\[if mso\]>[\s\S]*blockquote\s*\{\s*margin:\s*0 0 16px\s*!important;?\s*\}[\s\S]*<!\[endif\]-->/);

      // mj-raw containing the mso conditional should appear inside mj-head.
      const headMatch = mjml.match(/<mj-head>[\s\S]*?<\/mj-head>/);
      expect(headMatch).not.toBeNull();
      expect(headMatch?.[0]).toContain('<!--[if mso]>');
    });

    it('omits all three workarounds when outlookWorkarounds is false', () => {
      const doc = createDefaultDocument('Test');
      const mjml = documentToMjml(doc, { outlookWorkarounds: false });

      expect(mjml).not.toContain('<mj-style');
      expect(mjml).not.toContain('color-scheme');
      expect(mjml).not.toContain('supported-color-schemes');
      expect(mjml).not.toContain('<!--[if mso]>');
    });

    it('MjmlRenderer forwards outlookWorkarounds: false to documentToMjml', async () => {
      const renderer = new MjmlRenderer();
      const doc = createDefaultDocument('Test');

      const withWorkarounds = await renderer.render(doc);
      const withoutWorkarounds = await renderer.render(doc, { outlookWorkarounds: false });

      expect(withWorkarounds.errors).toEqual([]);
      expect(withoutWorkarounds.errors).toEqual([]);

      // The Arial fallback inside our mso conditional and the color-scheme
      // meta tags only appear when the workarounds are enabled. (MJML emits
      // its own unrelated [if mso] block for OfficeDocumentSettings, so we
      // probe for our specific markers instead.)
      expect(withWorkarounds.html).toMatch(/font-family:\s*Arial,\s*Helvetica,\s*sans-serif/);
      expect(withWorkarounds.html).toContain('color-scheme');
      expect(withoutWorkarounds.html).not.toMatch(/font-family:\s*Arial,\s*Helvetica,\s*sans-serif/);
      expect(withoutWorkarounds.html).not.toContain('color-scheme');
    });

    it('renders Arial font-family fallback inside the [if mso] block in the final HTML', async () => {
      const renderer = new MjmlRenderer();
      const doc = createDefaultDocument('Test');
      const result = await renderer.render(doc);

      expect(result.errors).toEqual([]);
      // The mso conditional content (including Arial fallback) is preserved into the HTML output.
      expect(result.html).toMatch(/<!--\[if mso\]>[\s\S]*font-family:\s*Arial,\s*Helvetica,\s*sans-serif[\s\S]*<!\[endif\]-->/);
    });
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
