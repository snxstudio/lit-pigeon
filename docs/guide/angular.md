# Angular

This page covers what is specific to embedding the editor in an Angular 22 or
later application: the build settings, change detection, binding the document
safely and using the editor inside Angular Material dialogs and tabs.

Every example on this page is compiled in a fresh `ng new` Angular 22 production
application and exercised in headless Chromium by
[`examples/angular-e2e/run.sh`](./examples/angular-e2e/run.sh).

## Requirements and installation

| Package | Version | Notes |
|---|---|---|
| `@lit-pigeon/angular` | 0.2.0 | Peer dependency `@angular/core` `>=22.0.0`. |
| `@lit-pigeon/editor`, `@lit-pigeon/core` | 0.3.3 | Installed as dependencies of the wrapper. |
| `@lit-pigeon/parser-mjml` | 0.1.7 | Needed to load stored MJML. |
| `@lit-pigeon/renderer-mjml` | 0.2.4 | Needed for preview, `exportMjml()` and `exportHtml()`. |

```bash
npm install @lit-pigeon/angular @lit-pigeon/parser-mjml @lit-pigeon/renderer-mjml
```

Versions of `@lit-pigeon/angular` before 0.2.0 were built without Ivy metadata
and fail at runtime in AOT production builds; see
[Troubleshooting](./troubleshooting.md#angular-aot-or-jit-errors-from-lit-pigeonangular-before-020).

The Angular CLI 22 itself needs Node.js 22.22.3 or later, or 24.15 or later.

## Build configuration

### Replace `mjml` with `mjml-browser`

`@lit-pigeon/renderer-mjml` imports `mjml`, which only runs in Node.js. An
Angular build that includes the renderer fails with
`Could not resolve "fs"` (and `path`, `url`) until `mjml` is aliased to its
browser build. Add an override to the application's `package.json`:

<!-- snippet: src/angular/package-overrides.json -->
```json
{
  "overrides": {
    "mjml": "npm:mjml-browser@^4.18.0"
  }
}
```

With pnpm, the same block goes under `pnpm`:

<!-- snippet: src/angular/package-overrides-pnpm.json -->
```json
{
  "pnpm": {
    "overrides": {
      "mjml": "npm:mjml-browser@^4.18.0"
    }
  }
}
```

With Yarn, use `resolutions`. Keep the override on the 4.x line: the renderer
depends on `mjml` `^4.15.0`.

npm only applies a new override to a fresh dependency tree. If `mjml` is
already in `package-lock.json`, delete `package-lock.json` and `node_modules`
and install again, then confirm the alias took effect:

```bash
rm -rf node_modules package-lock.json
npm install
npm ls mjml   # expect: mjml@npm:mjml-browser@4.18.0
```

### Allow the CommonJS dependency

`mjml-browser` is CommonJS, so the build warns
`Module 'mjml' used by '.../@lit-pigeon/renderer-mjml/dist/index.js' is not ESM`.
Silence it in `angular.json` (shown here as the path from the root of the file;
replace `my-app` with your project name):

<!-- snippet: src/angular/angular-build-options.json -->
```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "options": {
            "allowedCommonJsDependencies": ["mjml"]
          }
        }
      }
    }
  }
}
```

### Bundle budgets

A new Angular 22 application has an `initial` budget of 500 kB (warning) and
1 MB (error). The editor, Lit, the rich-text engine and `mjml-browser` together
exceed it. Measured in the verification application:

| How the editor is loaded | Initial bundle (raw / transfer) | Result |
|---|---|---|
| Imported by the root component | 2.21 MB / 481 kB | Build fails: "Budget 1.00 MB was not met by 1.21 MB" |
| Lazy route with `loadComponent` (below) | 250 kB / 68 kB | Passes; opening the editor route downloads about 1.9 MB more (about 570 kB gzipped) |

Of the editor route's download, `mjml-browser` is about 1.2 MB raw and the
TipTap rich-text engine about 630 kB. Angular's esbuild bundler puts TipTap in
the same chunk as the editor, so in an Angular build it loads with the route
rather than on the first text edit.

Lazy-load the route that hosts the editor rather than raising the budget:

<!-- snippet: src/angular/app.routes.ts -->
```ts
import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'templates/:templateId/edit',
    // Lazy-loading keeps the editor, Lit, TipTap and mjml-browser out of the initial bundle.
    loadComponent: () => import('./template-editor.component').then((m) => m.TemplateEditorComponent),
  },
];
```

If the editor must appear on an eagerly loaded page, raise `maximumError` for
the `initial` budget in the `production` configuration and accept the larger
first load.

### Development builds and `ng serve`

With `@lit-pigeon/editor` 0.3.3, development builds (`ng serve`,
`ng build --configuration development`) load Lit's development build, which
does not match a copy of Lit's `ref` directive bundled inside the editor. The
text, HTML and body panels then fail to render, with
`TypeError: currentDirective._$initialize is not a function` in the console.
Production builds are not affected. Until the editor package is fixed, resolve
Lit's production build in development too, and turn off Vite pre-bundling for
the dev server:

<!-- snippet: src/angular/angular-dev-workaround.json -->
```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "configurations": {
            "development": {
              "conditions": ["module", "production"]
            }
          }
        },
        "serve": {
          "options": {
            "prebundle": false
          }
        }
      }
    }
  }
}
```

Both settings are needed: `conditions` alone fixes `ng build` but not
`ng serve`, whose pre-bundling ignores it. See
[Troubleshooting](./troubleshooting.md#currentdirective_initialize-is-not-a-function-in-development).

## Standalone import

`PigeonEditorComponent` is a standalone component with the selector
`pigeon-editor-wrapper`. Add it to a component's `imports`; no `NgModule` or
`CUSTOM_ELEMENTS_SCHEMA` is needed in your code (the wrapper declares the
schema for the inner `<pigeon-editor>` element itself).

The component below loads a stored template, lets the user edit it, uploads
images through the application's authenticated API, supplies merge tags on
demand, and saves `{ mjml, html }`:

<!-- snippet: src/angular/template-editor.component.ts -->
```ts
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
```

The `EmailApi` service stands in for your own backend. The paths are
placeholders; the important part is that every request, including the image
upload, carries the user's access token:

<!-- snippet: src/angular/email-api.service.ts -->
```ts
import { Injectable, InjectionToken, inject } from '@angular/core';
import type { MergeTag } from '@lit-pigeon/angular';

/** Returns the current access token. Provide it from your auth layer. */
export const ACCESS_TOKEN = new InjectionToken<() => string>('ACCESS_TOKEN');

export interface StoredTemplate {
  mjml: string;
  html: string;
}

/** Your application's own API. The paths are placeholders. */
@Injectable({ providedIn: 'root' })
export class EmailApi {
  private readonly token = inject(ACCESS_TOKEN);

  async loadTemplate(id: string): Promise<StoredTemplate> {
    return this.request<StoredTemplate>(`/api/email-templates/${encodeURIComponent(id)}`);
  }

  async saveTemplate(id: string, template: StoredTemplate): Promise<void> {
    await this.request(`/api/email-templates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
  }

  async listMergeTags(): Promise<MergeTag[]> {
    return this.request<MergeTag[]>('/api/merge-tags');
  }

  /** Uploads one image and resolves to the public URL stored on the image block. */
  async uploadImage(file: File): Promise<string> {
    const body = new FormData();
    body.append('file', file, file.name);
    const { url } = await this.request<{ url: string }>('/api/email-assets', { method: 'POST', body });
    return url;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${this.token()}`);
    const res = await fetch(path, { ...init, headers });
    if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed: ${res.status}`);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }
}
```

`uploadHandler` calls the service for every file, so a refreshed token is
picked up without rebuilding the configuration. If you use Angular's
`HttpClient` with an auth interceptor instead of `fetch`, return
`firstValueFrom(...)` from `uploadImage`.

The application configuration binds the `:templateId` route parameter to the
component's input, which needs `withComponentInputBinding()`:

<!-- snippet: src/angular/app.config.ts -->
```ts
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ACCESS_TOKEN } from './email-api.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Binds the :templateId route parameter to TemplateEditorComponent's input.
    provideRouter(routes, withComponentInputBinding()),
    // Replace with your auth layer's token getter.
    { provide: ACCESS_TOKEN, useValue: () => sessionStorage.getItem('access_token') ?? '' },
  ],
};
```

Without it, reading the required input throws `NG0950`.

## Inputs, outputs and methods

| Input | Type | Passed to `<pigeon-editor>` as |
|---|---|---|
| `document` | `PigeonDocument` | Loaded when the bound object differs from the one the editor holds (see below). |
| `config` | `Partial<EditorConfig>` | `config`; see [Configuration](./configuration.md). |
| `renderer` | `Renderer` | `renderer`; needed for preview and `exportHtml()`. |
| `documentToMjml` | `(doc, options?) => string` | `documentToMjml`; needed for `exportMjml()`. |
| `theme` | `'light' \| 'dark' \| 'auto'` | `theme`. |
| `themeOverrides` | `Record<string, string>` | `themeOverrides`. |
| `templateStorage` | `TemplateStorage` | `templateStorage`. |
| `assetStorage` | `AssetStorage` | `assetStorage`. |

Inputs left `undefined` are not passed on, so setting an input back to
`undefined` does not clear the value on the element.

| Output | Payload | Source event |
|---|---|---|
| `pigeonChange` | `{ document }` | `pigeon:change` |
| `pigeonSelect` | `{ selection }` | `pigeon:select` |
| `pigeonReady` | none | `pigeon:ready` |
| `pigeonPreview` | none | `pigeon:preview` |
| `pigeonExport` | none | `pigeon:export` |
| `pigeonExportJson` | `{ document }` | `pigeon:export-json` |
| `pigeonExportMjml` | `{ document, mjml }` | `pigeon:export-mjml` (typed as `{ mjml: string }`, but `mjml` is `null` without `documentToMjml` and `document` is also present) |
| `pigeonExportHtml` | `{ document, html }` | `pigeon:export-html` (`html` is `null` without `renderer`) |

There is no output for `pigeon:merge-tag-request`, `brand-kit-change`,
`brand-kit-error` or `row-library-error`. Listen for them on the wrapper's host
element as in the example above. Angular's `(event)` template syntax cannot be
used for `pigeon:*` names: it reads the part before the colon as a global
target and the build fails with "Unexpected global target 'pigeon' defined for
'merge-tag-request' event".

Methods, called on the component instance (for example through `viewChild`):
`getDocument()`, `loadDocument(doc)` (resets undo history), `undo()`, `redo()`,
`exportMjml()` and `exportHtml()`. They return `undefined`, `false` or `null`
before the view has initialised. `setMergeTags()` is not exposed; update
`[config]` instead, or call it on the inner `<pigeon-editor>` element.

The full event and method reference is in [Events and API](./events-and-api.md).

## Change detection: OnPush and zoneless

New Angular 22 applications are zoneless. The wrapper emits its outputs from
DOM event listeners, and a listener bound in a template, such as
`(pigeonChange)="onChange($event.document)"`, marks the host component for
check. Signals written in the handler, as in the example above, update an
`OnPush` view without any further work. The verification application runs
zoneless with `OnPush` components throughout.

Two things to keep in mind:

- Listeners you add yourself with `addEventListener` (like the
  `pigeon:merge-tag-request` listener above) are not wrapped by Angular. Write
  to signals in them, or call `ChangeDetectorRef.markForCheck()`.
- In an application that still uses Zone.js, every event inside the editor,
  including pointer moves during drag and drop, triggers application-wide
  change detection. Use `OnPush` on the components around the editor, and
  consider `provideZoneChangeDetection({ eventCoalescing: true })`.

## Binding `[document]` safely

The editor keeps its own copy of the document state. The wrapper compares the
bound `[document]` object with the one the editor currently holds, and
**reloads** the editor, **resetting undo history**, when they differ. The
editor also fires `pigeon:change` when it loads a document, including the
first one.

The safest pattern is to bind `[document]` only to the document you load, and
keep edits somewhere that is not bound back:

<!-- snippet: src/angular/template-editor.component.ts#document-binding -->
```ts
/** Bound to [document]. Set only when a template is loaded, never from pigeonChange. */
protected readonly loadedDocument = signal<PigeonDocument | undefined>(undefined);
/** The last loaded or saved document. Not bound back into the editor. */
private baseline: PigeonDocument | undefined;

