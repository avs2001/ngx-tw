import type { Routes } from '@angular/router';
import { PaginatorPage } from './paginator-page.component';

export const PAGINATOR_ROUTES: Routes = [
  {
    path: '',
    component: PaginatorPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/paginator-overview.component').then(
            (m) => m.PaginatorOverview,
          ),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/paginator-examples.component').then(
            (m) => m.PaginatorExamples,
          ),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/paginator-api.component').then((m) => m.PaginatorApi),
      },
    ],
  },
];
