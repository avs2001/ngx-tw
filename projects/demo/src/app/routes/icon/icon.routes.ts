import type { Routes } from '@angular/router';
import { IconPage } from './icon-page.component';

export const ICON_ROUTES: Routes = [
  {
    path: '',
    component: IconPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/icon-overview.component').then(m => m.IconOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/icon-examples.component').then(m => m.IconExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/icon-api.component').then(m => m.IconApi),
      },
    ],
  },
];
