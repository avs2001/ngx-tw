import type { Routes } from '@angular/router';
import { SkeletonPage } from './skeleton-page.component';

export const SKELETON_ROUTES: Routes = [
  {
    path: '',
    component: SkeletonPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/skeleton-overview.component').then(m => m.SkeletonOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/skeleton-examples.component').then(m => m.SkeletonExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/skeleton-api.component').then(m => m.SkeletonApi),
      },
    ],
  },
];
