import type { Spacing } from '@lit-pigeon/core';

/**
 * Parses a CSS shorthand padding string into a Spacing object.
 * Supports 1, 2, 3, or 4-value shorthand, matching CSS semantics.
 */
export function parseSpacing(value: unknown, fallback = 0): Spacing {
  const all = (n: number): Spacing => ({ top: n, right: n, bottom: n, left: n });
  if (typeof value !== 'string' || !value.trim()) return all(fallback);

  const parts = value.trim().split(/\s+/).map((p) => px(p, fallback));
  switch (parts.length) {
    case 1: return all(parts[0]);
    case 2: return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    case 3: return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    case 4: return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    default: return all(fallback);
  }
}

/** Coerces a `"17px"` / `17` / `"17"` value to a number. */
export function px(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value !== 'string') return fallback;
  const n = parseFloat(value);
  return Number.isNaN(n) ? fallback : n;
}

export function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Unlayer writes `""` for "not set" on colour fields, which is not a valid CSS
 * colour. Treat empty/whitespace as absent so callers can fall through to their
 * own default rather than emitting `color: ;`.
 */
export function color(value: unknown): string | undefined {
  const s = str(value).trim();
  return s ? s : undefined;
}

/**
 * Unlayer writes font weights either as a CSS keyword (`"normal"`, `"bold"`) or
 * as a numeric weight, which older designs store as a number and newer ones as
 * a string. Normalises both to the string `mj-button` expects, and treats
 * `""`/absent as unset so callers can fall through to their own default.
 */
export function weight(value: unknown): string | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : undefined;
  const s = str(value).trim();
  return s ? s : undefined;
}

export function align(value: unknown, fallback: 'left' | 'center' | 'right' = 'left'): 'left' | 'center' | 'right' {
  return value === 'left' || value === 'center' || value === 'right' ? value : fallback;
}

/** Reads a nested key path off a loose record, e.g. `dig(v, 'src', 'url')`. */
export function dig(source: unknown, ...path: string[]): unknown {
  let cur: unknown = source;
  for (const key of path) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/**
 * Converts Unlayer's relative `cells` widths to Lit Pigeon's 12-column grid.
 * `[1]` → `[12]`, `[1, 1]` → `[6, 6]`, `[1, 2]` → `[4, 8]`.
 *
 * Ratios are rounded independently and can therefore drift off 12, so the
 * remainder is applied to the widest column — the one where a 1/12 nudge is
 * least visible.
 */
export function cellsToRatios(cells: number[] | undefined, columnCount: number): number[] {
  if (columnCount <= 0) return [];

  const source = cells && cells.length === columnCount && cells.every((c) => c > 0)
    ? cells
    : new Array<number>(columnCount).fill(1);

  const total = source.reduce((a, b) => a + b, 0);
  const ratios = source.map((c) => Math.max(1, Math.round((c * 12) / total)));

  let drift = 12 - ratios.reduce((a, b) => a + b, 0);
  while (drift !== 0) {
    // Widen (or narrow) the largest column, never below 1.
    const idx = drift > 0
      ? ratios.indexOf(Math.max(...ratios))
      : ratios.indexOf(Math.max(...ratios.filter((r) => r > 1)));
    if (idx === -1) break;
    ratios[idx] += drift > 0 ? 1 : -1;
    drift += drift > 0 ? -1 : 1;
  }

  return ratios;
}
