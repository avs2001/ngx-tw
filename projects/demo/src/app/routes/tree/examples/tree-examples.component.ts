import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  TreeComponent,
  TreeNodeDefDirective,
  type TwTreeSelectionState,
} from '@cdevhub/ngx-tw/tree';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { IconComponent } from '@cdevhub/ngx-tw/icon';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwSize } from '@cdevhub/ngx-tw/core';

// ── Demo data ─────────────────────────────────────────────────────

interface FileNode {
  readonly id: string;
  readonly label: string;
  readonly kind?: 'folder' | 'file';
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
          { id: 'app.config.ts', label: 'app.config.ts' },
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

const EXPLORER: readonly FileNode[] = [
  {
    id: 'components',
    label: 'components',
    kind: 'folder',
    children: [
      {
        id: 'button',
        label: 'button',
        kind: 'folder',
        children: [
          { id: 'button.ts', label: 'button.ts', kind: 'file' },
          { id: 'button.spec.ts', label: 'button.spec.ts', kind: 'file' },
          { id: 'index.ts', label: 'index.ts', kind: 'file' },
        ],
      },
      {
        id: 'tree',
        label: 'tree',
        kind: 'folder',
        children: [
          { id: 'tree.ts', label: 'tree.ts', kind: 'file' },
          { id: 'tree.spec.ts', label: 'tree.spec.ts', kind: 'file' },
        ],
      },
    ],
  },
  { id: 'readme', label: 'README.md', kind: 'file' },
];

interface NavNode {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly NavNode[];
}

const DOCS: readonly NavNode[] = [
  { id: 'intro', label: 'Introduction' },
  {
    id: 'guides',
    label: 'Guides',
    children: [
      { id: 'install', label: 'Installation' },
      { id: 'theming', label: 'Theming' },
      { id: 'forms', label: 'Forms' },
    ],
  },
  {
    id: 'components',
    label: 'Components',
    children: [
      { id: 'button', label: 'Button' },
      { id: 'select', label: 'Select' },
      { id: 'tree', label: 'Tree' },
    ],
  },
];

interface PermissionNode {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly PermissionNode[];
}

const PERMISSIONS: readonly PermissionNode[] = [
  {
    id: 'billing',
    label: 'Billing',
    children: [
      { id: 'billing.view', label: 'View invoices' },
      { id: 'billing.manage', label: 'Manage payment methods' },
    ],
  },
  {
    id: 'members',
    label: 'Members',
    children: [
      { id: 'members.view', label: 'View members' },
      { id: 'members.invite', label: 'Invite members' },
      { id: 'members.remove', label: 'Remove members' },
    ],
  },
];

const SIZES: readonly Exclude<TwSize, 'xs' | 'xl'>[] = ['sm', 'md', 'lg'];
const MODES = ['none', 'single', 'multiple'] as const;
const ALL_SIZES: readonly TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

type Mode = (typeof MODES)[number];

@Component({
  selector: 'app-tree-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TreeComponent,
    TreeNodeDefDirective,
    ButtonDirective,
    IconComponent,
    CodeBlockComponent,
  ],
  template: `
    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display.size</code>
        config sets row density across the shared
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwSize</code>
        scale (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>–<code
          class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded"
          >xl</code
        >). Reach for tighter rows (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>)
        in dense sidebars and looser rows (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>)
        when the tree is the primary surface.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid gap-6 sm:grid-cols-3">
          @for (size of sizes; track size) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ size }}</p>
              <tw-tree
                [data]="project"
                [childrenAccessor]="fileChildren"
                [trackBy]="fileTrackBy"
                [display]="{ size: size }"
                [expandedKeys]="['src', 'app']"
                class="block"
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
                  <span class="truncate">{{ $any(node).label }}</span>
                </ng-template>
              </tw-tree>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Single Selection -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Single Selection</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selection.mode</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'single'</code>
        for a navigation-style tree where exactly one node is active. The selected
        row is highlighted and exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-selected</code>;
        call
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">toggleSelection()</code>
        from the node content for mouse users, while keyboard users press
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Enter</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tree
          [data]="docs"
          [childrenAccessor]="navChildren"
          [trackBy]="navTrackBy"
          [selection]="{ mode: 'single' }"
          [expandedKeys]="['guides', 'components']"
          (selectionChange)="activeDoc.set($event[0]?.label ?? null)"
          class="block max-w-xs"
        >
          <ng-template
            twTreeNode
            let-node
            let-hasChildren="hasChildren"
            let-isExpanded="expanded"
            let-toggle="toggle"
            let-toggleSelection="toggleSelection"
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
            <button
              type="button"
              tabindex="-1"
              class="flex-1 truncate text-left bg-transparent"
              (click)="toggleSelection()"
            >
              {{ $any(node).label }}
            </button>
          </ng-template>
        </tw-tree>
        <p class="text-xs text-fg-muted mt-4 font-mono">active = {{ activeDoc() ?? 'null' }}</p>
      </div>
      <tw-code-block [code]="singleSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        In single mode selection is scalar — selecting a new node clears the previous
        one, and selecting the active node again clears it.
      </p>
    </section>

    <!-- Multiple Selection with Cascade -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Multiple Selection &amp; Cascade</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        With
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">mode: 'multiple'</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">cascade: true</code>,
        toggling a branch selects all of its leaf descendants and a partially-selected
        branch reports
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'indeterminate'</code>.
        This is the canonical shape for a permissions matrix. The tri-state is exposed
        to assistive tech as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-checked="mixed"</code>
        on the row, so the visual checkbox is decorative
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden</code>).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tree
          [data]="permissions"
          [childrenAccessor]="permChildren"
          [trackBy]="permTrackBy"
          [selection]="{ mode: 'multiple', cascade: true }"
          [expandedKeys]="['billing', 'members']"
          (selectionChange)="grantedCount.set($event.length)"
          class="block max-w-sm"
        >
          <ng-template
            twTreeNode
            let-node
            let-hasChildren="hasChildren"
            let-isExpanded="expanded"
            let-state="selectionState"
            let-toggle="toggle"
            let-toggleSelection="toggleSelection"
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
            <button
              type="button"
              tabindex="-1"
              class="flex flex-1 items-center gap-1.5 min-w-0 text-left bg-transparent"
              (click)="toggleSelection()"
            >
              <span
                aria-hidden="true"
                class="flex size-4 shrink-0 items-center justify-center rounded border"
                [class]="checkboxClass(state)"
              >
                @if (state === 'checked') {
                  <svg viewBox="0 0 16 16" fill="none" class="size-3" stroke="currentColor" stroke-width="2.5">
                    <path d="M3.5 8.5l3 3 6-6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                } @else if (state === 'indeterminate') {
                  <svg viewBox="0 0 16 16" fill="none" class="size-3" stroke="currentColor" stroke-width="2.5">
                    <path d="M4 8h8" stroke-linecap="round" />
                  </svg>
                }
              </span>
              <span class="flex-1 truncate">{{ $any(node).label }}</span>
            </button>
          </ng-template>
        </tw-tree>
        <p class="text-xs text-fg-muted mt-4 font-mono">granted = {{ grantedCount() }} node(s)</p>
      </div>
      <tw-code-block [code]="cascadeHtmlSnippet" language="html" />
      <tw-code-block [code]="cascadeTsSnippet" language="ts" class="mt-3 block" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selectionChange</code>
        payload lists every node whose state is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'checked'</code>
        — selected leaves plus any fully-checked branch. Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">cascade: false</code>
        to toggle each node independently with no tri-state.
      </p>
    </section>

    <!-- Indentation & Guide Lines -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Indentation &amp; Guide Lines</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display.indent</code>
        sets the pixels added per depth level, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display.showLines</code>
        draws a vertical guide down each indent step — helpful for deep hierarchies
        where alignment alone is hard to follow.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tree
          [data]="project"
          [childrenAccessor]="fileChildren"
          [trackBy]="fileTrackBy"
          [display]="{ indent: 24, showLines: true }"
          [expandedKeys]="['src', 'app']"
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
            <span class="truncate">{{ $any(node).label }}</span>
          </ng-template>
        </tw-tree>
      </div>
      <tw-code-block [code]="linesSnippet" language="html" />
    </section>

    <!-- Controlled Expansion -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Controlled Expansion</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(expandedKeys)]</code>
        to read and drive which nodes are open by their
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">trackBy</code>
        key. Assign a new array to expand or collapse programmatically — useful for
        "expand all", "collapse all", or restoring a saved view.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap gap-2 mb-4">
          <button twButton variant="outline" size="sm" (click)="expandAll()">Expand all</button>
          <button twButton variant="outline" size="sm" (click)="collapseAll()">Collapse all</button>
        </div>
        <tw-tree
          [data]="project"
          [childrenAccessor]="fileChildren"
          [trackBy]="fileTrackBy"
          [(expandedKeys)]="controlledKeys"
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
            <span class="truncate">{{ $any(node).label }}</span>
          </ng-template>
        </tw-tree>
        <p class="text-xs text-fg-muted mt-4 font-mono">open = [{{ controlledKeys().join(', ') }}]</p>
      </div>
      <tw-code-block [code]="controlledHtmlSnippet" language="html" />
      <tw-code-block [code]="controlledTsSnippet" language="ts" class="mt-3 block" />
    </section>

    <!-- File Explorer -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">File Explorer</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Because the node is fully templated, you control every glyph. This explorer
        renders a folder icon for branches and a file icon for leaves, with the
        chevron only on folders — the kind of dense, recognizable hierarchy the tree
        is built for.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tree
          [data]="explorer"
          [childrenAccessor]="fileChildren"
          [trackBy]="fileTrackBy"
          [display]="{ size: 'sm' }"
          [expandedKeys]="['components', 'button']"
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
            @if (hasChildren) {
              <tw-icon name="folder" size="xs" class="shrink-0 text-warning-500" />
            } @else {
              <tw-icon name="file" size="xs" class="shrink-0 text-fg-subtle" />
            }
            <span class="truncate">{{ $any(node).label }}</span>
          </ng-template>
        </tw-tree>
      </div>
      <tw-code-block [code]="explorerSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every display and selection knob at once. Switch the selection mode to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">multiple</code>
        to reveal the cascade and guide-line controls, then tune density and indentation.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of allSizes; track s) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playSize() === s"
                  [class.!text-primary-700]="playSize() === s"
                  (click)="playSize.set(s)"
                >
                  {{ s }}
                </button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Selection</label>
            <div class="flex gap-1">
              @for (m of modes; track m) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playMode() === m"
                  [class.!text-primary-700]="playMode() === m"
                  (click)="playMode.set(m)"
                >
                  {{ m }}
                </button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Indent</label>
            <div class="flex gap-1">
              @for (i of indents; track i) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playIndent() === i"
                  [class.!text-primary-700]="playIndent() === i"
                  (click)="playIndent.set(i)"
                >
                  {{ i }}
                </button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Guide lines</label>
            <button
              twButton
              variant="ghost"
              color="neutral"
              size="xs"
              [class.!bg-primary-100]="playLines()"
              [class.!text-primary-700]="playLines()"
              (click)="playLines.set(!playLines())"
            >
              {{ playLines() ? 'on' : 'off' }}
            </button>
          </div>
          @if (playMode() === 'multiple') {
            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Cascade</label>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playCascade()"
                [class.!text-primary-700]="playCascade()"
                (click)="playCascade.set(!playCascade())"
              >
                {{ playCascade() ? 'on' : 'off' }}
              </button>
            </div>
          }
        </div>

        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-tree
            [data]="permissions"
            [childrenAccessor]="permChildren"
            [trackBy]="permTrackBy"
            [selection]="playSelection()"
            [display]="playDisplay()"
            [expandedKeys]="['billing', 'members']"
            class="block max-w-sm"
          >
            <ng-template
              twTreeNode
              let-node
              let-hasChildren="hasChildren"
              let-isExpanded="expanded"
              let-state="selectionState"
              let-toggle="toggle"
              let-toggleSelection="toggleSelection"
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
              <button
                type="button"
                tabindex="-1"
                class="flex flex-1 items-center gap-1.5 min-w-0 text-left bg-transparent"
                (click)="toggleSelection()"
              >
                @if (playMode() !== 'none') {
                  <span
                    aria-hidden="true"
                    class="flex size-4 shrink-0 items-center justify-center rounded border"
                    [class]="checkboxClass(state)"
                  >
                    @if (state === 'checked') {
                      <svg viewBox="0 0 16 16" fill="none" class="size-3" stroke="currentColor" stroke-width="2.5">
                        <path d="M3.5 8.5l3 3 6-6" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    } @else if (state === 'indeterminate') {
                      <svg viewBox="0 0 16 16" fill="none" class="size-3" stroke="currentColor" stroke-width="2.5">
                        <path d="M4 8h8" stroke-linecap="round" />
                      </svg>
                    }
                  </span>
                }
                <span class="flex-1 truncate">{{ $any(node).label }}</span>
              </button>
            </ng-template>
          </tw-tree>
        </div>
      </div>
    </section>
  `,
})
export class TreeExamples {
  protected readonly project = PROJECT;
  protected readonly explorer = EXPLORER;
  protected readonly docs = DOCS;
  protected readonly permissions = PERMISSIONS;
  protected readonly sizes = SIZES;
  protected readonly allSizes = ALL_SIZES;
  protected readonly modes = MODES;
  protected readonly indents = [12, 16, 24, 32] as const;

