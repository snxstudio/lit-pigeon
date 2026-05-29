import type { LintIssue, LintRule } from '../types.js';
import { collectBlocks, readString } from '../walk.js';

const SPAM_PHRASES = [
  '100% free',
  'act now',
  'best price',
  'cash bonus',
  'click here',
  'congratulations',
  'earn extra cash',
  'free gift',
  'limited time',
  'lose weight',
  'no obligation',
  'order now',
  'risk-free',
  'satisfaction guaranteed',
  'urgent',
  'while supplies last',
  'winner',
  'you have been selected',
  'work from home',
];

/**
 * Crude heuristic spam-score for the *subject* (`metadata.name`) and the
 * first text block — no external API, no perfection, just the obvious
 * Bayesian-spam-filter giveaways. Useful as a smoke check before send.
 */
export const spamScoreRule: LintRule = {
  id: 'spam-score',
  description: 'Subject + first text block scanned for common spam-filter tells.',
  check(doc) {
    const issues: LintIssue[] = [];
    const subject = doc.metadata.name ?? '';
    addSubjectIssues(subject, issues);

    // Body text: scan only the first text-bearing block to avoid noise.
    for (const hit of collectBlocks(doc)) {
      const content = readString(hit.block, 'content');
      if (!content) continue;
      addBodyIssues(stripTags(content), `${hit.path}.values.content`, hit.block.id, issues);
      break;
    }

    return issues;
  },
};

function addSubjectIssues(subject: string, issues: LintIssue[]): void {
  if (!subject) return;

  const upperRatio = uppercaseRatio(subject);
  if (subject.length >= 4 && upperRatio > 0.7) {
    issues.push({
      rule: 'spam-score/all-caps-subject',
      severity: 'warning',
      message: `Subject is ${Math.round(upperRatio * 100)}% uppercase — major spam-filter signal.`,
      path: 'metadata.name',
    });
  }

  const bangs = (subject.match(/!/g) ?? []).length;
  if (bangs >= 3) {
    issues.push({
      rule: 'spam-score/excessive-exclamation',
      severity: 'warning',
      message: `Subject has ${bangs} exclamation marks — strong spam signal.`,
      path: 'metadata.name',
    });
  }

  const dollarRuns = subject.match(/\${2,}/g) ?? [];
  if (dollarRuns.length > 0) {
    issues.push({
      rule: 'spam-score/dollar-runs',
      severity: 'warning',
      message: 'Subject contains runs of "$" — common spam pattern.',
      path: 'metadata.name',
    });
  }

  for (const phrase of SPAM_PHRASES) {
    if (subject.toLowerCase().includes(phrase)) {
      issues.push({
        rule: 'spam-score/spam-phrase',
        severity: 'info',
        message: `Subject contains the phrase "${phrase}" — frequent in spam-filter blocklists.`,
        path: 'metadata.name',
      });
      break;
    }
  }
}

function addBodyIssues(text: string, path: string, blockId: string, issues: LintIssue[]): void {
  const matched: string[] = [];
  for (const phrase of SPAM_PHRASES) {
    if (text.toLowerCase().includes(phrase)) matched.push(phrase);
  }
  if (matched.length >= 2) {
    issues.push({
      rule: 'spam-score/spam-phrases-body',
      severity: 'info',
      message: `First text block hits ${matched.length} spam-list phrases (e.g. "${matched[0]}", "${matched[1]}").`,
      path,
      blockId,
    });
  }
}

function uppercaseRatio(input: string): number {
  const letters = input.replace(/[^A-Za-z]/g, '');
  if (!letters.length) return 0;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ');
}
