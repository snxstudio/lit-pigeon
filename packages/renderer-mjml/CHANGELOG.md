# @lit-pigeon/renderer-mjml

## 0.2.0

### Minor Changes

- a44ddbb: Custom font management. Register web fonts via `fontConfig`: the editor's font picker lists configured and brand fonts, the preview and export load them, and the MJML renderer emits `<mj-font>` for each registered font. `@lit-pigeon/core` adds the `FontDefinition` type and `fontConfig` / `RenderOptions.fonts`.

### Patch Changes

- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
- Updated dependencies [a44ddbb]
  - @lit-pigeon/core@0.2.0

## 0.1.2

### Patch Changes

- Verify the automated CI publishing pipeline: this patch release is published
  by the Release workflow using the LIT_PIGEON_NPM_TOKEN secret with npm
  provenance, confirming end-to-end automation.
- Updated dependencies
  - @lit-pigeon/core@0.1.2

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
