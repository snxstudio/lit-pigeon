import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { themeStyles } from './themes/tokens.js';
import {
  EditorState,
  type PigeonDocument,
  type EditorConfig,
  type BlockType,
  type ContentBlock,
  type Renderer,
  type MergeTag,
  type Template,
  type TemplateCategory,
  type TemplateStorage,
  type AssetStorage,
  createHistoryPlugin,
  createDefaultDocument,
  createBlock,
  createRow,
  createColumn,
  createBodySelection,
  createRowSelection,
  createColumnSelection,
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
  InMemoryTemplateStorage,
  createDocStep,
  generateId,
} from '@lit-pigeon/core';
import type { HistoryState, TransactionSnapshot, BrandKit, BrandKitStorage, BrandLogo, ImageBlock } from '@lit-pigeon/core';

import './components/toolbar/pigeon-toolbar.js';
import './components/palette/pigeon-palette.js';
import './components/canvas/pigeon-canvas.js';
import './components/properties/pigeon-properties.js';
import './components/preview/pigeon-preview.js';
import './components/merge-tags/pigeon-merge-tag-picker.js';
import type { PigeonTemplatePicker } from './components/templates/pigeon-template-picker.js';
import type { DragData } from './dnd/drag-manager.js';

/**
 * Lazily import the templates picker module. The dynamic `import` is what
 * tells Vite/Rollup to code-split the picker into a separate chunk so the
 * editor's base bundle stays under its size budget. The resolved promise is
 * memoised so subsequent opens do not re-import.
 */
let _templatePickerPromise: Promise<unknown> | null = null;
function loadTemplatePicker(): Promise<unknown> {
  if (!_templatePickerPromise) {
    _templatePickerPromise = import(
      './components/templates/pigeon-template-picker.js'
    );
  }
  return _templatePickerPromise;
}

/**
 * Kebab-case slug from arbitrary user-supplied text. Used to derive a stable
 * `Template.id` from the user's chosen name. Falls back to a generated id if
 * the input slugifies to an empty string (e.g. all-emoji name).
 */
function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize('NFKD')
    // Strip Unicode combining marks (accents) introduced by NFKD decomposition.
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `template-${Date.now()}`;
}

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
 * @csspart canvas-area - The email "sheet" inside the canvas (the rendered body)
 * @csspart panel - The active property-panel wrapper
 * @csspart palette-tab - A palette tab button (Content / Layers)
 * @csspart palette-item - A draggable block/layout chip in the palette
 * @csspart toolbar-button - Any toolbar button; also has a per-action part:
 *   toolbar-button-{undo,redo,fullscreen,templates,preview,export}
 *
 * @cssprop [--pigeon-primary] - Brand / primary action colour
 * @cssprop [--pigeon-bg] - Editor surface background
 * @cssprop [--pigeon-text] - Primary text colour
 * @cssprop [--pigeon-border] - Hairline border colour
 * @cssprop [--pigeon-ring] - Focus-ring colour
 * @cssprop [--pigeon-radius] - Base corner radius
 *   (see src/themes/tokens.ts for the full token set)
 */
@customElement('pigeon-editor')
export class PigeonEditor extends LitElement {
  /* ------------------------------------------------------------------ */
  /*  Public reactive properties                                         */
  /* ------------------------------------------------------------------ */

  /** Optional initial document. If not set a blank document is created. */
  @property({ type: Object })
  document: PigeonDocument | undefined;

  /**
   * Colour theme for the editor chrome.
   *
   * - `light` (default) — light tokens.
   * - `dark` — dark tokens applied unconditionally.
   * - `auto` — follows the OS `prefers-color-scheme`.
   *
   * Reflected to an attribute so it can be set declaratively
   * (`<pigeon-editor theme="dark">`). Override individual tokens with the
   * `themeOverrides` map or plain CSS (`pigeon-editor { --pigeon-…: … }`).
   */
  @property({ type: String, reflect: true })
  theme: 'light' | 'dark' | 'auto' = 'light';

  /**
   * Partial map of design-token overrides applied as inline custom properties
   * on the host, e.g. `{ '--pigeon-primary': '#db2777' }`. Useful for
   * white-labelling without writing CSS. Merged on top of the active theme.
   */
  @property({ attribute: false })
  themeOverrides: Record<string, string> = {};

  /** Additional editor configuration passed to EditorState.create(). */
  @property({ type: Object })
  config: Partial<EditorConfig> = {};

  /** Optional renderer for preview mode. */
  @property({ type: Object })
  renderer?: Renderer;

  /** Optional function to convert document to MJML. */
  @property({ type: Object })
  documentToMjml?: (doc: PigeonDocument) => string;

