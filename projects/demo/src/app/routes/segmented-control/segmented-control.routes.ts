import type { Routes } from '@angular/router';
import { SegmentedControlPage } from './segmented-control-page.component';

export const SEGMENTED_CONTROL_ROUTES: Routes = [
  {
    path: '',
    component: SegmentedControlPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/segmented-control-overview.component').then(m => m.SegmentedControlOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/segmented-control-examples.component').then(m => m.SegmentedControlExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/segmented-control-api.component').then(m => m.SegmentedControlApi),
      },
    ],
  },
];
