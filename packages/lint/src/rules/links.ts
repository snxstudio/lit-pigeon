import type { LintIssue, LintRule } from '../types.js';
import { collectBlocks, readString } from '../walk.js';

const URL_KEYS = ['href', 'videoUrl', 'imageUrl', 'src'] as const;
const ABSOLUTE_OR_KNOWN_PROTOCOLS = /^(https?:|mailto:|tel:|sms:|#|\/|\{\{)/i;

/**
 * Catch hrefs that point nowhere — empty strings, `#`, missing protocol,
 * or `javascript:` (always stripped by email clients and a phishing flag).
 */
export const linksRule: LintRule = {
  id: 'links',
  description: 'Every link must use an absolute http(s)/mailto/tel scheme.',
  check(doc) {
    const issues: LintIssue[] = [];
    for (const hit of collectBlocks(doc)) {
      for (const key of URL_KEYS) {
        const raw = readString(hit.block, key).trim();
        if (!raw) continue;
        const lowered = raw.toLowerCase();

        if (lowered.startsWith('javascript:')) {
          issues.push({
            rule: 'links/javascript-protocol',
            severity: 'error',
            message: `"${key}" uses javascript: — email clients strip this and treat it as phishing.`,
            path: `${hit.path}.values.${key}`,
            blockId: hit.block.id,
          });
          continue;
        }

        if (raw === '#') {
          issues.push({
            rule: 'links/placeholder',
            severity: 'warning',
            message: `"${key}" is "#" — replace with a real destination before sending.`,
            path: `${hit.path}.values.${key}`,
            blockId: hit.block.id,
          });
          continue;
        }

        if (!ABSOLUTE_OR_KNOWN_PROTOCOLS.test(raw)) {
          issues.push({
            rule: 'links/no-scheme',
            severity: 'error',
            message: `"${key}"="${raw}" is not an absolute URL — most clients won't render relative links.`,
            path: `${hit.path}.values.${key}`,
            blockId: hit.block.id,
          });
        }
      }
    }
    return issues;
  },
};
