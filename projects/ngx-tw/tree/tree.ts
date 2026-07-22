/*
 * tw-tree — hierarchical, keyboard-navigable tree-view wrapping Angular CDK's
 * `CdkTree` (children-accessor model). CDK owns flattening, the expansion model,
 * ARIA wiring (`role="tree"`/`"treeitem"`, `aria-level`/`-setsize`/`-posinset`/
 * `-expanded`) and roving-tabindex keyboard navigation; this component owns the
 * row wrapper, per-level indentation, optional connector lines, optional
 * (consumer-rendered) selection, and a typed per-node template context.
 *
 * Architecture decisions (verified against @angular/cdk 21.2.x source):
 *  - Children-accessor render path only. `treeControl` / `FlatTreeControl` /
 *    `NestedTreeControl` are @deprecated in CDK v21 and are NOT used. Flat
 *    `cdk-tree-node` + a single `*cdkTreeNodeDef` (not `cdkNestedTreeNode`).
 *  - `[isExpandable]` MUST be bound per node. Without a `treeControl`,
 *    `CdkTreeNode._isExpandable()` returns the `isExpandable` *input* (default
 *    `false`); unbound, branches get no `aria-expanded`, `expand()/collapse()`
 *    no-op, and arrow-key expansion is dead. We bind it from `hasChildren(node)`.
 *  - `CdkTreeNode.isLeafNode` is unusable here: with no `treeControl` its getter
 *    short-circuits the optional-chain to `undefined` and returns `false` for
 *    EVERY node (silently — no throw). We compute `hasChildren` ourselves.
 *  - Selection is OURS, not CDK tree's (CDK's model is expansion-only). It lives
 *    in a `signal<ReadonlySet<unknown>>` of node keys — a signal (not CDK's
 *    `SelectionModel`) so it integrates with OnPush + `computed()` without
 *    bridging an RxJS `changed` stream. NOT a form control (no CVA).
 *  - Expansion is bidirectionally synced with the `expandedKeys` model:
 *    model→CDK via a guarded `effect()` (CDK's `select`/`deselect` are
 *    idempotent → settles in one tick); CDK→model via each node's
 *    `(expandedChange)` output with compare-before-write (no signal cycle).
 */

import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  type TrackByFunction,
  untracked,
  viewChild,
} from '@angular/core';
import { type CdkTree, CdkTreeModule } from '@angular/cdk/tree';
import { tv } from 'tailwind-variants';
import type { TwSize } from '@cdevhub/ngx-tw/core';

// ── Public types ─────────────────────────────────────────────────────

/** Tri-state selection status of a tree node. */
export type TwTreeSelectionState = 'checked' | 'unchecked' | 'indeterminate';

/** Configuration for node selection behavior. Pass any subset; unset keys fall back to the defaults. */
export interface TwTreeSelectionConfig {
  /** Selection mode. `'single'` is scalar (one node, no cascade/indeterminate); `'multiple'` supports cascade + tri-state. `'none'` disables selection. Defaults to `'none'`. */
  mode: 'none' | 'single' | 'multiple';
  /** In `'multiple'` mode, selecting a branch selects all its leaf descendants and a branch renders `'indeterminate'` when only some are selected. Ignored in `'single'`/`'none'`. Defaults to `true`. */
  cascade?: boolean;
  /** Pre-selected node keys (matched via `trackBy`). In cascade mode these are leaf-node keys. Defaults to `[]`. */
  initialKeys?: readonly unknown[];
}

/** Display configuration for the tree. Pass any subset; unset keys fall back to the defaults. */
export interface TwTreeDisplayConfig {
  /** Row vertical density. Defaults to `'md'`. */
  size?: TwSize;
  /** Indentation per level, in pixels. Defaults to `16`. */
  indent?: number;
  /** Render connecting guide lines down the indent gutter. Defaults to `false`. */
  showLines?: boolean;
}

