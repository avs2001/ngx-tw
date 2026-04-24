import type { Routes } from '@angular/router';
import { InputPage } from './input-page.component';

export const INPUT_ROUTES: Routes = [
  {
    path: '',
    component: InputPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/input-overview.component').then(
            (m) => m.InputOverview,
          ),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/input-examples.component').then(
            (m) => m.InputExamples,
          ),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/input-api.component').then((m) => m.InputApi),
      },
    ],
  },
];
