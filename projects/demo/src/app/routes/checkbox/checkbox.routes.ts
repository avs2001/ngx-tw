import type { Routes } from '@angular/router';
import { CheckboxPage } from './checkbox-page.component';

export const CHECKBOX_ROUTES: Routes = [
  {
    path: '',
    component: CheckboxPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/checkbox-overview.component').then(m => m.CheckboxOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/checkbox-examples.component').then(m => m.CheckboxExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/checkbox-api.component').then(m => m.CheckboxApi),
      },
    ],
  },
];
