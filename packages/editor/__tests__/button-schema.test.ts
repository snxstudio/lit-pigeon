import { describe, it, expect } from 'vitest';
import { createBlock, type ButtonBlock } from '@lit-pigeon/core';

describe('ButtonBlock schema (content)', () => {
  it('createBlock("button") defaults to HTML content wrapped in a <p>', () => {
    const block = createBlock('button') as ButtonBlock;
    expect(block.values.content).toBe('<p>Click me</p>');
    // legacy `text` field must be gone
    expect((block.values as Record<string, unknown>).text).toBeUndefined();
  });

  it('createBlock("button", { content }) honors a caller-supplied HTML string', () => {
    const block = createBlock('button', { content: '<p><strong>Buy</strong></p>' }) as ButtonBlock;
    expect(block.values.content).toBe('<p><strong>Buy</strong></p>');
  });
});
