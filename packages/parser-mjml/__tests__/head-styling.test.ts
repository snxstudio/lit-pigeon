import { describe, it, expect } from 'vitest';
import { mjmlToDocument } from '../src/index.js';

function parse(head: string, column: string, sectionAttrs = '') {
  const result = mjmlToDocument(
    `<mjml><mj-head>${head}</mj-head><mj-body><mj-section ${sectionAttrs}><mj-column>${column}</mj-column></mj-section></mj-body></mjml>`,
  );
  const row = result.document.body.rows[0];
  return { ...result, row, blocks: row.columns[0].blocks };
}

describe('mj-attributes resolution', () => {
  it('applies MJML precedence: element > mj-class > tag > mj-all', () => {
    const { blocks } = parse(
      `<mj-attributes>
        <mj-all padding="1px" />
        <mj-button padding="2px" background-color="#111111" color="#222222" />
        <mj-class name="pad3" padding="3px" />
      </mj-attributes>`,
      `<mj-divider />
       <mj-button>Tag</mj-button>
       <mj-button mj-class="pad3">Class</mj-button>
       <mj-button mj-class="pad3" padding="4px" background-color="#444444">Own</mj-button>`,
    );
    const values = blocks.map((b) => b.values as { padding: { top: number } });
    expect(values.map((v) => v.padding.top)).toEqual([1, 2, 3, 4]);
    const own = blocks[3];
    expect(own.type === 'button' && own.values.backgroundColor).toBe('#444444');
    expect(own.type === 'button' && own.values.textColor).toBe('#222222');
  });

  it('merges several mj-classes with the later class winning', () => {
    const { blocks } = parse(
      `<mj-attributes>
        <mj-class name="a" border-color="#aaaaaa" border-width="3px" />
        <mj-class name="b" border-color="#bbbbbb" />
      </mj-attributes>`,
      '<mj-divider mj-class="a b" />',
    );
    const divider = blocks[0];
    expect(divider.type === 'divider' && divider.values.borderColor).toBe('#bbbbbb');
    expect(divider.type === 'divider' && divider.values.borderWidth).toBe(3);
  });

  it('applies tag defaults to sections and text line height', () => {
    const { row, blocks } = parse(
      '<mj-attributes><mj-section background-color="#fafafa" /><mj-text line-height="24px" /></mj-attributes>',
      '<mj-text>Hi</mj-text>',
    );
    expect(row.attributes.backgroundColor).toBe('#fafafa');
    expect(blocks[0].type === 'text' && blocks[0].values.lineHeight).toBe('24px');
  });
});

describe('mj-text colour, font size and font family', () => {
  it('keeps them as an inline span around inline content', () => {
    const { blocks } = parse(
      '<mj-attributes><mj-all font-family="Nunito, Arial" /><mj-text color="#333333" /></mj-attributes>',
      '<mj-text font-size="16px">Hi <b>{{ name }}</b>,<br/>welcome</mj-text>',
    );
    expect(blocks[0].type === 'text' && blocks[0].values.content).toBe(
      '<span style="color: #333333; font-size: 16px">Hi <b>{{ name }}</b>,<br>welcome</span>',
    );
  });

  it('puts the span inside block elements', () => {
    const { blocks } = parse(
      '<mj-attributes><mj-text color="#444444" font-family="Georgia, serif" /></mj-attributes>',
      '<mj-text><h1>Title</h1><p>One</p><ul><li>Two</li></ul></mj-text>',
    );
    const style = 'color: #444444; font-size: 13px; font-family: Georgia, serif';
    expect(blocks[0].type === 'text' && blocks[0].values.content).toBe(
      `<h1><span style="${style}">Title</span></h1><p><span style="${style}">One</span></p>` +
        `<ul><li><span style="${style}">Two</span></li></ul>`,
    );
  });

  it('leaves content alone when the values match what the renderer writes anyway', () => {
    const { blocks } = parse(
      '<mj-attributes><mj-all font-family="Arial" /><mj-text font-size="14px" color="#000000" /></mj-attributes>',
      '<mj-text font-family="Arial"><p>Plain</p></mj-text>',
    );
    expect(blocks[0].type === 'text' && blocks[0].values.content).toBe('<p>Plain</p>');
  });
});

describe('mj-style and css-class', () => {
  it('keeps non-inline mj-style CSS on the document and ignores inline mj-style', () => {
    const { document } = parse(
      `<mj-style>.brand a { color:#0b5fff; }</mj-style>
       <mj-style inline="inline">.x { color: red; }</mj-style>
       <mj-style>@media (max-width:480px) { .brand { font-size: 12px; } }</mj-style>`,
      '<mj-text>Hi</mj-text>',
    );
    expect(document.body.attributes.css).toBe(
      '.brand a { color:#0b5fff; }\n@media (max-width:480px) { .brand { font-size: 12px; } }',
    );
  });

  it('keeps css-class on text, button, image, column and section, including from mj-class', () => {
    const { row, blocks, warnings } = parse(
      '<mj-attributes><mj-class name="cta" css-class="cta" /></mj-attributes>',
      `<mj-text css-class="brand">Hi</mj-text>
       <mj-button mj-class="cta">Go</mj-button>
       <mj-image src="a.png" css-class="logo" />`,
      'css-class="hero-row"',
    );
    expect(warnings).toEqual([]);
    expect(row.attributes.cssClass).toBe('hero-row');
    expect(blocks.map((b) => (b.values as { cssClass?: string }).cssClass)).toEqual(['brand', 'cta', 'logo']);
  });

  it('warns when css-class sits on an element that cannot keep it', () => {
    const { warnings } = parse('', '<mj-divider css-class="rule" />');
    expect(warnings.map((w) => w.message)).toEqual(['css-class "rule" on <mj-divider> was dropped']);
  });
});

describe('mj-wrapper', () => {
  it('imports the sections unwrapped and warns that the wrapper styling was dropped', () => {
    const { document, warnings } = mjmlToDocument(`<mjml><mj-body>
      <mj-wrapper padding="10px" background-color="#ffffff">
        <mj-section><mj-column><mj-text>Inside</mj-text></mj-column></mj-section>
      </mj-wrapper>
    </mj-body></mjml>`);
    expect(document.body.rows).toHaveLength(1);
    expect(warnings).toEqual([
      {
        message:
          'mj-wrapper styling (padding, background-color) was dropped: the document model has no wrapper; its sections were imported unwrapped',
        tag: 'mj-wrapper',
      },
    ]);
  });
});
