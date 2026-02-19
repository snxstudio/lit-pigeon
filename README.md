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
| [`@lit-pigeon/core`](./packages/core) | Pure TypeScript engine — document schema, state management, commands, undo/redo, plugin system | ~5 kB |
| [`@lit-pigeon/editor`](./packages/editor) | Lit Web Components UI — canvas, palette, properties panel, toolbar, drag-and-drop | ~17 kB |
| [`@lit-pigeon/renderer-mjml`](./packages/renderer-mjml) | MJML-based HTML renderer — converts documents to email-safe HTML | ~2 kB + mjml |
| [`@lit-pigeon/react`](./packages/react) | React wrapper via `@lit/react` | <1 kB |

---

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Install

```bash
git clone https://github.com/your-username/lit-pigeon.git
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
- [x] Command system (insert, delete, move, update, duplicate blocks/rows)
- [x] Undo/redo via history plugin
- [x] Plugin registry
- [x] Lit Web Components editor UI
- [x] Drag-and-drop from palette to canvas
- [x] Property panels for all block types
- [x] MJML renderer for email-safe HTML export
- [x] React wrapper
- [x] Playground app

### v0.2 -- Rich Editing
- [ ] Inline rich text editing (TipTap/ProseMirror integration)
- [ ] Image upload with configurable adapter (URL, base64, S3 presigned)
- [ ] Copy/paste blocks
- [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete, arrow keys)
- [ ] Block reordering via drag within canvas

### v0.3 -- Templates & Theming
- [ ] Template system with save/load
- [ ] Dark theme
- [ ] Theme customization API
- [ ] `::part()` CSS selectors for deep customization
- [ ] Pre-built email templates (welcome, newsletter, transactional, promo)

### v0.4 -- Advanced Features
- [ ] Conditional content / dynamic variables (`{{firstName}}`)
- [ ] Mobile-responsive preview with live toggle
- [ ] Collaborative editing (CRDT-based)
- [ ] Custom block plugin API with full docs
- [ ] Accessibility audit (WCAG 2.1 AA)

### v0.5 -- Framework Wrappers & Ecosystem
- [ ] Vue wrapper (`@lit-pigeon/vue`)
- [ ] Angular wrapper (`@lit-pigeon/angular`)
- [ ] Svelte wrapper (`@lit-pigeon/svelte`)
- [ ] Server-side rendering API
- [ ] REST API adapter for headless usage
- [ ] Figma-to-email import

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
    react/             # React wrapper via @lit/react
  apps/
    playground/        # Development playground app
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
