import type { Routes } from '@angular/router';
import { AvatarPage } from './avatar-page.component';

export const AVATAR_ROUTES: Routes = [
  {
    path: '',
    component: AvatarPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/avatar-overview.component').then(m => m.AvatarOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/avatar-examples.component').then(m => m.AvatarExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/avatar-api.component').then(m => m.AvatarApi),
      },
    ],
  },
];
