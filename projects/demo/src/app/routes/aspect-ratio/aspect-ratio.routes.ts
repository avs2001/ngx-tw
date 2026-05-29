import type { Routes } from '@angular/router';
import { AspectRatioPage } from './aspect-ratio-page.component';

export const ASPECT_RATIO_ROUTES: Routes = [
  {
    path: '',
    component: AspectRatioPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/aspect-ratio-overview.component').then((m) => m.AspectRatioOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/aspect-ratio-examples.component').then((m) => m.AspectRatioExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/aspect-ratio-api.component').then((m) => m.AspectRatioApi),
      },
    ],
  },
];
