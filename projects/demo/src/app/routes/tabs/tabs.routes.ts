import type { Routes } from '@angular/router';
import { TabsPage } from './tabs-page.component';

export const TABS_ROUTES: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/tabs-overview.component').then(m => m.TabsOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/tabs-examples.component').then(m => m.TabsExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/tabs-api.component').then(m => m.TabsApi),
      },
    ],
  },
];
