import type { Routes } from '@angular/router';
import { AccordionPage } from './accordion-page.component';

export const ACCORDION_ROUTES: Routes = [
  {
    path: '',
    component: AccordionPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/accordion-overview.component').then(m => m.AccordionOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/accordion-examples.component').then(m => m.AccordionExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/accordion-api.component').then(m => m.AccordionApi),
      },
    ],
  },
];
