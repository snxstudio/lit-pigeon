import { Component, output, viewChild } from '@angular/core';
import { PigeonEditorComponent } from '@lit-pigeon/angular';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

@Component({
  selector: 'app-email-editor',
  imports: [PigeonEditorComponent],
  template: `
    <pigeon-editor-wrapper
      [renderer]="renderer"
      [documentToMjml]="toMjml"
      (pigeonChange)="dirty = true"
      style="display: block; height: 80vh"
    />
    <button type="button" (click)="save()" [disabled]="!dirty">Save</button>
  `,
})
export class EmailEditorComponent {
  readonly saved = output<{ mjml: string | null; html: string | null }>();

  protected readonly renderer = new MjmlRenderer();
  protected readonly toMjml = documentToMjml;
  protected dirty = false;

  private readonly editor = viewChild.required(PigeonEditorComponent);

  async save(): Promise<void> {
    const editor = this.editor();
    this.saved.emit({ mjml: editor.exportMjml(), html: await editor.exportHtml() });
    this.dirty = false;
  }
}
