import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  EditorState,
  type PigeonDocument,
  type EditorConfig,
  type BlockType,
  createHistoryPlugin,
  createDefaultDocument,
  createBlock,
  createRow,
  createColumn,
  createBodySelection,
  createRowSelection,
  createBlockSelection,
  insertBlock,
  updateBlock,
  moveBlock,
  insertRow,
  deleteRow,
  moveRow,
  duplicateRow,
  updateRowAttributes,
  resizeColumns,
  addColumn,
  removeColumn,
  undo as coreUndo,
  redo as coreRedo,
  canUndo as coreCanUndo,
  canRedo as coreCanRedo,
  HISTORY_PLUGIN_NAME,
  createDocStep,
} from '@lit-pigeon/core';
import type { HistoryState, TransactionSnapshot } from '@lit-pigeon/core';

import './components/toolbar/pigeon-toolbar.js';
import './components/palette/pigeon-palette.js';
import './components/canvas/pigeon-canvas.js';
import './components/properties/pigeon-properties.js';
import type { DragData } from './dnd/drag-manager.js';

/**
 * `<pigeon-editor>` -- the main shell component for the Pigeon email editor.
 *
 * @element pigeon-editor
 * @fires pigeon:change - Fired whenever the document changes
 * @fires pigeon:select - Fired when the selection changes
 * @fires pigeon:ready  - Fired once after the editor has initialised
 * @fires pigeon:preview - Fired when the user clicks Preview in the toolbar
 * @fires pigeon:export  - Fired when the user clicks Export in the toolbar
 *
 * @csspart toolbar - The toolbar area
 * @csspart palette - The left palette area
 * @csspart canvas  - The central canvas area
 * @csspart properties - The right property panel area
 */
@customElement('pigeon-editor')
export class PigeonEditor extends LitElement {
  /* ------------------------------------------------------------------ */
  /*  Public reactive properties                                         */
  /* ------------------------------------------------------------------ */

  /** Optional initial document. If not set a blank document is created. */
  @property({ type: Object })
  document: PigeonDocument | undefined;

  /** Additional editor configuration passed to EditorState.create(). */
  @property({ type: Object })
  config: Partial<EditorConfig> = {};

  /* ------------------------------------------------------------------ */
  /*  Internal state                                                     */
  /* ------------------------------------------------------------------ */

  @state() private _state!: EditorState;
  @state() private _canUndo = false;
  @state() private _canRedo = false;
  @state() private _device: 'desktop' | 'mobile' = 'desktop';

  /* ------------------------------------------------------------------ */
  /*  Styles                                                             */
  /* ------------------------------------------------------------------ */

  static styles = css`
    /* Theme variables (default theme) */
    :host {
      --pigeon-primary: #3b82f6;
      --pigeon-primary-hover: #2563eb;
      --pigeon-bg: #ffffff;
      --pigeon-surface: #f8fafc;
      --pigeon-surface-hover: #f1f5f9;
      --pigeon-text: #1e293b;
      --pigeon-text-secondary: #64748b;
      --pigeon-border: #e2e8f0;
      --pigeon-border-focus: #3b82f6;
      --pigeon-radius: 6px;
      --pigeon-radius-sm: 4px;
      --pigeon-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --pigeon-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
      --pigeon-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      --pigeon-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
      --pigeon-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      --pigeon-canvas-bg: #e2e8f0;
      --pigeon-palette-width: 240px;
      --pigeon-properties-width: 300px;
      --pigeon-toolbar-height: 48px;
      --pigeon-drop-color: #3b82f6;
      --pigeon-selected-outline: #3b82f6;
      --pigeon-danger: #ef4444;
      --pigeon-success: #22c55e;

      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      font-family: var(--pigeon-font);
      color: var(--pigeon-text);
      overflow: hidden;
      box-sizing: border-box;
    }

    .editor-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
  `;

  /* ------------------------------------------------------------------ */
  /*  Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  connectedCallback() {
    super.connectedCallback();
    this._initState();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('document') && this._state) {
      // If the consumer sets a new document property, reload
      if (this.document && this.document !== this._state.doc) {
        this.loadDocument(this.document);
      }
    }
  }

  firstUpdated() {
    this.dispatchEvent(new CustomEvent('pigeon:ready', {
      bubbles: true,
      composed: true,
    }));
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  /** Returns the current PigeonDocument. */
  getDocument(): PigeonDocument {
    return this._state.doc;
  }

  /** Replaces the document entirely (resets history). */
  loadDocument(doc: PigeonDocument) {
    this._state = EditorState.create({
      doc,
      plugins: [createHistoryPlugin()],
      ...this.config,
    });
    this._syncHistoryFlags();
    this.requestUpdate();
    this._fireChange();
  }

  /** Undo the last change. */
  undo(): boolean {
    return coreUndo(this._state, this._dispatch);
  }

