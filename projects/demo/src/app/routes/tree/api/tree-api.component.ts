import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-tree-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- TreeComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TreeComponent&lt;T&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-tree</p>

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
              <td class="px-4 py-2 text-fg-muted">Root nodes of the tree; each node's children are resolved via <code class="font-mono">childrenAccessor</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">childrenAccessor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(node: T) =&gt; readonly T[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">required</td>
              <td class="px-4 py-2 text-fg-muted">Resolves a node's direct children, returning an empty array for leaf nodes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">trackBy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(node: T) =&gt; unknown</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Identifies a node across data changes and keys both expansion and selection state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Partial&lt;TwTreeSelectionConfig&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Selection behavior (<code class="font-mono">mode</code>, <code class="font-mono">cascade</code>, <code class="font-mono">initialKeys</code>); selection is disabled by default.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">display</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Partial&lt;TwTreeDisplayConfig&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Display configuration (<code class="font-mono">size</code>, <code class="font-mono">indent</code>, <code class="font-mono">showLines</code>).</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Models (two-way)</h3>
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
              <td class="px-4 py-2 font-mono text-xs">expandedKeys</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly unknown[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound list of expansion keys (resolved via <code class="font-mono">trackBy</code>) for currently-expanded nodes.</td>
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
              <td class="px-4 py-2 font-mono text-xs">selectionChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">OutputEmitterRef&lt;readonly T[]&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the selection changes by user interaction; payload is every node whose state is <code class="font-mono">'checked'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">expandedChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">OutputEmitterRef&lt;{{ '{' }} node: T; expanded: boolean {{ '}' }}&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after a node is expanded or collapsed by user interaction.</td>
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
              <td class="px-4 py-2 font-mono text-xs">toggle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">toggle(node: T): void</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the node's expand/collapse state; no-op on leaf nodes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">expand</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">expand(node: T): void</td>
              <td class="px-4 py-2 text-fg-muted">Expands the node if it is currently collapsed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">collapse</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">collapse(node: T): void</td>
              <td class="px-4 py-2 text-fg-muted">Collapses the node if it is currently expanded.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">isExpanded</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">isExpanded(node: T): boolean</td>
              <td class="px-4 py-2 text-fg-muted">Returns whether the node is currently expanded.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hasChildren</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">hasChildren(node: T): boolean</td>
              <td class="px-4 py-2 text-fg-muted">Returns whether the node has at least one child (is a branch).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectionState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">selectionState(node: T): TwTreeSelectionState</td>
              <td class="px-4 py-2 text-fg-muted">Returns the tri-state selection status of a node; <code class="font-mono">'unchecked'</code> when selection is disabled.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">toggleSelection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">toggleSelection(node: T): void</td>
              <td class="px-4 py-2 text-fg-muted">Toggles selection for a node, cascading to descendants in multiple mode; no-op when selection is disabled.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TreeNodeDefDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TreeNodeDefDirective&lt;T&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twTreeNode] (structural)</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Declares the per-node template via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twTreeNode="let node"</code>.
        The template receives a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwTreeNodeContext&lt;T&gt;</code>
        with the following members.
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
              <td class="px-4 py-2 font-mono text-xs">$implicit / node</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">T</td>
              <td class="px-4 py-2 text-fg-muted">The node data, available as <code class="font-mono">let-node</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">level</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 text-fg-muted">Zero-based depth of the node.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">expanded</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 text-fg-muted">Whether the node is currently expanded.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hasChildren</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 text-fg-muted">Whether the node is a branch.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectionState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTreeSelectionState</td>
              <td class="px-4 py-2 text-fg-muted">Tri-state selection status of the node.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">toggle / expand / collapse</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Action functions for this node's expansion state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">toggleSelection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Toggles this node's selection (cascades in multiple mode).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TreeNodeToggleDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TreeNodeToggleDirective&lt;T&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twTreeNodeToggle]</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">twTreeNodeToggle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">T</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">required</td>
              <td class="px-4 py-2 text-fg-muted">The node whose expansion this control toggles on click.</td>
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
export class TreeApi {
  protected readonly typesSnippet = `interface TwTreeSelectionConfig {
  /** 'none' | 'single' | 'multiple'. Defaults to 'none'. */
  mode: 'none' | 'single' | 'multiple';
  /** Cascade parent → leaf descendants (multiple mode). Defaults to true. */
  cascade?: boolean;
  /** Pre-selected node keys (leaf keys in cascade mode). Defaults to []. */
  initialKeys?: readonly unknown[];
}

interface TwTreeDisplayConfig {
  /** Row density. Defaults to 'md'. */
  size?: TwSize;
  /** Indentation per level, in px. Defaults to 16. */
  indent?: number;
  /** Render per-level connector guide lines. Defaults to false. */
  showLines?: boolean;
}

type TwTreeSelectionState = 'checked' | 'unchecked' | 'indeterminate';

interface TwTreeNodeContext<T> {
  $implicit: T;
  node: T;
  level: number;
  expanded: boolean;
  hasChildren: boolean;
  selectionState: TwTreeSelectionState;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
  toggleSelection: () => void;
}`;
}
