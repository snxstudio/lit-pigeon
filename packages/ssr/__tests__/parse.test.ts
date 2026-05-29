import { describe, it, expect } from 'vitest';
import { parseMjml } from '../src/index.js';

describe('parseMjml', () => {
  it('parses minimal MJML into a PigeonDocument', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Hello</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const { document, warnings } = parseMjml(mjml);
    expect(document.version).toBe('1.0');
    expect(document.body.rows).toHaveLength(1);
    expect(document.body.rows[0].columns).toHaveLength(1);
    expect(Array.isArray(warnings)).toBe(true);
  });
});
