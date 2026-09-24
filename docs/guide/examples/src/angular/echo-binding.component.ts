import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PigeonEditorComponent, type PigeonDocument } from '@lit-pigeon/angular';

@Component({
  selector: 'app-echo-binding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PigeonEditorComponent],
  // #region echo
  template: `
    <pigeon-editor-wrapper
      [document]="document()"
      (pigeonChange)="document.set($event.document)"
    />
  `,
  // #endregion echo
})
export class EchoBindingComponent {
  // #region echo-state
  // Safe: the exact object from the event is bound back, so the wrapper sees
  // the document the editor already holds and does nothing.
  readonly document = signal<PigeonDocument | undefined>(undefined);

  // Unsafe: any copy is a different object, so the editor reloads it, drops
  // undo history and fires pigeonChange again.
  //   (pigeonChange)="document.set(structuredClone($event.document))"
  // #endregion echo-state
}
