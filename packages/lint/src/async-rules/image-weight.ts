import type { AsyncLintRule, LintIssue } from '../types.js';
import { collectBlocks, readString } from '../walk.js';
import { mapWithLimit } from './concurrency.js';

const IMAGE_KEYS = ['src', 'posterUrl', 'imageUrl', 'backgroundUrl'];
const WARN_BYTES = 1_000_000; // 1 MB
const ERROR_BYTES = 3_000_000; // 3 MB

interface ImageRef {
  url: string;
  path: string;
  blockId: string;
}

/**
 * HEAD-request every absolute http(s) image URL and warn when the
 * Content-Length is heavy. Big inline images blow past Gmail's 102 kB clip
 * threshold and absolutely tank mobile open performance.
 */
export const imageWeightRule: AsyncLintRule = {
  id: 'image-weight',
  description: 'Hosted images larger than 1 MB warn; over 3 MB errors.',
  async check(doc, fetcher) {
    const refs: ImageRef[] = [];
    for (const hit of collectBlocks(doc)) {
      for (const key of IMAGE_KEYS) {
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
        if (!res.ok) return null; // link-reachability rule reports unreachable links.
        const lenHeader = res.headers.get('content-length');
        const bytes = lenHeader ? Number(lenHeader) : NaN;
        if (!Number.isFinite(bytes) || bytes <= 0) return null;
        if (bytes >= ERROR_BYTES) {
          return {
            rule: 'image-weight/oversized',
            severity: 'error',
            message: `Image is ${formatBytes(bytes)} (>3 MB) — likely to be clipped by Gmail and slow on mobile.`,
            path: ref.path,
            blockId: ref.blockId,
          };
        }
        if (bytes >= WARN_BYTES) {
          return {
            rule: 'image-weight/heavy',
            severity: 'warning',
            message: `Image is ${formatBytes(bytes)} — consider compressing under 1 MB.`,
            path: ref.path,
            blockId: ref.blockId,
          };
        }
        return null;
      } catch {
        return null;
      }
    });
    return results.filter((entry): entry is LintIssue => entry !== null);
  },
};

function formatBytes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} kB`;
  return `${n} B`;
}
