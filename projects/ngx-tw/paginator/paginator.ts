import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';

// ── Public types ──────────────────────────────────────────────────

/** Rendering type. `'basic'` shows prev/next + page info only. `'numbered'` shows page buttons with ellipsis range. */
export type TwPaginatorType = 'basic' | 'numbered';

/** Layout density. `'compact'` stacks regions left-to-right. `'spread'` distributes regions across the full container width. */
export type TwPaginatorLayout = 'compact' | 'spread';

/** Responsive mode. `'auto'` collapses numbered pages to basic visuals on narrow containers via CSS container queries. `'off'` disables collapsing. */
export type TwPaginatorResponsive = 'auto' | 'off';

/** Named slot accepted by `*twPaginatorLabel`. */
export type TwPaginatorLabelSlot =
  | 'pageInfo'
  | 'previous'
  | 'next'
  | 'first'
  | 'last'
  | 'pageSizeLabel';

/** String labels used throughout the paginator. All are optional on the `labels` input — unset keys fall back to the English defaults. */
export interface TwPaginatorLabels {
  /** Accessible name for the `<nav>` landmark. */
  ariaLabel: string;
  /** Label on the Previous button. */
  previous: string;
  /** Label on the Next button. */
  next: string;
  /** Label on the First-page button. */
  first: string;
  /** Label on the Last-page button. */
  last: string;
  /** Visible label before the current-page indicator. Used as `"{pageInfo} {page}{pageInfoSeparator}{totalPages}"`. */
  pageInfo: string;
  /** Text that joins the current page and total. */
  pageInfoSeparator: string;
  /** Range-style page info template. Variables: `{start}`, `{end}`, `{total}`. */
  pageRange: string;
  /** Visible label next to the page-size selector. */
  pageSizeLabel: string;
  /** `LiveAnnouncer` template used on every page change. Variables: `{page}`, `{totalPages}`, `{start}`, `{end}`, `{total}`. */
  announcement: string;
  /** Accessible label per numbered page button. Variable: `{page}`. */
  pageButtonAriaLabel: string;
  /** Accessible label for the current numbered page button. Variable: `{page}`. */
  currentPageAriaLabel: string;
  /** Accessible label applied to ellipsis items. */
  ellipsis: string;
  /** Rendered when `hideOnEmpty` is `false` and `totalItems === 0`. */
  empty: string;
}

/** Emitted by `pageChange`. */
export interface TwPaginatorPageChangeEvent {
  /** The new 1-based page. */
  page: number;
  /** The new items-per-page. */
  pageSize: number;
  /** The previous 1-based page. */
  previousPage: number;
  /** The previous items-per-page. */
  previousPageSize: number;
  /** Total number of items. */
  totalItems: number;
  /** Total number of pages given the current `totalItems` and `pageSize`. */
  totalPages: number;
  /** 1-based index of the first item on the new page (inclusive). */
  start: number;
  /** 1-based index of the last item on the new page (inclusive). */
  end: number;
  /** What triggered the change. */
  source: 'click' | 'keyboard' | 'pageSizeChange' | 'programmatic';
}

/** Template context provided to every `*twPaginatorLabel` and `*twPaginatorEmpty` template. */
export interface TwPaginatorLabelContext {
  /** 1-based current page. */
  page: number;
  /** Total pages. */
  totalPages: number;
  /** 1-based index of the first item on the current page (inclusive). */
  start: number;
  /** 1-based index of the last item on the current page (inclusive). */
  end: number;
  /** Total number of items. */
  totalItems: number;
  /** Current items per page. */
  pageSize: number;
  /** Whether the paginator is globally disabled. */
  disabled: boolean;
}

/** Template context provided to `*twPaginatorPageSizeSelector`. */
export interface TwPaginatorPageSizeSelectorContext {
  /** Current page size. */
  pageSize: number;
  /** Available page-size options. */
  options: readonly number[];
  /** Updates the page size and re-anchors the current page to keep the same first visible item. */
  setPageSize: (size: number) => void;
}

