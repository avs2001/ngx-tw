# Prompt: Build `tw-tree` for ngx-tw

## Context

Read before starting:

- `.claude/CLAUDE.md` — all conventions (signals, `host` bindings, `tv()` + `twMerge`, semantic tokens, Visual Design System, input-count cap, test rules). This component is **NOT** on the input-count exception list — hold to ≤ 5 inputs by routing knobs into config objects.
- `projects/ngx-tw/table/table.ts` — the canonical reference for this build. Copy these patterns: config-object inputs merged with `*_DEFAULTS` constants via `computed()`; template directives that carry a `TemplateRef` with a typed context + `ngTemplateContextGuard`; rendering a CDK collection via `NgTemplateOutlet`; **action functions exposed on the template context** (`TwRowExpansionContext.collapse`, table.ts:287); the tri-state `masterSelectionState` computed; bridging signal state into a CDK component inside guarded `effect()`s with `untracked()` writes.
- `projects/ngx-tw/table/index.ts` and `projects/ngx-tw/table/ng-package.json` — entry-point shape.
- `projects/ngx-tw/carousel.ts` `activeIndex` clamp — the canonical `untracked()`-write-inside-effect precedent for breaking signal cycles.
- `node_modules/@angular/cdk/types/tree.d.ts` — the CDK API you are composing. Read `CdkTree`, `CdkTreeNode` (note its public getters `level`, `isExpanded`, `isLeafNode`, `isExpandable` and `exportAs: "cdkTreeNode"`), `CdkTreeNodeDef`, and the `(expandedChange)` output on `CdkTreeNode`.

CDK modules to import: `@angular/cdk/tree` (`CdkTreeModule` — or the individual `CdkTree`, `CdkTreeNode`, `CdkTreeNodeDef`), `@angular/cdk/collections` (`SelectionModel`). Also `NgTemplateOutlet` from `@angular/common`.

> **CDK architecture — read this twice.** Use `<cdk-tree>` with the **`childrenAccessor`** input and **plain `cdk-tree-node`** elements (the modern, non-deprecated path). CDK flattens the nested data into a single DOM list, computes `aria-level` / `aria-setsize` / `aria-posinset`, drives expansion via its internal `SelectionModel`, and roves a `TreeKeyManager` over the flat list. **Do NOT use `cdkNestedTreeNode` or `cdkTreeNodeOutlet`** — those are the nested-DOM render path we are not taking; importing them will mislead the build. **Do NOT touch `treeControl`, `FlatTreeControl`, or `NestedTreeControl`** — all three are `@deprecated` / `@breaking-change 21.0.0` in CDK v21.

## What to build

A hierarchical, collapsible **tree-view** component, `tw-tree` (class `TreeComponent<T>`), that renders nested data as an accessible, keyboard-navigable tree following the WAI-ARIA APG Tree pattern. It composes Angular CDK's `CdkTree` (children-accessor model) for flattening, expansion, ARIA wiring, and roving-tabindex keyboard navigation. Consumers supply the per-node template via a structural directive `*twTreeNode`, so node appearance is fully in their hands while the tree owns indentation, the expand/collapse toggle affordance, optional checkboxes, and keyboard behavior.

