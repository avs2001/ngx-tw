import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'themes',
    loadComponent: () => import('./themes/themes').then(m => m.ThemesPage),
  },
  {
    path: '',
    redirectTo: 'themes',
    pathMatch: 'full',
  },
];
