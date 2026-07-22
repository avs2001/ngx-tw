import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-transfer-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- TransferComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TransferComponent&lt;T, K&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-transfer</p>

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
              <td class="px-4 py-2 font-mono text-xs">data</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly T[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">All items across both panels; the source/target split derives from the value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">keyFn</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(item: T) =&gt; K</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">required</td>
              <td class="px-4 py-2 text-fg-muted">Resolves a stable key for an item, used for membership, checked state, and comparison.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">labelFn</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(item: T) =&gt; string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">String(item)</td>
              <td class="px-4 py-2 text-fg-muted">Resolves an item's label for the default row, search filtering, and typeahead.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">labels</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Partial&lt;TwTransferLabels&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Per-panel text and ARIA labels; unset keys fall back to English defaults.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">display</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Partial&lt;TwTransferDisplayConfig&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Visual configuration (<code class="font-mono">size</code>, <code class="font-mono">listHeight</code>, <code class="font-mono">showSearch</code>, <code class="font-mono">showSelectAll</code>).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">behavior</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Partial&lt;TwTransferBehaviorConfig&lt;T&gt;&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Behavioural configuration (<code class="font-mono">oneWay</code>, <code class="font-mono">filterFn</code>, <code class="font-mono">disabledItem</code>).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables the entire control; also driven by reactive forms via <code class="font-mono">setDisabledState</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Marks the control required; also inferred from a bound <code class="font-mono">Validators.required</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the control when no visible label is wired.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that labels the control.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ErrorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance override of the error-state matcher used for form-field error chrome.</td>
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
              <td class="px-4 py-2 font-mono text-xs">valueChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">OutputEmitterRef&lt;readonly K[]&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when items move by user interaction; payload is the new full target-keys array.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">moved</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">OutputEmitterRef&lt;TwTransferMovedEvent&lt;K&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after each directional move, identifying the moved keys and their direction.</td>
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
              <td class="px-4 py-2 font-mono text-xs">moveToTarget</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">moveToTarget(keys: readonly K[]): void</td>
              <td class="px-4 py-2 text-fg-muted">Moves the given items to the target side, ignoring keys already there or disabled.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">moveToSource</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">moveToSource(keys: readonly K[]): void</td>
              <td class="px-4 py-2 text-fg-muted">Moves the given items to the source side; a no-op when <code class="font-mono">behavior.oneWay</code> is on.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TransferItemDefDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TransferItemDefDirective&lt;T&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twTransferItem] (structural)</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Declares the optional per-item template via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twTransferItem="let item"</code>.
        When omitted, each row renders the default check glyph plus
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labelFn</code>
        text. The template receives a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwTransferItemContext&lt;T&gt;</code>.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Template context</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Member</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">$implicit</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">T</td>
              <td class="px-4 py-2 text-fg-muted">The item data, available as <code class="font-mono">let-item</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 text-fg-muted">The resolved <code class="font-mono">labelFn(item)</code> text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">checked</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 text-fg-muted">Whether this row's option is currently checked (pending a move).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 text-fg-muted">Whether the item is disabled via <code class="font-mono">behavior.disabledItem</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">side</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'source' | 'target'</td>
              <td class="px-4 py-2 text-fg-muted">Which panel this row renders in.</td>
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
export class TransferApi {
  protected readonly typesSnippet = `type TwTransferSide = 'source' | 'target';

interface TwTransferLabels {
  /** Source / target panel titles. Default 'Source' / 'Target'. */
  sourceTitle?: string;
  targetTitle?: string;
  /** Search placeholder + empty text. Default 'Search' / 'No items'. */
  searchPlaceholder?: string;
  emptyText?: string;
  /** ARIA labels for the select-all and move buttons. */
  selectAllLabel?: string;
  moveToTargetLabel?: string;
  moveToSourceLabel?: string;
  /** Header count template, vars {total} {selected}. Default '{total} items'. */
  countFormat?: string;
  /** Move announcement template, vars {count} {target}. */
  moveAnnouncement?: string;
}

interface TwTransferDisplayConfig {
  /** Row density. Default 'md'. */
  size?: TwSize;
  /** List viewport height in px, or 'auto'. Default 240. */
  listHeight?: number | 'auto';
  /** Per-panel search input. Default false. */
  showSearch?: boolean;
  /** Tri-state header select-all. Default true. */
  showSelectAll?: boolean;
}

interface TwTransferBehaviorConfig<T = unknown> {
  /** Source → target only; hides the ← button. Default false. */
  oneWay?: boolean;
  /** Custom search predicate. Default substring match on labelFn. */
  filterFn?: (item: T, query: string) => boolean;
  /** Per-item disable predicate. Default () => false. */
  disabledItem?: (item: T) => boolean;
}

interface TwTransferItemContext<T> {
  $implicit: T;
  label: string;
  checked: boolean;
  disabled: boolean;
  side: TwTransferSide;
}

interface TwTransferMovedEvent<K> {
  keys: readonly K[];
  direction: 'toTarget' | 'toSource';
}`;
}
