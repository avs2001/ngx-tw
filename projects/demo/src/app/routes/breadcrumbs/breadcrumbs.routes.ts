import type { Routes } from '@angular/router';
import { BreadcrumbsPage } from './breadcrumbs-page.component';

export const BREADCRUMBS_ROUTES: Routes = [
  {
    path: '',
    component: BreadcrumbsPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/breadcrumbs-overview.component').then(m => m.BreadcrumbsOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/breadcrumbs-examples.component').then(m => m.BreadcrumbsExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/breadcrumbs-api.component').then(m => m.BreadcrumbsApi),
      },
    ],
  },
];
