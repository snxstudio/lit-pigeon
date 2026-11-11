# @lit-pigeon/mcp-server

## 0.3.0

### Minor Changes

- c9b2881: Let a host choose which blocks the editor offers, with `EditorConfig.blocks`.

  The palette rendered every registered block unconditionally, so an embedder who needed a subset — a platform that cannot host arbitrary markup and must remove the `html` block, a transactional product that wants text, image and button only — had to fork the palette component.

  ```ts
  editor.config = { blocks: ['text', 'image', 'button'] };
  ```

  The list sets both membership and palette order. Unset means every registered block, which is the default, and a listed type nobody registered is skipped.

  The restriction is enforced in the `insertBlock` command rather than by hiding the palette chip, so the keyboard and paste paths are held to it too — a chip is only one of the routes into insertion. `DocumentStore.addBlock` in `@lit-pigeon/mcp-server` mutates the document directly instead of going through commands, so it checks availability itself and throws for an unavailable type.

  Availability gates insertion, not rendering: a document that already contains an omitted type still renders, so narrowing the palette never blanks a saved template.

  Like `locale`, the setting is global to the page — the last editor to apply it wins for every instance.

### Patch Changes

- Updated dependencies [c9b2881]
- Updated dependencies [c532903]
- Updated dependencies [9d63a2a]
- Updated dependencies [e2f6771]
- Updated dependencies [cb51c66]
- Updated dependencies [dbe6173]
- Updated dependencies [33a9939]
- Updated dependencies [ee2d70d]
- Updated dependencies [76d5b0c]
- Updated dependencies [a8b808c]
- Updated dependencies [0cc4966]
- Updated dependencies [11e5465]
- Updated dependencies [6c35111]
- Updated dependencies [519cec3]
- Updated dependencies [e0b4b49]
- Updated dependencies [3448501]
  - @lit-pigeon/core@0.4.0
  - @lit-pigeon/renderer-mjml@0.3.0
  - @lit-pigeon/figma-import@0.1.6

## 0.2.2

### Patch Changes

- 697fc07: Packaging hygiene: every package now ships a `LICENSE` file and a `README` in
  its npm tarball (10 packages previously had no README on the registry), and
  declares `homepage`, `bugs`, `author`, and `keywords`. No API changes. Also
  corrects a stale repo link in the Svelte package README.
- Updated dependencies [697fc07]
  - @lit-pigeon/core@0.3.1
  - @lit-pigeon/renderer-mjml@0.2.2
  - @lit-pigeon/figma-import@0.1.5

## 0.2.1

### Patch Changes

- Updated dependencies [d2cbd91]
  - @lit-pigeon/core@0.3.0
  - @lit-pigeon/figma-import@0.1.4
  - @lit-pigeon/renderer-mjml@0.2.1

## 0.2.0

### Minor Changes

- a44ddbb: Saved / reusable rows (user content library). Save a row to a personal library from the row toolbar and re-insert it from the new Saved palette tab by dragging it onto the canvas. `@lit-pigeon/core` gains the row-library types, an in-memory storage implementation, and a clone helper; `@lit-pigeon/mcp-server` gains a file-system-backed `FsRowLibraryStorage`.

### Patch Changes

- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
  - @lit-pigeon/core@0.2.0
  - @lit-pigeon/renderer-mjml@0.2.0
  - @lit-pigeon/figma-import@0.1.3

## 0.1.2

### Patch Changes

- Verify the automated CI publishing pipeline: this patch release is published
  by the Release workflow using the LIT_PIGEON_NPM_TOKEN secret with npm
  provenance, confirming end-to-end automation.
- Updated dependencies
  - @lit-pigeon/core@0.1.2
  - @lit-pigeon/figma-import@0.1.2
  - @lit-pigeon/renderer-mjml@0.1.2

## 0.1.1

### Patch Changes

- Republish all packages at 0.1.1.

  The initial 0.1.0 release was left unusable: five packages (core, editor,
  angular, parser-mjml, renderer-mjml) were published and then unpublished —
  permanently burning the 0.1.0 version number — which broke the other nine
  packages that depend on `@lit-pigeon/core`. This release republishes all
  packages at a clean, fully-installable 0.1.1 and switches internal
  dependencies to `workspace:^` so they publish as caret ranges.

- Updated dependencies
  - @lit-pigeon/core@0.1.1
  - @lit-pigeon/figma-import@0.1.1
  - @lit-pigeon/renderer-mjml@0.1.1
