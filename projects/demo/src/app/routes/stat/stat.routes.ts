import type { Routes } from '@angular/router';
import { StatPage } from './stat-page.component';

export const STAT_ROUTES: Routes = [
  {
    path: '',
    component: StatPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/stat-overview.component').then((m) => m.StatOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/stat-examples.component').then((m) => m.StatExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/stat-api.component').then((m) => m.StatApi),
      },
    ],
  },
];
