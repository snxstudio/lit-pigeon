import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { isValidDocument, validateDocument } from '../src/schema/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_DIR = join(__dirname, '..', '..', '..', 'docs', 'ai-spec');

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(join(SPEC_DIR, rel), 'utf8'));
}

function buildValidator() {
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats.default(ajv);
  return ajv.compile(readJson('lit-pigeon-ai-spec.schema.json') as object);
}

describe('AI authoring spec — JSON Schema', () => {
  const validate = buildValidator();

  it('is itself a valid JSON Schema (compiles without throwing)', () => {
    expect(typeof validate).toBe('function');
  });

  it('rejects an empty object', () => {
    expect(validate({})).toBe(false);
  });

  it('rejects a document at the wrong version', () => {
    const sample = readJson('examples/welcome-email.json') as Record<string, unknown>;
    sample.version = '0.9';
    expect(validate(sample)).toBe(false);
  });

  it('catches a malformed block (missing required value)', () => {
    type Doc = { body: { rows: Array<{ columns: Array<{ blocks: Array<{ values: Record<string, unknown> }> }> }> } };
    const sample = readJson('examples/welcome-email.json') as Doc;
    // Remove `padding` from the first block's values — schema marks this required.
    const firstBlock = sample.body.rows[1].columns[0].blocks[0];
    delete firstBlock.values.padding;
    expect(validate(sample)).toBe(false);
  });
});

describe('AI authoring spec — runtime cross-property invariants', () => {
  // Cross-property checks (e.g. columnRatios.length === columns.length)
  // are runtime invariants validated by `validateDocument`, not statically
  // expressible in plain JSON Schema.
  it('isValidDocument rejects columnRatios with the wrong length', () => {
    type Doc = { body: { rows: Array<{ columnRatios: number[]; columns: unknown[] }> } };
    const sample = readJson('examples/welcome-email.json') as Doc;
    sample.body.rows[0].columnRatios = [6, 6]; // 1 column, 2 ratios
    expect(isValidDocument(sample as unknown)).toBe(false);
  });
});

describe('AI authoring spec — example documents', () => {
  const validate = buildValidator();

  for (const name of ['welcome-email', 'promo-email']) {
    it(`${name}.json passes the JSON Schema`, () => {
      const doc = readJson(`examples/${name}.json`);
      const ok = validate(doc);
      if (!ok) {
        // Surface schema errors when the test fails.
        throw new Error(JSON.stringify(validate.errors, null, 2));
      }
      expect(ok).toBe(true);
    });

    it(`${name}.json passes core's isValidDocument`, () => {
      const doc = readJson(`examples/${name}.json`);
      if (!isValidDocument(doc)) {
        throw new Error(JSON.stringify(validateDocument(doc), null, 2));
      }
      expect(isValidDocument(doc)).toBe(true);
    });
  }
});
