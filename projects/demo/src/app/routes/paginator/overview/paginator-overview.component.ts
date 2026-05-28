import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaginatorComponent } from '@cdevhub/ngx-tw/paginator';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-paginator-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaginatorComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Paginator navigates large paginated datasets such as tables, lists, and grids. It
        renders in two types —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">basic</code>
        (compact prev / next with page info) and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numbered</code>
        (full page-button list with ellipsis collapsing) — and automatically collapses the number
        strip to compact visuals on narrow containers via CSS container queries. Every label is
        i18n-friendly, every button is keyboard-navigable, and the control emits a rich
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">paginated</code>
        event that tells you exactly which slice of items is now visible.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The root renders as a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;nav&gt;</code>
        landmark with a configurable
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>,
        every numbered button carries a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Go to page N</code>
        accessible name, and the current page gets
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="page"</code>
        alongside a swapped current-page label. Each page transition is announced through CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>
        so assistive tech hears the new page as it loads. Arrow keys move focus inside the nav
        group with a roving focus model — focusables skip disabled buttons and the Enter / Space
        keys activate whatever is focused.
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
              <td class="px-4 py-2 font-mono text-xs">ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the next enabled button inside the nav group.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the previous enabled button inside the nav group.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home</td>
              <td class="px-4 py-2 text-fg-muted">Focuses the first enabled button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">End</td>
              <td class="px-4 py-2 text-fg-muted">Focuses the last enabled button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Activates the focused button (native behavior).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus in and out of the nav group following document order.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-paginator [totalItems]="100" [(page)]="basicPage" />
        <p class="text-xs text-fg-muted mt-4 font-mono">page = {{ basicPage() }}</p>
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
        <li>2 types: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">basic</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numbered</code></li>
        <li>2 layouts: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">compact</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">spread</code></li>
        <li>5 sizes (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>) and 8 semantic colors</li>
        <li>Tunable ellipsis collapsing via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">siblingCount</code> and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">boundaryCount</code></li>
        <li>Optional page-size selector with configurable options</li>
        <li>First / last jump buttons, toggled via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showFirstLastButtons</code></li>
        <li>Container-query responsive collapse — no JavaScript required</li>
        <li>Empty state fallback and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hideOnSinglePage</code></li>
        <li>Page clamping on out-of-range inputs emits a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">programmatic</code> event</li>
        <li>Page-size anchor preservation — changing page size keeps the same first visible item on screen</li>
        <li>i18n-friendly <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labels</code> input with token substitution</li>
        <li>3 projection slots: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twPaginatorLabel</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twPaginatorEmpty</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twPaginatorPageSizeSelector</code></li>
        <li>SSR-friendly anchor rendering via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">linkFactory</code></li>
        <li>Rich <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">paginated</code> event with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">source</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">start</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">end</code>, and previous values</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/table" class="text-primary-600 hover:underline">Table</a>
          — the most common home for a paginator; pair below the table to page through rows.
        </li>
        <li>
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — swap the built-in page-size <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;select&gt;</code> via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twPaginatorPageSizeSelector</code>.
        </li>
        <li>
          <a routerLink="/components/button" class="text-primary-600 hover:underline">Button</a>
          — the styling primitive used for paginator nav and page buttons.
        </li>
        <li>
          <a routerLink="/components/skeleton" class="text-primary-600 hover:underline">Skeleton</a>
          — render placeholder rows above the paginator while the next page loads.
        </li>
      </ul>
    </section>
  `,
})
export class PaginatorOverview {
  protected readonly basicPage = signal(1);

  protected readonly basicUsageSnippet = `<tw-paginator [totalItems]="100" [(page)]="page" />`;

  protected readonly importSnippet = `import {
  PaginatorComponent,
  PaginatorLabelDirective,
  PaginatorEmptyDirective,
  PaginatorPageSizeSelectorDirective,
} from '@cdevhub/ngx-tw/paginator';`;
}
