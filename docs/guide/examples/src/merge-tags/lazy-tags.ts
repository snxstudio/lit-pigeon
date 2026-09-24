import type { PigeonEditor } from '@lit-pigeon/editor';
import type { MergeTag } from '@lit-pigeon/core';

/**
 * Loads merge tags the first time the user clicks a Tag button. The editor
 * fires pigeon:merge-tag-request on every click while it has no tags, so load
 * once and ignore clicks while a request is in flight.
 */
export function provideMergeTagsOnDemand(editor: PigeonEditor, load: () => Promise<MergeTag[]>): void {
  // An empty mergeTags object shows the Tag button without any tags.
  editor.config = { ...editor.config, mergeTags: {} };
  let pending: Promise<void> | undefined;
  editor.addEventListener('pigeon:merge-tag-request', () => {
    pending ??= load()
      .then((tags) => editor.setMergeTags(tags))
      .catch(() => {
        pending = undefined;
      });
  });
}
