import type { Routes } from '@angular/router';
import { CodeBlockPage } from './code-block-page.component';

export const CODE_BLOCK_ROUTES: Routes = [
  {
    path: '',
    component: CodeBlockPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/code-block-overview.component').then(m => m.CodeBlockOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/code-block-examples.component').then(m => m.CodeBlockExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/code-block-api.component').then(m => m.CodeBlockApi),
      },
    ],
  },
];
