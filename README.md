<p align="center">
  <img src="lit-pigeon.png" alt="Lit Pigeon" width="180" />
</p>

<h1 align="center">Lit Pigeon</h1>

<p align="center">
  <strong>Open-source, framework-agnostic, drag-and-drop email editor.</strong><br/>
  Build beautiful emails visually. Ship as HTML. No vendor lock-in.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#packages">Packages</a> &middot;
  <a href="#usage">Usage</a> &middot;
  <a href="#roadmap">Roadmap</a> &middot;
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6.svg" alt="TypeScript" /></a>
  <a href="https://lit.dev"><img src="https://img.shields.io/badge/built%20with-Lit-324FFF.svg" alt="Built with Lit" /></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-workspace-F69220.svg" alt="pnpm" /></a>
</p>

---

## Why Lit Pigeon?

There is no truly open-source, self-hosted, framework-agnostic drag-and-drop email editor. The current landscape:

| Tool | Problem |
|---|---|
| **Unlayer** | "Open source" wrapper loads proprietary editor from CDN. Custom JS costs $250/mo+ |
| **GrapesJS** | General web builder, not email-specific. Outlook rendering broken. MJML plugin adds 1.3 MB |
| **MJML / React Email / Maizzle** | Code-only. Not visual editors |
| **Mosaico** | Legacy Knockout.js, GPL, essentially abandoned |
| **Stripo, Chamaileon, Beefree** | Proprietary, vendor lock-in |

**Lit Pigeon** fills this gap: a fully open-source (MIT), framework-agnostic, high-performance email editor that works in React, Vue, Angular, Svelte, and vanilla JS with a single codebase.

### Design Principles

- **Zero lock-in** -- Your email data is a plain JSON document. Export to HTML anytime.
- **Framework-agnostic** -- Built with Lit Web Components. Works everywhere custom elements work.
- **Tiny footprint** -- Core engine is ~5 kB gzipped. Full editor under 17 kB gzipped.
- **Extensible** -- Plugin system inspired by ProseMirror. Add custom blocks, commands, and behaviors.
- **Email-first** -- Every decision optimized for email rendering, not generic web pages.

---

## Packages

| Package | Description | Size (gz) |
|---|---|---|
| [`@lit-pigeon/core`](./packages/core) | Pure TypeScript engine — document schema, state management, commands, undo/redo, plugin system | ~4.4 kB |
| [`@lit-pigeon/editor`](./packages/editor) | Lit Web Components UI — canvas, palette, properties panels, toolbar, drag-and-drop, layers, merge tags, keyboard shortcuts | ~29.6 kB |
| [`@lit-pigeon/renderer-mjml`](./packages/renderer-mjml) | MJML-based HTML renderer — converts documents to email-safe HTML | ~2.6 kB + mjml |
| [`@lit-pigeon/parser-mjml`](./packages/parser-mjml) | MJML → JSON document parser — import existing MJML into the editor | ~2.9 kB |
| [`@lit-pigeon/react`](./packages/react) | React wrapper via `@lit/react` | 0.5 kB |
| [`@lit-pigeon/angular`](./packages/angular) | Angular component wrapper | ~1 kB |
| [`@lit-pigeon/mcp-server`](./packages/mcp-server) | Model Context Protocol server — exposes authoring + rendering as MCP tools for AI clients (Claude Code, Cursor, etc.) | Node.js |
| [`@lit-pigeon/figma-import`](./packages/figma-import) | Convert a Figma frame into a `PigeonDocument` via the Figma REST API | Node.js |

