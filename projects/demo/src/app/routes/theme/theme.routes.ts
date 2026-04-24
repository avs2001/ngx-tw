import type { Routes } from '@angular/router';
import { ThemePage } from './theme-page.component';

export const THEME_ROUTES: Routes = [
  {
    path: '',
    component: ThemePage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/theme-overview.component').then(m => m.ThemeOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/theme-examples.component').then(m => m.ThemeExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/theme-api.component').then(m => m.ThemeApi),
      },
    ],
  },
];
