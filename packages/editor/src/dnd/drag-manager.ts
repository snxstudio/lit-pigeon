/**
 * Drag-and-drop manager using native HTML5 drag/drop API.
 * Stores drag state globally so any component can query it.
 */

export type DragItemType = 'palette-block' | 'palette-row' | 'existing-block';

export interface DragData {
  type: DragItemType;
  /** Block type for palette-block drags (e.g. 'text', 'image') */
  blockType?: string;
  /** Number of columns for palette-row drags */
  columnCount?: number;
  /** Existing block info for rearranging */
  blockId?: string;
  rowId?: string;
  columnId?: string;
}

let _currentDrag: DragData | null = null;

export function setDragData(data: DragData): void {
  _currentDrag = data;
}

export function getDragData(): DragData | null {
  return _currentDrag;
}

export function clearDragData(): void {
  _currentDrag = null;
}

/**
 * Serialize drag data to the DataTransfer object for native DnD.
 */
export function writeDragTransfer(e: DragEvent, data: DragData): void {
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
  }
  setDragData(data);
}

/**
 * Read drag data from the DataTransfer object.
 * Falls back to the global store if DataTransfer is unavailable (dragover).
 */
export function readDragTransfer(e: DragEvent): DragData | null {
  if (e.dataTransfer) {
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) return JSON.parse(raw) as DragData;
    } catch {
      // Ignore parse errors
    }
  }
  return getDragData();
}
