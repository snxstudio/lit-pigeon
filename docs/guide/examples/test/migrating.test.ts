// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { migrateUnlayerDesigns } from '../src/migrating/unlayer-batch.js';
import { convertUnlayerMergeTags } from '../src/migrating/unlayer-merge-tags.js';
import { importGrapesJsMjml } from '../src/migrating/grapesjs.js';

const here = dirname(fileURLToPath(import.meta.url));
const unlayerSample = readFileSync(join(here, '../../../../packages/import-unlayer/__tests__/fixtures-unlayer-sample.json'), 'utf8');

describe('migrating from Unlayer', () => {
  it('converts and renders a real Unlayer export', async () => {
    const [result] = await migrateUnlayerDesigns([{ id: 't1', name: 'Launch', design: unlayerSample }]);
    expect(result.document.metadata.name).toBe('Launch');
    expect(result.document.body.rows.length).toBeGreaterThan(3);
    expect(result.mjml).toContain('<mjml>');
    expect(result.html).toMatch(/<!doctype html>/i);
  });

  it('reports what it drops', async () => {
    const design = {
      body: {
        values: {},
        rows: [
          {
            cells: [1],
            values: { displayCondition: { label: 'VIP only', before: '{% if vip %}', after: '{% endif %}' } },
            columns: [{ contents: [{ type: 'video', values: {} }, { type: 'custom#product', values: {} }] }],
          },
        ],
      },
    };
    const [{ warnings }] = await migrateUnlayerDesigns([{ id: 't2', name: 'x', design }]);
    expect(warnings.map((w) => w.code)).toEqual(['display-condition-dropped', 'unsupported-block', 'custom-tool']);
  });

  it('maps merge tags, including groups', () => {
    expect(
      convertUnlayerMergeTags({
        first_name: { name: 'First Name', value: '{{first_name}}', sample: 'Ada' },
        shipping: { name: 'Shipping', mergeTags: { city: { name: 'City', value: '{{shipping_city}}' } } },
      }),
    ).toEqual([
      { name: '{{first_name}}', label: 'First Name', category: undefined, sample: 'Ada' },
      { name: '{{shipping_city}}', label: 'City', category: 'Shipping', sample: undefined },
    ]);
  });
});

describe('migrating from GrapesJS (grapesjs-mjml)', () => {
  const mjml = `<mjml><mj-body width="600px">
    <mj-section><mj-column width="30%"><mj-text>Side</mj-text></mj-column><mj-column width="70%"><mj-text>Main</mj-text></mj-column></mj-section>
    <mj-hero background-url="https://example.com/h.png"><mj-text>Hero</mj-text></mj-hero>
    <mj-section><mj-column width="200px"><mj-text>A</mj-text></mj-column><mj-column><mj-text>B</mj-text></mj-column></mj-section>
    <mj-section><mj-column><mj-text>Only</mj-text></mj-column></mj-section>
  </mj-body></mjml>`;

  it('imports the column widths the source declares', () => {
    const { document, warnings } = importGrapesJsMjml(mjml, 'Newsletter');
    expect(warnings).toEqual([]);
    expect(document.metadata.name).toBe('Newsletter');
    // 30%/70% in the first section, 200px/auto of a 600px body in the third.
    expect(document.body.rows.map((r) => r.columnRatios)).toEqual([[4, 8], [12], [4, 8], [12]]);
    expect(documentToMjml(document)).toContain('width="33.33%"');
  });
});