protected onChange(document: PigeonDocument): void {
  // pigeonChange also fires for the load itself; only a different object is an edit.
  this.dirty.set(document !== this.baseline);
}
```

If you do echo the change event back into `[document]`, for example to keep
a store in sync, bind the exact object from the event:

<!-- snippet: src/angular/echo-binding.component.ts#echo -->
```ts
template: `
  <pigeon-editor-wrapper
    [document]="document()"
    (pigeonChange)="document.set($event.document)"
  />
`,
```

<!-- snippet: src/angular/echo-binding.component.ts#echo-state -->
```ts
// Safe: the exact object from the event is bound back, so the wrapper sees
// the document the editor already holds and does nothing.
readonly document = signal<PigeonDocument | undefined>(undefined);

// Unsafe: any copy is a different object, so the editor reloads it, drops
// undo history and fires pigeonChange again.
//   (pigeonChange)="document.set(structuredClone($event.document))"
```

Rules that follow from this:

- Never bind a copy (`structuredClone`, a spread, a JSON round trip, or a store
  that copies on write). Each copy reloads the editor and fires another
  `pigeonChange`, which can loop.
- Never bind a document late, for example after a debounce. By then the editor
  holds a newer document, and binding the older one discards the newer edits.
- Documents the editor emits after an edit are frozen (Immer). Read them
  freely, but do not mutate them; copy them for your own use.
- To load a different template deliberately, bind a different object or call
  `loadDocument()`.

## Exporting MJML and HTML

`exportMjml()` returns `documentToMjml(document)` for the current document, or
`null` when no `[documentToMjml]` is bound. `exportHtml()` resolves to the
compiled HTML from `[renderer]`, or `null` when no renderer is bound. Both use
the fonts from `config.fontConfig` and the active brand kit.

<!-- snippet: src/angular/template-editor.component.ts#save -->
```ts
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
```

`exportHtml()` discards the renderer's `errors`. If you need them, call
`renderer.render(editor.getDocument())` yourself. Treat HTML produced in the
browser as untrusted when it reaches your server; see [Security](./security.md).

## Angular Material dialogs

The editor works inside a `MatDialog`. Give the dialog most of the viewport,
let the editor fill the content area, and set `disableClose: true`: Escape
deselects inside the editor, and without `disableClose` it also closes the
dialog.

<!-- snippet: src/angular/editor-dialog.component.ts -->
```ts
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
```

Other points for dialogs:

- Keyboard shortcuts (Delete, arrows, Cmd/Ctrl+C/V/Z/D) only act on key presses
  aimed at the editor or at the page body, so form fields elsewhere in the
  dialog keep their normal behaviour. This needs `@lit-pigeon/editor` 0.3.3 or
  later.
- The editor's fullscreen button uses `position: fixed`. Inside a dialog it
  covers the dialog rather than the window if any ancestor has a CSS
  `transform`. Treat the dialog itself as the full-screen surface.
- Moving the element in the DOM (which overlays and portals do) keeps the
  document and undo history from `@lit-pigeon/editor` 0.3.3. Earlier versions
  reset to the initial document.

## Angular Material tabs

Inside a `mat-tab-group`, use `preserveContent` so the editor stays in the DOM
while another tab is visible:

<!-- snippet: src/angular/editor-tabs.component.ts -->
```ts
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
```

With `@lit-pigeon/editor` 0.3.3 the document and undo history also survive tab
switches without `preserveContent`, because the element keeps its state when
it is detached and re-attached (verified in the same application). With
earlier versions, `preserveContent` is required. If a tab uses a lazy
`matTabContent` template that destroys its view, the wrapper is recreated;
keep the latest document from `pigeonChange` and bind it on return.
