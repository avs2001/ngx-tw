import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BreadcrumbsComponent,
  BreadcrumbsItemTemplateDirective,
  BreadcrumbsLinkDirective,
  BreadcrumbsSeparatorTemplateDirective,
  type TwBreadcrumbsItem,
} from '@cdevhub/ngx-tw/breadcrumbs';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import { IconComponent } from '@cdevhub/ngx-tw/icon';
import type { TwSize } from '@cdevhub/ngx-tw/core';

const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

interface RouterCmd {
  routerLink: string;
}

@Component({
  selector: 'app-breadcrumbs-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BreadcrumbsComponent,
    BreadcrumbsItemTemplateDirective,
    BreadcrumbsLinkDirective,
    BreadcrumbsSeparatorTemplateDirective,
    CodeBlockComponent,
    IconComponent,
    RouterLink,
  ],
  template: `
    <!-- Basic trail -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic 3-level trail</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The default render needs nothing beyond an items array. Anchors emit on the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">href</code>
        you provide; the last entry stays a plain
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;span&gt;</code>
        marked
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="page"</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-breadcrumbs [items]="basicItems" ariaLabel="Basic example" />
      </div>
      <tw-code-block [code]="basicSnippet" language="html" />
    </section>

    <!-- Custom separator (icon name) -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom separator (icon name)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Swap the chevron for any registered icon via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">separator</code>
        input. Below uses
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">"slash"</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-breadcrumbs [items]="basicItems" separator="slash" ariaLabel="Custom icon separator example" />
      </div>
      <tw-code-block [code]="separatorIconSnippet" language="html" />
    </section>

    <!-- Custom separator (template) -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom separator (template)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For any non-icon separator (a slash character, a dot, a different glyph), project a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twBreadcrumbsSeparator</code>
        template.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-breadcrumbs [items]="basicItems" ariaLabel="Custom template separator example">
          <ng-template twBreadcrumbsSeparator>
            <span class="text-fg-subtle">/</span>
          </ng-template>
        </tw-breadcrumbs>
      </div>
      <tw-code-block [code]="separatorTemplateSnippet" language="html" />
    </section>

    <!-- Overflow / truncation -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Truncation with overflow menu</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxItems</code>
        to cap the visible hops. The first item and the current page stay visible; the middle
        items collapse behind an ellipsis button that opens an
        <a routerLink="/components/menu" class="text-primary-600 hover:underline">overflow menu</a>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">maxItems = 3</p>
          <tw-breadcrumbs [items]="longTrail" [maxItems]="3" ariaLabel="Truncated (maxItems=3) example" />
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">maxItems = 1 (clamps to 2)</p>
          <tw-breadcrumbs [items]="longTrail" [maxItems]="1" ariaLabel="Truncated (maxItems=1) example" />
        </div>
      </div>
      <tw-code-block [code]="overflowSnippet" language="html" />
    </section>

    <!-- Router integration -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Angular Router integration</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project a custom item template and bind
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">routerLink</code>
        on your own anchor. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twBreadcrumbsLink</code>
        directive pulls the component's link styling so your anchor looks identical to the default
        render.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-breadcrumbs [items]="routerItems" ariaLabel="Router integration example">
          <ng-template twBreadcrumbsItem let-item let-isCurrent="isCurrent">
            @if (isCurrent) {
              <span twBreadcrumbsLink [current]="true">{{ item.label }}</span>
            } @else if (toRouter(item.data); as cmd) {
              <a twBreadcrumbsLink [routerLink]="cmd.routerLink">{{ item.label }}</a>
            } @else if (item.href) {
              <a twBreadcrumbsLink [href]="item.href">{{ item.label }}</a>
            } @else {
              <span twBreadcrumbsLink>{{ item.label }}</span>
            }
          </ng-template>
        </tw-breadcrumbs>
      </div>
      <tw-code-block [code]="routerSnippet" language="html" />
    </section>

    <!-- RTL -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">RTL (right-to-left)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Wrap any region in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dir="rtl"</code>
        and the default chevron flips automatically. The flex order also reverses, so the trail
        reads naturally from right to left.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4" dir="rtl">
        <tw-breadcrumbs [items]="basicItems" ariaLabel="مسار التنقل" />
      </div>
      <tw-code-block [code]="rtlSnippet" language="html" />
    </section>

    <!-- Leading icon via custom template -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Leading icon via custom template</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The first hop is often a "home" icon. Render any glyph next to the label by projecting a
        template.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-breadcrumbs [items]="iconItems" ariaLabel="Leading-icon example">
          <ng-template twBreadcrumbsItem let-item let-isCurrent="isCurrent" let-index="index">
            @if (isCurrent) {
              <span twBreadcrumbsLink [current]="true">{{ item.label }}</span>
            } @else {
              <a twBreadcrumbsLink [attr.href]="item.href" class="gap-1.5">
                @if (index === 0) {
                  <tw-icon name="home" size="sm" />
                }
                <span>{{ item.label }}</span>
              </a>
            }
          </ng-template>
        </tw-breadcrumbs>
      </div>
      <tw-code-block [code]="iconSnippet" language="html" />
    </section>

    <!-- Size gallery -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input scales font, gap, and icon size in lockstep.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (size of sizes; track size) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ size }}</p>
              <tw-breadcrumbs [items]="basicItems" [size]="size" [ariaLabel]="'Size ' + size + ' example'" />
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Disabled item -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disabled hop</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled: true</code>
        on an item to render it as muted text with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled="true"</code>
        — useful when a section in the trail is gated or temporarily unavailable.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-breadcrumbs [items]="disabledItems" />
      </div>
      <tw-code-block [code]="disabledSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Toggle every visual input on a single trail. Increase
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxItems</code>
        to clear the overflow menu, swap
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">separator</code>
        to compare the default chevron against a slash, and step through the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        scale to see typography and gap scale together.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium rounded-md transition-colors hover:bg-surface-muted"
                  [class.!bg-primary-100]="playSize() === s"
                  [class.!text-primary-700]="playSize() === s"
                  (click)="playSize.set(s)"
                >{{ s }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Separator</label>
            <div class="flex gap-1">
              @for (sep of separators; track sep) {
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium rounded-md transition-colors hover:bg-surface-muted"
                  [class.!bg-primary-100]="playSeparator() === sep"
                  [class.!text-primary-700]="playSeparator() === sep"
                  (click)="playSeparator.set(sep)"
                >{{ sep }}</button>
              }
            </div>
          </div>
          <div>
            <label for="playMaxItems" class="block text-xs font-medium text-fg-muted mb-1">maxItems ({{ playMaxItems() || 'unlimited' }})</label>
            <input
              id="playMaxItems"
              type="range"
              min="0"
              max="6"
              [value]="playMaxItems()"
              (input)="playMaxItems.set(+$any($event.target).value)"
              class="w-32"
            />
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-breadcrumbs
            data-testid="playground"
            [items]="longTrail"
            [size]="playSize()"
            [separator]="playSeparator()"
            [maxItems]="playMaxItems()"
            ariaLabel="Playground breadcrumbs"
          />
        </div>
      </div>
    </section>
  `,
})
export class BreadcrumbsExamples {
  protected readonly sizes = SIZES;
  protected readonly separators: readonly string[] = ['chevron-right', 'slash'];

