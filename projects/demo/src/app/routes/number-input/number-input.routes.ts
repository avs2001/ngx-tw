import type { Routes } from '@angular/router';
import { NumberInputPage } from './number-input-page.component';

export const NUMBER_INPUT_ROUTES: Routes = [
  {
    path: '',
    component: NumberInputPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/number-input-overview.component').then(
            (m) => m.NumberInputOverview,
          ),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/number-input-examples.component').then(
            (m) => m.NumberInputExamples,
          ),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/number-input-api.component').then(
            (m) => m.NumberInputApi,
          ),
      },
    ],
  },
];
