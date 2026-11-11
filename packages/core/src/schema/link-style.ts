import type { LinkStyle } from '../types/document.js';

/**
 * Marks the `<mj-style>` block the renderer generates for `linkStyle`, so the
 * parser can lift it back into the document instead of collecting it as
 * hand-written CSS in `body.attributes.css`.
 */
export const LINK_STYLE_MARKER = '/* pigeon-link-style */';

/** The selector the rule is written under, and matched back out by. */
const LINK_SELECTOR = 'a, a:visited';

/**
 * Builds the CSS for a document's link style, or undefined when neither part
 * is set and there is nothing to say.
 *
 * Apple Mail is the client that will otherwise override this: it wraps dates,
 * addresses and phone numbers in its own `<a x-apple-data-detectors>`, which
 * would pick the brand link colour up from the rule above it, so those get
 * reset to whatever text surrounds them.
 */
export function linkStyleToCss(style: LinkStyle): string | undefined {
  const declarations = [
    style.color !== undefined && `color: ${style.color};`,
    style.underline !== undefined && `text-decoration: ${style.underline ? 'underline' : 'none'};`,
  ].filter(Boolean);
  if (!declarations.length) return undefined;

  return `${LINK_STYLE_MARKER}
${LINK_SELECTOR} { ${declarations.join(' ')} }
a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }`;
}

/**
 * Reads back what {@link linkStyleToCss} wrote. Returns undefined for anything
 * that is not our own generated block, so hand-written CSS is left alone.
 */
export function cssToLinkStyle(css: string): LinkStyle | undefined {
  if (!css.trimStart().startsWith(LINK_STYLE_MARKER)) return undefined;

  const rule = new RegExp(`${LINK_SELECTOR}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
  const color = /(?:^|;|\s)color:\s*([^;]+)/.exec(rule)?.[1].trim();
  const decoration = /text-decoration:\s*([^;]+)/.exec(rule)?.[1].trim();

  const style: LinkStyle = {
    ...(color !== undefined ? { color } : {}),
    ...(decoration !== undefined ? { underline: decoration === 'underline' } : {}),
  };
  return Object.keys(style).length ? style : undefined;
}
