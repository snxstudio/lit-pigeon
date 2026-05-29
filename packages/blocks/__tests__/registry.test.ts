import { describe, it, expect, beforeEach } from 'vitest';
import { getBlockDefinition, isKnownBlockType } from '@lit-pigeon/core';
import { registerStandardBlocks, standardBlocks } from '../src/index.js';

describe('registerStandardBlocks', () => {
  beforeEach(() => {
    registerStandardBlocks();
  });

  it('exposes 5 blocks', () => {
    expect(standardBlocks.map((b) => b.type)).toEqual([
      'video',
      'countdown',
      'accordion',
      'table',
      'carousel',
    ]);
  });

  it('makes every block addressable through core.getBlockDefinition', () => {
    for (const def of standardBlocks) {
      expect(getBlockDefinition(def.type)).toBe(def);
      expect(isKnownBlockType(def.type)).toBe(true);
    }
  });

  it('every block ships a renderCanvas + renderMjml + propertySchema', () => {
    for (const def of standardBlocks) {
      expect(typeof def.renderCanvas).toBe('function');
      expect(typeof def.renderMjml).toBe('function');
      expect(Array.isArray(def.propertySchema)).toBe(true);
      expect((def.propertySchema ?? []).length).toBeGreaterThan(0);
    }
  });
});
