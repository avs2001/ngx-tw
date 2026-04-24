import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TabsComponent, TabComponent } from 'ngx-tw/tabs';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-tabs-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TabsComponent, TabComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Tabs component organizes related content into a single region where only one panel is
        visible at a time. It implements the WAI-ARIA
        <a href="https://www.w3.org/WAI/ARIA/apg/patterns/tabs/" class="text-primary-600 hover:underline">Tabs pattern</a>
        with proper
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tablist</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tab</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabpanel</code>
        roles, roving-tabindex focus management, and screen-reader announcements. Three visual
        treatments cover the most common tab patterns — a bottom-border
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">underline</code>,
        folder-like
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">enclosed</code>
        triggers, and segmented
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
        buttons — with horizontal or vertical orientation, optional lazy content, and closable tabs.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Triggers are rendered inside a container with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="tablist"</code>
        and each trigger carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="tab"</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-selected</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>
        pointing at its
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabpanel</code>.
        Focus management follows the APG's roving-tabindex model: only the active trigger is
        reachable with Tab, and arrow keys move the active tab. Tab selection changes are announced
        through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>.
      </p>

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
              <td class="px-4 py-2 font-mono text-xs">ArrowRight / ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Activates the next enabled tab. Wraps to the first tab after the last. ArrowDown is used when orientation is vertical; ArrowRight when horizontal.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft / ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Activates the previous enabled tab. Wraps to the last tab before the first.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home</td>
              <td class="px-4 py-2 text-fg-muted">Activates the first enabled tab.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">End</td>
              <td class="px-4 py-2 text-fg-muted">Activates the last enabled tab.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus out of the tablist to the next focusable element (typically inside the active panel).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tabs [(value)]="basicTab">
          <tw-tab value="overview" label="Overview">
            <div class="space-y-2">
              <p class="text-sm text-fg">A lightweight Angular component for grouping related content.</p>
              <p class="text-sm text-fg-muted">Each panel is rendered inside the tabs container — only the active panel is visible, and focus stays in sync with the selected tab.</p>
            </div>
          </tw-tab>
          <tw-tab value="features" label="Features">
            <ul class="list-disc list-inside text-sm text-fg-muted space-y-1">
              <li>Three visual variants: underline, enclosed, pill</li>
              <li>Horizontal and vertical orientation</li>
              <li>Keyboard navigation with roving tabindex</li>
              <li>Optional lazy content and closable tabs</li>
            </ul>
          </tw-tab>
          <tw-tab value="specs" label="Specifications">
            <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <dt class="text-fg-muted">Pattern</dt><dd class="text-fg">WAI-ARIA Tabs</dd>
              <dt class="text-fg-muted">Variants</dt><dd class="text-fg">underline, enclosed, pill</dd>
              <dt class="text-fg-muted">Sizes</dt><dd class="text-fg">xs, sm, md, lg, xl</dd>
              <dt class="text-fg-muted">Orientation</dt><dd class="text-fg">horizontal, vertical</dd>
            </dl>
          </tw-tab>
        </tw-tabs>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>3 variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">underline</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">enclosed</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
        </li>
        <li>5 sizes from
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
          through
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        </li>
        <li>8 semantic colors for active tab indicators</li>
        <li>Horizontal and vertical orientation</li>
        <li>Two-way binding via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(value)]</code>
        </li>
        <li>Lazy content rendering with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[lazy]="true"</code>
        </li>
        <li>Closable tabs with a
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">(closed)</code>
          output</li>
        <li>Custom trigger templates via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twTabTrigger</code>
        </li>
        <li>Full ARIA Tabs pattern: tablist / tab / tabpanel roles, roving tabindex, live announcements</li>
        <li>Scroll overflow with next/previous navigation buttons</li>
        <li>Equal-width triggers with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[fitted]="true"</code>
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/tab-nav" class="text-primary-600 hover:underline">Tab Nav</a>
          — routed tabs for page-level navigation where each tab is a router link, not a panel.
        </li>
        <li>
          <a routerLink="/segmented-control" class="text-primary-600 hover:underline">Segmented Control</a>
          — picks one value from a small set when no panel content is required.
        </li>
        <li>
          <a routerLink="/accordion" class="text-primary-600 hover:underline">Accordion</a>
          — better when multiple panels can be open at once or when the content needs to stack vertically on mobile.
        </li>
      </ul>
    </section>
  `,
})
export class TabsOverview {
  protected readonly basicTab = signal('overview');

  protected readonly basicUsageSnippet = `<tw-tabs [(value)]="activeTab">
  <tw-tab value="overview" label="Overview">Overview panel content</tw-tab>
  <tw-tab value="features" label="Features">Features panel content</tw-tab>
  <tw-tab value="specs" label="Specifications">Specs panel content</tw-tab>
</tw-tabs>`;

  protected readonly importSnippet = `import {
  TabsComponent,
  TabComponent,
  TabTriggerDirective,
  TabContentDirective,
} from 'ngx-tw/tabs';`;
}