  /** Redo the last undone change. */
  redo(): boolean {
    return coreRedo(this._state, this._dispatch);
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  render() {
    if (!this._state) return html``;

    const doc = this._state.doc;
    const sel = this._state.selection;
    const previewWidth = this._device === 'mobile' ? 375 : 0;

    return html`
      <pigeon-toolbar
        part="toolbar"
        ?can-undo=${this._canUndo}
        ?can-redo=${this._canRedo}
        .device=${this._device}
        @toolbar-undo=${this._handleUndo}
        @toolbar-redo=${this._handleRedo}
        @toolbar-device=${this._handleDevice}
      ></pigeon-toolbar>

      <div class="editor-body">
        <pigeon-palette
          part="palette"
        ></pigeon-palette>

        <pigeon-canvas
          part="canvas"
          .doc=${doc}
          .selection=${sel}
          .previewWidth=${previewWidth}
          @block-select=${this._handleBlockSelect}
          @row-select=${this._handleRowSelect}
          @canvas-select-body=${this._handleBodySelect}
          @row-move=${this._handleRowMove}
          @row-duplicate=${this._handleRowDuplicate}
          @row-delete=${this._handleRowDelete}
          @row-drop=${this._handleRowDrop}
          @block-drop=${this._handleBlockDrop}
          @block-drop-new-row=${this._handleBlockDropNewRow}
        ></pigeon-canvas>

        <pigeon-properties
          part="properties"
          .doc=${doc}
          .selection=${sel}
          @property-change=${this._handlePropertyChange}
          @row-property-change=${this._handleRowPropertyChange}
          @row-layout-change=${this._handleRowLayoutChange}
          @body-property-change=${this._handleBodyPropertyChange}
        ></pigeon-properties>
      </div>
    `;
  }

  /* ------------------------------------------------------------------ */
  /*  Internal: state init & dispatch                                    */
  /* ------------------------------------------------------------------ */

  private _initState() {
    const doc = this.document ?? createDefaultDocument();
    const plugins = this.config.plugins ?? [];
    // Ensure history plugin is always present
    const hasHistory = plugins.some(p => p.name === HISTORY_PLUGIN_NAME);
    if (!hasHistory) {
      plugins.unshift(createHistoryPlugin());
    }
    this._state = EditorState.create({ doc, plugins });
    this._syncHistoryFlags();
  }

  /** Central dispatch -- every mutation flows through here. */
  private _dispatch = (tr: TransactionSnapshot) => {
    this._state = this._state.apply(tr as any);
    this._syncHistoryFlags();
    this.requestUpdate();
    this._fireChange();
    this._fireSelect();
  };

  private _syncHistoryFlags() {
    const hist = this._state.getPluginState<HistoryState>(HISTORY_PLUGIN_NAME);
    this._canUndo = hist ? coreCanUndo(hist) : false;
    this._canRedo = hist ? coreCanRedo(hist) : false;
  }

  /* ------------------------------------------------------------------ */
  /*  Internal: event emitters                                           */
  /* ------------------------------------------------------------------ */

  private _fireChange() {
    this.dispatchEvent(new CustomEvent('pigeon:change', {
      detail: { document: this._state.doc },
      bubbles: true,
      composed: true,
    }));
  }

  private _fireSelect() {
    this.dispatchEvent(new CustomEvent('pigeon:select', {
      detail: { selection: this._state.selection },
      bubbles: true,
      composed: true,
    }));
  }

  /* ------------------------------------------------------------------ */
  /*  Toolbar handlers                                                   */
  /* ------------------------------------------------------------------ */

  private _handleUndo() {
    this.undo();
  }

  private _handleRedo() {
    this.redo();
  }

  private _handleDevice(e: CustomEvent<{ device: 'desktop' | 'mobile' }>) {
    this._device = e.detail.device;
  }

  /* ------------------------------------------------------------------ */
  /*  Selection handlers                                                 */
  /* ------------------------------------------------------------------ */

  private _handleBlockSelect(e: CustomEvent<{ blockId: string }>) {
    const blockId = e.detail.blockId;
    // Find rowId and columnId for this block
    for (const row of this._state.doc.body.rows) {
      for (const col of row.columns) {
        const block = col.blocks.find(b => b.id === blockId);
        if (block) {
          const tr = this._state.createTransaction();
          tr.setSelection(createBlockSelection(row.id, col.id, blockId));
          this._dispatch(tr);
          return;
        }
      }
    }
  }

  private _handleRowSelect(e: CustomEvent<{ rowId: string }>) {
    const tr = this._state.createTransaction();
    tr.setSelection(createRowSelection(e.detail.rowId));
    this._dispatch(tr);
  }

  private _handleBodySelect() {
    const tr = this._state.createTransaction();
    tr.setSelection(createBodySelection());
    this._dispatch(tr);
  }

  /* ------------------------------------------------------------------ */
  /*  Row action handlers                                                */
  /* ------------------------------------------------------------------ */

  private _handleRowMove(e: CustomEvent<{ rowId: string; toIndex: number }>) {
    const cmd = moveRow(e.detail.rowId, e.detail.toIndex);
    cmd(this._state, this._dispatch);
  }

  private _handleRowDuplicate(e: CustomEvent<{ rowId: string }>) {
    const cmd = duplicateRow(e.detail.rowId);
    cmd(this._state, this._dispatch);
  }

  private _handleRowDelete(e: CustomEvent<{ rowId: string }>) {
    const cmd = deleteRow(e.detail.rowId);
    cmd(this._state, this._dispatch);
  }

  /* ------------------------------------------------------------------ */
  /*  DnD handlers                                                       */
  /* ------------------------------------------------------------------ */

  private _handleRowDrop(e: CustomEvent<{ index: number; columnCount: number }>) {
    const { index, columnCount } = e.detail;
    const columns = Array.from({ length: columnCount }, () => createColumn());
    const row = createRow(columns);
    const cmd = insertRow(row, index);
    cmd(this._state, this._dispatch);
  }

  private _handleBlockDrop(e: CustomEvent<{
    rowId: string;
    columnId: string;
    index: number;
    dragData: DragData;
  }>) {
    const { rowId, columnId, index, dragData } = e.detail;

    if (dragData.type === 'palette-block' && dragData.blockType) {
      const block = createBlock(dragData.blockType as BlockType);
      const cmd = insertBlock(rowId, columnId, block, index);
      cmd(this._state, this._dispatch);
    } else if (dragData.type === 'existing-block' && dragData.blockId && dragData.rowId && dragData.columnId) {
      const cmd = moveBlock(
        dragData.rowId,
        dragData.columnId,
        dragData.blockId,
        rowId,
        columnId,
        index,
      );
      cmd(this._state, this._dispatch);
    }
  }

  private _handleBlockDropNewRow(e: CustomEvent<{ blockType: string; rowIndex: number }>) {
    const { blockType, rowIndex } = e.detail;
    const block = createBlock(blockType as BlockType);
    const col = createColumn([block]);
    const row = createRow([col]);
    const cmd = insertRow(row, rowIndex);
    cmd(this._state, this._dispatch);
  }

  /* ------------------------------------------------------------------ */
  /*  Property change handlers                                           */
  /* ------------------------------------------------------------------ */

  private _handlePropertyChange(e: CustomEvent<{
    rowId: string;
    columnId: string;
    blockId: string;
    values: Record<string, unknown>;
  }>) {
    const { rowId, columnId, blockId, values } = e.detail;
    const cmd = updateBlock(rowId, columnId, blockId, values);
    cmd(this._state, this._dispatch);
  }

  private _handleRowPropertyChange(e: CustomEvent<{
    rowId: string;
    attributes: Record<string, unknown>;
  }>) {
    const { rowId, attributes } = e.detail;
    const cmd = updateRowAttributes(rowId, attributes as any);
    cmd(this._state, this._dispatch);
  }

  private _handleRowLayoutChange(e: CustomEvent<{
    rowId: string;
    ratios: number[];
    columnCount: number;
  }>) {
    const { rowId, ratios, columnCount } = e.detail;
    const row = this._state.doc.body.rows.find(r => r.id === rowId);
    if (!row) return;

    const currentCount = row.columns.length;
    const targetCount = columnCount;

    if (targetCount > currentCount) {
      // Add columns
      for (let i = 0; i < targetCount - currentCount; i++) {
        const cmd = addColumn(rowId);
        cmd(this._state, this._dispatch);
      }
    } else if (targetCount < currentCount) {
      // Remove columns from the end
      for (let i = 0; i < currentCount - targetCount; i++) {
        const updatedRow = this._state.doc.body.rows.find(r => r.id === rowId);
        if (updatedRow && updatedRow.columns.length > 1) {
          const lastCol = updatedRow.columns[updatedRow.columns.length - 1];
          const cmd = removeColumn(rowId, lastCol.id);
          cmd(this._state, this._dispatch);
        }
      }
    }

    // Now resize to the desired ratios
    const updatedRow = this._state.doc.body.rows.find(r => r.id === rowId);
    if (updatedRow && updatedRow.columns.length === ratios.length) {
      const cmd = resizeColumns(rowId, ratios);
      cmd(this._state, this._dispatch);
    }
  }

  private _handleBodyPropertyChange(e: CustomEvent<{
    attribute?: string;
    metaField?: string;
    value: unknown;
  }>) {
    const { attribute, metaField, value } = e.detail;
    const tr = this._state.createTransaction();

    if (attribute) {
      const oldValue = (this._state.doc.body.attributes as any)[attribute];
      const step = createDocStep(
        'updateBodyAttribute',
        `body.attributes.${attribute}`,
        (doc: PigeonDocument) => {
          (doc.body.attributes as any)[attribute] = value;
        },
        (doc: PigeonDocument) => {
          (doc.body.attributes as any)[attribute] = oldValue;
        },
      );
      tr.addStep(step);
    }

    if (metaField) {
      const oldValue = (this._state.doc.metadata as any)[metaField];
      const step = createDocStep(
        'updateMetadata',
        `metadata.${metaField}`,
        (doc: PigeonDocument) => {
          (doc.metadata as any)[metaField] = value;
        },
        (doc: PigeonDocument) => {
          (doc.metadata as any)[metaField] = oldValue;
        },
      );
      tr.addStep(step);
    }

    this._dispatch(tr);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-editor': PigeonEditor;
  }
}
