import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-breadcrumbs-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- BreadcrumbsComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">BreadcrumbsComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-breadcrumbs</p>

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
              <td class="px-4 py-2 font-mono text-xs">items</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly TwBreadcrumbsItem&lt;T&gt;[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">The full breadcrumb trail. The last entry is the current page.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Drives font size, gap, icon size, and the overflow-button square.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxItems</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">When &gt; 0, collapses middle items behind an overflow menu. Values &lt; 2 are clamped to 2. <code class="font-mono">0</code> disables collapsing.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">separator</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'chevron-right'</td>
              <td class="px-4 py-2 text-fg-muted">Icon name used for the default separator glyph. Ignored when a <code class="font-mono">*twBreadcrumbsSeparator</code> template is projected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Breadcrumb'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible label applied to the <code class="font-mono">&lt;nav&gt;</code> landmark.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Content children</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Slot</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Directive</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Purpose</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twBreadcrumbsItem</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">BreadcrumbsItemTemplateDirective</td>
              <td class="px-4 py-2 text-fg-muted">Replace the default per-item rendering. Template context: <code class="font-mono">item</code>, <code class="font-mono">index</code>, <code class="font-mono">isCurrent</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twBreadcrumbsSeparator</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">BreadcrumbsSeparatorTemplateDirective</td>
              <td class="px-4 py-2 text-fg-muted">Replace the default chevron separator with arbitrary content.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- BreadcrumbsLinkDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">BreadcrumbsLinkDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twBreadcrumbsLink]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Applied to a consumer-projected anchor (or span) inside
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twBreadcrumbsItem</code>
        to inherit the parent breadcrumb's link / current / disabled styling. Without this
        directive, projected content renders unstyled (only the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;li&gt;</code>
        layout comes from the component).
      </p>

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
              <td class="px-4 py-2 font-mono text-xs">current</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, applies current-page styling and sets <code class="font-mono">aria-current="page"</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, applies muted / not-allowed styling.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class BreadcrumbsApi {
  protected readonly typesSnippet = `interface TwBreadcrumbsItem<T = unknown> {
  /** Visible label shown for this hop. */
  label: string;
  /** Optional href for the default anchor. Omit on the current item. */
  href?: string;
  /** Opaque payload forwarded to the consumer's *twBreadcrumbsItem template. */
  data?: T;
  /** When true, the item renders muted with aria-disabled="true". */
  disabled?: boolean;
}

interface TwBreadcrumbsItemContext<T = unknown> {
  /** Implicit: the item record. */
  $implicit: TwBreadcrumbsItem<T>;
  /** Alias of $implicit; for readable let- bindings. */
  item: TwBreadcrumbsItem<T>;
  /** Zero-based index of this item in the original items input. */
  index: number;
  /** True only for the last (current) entry. */
  isCurrent: boolean;
}`;
}
