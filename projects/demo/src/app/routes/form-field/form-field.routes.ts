import type { Routes } from '@angular/router';
import { FormFieldPage } from './form-field-page.component';

export const FORM_FIELD_ROUTES: Routes = [
  {
    path: '',
    component: FormFieldPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/form-field-overview.component').then(
            (m) => m.FormFieldOverview,
          ),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/form-field-examples.component').then(
            (m) => m.FormFieldExamples,
          ),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/form-field-api.component').then((m) => m.FormFieldApi),
      },
    ],
  },
];
