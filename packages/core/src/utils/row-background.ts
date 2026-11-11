import type { RowNode } from '../types/document.js';

/** A row's background image with every MJML attribute resolved. */
export interface ResolvedRowBackground {
  url: string;
  repeat: 'repeat' | 'no-repeat';
  size: string;
  position: string;
}

/**
 * What a row without explicit background attributes has always rendered as:
 * the renderer hardcoded `cover`/`no-repeat` and left `background-position` to
 * MJML, whose `mj-section` default is `top center`. Documents written before
 * those attributes existed keep that meaning.
 */
const LEGACY: Omit<ResolvedRowBackground, 'url'> = {
  repeat: 'no-repeat',
  size: 'cover',
  position: 'top center',
};

/**
 * Resolves a row's background image to the values the renderer emits, so the
 * canvas and the export cannot disagree about how the image is cropped.
 * Returns undefined when the row has no background image.
 */
export function resolveRowBackground(row: RowNode): ResolvedRowBackground | undefined {
  const a = row.attributes;
  if (!a.backgroundImage) return undefined;
  return {
    url: a.backgroundImage,
    repeat: a.backgroundRepeat ?? LEGACY.repeat,
    size: a.backgroundSize ?? LEGACY.size,
    position: a.backgroundPosition ?? LEGACY.position,
  };
}
