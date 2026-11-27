import type { BlockType } from '../types/document.js';
import type { BlockDefinition } from '../types/editor.js';
import { getDefaultValues, _setCustomDefaultsResolver } from './defaults.js';

const registry = new Map<string, BlockDefinition>();

const BUILT_IN_BLOCKS: BlockDefinition[] = [
  {
    type: 'text',
    label: 'Text',
    icon: 'text',
    defaultValues: getDefaultValues('text') as Record<string, unknown>,
  },
  {
    type: 'image',
    label: 'Image',
    icon: 'image',
    defaultValues: getDefaultValues('image') as Record<string, unknown>,
  },
  {
    type: 'button',
    label: 'Button',
    icon: 'button',
    defaultValues: getDefaultValues('button') as Record<string, unknown>,
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: 'divider',
    defaultValues: getDefaultValues('divider') as Record<string, unknown>,
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: 'spacer',
    defaultValues: getDefaultValues('spacer') as Record<string, unknown>,
  },
  {
    type: 'social',
    label: 'Social',
    icon: 'social',
    defaultValues: getDefaultValues('social') as Record<string, unknown>,
  },
  {
    type: 'html',
    label: 'HTML',
    icon: 'html',
    defaultValues: getDefaultValues('html') as Record<string, unknown>,
  },
  {
    type: 'hero',
    label: 'Hero',
    icon: 'hero',
    defaultValues: getDefaultValues('hero') as Record<string, unknown>,
  },
  {
    type: 'navbar',
    label: 'Navbar',
    icon: 'navbar',
    defaultValues: getDefaultValues('navbar') as Record<string, unknown>,
  },
];

export function initBlockRegistry(): void {
  for (const def of BUILT_IN_BLOCKS) {
    registry.set(def.type, def);
  }
  // Let createBlock() construct registry-defined custom blocks by resolving
  // their default values here. Injected (not imported by defaults.ts) to keep
  // the defaults ↔ registry dependency one-directional.
  _setCustomDefaultsResolver((type) => registry.get(type)?.defaultValues);
}

export function registerBlock(definition: BlockDefinition): void {
  registry.set(definition.type, definition);
}

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return registry.get(type);
}

export function getAllBlockDefinitions(): BlockDefinition[] {
  return Array.from(registry.values());
}

/**
 * Block types the host has opted into, in palette order. `undefined` means no
 * restriction — every registered block is offered, which is the default.
 */
let availableTypes: string[] | undefined;

/**
 * Restricts the editor to `types`, in the order given. Pass `undefined` to
 * lift the restriction. Availability gates *insertion*, not rendering: a
 * document that already contains a type the host left out still renders, so
 * narrowing the palette never blanks a saved template.
 */
export function setAvailableBlockTypes(types: readonly string[] | undefined): void {
  availableTypes = types ? [...types] : undefined;
}

/**
 * Whether a block of `type` may be inserted. Enforced in `insertBlock`, so
 * the palette, the keyboard, the MCP server and the REST handler are all held
 * to it rather than only the palette.
 */
export function isBlockTypeAvailable(type: string): boolean {
  return availableTypes ? availableTypes.includes(type) : true;
}

/**
 * The definitions the palette offers: every registered block by default, or
 * the host's list in its own order. A listed type nobody registered is
 * skipped rather than rendered as a broken chip.
 */
export function getAvailableBlockDefinitions(): BlockDefinition[] {
  if (!availableTypes) return getAllBlockDefinitions();
  return availableTypes
    .map((type) => registry.get(type))
    .filter((def): def is BlockDefinition => def !== undefined);
}

export function isKnownBlockType(type: string): type is BlockType {
  return registry.has(type);
}

// Auto-initialize
initBlockRegistry();
