import { describe, it, expect } from 'vitest';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  registerBlock,
} from '@lit-pigeon/core';
import { documentToMjml } from '../src/index.js';

function docWithBlock(block: unknown) {
  const doc = createDefaultDocument('Test');
  const column = createColumn([block as never]);
  doc.body.rows = [createRow([column])];
  return doc;
}

describe('MJML registry dispatch for custom blocks', () => {
  it('renders a custom block via its renderMjml hook', () => {
    registerBlock({
      type: 'quote',
      label: 'Quote',
      icon: 'quote',
      defaultValues: { text: 'Hello world' },
      renderMjml: (b) =>
        `<mj-text font-style="italic">${(b.values as { text: string }).text}</mj-text>`,
    });

    const block = createBlock('quote');
    const mjml = documentToMjml(docWithBlock(block));

    expect(mjml).toContain('<mj-text font-style="italic">Hello world</mj-text>');
    expect(mjml).not.toContain('Unknown block type');
  });

  it('emits a comment for a custom type without a renderMjml hook', () => {
    registerBlock({
      type: 'mystery',
      label: 'Mystery',
      icon: 'mystery',
      defaultValues: {},
    });
    const block = createBlock('mystery');
    const mjml = documentToMjml(docWithBlock(block));
    expect(mjml).toContain('<!-- Unknown block type: mystery -->');
  });
});
