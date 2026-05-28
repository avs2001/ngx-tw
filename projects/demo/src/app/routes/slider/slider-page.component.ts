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
  selector: 'app-slider-page',
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
              d="M3 10a1 1 0 011-1h4.2a2.5 2.5 0 014.6 0H16a1 1 0 110 2h-4.2a2.5 2.5 0 01-4.6 0H4a1 1 0 01-1-1zm6.5-.5a.5.5 0 100 1 .5.5 0 000-1z"
              clip-rule="evenodd"
            />
            <path
              fill-rule="evenodd"
              d="M3 5a1 1 0 011-1h.2a2.5 2.5 0 014.6 0H16a1 1 0 110 2H8.8a2.5 2.5 0 01-4.6 0H4a1 1 0 01-1-1z"
              clip-rule="evenodd"
              opacity="0.45"
            />
            <path
              fill-rule="evenodd"
              d="M3 15a1 1 0 011-1h8.2a2.5 2.5 0 014.6 0H16a1 1 0 110 2h-.2a2.5 2.5 0 01-4.6 0H4a1 1 0 01-1-1z"
              clip-rule="evenodd"
              opacity="0.45"
            />
          </svg>
        </div>
        <h1 twItemTitle>Slider</h1>
        <p twItemDescription>Select a numeric value or a contiguous range from a scale with pointer, keyboard, and form support.</p>
      </tw-item>

      <nav twTabNav aria-label="Slider documentation tabs" class="mb-8">
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
export class SliderPage {}
