import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'templates/:templateId/edit',
    // Lazy-loading keeps the editor, Lit, TipTap and mjml-browser out of the initial bundle.
    loadComponent: () => import('./template-editor.component').then((m) => m.TemplateEditorComponent),
  },
];
