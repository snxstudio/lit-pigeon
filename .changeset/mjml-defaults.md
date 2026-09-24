---
'@lit-pigeon/parser-mjml': patch
---

Use MJML 4's own element defaults on import. When an attribute is set neither on the element nor in `<mj-attributes>`, the parser now reads the value MJML would render (for example text `padding: 10px 25px`, `font-size: 13px`, `line-height: 1`; button `#414141`, `3px` radius, `13px`/`normal`, `10px 25px` inner padding; section `padding: 20px 0`; spacer `20px`; divider `4px #000000`; social icon size `20px`; hero `fixed-height`, `top`; navbar without a hamburger), instead of lit-pigeon's editor defaults, so imported templates no longer shift visually. Without an `mj-all` font family the document font is MJML's `Ubuntu, Helvetica, Arial, sans-serif`, and a missing body background stays empty. Documents saved from the editor carry explicit values and are unchanged.
