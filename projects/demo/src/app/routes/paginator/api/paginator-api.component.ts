import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-paginator-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- PaginatorComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PaginatorComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-paginator</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">totalItems</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Total number of items across all pages.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">
                page
                <span class="ml-1 inline-block px-1.5 py-0.5 rounded text-2xs font-medium bg-info-50 text-info-700">two-way</span>
              </td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">1-based current page, clamped to <code class="font-mono">[1, totalPages]</code> — two-way bindable via <code class="font-mono">[(page)]</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">
                pageSize
                <span class="ml-1 inline-block px-1.5 py-0.5 rounded text-2xs font-medium bg-info-50 text-info-700">two-way</span>
              </td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">10</td>
              <td class="px-4 py-2 text-fg-muted">Items per page — two-way bindable and re-anchors the current page so the same first item stays visible.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">type</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'basic' | 'numbered'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'numbered'</td>
              <td class="px-4 py-2 text-fg-muted">Render type — basic shows prev / next with page info, numbered adds the full page-button list.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">layout</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'compact' | 'spread'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'compact'</td>
              <td class="px-4 py-2 text-fg-muted">Layout density — spread distributes regions across the full container width.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Scales button padding, font size, and icon dimensions together.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color used for the active page button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">siblingCount</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Number of page buttons shown on each side of the current page.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">boundaryCount</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Number of page buttons always rendered at the start and end boundaries.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showFirstLastButtons</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Renders jump-to-first and jump-to-last buttons around the prev / next controls.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showPageSizeSelector</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders the page-size selector region.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">pageSizeOptions</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly number[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[10, 25, 50, 100]</td>
              <td class="px-4 py-2 text-fg-muted">Options rendered in the default page-size selector.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showPageInfo</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Renders the page-info text region.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hideOnEmpty</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Renders nothing when <code class="font-mono">totalItems === 0</code>; set to false to show the empty shell.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hideOnSinglePage</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders nothing when <code class="font-mono">totalPages &le; 1</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">responsive</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'auto' | 'off'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'auto'</td>
              <td class="px-4 py-2 text-fg-muted">Container-query collapse mode — auto hides the page-button list on narrow containers.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables every button and blocks pagination changes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">labels</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Partial&lt;TwPaginatorLabels&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Partial i18n label overrides; unset keys fall back to the English defaults.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">linkFactory</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(page: number) =&gt; string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">When provided, renders page and nav buttons as anchors with the returned href.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Overrides <code class="font-mono">labels.ariaLabel</code> on the root <code class="font-mono">&lt;nav&gt;</code> element.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Outputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">paginated</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwPaginatorPageChangeEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when page or pageSize changes — payload includes <code class="font-mono">source</code>, <code class="font-mono">start</code>, <code class="font-mono">end</code>, <code class="font-mono">totalPages</code>, and the previous values.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">pageChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;number&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires whenever the two-way <code class="font-mono">page</code> model updates; drives <code class="font-mono">[(page)]</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">pageSizeChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;number&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires whenever the two-way <code class="font-mono">pageSize</code> model updates; drives <code class="font-mono">[(pageSize)]</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Projection directives -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PaginatorLabelDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: ng-template[twPaginatorLabel]</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">slot</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwPaginatorLabelSlot</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Required — the label slot this template replaces (one of <code class="font-mono">'pageInfo'</code>, <code class="font-mono">'previous'</code>, <code class="font-mono">'next'</code>, <code class="font-mono">'first'</code>, <code class="font-mono">'last'</code>, <code class="font-mono">'pageSizeLabel'</code>).</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Template context <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">$implicit</code> is <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwPaginatorLabelContext</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PaginatorEmptyDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: ng-template[twPaginatorEmpty]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive projected onto an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        that renders when <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">totalItems === 0</code>
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hideOnEmpty</code> is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">false</code>. When absent,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labels.empty</code> renders as fallback.
        Template context <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">$implicit</code> is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwPaginatorLabelContext</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PaginatorPageSizeSelectorDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: ng-template[twPaginatorPageSizeSelector]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that replaces the default page-size
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;select&gt;</code>
        entirely. Template context <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">$implicit</code>
        is <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwPaginatorPageSizeSelectorContext</code>
        with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pageSize</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setPageSize(n)</code>.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class PaginatorApi {
  protected readonly typesSnippet = `type TwPaginatorType = 'basic' | 'numbered';
type TwPaginatorLayout = 'compact' | 'spread';
type TwPaginatorResponsive = 'auto' | 'off';
type TwPaginatorLabelSlot =
  | 'pageInfo'
  | 'previous'
  | 'next'
  | 'first'
  | 'last'
  | 'pageSizeLabel';

interface TwPaginatorLabels {
  ariaLabel: string;
  previous: string;
  next: string;
  first: string;
  last: string;
  pageInfo: string;
  pageInfoSeparator: string;
  pageRange: string;
  pageSizeLabel: string;
  announcement: string;
  pageButtonAriaLabel: string;
  currentPageAriaLabel: string;
  ellipsis: string;
  empty: string;
}

interface TwPaginatorPageChangeEvent {
  page: number;
  pageSize: number;
  previousPage: number;
  previousPageSize: number;
  totalItems: number;
  totalPages: number;
  start: number;
  end: number;
  source: 'click' | 'keyboard' | 'pageSizeChange' | 'programmatic';
}

interface TwPaginatorLabelContext {
  page: number;
  totalPages: number;
  start: number;
  end: number;
  totalItems: number;
  pageSize: number;
  disabled: boolean;
}

interface TwPaginatorPageSizeSelectorContext {
  pageSize: number;
  options: readonly number[];
  setPageSize: (size: number) => void;
}

// Shared library types (re-exported from 'ngx-tw/core'):
type TwColor = 'primary' | 'secondary' | 'accent' | 'neutral'
             | 'info' | 'success' | 'warning' | 'error';
type TwSize  = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