/** Context surfaced to a `*twTreeNode` template. Generic over the node type `T`. */
export interface TwTreeNodeContext<T> {
  /** The node data (implicit `let-node`). */
  $implicit: T;
  /** The node data, aliased for readability. */
  node: T;
  /** Zero-based depth of the node. */
  level: number;
  /** Whether the node is currently expanded. Always `false` for leaf nodes. */
  expanded: boolean;
  /** Whether the node has children (is a branch, not a leaf). */
  hasChildren: boolean;
  /** Tri-state selection status of this node. `'unchecked'` when selection is disabled. */
  selectionState: TwTreeSelectionState;
  /** Toggles this node's expand/collapse state. No-op on leaf nodes. */
  toggle: () => void;
  /** Expands this node. No-op on leaf nodes or when already expanded. */
  expand: () => void;
  /** Collapses this node. No-op when already collapsed. */
  collapse: () => void;
  /** Toggles this node's selection (cascades in `'multiple'` mode with `cascade` on). No-op when selection is disabled. */
  toggleSelection: () => void;
}

// ── Resolved-default constants ───────────────────────────────────────

const SELECTION_DEFAULTS: Required<TwTreeSelectionConfig> = {
  mode: 'none',
  cascade: true,
  initialKeys: [],
};

const DISPLAY_DEFAULTS: Required<TwTreeDisplayConfig> = {
  size: 'md',
  indent: 16,
  showLines: false,
};

// ── tv() config ──────────────────────────────────────────────────────
//
// Indentation is rendered with one spacer span per ancestor level (width =
// `indent` px) rather than a single inline `padding-left`: this avoids an
// inline-style-vs-class left-padding conflict and lets `showLines` draw a
// per-level vertical guide (`border-s` on each stretched spacer) instead of a
// single root rail. `items-stretch` on the row makes spacers span the full row
// height so guides connect across stacked rows; the content wrapper re-centers
// the projected template vertically.

const treeVariants = tv(
  {
    slots: {
      root: 'block',
      node: 'group/node flex items-stretch rounded-md cursor-pointer select-none text-sm text-fg pe-2 transition-colors duration-200 motion-reduce:transition-none hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      spacer: 'shrink-0 self-stretch',
      content: 'flex items-center gap-1.5 min-w-0 flex-1',
    },
    variants: {
      size: {
        xs: { content: 'py-0' },
        sm: { content: 'py-0.5' },
        md: { content: 'py-1' },
        lg: { content: 'py-1.5' },
        xl: { content: 'py-2' },
      },
      selected: {
        true: { node: 'bg-primary-50 text-primary-700 hover:bg-primary-50' },
        false: {},
      },
      lines: {
        true: { spacer: 'border-s border-border' },
        false: {},
      },
    },
    defaultVariants: {
      size: 'md',
      selected: false,
      lines: false,
    },
  },
  { twMerge: true },
);

// ── TreeNodeDefDirective ─────────────────────────────────────────────
//
// Pure TemplateRef carrier for the consumer's per-node template. Mirrors
// table's `CellDefDirective`: a typed context + `ngTemplateContextGuard` so
// `let-node` / `let-expanded="expanded"` etc. type-check inside the template.

/** Structural directive (`*twTreeNode="let node"`) declaring the per-node template. Typed as `TwTreeNodeContext<T>`. */
@Directive({ selector: '[twTreeNode]' })
export class TreeNodeDefDirective<T = unknown> {
  /** @internal Consumer-projected per-node template. */
  readonly template = inject(TemplateRef<TwTreeNodeContext<T>>);

  /** @internal */
  static ngTemplateContextGuard<T>(
    _dir: TreeNodeDefDirective<T>,
    _ctx: unknown,
  ): _ctx is TwTreeNodeContext<T> {
    return true;
  }
}

// ── TreeComponent ────────────────────────────────────────────────────

