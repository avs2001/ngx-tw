import type { Routes } from '@angular/router';

export const RHYTHM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./rhythm-page').then(m => m.RhythmPage),
  },
];
