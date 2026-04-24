import type { Routes } from '@angular/router';
import { SortPage } from './sort-page.component';

export const SORT_ROUTES: Routes = [
  {
    path: '',
    component: SortPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/sort-overview.component').then((m) => m.SortOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/sort-examples.component').then((m) => m.SortExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/sort-api.component').then((m) => m.SortApi),
      },
    ],
  },
];
