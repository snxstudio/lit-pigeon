import type { LinkType } from '../types/link-type.js';

/**
 * Built-in system link types. `unsubscribe`/`view-in-browser` emit fixed
 * `{{…}}` placeholder hrefs (conventional ESP tokens, resolved by the host at
 * send time); `email`/`phone` prompt for a value and build `mailto:`/`tel:`.
 */
export const SYSTEM_LINK_TYPES: LinkType[] = [
  { id: 'unsubscribe', label: 'Unsubscribe', href: '{{unsubscribe_url}}' },
  { id: 'view-in-browser', label: 'View in browser', href: '{{view_in_browser_url}}' },
  { id: 'email', label: 'Email address', prompt: 'email' },
  { id: 'phone', label: 'Phone number', prompt: 'tel' },
];
