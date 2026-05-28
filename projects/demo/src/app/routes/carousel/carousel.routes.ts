import type { Routes } from '@angular/router';
import { CarouselPage } from './carousel-page.component';

export const CAROUSEL_ROUTES: Routes = [
  {
    path: '',
    component: CarouselPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/carousel-overview.component').then((m) => m.CarouselOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/carousel-examples.component').then((m) => m.CarouselExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/carousel-api.component').then((m) => m.CarouselApi),
      },
    ],
  },
];
