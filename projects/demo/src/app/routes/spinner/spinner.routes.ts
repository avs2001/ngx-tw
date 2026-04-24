import type { Routes } from '@angular/router';
import { SpinnerPage } from './spinner-page.component';

export const SPINNER_ROUTES: Routes = [
  {
    path: '',
    component: SpinnerPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/spinner-overview.component').then(m => m.SpinnerOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/spinner-examples.component').then(m => m.SpinnerExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/spinner-api.component').then(m => m.SpinnerApi),
      },
    ],
  },
];
