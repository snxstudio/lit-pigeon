import type { Routes } from '@angular/router';
import { routes as docRoutes } from './docs-routes';

export const routes: Routes = [
  ...docRoutes,
  { path: 'tabs', loadComponent: () => import('./editor-tabs.component').then((m) => m.EditorTabsComponent) },
  { path: 'echo', loadComponent: () => import('./echo-binding.component').then((m) => m.EchoBindingComponent) },
  { path: '', loadComponent: () => import('./home.component').then((m) => m.HomeComponent) },
];
