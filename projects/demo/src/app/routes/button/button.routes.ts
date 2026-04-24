import type { Routes } from '@angular/router';
import { ButtonPage } from './button-page.component';

export const BUTTON_ROUTES: Routes = [
  {
    path: '',
    component: ButtonPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/button-overview.component').then(m => m.ButtonOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/button-examples.component').then(m => m.ButtonExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/button-api.component').then(m => m.ButtonApi),
      },
    ],
  },
];
