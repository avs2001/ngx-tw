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
  selector: 'app-tags-input-page',
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
              d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM6 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <h1 twItemTitle>Tags Input</h1>
        <p twItemDescription>
          Free-text multi-value entry — type tokens that commit to dismissible chips, with full
          keyboard navigation and form integration.
        </p>
      </tw-item>

      <nav twTabNav aria-label="Tags Input documentation tabs" class="mb-8">
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
export class TagsInputPage {}
