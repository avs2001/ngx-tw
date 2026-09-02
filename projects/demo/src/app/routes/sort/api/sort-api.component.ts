import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-sort-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- SortDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SortDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twSort] · exportAs: twSort</p>

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
              <td class="px-4 py-2 font-mono text-xs">twSortActive</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Id of the currently sorted header; two-way bindable via <code class="font-mono">[(twSortActive)]</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twSortDirection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SortDirection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Current sort direction; two-way bindable via <code class="font-mono">[(twSortDirection)]</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twSortStart</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'asc' | 'desc'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'asc'</td>
              <td class="px-4 py-2 text-fg-muted">Starting direction used when a header becomes active; per-header <code class="font-mono">start</code> overrides this.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twSortDisableClear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, the cycle skips the cleared state and toggles only between ascending and descending.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twSortDisabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, all child sort headers are disabled.</td>
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
              <td class="px-4 py-2 font-mono text-xs">twSortChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwSortEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires on every user-driven sort change; programmatic writes to the two-way bindings do not emit.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Signature</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">sort</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(sortable: TwSortable) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Cycles the direction for the given header and emits <code class="font-mono">twSortChange</code>; no-op when disabled.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">getNextSortDirection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(sortable: TwSortable) =&gt; SortDirection</td>
              <td class="px-4 py-2 text-fg-muted">Returns the next direction in the cycle for the given header, based on the current state and overrides.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">register</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(id: string) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Registers a header id so duplicates can be detected; called internally by <code class="font-mono">SortHeaderComponent</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">deregister</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(id: string) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Deregisters a header id on destroy.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- SortHeaderComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SortHeaderComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [tw-sort-header] · exportAs: twSortHeader</p>

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
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Unique id identifying the field or column this header sorts; required.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">start</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'asc' | 'desc' | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Overrides the parent directive's <code class="font-mono">twSortStart</code> for this header only.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disableClear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Overrides the parent directive's <code class="font-mono">twSortDisableClear</code> for this header only.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, clicks and keyboard activation on this header are ignored.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">arrowPosition</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'before' | 'after'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'after'</td>
              <td class="px-4 py-2 text-fg-muted">Renders the arrow before or after the projected label.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color used to tint the arrow when this header is active.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls padding, font size, and arrow icon size.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">sortActionDescription</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Sort'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible description applied via CDK <code class="font-mono">AriaDescriber</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Slots</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Required</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Cardinality</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">default</td>
              <td class="px-4 py-2 text-fg-muted">Yes</td>
              <td class="px-4 py-2 text-fg-muted">Single</td>
              <td class="px-4 py-2 text-fg-muted">Label text or content rendered next to the arrow.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twSortHeaderIcon]</td>
              <td class="px-4 py-2 text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">Single</td>
              <td class="px-4 py-2 text-fg-muted">Replaces the default chevron SVG with custom markup.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-sm font-semibold mt-6 mb-2">Host attributes</h3>
      <p class="mb-3 max-w-2xl text-sm text-fg-muted">
        <code class="font-mono">aria-sort</code> is emitted <strong>only</strong> when the host is
        genuinely a header cell &mdash; a <code class="font-mono">&lt;th&gt;</code>, or an element
        with <code class="font-mono">role="columnheader"</code> /
        <code class="font-mono">"rowheader"</code>. ARIA does not permit it anywhere else, so on a
        <code class="font-mono">&lt;span&gt;</code> or <code class="font-mono">&lt;button&gt;</code>
        host it is deliberately absent.
      </p>
      <p class="mb-3 max-w-2xl text-sm text-fg-muted">
        <code class="font-mono">data-sort-direction</code> carries the same value
        (<code class="font-mono">ascending</code> / <code class="font-mono">descending</code> /
        <code class="font-mono">none</code>) on <em>every</em> host shape. Use it to style on sort
        state, and to assert sort state in tests, without depending on the arrow's utility classes.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class SortApi {
  protected readonly typesSnippet = `type SortDirection = 'asc' | 'desc' | null;

type TwSortArrowPosition = 'before' | 'after';

interface TwSortEvent {
  active: string | null;
  direction: SortDirection;
  previous: {
    active: string | null;
    direction: SortDirection;
  };
}

interface TwSortable {
  readonly id: string;
  readonly start: 'asc' | 'desc' | undefined;
  readonly disableClear: boolean | undefined;
  readonly disabled: boolean;
}`;
}
