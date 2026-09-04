import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  TreeComponent,
  TreeNodeDefDirective,
  TreeNodeToggleDirective,
} from './tree';
import type { TwTreeDisplayConfig, TwTreeSelectionConfig } from './tree';

// ── Test data ─────────────────────────────────────────────────────

interface Node {
  id: number;
  label: string;
  children?: Node[];
}

function makeTree(): Node[] {
  return [
    {
      id: 1,
      label: 'Root 1',
      children: [
        {
          id: 2,
          label: 'Child 1.1',
          children: [
            { id: 4, label: 'Leaf 1.1.1' },
            { id: 5, label: 'Leaf 1.1.2' },
          ],
        },
        { id: 3, label: 'Leaf 1.2' },
      ],
    },
    { id: 6, label: 'Root 2' },
  ];
}

// ── Test host ─────────────────────────────────────────────────────

@Component({
  imports: [TreeComponent, TreeNodeDefDirective, TreeNodeToggleDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <tw-tree
      [data]="data()"
      [childrenAccessor]="accessor"
      [trackBy]="byId"
      [selection]="selection()"
      [display]="display()"
      [(expandedKeys)]="expandedKeys"
      (selectionChange)="onSelectionChange($event)"
      (expandedChange)="onExpandedChange($event)"
    >
      <ng-template
        twTreeNode
        let-node
        let-expanded="expanded"
        let-hasChildren="hasChildren"
        let-level="level"
        let-state="selectionState"
        let-toggle="toggle"
        let-toggleSelection="toggleSelection"
      >
        @if (hasChildren) {
          <button
            class="toggle-btn"
            type="button"
            [attr.data-expanded]="expanded"
            (click)="toggle()"
          >
            {{ expanded ? '−' : '+' }}
          </button>
          <button class="toggle-dir-btn" type="button" [twTreeNodeToggle]="node">dir</button>
        }
        <input
          class="cbx"
          type="checkbox"
          [attr.data-state]="state"
          [attr.data-id]="$any(node).id"
          (change)="toggleSelection()"
        />
        <span class="label" [attr.data-level]="level">{{ $any(node).label }}</span>
      </ng-template>
    </tw-tree>
  `,
})
class TreeHost {
  readonly data = signal<Node[]>(makeTree());
  readonly selection = signal<Partial<TwTreeSelectionConfig>>({});
  readonly display = signal<Partial<TwTreeDisplayConfig>>({});
  readonly expandedKeys = signal<readonly unknown[]>([]);

  readonly accessor = (n: Node): Node[] => n.children ?? [];
  readonly byId = (n: Node): unknown => n.id;

  selectionCount = 0;
  lastSelection: readonly Node[] = [];
  expansions: { node: Node; expanded: boolean }[] = [];

  onSelectionChange(sel: readonly Node[]): void {
    this.selectionCount++;
    this.lastSelection = sel;
  }
  onExpandedChange(e: { node: Node; expanded: boolean }): void {
    this.expansions.push(e);
  }
}

/**
 * A tree behind `@if`, so it mounts after the host's first render. Guards the
 * one-shot `afterNextRender` expansion replay against the two ways it could go
 * wrong on a deferred mount: never firing at all, or firing against an
 * unresolved `viewChild.required` when the tree is destroyed before its first
 * render.
 */
@Component({
  imports: [TreeComponent, TreeNodeDefDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (show()) {
      <tw-tree
        [data]="data()"
        [childrenAccessor]="accessor"
        [trackBy]="byId"
        [expandedKeys]="expandedKeys()"
      >
        <ng-template twTreeNode let-node>
          <span class="label">{{ $any(node).label }}</span>
        </ng-template>
      </tw-tree>
    }
  `,
})
class DeferredTreeHost {
  readonly show = signal(false);
  readonly data = signal<Node[]>(makeTree());
  readonly expandedKeys = signal<readonly unknown[]>([1]);
  readonly accessor = (n: Node): Node[] => n.children ?? [];
  readonly byId = (n: Node): unknown => n.id;
}

// ── Helpers ───────────────────────────────────────────────────────

function tree(fixture: ComponentFixture<TreeHost>): TreeComponent<Node> {
  return fixture.debugElement.query(By.directive(TreeComponent))
    .componentInstance as TreeComponent<Node>;
}

function treeItems(fixture: ComponentFixture<TreeHost>): HTMLElement[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('cdk-tree-node'),
  ) as HTMLElement[];
}

