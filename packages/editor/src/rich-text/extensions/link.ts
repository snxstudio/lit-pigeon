import Link from '@tiptap/extension-link';

/**
 * Link extension with a protocol allowlist (http, https, mailto).
 * Stops `javascript:` and other scheme-based XSS at the schema level —
 * defence in depth complements the output sanitiser.
 */
export function buildLinkExtension() {
  return Link.configure({
    openOnClick: false,
    autolink: true,
    protocols: ['http', 'https', 'mailto', 'tel'],
    HTMLAttributes: {
      target: '_blank',
      rel: 'noopener',
    },
  });
}
