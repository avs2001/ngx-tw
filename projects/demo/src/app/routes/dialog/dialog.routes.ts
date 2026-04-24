import type { Routes } from '@angular/router';
import { DialogPage } from './dialog-page.component';

export const DIALOG_ROUTES: Routes = [
  {
    path: '',
    component: DialogPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/dialog-overview.component').then((m) => m.DialogOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/dialog-examples.component').then((m) => m.DialogExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/dialog-api.component').then((m) => m.DialogApi),
      },
    ],
  },
];
