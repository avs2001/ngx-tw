import type { Routes } from '@angular/router';
import { ComboboxPage } from './combobox-page.component';

export const COMBOBOX_ROUTES: Routes = [
  {
    path: '',
    component: ComboboxPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/combobox-overview.component').then((m) => m.ComboboxOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/combobox-examples.component').then((m) => m.ComboboxExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/combobox-api.component').then((m) => m.ComboboxApi),
      },
    ],
  },
];
