---
'@lit-pigeon/editor': patch
---

Stop bundling `lit/directives/ref.js` (and with it lit's directive base classes) into the editor. Every `lit`, `lit-html` and `@lit/*` import is now external. The bundled copy was built in lit's production mode, so hosts that load lit's development build (e.g. `ng serve` / `nx serve`) crashed with `currentDirective._$initialize is not a function`.
