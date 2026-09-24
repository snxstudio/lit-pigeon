# @lit-pigeon/import-unlayer

## 0.2.1

### Patch Changes

- Updated dependencies [c532903]
- Updated dependencies [e2f6771]
- Updated dependencies [cb51c66]
- Updated dependencies [6c35111]
- Updated dependencies [519cec3]
  - @lit-pigeon/core@0.4.0

## 0.2.0

### Minor Changes

- 3f2a47c: Add `@lit-pigeon/import-unlayer` — converts an Unlayer design JSON export into a `PigeonDocument`, so existing Unlayer templates can be migrated instead of rebuilt.

  Covers text, heading, image, button, divider, html, menu and social blocks, plus row/column structure, relative column widths and body-level styling. Import is best-effort and never throws: anything without a Pigeon equivalent is dropped and reported through typed `warnings`.

### Patch Changes

- Updated dependencies [14c1b54]
  - @lit-pigeon/core@0.3.3
