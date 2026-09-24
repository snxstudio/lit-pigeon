import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { PigeonEditorComponent } from '@lit-pigeon/angular';
import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';

@Component({
  selector: 'app-editor-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabGroup, MatTab, PigeonEditorComponent],
  template: `
    <!-- preserveContent keeps the editor in the DOM while another tab is shown. -->
    <mat-tab-group preserveContent class="tabs">
      <mat-tab label="Design">
        <pigeon-editor-wrapper
          [renderer]="renderer"
          (pigeonChange)="changes.set(changes() + 1)"
          style="display: block; height: 70vh"
        />
      </mat-tab>
      <mat-tab label="Settings">
        <p>Changes this session: {{ changes() }}</p>
      </mat-tab>
    </mat-tab-group>
  `,
})
export class EditorTabsComponent {
  protected readonly renderer = new MjmlRenderer();
  protected readonly changes = signal(0);
}
