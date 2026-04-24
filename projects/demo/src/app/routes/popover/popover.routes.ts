import type { Routes } from '@angular/router';
import { PopoverPage } from './popover-page.component';

export const POPOVER_ROUTES: Routes = [
  {
    path: '',
    component: PopoverPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/popover-overview.component').then(m => m.PopoverOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/popover-examples.component').then(m => m.PopoverExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/popover-api.component').then(m => m.PopoverApi),
      },
    ],
  },
];
