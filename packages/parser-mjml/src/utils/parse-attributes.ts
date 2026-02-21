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
