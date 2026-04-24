import type { Routes } from '@angular/router';
import { ProgressBarPage } from './progress-bar-page.component';

export const PROGRESS_BAR_ROUTES: Routes = [
  {
    path: '',
    component: ProgressBarPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/progress-bar-overview.component').then(m => m.ProgressBarOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/progress-bar-examples.component').then(m => m.ProgressBarExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/progress-bar-api.component').then(m => m.ProgressBarApi),
      },
    ],
  },
];
