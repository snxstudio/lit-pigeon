import type { LintIssue, LintRule } from '../types.js';
import { collectBlocks } from '../walk.js';

/**
 * WCAG AA contrast check for button text against its background. Other blocks
 * (text, hero) typically style content via HTML that we can't easily parse;
 * buttons expose clean `textColor` + `backgroundColor` values, so they're the
 * highest-leverage target.
 */
export const contrastRule: LintRule = {
  id: 'contrast',
  description: 'Button text must meet WCAG AA contrast against its background.',
  check(doc) {
    const issues: LintIssue[] = [];
    for (const hit of collectBlocks(doc)) {
      if (hit.block.type !== 'button') continue;
      const values = hit.block.values as { textColor?: string; backgroundColor?: string; fontSize?: number; fontWeight?: string };
      const fg = parseColor(values.textColor);
      const bg = parseColor(values.backgroundColor);
      if (!fg || !bg) continue;
      const ratio = contrastRatio(fg, bg);
      // Large text (>=18pt, or >=14pt bold) needs only 3:1; everything else 4.5:1.
      const isLarge =
        (values.fontSize ?? 16) >= 18 ||
        ((values.fontSize ?? 16) >= 14 && /^(600|700|800|900|bold|bolder)$/i.test(values.fontWeight ?? ''));
      const threshold = isLarge ? 3 : 4.5;
      if (ratio < threshold) {
        issues.push({
          rule: 'contrast/insufficient',
          severity: 'warning',
          message: `Button contrast ratio is ${ratio.toFixed(2)}:1, below WCAG AA (${threshold}:1).`,
          path: hit.path,
          blockId: hit.block.id,
        });
      }
    }
    return issues;
  },
};

interface Rgb { r: number; g: number; b: number }

function parseColor(input: string | undefined): Rgb | null {
  if (!input) return null;
  const value = input.trim();
  // #rgb / #rrggbb
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const v = hex[1];
    const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  // rgb(255, 255, 255) — minimal parser, no rgba/percent support
  const rgb = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (rgb) {
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  }
  return null;
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg: Rgb, bg: Rgb): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
