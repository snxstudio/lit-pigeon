import type { DeviceVisibility } from '@lit-pigeon/core';

/**
 * Safely gets an attribute value from an attributes object.
 */
export function getAttr(attrs: Record<string, string>, name: string, fallback = ''): string {
  return attrs[name] ?? fallback;
}

/**
 * Gets an attribute value as a number, stripping 'px' suffix.
 */
export function getNumericAttr(attrs: Record<string, string>, name: string, fallback = 0): number {
  const val = attrs[name];
  if (val === undefined || val === '') return fallback;
  const num = parseFloat(val);
  return isNaN(num) ? fallback : num;
}

/**
 * Gets a boolean-like attribute (e.g., "full-width" presence).
 */
export function getBoolAttr(attrs: Record<string, string>, name: string): boolean {
  const val = attrs[name];
  return val !== undefined && val !== 'false' && val !== '';
}

/**
 * Moves the renderer's `pigeon-hide-mobile` / `pigeon-hide-desktop` classes
 * out of `css-class` into visibility flags, leaving any other classes. Only
 * flags that are set appear in the result.
 */
export function takeVisibility(attrs: Record<string, string>): DeviceVisibility {
  const flags: DeviceVisibility = {};
  const cls = attrs['css-class'];
  if (!cls) return flags;
  const rest = cls
    .replace(/(^|\s)pigeon-hide-(mobile|desktop)(?=\s|$)/g, (_, _s, device) => {
      flags[device === 'mobile' ? 'hideOnMobile' : 'hideOnDesktop'] = true;
      return '';
    })
    .trim();
  if (rest) attrs['css-class'] = rest;
  else delete attrs['css-class'];
  return flags;
}