/**
 * A hierarchical, keyboard-navigable tree-view wrapping `@angular/cdk/tree`
 * (children-accessor model). Consumers supply the per-node template via the
 * `*twTreeNode` structural directive and receive a typed context exposing the
 * node, its depth/expansion/children flags, its selection state, and action
 * functions (`toggle`, `expand`, `collapse`, `toggleSelection`).
 *
 * Selection is optional and managed internally (`'none' | 'single' | 'multiple'`).
 * In `'multiple'` mode with `cascade`, selecting a branch selects all its leaf
 * descendants and the branch reports `'indeterminate'` when partially selected.
 * This is NOT a form control — selection is exposed via the `selectionChange`
 * output and the public `toggleSelection` / `selectionState` methods.
 */
@Component({
  selector: 'tw-tree',
  exportAs: 'twTree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkTreeModule, NgTemplateOutlet],
  host: {
    '[class]': 'rootClasses()',
  },
  template: `
    <cdk-tree
      #cdkTreeRef
      role="tree"
      [dataSource]="dataArray()"
      [childrenAccessor]="cdkChildrenAccessor"
      [trackBy]="cdkTrackBy"
      [expansionKey]="cdkExpansionKey"
    >
      <cdk-tree-node
        *cdkTreeNodeDef="let node"
        #treeNode="cdkTreeNode"
        [class]="nodeClasses(node)"
        [isExpandable]="hasChildren(node)"
        [attr.aria-selected]="ariaSelected(node)"
        [attr.aria-checked]="ariaChecked(node)"
        (activation)="toggleSelection(node)"
        (expandedChange)="onCdkExpandedChange(node, $event)"
      >
        @for (marker of indentMarkers(treeNode.level); track $index) {
          <span [class]="spacerClasses()" [style.width.px]="indentWidth()"></span>
        }
        <span [class]="contentClasses()">
          <ng-container
            [ngTemplateOutlet]="nodeTemplate()?.template ?? null"
            [ngTemplateOutletContext]="buildContext(node, treeNode.level)"
          />
        </span>
      </cdk-tree-node>
    </cdk-tree>
  `,
})
export class TreeComponent<T = unknown> {
  // ── Inputs (5 — at the cap, do not add more) ──

  /** Root nodes of the tree. Each node's children are resolved via `childrenAccessor`. Defaults to `[]`. */
  readonly data = input<readonly T[]>([]);

  /** Resolves a node's direct children; return an empty array for leaf nodes. Required. */
  readonly childrenAccessor = input.required<(node: T) => readonly T[]>();

  /** Identifies a node across data changes and keys both expansion and selection state. When unset, node identity is used. */
  readonly trackBy = input<(node: T) => unknown>();

  /** Node-selection behavior — `mode`, `cascade`, `initialKeys`. Accepts a partial; unset keys fall back to the defaults. Defaults to selection disabled. */
  readonly selection = input<Partial<TwTreeSelectionConfig>>({});

  /** Display configuration — `size`, `indent`, `showLines`. Accepts a partial; unset keys fall back to the defaults. */
  readonly display = input<Partial<TwTreeDisplayConfig>>({});

  // ── Model (two-way) ──

  /** Two-way bound list of expansion key values (resolved via `trackBy`) for currently-expanded nodes. Set a new array on every change; do not mutate in place. Changes when a node is expanded or collapsed. Defaults to `[]` (all collapsed). */
  readonly expandedKeys = model<readonly unknown[]>([]);

  // ── Outputs ──

  /** Fires after the selection changes by user interaction. Payload is every node whose `selectionState` is `'checked'` (selected leaves plus fully-checked branches in cascade mode). */
  readonly selectionChange = output<readonly T[]>();

  /** Fires after a node is expanded or collapsed by user interaction. Payload identifies the node and its new expansion state. */
  readonly expandedChange = output<{ node: T; expanded: boolean }>();

  // ── Content / view queries ──

  /** @internal Consumer-projected per-node template (`*twTreeNode`). */
  readonly nodeTemplate = contentChild(TreeNodeDefDirective<T>);

  /** @internal The CDK tree inside our view. */
  private readonly cdkTree = viewChild.required<CdkTree<T>>('cdkTreeRef');

  // ── Internal selection state ──

