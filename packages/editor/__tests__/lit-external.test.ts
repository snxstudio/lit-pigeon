import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

// A bundled copy of any lit module (e.g. lit/directives/ref.js pulls in lit's
// directive base classes) breaks hosts whose lit differs from ours, such as an
// app's development build: "currentDirective._$initialize is not a function".
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(join(dir, e.name)) : e.name.endsWith('.ts') ? [join(dir, e.name)] : [],
  );
}

describe('built editor bundle', () => {
  it('imports every lit module it uses instead of bundling it', () => {
    const src = resolve(__dirname, '../src');
    const used = new Set<string>();
    for (const f of sourceFiles(src)) {
      for (const m of readFileSync(f, 'utf8').matchAll(/from ['"]((?:lit|lit-html|@lit\/[^/'"]+)(?:\/[^'"]*)?)['"]/g)) used.add(m[1]);
    }
    const dist = resolve(__dirname, '../dist');
    const built = readdirSync(dist).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dist, f), 'utf8')).join('\n');
    const missing = [...used].filter((spec) => !built.includes(`from "${spec}"`) && !built.includes(`import "${spec}"`));
    expect(missing).toEqual([]);
  });
});
