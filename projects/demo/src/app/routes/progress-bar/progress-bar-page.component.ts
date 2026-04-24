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
  selector: 'app-progress-bar-page',
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
          <svg
            class="size-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="2" y="7" width="16" height="6" rx="3" opacity="0.3" />
            <rect x="2" y="7" width="9" height="6" rx="3" />
          </svg>
        </div>
        <h1 twItemTitle>Progress Bar</h1>
        <p twItemDescription>Visualises measurable task progress as a determinate, indeterminate, or segmented bar.</p>
      </tw-item>

      <nav twTabNav aria-label="Progress Bar documentation tabs" class="mb-8">
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
export class ProgressBarPage {}
