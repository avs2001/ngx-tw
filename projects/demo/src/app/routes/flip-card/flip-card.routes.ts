import type { Routes } from '@angular/router';
import { FlipCardPage } from './flip-card-page.component';

export const FLIP_CARD_ROUTES: Routes = [
  {
    path: '',
    component: FlipCardPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/flip-card-overview.component').then(m => m.FlipCardOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/flip-card-examples.component').then(m => m.FlipCardExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/flip-card-api.component').then(m => m.FlipCardApi),
      },
    ],
  },
];
