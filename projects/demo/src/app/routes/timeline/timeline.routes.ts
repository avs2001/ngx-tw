import type { Routes } from '@angular/router';
import { TimelinePage } from './timeline-page.component';

export const TIMELINE_ROUTES: Routes = [
  {
    path: '',
    component: TimelinePage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/timeline-overview.component').then((m) => m.TimelineOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/timeline-examples.component').then((m) => m.TimelineExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/timeline-api.component').then((m) => m.TimelineApi),
      },
    ],
  },
];
