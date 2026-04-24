import type { Routes } from '@angular/router';
import { SliderPage } from './slider-page.component';

export const SLIDER_ROUTES: Routes = [
  {
    path: '',
    component: SliderPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/slider-overview.component').then((m) => m.SliderOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/slider-examples.component').then((m) => m.SliderExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/slider-api.component').then((m) => m.SliderApi),
      },
    ],
  },
];
