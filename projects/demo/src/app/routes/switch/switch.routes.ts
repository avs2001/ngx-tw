import type { Routes } from '@angular/router';
import { SwitchPage } from './switch-page.component';

export const SWITCH_ROUTES: Routes = [
  {
    path: '',
    component: SwitchPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/switch-overview.component').then(m => m.SwitchOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/switch-examples.component').then(m => m.SwitchExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/switch-api.component').then(m => m.SwitchApi),
      },
    ],
  },
];
