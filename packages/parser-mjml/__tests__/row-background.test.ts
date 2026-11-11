import { describe, it, expect } from 'vitest';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

function parse(section: string) {
  return mjmlToDocument(`<mjml><mj-body>${section}</mj-body></mjml>`);
}

function parseRow(section: string) {
  return parse(section).document.body.rows[0].attributes;
}

describe('mj-section background image → row', () => {
  it('reads repeat, size and position off the section', () => {
    const attrs = parseRow(
      `<mj-section background-url="/pattern.png" background-repeat="repeat"
        background-size="auto" background-position="bottom left"><mj-column>
        <mj-text>Hi</mj-text></mj-column></mj-section>`,
    );

    expect(attrs.backgroundImage).toBe('/pattern.png');
    expect(attrs.backgroundRepeat).toBe('repeat');
    expect(attrs.backgroundSize).toBe('auto');
    expect(attrs.backgroundPosition).toBe('bottom left');
  });

  it('falls back to MJML’s own defaults when the attributes are absent', () => {
    // MJML renders an unattributed mj-section background as repeat/auto/top
    // center, so that is what the imported row has to mean.
    const attrs = parseRow(
      `<mj-section background-url="/pattern.png"><mj-column>
        <mj-text>Hi</mj-text></mj-column></mj-section>`,
    );

    expect(attrs.backgroundRepeat).toBe('repeat');
    expect(attrs.backgroundSize).toBe('auto');
    expect(attrs.backgroundPosition).toBe('top center');
  });

  it('leaves the sizing attributes off a row with no background image', () => {
    const attrs = parseRow(
      `<mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section>`,
    );

    expect(attrs.backgroundImage).toBeUndefined();
    expect(attrs.backgroundRepeat).toBeUndefined();
    expect(attrs.backgroundSize).toBeUndefined();
    expect(attrs.backgroundPosition).toBeUndefined();
  });

  it('warns that a single-axis repeat became a full repeat', () => {
    const { document, warnings } = parse(
      `<mj-section background-url="/tile.png" background-repeat="repeat-x"><mj-column>
        <mj-text>Hi</mj-text></mj-column></mj-section>`,
    );

    expect(document.body.rows[0].attributes.backgroundRepeat).toBe('repeat');
    expect(warnings.some(w => w.message.includes('repeat-x'))).toBe(true);
  });

  it('keeps a tiled background tiled through import and re-export', () => {
    // The regression this fixes: the parser kept only the URL, so a repeating
    // texture came back as a single stretched copy of the tile.
    const source = `<mjml><mj-body><mj-section background-url="/tile.png"
      background-repeat="repeat" background-size="40px 40px"><mj-column>
      <mj-text>Hi</mj-text></mj-column></mj-section></mj-body></mjml>`;

    const { document } = mjmlToDocument(source);
    const mjml = documentToMjml(document);

    expect(mjml).toContain('background-repeat="repeat"');
    expect(mjml).toContain('background-size="40px 40px"');
    expect(mjml).not.toContain('background-size="cover"');
  });
});