  /** @internal Selected node keys. In cascade mode this holds leaf keys only; branch state is derived. */
  private readonly selectedKeys = signal<ReadonlySet<unknown>>(new Set());

  /** @internal One-shot guard so `initialKeys` seeds selection exactly once. */
  private seeded = false;

  // ── Resolved config ──

  /** @internal Resolved selection configuration. */
  private readonly resolvedSelection = computed<Required<TwTreeSelectionConfig>>(() => ({
    ...SELECTION_DEFAULTS,
    ...this.selection(),
  }));

  /** @internal Resolved display configuration. */
  private readonly resolvedDisplay = computed<Required<TwTreeDisplayConfig>>(() => ({
    ...DISPLAY_DEFAULTS,
    ...this.display(),
  }));

  /** @internal Indentation width in px per level. */
  readonly indentWidth = computed(() => this.resolvedDisplay().indent);

  /** @internal Snapshot of the root nodes as a mutable array (CDK's `dataSource` rejects `readonly T[]`). */
  readonly dataArray = computed<T[]>(() => [...this.data()]);

  // ── Variant class outputs ──

  private readonly variants = computed(() =>
    treeVariants({
      size: this.resolvedDisplay().size,
      lines: this.resolvedDisplay().showLines,
    }),
  );

  readonly rootClasses = computed(() => this.variants().root());
  readonly spacerClasses = computed(() => this.variants().spacer());
  readonly contentClasses = computed(() => this.variants().content());

  constructor() {
    // Seed selection from `initialKeys` exactly once — the first time selection
    // is enabled (`mode !== 'none'`), so the seed survives a config that arrives
    // after the initial change-detection pass. Reads `selection()` (tracked) and
    // writes `selectedKeys` (untracked, and never track-read here) → no cycle.
    effect(() => {
      const config = this.resolvedSelection();
      if (this.seeded || config.mode === 'none') return;
      this.seeded = true;
      untracked(() => this.selectedKeys.set(new Set(config.initialKeys)));
    });

    // model → CDK expansion sync. Reads `expandedKeys()` / `data()` /
    // `childrenAccessor()` (tracked) and writes ONLY to CDK's expansion model
    // (`expand`/`collapse` are idempotent — they `select`/`deselect` a key and
    // no-op when unchanged), never to a tracked signal → settles in one tick.
    effect(() => {
      const tree = this.cdkTree();
      const wanted = new Set(this.expandedKeys());
      const all = this.flattenAll();
      if (!tree) return;
      untracked(() => {
        for (const node of all) {
          const key = this.keyOf(node);
          const isOpen = tree.isExpanded(node);
          if (wanted.has(key) && !isOpen) tree.expand(node);
          else if (!wanted.has(key) && isOpen) tree.collapse(node);
        }
      });
    });
  }

  // ── Key + traversal helpers ──

  /** @internal Resolves a node's identity key via `trackBy`, falling back to the node itself. */
  private keyOf(node: T): unknown {
    const tb = this.trackBy();
    return tb ? tb(node) : node;
  }

  /** @internal Direct children of a node (always a fresh mutable array). */
  private childrenOf(node: T): readonly T[] {
    return this.childrenAccessor()(node);
  }

  /** Whether the node has at least one child (is a branch). */
  hasChildren(node: T): boolean {
    return this.childrenOf(node).length > 0;
  }

  /** @internal Depth-first list of every node in the tree (under collapsed parents too). */
  private flattenAll(): T[] {
    const out: T[] = [];
    const walk = (nodes: readonly T[]): void => {
      for (const n of nodes) {
        out.push(n);
        walk(this.childrenOf(n));
      }
    };
    walk(this.data());
    return out;
  }

  /** @internal All leaf descendants of a node (the node itself if it is a leaf). */
  private leavesOf(node: T): T[] {
    const out: T[] = [];
    const walk = (n: T): void => {
      const children = this.childrenOf(n);
      if (children.length === 0) {
        out.push(n);
        return;
      }
      for (const child of children) walk(child);
    };
    walk(node);
    return out;
  }

