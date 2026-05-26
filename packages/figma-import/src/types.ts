/**
 * Minimal subset of the Figma REST API node shape we consume. We don't depend
 * on a Figma SDK — the consumer can either pass an already-fetched node or
 * call our small `fetchFigmaFile` helper.
 *
 * Reference: https://www.figma.com/developers/api#node-types
 */

export interface FigmaColor {
  r: number; // 0..1
  g: number;
  b: number;
  a?: number;
}

export interface FigmaPaintSolid {
  type: 'SOLID';
  color: FigmaColor;
  opacity?: number;
  visible?: boolean;
}

export interface FigmaPaintImage {
  type: 'IMAGE';
  imageRef?: string;
  scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  visible?: boolean;
}

export type FigmaPaint = FigmaPaintSolid | FigmaPaintImage | { type: string; visible?: boolean };

export interface FigmaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaTextStyle {
  fontFamily?: string;
  fontPostScriptName?: string;
  fontWeight?: number;
  fontSize?: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  letterSpacing?: number;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string; // 'FRAME' | 'TEXT' | 'RECTANGLE' | 'GROUP' | 'COMPONENT' | 'INSTANCE' | 'VECTOR' | 'ELLIPSE' | ...
  visible?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: FigmaRect;

  // Frame autolayout fields
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';

  // Fills / colors
  fills?: FigmaPaint[];
  background?: FigmaPaint[];
  backgroundColor?: FigmaColor;
  cornerRadius?: number;

  // Text
  characters?: string;
  style?: FigmaTextStyle;
  characterStyleOverrides?: number[];

  // Image refs resolved per file via the `imageRef` map (separate API endpoint).
  imageRef?: string;
}

export interface ImportOptions {
  /** Map of Figma `imageRef` → public URL (from Figma's GET /images endpoint or your own CDN). */
  imageUrls?: Record<string, string>;
  /** Email title; defaults to the frame's name. */
  documentName?: string;
  /** Preheader text. */
  previewText?: string;
  /** Canvas width override; defaults to the frame's measured width, clamped to [300, 800]. */
  canvasWidth?: number;
}

export interface ImportResult {
  document: import('@lit-pigeon/core').PigeonDocument;
  /** Soft warnings — nodes we skipped or guessed about. */
  warnings: string[];
}
