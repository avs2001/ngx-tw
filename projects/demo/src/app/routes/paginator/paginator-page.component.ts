import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TabNavComponent, TabLinkDirective } from 'ngx-tw/tab-nav';
import {
  ItemComponent,
  ItemLeadingDirective,
  ItemTitleDirective,
  ItemDescriptionDirective,
} from 'ngx-tw/item';

@Component({
  selector: 'app-paginator-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TabNavComponent,
    TabLinkDirective,
    ItemComponent,
    ItemLeadingDirective,
    ItemTitleDirective,
    ItemDescriptionDirective,
  ],
  template: `
    <div class="mx-auto max-w-4xl px-6 py-12">
      <tw-item size="lg" class="mb-8">
        <div
          twItemLeading
          class="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600"
        >
          <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <h1 twItemTitle>Paginator</h1>
        <p twItemDescription>Navigates large item sets with basic or numbered rendering, ellipsis collapsing, a page-size selector, and container-query responsiveness.</p>
      </tw-item>

      <nav twTabNav aria-label="Paginator documentation tabs" class="mb-8">
        <a
          twTabLink
          routerLink="overview"
          routerLinkActive
          #overviewActive="routerLinkActive"
          [active]="overviewActive.isActive"
        >
          Overview
        </a>
        <a
          twTabLink
          routerLink="examples"
          routerLinkActive
          #examplesActive="routerLinkActive"
          [active]="examplesActive.isActive"
        >
          Examples
        </a>
        <a
          twTabLink
          routerLink="api"
          routerLinkActive
          #apiActive="routerLinkActive"
          [active]="apiActive.isActive"
        >
          API
        </a>
      </nav>

      <router-outlet />
    </div>
  `,
})
export class PaginatorPage {}
