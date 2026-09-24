import { describe, expect, it } from 'vitest';
import { registerBlock } from '@lit-pigeon/core';
import { unlayerToDocument } from '../src/index.js';

// The block registry is process-wide, so registering the catalog here would
// silence the warning for every other test in the file. This case lives on its
// own so the registration cannot leak.
registerBlock({ type: 'video', label: 'Video', defaultValues: {} });
registerBlock({ type: 'countdown', label: 'Countdown', defaultValues: {} });

function design(type: string) {
  return {
    body: {
      rows: [{ cells: [1], columns: [{ contents: [{ type, values: {} }], values: {} }], values: {} }],
      values: {},
    },
    schemaVersion: 16,
  };
}

describe('with @lit-pigeon/blocks registered', () => {
  it.each(['video', 'timer'])('imports %s without warning about the catalog', (type) => {
    const { document, warnings } = unlayerToDocument(design(type));
    expect(document.body.rows[0].columns[0].blocks).toHaveLength(1);
    expect(warnings.find((w) => w.code === 'plugin-block')).toBeUndefined();
  });
});
