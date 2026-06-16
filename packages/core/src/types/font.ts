/**
 * A web/brand font a host registers so it appears in the editor font picker
 * and (when `url` is set) is emitted by the renderer as `<mj-font>`.
 */
export interface FontDefinition {
  /** Display name shown in the font picker. */
  name: string;
  /** CSS font-family stack, including email-safe fallbacks (e.g. "Inter, Arial, sans-serif"). */
  family: string;
  /** Optional stylesheet URL that loads the web font (e.g. a Google Fonts CSS link). */
  url?: string;
}
