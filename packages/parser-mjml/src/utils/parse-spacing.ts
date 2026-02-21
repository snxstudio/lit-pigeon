import type { Spacing } from '@lit-pigeon/core';

/**
 * Parses a CSS shorthand padding/margin string into a Spacing object.
 * Supports 1, 2, 3, or 4-value shorthand:
 *   "10px"              -> all sides 10
 *   "10px 20px"         -> top/bottom 10, left/right 20
 *   "10px 20px 30px"    -> top 10, left/right 20, bottom 30
 *   "10px 20px 30px 40px" -> top 10, right 20, bottom 30, left 40
 */
export function parseSpacing(value: string | undefined, fallback = 0): Spacing {
  if (!value) {
    return { top: fallback, right: fallback, bottom: fallback, left: fallback };
  }

  const parts = value.trim().split(/\s+/).map(parsePixelValue);

  switch (parts.length) {
    case 1:
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    case 2:
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    case 3:
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    case 4:
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    default:
      return { top: fallback, right: fallback, bottom: fallback, left: fallback };
  }
}

/**
 * Parses a CSS pixel value string (e.g. "10px", "10") to a number.
 */
export function parsePixelValue(value: string): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}
