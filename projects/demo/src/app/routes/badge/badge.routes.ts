import type { Routes } from '@angular/router';
import { BadgePage } from './badge-page.component';

export const BADGE_ROUTES: Routes = [
  {
    path: '',
    component: BadgePage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/badge-overview.component').then(m => m.BadgeOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/badge-examples.component').then(m => m.BadgeExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/badge-api.component').then(m => m.BadgeApi),
      },
    ],
  },
];
