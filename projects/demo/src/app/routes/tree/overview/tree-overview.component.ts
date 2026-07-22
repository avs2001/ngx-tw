import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TreeComponent, TreeNodeDefDirective } from '@cdevhub/ngx-tw/tree';
import { IconComponent } from '@cdevhub/ngx-tw/icon';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

interface FileNode {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly FileNode[];
}

const PROJECT: readonly FileNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'app',
        label: 'app',
        children: [
          { id: 'app.ts', label: 'app.ts' },
          { id: 'app.routes.ts', label: 'app.routes.ts' },
        ],
      },
      { id: 'main.ts', label: 'main.ts' },
      { id: 'styles.css', label: 'styles.css' },
    ],
  },
  {
    id: 'public',
    label: 'public',
    children: [{ id: 'favicon.ico', label: 'favicon.ico' }],
  },
  { id: 'package.json', label: 'package.json' },
];

@Component({
  selector: 'app-tree-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TreeComponent, TreeNodeDefDirective, IconComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Tree component renders nested data as an accessible, keyboard-navigable
        tree-view implementing the WAI-ARIA Tree pattern. It composes Angular CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkTree</code>
        (children-accessor model) for flattening, expansion, ARIA wiring, and roving
        tabindex, while you supply the per-node appearance through the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twTreeNode</code>
        template. Selection is optional — disabled by default, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'single'</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'multiple'</code>
        with parent-to-child cascade and tri-state branches.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The inner element carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="tree"</code>
        and each node is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="treeitem"</code>
        with CDK-managed
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-level</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-setsize</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-posinset</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>.
        The tree is a single tab stop; arrow keys rove a managed tabindex between
        visible nodes. In single-select mode the focused node exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-selected</code>;
        in multiple-select mode it exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-checked</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">"mixed"</code>
        for partially-selected branches. Interactive elements inside a node template
        (chevrons, checkboxes) should set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex="-1"</code>
        so the row stays the single tab stop.
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
              <td class="px-4 py-2 font-mono text-xs">ArrowDown / ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the next or previous visible node.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Expands a collapsed branch, or moves to its first child when already expanded.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft</td>
              <td class="px-4 py-2 text-fg-muted">Collapses an expanded branch, or moves to the parent when already collapsed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the first or last visible node.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Activates the focused node, toggling its selection when selection is enabled.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">A–Z, 0–9</td>
              <td class="px-4 py-2 text-fg-muted">Type-ahead — moves focus to the next visible node whose label starts with the typed characters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tree
          [data]="project"
          [childrenAccessor]="childrenOf"
          [trackBy]="trackById"
          [(expandedKeys)]="expanded"
          class="block max-w-xs"
        >
          <ng-template
            twTreeNode
            let-node
            let-hasChildren="hasChildren"
            let-isExpanded="expanded"
            let-toggle="toggle"
          >
            @if (hasChildren) {
              <button
                type="button"
                tabindex="-1"
                class="flex size-5 shrink-0 items-center justify-center rounded text-fg-muted hover:bg-surface-muted"
                [attr.aria-label]="isExpanded ? 'Collapse' : 'Expand'"
                (click)="toggle()"
              >
                <tw-icon
                  name="chevron-right"
                  size="xs"
                  class="transition-transform duration-200 motion-reduce:transition-none"
                  [class.rotate-90]="isExpanded"
                />
              </button>
            } @else {
              <span class="size-5 shrink-0"></span>
            }
            <span>{{ $any(node).label }}</span>
          </ng-template>
        </tw-tree>
      </div>
      <tw-code-block [code]="basicUsageHtmlSnippet" language="html" />
      <tw-code-block [code]="basicUsageTsSnippet" language="ts" class="mt-3 block" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Nested data via a single
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">childrenAccessor</code>
          function — no flat-list bookkeeping
        </li>
        <li>Fully templated nodes through
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twTreeNode</code>
          with a typed context (node, level, expanded, hasChildren, selectionState, actions)
        </li>
        <li>Optional selection:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'none'</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'single'</code>, or
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'multiple'</code>
        </li>
        <li>Parent-to-child cascade with tri-state
          (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">indeterminate</code>) branches
        </li>
        <li>Two-way
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">expandedKeys</code>
          for controlled expansion
        </li>
        <li>WAI-ARIA Tree pattern with full roving-tabindex keyboard navigation</li>
        <li>Per-level indentation with optional connector guide lines</li>
        <li>Density via the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display.size</code>
          config (shared
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwSize</code>)
        </li>
        <li>Built on
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#64;angular/cdk/tree</code>
          — not a form control, no
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/accordion" class="text-primary-600 hover:underline">Accordion</a>
          — single-level expand/collapse panels rather than a nested hierarchy.
        </li>
        <li>
          <a routerLink="/components/table" class="text-primary-600 hover:underline">Table</a>
          — tabular data with flat-row expansion instead of arbitrary nesting.
        </li>
        <li>
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — a flat listbox in an overlay for choosing from options.
        </li>
      </ul>
    </section>
  `,
})
export class TreeOverview {
  protected readonly project = PROJECT;
  protected readonly expanded = signal<readonly unknown[]>(['src', 'app']);

  protected readonly childrenOf = (node: FileNode): readonly FileNode[] => node.children ?? [];
  protected readonly trackById = (node: FileNode): unknown => node.id;

  protected readonly basicUsageHtmlSnippet = `<tw-tree
  [data]="project"
  [childrenAccessor]="childrenOf"
  [trackBy]="trackById"
  [(expandedKeys)]="expanded"
>
  <ng-template
    twTreeNode
    let-node
    let-hasChildren="hasChildren"
    let-isExpanded="expanded"
    let-toggle="toggle"
  >
    @if (hasChildren) {
      <button type="button" tabindex="-1" (click)="toggle()"
              [attr.aria-label]="isExpanded ? 'Collapse' : 'Expand'">
        <tw-icon name="chevron-right" size="xs" [class.rotate-90]="isExpanded" />
      </button>
    } @else {
      <span class="size-5"></span>
    }
    <span>{{ $any(node).label }}</span>
  </ng-template>
</tw-tree>`;

  protected readonly basicUsageTsSnippet = `interface FileNode {
  id: string;
  label: string;
  children?: FileNode[];
}

protected readonly project: FileNode[] = [/* … */];
protected readonly expanded = signal<unknown[]>(['src', 'app']);
protected readonly childrenOf = (n: FileNode) => n.children ?? [];
protected readonly trackById = (n: FileNode) => n.id;`;

  protected readonly importSnippet = `import {
  TreeComponent,
  TreeNodeDefDirective,
  TreeNodeToggleDirective,
} from '@cdevhub/ngx-tw/tree';`;
}
