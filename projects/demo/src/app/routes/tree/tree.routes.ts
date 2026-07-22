import type { Routes } from '@angular/router';
import { TreePage } from './tree-page.component';

export const TREE_ROUTES: Routes = [
  {
    path: '',
    component: TreePage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/tree-overview.component').then((m) => m.TreeOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/tree-examples.component').then((m) => m.TreeExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/tree-api.component').then((m) => m.TreeApi),
      },
    ],
  },
];
