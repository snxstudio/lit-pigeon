import type { ContentBlock, BlockType, RowNode } from './document.js';
import type { Command } from './editor.js';

export interface BlockCommands {
  insertBlock: (
    rowId: string,
    columnId: string,
    block: ContentBlock,
    index?: number,
  ) => Command;
  deleteBlock: (rowId: string, columnId: string, blockId: string) => Command;
  updateBlock: (
    rowId: string,
    columnId: string,
    blockId: string,
    values: Partial<ContentBlock['values']>,
  ) => Command;
  moveBlock: (
    fromRowId: string,
    fromColumnId: string,
    blockId: string,
    toRowId: string,
    toColumnId: string,
    toIndex: number,
  ) => Command;
  duplicateBlock: (rowId: string, columnId: string, blockId: string) => Command;
}

export interface RowCommands {
  insertRow: (row: RowNode, index?: number) => Command;
  deleteRow: (rowId: string) => Command;
  moveRow: (rowId: string, toIndex: number) => Command;
  duplicateRow: (rowId: string) => Command;
  updateRowAttributes: (
    rowId: string,
    attributes: Partial<RowNode['attributes']>,
  ) => Command;
}

export interface ColumnCommands {
  addColumn: (rowId: string) => Command;
  removeColumn: (rowId: string, columnId: string) => Command;
  resizeColumns: (rowId: string, ratios: number[]) => Command;
}

export type { Command, BlockType };