  /**
   * Optional template storage backend. When unset, the editor falls back to
   * an in-memory storage seeded with the starter templates so the picker is
   * useful out of the box.
   */
  @property({ attribute: false })
  templateStorage?: TemplateStorage;

  /**
   * Optional asset library backend. When set, the asset modal shows a
   * "Library" tab next to "Upload" so users can browse previously-saved
   * assets (folders, search, tag filters) without re-uploading. Falls back to
   * `config.assetStorage` if not set directly. Without either, the modal
   * keeps its current upload-only behaviour.
   */
  @property({ attribute: false })
  assetStorage?: AssetStorage;

  /* ------------------------------------------------------------------ */
  /*  Internal state                                                     */
  /* ------------------------------------------------------------------ */

  @state() private _state!: EditorState;
  @state() private _canUndo = false;
  @state() private _canRedo = false;
  @state() private _device: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  @state() private _fullscreen = false;
  @state() private _previewOpen = false;
  @state() private _templatePickerOpen = false;
  @state() private _templatePickerLoaded = false;
  /** Block currently in inline rich-text editing mode, or null when none. */
  @state() private _editingBlockId: string | null = null;

  /** Lazily-initialised default template storage. */
  private _defaultTemplateStorage?: TemplateStorage;

  /** In-memory clipboard for Cmd/Ctrl+C / Cmd/Ctrl+V on blocks. */
  private _clipboard: ContentBlock | null = null;

  @state() private _activeBrandKit: BrandKit | null = null;
  private _brandKitStorage: BrandKitStorage | null = null;

  /* ------------------------------------------------------------------ */
  /*  Styles                                                             */
  /* ------------------------------------------------------------------ */

