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
  selector: 'app-switch-page',
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
            <path fill-rule="evenodd" d="M1 6.75A3.75 3.75 0 014.75 3h10.5a3.75 3.75 0 010 7.5H4.75A3.75 3.75 0 011 6.75zm3.75-1.5a1.5 1.5 0 000 3h10.5a1.5 1.5 0 000-3H4.75zM15.25 9.5a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5zM1 13.25A3.75 3.75 0 014.75 9.5h10.5a3.75 3.75 0 010 7.5H4.75A3.75 3.75 0 011 13.25zm3.75 1.25a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5z" clip-rule="evenodd"/>
          </svg>
        </div>
        <h1 twItemTitle>Switch</h1>
        <p twItemDescription>Accessible two-state toggle for on/off settings with keyboard, ARIA, and form-control support.</p>
      </tw-item>

      <nav twTabNav aria-label="Switch documentation tabs" class="mb-8">
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
export class SwitchPage {}
