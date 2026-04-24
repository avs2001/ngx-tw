import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-code-block-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="mx-auto max-w-4xl px-6 py-12">
      <div class="flex items-start gap-3 mb-8">
        <div class="flex items-center justify-center size-10 rounded-lg bg-primary-50 text-primary-600 shrink-0 mt-0.5">
          <svg class="size-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M6.28 5.22a.75.75 0 010 1.06L2.56 10l3.72 3.72a.75.75 0 01-1.06 1.06L.97 10.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0zm7.44 0a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L17.44 10l-3.72-3.72a.75.75 0 010-1.06zM11.377 2.011a.75.75 0 01.612.867l-2.5 14.5a.75.75 0 01-1.478-.255l2.5-14.5a.75.75 0 01.866-.612z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-fg">Code Block</h1>
          <p class="text-sm text-fg-muted mt-0.5">A preformatted code display with built-in copy-to-clipboard.</p>
        </div>
      </div>

      <nav class="flex border-b border-border-muted mb-8" aria-label="Code Block documentation tabs">
        <a routerLink="overview" routerLinkActive="!border-primary-500 !text-primary-600"
           class="px-4 py-2 text-sm font-medium -mb-px border-b-2 border-transparent text-fg-muted hover:text-fg transition-colors duration-200">
          Overview
        </a>
        <a routerLink="examples" routerLinkActive="!border-primary-500 !text-primary-600"
           class="px-4 py-2 text-sm font-medium -mb-px border-b-2 border-transparent text-fg-muted hover:text-fg transition-colors duration-200">
          Examples
        </a>
        <a routerLink="api" routerLinkActive="!border-primary-500 !text-primary-600"
           class="px-4 py-2 text-sm font-medium -mb-px border-b-2 border-transparent text-fg-muted hover:text-fg transition-colors duration-200">
          API
        </a>
      </nav>

      <router-outlet />
    </div>
  `,
})
export class CodeBlockPage {}
