# @lit-pigeon/parser-mjml

## 0.1.7

### Patch Changes

- 0e0fb9b: Re-escape text and attribute values captured from `mj-text`, `mj-button` and `mj-raw`. The parser decodes entities, so `&lt;b&gt;` used to come back as a real `<b>` tag and `style='font-family:"Open Sans"'` was written back as a broken attribute. `<style>`/`<script>` text and plain-text labels (preview, social, navbar) are left as they were.
- 14c1b54: Head styling now survives an MJML import and save:

  - `<mj-attributes>` defaults (`mj-all`, per-tag such as `<mj-text color>`, and `mj-class`) are resolved onto each element with MJML's precedence (element attribute > mj-class > tag > mj-all) before block values are read.
  - mj-text colour, font size and font family, which text blocks have no fields for, are kept as an inline `<span style>` in the content (inside block elements such as `<p>`), the same shape the rich-text editor writes. Values the renderer already produces are not repeated, so importing a saved template again does not add spans.
  - Non-inline `<mj-style>` CSS is kept on the new optional `body.attributes.css` and written back as `<mj-style>`, with `</mj-style` escaped.
  - `css-class` is kept on sections, columns, text, buttons and images through the new optional `cssClass` fields, and written back out. On other elements it is dropped with a parse warning.
  - `<mj-wrapper>` now reports a parse warning that its padding and background colour were dropped.

- b98dc21: mj-hero keeps its button and text styling on import. Each mj-text becomes its own block, so separate texts no longer run together. Colour, font size and font family go in the same inline span as other text, and alignment, weight, line height and padding go on a wrapping `<div>`. Each mj-button becomes the button table MJML renders, keeping its link, colours, font and padding, where previously only the label text survived. A lone mj-text (the shape the renderer writes) is read back unchanged, with its padding as the hero's inner padding, so saved templates import again unchanged. Other hero children are reported with a parse warning instead of being dropped silently.
- 9c91ba2: `<mj-table>` is no longer dropped as an unknown element. It is imported as an html block holding the `<table>` mjml2html would render, with MJML's defaults applied for any missing width, cellpadding, cellspacing, border, color, font-family, font-size, line-height, align and padding.
- 8dbafef: mj-navbar `base-url` is now applied to the link hrefs on import, as MJML does. Previously it was ignored, so relative links such as `/tracking` were saved without their domain.
- 8e38c87: HTML comments inside mj-raw, mj-text, mj-button and the other raw tags are now kept on import. Previously they were dropped, which silently removed Outlook `<!--[if mso]>` conditional blocks.
- b94d78c: Void elements (`<br>`, `<img>`, `<hr>` and the rest) inside mj-text, mj-raw and other raw tags are no longer re-emitted with a closing tag. Previously `<br/>` became `<br></br>`, which browsers render as two line breaks.
- Updated dependencies [14c1b54]
  - @lit-pigeon/core@0.3.3

## 0.1.6

### Patch Changes

- fc043b1: Put the `types` condition first in `exports` — per the Node/TypeScript
  resolution spec it must precede `import`/`require`, otherwise it can never
  match. Types still resolved via the top-level `types` fallback, but this
  removes the bundler warning and makes conditional type resolution correct.
- Updated dependencies [fc043b1]
  - @lit-pigeon/core@0.3.2

## 0.1.5

### Patch Changes

- 697fc07: Packaging hygiene: every package now ships a `LICENSE` file and a `README` in
  its npm tarball (10 packages previously had no README on the registry), and
  declares `homepage`, `bugs`, `author`, and `keywords`. No API changes. Also
  corrects a stale repo link in the Svelte package README.
- Updated dependencies [697fc07]
  - @lit-pigeon/core@0.3.1

## 0.1.4

### Patch Changes

- Updated dependencies [d2cbd91]
  - @lit-pigeon/core@0.3.0

## 0.1.3

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
