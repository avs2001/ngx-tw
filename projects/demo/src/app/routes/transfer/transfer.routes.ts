import type { Routes } from '@angular/router';
import { TransferPage } from './transfer-page.component';

export const TRANSFER_ROUTES: Routes = [
  {
    path: '',
    component: TransferPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/transfer-overview.component').then((m) => m.TransferOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/transfer-examples.component').then((m) => m.TransferExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/transfer-api.component').then((m) => m.TransferApi),
      },
    ],
  },
];
