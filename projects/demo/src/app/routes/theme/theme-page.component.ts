import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-theme-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="mx-auto max-w-4xl px-6 py-12">
      <div class="flex items-start gap-3 mb-8">
        <div class="flex items-center justify-center size-10 rounded-lg bg-primary-50 text-primary-600 shrink-0 mt-0.5">
          <svg class="size-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-fg">Theme</h1>
          <p class="text-sm text-fg-muted mt-0.5">Manage light, dark, and high-contrast modes with system preference detection.</p>
        </div>
      </div>

      <nav class="flex border-b border-border-muted mb-8" aria-label="Theme documentation tabs">
        <a routerLink="overview" routerLinkActive="!border-primary-500 !text-primary-600"
           class="px-4 py-2 text-sm font-medium -mb-px border-b-2 border-transparent text-fg-muted hover:text-fg transition-colors duration-normal">
          Overview
        </a>
        <a routerLink="examples" routerLinkActive="!border-primary-500 !text-primary-600"
           class="px-4 py-2 text-sm font-medium -mb-px border-b-2 border-transparent text-fg-muted hover:text-fg transition-colors duration-normal">
          Examples
        </a>
        <a routerLink="api" routerLinkActive="!border-primary-500 !text-primary-600"
           class="px-4 py-2 text-sm font-medium -mb-px border-b-2 border-transparent text-fg-muted hover:text-fg transition-colors duration-normal">
          API
        </a>
      </nav>

      <router-outlet />
    </div>
  `,
})
export class ThemePage {}
