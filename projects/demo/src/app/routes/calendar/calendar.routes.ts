import type { Routes } from '@angular/router';
import { CalendarPage } from './calendar-page.component';

export const CALENDAR_ROUTES: Routes = [
  {
    path: '',
    component: CalendarPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/calendar-overview.component').then((m) => m.CalendarOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/calendar-examples.component').then((m) => m.CalendarExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/calendar-api.component').then((m) => m.CalendarApi),
      },
    ],
  },
];
