import type { Routes } from '@angular/router';
import { SplitPage } from './split-page.component';

export const SPLIT_ROUTES: Routes = [
  {
    path: '',
    component: SplitPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/split-overview.component').then(m => m.SplitOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/split-examples.component').then(m => m.SplitExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/split-api.component').then(m => m.SplitApi),
      },
    ],
  },
];
