import { describe, it, expect, afterEach } from 'vitest';
import {
  registerBlock,
  getBlockDefinition,
  createBlock,
  isKnownBlockType,
  type BlockDefinition,
} from '../src/index.js';

const QUOTE: BlockDefinition = {
  type: 'quote',
  label: 'Quote',
  icon: 'quote',
  defaultValues: { text: 'To be or not to be', cite: 'Hamlet' },
};

afterEach(() => {
  // Registry is a module singleton; nothing to reset for these additive tests.
});

describe('custom block registry + createBlock', () => {
  it('createBlock still builds built-in blocks with schema defaults', () => {
    const block = createBlock('text');
    expect(block.type).toBe('text');
    expect((block.values as { content: string }).content).toContain('text');
  });

  it('createBlock builds a registered custom block from its defaultValues', () => {
    registerBlock(QUOTE);
    expect(isKnownBlockType('quote')).toBe(true);

    const block = createBlock('quote');
    expect(block.type).toBe('quote');
    expect(block.id).toBeTruthy();
    expect(block.values).toEqual({
      text: 'To be or not to be',
      cite: 'Hamlet',
    });
  });

  it('createBlock merges overrides over custom defaults', () => {
    registerBlock(QUOTE);
    const block = createBlock('quote', { cite: 'Macbeth' });
    expect(block.values).toEqual({
      text: 'To be or not to be',
      cite: 'Macbeth',
    });
  });

  it('createBlock deep-clones custom defaults (no shared reference)', () => {
    const def: BlockDefinition = {
      type: 'callout',
      label: 'Callout',
      icon: 'callout',
      defaultValues: { items: ['a', 'b'] },
    };
    registerBlock(def);
    const a = createBlock('callout') as { values: { items: string[] } };
    const b = createBlock('callout') as { values: { items: string[] } };
    a.values.items.push('c');
    expect(b.values.items).toEqual(['a', 'b']);
    expect((def.defaultValues as { items: string[] }).items).toEqual(['a', 'b']);
  });

  it('createBlock throws for a truly unknown type', () => {
    expect(() => createBlock('does-not-exist')).toThrow(/Unknown block type/);
  });

  it('exposes the registered definition with its render hooks', () => {
    registerBlock({
      ...QUOTE,
      renderMjml: (b) =>
        `<mj-text>${(b.values as { text: string }).text}</mj-text>`,
    });
    const def = getBlockDefinition('quote');
    expect(def?.renderMjml).toBeTypeOf('function');
  });
});
