import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ButtonDirective, ButtonIconDirective } from '@cdevhub/ngx-tw/button';
import { IconComponent } from '@cdevhub/ngx-tw/icon';
import { BreadcrumbsComponent, type TwBreadcrumbsItem } from '@cdevhub/ngx-tw/breadcrumbs';
import { TabsComponent, TabComponent } from '@cdevhub/ngx-tw/tabs';
import { TabNavComponent, TabLinkDirective } from '@cdevhub/ngx-tw/tab-nav';
import { PaginatorComponent } from '@cdevhub/ngx-tw/paginator';
import { StepperComponent, StepComponent } from '@cdevhub/ngx-tw/stepper';
import { SortDirective, SortHeaderComponent } from '@cdevhub/ngx-tw/sort';
import {
  TreeComponent,
  TreeNodeDefDirective,
  type TwTreeDisplayConfig,
} from '@cdevhub/ngx-tw/tree';
import { TransferComponent, type TwTransferDisplayConfig } from '@cdevhub/ngx-tw/transfer';
import { SplitComponent, SplitPaneComponent } from '@cdevhub/ngx-tw/split';
import { RhythmCell } from '../rhythm-cell';
import { RhythmPaper } from '../rhythm-paper';
import type { RhythmSettings } from '../rhythm-settings';

/** A file-tree node used by the `tw-tree` slot. Deliberately tiny. */
interface RhythmNode {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly RhythmNode[];
}

/** A transfer row. Two fields — enough for `keyFn` / `labelFn`, nothing more. */
interface RhythmScope {
  readonly key: string;
  readonly label: string;
}

const TREE_DATA: readonly RhythmNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'app.ts', label: 'app.ts' },
      { id: 'main.ts', label: 'main.ts' },
    ],
  },
  { id: 'readme', label: 'README.md' },
];

const SCOPES: readonly RhythmScope[] = [
  { key: 'read', label: 'Read' },
  { key: 'write', label: 'Write' },
  { key: 'deploy', label: 'Deploy' },
];

/**
 * Actions & navigation family panel for the rhythm grid.
 *
 * These are the components that build toolbars and page chrome — the place a
 * shared control height matters most, because they sit next to each other on a
 * single row and any disagreement reads as an unfinished bar.
 *
 * Two ruled sections rather than one: the compact controls measure honestly in
 * a 4-up grid, while the paginator, stepper and the three block/layout
 * components need horizontal room before their reading means anything.
 */
