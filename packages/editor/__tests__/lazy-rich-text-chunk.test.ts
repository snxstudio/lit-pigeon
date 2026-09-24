import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// TipTap (~140 kB gz) must load on first text edit, not with the editor.
// size-limit ignores ./rich-text.js, so only this check catches a static import.
describe('built editor bundle', () => {
  it('does not statically import the lazy rich-text chunk', () => {
    const index = readFileSync(resolve(__dirname, '../dist/index.js'), 'utf8');
    expect(index).not.toMatch(/(?:import|from)\s*["']\.\/rich-text\.js["']/);
  });
});