Sizes are measured by `pnpm size` and enforced in CI via [size-limit](https://github.com/ai/size-limit), excluding peer dependencies. See [`.size-limit.json`](./.size-limit.json) for the budgets.

---

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Install

```bash
git clone https://github.com/snxstudio/unnlayer.git lit-pigeon
cd lit-pigeon
pnpm install
pnpm build
```

### Run the Playground

```bash
pnpm --filter @lit-pigeon/playground dev
```

Open http://localhost:5173 to see the editor in action.

### Run Tests

```bash
pnpm test
```

---

## Usage

### Vanilla JS / Web Components

```html
<script type="module">
  import '@lit-pigeon/editor';
</script>

<pigeon-editor id="editor"></pigeon-editor>

<script>
  const editor = document.querySelector('#editor');

  editor.addEventListener('pigeon:change', (e) => {
    console.log('Document:', e.detail.document);
  });

  editor.addEventListener('pigeon:ready', () => {
    console.log('Editor ready');
  });
</script>
```

### React

```bash
npm install @lit-pigeon/react
```

```jsx
import { PigeonEditor } from '@lit-pigeon/react';

function App() {
  return (
    <PigeonEditor
      onChange={(e) => console.log(e.detail.document)}
      onReady={() => console.log('Ready')}
    />
  );
}
```

### Angular

```bash
npm install @lit-pigeon/angular
```

```typescript
import { Component } from '@angular/core';
import { PigeonEditorComponent } from '@lit-pigeon/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PigeonEditorComponent],
  template: `
    <pigeon-editor-wrapper
      (pigeonChange)="onChange($event)"
      (pigeonReady)="onReady()"
    />
  `,
})
export class AppComponent {
  onChange(e: { document: unknown }) {
    console.log(e.document);
  }
  onReady() {
    console.log('Ready');
  }
}
```

### Vue

```vue
<template>
  <pigeon-editor @pigeon:change="onChange" />
</template>

<script setup>
import '@lit-pigeon/editor';

function onChange(e) {
  console.log(e.detail.document);
}
</script>
```

### Export to HTML

```typescript
import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';

const renderer = new MjmlRenderer();
const doc = editor.getDocument();
const { html } = await renderer.render(doc);
// html is email-client-safe with inline CSS
```

---

## Asset manager / image upload

The editor ships a built-in asset picker that handles file selection,
validation, progress, and four upload strategies. Configure it via the
`assetManager` key on the editor config.

### Config fields

| Field | Type | Notes |
|---|---|---|
| `enabled` | `boolean` | When `false`, the "Upload Image" button is hidden in the image-properties panel and the asset-manager modal refuses to render. URL paste still works. Default `true`. |
| `uploadHandler` | `(file: File) => Promise<string>` | Full-control escape hatch. Resolves to the URL stored on the image block. Wins over every other adapter when set. |
| `presignedUpload` | `{ getUploadParams: (file: File) => Promise<PresignedUploadParams> }` | Two-step upload: ask your backend for a signed URL, then `PUT`/`POST` directly to S3/R2/GCS/Azure/MinIO. |
| `uploadUrl` | `string` | Simple REST endpoint. The editor `POST`s `multipart/form-data` and expects `{ url \| src \| location }` in the JSON response. |
| `uploadHeaders` | `Record<string, string>` | Sent with the `uploadUrl` `POST`. |
| `acceptedTypes` | `string[]` | MIME allowlist. Default: jpeg/png/gif/webp/svg+xml. |
| `maxFileSize` | `number` | Bytes. Default: 5 MB. |

Adapter precedence (first one set wins): `uploadHandler` > `presignedUpload` > `uploadUrl` > base64 data-URL fallback.

### Recipes

**1. URL only — no upload UI**

```typescript
editor.config = { assetManager: { enabled: false } };
```

**2. Simple REST endpoint**

```typescript
editor.config = {
  assetManager: {
    uploadUrl: '/api/uploads',
    uploadHeaders: { Authorization: `Bearer ${token}` },
  },
};
// Server returns: { "url": "https://cdn.example.com/abc.png" }
```

**3. Custom handler (full control)**

```typescript
editor.config = {
  assetManager: {
    uploadHandler: async (file) => {
      const url = await myUploader.upload(file);
      return url;
    },
  },
};
```

**4. S3 presigned PUT**

```typescript
editor.config = {
  assetManager: {
    presignedUpload: {
      getUploadParams: async (file) => {
        const res = await fetch('/api/sign', {
          method: 'POST',
          body: JSON.stringify({ name: file.name, type: file.type }),
        });
        const { uploadUrl, publicUrl } = await res.json();
        return { uploadUrl, publicUrl }; // PUT is the default method
      },
    },
  },
};
```

**5. S3 POST presigned-post**

```typescript
editor.config = {
  assetManager: {
    presignedUpload: {
      getUploadParams: async (file) => {
        const res = await fetch('/api/sign-post', {
          method: 'POST',
          body: JSON.stringify({ name: file.name, type: file.type }),
        });
        const { url, fields, publicUrl } = await res.json();
        return {
          uploadUrl: url,
          publicUrl,
          method: 'POST',
          fields, // key, policy, x-amz-signature, etc.
        };
      },
    },
  },
};
```

---

## AI authoring specification

Lit Pigeon publishes a versioned **AI authoring specification** at
[`docs/ai-spec/`](./docs/ai-spec/) — a JSON Schema, prompting guide, and
example documents that let any AI tool (LLMs via JSON output, MCP-compatible
clients, custom agents) author Lit Pigeon emails as JSON. The spec is the
canonical contract. [`@lit-pigeon/mcp-server`](./packages/mcp-server) is the
runtime implementation: plug it into Claude Code, Cursor, or any MCP client
and ask the model to build emails for you. [`@lit-pigeon/figma-import`](./packages/figma-import)
converts a Figma frame into the same `PigeonDocument` shape, and the MCP
server exposes it as the `import_figma_frame` tool — turning "build me an
email from this Figma design" into one prompt.

```bash
docs/ai-spec/
├── README.md                          # Overview + how to consume the spec
├── lit-pigeon-ai-spec.schema.json     # Machine-readable JSON Schema (2020-12)
├── prompting-guide.md                 # System-prompt template + invariants
└── examples/
    ├── welcome-email.json
    └── promo-email.json
```

---

## Architecture

```
User Action --> Command Dispatch --> Transaction --> EditorState update --> UI re-render
                                                         |
                                                   History stack (undo/redo)
                                                         |
                                                   Renderer (JSON --> MJML --> HTML)
```

**Document model** -- A plain JSON tree:

```
PigeonDocument
  +-- metadata (name, previewText, timestamps)
  +-- body
       +-- attributes (width, backgroundColor, fontFamily)
       +-- rows[]
            +-- columns[]
                 +-- blocks[] (text, image, button, divider, spacer, social, html)
```

**State management** -- Immutable state via Immer. Every change produces a `Transaction` with invertible `Step` objects, enabling reliable undo/redo.

**Plugin system** -- ProseMirror-inspired. Plugins can provide custom blocks, commands, and state management hooks.

---

## Block Types

| Block | Description |
|---|---|
| **Text** | Rich text with HTML content |
| **Image** | Responsive images with alignment and border radius |
| **Button** | CTA buttons with full styling control |
| **Divider** | Horizontal rules with style options |
| **Spacer** | Vertical spacing |
| **Social** | Social media icon links (Facebook, Twitter, Instagram, LinkedIn, YouTube, TikTok) |
| **HTML** | Raw HTML for custom content |

---

## Roadmap

### v0.1 -- Foundation (current)
- [x] Core engine with document schema and validation
- [x] Immutable EditorState + Transaction system
- [x] Command system (insert, delete, move, update, duplicate blocks/rows, column add/remove/resize)
- [x] Undo/redo via history plugin
- [x] Plugin registry
- [x] Lit Web Components editor UI
- [x] Drag-and-drop from palette to canvas (and reorder blocks within columns)
- [x] Property panels for text, image, button, hero, navbar, row, and body
- [x] MJML renderer for email-safe HTML export
- [x] MJML parser for importing existing email templates (`@lit-pigeon/parser-mjml`)
- [x] React wrapper (`@lit-pigeon/react`)
- [x] Angular wrapper (`@lit-pigeon/angular`)
- [x] Asset manager and merge-tag picker components (available as standalone, default wiring in v0.2)
- [x] Playground app + landing page

### v0.2 -- Rich Editing & UX

> **Breaking change (pre-1.0):** `ButtonBlock.values.text: string` has been
> renamed to `ButtonBlock.values.content: string` and now stores HTML
> (e.g. `<p>Click me</p>`). The MJML renderer strips the wrapping `<p>` so
> existing emails render identically, and the parser re-wraps plain inner
> text on read. There is no automatic migration helper — update stored
> documents by renaming the field and wrapping the value in `<p>...</p>`.

- [x] Inline rich text editing (TipTap/ProseMirror integration — double-click to edit text/hero/button blocks, bubble menu, sidebar Format panel, merge-tag chips, allowlist sanitiser)
- [x] Property panels for divider, spacer, social, and html blocks
- [x] Wire asset manager, merge-tag picker, and layers panel into the default editor shell
- [x] Image upload with configurable adapter (URL, base64, presigned PUT/POST, custom handler)
- [x] Copy/paste blocks (Cmd/Ctrl+C / Cmd/Ctrl+V on a selected block; in-memory clipboard)
- [x] Keyboard shortcuts (Cmd/Ctrl+Z undo, Shift+Cmd/Ctrl+Z or Ctrl+Y redo, Delete, Cmd/Ctrl+D duplicate, Cmd/Ctrl+C / Cmd/Ctrl+V copy/paste, Escape deselect, ArrowUp/Down navigate blocks/rows)
- [x] Arrow-key row navigation
- [x] Row reordering via drag within canvas

### AI Integration (cross-cutting, shipped)

A separate track that any AI tool — Claude Code, Cursor, custom agents, raw LLM prompting — can target to author and import Lit Pigeon emails.

- [x] AI authoring specification 1.0 — JSON Schema + prompting guide + example documents at [`docs/ai-spec/`](./docs/ai-spec/)
- [x] `@lit-pigeon/mcp-server` — Model Context Protocol stdio server exposing 18 tools (create/list/get/validate document, set body attribute, set metadata, list block types, add row, add/update/delete block, render to MJML/HTML, import Figma frame, list/load/save/delete template)
- [x] `@lit-pigeon/figma-import` — Figma frame → `PigeonDocument` via the Figma REST API; standalone library + `import_figma_frame` MCP tool

### v0.3 -- Templates & Theming
- [x] Template system with save/load (`TemplateStorage` + `InMemoryTemplateStorage` in `@lit-pigeon/core`; `list_templates`/`load_template`/`save_template`/`delete_template` MCP tools)
- [x] Pre-built email templates (welcome, newsletter, transactional, promo) — `getStarterTemplates()` from `@lit-pigeon/core`
- [ ] Editor toolbar UI for templates (Save as / Open buttons)
- [ ] File-system-backed `TemplateStorage` (templates persist across MCP-server restarts)
- [ ] Dark theme
- [ ] Theme customization API
- [ ] `::part()` CSS selectors for deep customization

### v0.4 -- Advanced Features
- [ ] Conditional content / dynamic variables (`{{firstName}}`)
- [ ] Mobile-responsive preview baked into the main canvas
- [ ] Outlook (mso) and dark-mode rendering workarounds + email-client compatibility matrix
- [ ] Collaborative editing (CRDT-based)
- [ ] Custom block plugin API with full docs
- [ ] Accessibility audit (WCAG 2.1 AA)

### v0.5 -- Framework Wrappers & Ecosystem
- [ ] Vue wrapper (`@lit-pigeon/vue`)
- [ ] Svelte wrapper (`@lit-pigeon/svelte`)
- [ ] Server-side rendering API
- [ ] REST API adapter for headless usage
- [x] Figma-to-email import — `@lit-pigeon/figma-import` (see [AI Integration](#ai-integration-cross-cutting-shipped))
- [ ] Hero block detection in Figma importer (image + overlay-text heuristic)
- [ ] `import_figma_frame` live-sandbox smoke test in CI

### Future
- [ ] AI-powered content suggestions
- [ ] Email client preview (Gmail, Outlook, Apple Mail rendering)
- [ ] A/B testing block variants
- [ ] Analytics integration (open/click tracking placeholders)
- [ ] Internationalization (i18n)

---

## Project Structure

```
lit-pigeon/
  packages/
    core/              # Pure TypeScript engine (0 runtime UI deps)
    editor/            # Lit Web Components UI
    renderer-mjml/     # JSON -> MJML -> HTML renderer
    parser-mjml/       # MJML -> JSON parser (import existing templates)
    react/             # React wrapper via @lit/react
    angular/           # Angular component wrapper
  apps/
    playground/        # Development playground app + landing page
  package.json         # Workspace root
  pnpm-workspace.yaml
  turbo.json           # Turborepo build pipeline
  tsconfig.base.json   # Shared TypeScript config
  vitest.workspace.ts  # Test workspace config
```

---

## Contributing

We welcome contributions of all kinds! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick contribution guide

1. **Fork** the repository
2. **Create a branch** -- `git checkout -b feat/my-feature`
3. **Make your changes** -- follow existing code style
4. **Test** -- `pnpm test`
5. **Commit** -- use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.)
6. **Push** -- `git push origin feat/my-feature`
7. **Open a Pull Request**

### Good first issues

Look for issues labeled [`good first issue`](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) -- these are curated for newcomers.

### Areas where help is needed

- Additional block types (countdown timer, video embed, menu/nav)
- Framework wrappers (Vue, Angular, Svelte)
- Email client testing and rendering fixes
- Documentation and tutorials
- Accessibility improvements
- Internationalization

---

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run playground in dev mode
pnpm --filter @lit-pigeon/playground dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint
pnpm lint

# Format
pnpm format
```

---

## License

[MIT](LICENSE) -- free for personal and commercial use.

---

## Acknowledgements

Lit Pigeon draws inspiration from these excellent projects:

- [ProseMirror](https://prosemirror.net/) -- Transaction and command architecture
- [Lit](https://lit.dev/) -- Web Components foundation
- [MJML](https://mjml.io/) -- Email-safe HTML rendering
- [Immer](https://immerjs.github.io/immer/) -- Immutable state management
- [Unlayer](https://unlayer.com/) -- UX inspiration (we built the open-source alternative)

---

<p align="center">
  <sub>Built with fire by the open-source community.</sub>
</p>
