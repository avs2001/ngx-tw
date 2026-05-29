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
  selector: 'app-number-input-page',
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
              d="M10 3a.75.75 0 0 1 .55.24l3.25 3.5a.75.75 0 1 1-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 0 1-1.1-1.02l3.25-3.5A.75.75 0 0 1 10 3Zm-3.76 9.2a.75.75 0 0 1 1.06.04l2.7 2.908 2.7-2.908a.75.75 0 1 1 1.1 1.02l-3.25 3.5a.75.75 0 0 1-1.1 0l-3.25-3.5a.75.75 0 0 1 .04-1.06Z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <h1 twItemTitle>Number Input</h1>
        <p twItemDescription>
          Turns a text input into a robust numeric field with spinner buttons, keyboard stepping,
          min/max clamping, and locale-aware formatted display.
        </p>
      </tw-item>

      <nav twTabNav aria-label="Number Input documentation tabs" class="mb-8">
        <a twTabLink routerLink="overview" routerLinkActive #o="routerLinkActive" [active]="o.isActive">Overview</a>
        <a twTabLink routerLink="examples" routerLinkActive #e="routerLinkActive" [active]="e.isActive">Examples</a>
        <a twTabLink routerLink="api" routerLinkActive #a="routerLinkActive" [active]="a.isActive">API</a>
      </nav>

      <router-outlet />
    </div>
  `,
})
export class NumberInputPage {}
