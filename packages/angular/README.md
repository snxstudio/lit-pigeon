# @lit-pigeon/angular

Angular wrapper for the [Lit Pigeon](https://github.com/snxstudio/lit-pigeon)
email editor. A standalone component that renders the `<pigeon-editor>` custom
element and bridges its object-shaped inputs and DOM `CustomEvent`s into
idiomatic Angular `@Input()`s and `@Output()`s.

## Install

```bash
npm install @lit-pigeon/angular
```

Requires `@angular/core` >= 22 as a peer dependency. The package is compiled
with ng-packagr in partial (Ivy) mode, so it works in AOT production builds.

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

`@Input()` — `document`, `config`, `renderer`, `documentToMjml`, `theme`,
`themeOverrides`, `templateStorage`, `assetStorage`. `@Output()` —
`pigeonChange`, `pigeonSelect`, `pigeonReady`, `pigeonPreview`,
`pigeonExport`, `pigeonExportJson`, `pigeonExportMjml` (`{ document, mjml }`,
typed as `{ mjml: string }` but `mjml` is null without `documentToMjml`),
`pigeonExportHtml` (`{ document, html }`, with `html` null when no `renderer`
is set). There is no output for `pigeon:merge-tag-request`; listen on the host
element (Angular templates cannot bind `pigeon:*` event names). The
component also exposes imperative helpers: `getDocument()`,
`loadDocument(doc)`, `undo()`, `redo()`, `exportMjml()` and `exportHtml()`.
Core types are re-exported for convenience.

Binding `[document]` to the object the editor last emitted through
`pigeonChange` does nothing; binding a different object loads it and resets
undo history, including resetting back to the original document. Never bind a
copy of the emitted document. `pigeonChange` also fires when a document is
loaded, so compare document objects to detect real edits.

### MJML and HTML export

The wrapper does not set a renderer for you. Pass one from
`@lit-pigeon/renderer-mjml`; without it the Preview button does nothing and
`exportMjml()` / `exportHtml()` return `null`.

```typescript
import { Component, ViewChild } from '@angular/core';
import { PigeonEditorComponent, type PigeonDocument } from '@lit-pigeon/angular';
import { mjmlToDocument } from '@lit-pigeon/parser-mjml';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

@Component({
  selector: 'app-template-editor',
  imports: [PigeonEditorComponent],
  template: `
    <pigeon-editor-wrapper
      #editor
      [document]="doc"
      [renderer]="renderer"
      [documentToMjml]="toMjml"
      (pigeonChange)="doc = $event.document"
    />
  `,
})
export class TemplateEditorComponent {
  @ViewChild('editor') editor!: PigeonEditorComponent;

  doc: PigeonDocument = mjmlToDocument(savedMjml).document;
  renderer = new MjmlRenderer();
  toMjml = documentToMjml;

  async save() {
    const mjml = this.editor.exportMjml();
    const html = await this.editor.exportHtml();
    // store { mjml, html }
  }
}
```

`@lit-pigeon/renderer-mjml` imports `mjml`, which is Node-only; an Angular
build fails with `Could not resolve "fs"` (and `path`, `url`, `os`, `http`,
`https`). Alias it to the browser build in your app's `package.json`:

```json
{
  "overrides": {
    "mjml": "npm:mjml-browser@^4.18.0"
  }
}
```

(`pnpm.overrides` with pnpm, `resolutions` with Yarn.) npm applies a new
override only to a fresh tree: delete `package-lock.json` and `node_modules`,
reinstall, and check that `npm ls mjml` shows `mjml@npm:mjml-browser@…`.
`mjml-browser` is
CommonJS, so allow it in `angular.json` to silence the
`Module 'mjml' ... is not ESM` warning:

```json
"build": {
  "options": {
    "allowedCommonJsDependencies": ["mjml"]
  }
}
```

`mjml-browser` adds about 1.2 MB (raw) to the bundle, and the editor as a whole
about 2 MB, which exceeds the default 1 MB `initial` budget of a new Angular
app. Lazy-load the route that hosts the editor (`loadComponent`), or raise the
budget.

In development builds (`ng serve`), `@lit-pigeon/editor` 0.3.3 fails with
`currentDirective._$initialize is not a function` unless Lit's production
build is used: set `"conditions": ["module", "production"]` on the
`development` build configuration and `"prebundle": false` on `serve`. See
[Angular](../../docs/guide/angular.md#development-builds-and-ng-serve).

### Image uploads with auth headers

Uploads are configured through `[config]`'s `assetManager`, an
`AssetManagerConfig`:

```typescript
interface AssetManagerConfig {
  enabled?: boolean;
  uploadUrl?: string;
  uploadHeaders?: Record<string, string>;
  acceptedTypes?: string[];
  maxFileSize?: number;
  uploadHandler?: (file: File) => Promise<string>;
  presignedUpload?: {
    getUploadParams: (file: File) => Promise<PresignedUploadParams>;
  };
  stock?: StockConfig;
}
```

`uploadHandler` takes precedence over `presignedUpload` and `uploadUrl`, and
resolves to the public URL of the uploaded image:

```typescript
import type { EditorConfig } from '@lit-pigeon/angular';

config: Partial<EditorConfig> = {
  assetManager: {
    uploadHandler: async (file) => {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/email-assets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.auth.token()}` },
        body,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return (await res.json()).url;
    },
  },
};
```

```html
<pigeon-editor-wrapper [document]="doc" [config]="config" />
```

For a fixed header set, `uploadUrl` plus `uploadHeaders` also works: the editor
POSTs the file as multipart field `file` and reads `url`, `src` or `location`
from the JSON response.

The [Angular guide](../../docs/guide/angular.md) covers zoneless and OnPush
change detection, Material dialogs and tabs, and a complete component that is
built and tested in a fresh Angular 22 application.

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
