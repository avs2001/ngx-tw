import type { Routes } from '@angular/router';
import { ToastPage } from './toast-page.component';

export const TOAST_ROUTES: Routes = [
  {
    path: '',
    component: ToastPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/toast-overview.component').then((m) => m.ToastOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/toast-examples.component').then((m) => m.ToastExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/toast-api.component').then((m) => m.ToastApi),
      },
    ],
  },
];
