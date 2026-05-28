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
  selector: 'app-tab-nav-page',
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
              d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v2.5A2.25 2.25 0 0115.75 9H4.25A2.25 2.25 0 012 6.75v-2.5zM4.25 3.5a.75.75 0 00-.75.75v2.5c0 .414.336.75.75.75h11.5a.75.75 0 00.75-.75v-2.5a.75.75 0 00-.75-.75H4.25z"
              clip-rule="evenodd"
            />
            <path d="M3 12.75A.75.75 0 013.75 12h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zm0 4A.75.75 0 013.75 16h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" />
          </svg>
        </div>
        <h1 twItemTitle>Tab Nav</h1>
        <p twItemDescription>Router-aware tab strip that renders a tabs look and feel on top of anchor elements.</p>
      </tw-item>

      <nav twTabNav aria-label="Tab Nav documentation tabs" class="mb-8">
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
export class TabNavPage {}
