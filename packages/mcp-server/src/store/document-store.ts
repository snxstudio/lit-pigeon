import {
  createDefaultDocument,
  createBlock,
  createColumn,
  createRow,
  generateId,
  isValidDocument,
  validateDocument,
} from '@lit-pigeon/core';
import type {
  PigeonDocument,
  BlockType,
  ContentBlock,
  RowNode,
  ColumnNode,
  ValidationError,
} from '@lit-pigeon/core';

export interface NewRowOptions {
  /** Column count, 1-4. Default 1. Either this or `ratios` may be supplied; if both, ratios wins. */
  columnCount?: number;
  /** Column width ratios summing to 12. Length determines column count. */
  ratios?: number[];
}

/**
 * In-memory key-value store of PigeonDocuments. Each document is keyed
 * by an opaque id returned from `create()`. The MCP server consumes one
 * shared store; agents can author multiple documents in a single session.
 */
export class DocumentStore {
  private _docs = new Map<string, PigeonDocument>();

  list(): Array<{ id: string; name: string; updatedAt: string }> {
    return Array.from(this._docs.entries()).map(([id, doc]) => ({
      id,
      name: doc.metadata.name,
      updatedAt: doc.metadata.updatedAt,
    }));
  }

  has(id: string): boolean {
    return this._docs.has(id);
  }

  get(id: string): PigeonDocument {
    const doc = this._docs.get(id);
    if (!doc) throw new Error(`Document not found: ${id}`);
    return doc;
  }

  create(name?: string): { id: string; document: PigeonDocument } {
    const id = generateId();
    const doc = createDefaultDocument(name);
    this._docs.set(id, doc);
    return { id, document: doc };
  }

  load(doc: PigeonDocument): { id: string; document: PigeonDocument } {
    const errors = validateDocument(doc);
    if (errors.length > 0) {
      throw new Error(`Invalid document: ${JSON.stringify(errors, null, 2)}`);
    }
    const id = generateId();
    this._docs.set(id, doc);
    return { id, document: doc };
  }

  /** Replaces the entire document under `id`. Validates first. */
  replace(id: string, doc: PigeonDocument): PigeonDocument {
    const errors = validateDocument(doc);
    if (errors.length > 0) {
      throw new Error(`Invalid document: ${JSON.stringify(errors, null, 2)}`);
    }
    if (!this._docs.has(id)) throw new Error(`Document not found: ${id}`);
    this._docs.set(id, doc);
    return doc;
  }

  validate(id: string): ValidationError[] {
    return validateDocument(this.get(id));
  }

  /** Adds a new row to the body. Returns the row + its first column's id (handy for the AI's next step). */
  addRow(documentId: string, opts: NewRowOptions = {}): { row: RowNode; columnIds: string[] } {
    const doc = this.get(documentId);
    const ratios = normaliseRatios(opts);
    const columns: ColumnNode[] = ratios.map(() => createColumn());
    const row = createRow(columns);
    // createRow respects the ratios passed in, but our helper signature
    // takes columns only — patch the ratios + columnRatios manually.
    row.columnRatios = ratios;
    doc.body.rows.push(row);
    bumpTimestamp(doc);
    return { row, columnIds: columns.map((c) => c.id) };
  }

  /** Appends a block to a column. */
  addBlock(
    documentId: string,
    rowId: string,
    columnId: string,
    blockType: BlockType,
    overrides?: Record<string, unknown>,
  ): ContentBlock {
    const doc = this.get(documentId);
    const { column } = locateColumn(doc, rowId, columnId);
    const block = createBlock(blockType, overrides as Partial<ContentBlock['values']>);
    column.blocks.push(block);
    bumpTimestamp(doc);
    return block;
  }

  updateBlock(
    documentId: string,
    rowId: string,
    columnId: string,
    blockId: string,
    values: Record<string, unknown>,
  ): ContentBlock {
    const doc = this.get(documentId);
    const { column } = locateColumn(doc, rowId, columnId);
    const block = column.blocks.find((b) => b.id === blockId);
    if (!block) throw new Error(`Block not found: ${blockId} in column ${columnId}`);
    block.values = { ...block.values, ...values } as ContentBlock['values'];
    if (!isValidDocument(doc)) {
      // Re-run validation to expose the offending field in the error message.
      throw new Error(`Updated block produced an invalid document: ${JSON.stringify(validateDocument(doc), null, 2)}`);
    }
    bumpTimestamp(doc);
    return block;
  }

  deleteBlock(
    documentId: string,
    rowId: string,
    columnId: string,
    blockId: string,
  ): void {
    const doc = this.get(documentId);
    const { column } = locateColumn(doc, rowId, columnId);
    const idx = column.blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) throw new Error(`Block not found: ${blockId} in column ${columnId}`);
    column.blocks.splice(idx, 1);
    bumpTimestamp(doc);
  }

  setBodyAttribute(documentId: string, attribute: string, value: unknown): void {
    const doc = this.get(documentId);
    (doc.body.attributes as Record<string, unknown>)[attribute] = value;
    bumpTimestamp(doc);
  }

  setMetadata(documentId: string, patch: Partial<PigeonDocument['metadata']>): void {
    const doc = this.get(documentId);
    Object.assign(doc.metadata, patch);
    bumpTimestamp(doc);
  }
}

function normaliseRatios(opts: NewRowOptions): number[] {
  if (opts.ratios) {
    if (opts.ratios.length < 1 || opts.ratios.length > 4) {
      throw new Error(`ratios must have 1-4 entries; got ${opts.ratios.length}`);
    }
    const sum = opts.ratios.reduce((a, b) => a + b, 0);
    if (sum !== 12) throw new Error(`ratios must sum to 12 (got ${sum})`);
    return opts.ratios;
  }
  const count = opts.columnCount ?? 1;
  if (count < 1 || count > 4) throw new Error(`columnCount must be 1-4; got ${count}`);
  if (count === 1) return [12];
  if (count === 2) return [6, 6];
  if (count === 3) return [4, 4, 4];
  return [3, 3, 3, 3];
}

function locateColumn(doc: PigeonDocument, rowId: string, columnId: string): { row: RowNode; column: ColumnNode } {
  const row = doc.body.rows.find((r) => r.id === rowId);
  if (!row) throw new Error(`Row not found: ${rowId}`);
  const column = row.columns.find((c) => c.id === columnId);
  if (!column) throw new Error(`Column not found: ${columnId} in row ${rowId}`);
  return { row, column };
}

function bumpTimestamp(doc: PigeonDocument): void {
  doc.metadata.updatedAt = new Date().toISOString();
}
