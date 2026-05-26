import { describe, it, expect } from 'vitest';
import {
  getStarterTemplates,
  getStarterTemplate,
  InMemoryTemplateStorage,
  isValidDocument,
} from '../src/index.js';

describe('starter templates', () => {
  it('returns four starters: welcome, newsletter, transactional, promo', () => {
    const ids = getStarterTemplates().map((t) => t.id).sort();
    expect(ids).toEqual(
      ['starter-newsletter', 'starter-promo', 'starter-transactional', 'starter-welcome'].sort(),
    );
  });

  it('every starter has a valid PigeonDocument', () => {
    for (const t of getStarterTemplates()) {
      if (!isValidDocument(t.document)) {
        throw new Error(`Starter ${t.id} produced an invalid document.`);
      }
      expect(isValidDocument(t.document)).toBe(true);
    }
  });

  it('returns deep copies — mutating one call does not poison the next', () => {
    const first = getStarterTemplate('starter-welcome');
    expect(first).not.toBeNull();
    first!.document.metadata.name = 'MUTATED';
    const second = getStarterTemplate('starter-welcome');
    expect(second!.document.metadata.name).not.toBe('MUTATED');
  });

  it('getStarterTemplate returns null for unknown ids', () => {
    expect(getStarterTemplate('does-not-exist')).toBeNull();
  });
});

describe('InMemoryTemplateStorage', () => {
  it('lists the four starters by default', async () => {
    const storage = new InMemoryTemplateStorage();
    const list = await storage.list();
    expect(list).toHaveLength(4);
  });

  it('skips starters when includeStarters=false', async () => {
    const storage = new InMemoryTemplateStorage({ includeStarters: false });
    expect(await storage.list()).toHaveLength(0);
  });

  it('save() upserts; get() returns by id', async () => {
    const storage = new InMemoryTemplateStorage({ includeStarters: false });
    await storage.save({
      id: 'custom',
      name: 'Custom',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      document: getStarterTemplate('starter-welcome')!.document,
    });
    const fetched = await storage.get('custom');
    expect(fetched?.name).toBe('Custom');

    // Save again — updatedAt should bump.
    const before = fetched!.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    await storage.save({ ...fetched!, name: 'Renamed' });
    const after = await storage.get('custom');
    expect(after!.name).toBe('Renamed');
    expect(after!.updatedAt > before).toBe(true);
  });

  it('returns null for unknown ids and supports delete()', async () => {
    const storage = new InMemoryTemplateStorage({ includeStarters: false });
    expect(await storage.get('nope')).toBeNull();
    await storage.save({
      id: 'x', name: 'x', createdAt: '2026-01-01', updatedAt: '2026-01-01',
      document: getStarterTemplate('starter-welcome')!.document,
    });
    await storage.delete('x');
    expect(await storage.get('x')).toBeNull();
  });

  it('list() returns deep copies (mutation safe)', async () => {
    const storage = new InMemoryTemplateStorage();
    const first = await storage.list();
    first[0].name = 'BUSTED';
    const second = await storage.list();
    expect(second[0].name).not.toBe('BUSTED');
  });
});
