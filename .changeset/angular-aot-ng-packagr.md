---
'@lit-pigeon/angular': patch
---

Build the Angular wrapper with ng-packagr (partial Ivy compilation, Angular Package Format) instead of plain Vite. The previous output had no Ivy metadata, so `PigeonEditorComponent` failed at runtime in AOT production builds. The peer range is now `@angular/core` >= 22, which is what the partial output from the Angular 22 compiler supports.
