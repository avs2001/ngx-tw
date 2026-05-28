import type { Routes } from '@angular/router';
import { EmptyStatePage } from './empty-state-page.component';

export const EMPTY_STATE_ROUTES: Routes = [
  {
    path: '',
    component: EmptyStatePage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/empty-state-overview.component').then((m) => m.EmptyStateOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/empty-state-examples.component').then((m) => m.EmptyStateExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/empty-state-api.component').then((m) => m.EmptyStateApi),
      },
    ],
  },
];