  // Playground
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playSeparator = signal<string>('chevron-right');
  protected readonly playMaxItems = signal(0);

  protected readonly basicItems: readonly TwBreadcrumbsItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Library', href: '/library' },
    { label: 'Books' },
  ];

  protected readonly longTrail: readonly TwBreadcrumbsItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Workspaces', href: '/workspaces' },
    { label: 'Acme', href: '/workspaces/acme' },
    { label: 'Projects', href: '/workspaces/acme/projects' },
    { label: 'Mobile App', href: '/workspaces/acme/projects/mobile' },
    { label: 'Settings' },
  ];

  protected readonly routerItems: readonly TwBreadcrumbsItem[] = [
    { label: 'Components', data: { routerLink: '/components/button' } },
    { label: 'Breadcrumbs', data: { routerLink: '/components/breadcrumbs/overview' } },
    { label: 'Examples' },
  ];

  protected readonly iconItems: readonly TwBreadcrumbsItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Reports', href: '/reports' },
    { label: 'Q4 Revenue' },
  ];

  protected readonly disabledItems: readonly TwBreadcrumbsItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Billing', href: '/billing', disabled: true },
    { label: 'Invoice 1024' },
  ];

  protected toRouter(data: unknown): RouterCmd | null {
    return data && typeof data === 'object' && 'routerLink' in data
      ? (data as RouterCmd)
      : null;
  }

  protected readonly basicSnippet = `<tw-breadcrumbs [items]="items" />`;

  protected readonly separatorIconSnippet = `<tw-breadcrumbs [items]="items" separator="slash" />`;

  protected readonly separatorTemplateSnippet = `<tw-breadcrumbs [items]="items">
  <ng-template twBreadcrumbsSeparator>
    <span class="text-fg-subtle">/</span>
  </ng-template>
</tw-breadcrumbs>`;

  protected readonly overflowSnippet = `<tw-breadcrumbs [items]="longTrail" [maxItems]="3" />
<!-- 6 items, maxItems=3 → first + ellipsis menu + last 2 -->`;

  protected readonly routerSnippet = `<tw-breadcrumbs [items]="trail">
  <ng-template twBreadcrumbsItem let-item let-isCurrent="isCurrent">
    @if (isCurrent) {
      <span twBreadcrumbsLink [current]="true">{{ item.label }}</span>
    } @else {
      <a twBreadcrumbsLink [routerLink]="item.data?.routerLink">{{ item.label }}</a>
    }
  </ng-template>
</tw-breadcrumbs>`;

  protected readonly rtlSnippet = `<div dir="rtl">
  <tw-breadcrumbs [items]="items" ariaLabel="مسار التنقل" />
</div>`;

  protected readonly iconSnippet = `<tw-breadcrumbs [items]="items">
  <ng-template twBreadcrumbsItem let-item let-isCurrent="isCurrent" let-index="index">
    @if (isCurrent) {
      <span twBreadcrumbsLink [current]="true">{{ item.label }}</span>
    } @else {
      <a twBreadcrumbsLink [attr.href]="item.href" class="gap-1.5">
        @if (index === 0) {
          <tw-icon name="home" size="sm" />
        }
        <span>{{ item.label }}</span>
      </a>
    }
  </ng-template>
</tw-breadcrumbs>`;

  protected readonly disabledSnippet = `<tw-breadcrumbs
  [items]="[
    { label: 'Home', href: '/' },
    { label: 'Billing', href: '/billing', disabled: true },
    { label: 'Invoice 1024' },
  ]"
/>`;
}
