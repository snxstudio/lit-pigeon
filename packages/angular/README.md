# @lit-pigeon/angular

Angular wrapper for the [Lit Pigeon](https://github.com/snxstudio/lit-pigeon)
email editor. A standalone component that renders the `<pigeon-editor>` custom
element and bridges its object-shaped inputs and DOM `CustomEvent`s into
idiomatic Angular `@Input()`s and `@Output()`s.

## Install

```bash
npm install @lit-pigeon/angular
```

Requires `@angular/core` >= 17 as a peer dependency.

## Usage

```typescript
import { Component } from '@angular/core';
import {
  PigeonEditorComponent,
  type PigeonDocument,
} from '@lit-pigeon/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PigeonEditorComponent],
  template: `
    <pigeon-editor-wrapper
      [document]="doc"
      (pigeonChange)="onChange($event)"
      (pigeonReady)="onReady()"
    />
  `,
})
export class AppComponent {
  doc?: PigeonDocument;

  onChange(e: { document: PigeonDocument }) {
    this.doc = e.document;
  }
  onReady() {
    console.log('ready');
  }
}
```

### Inputs & outputs

`@Input()` — `document`, `config`. `@Output()` — `pigeonChange`,
`pigeonSelect`, `pigeonReady`, `pigeonPreview`, `pigeonExport`,
`pigeonExportJson`, `pigeonExportMjml`, `pigeonExportHtml`. The component also
exposes imperative helpers: `getDocument()`, `loadDocument(doc)`, `undo()`,
`redo()`. Core types are re-exported for convenience.

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
