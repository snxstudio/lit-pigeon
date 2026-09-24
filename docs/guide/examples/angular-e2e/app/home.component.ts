import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { openEditorDialog } from './editor-dialog.component';

const MJML = `<mjml><mj-body><mj-section><mj-column><mj-text>Dialog template</mj-text></mj-column></mj-section></mj-body></mjml>`;

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" id="open-dialog" (click)="open()">Open in dialog</button>
    <pre id="dialog-result">{{ result() }}</pre>
  `,
})
export class HomeComponent {
  private readonly dialog = inject(MatDialog);
  protected readonly result = signal('');

  open(): void {
    openEditorDialog(this.dialog, MJML)
      .afterClosed()
      .subscribe((r) => this.result.set(r ? `mjml:${r.mjml.length} html:${r.html.length}` : 'cancelled'));
  }
}