  // Accessors
  protected readonly fileChildren = (n: FileNode): readonly FileNode[] => n.children ?? [];
  protected readonly fileTrackBy = (n: FileNode): unknown => n.id;
  protected readonly navChildren = (n: NavNode): readonly NavNode[] => n.children ?? [];
  protected readonly navTrackBy = (n: NavNode): unknown => n.id;
  protected readonly permChildren = (n: PermissionNode): readonly PermissionNode[] =>
    n.children ?? [];
  protected readonly permTrackBy = (n: PermissionNode): unknown => n.id;

  // Readouts
  protected readonly activeDoc = signal<string | null>(null);
  protected readonly grantedCount = signal(0);

  // Controlled expansion
  protected readonly controlledKeys = signal<readonly unknown[]>(['src']);

  protected expandAll(): void {
    const keys: unknown[] = [];
    const walk = (nodes: readonly FileNode[]): void => {
      for (const n of nodes) {
        if (n.children?.length) {
          keys.push(n.id);
          walk(n.children);
        }
      }
    };
    walk(PROJECT);
    this.controlledKeys.set(keys);
  }

  protected collapseAll(): void {
    this.controlledKeys.set([]);
  }

  // Playground state
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playMode = signal<Mode>('multiple');
  protected readonly playCascade = signal(true);
  protected readonly playLines = signal(false);
  protected readonly playIndent = signal<number>(16);

