import type { AsyncLintRule, LintIssue } from '../types.js';
import { collectBlocks, readString } from '../walk.js';
import { mapWithLimit } from './concurrency.js';

const URL_KEYS = ['href', 'videoUrl'];

interface LinkRef {
  url: string;
  path: string;
  blockId: string;
}

/**
 * HEAD-request every http(s) `href` to catch dead destinations. Most servers
 * answer HEAD; those that don't show up as 405 — we treat that as reachable
 * because the server clearly exists.
 */
export const linkReachabilityRule: AsyncLintRule = {
  id: 'link-reachability',
  description: 'Click-through links must return a 2xx/3xx status (or 405 on HEAD).',
  async check(doc, fetcher) {
    const refs: LinkRef[] = [];
    for (const hit of collectBlocks(doc)) {
      for (const key of URL_KEYS) {
        const url = readString(hit.block, key).trim();
        if (/^https?:\/\//i.test(url)) {
          refs.push({ url, path: `${hit.path}.values.${key}`, blockId: hit.block.id });
        }
      }
    }
    if (refs.length === 0) return [];

    const results = await mapWithLimit(refs, 8, async (ref): Promise<LintIssue | null> => {
      try {
        const res = await fetcher(ref.url, { method: 'HEAD' });
        if (res.ok || res.status === 405) return null;
        return {
          rule: 'link-reachability/broken',
          severity: 'warning',
          message: `URL "${ref.url}" returned ${res.status} on HEAD.`,
          path: ref.path,
          blockId: ref.blockId,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          rule: 'link-reachability/unreachable',
          severity: 'warning',
          message: `URL "${ref.url}" did not respond: ${message}.`,
          path: ref.path,
          blockId: ref.blockId,
        };
      }
    });
    return results.filter((entry): entry is LintIssue => entry !== null);
  },
};