@Component({
  selector: 'app-action-nav-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RhythmPaper,
    RhythmCell,
    ButtonDirective,
    ButtonIconDirective,
    IconComponent,
    BreadcrumbsComponent,
    TabsComponent,
    TabComponent,
    TabNavComponent,
    TabLinkDirective,
    PaginatorComponent,
    StepperComponent,
    StepComponent,
    SortDirective,
    SortHeaderComponent,
    TreeComponent,
    TreeNodeDefDirective,
    TransferComponent,
    SplitComponent,
    SplitPaneComponent,
  ],
  template: `
    <!-- ============ Compact row controls (4-up) ============ -->
    <app-rhythm-paper
      heading="Actions & navigation"
      lede="The components that form toolbars and page chrome — where a shared height matters most, because these sit shoulder to shoulder on a single row."
      [settings]="settings()"
    >
      <app-rhythm-cell
        label="Button · solid"
        group="form-row"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton [size]="settings().size">Save</button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Button · outline"
        group="form-row"
        note="Carries a 1px border on each edge where the solid variant has none. It used to measure 2px taller at every size; with the height pinned, border-box absorbs the border and both now read identically."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton variant="outline" [size]="settings().size">Save</button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Button · ghost"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton variant="ghost" [size]="settings().size">Save</button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Button · icon only"
        note="The glyph scale is owned by twButtonIcon, not by the icon's own size input, so this box is set by the icon rather than by a text line box."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton [size]="settings().size" aria-label="Search">
          <tw-icon twButtonIcon name="search" />
        </button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Button · with icon"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton [size]="settings().size">
          <svg
            twButtonIcon
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          Add item
        </button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Button · loading"
        note="loading is a state flag only — the directive renders no spinner, so the box is identical to the solid button and the reading is a control, not a divergence."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton [size]="settings().size" [loading]="true">Saving</button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Breadcrumbs"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-breadcrumbs [items]="crumbs" [size]="settings().size" />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Tabs"
        note="tw-tabs always renders its panel region, so the measured box is the trigger strip plus the 16px panel gutter plus one line of panel text. Compare the strip alone against Tab nav below."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-tabs [size]="settings().size">
          <tw-tab value="overview" label="Overview">
            <p class="text-sm text-fg-muted">Overview panel.</p>
          </tw-tab>
          <tw-tab value="api" label="API">
            <p class="text-sm text-fg-muted">API panel.</p>
          </tw-tab>
        </tw-tabs>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Tab nav"
        note="Router-agnostic: the links carry plain hrefs and a consumer-driven active flag. With no associated panel the nav stays a landmark, so this reading is the trigger strip alone."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <nav twTabNav [size]="settings().size" aria-label="Rhythm sample navigation">
          <a twTabLink href="#" [active]="true">Overview</a>
          <a twTabLink href="#">Examples</a>
          <a twTabLink href="#">API</a>
        </nav>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Sort header"
        note="[tw-sort-header] attaches to any element, so it is mounted on a plain flex row rather than a th — the reading is the control's own padded box, not table-cell chrome."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <div twSort [twSortActive]="'name'" [twSortDirection]="'asc'" class="flex items-start">
          <div tw-sort-header id="rhythm-sort-name" [size]="settings().size">Name</div>
        </div>
      </app-rhythm-cell>
    </app-rhythm-paper>

    <!-- ============ Wide and block components (2-up) ============ -->
    <app-rhythm-paper
      heading="Wide & block navigation"
      lede="The same family at full width. Paginator and stepper are horizontal strips that squash in a 4-up grid; tree, transfer and split are containers whose height is content- or container-driven rather than set by a control ramp."
      columns="sm:grid-cols-1 lg:grid-cols-2"
      [settings]="settings()"
    >
      <app-rhythm-cell
        label="Paginator"
        note="Responsive is left at its default, so the number strip collapses through a container query on narrow cells — the reading therefore depends on how wide this slot is."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-paginator [totalItems]="120" [size]="settings().size" class="w-full" />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Stepper"
        note="The measured box is the indicator strip plus the selected step's content region, which carries one line of text here."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-stepper [size]="settings().size" class="w-full">
          <tw-step label="Account">
            <p class="text-sm text-fg-muted">Account details.</p>
          </tw-step>
          <tw-step label="Review">
            <p class="text-sm text-fg-muted">Review and submit.</p>
          </tw-step>
        </tw-stepper>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Tree"
        note="A block container, not a row control: height is the row count times the row density, so it scales with the data rather than landing on a control height. Size arrives through the display config."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-tree
          [data]="treeData"
          [childrenAccessor]="childrenOf"
          [trackBy]="trackById"
          [display]="treeDisplay()"
          [(expandedKeys)]="expandedKeys"
          class="w-full"
        >
          <ng-template twTreeNode let-node let-hasChildren="hasChildren" let-isExpanded="expanded" let-toggle="toggle">
            @if (hasChildren) {
              <button
                type="button"
                tabindex="-1"
                class="flex size-5 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted"
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
            <span class="text-sm">{{ $any(node).label }}</span>
          </ng-template>
        </tw-tree>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Transfer"
        note="A dual-list block, not a row control: height is set by the display config's listHeight (240px by default) plus panel chrome, so the size ramp changes row density inside the viewport but barely moves the outer box."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-transfer
          [data]="scopes"
          [keyFn]="scopeKey"
          [labelFn]="scopeLabel"
          [display]="transferDisplay()"
          aria-label="Rhythm sample scopes"
          class="w-full"
        />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Split"
        note="No size input, and no intrinsic height: tw-split is h-full w-full and collapses to zero without a sized parent, so it is wrapped in an 8rem container here. The reading is that wrapper, not a control height."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <div class="h-32 w-full overflow-hidden rounded-lg border border-border">
          <tw-split direction="horizontal">
            <tw-split-pane [defaultSize]="35" [minSize]="15">
              <div class="p-3 text-sm text-fg-muted">Sidebar</div>
            </tw-split-pane>
            <tw-split-pane [defaultSize]="65">
              <div class="p-3 text-sm text-fg">Detail</div>
            </tw-split-pane>
          </tw-split>
        </div>
      </app-rhythm-cell>
    </app-rhythm-paper>
  `,
})
export class ActionNavPanel {
  /** Toolbar state forwarded from the rhythm page. */
  readonly settings = input.required<RhythmSettings>();

  /** Three-hop trail — the last entry is the current page and carries no href. */
  protected readonly crumbs: readonly TwBreadcrumbsItem[] = [
    { label: 'Home', href: '#' },
    { label: 'Foundations', href: '#' },
    { label: 'Rhythm' },
  ];

  protected readonly treeData = TREE_DATA;
  protected readonly expandedKeys = signal<readonly unknown[]>(['src']);
  protected readonly childrenOf = (node: RhythmNode): readonly RhythmNode[] => node.children ?? [];
  protected readonly trackById = (node: RhythmNode): unknown => node.id;

  protected readonly scopes = SCOPES;
  protected readonly scopeKey = (scope: RhythmScope): string => scope.key;
  protected readonly scopeLabel = (scope: RhythmScope): string => scope.label;

  /** Tree density lives inside the display config rather than a top-level `size` input. */
  protected readonly treeDisplay = computed<TwTreeDisplayConfig>(() => ({
    size: this.settings().size,
  }));

  /** Transfer density likewise arrives through its display config. */
  protected readonly transferDisplay = computed<TwTransferDisplayConfig>(() => ({
    size: this.settings().size,
  }));
}