  static styles = [
    themeStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        font-family: var(--pigeon-font);
        color: var(--pigeon-text);
        background: var(--pigeon-bg);
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
    `,
  ];

  /* ------------------------------------------------------------------ */
  /*  Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  connectedCallback() {
    super.connectedCallback();
    this._initState();
    this._resolveBrandKit();
    this._applyTheme();
    document.addEventListener('keydown', this._handleKeyDown);
    this.addEventListener('brand-kit-edit', this._handleBrandKitEdit as EventListener);
    this.addEventListener('brand-color-apply', this._handleBrandColorApply as EventListener);
    this.addEventListener('brand-font-apply', this._handleBrandFontApply as EventListener);
    this.addEventListener('brand-logo-insert', this._handleBrandLogoInsert as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeyDown);
    this.removeEventListener('brand-kit-edit', this._handleBrandKitEdit as EventListener);
    this.removeEventListener('brand-color-apply', this._handleBrandColorApply as EventListener);
    this.removeEventListener('brand-font-apply', this._handleBrandFontApply as EventListener);
    this.removeEventListener('brand-logo-insert', this._handleBrandLogoInsert as EventListener);
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
    if (changed.has('theme') || changed.has('themeOverrides')) {
      this._applyTheme();
    }
    if (changed.has('config')) {
      this._resolveBrandKit();
    }
  }

  /**
   * Sync the active `theme` to the host classes the token sheet keys off, and
   * apply any `themeOverrides` as inline custom properties.
   */
  private _applyTheme() {
    this.classList.toggle('pigeon-dark', this.theme === 'dark');
    this.classList.toggle('pigeon-auto', this.theme === 'auto');
    for (const [name, value] of Object.entries(this.themeOverrides)) {
      this.style.setProperty(name, value);
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
    // Device preset viewport widths. Desktop (0) lets the canvas use the
    // document's own body width; tablet/mobile clamp to common breakpoints.
    const previewWidth =
      this._device === 'mobile' ? 375 : this._device === 'tablet' ? 768 : 0;

    return html`
      <pigeon-toolbar
        part="toolbar"
        exportparts="toolbar-button, toolbar-button-undo, toolbar-button-redo, toolbar-button-fullscreen, toolbar-button-templates, toolbar-button-preview, toolbar-button-export"
        ?can-undo=${this._canUndo}
        ?can-redo=${this._canRedo}
        .device=${this._device}
        .fullscreen=${this._fullscreen}
        @toolbar-undo=${this._handleUndo}
        @toolbar-redo=${this._handleRedo}
        @toolbar-device=${this._handleDevice}
        @toolbar-fullscreen=${this._handleFullscreen}
        @toolbar-templates=${this._handleTemplatesOpen}
        @pigeon:preview=${this._handlePreview}
        @pigeon:export-html=${this._handleExportHtml}
        @pigeon:export-mjml=${this._handleExportMjml}
        @pigeon:export-json=${this._handleExportJson}
      ></pigeon-toolbar>

      <div class="editor-body">
        <pigeon-palette
          part="palette"
          role="complementary"
          aria-label="Content blocks and layers"
          exportparts="palette-tab, palette-item"
          .doc=${doc}
          .selection=${sel}
          .brandKit=${this._activeBrandKit}
          @row-select=${this._handleRowSelect}
          @block-select=${this._handleBlockSelect}
          @palette-item-activate=${this._handlePaletteActivate}
        ></pigeon-palette>

        <pigeon-canvas
          part="canvas"
          role="region"
          aria-label="Email canvas"
          exportparts="canvas-area"
          .doc=${doc}
          .selection=${sel}
          .editingBlockId=${this._editingBlockId}
          .device=${this._device}
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
          role="complementary"
          aria-label="Element properties"
          exportparts="panel"
          .doc=${doc}
          .selection=${sel}
          .mergeTags=${this.config.mergeTags?.tags ?? []}
          .assetManagerConfig=${this.config.assetManager ?? {}}
          .assetStorage=${this.assetStorage ?? this.config.assetStorage}
          .brandKit=${this._activeBrandKit}
          @property-change=${this._handlePropertyChange}
          @row-property-change=${this._handleRowPropertyChange}
          @row-layout-change=${this._handleRowLayoutChange}
          @body-property-change=${this._handleBodyPropertyChange}
          @row-select=${this._handleRowSelect}
          @column-select=${this._handleColumnSelect}
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

      ${this._templatePickerLoaded
        ? html`<pigeon-template-picker
            ?open=${this._templatePickerOpen}
            .storage=${this._resolveTemplateStorage()}
            @template-load=${this._handleTemplateLoad}
            @template-save=${this._handleTemplateSave}
          ></pigeon-template-picker>`
        : ''}

      <pigeon-rich-text-bubble></pigeon-rich-text-bubble>
    `;
  }

  /* ------------------------------------------------------------------ */
  /*  Templates                                                          */
  /* ------------------------------------------------------------------ */

  private _resolveTemplateStorage(): TemplateStorage {
    if (this.templateStorage) return this.templateStorage;
    if (!this._defaultTemplateStorage) {
      this._defaultTemplateStorage = new InMemoryTemplateStorage();
    }
    return this._defaultTemplateStorage;
  }

  /**
   * Resolve `config.brandKit` into a single active kit. A plain `BrandKit` is
   * used directly; a `BrandKitStorage` (duck-typed by a `list` method) is
   * async-loaded and the first kit becomes active.
   */
  private async _resolveBrandKit() {
    const bk = this.config.brandKit;
    if (!bk) {
      this._brandKitStorage = null;
      this._activeBrandKit = null;
      return;
    }
    if (typeof (bk as BrandKitStorage).list === 'function') {
      this._brandKitStorage = bk as BrandKitStorage;
      try {
        const kits = await this._brandKitStorage.list();
        this._activeBrandKit = kits[0] ?? null;
      } catch (error) {
        this._activeBrandKit = null;
        this._emitBrandKitError(error, 'list');
      }
    } else {
      this._brandKitStorage = null;
      this._activeBrandKit = bk as BrandKit;
    }
  }

  private _emitBrandKitError(error: unknown, operation: 'list' | 'save') {
    this.dispatchEvent(
      new CustomEvent('brand-kit-error', {
        detail: { error, operation },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleBrandKitEdit = async (e: CustomEvent<{ kit: BrandKit }>) => {
    e.stopPropagation();
    const kit = e.detail.kit;
    this._activeBrandKit = kit; // optimistic in-memory update
    // Emit the public change first so hosts see the new state even if save fails.
    this.dispatchEvent(
      new CustomEvent('brand-kit-change', {
        detail: { brandKit: kit },
        bubbles: true,
        composed: true,
      }),
    );
    if (this._brandKitStorage) {
      try {
        await this._brandKitStorage.save(kit);
      } catch (error) {
        this._emitBrandKitError(error, 'save');
      }
    }
  };

  /** Apply a single body attribute through an undoable transaction. */
  private _applyBodyAttribute(attribute: string, value: unknown) {
    const tr = this._state.createTransaction();
    const attrs = this._state.doc.body.attributes as Record<string, unknown>;
    const oldValue = attrs[attribute];
    const step = createDocStep(
      'updateBodyAttribute',
      `body.attributes.${attribute}`,
      (doc: PigeonDocument) => { (doc.body.attributes as Record<string, unknown>)[attribute] = value; },
      (doc: PigeonDocument) => { (doc.body.attributes as Record<string, unknown>)[attribute] = oldValue; },
    );
    tr.addStep(step);
    this._dispatch(tr);
  }

  private _handleBrandColorApply = (e: CustomEvent<{ value: string }>) => {
    e.stopPropagation();
    const value = e.detail.value;
    const sel = this._state.selection;
    if (sel?.type === 'block' && sel.rowId && sel.columnId && sel.blockId) {
      const block = this._findBlock(sel.rowId, sel.columnId, sel.blockId);
      if (block?.type === 'button') {
        updateBlock(sel.rowId, sel.columnId, sel.blockId, { backgroundColor: value })(this._state, this._dispatch);
      }
      // text/other blocks: no block-level colour → no-op (hint shown by the UI).
      return;
    }
    // body or no selection → body background.
    this._applyBodyAttribute('backgroundColor', value);
  };

  private _handleBrandFontApply = (e: CustomEvent<{ family: string }>) => {
    e.stopPropagation();
    this._applyBodyAttribute('fontFamily', e.detail.family);
  };

  private _handleBrandLogoInsert = (e: CustomEvent<{ logo: BrandLogo }>) => {
    e.stopPropagation();
    const { logo } = e.detail;
    const block = createBlock('image') as ImageBlock;
    block.values.src = logo.src;
    block.values.alt = logo.name;
    if (logo.width) block.values.width = logo.width;

    const sel = this._state.selection;
    if (sel?.rowId && sel?.columnId) {
      insertBlock(sel.rowId, sel.columnId, block)(this._state, this._dispatch);
      return;
    }
    const rows = this._state.doc.body.rows;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const col = lastRow.columns[0];
      insertBlock(lastRow.id, col.id, block, col.blocks.length)(this._state, this._dispatch);
    } else {
      const col = createColumn([block]);
      insertRow(createRow([col]), 0)(this._state, this._dispatch);
    }
  };

  private async _handleTemplatesOpen() {
    if (!this._templatePickerLoaded) {
      await loadTemplatePicker();
      this._templatePickerLoaded = true;
    }
    this._templatePickerOpen = true;
  }

  private _handleTemplateLoad(
    e: CustomEvent<{ template: Template }>,
  ) {
    e.stopPropagation();
    const template = e.detail?.template;
    if (template?.document) {
      this.loadDocument(structuredClone(template.document));
    }
    this._templatePickerOpen = false;
  }

  private async _handleTemplateSave(
    e: CustomEvent<{
      name: string;
      description?: string;
      category?: TemplateCategory;
    }>,
  ) {
    e.stopPropagation();
    const { name, description, category } = e.detail;
    const storage = this._resolveTemplateStorage();
    const now = new Date().toISOString();
    const template: Template = {
      id: slugify(name),
      name,
      description,
      category,
      document: structuredClone(this.getDocument()),
      createdAt: now,
      updatedAt: now,
    };
    await storage.save(template);
    // Refresh the picker's list so the new template is visible the next time
    // it opens.
    const picker = this.renderRoot.querySelector(
      'pigeon-template-picker',
    ) as PigeonTemplatePicker | null;
    if (picker) await picker.refresh();
    this._templatePickerOpen = false;
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

  private _handleDevice(
    e: CustomEvent<{ device: 'desktop' | 'tablet' | 'mobile' }>,
  ) {
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
    // Exit any inline edit when jumping to the row (e.g. via the breadcrumb).
    this._editingBlockId = null;
    const tr = this._state.createTransaction();
    tr.setSelection(createRowSelection(e.detail.rowId));
    this._dispatch(tr);
  }

  private _handleColumnSelect(e: CustomEvent<{ rowId: string; columnId: string }>) {
    this._editingBlockId = null;
    const tr = this._state.createTransaction();
    tr.setSelection(createColumnSelection(e.detail.rowId, e.detail.columnId));
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

  /**
   * Keyboard equivalent of dragging a palette item onto the canvas: append the
   * block/layout to the end of the document. Keeps the palette operable
   * without a pointer (WCAG 2.1 — keyboard accessible).
   */
  private _handlePaletteActivate(
    e: CustomEvent<{ type: string; blockType: string; columnCount: number }>,
  ) {
    const { type, blockType, columnCount } = e.detail;
    const rows = this._state.doc.body.rows;

    if (type === 'palette-row') {
      const columns = Array.from({ length: columnCount }, () => createColumn());
      insertRow(createRow(columns), rows.length)(this._state, this._dispatch);
      return;
    }

    if (!blockType) return;
    const block = createBlock(blockType as BlockType);
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const col = lastRow.columns[0];
      insertBlock(lastRow.id, col.id, block, col.blocks.length)(
        this._state,
        this._dispatch,
      );
    } else {
      const col = createColumn([block]);
      insertRow(createRow([col]), 0)(this._state, this._dispatch);
    }
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
