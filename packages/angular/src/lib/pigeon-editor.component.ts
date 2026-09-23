import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import type { PigeonDocument, EditorConfig, Selection } from '@lit-pigeon/core';
import '@lit-pigeon/editor';
import type { PigeonEditor } from '@lit-pigeon/editor';

const PASSTHROUGH_INPUTS = [
  'renderer',
  'documentToMjml',
  'documentToPlainText',
  'theme',
  'themeOverrides',
  'templateStorage',
  'assetStorage',
] as const;
type PassthroughInput = (typeof PASSTHROUGH_INPUTS)[number];

@Component({
  selector: 'pigeon-editor-wrapper',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<pigeon-editor #editorEl></pigeon-editor>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    pigeon-editor {
      width: 100%;
      height: 100%;
    }
  `],
})
export class PigeonEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('editorEl', { static: false })
  private editorRef!: ElementRef<PigeonEditor>;

  @Input() document?: PigeonDocument;
  @Input() config?: Partial<EditorConfig>;
  @Input() renderer?: PigeonEditor['renderer'];
  @Input() documentToMjml?: PigeonEditor['documentToMjml'];
  @Input() documentToPlainText?: PigeonEditor['documentToPlainText'];
  @Input() theme?: PigeonEditor['theme'];
  @Input() themeOverrides?: PigeonEditor['themeOverrides'];
  @Input() templateStorage?: PigeonEditor['templateStorage'];
  @Input() assetStorage?: PigeonEditor['assetStorage'];

  @Output() pigeonChange = new EventEmitter<{ document: PigeonDocument }>();
  @Output() pigeonSelect = new EventEmitter<{ selection: Selection | null }>();
  @Output() pigeonReady = new EventEmitter<void>();
  @Output() pigeonPreview = new EventEmitter<void>();
  @Output() pigeonExport = new EventEmitter<void>();
  @Output() pigeonExportJson = new EventEmitter<{ document: PigeonDocument }>();
  @Output() pigeonExportMjml = new EventEmitter<{ mjml: string }>();
  @Output() pigeonExportHtml = new EventEmitter<{ document: PigeonDocument; html: string | null }>();

  private _listeners: Array<[string, EventListener]> = [];

  ngAfterViewInit(): void {
    const el = this.editorRef?.nativeElement;
    if (!el) return;

    // Set initial properties
    if (this.document) {
      el.document = this.document;
    }
    if (this.config) {
      el.config = this.config;
    }
    for (const key of PASSTHROUGH_INPUTS) {
      this._syncInput(el, key);
    }

    // Wire event listeners
    this._addListener(el, 'pigeon:change', (e: Event) => {
      this.pigeonChange.emit((e as CustomEvent).detail);
    });
    this._addListener(el, 'pigeon:select', (e: Event) => {
      this.pigeonSelect.emit((e as CustomEvent).detail);
    });
    this._addListener(el, 'pigeon:ready', () => {
      this.pigeonReady.emit();
    });
    this._addListener(el, 'pigeon:preview', () => {
      this.pigeonPreview.emit();
    });
    this._addListener(el, 'pigeon:export', () => {
      this.pigeonExport.emit();
    });
    this._addListener(el, 'pigeon:export-json', (e: Event) => {
      this.pigeonExportJson.emit((e as CustomEvent).detail);
    });
    this._addListener(el, 'pigeon:export-mjml', (e: Event) => {
      this.pigeonExportMjml.emit((e as CustomEvent).detail);
    });
    this._addListener(el, 'pigeon:export-html', (e: Event) => {
      this.pigeonExportHtml.emit((e as CustomEvent).detail);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const el = this.editorRef?.nativeElement;
    if (!el) return;

    // Setting el.document is a no-op when a host resets back to the original
    // object, so load genuinely different documents explicitly.
    if (changes['document'] && this.document && this.document !== el.getDocument()) {
      el.loadDocument(this.document);
    }
    if (changes['config'] && this.config) {
      el.config = this.config;
    }
    for (const key of PASSTHROUGH_INPUTS) {
      if (changes[key]) this._syncInput(el, key);
    }
  }

  ngOnDestroy(): void {
    const el = this.editorRef?.nativeElement;
    if (!el) return;

    for (const [event, listener] of this._listeners) {
      el.removeEventListener(event, listener);
    }
    this._listeners = [];
  }

  /** Returns the current document from the editor. */
  getDocument(): PigeonDocument | undefined {
    return this.editorRef?.nativeElement?.getDocument();
  }

  /** Loads a new document into the editor (resets history). */
  loadDocument(doc: PigeonDocument): void {
    this.editorRef?.nativeElement?.loadDocument(doc);
  }

  /** Undo the last change. */
  undo(): boolean {
    return this.editorRef?.nativeElement?.undo() ?? false;
  }

  /** Redo the last undone change. */
  redo(): boolean {
    return this.editorRef?.nativeElement?.redo() ?? false;
  }

  /** Export the current document as MJML. Requires `documentToMjml`. */
  exportMjml(): string | null {
    return this.editorRef?.nativeElement?.exportMjml() ?? null;
  }

  /** Export the current document as plain text. Requires `documentToPlainText`. */
  exportPlainText(): string | null {
    return this.editorRef?.nativeElement?.exportPlainText() ?? null;
  }

  /** Export the current document as HTML. Requires `renderer`. */
  async exportHtml(): Promise<string | null> {
    return (await this.editorRef?.nativeElement?.exportHtml()) ?? null;
  }

  private _syncInput(el: PigeonEditor, key: PassthroughInput): void {
    if (this[key] !== undefined) {
      Object.assign(el, { [key]: this[key] });
    }
  }

  private _addListener(el: HTMLElement, event: string, handler: EventListener): void {
    el.addEventListener(event, handler);
    this._listeners.push([event, handler]);
  }
}
