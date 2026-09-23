import { describe, it, expect } from 'vitest';
import {
  getStarterTemplates,
  getStarterTemplate,
  loadGalleryTemplates,
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

describe('gallery templates', () => {
  it('loads the eight gallery templates', async () => {
    const ids = (await loadGalleryTemplates()).map((t) => t.id);
    expect(ids).toEqual([
      'starter-order-confirmation',
      'starter-shipping-update',
      'starter-password-reset',
      'starter-invoice',
      'starter-event-invite',
      'starter-product-launch',
      'starter-abandoned-cart',
      'starter-monthly-digest',
    ]);
  });

  it('every gallery template is a valid document with unique node ids and merge tags', async () => {
    for (const t of await loadGalleryTemplates()) {
      expect(isValidDocument(t.document), t.id).toBe(true);
      const ids = t.document.body.rows.flatMap((r) => [r.id, ...r.columns.flatMap((c) => [c.id, ...c.blocks.map((b) => b.id)])]);
      expect(new Set(ids).size, t.id).toBe(ids.length);
      expect(JSON.stringify(t.document), t.id).toMatch(/\{\{\w+\}\}/);
    }
  });

  it('returns deep copies', async () => {
    const [first] = await loadGalleryTemplates();
    first.document.metadata.name = 'MUTATED';
    const [again] = await loadGalleryTemplates();
    expect(again.document.metadata.name).not.toBe('MUTATED');
  });
});

describe('InMemoryTemplateStorage', () => {
  it('lists the four starters and the eight gallery templates by default', async () => {
    const storage = new InMemoryTemplateStorage();
    const list = await storage.list();
    expect(list).toHaveLength(12);
    expect(list.slice(0, 4).map((t) => t.id)).toEqual(getStarterTemplates().map((t) => t.id));
  });

  it('keeps a seeded template over a gallery template with the same id', async () => {
    const seed = { ...getStarterTemplate('starter-welcome')!, id: 'starter-invoice', name: 'Mine' };
    const storage = new InMemoryTemplateStorage({ seed: [seed] });
    expect((await storage.get('starter-invoice'))!.name).toBe('Mine');
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
