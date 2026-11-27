import type { Border } from '@lit-pigeon/core';

/**
 * Converts a Border object to the CSS shorthand MJML's `border` attribute
 * takes. A zero width paints nothing, so it returns an empty string and the
 * caller leaves the attribute off rather than emitting `0px solid …`.
 *
 * @example
 * borderToMjml({ width: 2, style: 'solid', color: '#e8590c' })
 * // => "2px solid #e8590c"
 */
export function borderToMjml(border: Border): string {
  return border.width > 0 ? `${border.width}px ${border.style} ${border.color}` : '';
}
