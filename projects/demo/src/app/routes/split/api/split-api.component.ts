import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-split-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- SplitComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SplitComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-split</p>

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
              <td class="px-4 py-2 font-mono text-xs">direction</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'horizontal' | 'vertical'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'horizontal'</td>
              <td class="px-4 py-2 text-fg-muted">Axis along which panes are laid out.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">unit</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'percent' | 'pixel'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'percent'</td>
              <td class="px-4 py-2 text-fg-muted">How sizes are expressed and reported.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">gutterSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">6</td>
              <td class="px-4 py-2 text-fg-muted">Thickness of each gutter in pixels.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, all resize interactions are disabled and gutters are not focusable.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">keyboardStep</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">10</td>
              <td class="px-4 py-2 text-fg-muted">Step size per arrow-key press, in the declared unit.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">keyboardStepLarge</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">50</td>
              <td class="px-4 py-2 text-fg-muted">Step size for PageUp / PageDown, in the declared unit.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">storageKey</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">If non-null, sizes are persisted to <code class="font-mono">localStorage</code> under this key.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">rtl</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Force RTL behaviour. <code class="font-mono">null</code> inherits from the ambient <code class="font-mono">dir</code>.</td>
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
              <th class="px-4 py-2 font-medium text-fg-muted">Payload</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">sizesChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number[]</td>
              <td class="px-4 py-2 text-fg-muted">Fires after each committed resize. Not on every pointermove.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">resizeStart</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SplitResizeEvent</td>
              <td class="px-4 py-2 text-fg-muted">Fires on pointer/touch down or first keyboard step.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">resizeEnd</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SplitResizeEvent</td>
              <td class="px-4 py-2 text-fg-muted">Fires on pointer/touch up or keyboard commit.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">collapseChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SplitCollapseEvent</td>
              <td class="px-4 py-2 text-fg-muted">Fires when a pane collapses or expands via snap, keyboard, or programmatic API.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Signature</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">setSizes(sizes: number[]): void</td>
              <td class="px-4 py-2 text-fg-muted">Apply a new size array. Throws if length differs from the pane count.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">collapse(paneIndex: number): void</td>
              <td class="px-4 py-2 text-fg-muted">Collapse the pane at the index to its <code class="font-mono">collapsedSize</code>. Throws if not collapsible.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">expand(paneIndex: number): void</td>
              <td class="px-4 py-2 text-fg-muted">Restore the pane at the index to its pre-collapse size (or <code class="font-mono">defaultSize</code>).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">reset(): void</td>
              <td class="px-4 py-2 text-fg-muted">Restore all panes to their declared <code class="font-mono">defaultSize</code> and clear persisted sizes.</td>
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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Yes</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">2+</td>
              <td class="px-4 py-2 text-fg-muted">Two or more <code class="font-mono">tw-split-pane</code> children.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- SplitPaneComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SplitPaneComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-split-pane</p>

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
              <td class="px-4 py-2 font-mono text-xs">defaultSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Initial size in the container's unit. Falls back to even distribution.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Lower bound; the gutter will not move past this.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Infinity</td>
              <td class="px-4 py-2 text-fg-muted">Upper bound; the gutter will not move past this.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">collapsible</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Allows the pane to collapse via snap, keyboard, or API.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">collapsedSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Size used when collapsed. <code class="font-mono">&gt; 0</code> for rail-style collapse.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">snapSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Drag-snap threshold near <code class="font-mono">collapsedSize</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Outputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Payload</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">sizeChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 text-fg-muted">Fires when this pane's size changes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">collapsedChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 text-fg-muted">Fires when this pane's collapsed state flips.</td>
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
export class SplitApi {
  protected readonly typesSnippet = `type SplitDirection = 'horizontal' | 'vertical';

type SplitUnit = 'percent' | 'pixel';

interface SplitResizeEvent {
  sizes: number[];
  unit: SplitUnit;
  originPaneIndex: number;
  cause: 'pointer' | 'touch' | 'keyboard' | 'programmatic';
}

interface SplitCollapseEvent {
  paneIndex: number;
  collapsed: boolean;
  cause: 'snap' | 'keyboard' | 'programmatic';
}`;
}