  // ── Template helpers ──

  /** @internal Array of length `level` used to render per-level indent spacers. */
  indentMarkers(level: number): readonly number[] {
    return level > 0 ? Array.from({ length: level }) : [];
  }

  /** @internal Per-node row classes (incorporates the selected state). */
  nodeClasses(node: T): string {
    return treeVariants({
      size: this.resolvedDisplay().size,
      lines: this.resolvedDisplay().showLines,
      selected: this.selectionState(node) === 'checked',
    }).node();
  }

  /** @internal Builds the typed context handed to the consumer's `*twTreeNode` template. */
  buildContext(node: T, level: number): TwTreeNodeContext<T> {
    return {
      $implicit: node,
      node,
      level,
      expanded: this.isExpanded(node),
      hasChildren: this.hasChildren(node),
      selectionState: this.selectionState(node),
      toggle: () => this.toggle(node),
      expand: () => this.expand(node),
      collapse: () => this.collapse(node),
      toggleSelection: () => this.toggleSelection(node),
    };
  }

  /**
   * @internal `aria-selected` for `'single'` mode (boolean selection), or `null`
   * otherwise. Multiple mode uses `aria-checked` instead so the tri-state
   * `'mixed'` value is exposed to assistive tech on the focusable treeitem.
   */
  ariaSelected(node: T): 'true' | 'false' | null {
    if (this.resolvedSelection().mode !== 'single') return null;
    return this.selectionState(node) === 'checked' ? 'true' : 'false';
  }

  /**
   * @internal Tri-state `aria-checked` for `'multiple'` mode (`'mixed'` for a
   * partially-selected branch), or `null` otherwise. APG exposes checkbox-tree
   * selection on the treeitem via `aria-checked`; `aria-selected` cannot carry
   * the indeterminate state.
   */
  ariaChecked(node: T): 'true' | 'false' | 'mixed' | null {
    if (this.resolvedSelection().mode !== 'multiple') return null;
    const state = this.selectionState(node);
    if (state === 'checked') return 'true';
    if (state === 'indeterminate') return 'mixed';
    return 'false';
  }

  // ── CDK boundary adapters (stable arrow fields) ──

  /** @internal Adapts the consumer's `readonly`-returning accessor to CDK's mutable-array contract. */
  readonly cdkChildrenAccessor = (node: T): T[] => [...this.childrenOf(node)];

  /** @internal CDK row-tracking function keyed via `trackBy`. */
  readonly cdkTrackBy: TrackByFunction<T> = (_index, node) => this.keyOf(node);

  /** @internal Keys CDK's expansion model via `trackBy`. */
  readonly cdkExpansionKey = (node: T): unknown => this.keyOf(node);

  // ── Expansion ──

  /** Whether the node is currently expanded. */
  isExpanded(node: T): boolean {
    return this.cdkTree().isExpanded(node);
  }

  /** Expands the node if collapsed. Emits `expandedChange` and updates `expandedKeys` via the CDK callback. */
  expand(node: T): void {
    this.cdkTree().expand(node);
  }

  /** Collapses the node if expanded. Emits `expandedChange` and updates `expandedKeys` via the CDK callback. */
  collapse(node: T): void {
    this.cdkTree().collapse(node);
  }

  /** Toggles the node's expand/collapse state. No-op on leaf nodes. */
  toggle(node: T): void {
    if (!this.hasChildren(node)) return;
    this.cdkTree().toggle(node);
  }

  /**
   * @internal Bridges CDK's per-node `(expandedChange)` to the `expandedKeys`
   * model. Compare-before-write: only mutates the model and emits when the
   * key's membership actually changes, so the model→CDK effect cannot loop.
   */
  onCdkExpandedChange(node: T, expanded: boolean): void {
    const key = this.keyOf(node);
    const current = new Set(this.expandedKeys());
    const has = current.has(key);
    if (expanded && !has) {
      current.add(key);
      this.expandedKeys.set([...current]);
      this.expandedChange.emit({ node, expanded: true });
    } else if (!expanded && has) {
      current.delete(key);
      this.expandedKeys.set([...current]);
      this.expandedChange.emit({ node, expanded: false });
    }
  }

