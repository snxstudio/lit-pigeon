import type { PigeonEditor } from '@lit-pigeon/editor';
import { getStarterTemplate, type PigeonDocument } from '@lit-pigeon/core';

export function starter(id = 'starter-welcome'): PigeonDocument {
  return structuredClone(getStarterTemplate(id)!.document);
}

export async function findEditor(root: ParentNode = document): Promise<PigeonEditor> {
  const el = root.querySelector('pigeon-editor') as PigeonEditor | null;
  if (!el) throw new Error('no <pigeon-editor> rendered');
  await el.updateComplete;
  return el;
}

export function tick(ms = 0): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
