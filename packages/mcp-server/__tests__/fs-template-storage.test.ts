import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { Template } from '@lit-pigeon/core';
import { FsTemplateStorage } from '../src/store/fs-template-storage.js';
import { buildServer } from '../src/server.js';

interface ContentItem {
  type: string;
  text?: string;
}

function parseReply<T>(reply: { content?: ContentItem[] }): T {
  const text = reply.content?.[0]?.text ?? '';
  return JSON.parse(text) as T;
}

async function makeTmpDir(label: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `lit-pigeon-fs-tpl-${label}-`));
  return dir;
}

async function rmRf(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

function makeTemplate(id: string, name = id, document = { metadata: { name }, body: { rows: [] } } as unknown as Template['document']): Template {
  const now = new Date().toISOString();
  return {
    id,
    name,
    document,
    createdAt: now,
    updatedAt: now,
  };
}

describe('FsTemplateStorage', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeTmpDir('unit');
  });

  afterEach(async () => {
    await rmRf(dir);
  });

  it('seeds an empty directory with the 4 starter templates', async () => {
    const storage = new FsTemplateStorage({ dir });
    const all = await storage.list();
    const ids = all.map((t) => t.id).sort();
    expect(ids).toEqual(['starter-newsletter', 'starter-promo', 'starter-transactional', 'starter-welcome']);

    // Files exist on disk.
    const filesOnDisk = (await fs.readdir(dir)).sort();
    expect(filesOnDisk).toEqual(['starter-newsletter.json', 'starter-promo.json', 'starter-transactional.json', 'starter-welcome.json']);
  });

  it('does not overwrite existing files when re-instantiated', async () => {
    // First, seed.
    const storage1 = new FsTemplateStorage({ dir });
    await storage1.list();

    // Modify a starter on disk by saving an edited template.
    const modified = makeTemplate('starter-welcome', 'Edited Welcome');
    await storage1.save(modified);

    // New instance — should NOT re-seed, since the directory is no longer empty.
    const storage2 = new FsTemplateStorage({ dir });
    const fetched = await storage2.get('starter-welcome');
    expect(fetched?.name).toBe('Edited Welcome');
  });

  it('skips seeding when includeStarters is false', async () => {
    const storage = new FsTemplateStorage({ dir, includeStarters: false });
    const all = await storage.list();
    expect(all).toEqual([]);
    const files = await fs.readdir(dir).catch(() => [] as string[]);
    expect(files).toEqual([]);
  });

  it('save() writes a pretty-printed JSON file and updates updatedAt', async () => {
    const storage = new FsTemplateStorage({ dir, includeStarters: false });
    const t = makeTemplate('my-tpl', 'My Template');
    const originalUpdatedAt = t.updatedAt;
    // Force a measurable time difference.
    await new Promise((r) => setTimeout(r, 5));
    await storage.save(t);

    const filePath = path.join(dir, 'my-tpl.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    // Pretty printed (2-space indent → newlines present).
    expect(raw.includes('\n')).toBe(true);

    const parsed = JSON.parse(raw) as Template;
    expect(parsed.id).toBe('my-tpl');
    expect(parsed.name).toBe('My Template');
    expect(new Date(parsed.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime());
  });

  it('save() preserves createdAt when the file already exists', async () => {
    const storage = new FsTemplateStorage({ dir, includeStarters: false });
    const original = makeTemplate('keep-created');
    await storage.save(original);
    const first = await storage.get('keep-created');
    expect(first).not.toBeNull();
    const originalCreatedAt = first!.createdAt;

    await new Promise((r) => setTimeout(r, 5));
    const updated = { ...original, name: 'Renamed', createdAt: 'should-be-ignored' };
    await storage.save(updated);

    const second = await storage.get('keep-created');
    expect(second!.createdAt).toBe(originalCreatedAt);
    expect(second!.updatedAt).not.toBe(originalCreatedAt);
    expect(second!.name).toBe('Renamed');
  });

  it('list() returns templates sorted by updatedAt desc', async () => {
    const storage = new FsTemplateStorage({ dir, includeStarters: false });
    const a = makeTemplate('a');
    const b = makeTemplate('b');
    const c = makeTemplate('c');
    await storage.save(a);
    await new Promise((r) => setTimeout(r, 5));
    await storage.save(b);
    await new Promise((r) => setTimeout(r, 5));
    await storage.save(c);

    const all = await storage.list();
    expect(all.map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });

  it('get() returns null for an unknown id', async () => {
    const storage = new FsTemplateStorage({ dir, includeStarters: false });
    const t = await storage.get('does-not-exist');
    expect(t).toBeNull();
  });

  it('delete() removes the file; no-op if missing', async () => {
    const storage = new FsTemplateStorage({ dir, includeStarters: false });
    await storage.save(makeTemplate('x'));
    expect(await storage.get('x')).not.toBeNull();
    await storage.delete('x');
    expect(await storage.get('x')).toBeNull();
    // Deleting an absent file should not throw.
    await expect(storage.delete('x')).resolves.toBeUndefined();
  });

  it('skips files that fail to parse and warns on stderr', async () => {
    const storage = new FsTemplateStorage({ dir, includeStarters: false });
    await storage.save(makeTemplate('good'));
    // Drop a junk file in the directory.
    await fs.writeFile(path.join(dir, 'broken.json'), '{ not valid json', 'utf-8');

    const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const all = await storage.list();
    expect(all.map((t) => t.id)).toEqual(['good']);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('rejects unsafe template ids', async () => {
    const storage = new FsTemplateStorage({ dir, includeStarters: false });
    const cases = ['../escape', 'a/b', '.hidden', '', 'has space'];
    for (const id of cases) {
      const t = makeTemplate(id);
      await expect(storage.save(t)).rejects.toThrow();
    }
    await expect(storage.get('../escape')).resolves.toBeNull();
    await expect(storage.delete('../escape')).resolves.toBeUndefined();
  });

  it('creates the directory on first write if it does not exist', async () => {
    const nested = path.join(dir, 'does', 'not', 'yet', 'exist');
    const storage = new FsTemplateStorage({ dir: nested, includeStarters: false });
    await storage.save(makeTemplate('first'));
    const files = await fs.readdir(nested);
    expect(files).toEqual(['first.json']);
  });
});

describe('MCP server with FsTemplateStorage', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeTmpDir('integration');
  });

  afterEach(async () => {
    await rmRf(dir);
  });

  it('persists save_template across server restarts when pointed at the same dir', async () => {
    // First server: save a template.
    {
      const storage = new FsTemplateStorage({ dir });
      const { server } = buildServer({ templateStorage: storage });
      const [ct, st] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: 'test', version: '0.0.0' });
      await Promise.all([server.connect(st), client.connect(ct)]);

      const { documentId } = parseReply<{ documentId: string }>(
        await client.callTool({ name: 'create_document', arguments: { name: 'Persist me' } }),
      );
      await client.callTool({
        name: 'save_template',
        arguments: { documentId, templateId: 'persisted-tpl', name: 'Persisted', category: 'other' },
      });
    }

    // Second server: should still see persisted-tpl.
    {
      const storage = new FsTemplateStorage({ dir });
      const { server } = buildServer({ templateStorage: storage });
      const [ct, st] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: 'test', version: '0.0.0' });
      await Promise.all([server.connect(st), client.connect(ct)]);

      const { templates } = parseReply<{ templates: Array<{ id: string; name: string }> }>(
        await client.callTool({ name: 'list_templates', arguments: {} }),
      );
      const ids = templates.map((t) => t.id);
      expect(ids).toContain('persisted-tpl');
      const persisted = templates.find((t) => t.id === 'persisted-tpl');
      expect(persisted?.name).toBe('Persisted');
    }
  });
});
