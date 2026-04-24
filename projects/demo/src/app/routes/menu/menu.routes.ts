import type { Routes } from '@angular/router';
import { MenuPage } from './menu-page.component';

export const MENU_ROUTES: Routes = [
  {
    path: '',
    component: MenuPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/menu-overview.component').then(m => m.MenuOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/menu-examples.component').then(m => m.MenuExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/menu-api.component').then(m => m.MenuApi),
      },
    ],
  },
];
