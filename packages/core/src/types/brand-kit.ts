/**
 * A single saved color in a brand kit. Hex (`#rrggbb`/`#rgb`) recommended;
 * any CSS color string is accepted at storage time.
 */
export interface BrandColor {
  /** Stable, URL-safe slug used as the storage key. */
  id: string;
  name: string;
  value: string;
}

/**
 * A saved font family with the weights the brand uses. `family` is the
 * value that will appear in CSS `font-family`, including fallbacks.
 */
export interface BrandFont {
  id: string;
  name: string;
  family: string;
  weights?: number[];
  /** Where to load the webfont from, e.g. a Google Fonts URL. */
  url?: string;
}

/** A saved logo asset — typically a transparent-background image. */
export interface BrandLogo {
  id: string;
  name: string;
  /** Public URL of the logo asset. */
  src: string;
  /** Width hint in px used when pre-populating logo-bearing blocks. */
  width?: number;
}

/**
 * The full saved brand kit. Multiple kits can coexist (different sub-brands,
 * regions, or seasonal palettes) so the storage layer is keyed by id.
 */
export interface BrandKit {
  id: string;
  name: string;
  description?: string;
  colors: BrandColor[];
  fonts: BrandFont[];
  logos: BrandLogo[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Pluggable persistence for brand kits. Mirrors {@link TemplateStorage}.
 */
export interface BrandKitStorage {
  list(): Promise<BrandKit[]>;
  get(id: string): Promise<BrandKit | null>;
  save(kit: BrandKit): Promise<void>;
  delete(id: string): Promise<void>;
}