// ── Internal types ────────────────────────────────────────────────

type PaginationRangeItem = number | 'ellipsis-left' | 'ellipsis-right';

type PageChangeSource = TwPaginatorPageChangeEvent['source'];

// ── Default labels ────────────────────────────────────────────────

const DEFAULT_LABELS: Readonly<TwPaginatorLabels> = {
  ariaLabel: 'Pagination',
  previous: 'Previous',
  next: 'Next',
  first: 'First page',
  last: 'Last page',
  pageInfo: 'Page',
  pageInfoSeparator: ' of ',
  pageRange: '{start}\u2013{end} of {total}',
  pageSizeLabel: 'Items per page:',
  announcement: 'Page {page} of {totalPages}',
  pageButtonAriaLabel: 'Go to page {page}',
  currentPageAriaLabel: 'Page {page}, current page',
  ellipsis: 'More pages',
  empty: 'No results',
};

// ── Static active-page class maps (Tailwind v4 requires statically written class strings) ──

const PAGE_BUTTON_ACTIVE: Record<TwColor, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 border border-primary-600 focus-visible:outline-primary-500',
  secondary:
    'bg-secondary-600 text-white hover:bg-secondary-700 border border-secondary-600 focus-visible:outline-secondary-500',
  accent:
    'bg-accent-600 text-white hover:bg-accent-700 border border-accent-600 focus-visible:outline-accent-500',
  neutral:
    'bg-fg text-surface hover:bg-fg border border-fg focus-visible:outline-fg',
  info: 'bg-info-600 text-white hover:bg-info-700 border border-info-600 focus-visible:outline-info-500',
  success:
    'bg-success-600 text-white hover:bg-success-700 border border-success-600 focus-visible:outline-success-500',
  warning:
    'bg-warning-500 text-black hover:bg-warning-600 border border-warning-500 focus-visible:outline-warning-500',
  error:
    'bg-error-600 text-white hover:bg-error-700 border border-error-600 focus-visible:outline-error-500',
};

// ── Pure helpers (exported for unit testing only — not re-exported from index.ts) ──

/**
 * Builds the visible page range for the numbered paginator, inserting ellipsis
 * sentinels where ranges are collapsed. Port of the shadcn/Radix algorithm.
 *
 * @internal exported for unit tests; not part of the public API.
 */
export function buildPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationRangeItem[] {
  const total = Math.max(0, Math.floor(totalPages));
  if (total <= 0) return [];

  const siblings = Math.max(0, Math.floor(siblingCount));
  const boundaries = Math.max(0, Math.floor(boundaryCount));
  const current = Math.min(Math.max(1, Math.floor(currentPage)), total);

  // If all pages fit without ellipses, show them all.
  const totalPageButtons = boundaries * 2 + siblings * 2 + 3;
  if (total <= totalPageButtons) {
    return range(1, total);
  }

  const leftBoundary = range(1, Math.min(boundaries, total));
  const rightBoundary = range(Math.max(total - boundaries + 1, 1), total);

  const leftSibling = Math.max(current - siblings, boundaries + 2);
  const rightSibling = Math.min(current + siblings, total - boundaries - 1);

  const showLeftEllipsis = leftSibling > boundaries + 2;
  const showRightEllipsis = rightSibling < total - boundaries - 1;

  const middle: PaginationRangeItem[] = [];
  if (showLeftEllipsis) {
    middle.push('ellipsis-left');
  } else {
    // Fill the gap between left boundary and leftSibling with explicit numbers.
    for (let i = boundaries + 1; i < leftSibling; i++) middle.push(i);
  }

  for (let i = leftSibling; i <= rightSibling; i++) middle.push(i);

  if (showRightEllipsis) {
    middle.push('ellipsis-right');
  } else {
    for (let i = rightSibling + 1; i <= total - boundaries; i++) middle.push(i);
  }

  return [...leftBoundary, ...middle, ...rightBoundary];
}

