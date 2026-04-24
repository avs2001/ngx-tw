import type { Routes } from '@angular/router';
import { StepperPage } from './stepper-page.component';

export const STEPPER_ROUTES: Routes = [
  {
    path: '',
    component: StepperPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/stepper-overview.component').then(
            (m) => m.StepperOverview,
          ),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/stepper-examples.component').then(
            (m) => m.StepperExamples,
          ),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/stepper-api.component').then((m) => m.StepperApi),
      },
    ],
  },
];
