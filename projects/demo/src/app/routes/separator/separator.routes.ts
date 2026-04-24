import type { Routes } from '@angular/router';
import { SeparatorPage } from './separator-page.component';

export const SEPARATOR_ROUTES: Routes = [
  {
    path: '',
    component: SeparatorPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/separator-overview.component').then(m => m.SeparatorOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/separator-examples.component').then(m => m.SeparatorExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/separator-api.component').then(m => m.SeparatorApi),
      },
    ],
  },
];
