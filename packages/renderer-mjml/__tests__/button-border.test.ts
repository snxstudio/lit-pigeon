import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { createBlock, createColumn, createDefaultDocument, createRow } from '@lit-pigeon/core';
import type { Border } from '@lit-pigeon/core';
import { documentToMjml } from '../src/index.js';
import { borderToMjml } from '../src/utils/border.js';

function withButton(values: Record<string, unknown>): string {
  const doc = createDefaultDocument('Border');
  doc.body.rows = [createRow([createColumn([createBlock('button', values)])], [12])];
  return documentToMjml(doc);
}

describe('borderToMjml', () => {
  it('serialises a border to the CSS shorthand', () => {
    expect(borderToMjml({ width: 2, style: 'solid', color: '#e8590c' })).toBe('2px solid #e8590c');
    expect(borderToMjml({ width: 1, style: 'dashed', color: 'rgb(0, 0, 0)' })).toBe('1px dashed rgb(0, 0, 0)');
  });

  it('paints nothing for a zero width', () => {
    expect(borderToMjml({ width: 0, style: 'solid', color: '#000000' })).toBe('');
  });
});

describe('button borders', () => {
  it('emits the border attribute on mj-button', () => {
    const mjml = withButton({ border: { width: 2, style: 'solid', color: '#e8590c' } as Border });
    expect(mjml).toContain('border="2px solid #e8590c"');
  });

  it('reaches the compiled HTML as the cell border an outline button needs', () => {
    const mjml = withButton({
      content: '<p>Read more</p>',
      backgroundColor: 'transparent',
      textColor: '#e8590c',
      border: { width: 2, style: 'dashed', color: '#e8590c' } as Border,
    });
    const { html } = mjml2html(mjml);
    expect(html).toContain('border:2px dashed #e8590c');
  });

  it('escapes a border colour that would break out of the attribute', () => {
    const mjml = withButton({ border: { width: 1, style: 'solid', color: 'red" onmouseover="x' } as Border });
    expect(mjml).toContain('border="1px solid red&quot; onmouseover=&quot;x"');
  });

  it('leaves the attribute off entirely without a border, so MJML\'s own default stands', () => {
    const mjml = withButton({});
    expect(mjml).toMatch(/<mj-button /);
    expect(mjml).not.toMatch(/<mj-button[^>]*\sborder=/);
    expect(mjml2html(mjml).html).toContain('border:none');
  });

  it('leaves the attribute off for a zero-width border rather than emitting 0px', () => {
    const mjml = withButton({ border: { width: 0, style: 'solid', color: '#e8590c' } as Border });
    expect(mjml).not.toMatch(/<mj-button[^>]*\sborder=/);
  });
});
