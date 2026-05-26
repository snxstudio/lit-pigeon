import type { FigmaColor, FigmaNode, FigmaPaint } from './types.js';
import type { Spacing } from '@lit-pigeon/core';

export function rgbToHex({ r, g, b }: FigmaColor): string {
  const to2 = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

export function firstVisibleFill(fills: FigmaPaint[] | undefined): FigmaPaint | undefined {
  if (!fills) return undefined;
  return fills.find((f) => f.visible !== false);
}

export function solidHex(fills: FigmaPaint[] | undefined): string | undefined {
  const fill = firstVisibleFill(fills);
  if (!fill || fill.type !== 'SOLID') return undefined;
  return rgbToHex((fill as { color: FigmaColor }).color);
}

export function imageRefOf(fills: FigmaPaint[] | undefined): string | undefined {
  const fill = firstVisibleFill(fills);
  if (!fill || fill.type !== 'IMAGE') return undefined;
  return (fill as { imageRef?: string }).imageRef;
}

export function paddingFromAutolayout(node: FigmaNode): Spacing {
  return {
    top: Math.round(node.paddingTop ?? 0),
    right: Math.round(node.paddingRight ?? 0),
    bottom: Math.round(node.paddingBottom ?? 0),
    left: Math.round(node.paddingLeft ?? 0),
  };
}

export function isVisible(node: FigmaNode): boolean {
  return node.visible !== false;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
