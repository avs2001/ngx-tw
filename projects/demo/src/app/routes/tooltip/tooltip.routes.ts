import type { Routes } from '@angular/router';
import { TooltipPage } from './tooltip-page.component';

export const TOOLTIP_ROUTES: Routes = [
  {
    path: '',
    component: TooltipPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/tooltip-overview.component').then(m => m.TooltipOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/tooltip-examples.component').then(m => m.TooltipExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/tooltip-api.component').then(m => m.TooltipApi),
      },
    ],
  },
];