Selection is **optional** and managed internally with a `SelectionModel` from `@angular/cdk/collections` (this is *separate* from CDK tree's expansion model). In `'multiple'` mode selecting a parent cascades to all descendants and a parent renders `indeterminate` when only some descendants are selected. This is **not** a form control — no `ControlValueAccessor`; selection is exposed through an output and public methods.

## API design

Three exported artifacts: `TreeComponent` (`tw-tree`), `TreeNodeDefDirective` (`*twTreeNode`), `TreeNodeToggleDirective` (`[twTreeNodeToggle]`).

### `TreeComponent<T>` inputs (5 — at the cap, do not add more)

```typescript
/** Root nodes of the tree. Each node's children are resolved via `childrenAccessor`. Defaults to `[]`. */
data = input<readonly T[]>([]);

/** Resolves a node's direct children. Return an empty array for leaf nodes. Adapted to CdkTree's `childrenAccessor` at the CDK boundary (see notes). */
childrenAccessor = input.required<(node: T) => readonly T[]>();

/** Identifies a node across data changes and keys both expansion and selection state. When unset, node identity is used. */
trackBy = input<(node: T) => unknown>();

/** Node-selection behavior — `mode`, `cascade`, `initialKeys`. Accepts a partial; unset keys fall back to the defaults. Defaults to selection disabled (`mode: 'none'`). */
selection = input<Partial<TwTreeSelectionConfig>>({});

/** Display configuration — `size`, `indent`, `showLines`. Accepts a partial; unset keys fall back to the defaults. */
display = input<Partial<TwTreeDisplayConfig>>({});
```

### `TreeComponent<T>` model (two-way)

```typescript
/** Two-way bound list of expansion key values (resolved via `trackBy`) for currently-expanded nodes. Set a new array on every change; do not mutate in place. Changes when a node is expanded or collapsed by the user or programmatically. Defaults to `[]` (all collapsed). */
expandedKeys = model<readonly unknown[]>([]);
```

### `TreeComponent<T>` outputs

```typescript
/** Fires after the selection changes by user interaction. Payload is the full list of currently-selected nodes. */
selectionChange = output<readonly T[]>();

/** Fires after a node is expanded or collapsed. Payload identifies the node and its new expansion state. */
expandedChange = output<{ node: T; expanded: boolean }>();
```

### `TreeComponent<T>` public methods

```typescript
/** Toggles selection for a node (and cascades to descendants in `'multiple'` mode with `cascade` on). No-op when `selection.mode === 'none'`. */
toggleSelection(node: T): void;

/** Returns the tri-state selection status of a node: `'checked'`, `'unchecked'`, or `'indeterminate'`. */
selectionState(node: T): 'checked' | 'unchecked' | 'indeterminate';

/** Whether the node is currently expanded. */
isExpanded(node: T): boolean;

/** Expands the node if collapsed; emits `expandedChange` and updates `expandedKeys`. */
expand(node: T): void;

/** Collapses the node if expanded; emits `expandedChange` and updates `expandedKeys`. */
collapse(node: T): void;
```

### Config object types (Tw-prefixed; export from `index.ts`)

```typescript
/** Configuration for node selection behavior. */
export interface TwTreeSelectionConfig {
  /** Selection mode. `'single'` is scalar; `'multiple'` supports cascade + indeterminate. Defaults to `'none'`. */
  mode: 'none' | 'single' | 'multiple';
  /** In `'multiple'` mode, selecting a parent selects all descendants and parent state reflects descendants. Defaults to `true`. */
  cascade?: boolean;
  /** Pre-selected node keys (matched via `trackBy`). Defaults to `[]`. */
  initialKeys?: readonly unknown[];
}

/** Display configuration for the tree. */
export interface TwTreeDisplayConfig {
  /** Row vertical density. Shared `TwSize` type. Defaults to `'md'`. */
  size?: TwSize;
  /** Indentation per level, in pixels. Defaults to `16`. */
  indent?: number;
  /** Render connecting tree lines down the indent gutter. Defaults to `false`. */
  showLines?: boolean;
}
```

### `TreeNodeDefDirective<T>` (`*twTreeNode="let node"`)

Pure `TemplateRef` carrier — no logic. Injects `TemplateRef<TwTreeNodeContext<T>>`; declares a static `ngTemplateContextGuard` returning the typed context (copy `CellDefDirective` from table). Context shape:

```typescript
/** Context surfaced to a `*twTreeNode` template. */
export interface TwTreeNodeContext<T> {
  /** The node data (implicit `let-node`). */
  $implicit: T;
  /** Zero-based depth of the node. */
  level: number;
  /** Whether the node is currently expanded. */
  expanded: boolean;
  /** Whether the node has children (is a branch, not a leaf). */
  hasChildren: boolean;
  /** Tri-state selection status of this node (`'unchecked'` when selection is disabled). */
  selectionState: 'checked' | 'unchecked' | 'indeterminate';
  /** Toggles this node's expand/collapse state. */
  toggle: () => void;
  /** Expands this node. */
  expand: () => void;
  /** Collapses this node. */
  collapse: () => void;
  /** Toggles this node's selection (cascades in `'multiple'` mode; no-op when selection is disabled). */
  toggleSelection: () => void;
}
```

> **Why actions live on the context, not on a node-injecting directive.** The `*twTreeNode` template is declared in the *consumer's* view, so a directive inside it resolves DI from the **declaration** site, not the insertion site — it can inject `TreeComponent` (a declaration-site ancestor) but **cannot** inject the `CdkTreeNode` that lives inside `TreeComponent`'s own view. Exposing `toggle` / `toggleSelection` / `selectionState` as context fields (exactly like table's `TwRowExpansionContext.collapse`) is how node actions cross the projection boundary cleanly. Do **not** extend `CdkTreeNodeToggle`.

### `TreeNodeToggleDirective` (`[twTreeNodeToggle]="node"`)

Optional convenience attribute directive: place `[twTreeNodeToggle]="node"` on a button to toggle that node on click. It takes the **node as an input**, injects `TreeComponent`, and calls `tree.toggle(node)` from a `host` `(click)` binding. It does **not** extend or wrap `CdkTreeNodeToggle` (that directive injects `CdkTreeNode`, which is unreachable from a projected template — see the note above). For most cases the context `toggle()` function is simpler; this directive exists for consumers who prefer an attribute over a `(click)` handler.

## Usage examples

```html
<!-- Simplest: render a labelled node, no selection -->
<tw-tree [data]="roots" [childrenAccessor]="getChildren">
  <ng-template twTreeNode let-node>
    <button type="button" (click)="toggle()">{{ node.label }}</button>
  </ng-template>
</tw-tree>
```

```html
<!-- Branch chevron + leaf alignment driven by context -->
<tw-tree [data]="roots" [childrenAccessor]="getChildren">
  <ng-template
    twTreeNode
    let-node
    let-toggle="toggle"
    let-hasChildren="hasChildren"
    let-expanded="expanded"
  >
    @if (hasChildren) {
      <button type="button" (click)="toggle()" [attr.aria-label]="expanded ? 'Collapse' : 'Expand'"></button>
    }
    <span>{{ node.label }}</span>
  </ng-template>
</tw-tree>
```

```html
<!-- Multiple selection with cascade + tri-state checkboxes -->
<tw-tree
  [data]="roots"
  [childrenAccessor]="getChildren"
  [trackBy]="byId"
  [selection]="{ mode: 'multiple', cascade: true }"
  (selectionChange)="onSelectionChange($event)"
>
  <ng-template twTreeNode let-node let-state="selectionState" let-toggleSelection="toggleSelection">
    <tw-checkbox
      [checked]="state === 'checked'"
      [indeterminate]="state === 'indeterminate'"
      (change)="toggleSelection()"
    />
    {{ node.label }}
  </ng-template>
</tw-tree>
```

```html
<!-- Controlled expansion + display config (lines, larger rows) -->
<tw-tree
  [data]="roots"
  [childrenAccessor]="getChildren"
  [trackBy]="byId"
  [(expandedKeys)]="openKeys"
  [display]="{ size: 'lg', indent: 24, showLines: true }"
>
  <ng-template twTreeNode let-node>{{ node.label }}</ng-template>
</tw-tree>
```

## Styling

`tv()` config with `twMerge: true` and `defaultVariants`. Slots: `root`, `node` (the per-node row wrapper the component renders around the projected template), `spacer` (one per ancestor level), `content` (re-centres the projected template). The component does **not** render a chevron — the consumer renders the visible toggle via the context `toggle()` function or `[twTreeNodeToggle]` (option B; this keeps the prompt's usage examples valid). Indentation is rendered with one fixed-width `spacer` span per ancestor level (`width = indent` px) rather than a single inline `padding-left`: this avoids an inline-vs-class left-padding conflict and lets `showLines` draw a per-level guide.

- `root` — `block` (the inner `<cdk-tree>` carries `role="tree"`; the host wrapper stays neutral so consumers control sizing).
- `node` (base) — `flex items-stretch rounded-md cursor-pointer select-none text-sm text-fg pe-2 hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none` plus the focus ring `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`. (`items-stretch` so per-level spacers span the full row height and `showLines` guides connect across rows.)
- `content` — `flex items-center gap-1.5 min-w-0 flex-1`; the `size` variant drives its vertical padding (dense ramp): `xs` → `py-0`, `sm` → `py-0.5`, `md` → `py-1`, `lg` → `py-1.5`, `xl` → `py-2`. `size` is the shared `TwSize` type.
- Selected state (`single`/`multiple` fully-checked) — `bg-primary-50 text-primary-700`. Apply via the `selected` tv variant keyed on `selectionState(node) === 'checked'`.
- `spacer` — `shrink-0 self-stretch` with `[style.width.px]` per level; when `showLines` is on it gains `border-s border-border` (a per-level guide rail).

Use semantic + surface/fg/border tokens only. No raw palette colors. No component CSS file. All class strings literal so Tailwind v4 JIT picks them up (see table's static class-map note).

## Accessibility

- `role="tree"` lives on the inner `<cdk-tree>` element (CDK sets it). Each `cdk-tree-node` gets `role="treeitem"`, `aria-level`, `aria-setsize`, `aria-posinset`, and `aria-expanded` (for branches) automatically from CDK — do not duplicate or override these.
- Selection ARIA lives on the focusable treeitem (focus rides the row via roving tabindex, so AT lands there — not on the consumer's checkbox). `'single'` mode → `aria-selected` (`'true'`/`'false'`). `'multiple'` mode → `aria-checked` with the tri-state `'mixed'` for a partially-selected branch (`aria-selected` cannot carry indeterminate). `'none'` → neither attribute.
- The tree is a single tab stop with roving tabindex managed by CDK's `TreeKeyManager` (`_sendKeydownToKeyManager`). Do **not** add keyboard handlers on the `tw-tree` host. APG keys CDK provides:
  - Arrow Down / Up — next / previous visible node
  - Arrow Right — expand a collapsed branch, else move to first child
  - Arrow Left — collapse an expanded branch, else move to parent
  - Home / End — first / last visible node
  - Enter / Space — fire node activation (wire selection toggle to `CdkTreeNode.activation`, see notes)
- Every interactive node row shows a visible focus indicator via the canonical `focus-visible` outline ring. Must pass AXE and meet WCAG AA.

## Implementation notes

- **Inner `<cdk-tree>` is a real child element**, not a host directive — you cannot host-directive a component. Bind `[childrenAccessor]`, `[dataSource]="data()"`, `[trackBy]="trackBy()"`, and `[expansionKey]` (a function returning each node's key via `trackBy`, falling back to identity). The `role="tree"` and keyboard manager live on this element.
- **`childrenAccessor` type mismatch.** Your input is `(node: T) => readonly T[]`; CDK's `childrenAccessor` is `(node) => T[] | Observable<T[]>` and `readonly T[]` is not assignable to `T[]`. Adapt at the CDK boundary — wrap the consumer's function to return a mutable copy (`(n) => [...accessor(n)]`) when binding to `<cdk-tree>`.
- **Node template forwarding via the node instance, not the def context.** Inside `<cdk-tree-node *cdkTreeNodeDef="let node" #n="cdkTreeNode">`, read state from the exported `CdkTreeNode` instance (`exportAs: "cdkTreeNode"`) — `n.level`, `n.isExpanded`, `!n.isLeafNode`. Do **not** read `level` off the `cdkTreeNodeDef` micro-syntax context (`CdkTreeNodeOutletContext` only reliably sets `$implicit`) and do **not** call `tree._getLevel()`. Render the component's own node row, then project the consumer's `*twTreeNode` template via `NgTemplateOutlet` with a typed `TwTreeNodeContext<T>` you assemble: `{ $implicit: node, level: n.level, expanded: n.isExpanded, hasChildren: !n.isLeafNode, selectionState: selectionState(node), toggle: () => toggle(node), expand: () => expand(node), collapse: () => collapse(node), toggleSelection: () => toggleSelection(node) }`. Mirror table's `buildCellContext` + `ngTemplateContextGuard` approach.
- **Expansion sync — two directions, two mechanisms (do not conflate them).**
  - *model → CDK* (pre-expand from `expandedKeys`): an `effect()` that reads `expandedKeys()` and writes CDK's expand/collapse. CDK's `expand`/`collapse` already no-op when state is unchanged — lean on that as the settling guard. This is the read-signal → write-CDK shape; keep any signal writes out of it, or guard + `untracked()` them (table effect-bridge / carousel untracked-clamp precedents). Never compute expansion state inside an effect that track-reads it.
  - *CDK → model* (user expand/collapse): there is **no signal to track here** — CDK's expansion model is RxJS/private, so this is **not** an effect. Bind the `(expandedChange)` output on your component-owned `<cdk-tree-node>` to a handler that updates `expandedKeys` (compare-before-write to avoid a feedback loop) and emits the component's `expandedChange`.
- **Selection is yours, not CDK tree's.** Hold a `SelectionModel<unknown>` keyed by `trackBy` values (CDK tree's expansion model is unrelated). `'single'` — scalar replace, no cascade/indeterminate. `'multiple'` — `toggleSelection` cascades to all descendants when `cascade` is on; `selectionState` returns `'indeterminate'` when some-but-not-all descendants are selected (model the tri-state computation on table's `masterSelectionState`). `'none'` — selection disabled, `toggleSelection` is a no-op, no checkboxes render, no `aria-selected`. Seed from `selection().initialKeys`.
- **Drive selection toggles off `CdkTreeNode.activation`** (CDK emits it for Enter/Space and programmatic activation) rather than reimplementing key handling. Checkbox clicks and the context `toggleSelection()` also call the public `toggleSelection`.
- **Resolved config.** Merge each partial input with a `*_DEFAULTS` constant via `computed()` (`SELECTION_DEFAULTS`, `DISPLAY_DEFAULTS`) — copy table's pattern exactly.
- Signal APIs only: `input()` / `input.required()`, `model()`, `output()`, `computed()`, `linkedSignal()` where writable-derived-from-source is needed. `ChangeDetectionStrategy.OnPush`. `host` object for bindings. `inject()` for DI. Inline `template:` (it fits under ~50 lines). Native control flow (`@if`, `@for`).

## File structure

Secondary entry point under `projects/ngx-tw/tree/`:

- `tree.ts` — `TreeComponent`, `TreeNodeDefDirective`, `TreeNodeToggleDirective`, the `tv()` config, the config-object interfaces, `TwTreeNodeContext`, and the `*_DEFAULTS` constants.
- `tree.spec.ts` — Vitest. Use a test-host component that supplies `data` + `childrenAccessor` and a `*twTreeNode` template. No `fakeAsync` / `tick` — use `async/await` with `fixture.whenStable()` (and `vi.useFakeTimers()` / `vi.runAllTimers()` only if a timer needs control). Set signal inputs via `fixture.componentRef.setInput(...)`. Cover:
  - Default mount with empty `data` (renders nothing, no errors).
  - Node rendering through `*twTreeNode` — assert the `$implicit`, `level`, `expanded`, `hasChildren` context values reach the DOM.
  - Expand / collapse via the context `toggle()` (click) and via keyboard Enter/Space.
  - Keyboard navigation: ArrowDown/Up/Left/Right, Home/End move focus / expand / collapse as specified.
  - Selection across `mode: 'none' | 'single' | 'multiple'`.
  - Cascade: selecting a parent selects all descendants.
  - Tri-state: parent shows `indeterminate` when some children selected.
  - `expandedKeys` two-way sync (programmatic write expands; user expand updates the bound value).
  - `selectionChange` and `expandedChange` emit with correct payloads.
  - ARIA: `role="tree"` on the cdk-tree element, `role="treeitem"` on nodes, `aria-expanded`, `aria-selected`, `aria-level` present and correct.
- `index.ts` — public API re-exports.
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

## Public API exports

From `tree/index.ts`:

- Values: `TreeComponent`, `TreeNodeDefDirective`, `TreeNodeToggleDirective`.
- Types: `TwTreeSelectionConfig`, `TwTreeDisplayConfig`, `TwTreeNodeContext`.

Then register the entry point — **all four edits are required or CI silently skips the specs**:

1. `projects/ngx-tw/src/public-api.ts` — add `export * from '@cdevhub/ngx-tw/tree';`
2. `projects/ngx-tw/tsconfig.lib.json` — add `"tree/**/*.ts"` to `include` (alphabetical: after `"timeline/**/*.ts"` on line 64).
3. `projects/ngx-tw/tsconfig.spec.json` — add `"tree/**/*.ts"` to `include`.
4. `angular.json` — add `"../tree/**/*.spec.ts"` to the `unit-test` target's `include` list (near `"../timeline/**/*.spec.ts"`, line ~161).

## Constraints

- ≤ 5 inputs — tree is **not** on the input-count exception list. New knobs go inside `selection` / `display`, never as new top-level inputs.
- Class identifiers stay bare (`TreeComponent`, `TreeNodeDefDirective`) — no `Tw` prefix. Only hand-authored shared **types** carry `Tw` (`TwTreeSelectionConfig`, etc.).
- Selectors: `tw-tree` (element), `twTreeNode` / `twTreeNodeToggle` (attribute).
- No `@angular/animations` (chevron rotation is a Tailwind `transition-transform` + `rotate-90`, not an animation API).
- No `NgModule`, no `providedIn: 'root'`, no constructor injection, no `@HostBinding`/`@HostListener`, no `ngClass`/`ngStyle`, no arrow functions in templates, no manual class-string concatenation (let `tv()` + `twMerge` resolve).
- `tv()` config defines `defaultVariants` and enables `twMerge`. Semantic + surface/fg/border tokens only.
