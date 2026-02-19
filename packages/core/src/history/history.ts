import type { PigeonDocument } from '../types/document.js';
import type { Step } from '../types/editor.js';

export interface HistoryState {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
}

export interface HistoryEntry {
  steps: Step[];
  doc: PigeonDocument;
  timestamp: number;
}

const MAX_HISTORY = 100;

export function createHistoryState(): HistoryState {
  return {
    undoStack: [],
    redoStack: [],
  };
}

export function pushToHistory(
  history: HistoryState,
  entry: HistoryEntry,
): HistoryState {
  const undoStack = [...history.undoStack, entry];
  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }
  return {
    undoStack,
    redoStack: [], // Clear redo stack on new change
  };
}

export function undoFromHistory(history: HistoryState): {
  history: HistoryState;
  entry: HistoryEntry | null;
} {
  if (history.undoStack.length === 0) {
    return { history, entry: null };
  }

  const undoStack = [...history.undoStack];
  const entry = undoStack.pop()!;
  const redoStack = [...history.redoStack, entry];

  return {
    history: { undoStack, redoStack },
    entry,
  };
}

export function redoFromHistory(history: HistoryState): {
  history: HistoryState;
  entry: HistoryEntry | null;
} {
  if (history.redoStack.length === 0) {
    return { history, entry: null };
  }

  const redoStack = [...history.redoStack];
  const entry = redoStack.pop()!;
  const undoStack = [...history.undoStack, entry];

  return {
    history: { undoStack, redoStack },
    entry,
  };
}

export function canUndo(history: HistoryState): boolean {
  return history.undoStack.length > 0;
}

export function canRedo(history: HistoryState): boolean {
  return history.redoStack.length > 0;
}
