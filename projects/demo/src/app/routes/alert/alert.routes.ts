import type { Routes } from '@angular/router';
import { AlertPage } from './alert-page.component';

export const ALERT_ROUTES: Routes = [
  {
    path: '',
    component: AlertPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/alert-overview.component').then(m => m.AlertOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/alert-examples.component').then(m => m.AlertExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/alert-api.component').then(m => m.AlertApi),
      },
    ],
  },
];
