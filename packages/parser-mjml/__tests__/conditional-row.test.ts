import { describe, it, expect } from 'vitest';
import { mjmlToDocument } from '../src/index.js';

describe('parsing conditional rows', () => {
  it('reads an mj-raw {{#if}} marker back into the row condition', () => {
    const mjml = `<mjml>
      <mj-body width="600px">
        <mj-raw>{{#if user.premium}}</mj-raw>
        <mj-section>
          <mj-column>
            <mj-text>Premium content</mj-text>
          </mj-column>
        </mj-section>
        <mj-raw>{{/if}}</mj-raw>
      </mj-body>
    </mjml>`;

    const { document } = mjmlToDocument(mjml);
    expect(document.body.rows).toHaveLength(1);
    expect(document.body.rows[0].attributes.condition).toBe('user.premium');
  });

  it('leaves condition unset for an ordinary section', () => {
    const mjml = `<mjml>
      <mj-body width="600px">
        <mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section>
      </mj-body>
    </mjml>`;
    const { document } = mjmlToDocument(mjml);
    expect(document.body.rows[0].attributes.condition).toBeUndefined();
  });

  it('only applies the condition to the immediately following section', () => {
    const mjml = `<mjml>
      <mj-body width="600px">
        <mj-raw>{{#if a}}</mj-raw>
        <mj-section><mj-column><mj-text>One</mj-text></mj-column></mj-section>
        <mj-raw>{{/if}}</mj-raw>
        <mj-section><mj-column><mj-text>Two</mj-text></mj-column></mj-section>
      </mj-body>
    </mjml>`;
    const { document } = mjmlToDocument(mjml);
    expect(document.body.rows[0].attributes.condition).toBe('a');
    expect(document.body.rows[1].attributes.condition).toBeUndefined();
  });
});

describe('parsing conditional blocks', () => {
  it('reads {{#if}} / {{/if}} markers around a block into the block condition', () => {
    const mjml = `<mjml>
      <mj-body width="600px">
        <mj-section>
          <mj-column>
            <mj-text>Everyone</mj-text>
            <mj-raw>{{#if user.vip}}</mj-raw>
            <mj-button href="https://example.com">VIP offer</mj-button>
            <mj-raw>{{/if}}</mj-raw>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>`;

    const { document } = mjmlToDocument(mjml);
    const blocks = document.body.rows[0].columns[0].blocks;
    expect(blocks.map((b) => b.type)).toEqual(['text', 'button']);
    expect(blocks[0].values.condition).toBeUndefined();
    expect(blocks[1].values.condition).toBe('user.vip');
  });

  it('keeps a lone {{#if}} raw (no matching close) as an html block', () => {
    const mjml = `<mjml><mj-body><mj-section><mj-column>
      <mj-raw>{{#if a}}</mj-raw>
      <mj-text>One</mj-text>
      <mj-text>Two</mj-text>
      <mj-raw>{{/if}}</mj-raw>
    </mj-column></mj-section></mj-body></mjml>`;
    const { document } = mjmlToDocument(mjml);
    const blocks = document.body.rows[0].columns[0].blocks;
    expect(blocks.map((b) => b.type)).toEqual(['html', 'text', 'text', 'html']);
    expect(blocks.some((b) => b.values.condition)).toBe(false);
  });

  it('reads a hero condition nested inside a row condition', () => {
    const mjml = `<mjml><mj-body>
      <mj-raw>{{#if user.active}}</mj-raw>
      <mj-raw>{{#if user.vip}}</mj-raw>
      <mj-hero><mj-text>Hi</mj-text></mj-hero>
      <mj-raw>{{/if}}</mj-raw>
      <mj-raw>{{/if}}</mj-raw>
    </mj-body></mjml>`;
    const { document } = mjmlToDocument(mjml);
    const row = document.body.rows[0];
    expect(row.attributes.condition).toBe('user.active');
    expect(row.columns[0].blocks[0].values.condition).toBe('user.vip');
  });
});
