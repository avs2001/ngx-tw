import type { Routes } from '@angular/router';
import { DatePickerPage } from './date-picker-page.component';

export const DATE_PICKER_ROUTES: Routes = [
  {
    path: '',
    component: DatePickerPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/date-picker-overview.component').then(
            (m) => m.DatePickerOverview,
          ),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/date-picker-examples.component').then(
            (m) => m.DatePickerExamples,
          ),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/date-picker-api.component').then((m) => m.DatePickerApi),
      },
    ],
  },
];
