import type { Routes } from '@angular/router';
import { DateRangePickerPage } from './date-range-picker-page.component';

export const DATE_RANGE_PICKER_ROUTES: Routes = [
  {
    path: '',
    component: DateRangePickerPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/date-range-picker-overview.component').then(
            (m) => m.DateRangePickerOverview,
          ),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/date-range-picker-examples.component').then(
            (m) => m.DateRangePickerExamples,
          ),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/date-range-picker-api.component').then(
            (m) => m.DateRangePickerApi,
          ),
      },
    ],
  },
];
