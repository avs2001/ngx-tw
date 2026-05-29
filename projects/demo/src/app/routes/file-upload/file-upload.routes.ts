import type { Routes } from '@angular/router';
import { FileUploadPage } from './file-upload-page.component';

export const FILE_UPLOAD_ROUTES: Routes = [
  {
    path: '',
    component: FileUploadPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/file-upload-overview.component').then((m) => m.FileUploadOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/file-upload-examples.component').then((m) => m.FileUploadExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/file-upload-api.component').then((m) => m.FileUploadApi),
      },
    ],
  },
];
