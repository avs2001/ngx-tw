import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TabNavComponent, TabLinkDirective } from '@cdevhub/ngx-tw/tab-nav';
import {
  ItemComponent,
  ItemLeadingDirective,
  ItemTitleDirective,
  ItemDescriptionDirective,
} from '@cdevhub/ngx-tw/item';

@Component({
  selector: 'app-stat-page',
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
            <path
              fill-rule="evenodd"
              d="M2 10a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-2.5A.75.75 0 0 1 2 15.5V10Zm6-5a.75.75 0 0 1 .75-.75h2.5A.75.75 0 0 1 12 5v10.5a.75.75 0 0 1-.75.75h-2.5A.75.75 0 0 1 8 15.5V5Zm6 3a.75.75 0 0 1 .75-.75h2.5A.75.75 0 0 1 18 8v7.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1-.75-.75V8Z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <h1 twItemTitle>Stat</h1>
        <p twItemDescription>
          KPI tile with a dominant value, optional label, description, and a trend delta indicator
          for dashboards and reporting surfaces.
        </p>
      </tw-item>

      <nav twTabNav aria-label="Stat documentation tabs" class="mb-8">
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
export class StatPage {}
