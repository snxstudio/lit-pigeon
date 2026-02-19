import type { PigeonPlugin, EditorStateSnapshot, TransactionSnapshot } from '../types/editor.js';
import {
  createHistoryState,
  pushToHistory,
  undoFromHistory,
  redoFromHistory,
  canUndo,
  canRedo,
  type HistoryState,
  type HistoryEntry,
} from './history.js';

export const HISTORY_PLUGIN_NAME = 'history';

export function createHistoryPlugin(): PigeonPlugin {
  return {
    name: HISTORY_PLUGIN_NAME,

    init(): HistoryState {
      return createHistoryState();
    },

    apply(tr: TransactionSnapshot, pluginState: unknown): HistoryState {
      const history = pluginState as HistoryState;

      // Skip history tracking for undo/redo operations
      if (tr.meta.get('isUndo') || tr.meta.get('isRedo')) {
        return tr.meta.get('newHistory') as HistoryState ?? history;
      }

      // Skip if no steps or explicitly skipped
      if (tr.steps.length === 0 || tr.meta.get('skipHistory')) {
        return history;
      }

      const entry: HistoryEntry = {
        steps: [...tr.steps],
        doc: (tr as any).doc,
        timestamp: Date.now(),
      };

      return pushToHistory(history, entry);
    },
  };
}

export function undo(state: EditorStateSnapshot, dispatch?: (tr: any) => void): boolean {
  const history = state.plugins.get(HISTORY_PLUGIN_NAME) as HistoryState | undefined;
  if (!history || !canUndo(history)) return false;

  if (dispatch) {
    const { history: newHistory, entry } = undoFromHistory(history);
    if (!entry) return false;

    const tr = (state as any).createTransaction();

    // Apply inverse steps
    for (let i = entry.steps.length - 1; i >= 0; i--) {
      const inverseStep = entry.steps[i].invert(tr.doc);
      tr.addStep(inverseStep);
    }

    tr.setMeta('isUndo', true);
    tr.setMeta('newHistory', newHistory);
    tr.setMeta('skipTimestamp', true);
    dispatch(tr);
  }

  return true;
}

export function redo(state: EditorStateSnapshot, dispatch?: (tr: any) => void): boolean {
  const history = state.plugins.get(HISTORY_PLUGIN_NAME) as HistoryState | undefined;
  if (!history || !canRedo(history)) return false;

  if (dispatch) {
    const { history: newHistory, entry } = redoFromHistory(history);
    if (!entry) return false;

    const tr = (state as any).createTransaction();

    // Re-apply steps
    for (const step of entry.steps) {
      tr.addStep(step);
    }

    tr.setMeta('isRedo', true);
    tr.setMeta('newHistory', newHistory);
    tr.setMeta('skipTimestamp', true);
    dispatch(tr);
  }

  return true;
}

export { canUndo, canRedo };
export type { HistoryState };