  protected readonly playSelection = computed(() => ({
    mode: this.playMode(),
    cascade: this.playCascade(),
  }));

  protected readonly playDisplay = computed(() => ({
    size: this.playSize(),
    indent: this.playIndent(),
    showLines: this.playLines(),
  }));

  /** Visual checkbox classes for a tri-state node indicator. */
  protected checkboxClass(state: TwTreeSelectionState): string {
    if (state === 'unchecked') {
      return 'border-border bg-surface text-transparent';
    }
    return 'border-primary-500 bg-primary-500 text-on-primary';
  }

  // ── Snippets ──

  protected readonly sizesSnippet = `@for (size of sizes; track size) {
  <tw-tree
    [data]="project"
    [childrenAccessor]="fileChildren"
    [trackBy]="fileTrackBy"
    [display]="{ size: size }"
    [expandedKeys]="['src', 'app']"
  >
    <ng-template twTreeNode let-node let-hasChildren="hasChildren"
                 let-isExpanded="expanded" let-toggle="toggle">
      @if (hasChildren) {
        <button type="button" tabindex="-1" (click)="toggle()"
                [attr.aria-label]="isExpanded ? 'Collapse' : 'Expand'">
          <tw-icon name="chevron-right" size="xs" [class.rotate-90]="isExpanded" />
        </button>
      } @else {
        <span class="size-5"></span>
      }
      <span>{{ '{{' }} node.label {{ '}}' }}</span>
    </ng-template>
  </tw-tree>
}`;

