import type { Routes } from '@angular/router';
import { CommandPalettePage } from './command-palette-page.component';

export const COMMAND_PALETTE_ROUTES: Routes = [
  {
    path: '',
    component: CommandPalettePage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/command-palette-overview.component').then((m) => m.CommandPaletteOverview),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./examples/command-palette-examples.component').then((m) => m.CommandPaletteExamples),
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./api/command-palette-api.component').then((m) => m.CommandPaletteApi),
      },
    ],
  },
];
