import type {
  PigeonDocument,
  Spacing,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  SocialBlock,
  HtmlBlock,
  HeroBlock,
  NavBarBlock,
  ContentBlock,
  AnyBlock,
  BlockType,
  RowNode,
  ColumnNode,
} from '../types/document.js';
import { generateId } from '../utils/id.js';

export function defaultSpacing(all = 0): Spacing {
  return { top: all, right: all, bottom: all, left: all };
}

export function defaultTextValues(): TextBlock['values'] {
  return {
    content: '<p>Enter your text here</p>',
    padding: defaultSpacing(10),
    lineHeight: '1.5',
    textAlign: 'left',
  };
}

export function defaultImageValues(): ImageBlock['values'] {
  return {
    src: '',
    alt: '',
    width: 'auto',
    padding: defaultSpacing(10),
    alignment: 'center',
  };
}

export function defaultButtonValues(): ButtonBlock['values'] {
  return {
    content: '<p>Click me</p>',
    href: '#',
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    borderRadius: 4,
    padding: defaultSpacing(10),
    innerPadding: { top: 12, right: 24, bottom: 12, left: 24 },
    fontSize: 16,
    fontWeight: '600',
    alignment: 'center',
    fullWidth: false,
  };
}

export function defaultDividerValues(): DividerBlock['values'] {
  return {
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderStyle: 'solid',
    padding: defaultSpacing(10),
    width: '100%',
  };
}

export function defaultSpacerValues(): SpacerBlock['values'] {
  return { height: 20 };
}

export function defaultSocialValues(): SocialBlock['values'] {
  return {
    icons: [],
    iconSize: 32,
    spacing: 8,
    alignment: 'center',
    padding: defaultSpacing(10),
  };
}

export function defaultHtmlValues(): HtmlBlock['values'] {
  return {
    content: '',
    padding: defaultSpacing(0),
  };
}

export function defaultHeroValues(): HeroBlock['values'] {
  return {
    backgroundUrl: '',
    backgroundPosition: 'center center',
    mode: 'fluid-height',
    width: 600,
    height: 400,
    verticalAlign: 'middle',
    padding: defaultSpacing(0),
    innerPadding: defaultSpacing(20),
    backgroundColor: '#ffffff',
    content: '<p style="color:#ffffff;font-size:24px;">Hero Title</p>',
  };
}

export function defaultNavBarValues(): NavBarBlock['values'] {
  return {
    links: [
      { href: '#', text: 'Home' },
      { href: '#', text: 'About' },
      { href: '#', text: 'Contact' },
    ],
    hamburger: 'hamburger',
    alignment: 'center',
    padding: defaultSpacing(10),
    linkColor: '#000000',
    linkFontSize: 14,
    linkPadding: '10px 15px',
  };
}

const defaultValuesMap: Record<BlockType, () => ContentBlock['values']> = {
  text: defaultTextValues,
  image: defaultImageValues,
  button: defaultButtonValues,
  divider: defaultDividerValues,
  spacer: defaultSpacerValues,
  social: defaultSocialValues,
  html: defaultHtmlValues,
  hero: defaultHeroValues,
  navbar: defaultNavBarValues,
};

export function getDefaultValues(type: BlockType): ContentBlock['values'] {
  const factory = defaultValuesMap[type];
  if (!factory) {
    throw new Error(`Unknown block type: ${type}`);
  }
  return factory();
}

/**
 * Resolver for default values of *custom* (registry-defined) block types.
 *
 * Injected by the block registry (`initBlockRegistry`) rather than imported
 * directly, so `defaults.ts` never imports `block-registry.ts` — which would
 * create an evaluation-order cycle (the registry eagerly calls
 * `getDefaultValues` for built-ins at module load).
 */
type CustomDefaultsResolver = (type: string) => Record<string, unknown> | undefined;
let customDefaultsResolver: CustomDefaultsResolver | null = null;

/** @internal — wired up by the block registry; not part of the public API. */
export function _setCustomDefaultsResolver(resolver: CustomDefaultsResolver): void {
  customDefaultsResolver = resolver;
}

export function createBlock(
  type: BlockType,
  overrides?: Partial<ContentBlock['values']>,
): ContentBlock;
export function createBlock(
  type: string,
  overrides?: Record<string, unknown>,
): AnyBlock;
/**
 * Create a block of the given type with default values, optionally overriding
 * individual fields. Built-in types resolve their defaults from the schema;
 * custom types registered via `registerBlock` fall back to the registry's
 * `defaultValues`. Throws if the type is neither built-in nor registered.
 */
export function createBlock(
  type: string,
  overrides?: Record<string, unknown>,
): AnyBlock {
  const builtIn = defaultValuesMap[type as BlockType];
  if (builtIn) {
    return {
      id: generateId(),
      type,
      values: { ...builtIn(), ...overrides },
    } as ContentBlock;
  }

  const customDefaults = customDefaultsResolver?.(type);
  if (customDefaults) {
    return {
      id: generateId(),
      type,
      values: { ...structuredClone(customDefaults), ...overrides },
    };
  }

  throw new Error(`Unknown block type: ${type}`);
}

export function createColumn(blocks: ContentBlock[] = []): ColumnNode {
  return {
    id: generateId(),
    type: 'column',
    attributes: {
      padding: defaultSpacing(0),
      verticalAlign: 'top',
    },
    blocks,
  };
}

export function createRow(
  columns?: ColumnNode[],
  columnRatios?: number[],
): RowNode {
  const cols = columns ?? [createColumn()];
  const ratios = columnRatios ?? cols.map(() => Math.floor(12 / cols.length));
  return {
    id: generateId(),
    type: 'row',
    attributes: {
      padding: defaultSpacing(0),
      fullWidth: false,
    },
    columns: cols,
    columnRatios: ratios,
    locked: false,
  };
}

export function createDefaultDocument(name = 'Untitled'): PigeonDocument {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    metadata: {
      name,
      createdAt: now,
      updatedAt: now,
    },
    body: {
      attributes: {
        width: 600,
        backgroundColor: '#f4f4f5',
        fontFamily: 'Arial, Helvetica, sans-serif',
        contentAlignment: 'center',
      },
      rows: [],
    },
  };
}
