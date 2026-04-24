import type { Routes } from '@angular/router';
import { SelectPage } from './select-page.component';

export const SELECT_ROUTES: Routes = [
  {
    path: '',
    component: SelectPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/select-overview.component').then((m) => m.SelectOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/select-examples.component').then((m) => m.SelectExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/select-api.component').then((m) => m.SelectApi),
      },
    ],
  },
];
