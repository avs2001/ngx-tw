import type { Routes } from '@angular/router';
import { RadioPage } from './radio-page.component';

export const RADIO_ROUTES: Routes = [
  {
    path: '',
    component: RadioPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/radio-overview.component').then(m => m.RadioOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/radio-examples.component').then(m => m.RadioExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/radio-api.component').then(m => m.RadioApi),
      },
    ],
  },
];
