import type { Routes } from '@angular/router';
import { CardPage } from './card-page.component';

export const CARD_ROUTES: Routes = [
  {
    path: '',
    component: CardPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/card-overview.component').then(m => m.CardOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/card-examples.component').then(m => m.CardExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/card-api.component').then(m => m.CardApi),
      },
    ],
  },
];
