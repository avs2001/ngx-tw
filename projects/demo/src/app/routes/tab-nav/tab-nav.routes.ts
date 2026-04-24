import type { Routes } from '@angular/router';
import { TabNavPage } from './tab-nav-page.component';

export const TAB_NAV_ROUTES: Routes = [
  {
    path: '',
    component: TabNavPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/tab-nav-overview.component').then(m => m.TabNavOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/tab-nav-examples.component').then(m => m.TabNavExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/tab-nav-api.component').then(m => m.TabNavApi),
      },
    ],
  },
];
