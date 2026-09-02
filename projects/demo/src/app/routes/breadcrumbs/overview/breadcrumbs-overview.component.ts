import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BreadcrumbsComponent,
  type TwBreadcrumbsItem,
} from '@cdevhub/ngx-tw/breadcrumbs';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-breadcrumbs-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BreadcrumbsComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Breadcrumbs render a horizontal trail of navigation hops ending in the current page. The
        component emits a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;nav&gt;</code>
        landmark with an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        and an ordered
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ol&gt;</code>
        of hops. The final hop is the current page — it carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="page"</code>
        and is never rendered as a link.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The trail follows WAI-ARIA's breadcrumb pattern: a navigation landmark named
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">"Breadcrumb"</code>
        wrapping an ordered list. Separators sit on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden="true"</code>
        list items so screen readers traverse the hops without announcing "chevron right". When
        truncation is active, the collapsed middle items live inside a Menu opened by an ellipsis
        button labelled
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">"Show more breadcrumbs"</code>.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Semantics</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Element</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Role / Attribute</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Purpose</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">&lt;nav&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">aria-label</td>
              <td class="px-4 py-2 text-fg-muted">Names the navigation landmark; defaults to "Breadcrumb".</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">&lt;ol&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">list (native)</td>
              <td class="px-4 py-2 text-fg-muted">Preserves the hop order for assistive tech.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">last &lt;li&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">aria-current="page"</td>
              <td class="px-4 py-2 text-fg-muted">Marks the current location; rendered as text, not an anchor.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">separator &lt;li&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">aria-hidden="true"</td>
              <td class="px-4 py-2 text-fg-muted">Visual chevron skipped by screen readers.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">overflow &lt;button&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">aria-label="Show more breadcrumbs"</td>
              <td class="px-4 py-2 text-fg-muted">Opens a menu listing the collapsed middle hops.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Keyboard</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab / Shift+Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus between hops and the overflow button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Activates the focused anchor or overflow button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Opens the overflow menu when the overflow button has focus.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowUp / ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus between hidden items inside the overflow menu.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Closes the overflow menu and returns focus to the trigger.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-breadcrumbs [items]="basicItems" />
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Pass an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">items</code>
        array; the component handles separators and the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current</code>
        marker automatically. The last entry has no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">href</code>
        — it's the current page.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Router Integration</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twBreadcrumbsItem</code>
        template and bind your own
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">routerLink</code>.
        Apply the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twBreadcrumbsLink</code>
        directive to inherit the component's link styling.
      </p>
      <tw-code-block [code]="routerSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          Renders a real
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;nav&gt;</code>
          landmark with an
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ol&gt;</code>
          of hops
        </li>
        <li>
          Current item rendered as text with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="page"</code>
        </li>
        <li>Auto-collapsing trail via the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxItems</code> input, with an overflow menu powered by <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-menu</code></li>
        <li>Custom item template via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twBreadcrumbsItem</code> for router integration</li>
        <li>Custom separator via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">separator</code> input (icon name) or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twBreadcrumbsSeparator</code> template</li>
        <li>RTL-aware: default chevron flips automatically under <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dir="rtl"</code></li>
        <li>5 sizes via the shared <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwSize</code> scale</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/tab-nav" class="text-primary-600 hover:underline">Tab Nav</a>
          — for switching between sibling sections rather than ascending a hierarchy.
        </li>
        <li>
          <a routerLink="/components/menu" class="text-primary-600 hover:underline">Menu</a>
          — the overflow popover used to surface collapsed hops.
        </li>
        <li>
          <a routerLink="/components/paginator" class="text-primary-600 hover:underline">Paginator</a>
          — when the navigation surface is a flat sequence rather than a hierarchy.
        </li>
      </ul>
    </section>
  `,
})
export class BreadcrumbsOverview {
  protected readonly basicItems: readonly TwBreadcrumbsItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Library', href: '/library' },
    { label: 'The Pragmatic Programmer' },
  ];

  protected readonly basicUsageSnippet = `<tw-breadcrumbs [items]="items" />

// items
[
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'The Pragmatic Programmer' }, // current page
]`;

  protected readonly routerSnippet = `<tw-breadcrumbs [items]="trail" aria-label="Section navigation">
  <ng-template twBreadcrumbsItem let-item let-isCurrent="isCurrent">
    @if (isCurrent) {
      <span twBreadcrumbsLink [current]="true">{{ item.label }}</span>
    } @else {
      <a twBreadcrumbsLink [routerLink]="item.data?.routerLink">{{ item.label }}</a>
    }
  </ng-template>
</tw-breadcrumbs>`;

  protected readonly importSnippet = `import {
  BreadcrumbsComponent,
  BreadcrumbsItemTemplateDirective,
  BreadcrumbsLinkDirective,
  BreadcrumbsSeparatorTemplateDirective,
  type TwBreadcrumbsItem,
} from '@cdevhub/ngx-tw/breadcrumbs';`;
}
