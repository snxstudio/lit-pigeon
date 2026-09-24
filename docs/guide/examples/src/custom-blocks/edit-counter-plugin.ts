import type { PigeonPlugin } from '@lit-pigeon/core';

export const EDIT_COUNTER = 'edit-counter';

/**
 * A state plugin: counts transactions that changed the document, and reports
 * each change. Pass it in config.plugins before the editor connects.
 */
export function createEditCounterPlugin(onEdit: (count: number) => void): PigeonPlugin {
  return {
    name: EDIT_COUNTER,
    init: () => 0,
    apply: (tr, count) => (tr.steps.length > 0 ? (count as number) + 1 : count),
    onStateChange: (next, previous) => {
      const count = next.plugins.get(EDIT_COUNTER) as number;
      if (count !== previous.plugins.get(EDIT_COUNTER)) onEdit(count);
    },
  };
}
