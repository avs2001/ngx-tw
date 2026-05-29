import type { Routes } from '@angular/router';
import { TagsInputPage } from './tags-input-page.component';

export const TAGS_INPUT_ROUTES: Routes = [
  {
    path: '',
    component: TagsInputPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/tags-input-overview.component').then((m) => m.TagsInputOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/tags-input-examples.component').then((m) => m.TagsInputExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/tags-input-api.component').then((m) => m.TagsInputApi),
      },
    ],
  },
];
