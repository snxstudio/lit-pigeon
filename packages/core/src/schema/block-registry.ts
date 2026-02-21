import type { BlockType } from '../types/document.js';
import type { BlockDefinition } from '../types/editor.js';
import { getDefaultValues } from './defaults.js';

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

export function isKnownBlockType(type: string): type is BlockType {
  return registry.has(type);
}

// Auto-initialize
initBlockRegistry();
