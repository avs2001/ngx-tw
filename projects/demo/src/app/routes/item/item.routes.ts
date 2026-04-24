import type { Routes } from '@angular/router';
import { ItemPage } from './item-page.component';

export const ITEM_ROUTES: Routes = [
  {
    path: '',
    component: ItemPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/item-overview.component').then(m => m.ItemOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/item-examples.component').then(m => m.ItemExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/item-api.component').then(m => m.ItemApi),
      },
    ],
  },
];
