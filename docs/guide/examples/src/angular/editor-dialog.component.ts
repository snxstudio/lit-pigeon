import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { PigeonEditorComponent, type PigeonDocument } from '@lit-pigeon/angular';
import { mjmlToDocument } from '@lit-pigeon/parser-mjml';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

export interface EditorDialogData {
  mjml: string;
}

export interface EditorDialogResult {
  mjml: string;
  html: string;
}

@Component({
  selector: 'app-editor-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PigeonEditorComponent, MatDialogContent, MatDialogActions],
  template: `
    <mat-dialog-content class="editor-content">
      <pigeon-editor-wrapper
        [document]="document"
        [renderer]="renderer"
        [documentToMjml]="toMjml"
      />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" (click)="dialogRef.close()">Cancel</button>
      <button type="button" (click)="apply()">Apply</button>
    </mat-dialog-actions>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; }
    .editor-content { flex: 1; max-height: none; padding: 0; overflow: hidden; }
  `,
})
export class EditorDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<EditorDialogComponent, EditorDialogResult>>(MatDialogRef);
  private readonly data = inject<EditorDialogData>(MAT_DIALOG_DATA);
  private readonly editor = viewChild.required(PigeonEditorComponent);

  protected readonly document: PigeonDocument = mjmlToDocument(this.data.mjml).document;
  protected readonly renderer = new MjmlRenderer();
  protected readonly toMjml = documentToMjml;

  async apply(): Promise<void> {
    const editor = this.editor();
    const mjml = editor.exportMjml();
    const html = await editor.exportHtml();
    if (mjml !== null && html !== null) this.dialogRef.close({ mjml, html });
  }
}

// #region open-dialog
export function openEditorDialog(dialog: MatDialog, mjml: string) {
  return dialog.open<EditorDialogComponent, EditorDialogData, EditorDialogResult>(EditorDialogComponent, {
    data: { mjml },
    width: '95vw',
    maxWidth: '95vw',
    height: '90vh',
    // Escape deselects inside the editor; do not let it also close the dialog.
    disableClose: true,
    autoFocus: false,
  });
}
// #endregion open-dialog
