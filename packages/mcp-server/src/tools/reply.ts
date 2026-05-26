/**
 * Helpers for shaping MCP tool replies. Every tool returns a `content`
 * array; each entry is `{ type: 'text', text: '...' }`. JSON payloads
 * are stringified into a single text entry — clients can JSON.parse.
 */

export function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

export function jsonResult(value: unknown) {
  return textResult(JSON.stringify(value, null, 2));
}
