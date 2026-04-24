import type { Routes } from '@angular/router';
import { TimePickerPage } from './time-picker-page.component';

export const TIME_PICKER_ROUTES: Routes = [
  {
    path: '',
    component: TimePickerPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/time-picker-overview.component').then(
            (m) => m.TimePickerOverview,
          ),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/time-picker-examples.component').then(
            (m) => m.TimePickerExamples,
          ),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/time-picker-api.component').then((m) => m.TimePickerApi),
      },
    ],
  },
];
