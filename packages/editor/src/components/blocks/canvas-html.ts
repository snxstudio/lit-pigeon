/**
 * Allowlist sanitiser for stored HTML shown in the editor canvas (text, hero,
 * button and custom `renderCanvas` blocks). Imported content can carry script
 * (`<img onerror>`, `javascript:` links), and the canvas renders in the host
 * page's origin. Display only: stored content and export are never touched.
 *
 * Kept small and eager on purpose: the rich-text sanitiser lives in the lazy
 * TipTap chunk and only allows the markup TipTap itself produces, whereas the
 * canvas must keep email markup (tables, inline styles, font, images).
 *
 * Dropped with their content: script, style, iframe, object, embed, form,
 * meta, base, link, svg, math and similar. Other unknown tags are unwrapped.
 * Attributes outside the allowlist (including every on* handler) are removed,
 * as are javascript:, vbscript: and non-image data: URLs.
 */

const ALLOWED_TAGS = new Set(
  ('a abbr address b bdi bdo big blockquote br caption center cite code col colgroup dd del dfn div dl dt em ' +
    'figcaption figure font h1 h2 h3 h4 h5 h6 hr i img ins kbd li mark ol p pre q s samp small span strike strong ' +
    'sub sup table tbody td tfoot th thead tr tt u ul var wbr').split(' '),
);

const DROPPED_TAGS = new Set(
  ('script style iframe frame frameset object embed applet form input button select textarea option meta base ' +
    'link svg math noscript template title head').split(' '),
);

const ALLOWED_ATTRS = new Set(
  ('style class id title dir lang role href target rel name src alt width height align valign bgcolor background ' +
    'border cellpadding cellspacing colspan rowspan color face size start type').split(' '),
);

const URL_ATTRS = new Set(['href', 'src', 'background']);

// Browsers ignore ASCII whitespace and control characters inside a scheme.
const UNSAFE_URL = /^(?:javascript|vbscript|data(?!:image\/(?:png|gif|jpe?g|webp)[;,])):/i;

export function sanitizeCanvasHTML(input: string): string {
  if (typeof DOMParser === 'undefined' || !input.includes('<')) return input;
  // DOMParser documents are inert: nothing in them runs or loads.
  const body = new DOMParser().parseFromString(`<body>${input}`, 'text/html').body;
  for (const el of Array.from(body.querySelectorAll('*'))) {
    const tag = el.localName;
    if (DROPPED_TAGS.has(tag)) {
      el.remove();
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      el.replaceWith(...Array.from(el.childNodes));
      continue;
    }
    for (const { name, value } of Array.from(el.attributes)) {
      if (
        !(ALLOWED_ATTRS.has(name) || name.startsWith('data-') || name.startsWith('aria-')) ||
        // eslint-disable-next-line no-control-regex
        (URL_ATTRS.has(name) && UNSAFE_URL.test(value.replace(/[\x00-\x20]/g, '')))
      ) {
        el.removeAttribute(name);
      }
    }
  }
  return body.innerHTML;
}
