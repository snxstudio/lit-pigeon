import { describe, it, expect } from 'vitest';
import { mjmlToDocument } from '../src/index.js';

describe('mjmlToDocument', () => {
  it('should parse a minimal MJML document', () => {
    const mjml = `<mjml>
      <mj-head></mj-head>
      <mj-body width="600px"></mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    expect(result.document.version).toBe('1.0');
    expect(result.document.body.attributes.width).toBe(600);
    expect(result.document.body.rows).toHaveLength(0);
  });

  it('should parse preview text from head', () => {
    const mjml = `<mjml>
      <mj-head>
        <mj-preview>Hello preview</mj-preview>
      </mj-head>
      <mj-body></mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    expect(result.document.metadata.previewText).toBe('Hello preview');
  });

  it('should parse font-family from mj-attributes', () => {
    const mjml = `<mjml>
      <mj-head>
        <mj-attributes>
          <mj-all font-family="Georgia, serif" />
        </mj-attributes>
      </mj-head>
      <mj-body></mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    expect(result.document.body.attributes.fontFamily).toBe('Georgia, serif');
  });

  it('should parse a text block', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text align="center"><p>Hello World</p></mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    expect(result.document.body.rows).toHaveLength(1);
    const block = result.document.body.rows[0].columns[0].blocks[0];
    expect(block.type).toBe('text');
    if (block.type === 'text') {
      expect(block.values.content).toContain('Hello World');
      expect(block.values.textAlign).toBe('center');
    }
  });

  it('should parse an image block', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-image src="https://example.com/img.png" alt="Test" width="300px" />
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    const block = result.document.body.rows[0].columns[0].blocks[0];
    expect(block.type).toBe('image');
    if (block.type === 'image') {
      expect(block.values.src).toBe('https://example.com/img.png');
      expect(block.values.alt).toBe('Test');
      expect(block.values.width).toBe(300);
    }
  });

  it('should parse a button block', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-button href="https://example.com" background-color="#ff0000">Click me</mj-button>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    const block = result.document.body.rows[0].columns[0].blocks[0];
    expect(block.type).toBe('button');
    if (block.type === 'button') {
      expect(block.values.text).toBe('Click me');
      expect(block.values.href).toBe('https://example.com');
      expect(block.values.backgroundColor).toBe('#ff0000');
    }
  });

  it('should parse a divider block', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-divider border-color="#333" border-width="2px" border-style="dashed" />
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    const block = result.document.body.rows[0].columns[0].blocks[0];
    expect(block.type).toBe('divider');
    if (block.type === 'divider') {
      expect(block.values.borderColor).toBe('#333');
      expect(block.values.borderWidth).toBe(2);
      expect(block.values.borderStyle).toBe('dashed');
    }
  });

  it('should parse a spacer block', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-spacer height="50px" />
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    const block = result.document.body.rows[0].columns[0].blocks[0];
    expect(block.type).toBe('spacer');
    if (block.type === 'spacer') {
      expect(block.values.height).toBe(50);
    }
  });

  it('should parse a social block with elements', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-social icon-size="40px" align="center">
              <mj-social-element name="facebook" href="https://facebook.com">Facebook</mj-social-element>
              <mj-social-element name="twitter" href="https://twitter.com">Twitter</mj-social-element>
            </mj-social>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    const block = result.document.body.rows[0].columns[0].blocks[0];
    expect(block.type).toBe('social');
    if (block.type === 'social') {
      expect(block.values.icons).toHaveLength(2);
      expect(block.values.icons[0].type).toBe('facebook');
      expect(block.values.icons[1].type).toBe('twitter');
      expect(block.values.iconSize).toBe(40);
    }
  });

  it('should parse an html/raw block', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-raw><div>Custom HTML</div></mj-raw>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    const block = result.document.body.rows[0].columns[0].blocks[0];
    expect(block.type).toBe('html');
    if (block.type === 'html') {
      expect(block.values.content).toContain('Custom HTML');
    }
  });

  it('should parse a hero section', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-hero mode="fixed-height" background-url="https://example.com/bg.jpg" background-position="center center" height="500px" width="600px" vertical-align="middle">
          <mj-text>Hero Title</mj-text>
        </mj-hero>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    expect(result.document.body.rows).toHaveLength(1);
    const block = result.document.body.rows[0].columns[0].blocks[0];
    expect(block.type).toBe('hero');
    if (block.type === 'hero') {
      expect(block.values.backgroundUrl).toBe('https://example.com/bg.jpg');
      expect(block.values.mode).toBe('fixed-height');
      expect(block.values.height).toBe(500);
    }
  });

  it('should parse a navbar block', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-navbar hamburger="hamburger">
              <mj-navbar-link href="/home">Home</mj-navbar-link>
              <mj-navbar-link href="/about">About</mj-navbar-link>
            </mj-navbar>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    const block = result.document.body.rows[0].columns[0].blocks[0];
    expect(block.type).toBe('navbar');
    if (block.type === 'navbar') {
      expect(block.values.links).toHaveLength(2);
      expect(block.values.links[0].text).toBe('Home');
      expect(block.values.links[1].text).toBe('About');
    }
  });

  it('should parse multi-section document', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>Section 1</mj-text>
          </mj-column>
        </mj-section>
        <mj-section>
          <mj-column>
            <mj-image src="https://example.com/img.png" />
          </mj-column>
        </mj-section>
        <mj-section>
          <mj-column>
            <mj-button href="#">Click</mj-button>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    expect(result.document.body.rows).toHaveLength(3);
    expect(result.document.body.rows[0].columns[0].blocks[0].type).toBe('text');
    expect(result.document.body.rows[1].columns[0].blocks[0].type).toBe('image');
    expect(result.document.body.rows[2].columns[0].blocks[0].type).toBe('button');
  });

  it('should handle two-column layout', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>Left</mj-text>
          </mj-column>
          <mj-column>
            <mj-text>Right</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    expect(result.document.body.rows[0].columns).toHaveLength(2);
  });

  it('should handle missing mjml root gracefully', () => {
    const result = mjmlToDocument('<div>Not MJML</div>');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.document.version).toBe('1.0');
  });

  it('should set row full-width attribute', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section full-width="full-width">
          <mj-column>
            <mj-text>Full width</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    expect(result.document.body.rows[0].attributes.fullWidth).toBe(true);
  });

  it('should parse section background color', () => {
    const mjml = `<mjml>
      <mj-body>
        <mj-section background-color="#ff0000">
          <mj-column>
            <mj-text>Red</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const result = mjmlToDocument(mjml);
    expect(result.document.body.rows[0].attributes.backgroundColor).toBe('#ff0000');
  });
});
