import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TabNavComponent, TabLinkDirective } from '@cdevhub/ngx-tw/tab-nav';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-tab-nav-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TabNavComponent, TabLinkDirective, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Tab Nav component renders the look and feel of a tab bar on top of anchor
        elements, so it pairs naturally with the Angular Router. The active state is
        consumer-driven — typically via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">routerLinkActive</code>
        — so the nav works with any routing strategy. Without an associated panel it follows
        the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;nav&gt;</code>
        landmark pattern with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="page"</code>;
        associate a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-tab-nav-panel&gt;</code>
        to switch into the full WAI-ARIA tabs pattern.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Tab Nav has two ARIA modes. By default the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;nav&gt;</code>
        keeps its native landmark role and each link its native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">link</code>
        role; the active link is marked with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="page"</code>.
        When a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabPanel</code>
        is provided, the nav becomes a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tablist</code>
        of
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tab</code>
        roles with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-selected</code>,
        roving
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex</code>,
        and manual-activation keyboard handling. Disabled links set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled="true"</code>
        and block click/keyboard activation via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">preventDefault</code>.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">ARIA modes</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Condition</th>
              <th class="px-4 py-2 font-medium text-fg-muted">nav role</th>
              <th class="px-4 py-2 font-medium text-fg-muted">link role</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Active attribute</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 text-fg-muted">No tabPanel (default)</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">navigation (native)</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">link (native)</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">aria-current="page"</td>
            </tr>
            <tr>
              <td class="px-4 py-2 text-fg-muted">tabPanel provided</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">tablist</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">tab</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">aria-selected="true"</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Keyboard (tabs pattern)</h3>
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
              <td class="px-4 py-2 font-mono text-xs">ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the next enabled link; wraps at the end.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the previous enabled link; wraps at the start.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the first enabled link.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">End</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the last enabled link.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Activates the focused link (same as clicking).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus out of the tablist to the panel or next focusable element.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <nav twTabNav aria-label="Basic tab nav demo">
          @for (link of links; track link) {
            <a
              twTabLink
              href="#"
              [active]="activeLink() === link"
              (click)="selectLink(link, $event)"
            >
              {{ link }}
            </a>
          }
        </nav>
        <p class="text-xs text-fg-muted mt-4 font-mono">active = {{ activeLink() }}</p>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The demo drives
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[active]</code>
        from a signal so it's interactive without a router. In an app you'll normally bind
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[active]</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">routerLinkActive.isActive</code>
        — the nav at the top of this page does exactly that.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Router Integration (canonical recipe)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Tab Nav is intentionally router-agnostic — the directive has no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">routerLink</code>
        coupling, so it works with any routing strategy (Angular Router, custom history wrappers,
        anchor-only navigation). When pairing it with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#64;angular/router</code>,
        attach
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">routerLinkActive</code>
        on each link and forward its
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">isActive</code>
        signal to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[active]</code>:
      </p>
      <tw-code-block [code]="routerRecipeSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[routerLinkActiveOptions]="&#123; exact: true &#125;"</code>
        for exact-match routes (e.g. the "All" tab at
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">/</code>
        should not stay active on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">/archived</code>).
        The active link automatically receives
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="page"</code>
        in the navigation pattern, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-selected="true"</code>
        when a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabPanel</code>
        is associated.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Router-agnostic: drive the active state from any source (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">routerLinkActive</code>, signals, inputs)</li>
        <li>3 variants: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">underline</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">enclosed</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code></li>
        <li>5 sizes and 8 semantic colors — visually consistent with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-tabs</code> and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-segmented-control</code></li>
        <li>Dual ARIA mode: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;nav&gt;</code> landmark by default, full tabs pattern with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[tabPanel]</code></li>
        <li>Fitted (equal-width) mode for toolbar-style strips</li>
        <li>Disabled links: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled</code> + <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pointer-events-none</code> + click/keyboard <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">preventDefault</code></li>
        <li>Manual-activation keyboard model (Arrow/Home/End moves focus; Enter/Space activates)</li>
        <li>Visible focus indicator on every link via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">focus-visible</code></li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/tabs" class="text-primary-600 hover:underline">Tabs</a>
          — self-contained tabs where the active panel is owned by the component, not a route.
        </li>
        <li>
          <a routerLink="/components/segmented-control" class="text-primary-600 hover:underline">Segmented Control</a>
          — for a small, stateful toggle between mutually exclusive values.
        </li>
        <li>
          <a routerLink="/components/menu" class="text-primary-600 hover:underline">Menu</a>
          — when navigation targets don't fit in a horizontal strip.
        </li>
      </ul>
    </section>
  `,
})
export class TabNavOverview {
  protected readonly links = ['Dashboard', 'Reports', 'Settings'];
  protected readonly activeLink = signal<string>('Dashboard');

  protected selectLink(link: string, event: MouseEvent): void {
    event.preventDefault();
    this.activeLink.set(link);
  }

  protected readonly basicUsageSnippet = `<nav twTabNav aria-label="Basic tab nav demo">
  @for (link of links; track link) {
    <a
      twTabLink
      href="#"
      [active]="activeLink() === link"
      (click)="selectLink(link, $event)"
    >
      {{ link }}
    </a>
  }
</nav>`;

  protected readonly importSnippet = `import {
  TabNavComponent,
  TabLinkDirective,
  TabNavPanel,
} from '@cdevhub/ngx-tw/tab-nav';`;

  protected readonly routerRecipeSnippet = `<nav twTabNav aria-label="Docs">
  <a
    twTabLink
    routerLink="overview"
    routerLinkActive
    #overviewActive="routerLinkActive"
    [active]="overviewActive.isActive"
  >Overview</a>
  <a
    twTabLink
    routerLink="examples"
    routerLinkActive
    #examplesActive="routerLinkActive"
    [active]="examplesActive.isActive"
  >Examples</a>
  <a
    twTabLink
    routerLink="api"
    routerLinkActive
    #apiActive="routerLinkActive"
    [active]="apiActive.isActive"
  >API</a>
</nav>
<router-outlet />`;
}
