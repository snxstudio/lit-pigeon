/**
 * MJML saved with @lit-pigeon/parser-mjml 0.1.6 or earlier contains
 * `<br></br>` (and `<img …></img>`, `<hr></hr>`), which renders as two line
 * breaks. Upgrading the parser does not change templates already stored, so
 * repair them once, before opening or as a data migration.
 */
export function repairVoidElements(mjml: string): string {
  return mjml.replace(/<(br|hr|img)(\s[^>]*)?>\s*<\/\1>/gi, (_match, tag: string, attrs = '') => `<${tag}${attrs} />`);
}