  protected readonly singleSnippet = `<tw-tree
  [data]="docs"
  [childrenAccessor]="navChildren"
  [trackBy]="navTrackBy"
  [selection]="{ mode: 'single' }"
  [expandedKeys]="['guides', 'components']"
  (selectionChange)="activeDoc.set($event[0]?.label ?? null)"
>
  <ng-template twTreeNode let-node let-hasChildren="hasChildren"
               let-isExpanded="expanded" let-toggle="toggle"
               let-toggleSelection="toggleSelection">
    <!-- chevron button (same as Sizes) -->
    <span class="flex-1" (click)="toggleSelection()">{{ '{{' }} node.label {{ '}}' }}</span>
  </ng-template>
</tw-tree>`;

  protected readonly cascadeHtmlSnippet = `<tw-tree
  [data]="permissions"
  [childrenAccessor]="permChildren"
  [trackBy]="permTrackBy"
  [selection]="{ mode: 'multiple', cascade: true }"
  [expandedKeys]="['billing', 'members']"
  (selectionChange)="grantedCount.set($event.length)"
>
  <ng-template twTreeNode let-node let-hasChildren="hasChildren"
               let-state="selectionState" let-toggle="toggle"
               let-toggleSelection="toggleSelection">
    <!-- chevron button for branches -->
    <span aria-hidden="true" [class]="checkboxClass(state)" (click)="toggleSelection()">
      @if (state === 'checked') { <!-- check icon --> }
      @else if (state === 'indeterminate') { <!-- dash icon --> }
    </span>
    <span (click)="toggleSelection()">{{ '{{' }} node.label {{ '}}' }}</span>
  </ng-template>
</tw-tree>`;

