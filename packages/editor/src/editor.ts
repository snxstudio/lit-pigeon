import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  EditorState,
  type PigeonDocument,
  type EditorConfig,
  type BlockType,
  type ContentBlock,
  type Renderer,
  type MergeTag,
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
  deleteBlock,
  duplicateBlock,
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
  generateId,
} from '@lit-pigeon/core';
import type { HistoryState, TransactionSnapshot } from '@lit-pigeon/core';

import './components/toolbar/pigeon-toolbar.js';
import './components/palette/pigeon-palette.js';
import './components/canvas/pigeon-canvas.js';
import './components/properties/pigeon-properties.js';
import './components/preview/pigeon-preview.js';
import './components/merge-tags/pigeon-merge-tag-picker.js';
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
 * @fires pigeon:export-json - Fired for JSON export
 * @fires pigeon:export-mjml - Fired for MJML export
 * @fires pigeon:export-html - Fired for HTML export
 * @fires pigeon:merge-tag-request - Fired when merge tag trigger detected but no static tags
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

  /** Optional renderer for preview mode. */
  @property({ type: Object })
  renderer?: Renderer;

  /** Optional function to convert document to MJML. */
  @property({ type: Object })
  documentToMjml?: (doc: PigeonDocument) => string;

  /* ------------------------------------------------------------------ */
  /*  Internal state                                                     */
  /* ------------------------------------------------------------------ */

  @state() private _state!: EditorState;
  @state() private _canUndo = false;
  @state() private _canRedo = false;
  @state() private _device: 'desktop' | 'mobile' = 'desktop';
  @state() private _fullscreen = false;
  @state() private _previewOpen = false;
  /** Block currently in inline rich-text editing mode, or null when none. */
  @state() private _editingBlockId: string | null = null;

  /** In-memory clipboard for Cmd/Ctrl+C / Cmd/Ctrl+V on blocks. */
  private _clipboard: ContentBlock | null = null;

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

    :host([fullscreen]) {
      position: fixed;
      inset: 0;
      z-index: 9999;
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
    document.addEventListener('keydown', this._handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('document') && this._state) {
      // If the consumer sets a new document property, reload
      if (this.document && this.document !== this._state.doc) {
        this.loadDocument(this.document);
      }
    }
    if (changed.has('_fullscreen')) {
      if (this._fullscreen) {
        this.setAttribute('fullscreen', '');
      } else {
        this.removeAttribute('fullscreen');
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

  /** Export the document as JSON. */
  exportJson(): PigeonDocument {
    return this._state.doc;
  }

  /** Export the document as MJML. Requires documentToMjml to be set. */
  exportMjml(): string | null {
    if (this.documentToMjml) {
      return this.documentToMjml(this._state.doc);
    }
    return null;
  }

  /** Export the document as HTML. Requires renderer to be set. */
  async exportHtml(): Promise<string | null> {
    if (this.renderer) {
      const result = await this.renderer.render(this._state.doc);
      return result.html;
    }
    return null;
  }

  /** Set merge tags dynamically (for lazy loading). */
  setMergeTags(tags: MergeTag[]) {
    this.config = { ...this.config, mergeTags: { ...this.config.mergeTags, tags } };
    this.requestUpdate();
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
        .fullscreen=${this._fullscreen}
        @toolbar-undo=${this._handleUndo}
        @toolbar-redo=${this._handleRedo}
        @toolbar-device=${this._handleDevice}
        @toolbar-fullscreen=${this._handleFullscreen}
        @pigeon:preview=${this._handlePreview}
        @pigeon:export-html=${this._handleExportHtml}
        @pigeon:export-mjml=${this._handleExportMjml}
        @pigeon:export-json=${this._handleExportJson}
      ></pigeon-toolbar>

      <div class="editor-body">
        <pigeon-palette
          part="palette"
          .doc=${doc}
          .selection=${sel}
          @row-select=${this._handleRowSelect}
          @block-select=${this._handleBlockSelect}
        ></pigeon-palette>

        <pigeon-canvas
          part="canvas"
          .doc=${doc}
          .selection=${sel}
          .editingBlockId=${this._editingBlockId}
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
          @block-enter-edit=${this._handleBlockEnterEdit}
          @block-exit-edit=${this._handleBlockExitEdit}
        ></pigeon-canvas>

        <pigeon-properties
          part="properties"
          .doc=${doc}
          .selection=${sel}
          .mergeTags=${this.config.mergeTags?.tags ?? []}
          @property-change=${this._handlePropertyChange}
          @row-property-change=${this._handleRowPropertyChange}
          @row-layout-change=${this._handleRowLayoutChange}
          @body-property-change=${this._handleBodyPropertyChange}
        ></pigeon-properties>
      </div>

      <pigeon-preview
        ?open=${this._previewOpen}
        .doc=${doc}
        .renderer=${this.renderer}
        .documentToMjml=${this.documentToMjml}
        @click=${(e: Event) => {
          if ((e.target as HTMLElement).classList?.contains('overlay')) {
            this._previewOpen = false;
          }
        }}
      ></pigeon-preview>

      <pigeon-rich-text-bubble></pigeon-rich-text-bubble>
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
    this._state = this._state.apply(tr);
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

  private _handleFullscreen() {
    this._fullscreen = !this._fullscreen;
  }

  private _handlePreview() {
    if (this.renderer) {
      this._previewOpen = true;
    } else {
      this.dispatchEvent(new CustomEvent('pigeon:preview', {
        bubbles: true,
        composed: true,
      }));
    }
  }

  private _handleExportHtml() {
    this.dispatchEvent(new CustomEvent('pigeon:export-html', {
      detail: { document: this._state.doc },
      bubbles: true,
      composed: true,
    }));
  }

  private _handleExportMjml() {
    const mjml = this.documentToMjml ? this.documentToMjml(this._state.doc) : null;
    this.dispatchEvent(new CustomEvent('pigeon:export-mjml', {
      detail: { document: this._state.doc, mjml },
      bubbles: true,
      composed: true,
    }));
  }

  private _handleExportJson() {
    this.dispatchEvent(new CustomEvent('pigeon:export-json', {
      detail: { document: this._state.doc },
      bubbles: true,
      composed: true,
    }));
  }

  /* ------------------------------------------------------------------ */
  /*  Selection handlers                                                 */
  /* ------------------------------------------------------------------ */

  private _handleBlockEnterEdit(e: CustomEvent<{ blockId: string }>) {
    e.stopPropagation();
    // Ensure the block is selected so the property panel reflects it.
    const blockId = e.detail.blockId;
    for (const row of this._state.doc.body.rows) {
      for (const col of row.columns) {
        const block = col.blocks.find(b => b.id === blockId);
        if (block) {
          const tr = this._state.createTransaction();
          tr.setSelection(createBlockSelection(row.id, col.id, blockId));
          this._dispatch(tr);
          this._editingBlockId = blockId;
          return;
        }
      }
    }
  }

  private _handleBlockExitEdit(e: CustomEvent<{ blockId: string; content: string }>) {
    e.stopPropagation();
    if (this._editingBlockId !== e.detail.blockId) return;
    // Locate the block to commit the new content into.
    for (const row of this._state.doc.body.rows) {
      for (const col of row.columns) {
        const block = col.blocks.find(b => b.id === e.detail.blockId);
        if (!block) continue;
        // Only commit if content actually changed; this avoids creating
        // a useless undo entry every time the user double-clicks + blurs.
        const current = (block.values as Record<string, unknown>).content;
        if (typeof current === 'string' && current !== e.detail.content) {
          const cmd = updateBlock(row.id, col.id, block.id, { content: e.detail.content });
          cmd(this._state, this._dispatch);
        }
        this._editingBlockId = null;
        return;
      }
    }
    this._editingBlockId = null;
  }

  private _handleBlockSelect(e: CustomEvent<{ blockId: string }>) {
    const blockId = e.detail.blockId;
    // Selecting a different block exits any inline edit on the previous one.
    if (this._editingBlockId !== null && this._editingBlockId !== blockId) {
      this._editingBlockId = null;
    }
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
    this._editingBlockId = null;
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
  /*  Keyboard shortcuts                                                 */
  /* ------------------------------------------------------------------ */

  /**
   * Returns true if the event originates from a text-editing context
   * (input, textarea, select, or contentEditable element), in which
   * case shortcuts like Delete and Ctrl+Z should not hijack the keys.
   * Uses composedPath so it works across shadow DOM boundaries.
   */
  private _isInTextInput(e: KeyboardEvent): boolean {
    for (const el of e.composedPath()) {
      if (!(el instanceof HTMLElement)) continue;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (el.isContentEditable) return true;
    }
    return false;
  }

  private _handleKeyDown = (e: KeyboardEvent) => {
    if (!this._state) return;
    if (this._isInTextInput(e)) return;
    // TipTap owns key input while a block is in inline edit mode.
    if (this._editingBlockId !== null) return;

    const mod = e.metaKey || e.ctrlKey;
    const sel = this._state.selection;

    // Undo: Cmd/Ctrl+Z (without shift)
    if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      this.undo();
      return;
    }

    // Redo: Cmd/Ctrl+Shift+Z, or Ctrl+Y
    if ((mod && e.shiftKey && e.key.toLowerCase() === 'z') || (mod && e.key.toLowerCase() === 'y')) {
      e.preventDefault();
      this.redo();
      return;
    }

    // Escape: deselect to body
    if (e.key === 'Escape') {
      const tr = this._state.createTransaction();
      tr.setSelection(createBodySelection());
      this._dispatch(tr);
      return;
    }

    if (!sel) return;

    // Delete / Backspace: remove the selected block or row
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (sel.type === 'block' && sel.rowId && sel.columnId && sel.blockId) {
        e.preventDefault();
        const cmd = deleteBlock(sel.rowId, sel.columnId, sel.blockId);
        cmd(this._state, this._dispatch);
      } else if (sel.type === 'row' && sel.rowId) {
        e.preventDefault();
        const cmd = deleteRow(sel.rowId);
        cmd(this._state, this._dispatch);
      }
      return;
    }

    // Cmd/Ctrl+D: duplicate the selected block or row
    if (mod && e.key.toLowerCase() === 'd') {
      if (sel.type === 'block' && sel.rowId && sel.columnId && sel.blockId) {
        e.preventDefault();
        const cmd = duplicateBlock(sel.rowId, sel.columnId, sel.blockId);
        cmd(this._state, this._dispatch);
      } else if (sel.type === 'row' && sel.rowId) {
        e.preventDefault();
        const cmd = duplicateRow(sel.rowId);
        cmd(this._state, this._dispatch);
      }
      return;
    }

    // ArrowUp / ArrowDown: navigate between blocks or rows in document order
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      if (sel.type === 'block' && sel.blockId) {
        e.preventDefault();
        this._moveBlockSelection(delta);
      } else if (sel.type === 'row' && sel.rowId) {
        e.preventDefault();
        this._moveRowSelection(delta);
      }
      return;
    }

    // Cmd/Ctrl+C: copy the selected block into the in-memory clipboard
    if (mod && e.key.toLowerCase() === 'c') {
      if (sel.type === 'block' && sel.rowId && sel.columnId && sel.blockId) {
        const block = this._findBlock(sel.rowId, sel.columnId, sel.blockId);
        if (block) {
          e.preventDefault();
          this._clipboard = structuredClone(block);
        }
      }
      return;
    }

    // Cmd/Ctrl+V: paste the clipboard block (with a new id)
    if (mod && e.key.toLowerCase() === 'v') {
      if (!this._clipboard) return;

      if (sel.type === 'block' && sel.rowId && sel.columnId && sel.blockId) {
        e.preventDefault();
        const pasted = structuredClone(this._clipboard);
        pasted.id = generateId();
        const blockIndex = this._findBlockIndex(sel.rowId, sel.columnId, sel.blockId);
        const insertIndex = blockIndex >= 0 ? blockIndex + 1 : undefined;
        const cmd = insertBlock(sel.rowId, sel.columnId, pasted, insertIndex);
        cmd(this._state, this._dispatch);
      } else if (sel.type === 'column' && sel.rowId && sel.columnId) {
        e.preventDefault();
        const pasted = structuredClone(this._clipboard);
        pasted.id = generateId();
        const cmd = insertBlock(sel.rowId, sel.columnId, pasted);
        cmd(this._state, this._dispatch);
      }
      return;
    }
  };

  private _flattenBlockLocations(): Array<{ rowId: string; columnId: string; blockId: string }> {
    const out: Array<{ rowId: string; columnId: string; blockId: string }> = [];
    for (const row of this._state.doc.body.rows) {
      for (const col of row.columns) {
        for (const block of col.blocks) {
          out.push({ rowId: row.id, columnId: col.id, blockId: block.id });
        }
      }
    }
    return out;
  }

  private _moveBlockSelection(delta: -1 | 1) {
    const sel = this._state.selection;
    if (!sel || sel.type !== 'block' || !sel.blockId) return;

    const flat = this._flattenBlockLocations();
    const currentIdx = flat.findIndex(b => b.blockId === sel.blockId);
    if (currentIdx === -1) return;

    const nextIdx = currentIdx + delta;
    if (nextIdx < 0 || nextIdx >= flat.length) return;

    const target = flat[nextIdx];
    const tr = this._state.createTransaction();
    tr.setSelection(createBlockSelection(target.rowId, target.columnId, target.blockId));
    this._dispatch(tr);
  }

  private _moveRowSelection(delta: -1 | 1) {
    const sel = this._state.selection;
    if (!sel || sel.type !== 'row' || !sel.rowId) return;

    const rows = this._state.doc.body.rows;
    const currentIdx = rows.findIndex(r => r.id === sel.rowId);
    if (currentIdx === -1) return;

    const nextIdx = currentIdx + delta;
    if (nextIdx < 0 || nextIdx >= rows.length) return;

    const tr = this._state.createTransaction();
    tr.setSelection(createRowSelection(rows[nextIdx].id));
    this._dispatch(tr);
  }

  private _findBlock(rowId: string, columnId: string, blockId: string): ContentBlock | undefined {
    const row = this._state.doc.body.rows.find(r => r.id === rowId);
    if (!row) return undefined;
    const col = row.columns.find(c => c.id === columnId);
    if (!col) return undefined;
    return col.blocks.find(b => b.id === blockId);
  }

  private _findBlockIndex(rowId: string, columnId: string, blockId: string): number {
    const row = this._state.doc.body.rows.find(r => r.id === rowId);
    if (!row) return -1;
    const col = row.columns.find(c => c.id === columnId);
    if (!col) return -1;
    return col.blocks.findIndex(b => b.id === blockId);
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
    const cmd = updateRowAttributes(rowId, attributes);
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
      const attrs = this._state.doc.body.attributes as Record<string, unknown>;
      const oldValue = attrs[attribute];
      const step = createDocStep(
        'updateBodyAttribute',
        `body.attributes.${attribute}`,
        (doc: PigeonDocument) => {
          (doc.body.attributes as Record<string, unknown>)[attribute] = value;
        },
        (doc: PigeonDocument) => {
          (doc.body.attributes as Record<string, unknown>)[attribute] = oldValue;
        },
      );
      tr.addStep(step);
    }

    if (metaField) {
      const meta = this._state.doc.metadata as Record<string, unknown>;
      const oldValue = meta[metaField];
      const step = createDocStep(
        'updateMetadata',
        `metadata.${metaField}`,
        (doc: PigeonDocument) => {
          (doc.metadata as Record<string, unknown>)[metaField] = value;
        },
        (doc: PigeonDocument) => {
          (doc.metadata as Record<string, unknown>)[metaField] = oldValue;
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
