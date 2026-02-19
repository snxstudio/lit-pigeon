# Contributing to Lit Pigeon

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Versioning](#versioning)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it. Please report unacceptable behavior to the maintainers.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/lit-pigeon.git
   cd lit-pigeon
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Build all packages:
   ```bash
   pnpm build
   ```
5. Run tests to verify everything works:
   ```bash
   pnpm test
   ```

## Development Setup

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9 (`npm install -g pnpm`)

### Useful Commands

| Command | Description |
|---|---|
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm --filter @lit-pigeon/playground dev` | Start the playground app |
| `pnpm --filter @lit-pigeon/core test` | Run tests for a specific package |

### Running the Playground

The playground app is the best way to see your changes in action:

```bash
pnpm --filter @lit-pigeon/playground dev
```

This starts a Vite dev server with hot reload. The playground aliases source files directly, so changes to any package are reflected immediately.

## Project Structure

```
packages/
  core/           # Document schema, state, commands, history, plugins
  editor/         # Lit Web Components (canvas, palette, properties, toolbar)
  renderer-mjml/  # JSON -> MJML -> HTML conversion
  react/          # React wrapper
apps/
  playground/     # Dev/test playground
```

### Package Dependencies

```
core  <--  editor  <--  react
core  <--  renderer-mjml
core + editor + renderer-mjml  <--  playground
```

Always build `core` first. Turborepo handles this automatically via `pnpm build`.

## Making Changes

### Branch Naming

- `feat/description` -- New features
- `fix/description` -- Bug fixes
- `docs/description` -- Documentation
- `refactor/description` -- Code refactoring
- `test/description` -- Adding or updating tests

### Code Style

- **TypeScript** strict mode everywhere
- **Prettier** for formatting (run `pnpm format`)
- **ESLint** for linting (run `pnpm lint`)
- No unused variables or imports
- Prefer explicit types at function boundaries
- Use `readonly` for immutable data

### Testing

- Write tests for new features and bug fixes
- Tests live in `__tests__/` directories within each package
- We use **Vitest** as the test runner
- Run the full suite before submitting a PR:
  ```bash
  pnpm test
  ```

### Adding a New Block Type

1. Add the interface to `packages/core/src/types/document.ts`
2. Add it to the `ContentBlock` union type
3. Add default values in `packages/core/src/schema/defaults.ts`
4. Register it in `packages/core/src/schema/block-registry.ts`
5. Create a block renderer in `packages/editor/src/components/blocks/`
6. Add it to the switch in `packages/editor/src/components/canvas/pigeon-column.ts`
7. Create a property panel in `packages/editor/src/components/properties/panels/`
8. Add MJML rendering in `packages/renderer-mjml/src/block-renderers/`
9. Add it to `packages/renderer-mjml/src/document-to-mjml.ts`
10. Write tests

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, CI, dependencies |

### Scopes

Use the package name: `core`, `editor`, `renderer-mjml`, `react`, `playground`.

### Examples

```
feat(core): add countdown timer block type
fix(editor): prevent drag ghost from persisting after drop
docs: add Vue usage example to README
chore(ci): add bundle size check to workflow
```

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. All tests pass (`pnpm test`)
3. No lint errors (`pnpm lint`)
4. Add a changeset if your PR changes package behavior (see [Versioning](#versioning))
5. Fill out the PR template
6. Request a review

### PR Size

Keep pull requests focused and small. If a change is large, consider splitting it into multiple PRs:
- One for the core logic
- One for the UI components
- One for tests

## Versioning

We use [Changesets](https://github.com/changesets/changesets) for version management.

### Adding a Changeset

If your PR changes package behavior (features, fixes, breaking changes), add a changeset:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages changed
2. Choose the semver bump type (patch, minor, major)
3. Write a summary of the change

The changeset file is committed with your PR. Maintainers will batch-release versions periodically.

### Semver Guidelines

- **patch** (0.1.x) -- Bug fixes, typos, internal refactors
- **minor** (0.x.0) -- New features, new block types, new API methods
- **major** (x.0.0) -- Breaking changes to public API or document schema

## Reporting Bugs

Use the [Bug Report](../../issues/new?template=bug_report.md) issue template. Please include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable
- Minimal reproduction if possible

## Requesting Features

Use the [Feature Request](../../issues/new?template=feature_request.md) issue template. Please include:

- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered

---

Thank you for helping make Lit Pigeon better!