  protected readonly cascadeTsSnippet = `import type { TwTreeSelectionState } from '@cdevhub/ngx-tw/tree';

// aria-checked="mixed" lives on the treeitem, so the visual box is aria-hidden.
checkboxClass(state: TwTreeSelectionState): string {
  return state === 'unchecked'
    ? 'border-border bg-surface text-transparent'
    : 'border-primary-500 bg-primary-500 text-white';
}`;

  protected readonly linesSnippet = `<tw-tree
  [data]="project"
  [childrenAccessor]="fileChildren"
  [trackBy]="fileTrackBy"
  [display]="{ indent: 24, showLines: true }"
  [expandedKeys]="['src', 'app']"
>
  <ng-template twTreeNode let-node let-hasChildren="hasChildren"
               let-isExpanded="expanded" let-toggle="toggle">
    <!-- chevron button (same as Sizes) -->
    <span>{{ '{{' }} node.label {{ '}}' }}</span>
  </ng-template>
</tw-tree>`;

  protected readonly controlledHtmlSnippet = `<button twButton variant="outline" size="sm" (click)="expandAll()">Expand all</button>
<button twButton variant="outline" size="sm" (click)="collapseAll()">Collapse all</button>

<tw-tree
  [data]="project"
  [childrenAccessor]="fileChildren"
  [trackBy]="fileTrackBy"
  [(expandedKeys)]="controlledKeys"
>
  <!-- node template -->
</tw-tree>`;

  protected readonly controlledTsSnippet = `protected readonly controlledKeys = signal<unknown[]>(['src']);

expandAll() {
  const keys: unknown[] = [];
  const walk = (nodes: FileNode[]) => {
    for (const n of nodes) {
      if (n.children?.length) { keys.push(n.id); walk(n.children); }
    }
  };
  walk(this.project);
  this.controlledKeys.set(keys);
}

collapseAll() {
  this.controlledKeys.set([]);
}`;

  protected readonly explorerSnippet = `<tw-tree
  [data]="explorer"
  [childrenAccessor]="fileChildren"
  [trackBy]="fileTrackBy"
  [display]="{ size: 'sm' }"
  [expandedKeys]="['components', 'button']"
>
  <ng-template twTreeNode let-node let-hasChildren="hasChildren"
               let-isExpanded="expanded" let-toggle="toggle">
    @if (hasChildren) {
      <button type="button" tabindex="-1" (click)="toggle()"
              [attr.aria-label]="isExpanded ? 'Collapse' : 'Expand'">
        <tw-icon name="chevron-right" size="xs" [class.rotate-90]="isExpanded" />
      </button>
      <tw-icon name="folder" size="xs" class="text-warning-500" />
    } @else {
      <span class="size-5"></span>
      <tw-icon name="file" size="xs" class="text-fg-subtle" />
    }
    <span>{{ '{{' }} node.label {{ '}}' }}</span>
  </ng-template>
</tw-tree>`;
}
