import type { MergeTag } from '@lit-pigeon/core';

/** Unlayer's mergeTags option: tags keyed by id, optionally nested in named groups. */
export interface UnlayerMergeTag {
  name: string;
  value?: string;
  sample?: string;
  mergeTags?: Record<string, UnlayerMergeTag>;
}

/** Flattens Unlayer merge tags into Lit Pigeon's list, using group names as categories. */
export function convertUnlayerMergeTags(tags: Record<string, UnlayerMergeTag>, category?: string): MergeTag[] {
  return Object.entries(tags).flatMap(([id, tag]) =>
    tag.mergeTags
      ? convertUnlayerMergeTags(tag.mergeTags, tag.name)
      : [{ name: tag.value ?? `{{${id}}}`, label: tag.name, category, sample: tag.sample }],
  );
}