function range(start: number, end: number): number[] {
  if (end < start) return [];
  const out: number[] = new Array(end - start + 1);
  for (let i = 0; i < out.length; i++) out[i] = start + i;
  return out;
}

/** Replaces `{key}` placeholders in `template` with values from `vars`. */
function formatLabel(
  template: string,
  vars: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

// ── tv() config ───────────────────────────────────────────────────

const paginatorVariants = tv(
  {
    slots: {
      root: 'flex w-full',
      inner: 'flex items-center gap-3 flex-wrap w-full min-w-0',
      pageSizeGroup: 'flex items-center gap-2 shrink-0',
      pageSizeLabel: 'text-sm text-fg-muted whitespace-nowrap',
      pageSizeSelect:
        'rounded-md border border-border bg-surface text-fg cursor-pointer transition-colors duration-200 motion-reduce:transition-none hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none',
      pageInfo: 'text-sm text-fg-muted whitespace-nowrap',
      navGroup: 'flex items-center gap-1',
      pageList: 'flex items-center gap-1',
      navButton:
        'inline-flex items-center justify-center rounded-md border border-border bg-surface text-fg transition-colors duration-200 motion-reduce:transition-none cursor-pointer hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed',
      pageButton:
        'inline-flex items-center justify-center rounded-md border border-transparent text-fg transition-colors duration-200 motion-reduce:transition-none cursor-pointer hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed',
      ellipsis:
        'inline-flex items-center justify-center text-fg-subtle select-none pointer-events-none',
      emptyState: 'text-sm text-fg-muted',
      icon: 'size-4 shrink-0',
    },
    variants: {
      size: {
        xs: {
          navButton: 'px-2 py-1 text-xs min-w-7 h-7',
          pageButton: 'px-2 py-1 text-xs min-w-7 h-7',
          pageSizeSelect: 'px-2 py-1 text-xs',
          ellipsis: 'min-w-7 h-7 text-xs',
          icon: 'size-3.5',
        },
        sm: {
          navButton: 'px-2.5 py-1.5 text-sm min-w-8 h-8',
          pageButton: 'px-2.5 py-1.5 text-sm min-w-8 h-8',
          pageSizeSelect: 'px-2.5 py-1.5 text-sm',
          ellipsis: 'min-w-8 h-8 text-sm',
          icon: 'size-4',
        },
        md: {
          navButton: 'px-3 py-2 text-sm min-w-9 h-9',
          pageButton: 'px-3 py-2 text-sm min-w-9 h-9',
          pageSizeSelect: 'px-3 py-2 text-sm',
          ellipsis: 'min-w-9 h-9 text-sm',
          icon: 'size-4',
        },
        lg: {
          navButton: 'px-4 py-2.5 text-base min-w-10 h-10',
          pageButton: 'px-4 py-2.5 text-base min-w-10 h-10',
          pageSizeSelect: 'px-4 py-2.5 text-base',
          ellipsis: 'min-w-10 h-10 text-base',
          icon: 'size-5',
        },
        xl: {
          navButton: 'px-5 py-3 text-base min-w-11 h-11',
          pageButton: 'px-5 py-3 text-base min-w-11 h-11',
          pageSizeSelect: 'px-5 py-3 text-base',
          ellipsis: 'min-w-11 h-11 text-base',
          icon: 'size-5',
        },
      },
      layout: {
        compact: { inner: 'justify-start' },
        spread: { inner: 'justify-between' },
      },
      type: {
        basic: { pageList: 'hidden' },
        numbered: {},
      },
      responsive: {
        auto: { root: '@container' },
        off: {},
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none' },
        false: {},
      },
    },
    compoundVariants: [
      // Auto-collapse numbered page list under 30rem container width.
      {
        type: 'numbered',
        responsive: 'auto',
        class: { pageList: 'hidden @[30rem]:flex' },
      },
    ],
    defaultVariants: {
      size: 'md',
      layout: 'compact',
      type: 'numbered',
      responsive: 'auto',
      disabled: false,
    },
  },
  { twMerge: true },
);

// ── Template directives ───────────────────────────────────────────

/**
 * Structural directive on an `<ng-template>` that replaces a specific label slot.
 * Usage: `<ng-template twPaginatorLabel slot="pageInfo" let-ctx> … </ng-template>`.
 */
@Directive({ selector: 'ng-template[twPaginatorLabel]' })
export class PaginatorLabelDirective {
  /** The label slot this template overrides. */
  readonly slot = input.required<TwPaginatorLabelSlot>();

  /** @internal */
  readonly templateRef = inject(TemplateRef<{ $implicit: TwPaginatorLabelContext }>);

  /** @internal */
  static ngTemplateContextGuard(
    _dir: PaginatorLabelDirective,
    _ctx: unknown,
  ): _ctx is { $implicit: TwPaginatorLabelContext } {
    return true;
  }
}

/**
 * Structural directive on an `<ng-template>` that renders when `totalItems === 0`
 * and `hideOnEmpty` is `false`. When absent, `labels.empty` renders as fallback.
 */
@Directive({ selector: 'ng-template[twPaginatorEmpty]' })
export class PaginatorEmptyDirective {
  /** @internal */
  readonly templateRef = inject(TemplateRef<{ $implicit: TwPaginatorLabelContext }>);

  /** @internal */
  static ngTemplateContextGuard(
    _dir: PaginatorEmptyDirective,
    _ctx: unknown,
  ): _ctx is { $implicit: TwPaginatorLabelContext } {
    return true;
  }
}

/**
 * Structural directive on an `<ng-template>` that replaces the default page-size
 * selector UI entirely. Context `$implicit` exposes `{ pageSize, options, setPageSize }`.
 */
@Directive({ selector: 'ng-template[twPaginatorPageSizeSelector]' })
export class PaginatorPageSizeSelectorDirective {
  /** @internal */
  readonly templateRef = inject(
    TemplateRef<{ $implicit: TwPaginatorPageSizeSelectorContext }>,
  );

  /** @internal */
  static ngTemplateContextGuard(
    _dir: PaginatorPageSizeSelectorDirective,
    _ctx: unknown,
  ): _ctx is { $implicit: TwPaginatorPageSizeSelectorContext } {
    return true;
  }
}

// ── PaginatorComponent ────────────────────────────────────────────

let nextPaginatorId = 0;

@Component({
  selector: 'tw-paginator',
  exportAs: 'twPaginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './paginator.html',
  host: {
    '[attr.role]': 'shouldRender() ? "navigation" : null',
    '[class]': 'rootClasses()',
    '[attr.aria-label]': 'shouldRender() ? resolvedAriaLabel() : null',
    '[style.container-name]': 'containerName()',
  },
})
export class PaginatorComponent {
  // ── Inputs ──

  /** Total number of items across all pages. Defaults to `0`. */
  readonly totalItems = input<number>(0);

  /** Items per page. Two-way bindable via `[(pageSize)]`. Defaults to `10`. */
  readonly pageSize = model<number>(10);

  /** 1-based current page. Two-way bindable via `[(page)]`. Clamped internally. Defaults to `1`. */
  readonly page = model<number>(1);

  /** Rendering type. Defaults to `'numbered'`. */
  readonly type = input<TwPaginatorType>('numbered');

  /** Layout density. Defaults to `'compact'`. */
  readonly layout = input<TwPaginatorLayout>('compact');

  /** Controls padding, font size, and icon size. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Semantic color used for the active page indicator. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** How many sibling pages to show on each side of the current page. Defaults to `1`. */
  readonly siblingCount = input<number>(1);

  /** How many pages to always show at the start and end boundaries. Defaults to `1`. */
  readonly boundaryCount = input<number>(1);

  /** When true, renders jump-to-first and jump-to-last buttons. Defaults to `true`. */
  readonly showFirstLastButtons = input<boolean>(true);

  /** When true, renders the page-size selector region. Defaults to `false`. */
  readonly showPageSizeSelector = input<boolean>(false);

  /** Options for the default page-size selector. Ignored when `*twPaginatorPageSizeSelector` is projected. Defaults to `[10, 25, 50, 100]`. */
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50, 100]);

  /** When true, renders the page-info text region. Defaults to `true`. */
  readonly showPageInfo = input<boolean>(true);

  /** When true, renders nothing when `totalItems === 0`. Defaults to `true`. */
  readonly hideOnEmpty = input<boolean>(true);

  /** When true, renders nothing when `totalPages <= 1`. Defaults to `false`. */
  readonly hideOnSinglePage = input<boolean>(false);

  /** Responsive collapse mode. Defaults to `'auto'`. */
  readonly responsive = input<TwPaginatorResponsive>('auto');

  /** When true, every button is disabled. Defaults to `false`. */
  readonly disabled = input<boolean>(false);

  /** Partial string labels object for i18n. Unset keys fall back to English defaults. Defaults to `{}`. */
  readonly labels = input<Partial<TwPaginatorLabels>>({});

  /** When provided, buttons render as anchor links using the returned `href`. Defaults to `undefined` (renders as buttons). */
  readonly linkFactory = input<((page: number) => string) | undefined>(undefined);

  /** Overrides `labels.ariaLabel` for the root `<nav>` element. */
  readonly customAriaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });

  // ── Outputs ──

  /** Fires when `page` or `pageSize` changes. Payload includes derived helpers (`start`, `end`, `totalPages`, `source`). Use `[(page)]` / `[(pageSize)]` for two-way binding; subscribe to this for the rich event payload. */
  readonly paginated = output<TwPaginatorPageChangeEvent>();

  // ── Projected templates ──

  /** @internal */
  readonly labelDirectives = contentChildren(PaginatorLabelDirective);

  /** @internal */
  readonly emptyDirective = contentChild(PaginatorEmptyDirective);

  /** @internal */
  readonly pageSizeSelectorDirective = contentChild(
    PaginatorPageSizeSelectorDirective,
  );

  // ── Injected services ──

  private readonly _liveAnnouncer = inject(LiveAnnouncer);
  private readonly _elementRef = inject(ElementRef<HTMLElement>);

  // ── View children ──

  /** @internal */
  readonly navGroupRef = viewChild<ElementRef<HTMLElement>>('navGroup');

  // ── IDs ──

  private readonly _componentId = `tw-paginator-${nextPaginatorId++}`;

  /** @internal */
  readonly pageSizeSelectId = `${this._componentId}-size`;

  // ── Derived state ──

  /** @internal Effective page size, coerced to at least 1. */
  readonly effectivePageSize = computed(() => Math.max(1, this.pageSize()));

  /** @internal Total number of pages; always ≥ 1 to keep clamping math well-defined. */
  readonly totalPages = computed(() => {
    const total = this.totalItems();
    if (total <= 0) return 1;
    return Math.max(1, Math.ceil(total / this.effectivePageSize()));
  });

  /** @internal Current page clamped into `[1, totalPages]`. */
  readonly clampedPage = computed(() =>
    Math.min(Math.max(1, this.page()), this.totalPages()),
  );

  /** @internal 1-based start item index on the current page. `0` when empty. */
  readonly startItem = computed(() => {
    if (this.totalItems() <= 0) return 0;
    return (this.clampedPage() - 1) * this.effectivePageSize() + 1;
  });

  /** @internal 1-based end item index on the current page. `0` when empty. */
  readonly endItem = computed(() => {
    if (this.totalItems() <= 0) return 0;
    return Math.min(
      this.clampedPage() * this.effectivePageSize(),
      this.totalItems(),
    );
  });

  /** @internal Visible page range for the numbered type. */
  readonly range = computed(() =>
    buildPaginationRange(
      this.clampedPage(),
      this.totalPages(),
      this.siblingCount(),
      this.boundaryCount(),
    ),
  );

  /** @internal Merged labels. */
  readonly resolvedLabels = computed<TwPaginatorLabels>(() => ({
    ...DEFAULT_LABELS,
    ...this.labels(),
  }));

  /** @internal Resolved aria-label for the root. */
  readonly resolvedAriaLabel = computed(
    () => this.customAriaLabel() ?? this.resolvedLabels().ariaLabel,
  );

  /** @internal `container-name` for the CSS container query (set only when responsive="auto"). */
  readonly containerName = computed(() =>
    this.responsive() === 'auto' ? 'paginator' : null,
  );

  readonly isEmpty = computed(() => this.totalItems() <= 0);

  readonly isAtFirstPage = computed(() => this.clampedPage() <= 1);

  readonly isAtLastPage = computed(
    () => this.clampedPage() >= this.totalPages(),
  );

  /** @internal Target page for the Previous button (clamped to `[1, totalPages]`). */
  readonly previousTarget = computed(() => Math.max(1, this.clampedPage() - 1));

  /** @internal Target page for the Next button (clamped to `[1, totalPages]`). */
  readonly nextTarget = computed(() =>
    Math.min(this.totalPages(), this.clampedPage() + 1),
  );

  /** @internal Whether the component should render at all. */
  readonly shouldRender = computed(() => {
    if (this.isEmpty() && this.hideOnEmpty()) return false;
    if (this.hideOnSinglePage() && this.totalPages() <= 1 && !this.isEmpty())
      return false;
    return true;
  });

  // ── Variant class computation ──

  private readonly _variantResult = computed(() =>
    paginatorVariants({
      size: this.size(),
      layout: this.layout(),
      type: this.type(),
      responsive: this.responsive(),
      disabled: this.disabled(),
    }),
  );

  readonly rootClasses = computed(() => this._variantResult().root());
  readonly innerClasses = computed(() => this._variantResult().inner());
  readonly pageSizeGroupClasses = computed(() =>
    this._variantResult().pageSizeGroup(),
  );
  readonly pageSizeLabelClasses = computed(() =>
    this._variantResult().pageSizeLabel(),
  );
  readonly pageSizeSelectClasses = computed(() =>
    this._variantResult().pageSizeSelect(),
  );
  readonly pageInfoClasses = computed(() => this._variantResult().pageInfo());
  readonly navGroupClasses = computed(() => this._variantResult().navGroup());
  readonly pageListClasses = computed(() => this._variantResult().pageList());
  readonly navButtonClasses = computed(() => this._variantResult().navButton());
  readonly ellipsisClasses = computed(() => this._variantResult().ellipsis());
  readonly emptyStateClasses = computed(() => this._variantResult().emptyState());
  readonly iconClasses = computed(() => this._variantResult().icon());

  /** @internal Applies active-color classes to the current page button. */
  pageButtonClasses(active: boolean): string {
    const base = this._variantResult().pageButton();
    if (!active) return base;
    return `${base} ${PAGE_BUTTON_ACTIVE[this.color()]}`;
  }

  // ── Projected template lookup ──

  /** @internal */
  labelTemplateFor(
    slot: TwPaginatorLabelSlot,
  ): TemplateRef<{ $implicit: TwPaginatorLabelContext }> | null {
    const match = this.labelDirectives().find((d) => d.slot() === slot);
    return match ? match.templateRef : null;
  }

  /** @internal Template-context wrapper so projected templates receive `$implicit: TwPaginatorLabelContext`. */
  readonly labelContext = computed<{ $implicit: TwPaginatorLabelContext }>(() => ({
    $implicit: {
      page: this.clampedPage(),
      totalPages: this.totalPages(),
      start: this.startItem(),
      end: this.endItem(),
      totalItems: this.totalItems(),
      pageSize: this.effectivePageSize(),
      disabled: this.disabled(),
    },
  }));

  /** @internal */
  readonly pageSizeContext = computed<{
    $implicit: TwPaginatorPageSizeSelectorContext;
  }>(() => ({
    $implicit: {
      pageSize: this.effectivePageSize(),
      options: this.pageSizeOptions(),
      setPageSize: (n: number) => this._setPageSize(n),
    },
  }));

  // ── Rendered strings ──

  /** @internal Default page-info string (type-aware). */
  readonly formattedPageInfo = computed(() => {
    const labels = this.resolvedLabels();
    if (this.isEmpty()) return labels.empty;
    if (this.type() === 'basic') {
      return formatLabel(labels.pageRange, {
        start: this.startItem(),
        end: this.endItem(),
        total: this.totalItems(),
      });
    }
    return `${labels.pageInfo} ${this.clampedPage()}${labels.pageInfoSeparator}${this.totalPages()}`;
  });

  /** @internal ARIA label for a numbered page button. */
  formatPageButtonLabel(page: number): string {
    return formatLabel(this.resolvedLabels().pageButtonAriaLabel, { page });
  }

  /** @internal ARIA label for the current page button. */
  formatCurrentPageLabel(page: number): string {
    return formatLabel(this.resolvedLabels().currentPageAriaLabel, { page });
  }

  /** @internal Returns the anchor href for a page when `linkFactory` is set and the page is navigable. */
  hrefFor(page: number): string | null {
    const lf = this.linkFactory();
    if (!lf) return null;
    if (this.disabled()) return null;
    return lf(Math.min(Math.max(1, page), this.totalPages()));
  }

  // ── State bookkeeping (for emission) ──

  private _previousPage = this.page();
  private _previousPageSize = this.pageSize();
  private _pendingSource: PageChangeSource | null = null;
  private _initialized = false;

  constructor() {
    afterNextRender(() => {
      this._initialized = true;
      if (isDevMode()) {
        this._runDevWarnings();
      }
    });

    // Emit pageChange whenever page or pageSize changes (after initial render).
    // When an out-of-range page is detected, clamp and emit with source 'programmatic'.
    effect(() => {
      const newPage = this.page();
      const newSize = this.pageSize();
      const tp = this.totalPages();

      untracked(() => {
        const oldPage = this._previousPage;
        const oldSize = this._previousPageSize;

        // Clamp out-of-bounds page — do this first, then allow a follow-up tick to emit.
        const clamped = Math.min(Math.max(1, newPage), tp);
        if (clamped !== newPage) {
          // Set pending source only if nothing else is pending (preserve originator).
          if (this._pendingSource === null) this._pendingSource = 'programmatic';
          this.page.set(clamped);
          return;
        }

        if (newPage === oldPage && newSize === oldSize) {
          // No effective change (first run after init).
          return;
        }

        this._previousPage = newPage;
        this._previousPageSize = newSize;

        if (!this._initialized) return;

        const source = this._pendingSource ?? 'programmatic';
        this._pendingSource = null;
        this._emitChange(newPage, newSize, oldPage, oldSize, source);
        this._announce(newPage);
      });
    });
  }

  // ── User-facing action methods ──

  /** @internal Navigate to a specific page (click/keyboard handler). */
  goTo(target: number, source: Exclude<PageChangeSource, 'pageSizeChange'>): void {
    if (this.disabled()) return;
    const tp = this.totalPages();
    const next = Math.min(Math.max(1, target), tp);
    if (next === this.clampedPage()) return;
    this._pendingSource = source;
    this.page.set(next);
  }

  /** @internal Click handler for anchor-link mode. Suppresses navigation for disabled targets. */
  onLinkClick(
    event: MouseEvent,
    target: number,
    disabled: boolean,
    source: Exclude<PageChangeSource, 'pageSizeChange'>,
  ): void {
    if (disabled || this.disabled()) {
      event.preventDefault();
      return;
    }
    // Let the browser follow the anchor; still emit a pageChange.
    this.goTo(target, source);
  }

  /** @internal Handler for the default page-size `<select>`. */
  onPageSizeSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const parsed = Number(target.value);
    if (Number.isFinite(parsed) && parsed > 0) {
      this._setPageSize(parsed);
    }
  }

  private _setPageSize(size: number): void {
    if (this.disabled()) return;
    const newSize = Math.max(1, Math.floor(size));
    const oldPage = this.clampedPage();
    const oldSize = this.effectivePageSize();
    if (newSize === oldSize) return;

    const firstItem = (oldPage - 1) * oldSize + 1;
    const total = this.totalItems();
    const newTp = total <= 0 ? 1 : Math.max(1, Math.ceil(total / newSize));
    const newPage = Math.min(Math.max(1, Math.ceil(firstItem / newSize)), newTp);

    this._pendingSource = 'pageSizeChange';
    this.pageSize.set(newSize);
    if (newPage !== oldPage) this.page.set(newPage);
    // If only pageSize changed but page value is unchanged, the effect still fires
    // because pageSize is tracked.
  }

  /** @internal Keyboard navigation inside the nav group. */
  onKeydown(event: KeyboardEvent): void {
    const nav = this.navGroupRef()?.nativeElement;
    if (!nav) return;

    const focusables = Array.from(
      nav.querySelectorAll<HTMLElement>('[data-tw-paginator-focusable]'),
    ).filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        el.getAttribute('aria-disabled') !== 'true',
    );
    if (focusables.length === 0) return;

    const activeEl = document.activeElement as HTMLElement | null;
    const currentIdx = activeEl ? focusables.indexOf(activeEl) : -1;

    let nextIdx = -1;
    switch (event.key) {
      case 'ArrowRight':
        nextIdx = currentIdx < 0 ? 0 : Math.min(currentIdx + 1, focusables.length - 1);
        break;
      case 'ArrowLeft':
        nextIdx = currentIdx < 0 ? 0 : Math.max(currentIdx - 1, 0);
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = focusables.length - 1;
        break;
      default:
        return;
    }

    if (nextIdx >= 0 && nextIdx !== currentIdx) {
      event.preventDefault();
      focusables[nextIdx]?.focus();
    }
  }

  // ── Emission + announcement ──

  private _emitChange(
    page: number,
    pageSize: number,
    previousPage: number,
    previousPageSize: number,
    source: PageChangeSource,
  ): void {
    const total = this.totalItems();
    const effSize = Math.max(1, pageSize);
    const tp = total <= 0 ? 1 : Math.max(1, Math.ceil(total / effSize));
    const start = total <= 0 ? 0 : (page - 1) * effSize + 1;
    const end = total <= 0 ? 0 : Math.min(page * effSize, total);
    this.paginated.emit({
      page,
      pageSize: effSize,
      previousPage,
      previousPageSize,
      totalItems: total,
      totalPages: tp,
      start,
      end,
      source,
    });
  }

  private _announce(page: number): void {
    const msg = formatLabel(this.resolvedLabels().announcement, {
      page,
      totalPages: this.totalPages(),
      start: this.startItem(),
      end: this.endItem(),
      total: this.totalItems(),
    });
    this._liveAnnouncer.announce(msg, 'polite');
  }

  // ── Dev warnings ──

  private _runDevWarnings(): void {
    if (this.totalItems() < 0) {
       
      console.warn('[tw-paginator] totalItems is negative — coercing to 0.');
    }
    if (this.pageSize() < 1) {
       
      console.warn('[tw-paginator] pageSize is less than 1 — coercing to 1.');
    }
    if (this.showPageSizeSelector() && this.pageSizeOptions().length === 0) {
       
      console.warn(
        '[tw-paginator] showPageSizeSelector is true but pageSizeOptions is empty — selector will not render.',
      );
    }
  }
}
