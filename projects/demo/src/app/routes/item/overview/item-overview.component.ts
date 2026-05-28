import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ItemComponent,
  ItemLeadingDirective,
  ItemTitleDirective,
  ItemDescriptionDirective,
} from 'ngx-tw/item';
import { IconComponent } from 'ngx-tw/icon';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-item-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemComponent,
    ItemLeadingDirective,
    ItemTitleDirective,
    ItemDescriptionDirective,
    IconComponent,
    CodeBlockComponent,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Item component is a layout-only primitive that composes four content
        regions — leading, title, description, and trailing — into a horizontal row
        with a vertical text stack in the middle. It handles alignment, spacing, and
        typography across three density sizes, and ships with an optional
        keyboard-activatable mode for list rows. Use it as the shared skeleton for
        page headers, section headers, list items, and table-cell compositions so
        density and rhythm stay consistent across the app.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Non-interactive items render as a plain layout container with no ARIA role —
        the semantics of the projected children (heading, link, badge) decide how
        assistive tech reads the row. When
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">interactive</code>
        is <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">true</code>,
        the host gains
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="button"</code>
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex="0"</code>,
        Enter and Space emit <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selected</code>,
        and focus is monitored through CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FocusMonitor</code>
        so the focus ring only appears for keyboard users. Setting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        adds <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled="true"</code>
        and removes the row from the tab order.
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
              <td class="px-4 py-2 font-mono text-xs">Enter</td>
              <td class="px-4 py-2 text-fg-muted">Activates an interactive item and emits <code class="font-mono text-xs">selected</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Space</td>
              <td class="px-4 py-2 text-fg-muted">Activates an interactive item and emits <code class="font-mono text-xs">selected</code>. Default scroll is prevented.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the next interactive row. Disabled rows are skipped.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-item size="lg">
          <div
            twItemLeading
            class="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600"
          >
            <tw-icon name="arrow-down-wide-narrow" size="sm" />
          </div>
          <h3 twItemTitle>Sort</h3>
          <p twItemDescription>
            Composable sorting primitive — a container directive plus a sortable header
            component. Use with tables, lists, or any data view.
          </p>
        </tw-item>
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
        <li>Three density sizes:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
          (table rows, truncated single-line title and description),
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
          (list rows), and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
          (section headers with a larger title)
        </li>
        <li>Four directive slots:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twItemLeading</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twItemTitle</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twItemDescription</code>,
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twItemTrailing</code>
        </li>
        <li>Two alignment modes:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">start</code>
          (title-baseline) and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">center</code>
          (vertical center, for single-line rows)
        </li>
        <li>Optional interactive mode adds <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="button"</code>, a hover background, pointer cursor, focus ring, and Enter/Space activation</li>
        <li>Optional <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">current</code> highlight with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="true"</code> for the active settings tab, routed nav item, or selected list row</li>
        <li>Layout-only leading slot — project any icon, avatar, checkbox, or bullet and style it yourself</li>
        <li>Title and description accept inline children (badges, chips, inline icons)</li>
        <li>Uses surface, foreground, and border semantic tokens — works with any consumer theme and supports dark mode automatically</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/card" class="text-primary-600 hover:underline">Card</a>
          — when the composition needs its own enclosing surface with padding, border, or elevation.
        </li>
        <li>
          <a routerLink="/avatar" class="text-primary-600 hover:underline">Avatar</a>
          — the most common content for the leading slot in people lists.
        </li>
        <li>
          <a routerLink="/badge" class="text-primary-600 hover:underline">Badge</a>
          — inline status chips inside the title or trailing slot.
        </li>
        <li>
          <a routerLink="/button" class="text-primary-600 hover:underline">Button</a>
          — common content for the trailing slot when the row surfaces an action.
        </li>
      </ul>
    </section>
  `,
})
export class ItemOverview {
  protected readonly basicUsageSnippet = `<tw-item size="lg">
  <div twItemLeading class="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
    <tw-icon name="arrow-down-wide-narrow" size="sm" />
  </div>
  <h3 twItemTitle>Sort</h3>
  <p twItemDescription>
    Composable sorting primitive — a container directive plus a sortable header
    component. Use with tables, lists, or any data view.
  </p>
</tw-item>`;

  protected readonly importSnippet = `import {
  ItemComponent,
  ItemLeadingDirective,
  ItemTitleDirective,
  ItemDescriptionDirective,
  ItemTrailingDirective,
} from 'ngx-tw/item';`;
}
