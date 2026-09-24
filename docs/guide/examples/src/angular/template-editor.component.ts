import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
  type OnInit,
} from '@angular/core';
import {
  PigeonEditorComponent,
  type EditorConfig,
  type PigeonDocument,
} from '@lit-pigeon/angular';
import { mjmlToDocument, type ParseWarning } from '@lit-pigeon/parser-mjml';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';
import { EmailApi } from './email-api.service';

@Component({
  selector: 'app-template-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PigeonEditorComponent],
  template: `
    @if (warnings().length) {
      <ul class="warnings">
        @for (w of warnings(); track $index) {
          <li>{{ w.message }}</li>
        }
      </ul>
    }
    @if (loadedDocument(); as doc) {
      <pigeon-editor-wrapper
        [document]="doc"
        [config]="config()"
        [renderer]="renderer"
        [documentToMjml]="toMjml"
        (pigeonChange)="onChange($event.document)"
      />
    }
    <footer>
      <span class="status">{{ status() }}</span>
      <button type="button" (click)="save()" [disabled]="!dirty() || saving()">Save</button>
    </footer>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; }
    pigeon-editor-wrapper { flex: 1; min-height: 0; }
  `,
})
export class TemplateEditorComponent implements OnInit {
  readonly templateId = input.required<string>();

  private readonly api = inject(EmailApi);
  private readonly editor = viewChild.required(PigeonEditorComponent);

  // #region document-binding
  /** Bound to [document]. Set only when a template is loaded, never from pigeonChange. */
  protected readonly loadedDocument = signal<PigeonDocument | undefined>(undefined);
  /** The last loaded or saved document. Not bound back into the editor. */
  private baseline: PigeonDocument | undefined;

  protected onChange(document: PigeonDocument): void {
    // pigeonChange also fires for the load itself; only a different object is an edit.
    this.dirty.set(document !== this.baseline);
  }
  // #endregion document-binding

  protected readonly warnings = signal<ParseWarning[]>([]);
  protected readonly dirty = signal(false);
  protected readonly saving = signal(false);
  protected readonly status = computed(() =>
    this.saving() ? 'Saving…' : this.dirty() ? 'Unsaved changes' : 'Saved',
  );

  protected readonly renderer = new MjmlRenderer();
  protected readonly toMjml = documentToMjml;

  // #region config
  protected readonly config = signal<Partial<EditorConfig>>({
    assetManager: {
      acceptedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      maxFileSize: 2 * 1024 * 1024,
      uploadHandler: (file) => this.api.uploadImage(file),
    },
    // No static tags: the editor asks for them with pigeon:merge-tag-request.
    mergeTags: {},
  });

  constructor() {
    // The wrapper has no output for this event, so listen on the host element.
    inject(ElementRef<HTMLElement>).nativeElement.addEventListener(
      'pigeon:merge-tag-request',
      () => void this.loadMergeTags(),
    );
  }

  private async loadMergeTags(): Promise<void> {
    const tags = await this.api.listMergeTags();
    // Update [config] rather than calling setMergeTags(), so a later config
    // change from Angular cannot overwrite the tags.
    this.config.update((config) => ({ ...config, mergeTags: { tags } }));
  }
  // #endregion config

  async ngOnInit(): Promise<void> {
    const { mjml } = await this.api.loadTemplate(this.templateId());
    const { document, warnings } = mjmlToDocument(mjml);
    this.warnings.set(warnings);
    this.baseline = document;
    this.loadedDocument.set(document);
  }

  // #region save
  async save(): Promise<void> {
    const editor = this.editor();
    const saved = editor.getDocument();
    this.saving.set(true);
    try {
      const mjml = editor.exportMjml();
      const html = await editor.exportHtml();
      if (mjml === null || html === null) throw new Error('renderer and documentToMjml must be set');
      await this.api.saveTemplate(this.templateId(), { mjml, html });
      // Edits made while the request was in flight keep the editor dirty.
      this.baseline = saved;
      this.dirty.set(editor.getDocument() !== saved);
    } finally {
      this.saving.set(false);
    }
  }
  // #endregion save
}
