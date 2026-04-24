import type { Routes } from '@angular/router';
import { TablePage } from './table-page.component';

export const TABLE_ROUTES: Routes = [
  {
    path: '',
    component: TablePage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/table-overview.component').then(
            (m) => m.TableOverview,
          ),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/table-examples.component').then(
            (m) => m.TableExamples,
          ),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/table-api.component').then((m) => m.TableApi),
      },
    ],
  },
];
