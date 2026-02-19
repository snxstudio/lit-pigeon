import type { Spacing } from '@lit-pigeon/core';

/**
 * Converts a Spacing object to an MJML-compatible padding string.
 * Returns a CSS shorthand string in the order: top right bottom left.
 *
 * @example
 * spacingToMjml({ top: 10, right: 20, bottom: 10, left: 20 })
 * // => "10px 20px 10px 20px"
 */
export function spacingToMjml(spacing: Spacing): string {
  return `${spacing.top}px ${spacing.right}px ${spacing.bottom}px ${spacing.left}px`;
}
