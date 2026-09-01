/**
 * Structural types for Unlayer's exported design JSON (the object returned by
 * `editor.saveDesign()` / accepted by `editor.loadDesign()`).
 *
 * These describe the wire format only — they are deliberately loose, because
 * Unlayer bumps `schemaVersion` without notice and ships tool-specific keys we
 * do not model. Every field the importer reads is optional and defaulted.
 */

export interface UnlayerLinkValues {
  href?: string;
  target?: string;
}

export interface UnlayerLink {
  name?: string;
  values?: UnlayerLinkValues;
}

export interface UnlayerBackgroundImage {
  url?: string;
  fullWidth?: boolean;
  repeat?: string | boolean;
  size?: string;
  position?: string;
  center?: boolean;
  cover?: boolean;
}

/** Unlayer's `displayCondition` is a raw before/after template pair, not an expression. */
export interface UnlayerDisplayCondition {
  type?: string;
  label?: string;
  description?: string;
  before?: string;
  after?: string;
}

export interface UnlayerContent {
  id?: string;
  /** e.g. 'text' | 'heading' | 'image' | 'button' | 'divider' | 'html' | 'menu' | 'social' | 'custom#my_tool' */
  type?: string;
  values?: Record<string, unknown>;
}

export interface UnlayerColumn {
  id?: string;
  contents?: UnlayerContent[];
  values?: Record<string, unknown>;
}

export interface UnlayerRow {
  id?: string;
  /** Relative column widths, e.g. `[1, 1]` for a 50/50 split. */
  cells?: number[];
  columns?: UnlayerColumn[];
  values?: Record<string, unknown>;
}

export interface UnlayerBody {
  id?: string;
  rows?: UnlayerRow[];
  values?: Record<string, unknown>;
}

export interface UnlayerDesign {
  counters?: Record<string, number>;
  body?: UnlayerBody;
  schemaVersion?: number;
}
