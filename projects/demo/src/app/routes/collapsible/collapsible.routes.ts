import type { Routes } from '@angular/router';
import { CollapsiblePage } from './collapsible-page.component';

export const COLLAPSIBLE_ROUTES: Routes = [
  {
    path: '',
    component: CollapsiblePage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/collapsible-overview.component').then(m => m.CollapsibleOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/collapsible-examples.component').then(m => m.CollapsibleExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/collapsible-api.component').then(m => m.CollapsibleApi),
      },
    ],
  },
];
