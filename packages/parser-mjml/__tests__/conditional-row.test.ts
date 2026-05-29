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