  // ── Selection ──

  /**
   * Returns the tri-state selection status of a node. `'unchecked'` when
   * selection is disabled.
   *
   * For cascade branches this walks the node's leaf descendants on each call and
   * is invoked a few times per node per change-detection pass (row class, ARIA,
   * context). This assumes small-to-medium trees; the component has no
   * virtualization and is not tuned for very large data sets.
   */
  selectionState(node: T): TwTreeSelectionState {
    const mode = this.resolvedSelection().mode;
    if (mode === 'none') return 'unchecked';

    const selected = this.selectedKeys();
    if (mode === 'single') {
      return selected.has(this.keyOf(node)) ? 'checked' : 'unchecked';
    }

    // multiple
    if (!this.resolvedSelection().cascade || !this.hasChildren(node)) {
      return selected.has(this.keyOf(node)) ? 'checked' : 'unchecked';
    }

    // cascade branch: derive from leaf descendants
    const leaves = this.leavesOf(node);
    if (leaves.length === 0) return 'unchecked';
    let selectedCount = 0;
    for (const leaf of leaves) {
      if (selected.has(this.keyOf(leaf))) selectedCount++;
    }
    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === leaves.length) return 'checked';
    return 'indeterminate';
  }

  /** Toggles selection for a node (cascades to leaf descendants in `'multiple'` mode with `cascade` on). No-op when `selection.mode === 'none'`. */
  toggleSelection(node: T): void {
    const config = this.resolvedSelection();
    if (config.mode === 'none') return;

    const next = new Set(this.selectedKeys());
    const key = this.keyOf(node);

    if (config.mode === 'single') {
      const wasSelected = next.has(key);
      next.clear();
      if (!wasSelected) next.add(key);
    } else if (!config.cascade || !this.hasChildren(node)) {
      if (next.has(key)) next.delete(key);
      else next.add(key);
    } else {
      // cascade branch: select all leaf descendants unless already fully checked
      const fullyChecked = this.selectionState(node) === 'checked';
      for (const leaf of this.leavesOf(node)) {
        const leafKey = this.keyOf(leaf);
        if (fullyChecked) next.delete(leafKey);
        else next.add(leafKey);
      }
    }

    this.selectedKeys.set(next);
    this.selectionChange.emit(this.selectedNodes());
  }

  /** @internal Every node currently reporting `selectionState() === 'checked'`. */
  private selectedNodes(): readonly T[] {
    if (this.resolvedSelection().mode === 'none') return [];
    return this.flattenAll().filter((node) => this.selectionState(node) === 'checked');
  }
}

// ── TreeNodeToggleDirective ──────────────────────────────────────────
//
// Optional low-ceremony toggle: `<button twTreeNodeToggle [twTreeNodeToggle]="node">`.
// It injects the host `TreeComponent` (an ancestor at the consumer's declaration
// site) and calls `tree.toggle(node)` on click. It deliberately does NOT extend
// CDK's `CdkTreeNodeToggle`, which injects `CdkTreeNode` — that node lives inside
// TreeComponent's own view and is unreachable from a projected `*twTreeNode`
// template (DI resolves at the declaration site, not the insertion site). For
// most cases the context `toggle()` function is simpler.

/** Attribute directive (`[twTreeNodeToggle]="node"`) that toggles the given node's expansion on click. */
@Directive({
  selector: '[twTreeNodeToggle]',
  host: {
    '(click)': 'onClick($event)',
  },
})
export class TreeNodeToggleDirective<T = unknown> {
  private readonly tree = inject(TreeComponent<T>);

  /** The node whose expansion this control toggles. */
  readonly node = input.required<T>({ alias: 'twTreeNodeToggle' });

  /** @internal Toggles the node and stops the click from bubbling to row activation. */
  onClick(event: Event): void {
    event.stopPropagation();
    this.tree.toggle(this.node());
  }
}
