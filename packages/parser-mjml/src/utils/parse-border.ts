import type { Border } from '@lit-pigeon/core';

/** Every CSS border style that paints something. */
const STYLES = /^(solid|dashed|dotted|double|groove|ridge|inset|outset)$/;

/**
 * Parses MJML's `border` shorthand into the document model's structured
 * border. The parts may come in any order, so each token is classified rather
 * than read positionally, and whatever is left over is the colour — joined
 * back with spaces so a functional notation like `rgb(0, 0, 0)` survives.
 *
 * Returns undefined when nothing would be painted: `none`, `hidden`, a zero
 * width, or an absent attribute. MJML's own default for `mj-button` is
 * `border: none`, so without that a round trip would give every button an
 * explicit border it never had.
 *
 * Styles the model cannot represent are read as `solid`, which is what a
 * client that does not support them falls back to anyway.
 */
export function parseBorder(value: string): Border | undefined {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return undefined;

  let width: number | undefined;
  let style: Border['style'] | undefined;
  const rest: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower === 'none' || lower === 'hidden') return undefined;

    if (width === undefined && /^\d*\.?\d+(px)?$/.test(lower)) {
      width = parseFloat(lower);
    } else if (style === undefined && STYLES.test(lower)) {
      style = lower === 'dashed' || lower === 'dotted' ? lower : 'solid';
    } else {
      rest.push(token);
    }
  }

  if (width === 0) return undefined;

  return {
    width: width ?? 1,
    style: style ?? 'solid',
    color: rest.join(' ') || '#000000',
  };
}
