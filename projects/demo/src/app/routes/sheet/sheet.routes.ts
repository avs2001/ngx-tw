import type { Routes } from '@angular/router';
import { SheetPage } from './sheet-page.component';

export const SHEET_ROUTES: Routes = [
  {
    path: '',
    component: SheetPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/sheet-overview.component').then((m) => m.SheetOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/sheet-examples.component').then((m) => m.SheetExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/sheet-api.component').then((m) => m.SheetApi),
      },
    ],
  },
];