function labels(fixture: ComponentFixture<TreeHost>): string[] {
  return treeItems(fixture).map(
    (n) => n.querySelector('.label')?.textContent?.trim() ?? '',
  );
}

function nodeByLabel(fixture: ComponentFixture<TreeHost>, label: string): HTMLElement {
  const item = treeItems(fixture).find(
    (n) => n.querySelector('.label')?.textContent?.trim() === label,
  );
  if (!item) throw new Error(`No tree node with label "${label}"`);
  return item;
}

function dataNode(root: Node[], id: number): Node {
  const stack = [...root];
  while (stack.length) {
    const n = stack.pop() as Node;
    if (n.id === id) return n;
    if (n.children) stack.push(...n.children);
  }
  throw new Error(`No data node ${id}`);
}

// ── Tests ─────────────────────────────────────────────────────────

describe('TreeComponent', () => {
  let fixture: ComponentFixture<TreeHost>;
  let host: TreeHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TreeHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  describe('Rendering', () => {
    it('mounts with empty data without errors', async () => {
      host.data.set([]);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(treeItems(fixture).length).toBe(0);
      expect(fixture.nativeElement.querySelector('cdk-tree')).toBeTruthy();
    });

    it('renders only root nodes when all collapsed', () => {
      expect(labels(fixture)).toEqual(['Root 1', 'Root 2']);
    });

    it('renders a toggle affordance only on branch nodes', () => {
      const root1 = nodeByLabel(fixture, 'Root 1');
      const root2 = nodeByLabel(fixture, 'Root 2');
      expect(root1.querySelector('.toggle-btn')).toBeTruthy();
      expect(root2.querySelector('.toggle-btn')).toBeNull();
    });

    it('renders per-level indent spacers for nested nodes', async () => {
      host.expandedKeys.set([1]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const child = nodeByLabel(fixture, 'Child 1.1');
      // level 1 → one spacer span before the content wrapper
      expect(child.querySelectorAll('span[style*="width"]').length).toBe(1);
    });

    it('applies the showLines guide class to spacers when enabled', async () => {
      host.display.set({ showLines: true });
      host.expandedKeys.set([1]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const child = nodeByLabel(fixture, 'Child 1.1');
      const spacer = child.querySelector('span[style*="width"]') as HTMLElement;
      expect(spacer.classList.contains('border-s')).toBe(true);
    });
  });

  describe('Node context', () => {
    it('exposes hasChildren via the template', () => {
      const root1 = nodeByLabel(fixture, 'Root 1');
      const root2 = nodeByLabel(fixture, 'Root 2');
      expect(root1.querySelector('.toggle-btn')).toBeTruthy(); // hasChildren = true
      expect(root2.querySelector('.toggle-btn')).toBeNull(); // hasChildren = false
    });

    it('exposes level via the template', async () => {
      host.expandedKeys.set([1, 2]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const root1Level = nodeByLabel(fixture, 'Root 1').querySelector('.label')!;
      const childLevel = nodeByLabel(fixture, 'Child 1.1').querySelector('.label')!;
      const leafLevel = nodeByLabel(fixture, 'Leaf 1.1.1').querySelector('.label')!;
      expect(root1Level.getAttribute('data-level')).toBe('0');
      expect(childLevel.getAttribute('data-level')).toBe('1');
      expect(leafLevel.getAttribute('data-level')).toBe('2');
    });

    it('reflects expanded state in the template', async () => {
      const btn = nodeByLabel(fixture, 'Root 1').querySelector(
        '.toggle-btn',
      ) as HTMLButtonElement;
      expect(btn.getAttribute('data-expanded')).toBe('false');
      btn.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const btnAfter = nodeByLabel(fixture, 'Root 1').querySelector(
        '.toggle-btn',
      ) as HTMLButtonElement;
      expect(btnAfter.getAttribute('data-expanded')).toBe('true');
    });
  });

  describe('Expansion', () => {
    it('expands a branch when its toggle is clicked', async () => {
      const btn = nodeByLabel(fixture, 'Root 1').querySelector(
        '.toggle-btn',
      ) as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(labels(fixture)).toContain('Child 1.1');
      expect(labels(fixture)).toContain('Leaf 1.2');
    });

    it('collapses an expanded branch on second toggle', async () => {
      const btn = () =>
        nodeByLabel(fixture, 'Root 1').querySelector('.toggle-btn') as HTMLButtonElement;
      btn().click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(labels(fixture)).toContain('Child 1.1');
      btn().click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(labels(fixture)).not.toContain('Child 1.1');
    });

    it('the public toggle method expands a branch', () => {
      const t = tree(fixture);
      const root1 = dataNode(host.data(), 1);
      expect(t.isExpanded(root1)).toBe(false);
      t.toggle(root1);
      expect(t.isExpanded(root1)).toBe(true);
    });

    it('twTreeNodeToggle directive toggles expansion on click', async () => {
      const dirBtn = nodeByLabel(fixture, 'Root 1').querySelector(
        '.toggle-dir-btn',
      ) as HTMLButtonElement;
      dirBtn.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(labels(fixture)).toContain('Child 1.1');
    });

    it('two-way binds expandedKeys: programmatic write expands', async () => {
      host.expandedKeys.set([1]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(labels(fixture)).toContain('Child 1.1');
    });

    // ── Regression: expandedKeys already populated at MOUNT ──
    //
    // The test above sets `expandedKeys` after the first change-detection pass,
    // which is the easy half. A value present at mount travelled a different
    // path and was silently dropped: the model→CDK effect's first run lands
    // before `cdk-tree`'s `dataSource` binding is applied, CDK creates its
    // expansion model lazily at that binding, and `CdkTree.expand()` falls
    // through both of its branches — no error — while the model is undefined.
    // The effect then never re-ran (none of its inputs changed), so the tree
    // stayed collapsed forever. Every demo example that seeds `[expandedKeys]`
    // rendered fully collapsed. Fixed with a one-shot `afterNextRender` replay.
    it('expands keys that are already set when the tree first renders', async () => {
      const f = TestBed.createComponent(TreeHost);
      f.componentInstance.expandedKeys.set([1, 2]);
      f.detectChanges();
      await f.whenStable();
      f.detectChanges();
      expect(labels(f)).toEqual([
        'Root 1',
        'Child 1.1',
        'Leaf 1.1.1',
        'Leaf 1.1.2',
        'Leaf 1.2',
        'Root 2',
      ]);
      expect(nodeByLabel(f, 'Root 1').getAttribute('aria-expanded')).toBe('true');
    });

    it('leaves the tree collapsed when expandedKeys is empty at mount', async () => {
      // The negative half — the replay must not expand anything on its own.
      const f = TestBed.createComponent(TreeHost);
      f.detectChanges();
      await f.whenStable();
      f.detectChanges();
      expect(labels(f)).toEqual(['Root 1', 'Root 2']);
    });

    it('expands seeded keys when the tree mounts later (behind @if)', async () => {
      const f = TestBed.createComponent(DeferredTreeHost);
      f.detectChanges();
      await f.whenStable();
      f.componentInstance.show.set(true);
      f.detectChanges();
      await f.whenStable();
      f.detectChanges();
      const rendered = Array.from(
        f.nativeElement.querySelectorAll('.label') as NodeListOf<HTMLElement>,
      ).map((e) => e.textContent?.trim());
      expect(rendered).toContain('Child 1.1');
    });

    it('survives a tree destroyed before its first render', async () => {
      // The replay reads a `viewChild.required`, which throws when unresolved.
      // Angular disposes render hooks with the component's injector, so this
      // must be a clean no-op rather than an uncaught error in a render hook.
      const f = TestBed.createComponent(DeferredTreeHost);
      f.componentInstance.show.set(true);
      f.detectChanges();
      f.componentInstance.show.set(false);
      f.detectChanges();
      await f.whenStable();
      expect(f.nativeElement.querySelectorAll('.label').length).toBe(0);
    });

    it('two-way binds expandedKeys: user expand updates the bound value', async () => {
      const btn = nodeByLabel(fixture, 'Root 1').querySelector(
        '.toggle-btn',
      ) as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(host.expandedKeys()).toContain(1);
    });

    it('emits expandedChange on user expand and collapse', async () => {
      const btn = () =>
        nodeByLabel(fixture, 'Root 1').querySelector('.toggle-btn') as HTMLButtonElement;
      btn().click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      btn().click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(host.expansions.map((e) => e.expanded)).toEqual([true, false]);
      expect(host.expansions[0].node.id).toBe(1);
    });
  });

  describe('Selection — none (default)', () => {
    it('does not emit selectionChange when selection is disabled', () => {
      const cbx = nodeByLabel(fixture, 'Root 1').querySelector(
        '.cbx',
      ) as HTMLInputElement;
      cbx.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(host.selectionCount).toBe(0);
    });

    it('omits aria-selected when selection is disabled', () => {
      const root1 = nodeByLabel(fixture, 'Root 1');
      expect(root1.hasAttribute('aria-selected')).toBe(false);
    });
  });

  describe('Selection — single', () => {
    beforeEach(async () => {
      host.selection.set({ mode: 'single' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('selects a node and exposes checked state', () => {
      const cbx = nodeByLabel(fixture, 'Root 2').querySelector(
        '.cbx',
      ) as HTMLInputElement;
      cbx.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(nodeByLabel(fixture, 'Root 2').getAttribute('aria-selected')).toBe('true');
      expect(host.lastSelection.map((n) => n.id)).toEqual([6]);
    });

    it('replaces the prior selection (scalar)', () => {
      (nodeByLabel(fixture, 'Root 1').querySelector('.cbx') as HTMLInputElement).dispatchEvent(
        new Event('change'),
      );
      fixture.detectChanges();
      (nodeByLabel(fixture, 'Root 2').querySelector('.cbx') as HTMLInputElement).dispatchEvent(
        new Event('change'),
      );
      fixture.detectChanges();
      expect(nodeByLabel(fixture, 'Root 1').getAttribute('aria-selected')).toBe('false');
      expect(nodeByLabel(fixture, 'Root 2').getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('Selection — multiple with cascade', () => {
    beforeEach(async () => {
      host.selection.set({ mode: 'multiple', cascade: true });
      host.expandedKeys.set([1, 2]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('selecting a branch cascades to all leaf descendants', () => {
      const t = tree(fixture);
      const root1 = dataNode(host.data(), 1);
      t.toggleSelection(root1);
      fixture.detectChanges();
      expect(t.selectionState(dataNode(host.data(), 4))).toBe('checked');
      expect(t.selectionState(dataNode(host.data(), 5))).toBe('checked');
      expect(t.selectionState(dataNode(host.data(), 3))).toBe('checked');
      expect(t.selectionState(root1)).toBe('checked');
    });

    it('reports indeterminate when only some descendants are selected', () => {
      const t = tree(fixture);
      t.toggleSelection(dataNode(host.data(), 4)); // one leaf under Child 1.1
      fixture.detectChanges();
      expect(t.selectionState(dataNode(host.data(), 2))).toBe('indeterminate');
      expect(t.selectionState(dataNode(host.data(), 1))).toBe('indeterminate');
    });

    it('selectionChange payload lists every checked node', () => {
      const t = tree(fixture);
      t.toggleSelection(dataNode(host.data(), 2)); // Child 1.1 branch
      fixture.detectChanges();
      const ids = host.lastSelection.map((n) => n.id).sort((a, b) => a - b);
      // Child 1.1 fully checked (its leaves 4,5) → checked: 2, 4, 5
      expect(ids).toEqual([2, 4, 5]);
    });

    it('renders mixed state on the descendant checkbox via context', () => {
      const t = tree(fixture);
      t.toggleSelection(dataNode(host.data(), 4));
      fixture.detectChanges();
      const childCbx = nodeByLabel(fixture, 'Child 1.1').querySelector(
        '.cbx',
      ) as HTMLInputElement;
      expect(childCbx.getAttribute('data-state')).toBe('indeterminate');
    });
  });

  describe('Selection — multiple without cascade', () => {
    beforeEach(async () => {
      host.selection.set({ mode: 'multiple', cascade: false });
      host.expandedKeys.set([1, 2]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('toggles each node independently', () => {
      const t = tree(fixture);
      t.toggleSelection(dataNode(host.data(), 1));
      fixture.detectChanges();
      expect(t.selectionState(dataNode(host.data(), 1))).toBe('checked');
      // children are unaffected without cascade
      expect(t.selectionState(dataNode(host.data(), 2))).toBe('unchecked');
    });
  });

  describe('Selection — initialKeys', () => {
    it('seeds selection from initialKeys', async () => {
      host.selection.set({ mode: 'multiple', cascade: false, initialKeys: [6] });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(tree(fixture).selectionState(dataNode(host.data(), 6))).toBe('checked');
    });
  });

  describe('Keyboard', () => {
    it('activates the focused node (Enter) to toggle selection', async () => {
      host.selection.set({ mode: 'single' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const root1 = nodeByLabel(fixture, 'Root 1');
      root1.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      const cdkTree = fixture.nativeElement.querySelector('cdk-tree') as HTMLElement;
      cdkTree.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(host.lastSelection.map((n) => n.id)).toEqual([1]);
    });

    it('expands a collapsed branch with ArrowRight', async () => {
      const root1 = nodeByLabel(fixture, 'Root 1');
      root1.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      const cdkTree = fixture.nativeElement.querySelector('cdk-tree') as HTMLElement;
      cdkTree.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(labels(fixture)).toContain('Child 1.1');
    });

    // ── `(activation)` → `toggleSelection(node)` identity ──
    //
    // `tree.ts:238` binds CDK's `activation` output to `toggleSelection(node)`
    // where `node` comes from the `*cdkTreeNodeDef` template context, NOT from
    // `$event`. That argument is glue no non-DOM entry point exercises: every
    // other selection test calls `toggleSelection(node)` on the component and
    // therefore supplies the node itself.
    //
    // The pre-existing Enter test above activates the FIRST row and asserts id 1,
    // so it passes even if the binding always resolved to row 0's closure. These
    // two activate a MIDDLE row and assert both halves — the activated row became
    // checked, and no other visible row did. That is what makes them falsifiable.
    it('activation selects the row it fired on, not the first row (Enter)', async () => {
      host.selection.set({ mode: 'multiple', cascade: false });
      host.expandedKeys.set([1, 2]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      // Visible rows: Root 1, Child 1.1, Leaf 1.1.1, Leaf 1.1.2, Leaf 1.2, Root 2.
      expect(labels(fixture)).toEqual([
        'Root 1',
        'Child 1.1',
        'Leaf 1.1.1',
        'Leaf 1.1.2',
        'Leaf 1.2',
        'Root 2',
      ]);

      const target = nodeByLabel(fixture, 'Leaf 1.1.2'); // 4th row, id 5
      target.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(host.lastSelection.map((n) => n.id)).toEqual([5]);
      // The activated row is checked …
      expect(nodeByLabel(fixture, 'Leaf 1.1.2').getAttribute('aria-checked')).toBe('true');
      // … and it is the ONLY one. `cascade: false` keeps ancestors out of it, so a
      // binding that resolved the wrong closure shows up here as a wrong row.
      const checked = treeItems(fixture)
        .filter((n) => n.getAttribute('aria-checked') === 'true')
        .map((n) => n.querySelector('.label')?.textContent?.trim());
      expect(checked).toEqual(['Leaf 1.1.2']);
    });

    it('activation selects the row it fired on, not the first row (Space)', async () => {
      host.selection.set({ mode: 'single' });
      host.expandedKeys.set([1]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const target = nodeByLabel(fixture, 'Leaf 1.2'); // id 3
      target.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      // TreeKeyManager matches the space key as ' ', not 'Space'.
      target.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(host.lastSelection.map((n) => n.id)).toEqual([3]);
      expect(nodeByLabel(fixture, 'Leaf 1.2').getAttribute('aria-selected')).toBe('true');
      expect(nodeByLabel(fixture, 'Root 1').getAttribute('aria-selected')).toBe('false');
      expect(nodeByLabel(fixture, 'Root 2').getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('Accessibility', () => {
    it('exposes role=tree and role=treeitem', () => {
      expect(fixture.nativeElement.querySelector('cdk-tree')?.getAttribute('role')).toBe(
        'tree',
      );
      treeItems(fixture).forEach((n) => {
        expect(n.getAttribute('role')).toBe('treeitem');
      });
    });

    it('sets aria-level on each node', async () => {
      host.expandedKeys.set([1]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(nodeByLabel(fixture, 'Root 1').getAttribute('aria-level')).toBe('1');
      expect(nodeByLabel(fixture, 'Child 1.1').getAttribute('aria-level')).toBe('2');
    });

    it('sets aria-expanded on branch nodes and reflects toggling', async () => {
      const root1 = nodeByLabel(fixture, 'Root 1');
      expect(root1.getAttribute('aria-expanded')).toBe('false');
      (root1.querySelector('.toggle-btn') as HTMLButtonElement).click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(nodeByLabel(fixture, 'Root 1').getAttribute('aria-expanded')).toBe('true');
    });

    it('omits aria-expanded on leaf nodes', () => {
      expect(nodeByLabel(fixture, 'Root 2').hasAttribute('aria-expanded')).toBe(false);
    });

    it('sets aria-selected on nodes in single-select mode', async () => {
      host.selection.set({ mode: 'single' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const root1 = nodeByLabel(fixture, 'Root 1');
      expect(root1.getAttribute('aria-selected')).toBe('false');
      // single mode uses aria-selected, not aria-checked
      expect(root1.hasAttribute('aria-checked')).toBe(false);
    });

    it('exposes tri-state via aria-checked on the treeitem in multiple mode', async () => {
      host.selection.set({ mode: 'multiple', cascade: true });
      host.expandedKeys.set([1, 2]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const t = tree(fixture);
      // multiple mode uses aria-checked, not aria-selected
      expect(nodeByLabel(fixture, 'Root 1').hasAttribute('aria-selected')).toBe(false);
      expect(nodeByLabel(fixture, 'Root 1').getAttribute('aria-checked')).toBe('false');

      // partially select → branch becomes 'mixed'
      t.toggleSelection(dataNode(host.data(), 4));
      fixture.detectChanges();
      expect(nodeByLabel(fixture, 'Child 1.1').getAttribute('aria-checked')).toBe('mixed');
      expect(nodeByLabel(fixture, 'Root 1').getAttribute('aria-checked')).toBe('mixed');

      // fully select the branch → 'true'
      t.toggleSelection(dataNode(host.data(), 5));
      fixture.detectChanges();
      expect(nodeByLabel(fixture, 'Child 1.1').getAttribute('aria-checked')).toBe('true');
    });
  });
});
