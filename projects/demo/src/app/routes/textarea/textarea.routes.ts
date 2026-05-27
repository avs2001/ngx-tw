import type { Routes } from '@angular/router';
import { TextareaPage } from './textarea-page.component';

export const TEXTAREA_ROUTES: Routes = [
  {
    path: '',
    component: TextareaPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/textarea-overview.component').then(
            (m) => m.TextareaOverview,
          ),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/textarea-examples.component').then(
            (m) => m.TextareaExamples,
          ),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/textarea-api.component').then((m) => m.TextareaApi),
      },
    ],
  },
];
