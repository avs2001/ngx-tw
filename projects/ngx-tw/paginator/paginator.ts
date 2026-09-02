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
  TemplateRef,
  untracked,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { type FocusableOption, FocusKeyManager, LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

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
// Mirrors the checkbox SOLID_BOX / SOLID_ICON split: a per-color background + border map
// and a per-color on-color text map. `text-on-{color}` keeps the active button readable
// against any consumer theme without hardcoding `text-white` (would fail for warning's
// dark-on-amber convention) or `text-black`. The legacy `--color-on-*` alias tokens still
// resolve to the canonical solid-fg slot per `theme/_semantic.css` lines 284-296.

const PAGE_BUTTON_ACTIVE_BG: Record<TwColor, string> = {
  primary: 'bg-primary-600 hover:bg-primary-700 border-primary-600 focus-visible:outline-primary-500',
  secondary: 'bg-secondary-600 hover:bg-secondary-700 border-secondary-600 focus-visible:outline-secondary-500',
  accent: 'bg-accent-600 hover:bg-accent-700 border-accent-600 focus-visible:outline-accent-500',
  neutral: 'bg-fg hover:bg-fg border-fg focus-visible:outline-fg',
  info: 'bg-info-600 hover:bg-info-700 border-info-600 focus-visible:outline-info-500',
  success: 'bg-success-600 hover:bg-success-700 border-success-600 focus-visible:outline-success-500',
  // Warning keeps -500 because the amber-500/amber-950 pairing meets contrast — see
  // `theme/_semantic.css` warning role comment ("yellow signage convention").
  warning: 'bg-warning-500 hover:bg-warning-600 border-warning-500 focus-visible:outline-warning-500',
  error: 'bg-error-600 hover:bg-error-700 border-error-600 focus-visible:outline-error-500',
};

const PAGE_BUTTON_ACTIVE_FG: Record<TwColor, string> = {
  primary: 'text-on-primary',
  secondary: 'text-on-secondary',
  accent: 'text-on-accent',
  neutral: 'text-on-neutral',
  info: 'text-on-info',
  success: 'text-on-success',
  warning: 'text-on-warning',
  error: 'text-on-error',
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
        'rounded-md border border-border bg-surface text-fg cursor-pointer transition-colors duration-normal motion-reduce:transition-none hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none',
      pageInfo: 'text-sm text-fg-muted whitespace-nowrap',
      navGroup: 'flex items-center gap-1',
      pageList: 'flex items-center gap-1',
      navButton:
        'inline-flex items-center justify-center rounded-md border border-border bg-surface text-fg transition-colors duration-normal motion-reduce:transition-none cursor-pointer hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed',
      pageButton:
        'inline-flex items-center justify-center rounded-md border border-transparent text-fg transition-colors duration-normal motion-reduce:transition-none cursor-pointer hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed',
      ellipsis:
        'inline-flex items-center justify-center text-fg-subtle select-none pointer-events-none',
      emptyState: 'text-sm text-fg-muted',
      icon: 'size-4 shrink-0',
    },
    variants: {
      // Heights are pinned to the control scale (docs/vertical-rhythm.md):
      // 24 / 32 / 36 / 44 / 48. Vertical padding is deleted deliberately — the
      // buttons centre via `inline-flex items-center justify-center` and the
      // native `<select>` centres its own text, so any surviving `py-*` would
      // only fight the pinned height under `box-sizing: border-box`. `min-w-*`
      // tracks the height so number buttons stay square until the digits
      // widen them. `ellipsis` moves in lockstep or the numbered row
      // reintroduces a height divergence inside the component.
      size: {
        xs: {
          navButton: 'px-2 text-xs min-w-6 h-6',
          pageButton: 'px-2 text-xs min-w-6 h-6',
          pageSizeSelect: 'px-2 text-xs h-6',
          ellipsis: 'min-w-6 h-6 text-xs',
          // `size-3.5` (14px) half-step: neither size-3 nor size-4 aligns with
          // text-xs glyph metrics inside a 24px nav button.
          icon: 'size-3.5',
        },
        sm: {
          navButton: 'px-2.5 text-sm min-w-8 h-8',
          pageButton: 'px-2.5 text-sm min-w-8 h-8',
          pageSizeSelect: 'px-2.5 text-sm h-8',
          ellipsis: 'min-w-8 h-8 text-sm',
          icon: 'size-4',
        },
        md: {
          navButton: 'px-3 text-sm min-w-9 h-9',
          pageButton: 'px-3 text-sm min-w-9 h-9',
          pageSizeSelect: 'px-3 text-sm h-9',
          ellipsis: 'min-w-9 h-9 text-sm',
          icon: 'size-4',
        },
        lg: {
          navButton: 'px-4 text-base min-w-11 h-11',
          pageButton: 'px-4 text-base min-w-11 h-11',
          pageSizeSelect: 'px-4 text-base h-11',
          ellipsis: 'min-w-11 h-11 text-base',
          icon: 'size-5',
        },
        xl: {
          navButton: 'px-5 text-base min-w-12 h-12',
          pageButton: 'px-5 text-base min-w-12 h-12',
          pageSizeSelect: 'px-5 text-base h-12',
          ellipsis: 'min-w-12 h-12 text-base',
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

// ── PaginatorFocusableDirective ───────────────────────────────────

/**
 * @internal Wraps every nav-group focusable (first/prev/page/next/last) as a CDK
 * `FocusableOption` so `FocusKeyManager` can drive roving focus across the group.
 * Applied via attribute selector on the existing `data-tw-paginator-focusable`
 * marker so the spec's button queries continue to match.
 */
// Selector deliberately matches the existing `data-tw-paginator-focusable`
// data-attribute marker emitted in the template; camelCasing would break the
// spec's button queries. See the JSDoc above this declaration.
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[data-tw-paginator-focusable]',
})
export class PaginatorFocusableDirective implements FocusableOption {
  readonly elementRef = inject(ElementRef<HTMLElement>);

  /** When true, the element is skipped by `FocusKeyManager` roving focus. Defaults to `false`. */
  readonly isDisabled = input(false);

  focus(): void {
    this.elementRef.nativeElement.focus();
  }

  /**
   * `FocusableOption.disabled` resolver. NOTE: returning the signal function
   * itself would always be truthy, so `FocusKeyManager` would skip every
   * element. Call the signal here so the manager sees the actual value.
   */
  get disabled(): boolean {
    return this.isDisabled();
  }
}

// ── PaginatorComponent ────────────────────────────────────────────

let nextPaginatorId = 0;

@Component({
  selector: 'tw-paginator',
  exportAs: 'twPaginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, PaginatorFocusableDirective],
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

  /** Items per page. Two-way bindable via `[(pageSize)]`; writes back when the user picks a different size in the page-size selector. Defaults to `10`. */
  readonly pageSize = model<number>(10);

  /** 1-based current page. Two-way bindable via `[(page)]`; writes back when the user navigates, and whenever the value is clamped into the valid `1…totalPages` range. Defaults to `1`. */
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
  // TRUE-default: first/last jumps are the standard pagination affordance for
  // any list large enough to need a paginator; opt-out is for compact paginators.
  readonly showFirstLastButtons = input<boolean>(true);

  /** When true, renders the page-size selector region. Defaults to `false`. */
  readonly showPageSizeSelector = input<boolean>(false);

  /** Options for the default page-size selector. Ignored when `*twPaginatorPageSizeSelector` is projected. Defaults to `[10, 25, 50, 100]`. */
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50, 100]);

  /** When true, renders the page-info text region. Defaults to `true`. */
  // TRUE-default: showing "X–Y of Z" is the expected pagination context; opt-out
  // is for ultra-compact paginators that fit in tight UI.
  readonly showPageInfo = input<boolean>(true);

  /** When true, renders nothing when `totalItems === 0`. Defaults to `true`. */
  // TRUE-default: hiding the paginator on empty data is expected UX; opt-out is
  // for layouts that need to reserve the paginator's vertical space.
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

  /**
   * Overrides `labels.ariaLabel` for the root `<nav>` element. Bound as `aria-label`.
   * Defaults to `undefined` (the resolved `labels.ariaLabel` is used).
   *
   * The host renders as a `navigation` landmark, so a page showing more than one
   * paginator (the common "controls above and below a table" shape) MUST give each
   * one a distinct name here — two landmarks of the same role sharing an accessible
   * name are indistinguishable to a screen-reader landmark list (axe:
   * `landmark-unique`).
   */
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

  /** @internal All nav-group focusables (first/prev/page/next/last) for `FocusKeyManager`. */
  readonly focusableItems = viewChildren(PaginatorFocusableDirective);

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
    const color = this.color();
    return `${base} ${PAGE_BUTTON_ACTIVE_BG[color]} ${PAGE_BUTTON_ACTIVE_FG[color]}`;
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

  // ── Keyboard navigation (CDK FocusKeyManager) ──

  /** @internal */
  private _keyManager: FocusKeyManager<PaginatorFocusableDirective> | null = null;

  constructor() {
    afterNextRender(() => {
      this._initialized = true;
      if (isDevMode()) {
        this._runDevWarnings();
      }
    });

    // Emit pageChange whenever page or pageSize changes (after initial render).
    // When an out-of-range page is detected, clamp and emit with source 'programmatic'.
    //
    // DOCUMENTED no-write-in-effect exception (see CLAUDE.md). This effect reads
    // `page()` *and* writes `page.set(clamped)` — an intrinsic cycle, because the
    // clamp must fire both when `totalPages` shrinks AND when the consumer assigns
    // an out-of-range page (so `page` must stay a tracked dependency). The cycle is
    // bounded by the `clamped !== newPage` guard: the write re-triggers the effect
    // exactly once, the re-run sees an in-range value, and it settles. It never
    // loops/freezes. The `untracked()` wrapper does NOT break this cycle (page is
    // tracked above); its job is to keep the signal reads inside `_emitChange` /
    // `_announce` from registering as effect dependencies.
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

    // Rebuild the FocusKeyManager whenever the focusable set changes (e.g. the
    // numbered page list re-renders when total or current page shifts). No
    // `.withWrap()` — paginators should NOT loop from page 1 ArrowLeft to the
    // last page; that would be disorienting. Mirrors `accordion.ts` and the S12
    // tabs/tab-nav migration. The `disabled` getter on `PaginatorFocusableDirective`
    // resolves the `isDisabled()` signal so the manager skips disabled controls.
    // `onCleanup` fires both on rebuild AND on component destroy, so no separate
    // `_destroyRef.onDestroy` is needed.
    effect((onCleanup) => {
      const items = this.focusableItems();
      if (items.length === 0) {
        this._keyManager = null;
        return;
      }
      const manager = new FocusKeyManager(items)
        .withHorizontalOrientation('ltr')
        .withHomeAndEnd();
      this._keyManager = manager;

      onCleanup(() => {
        manager.destroy();
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

  /**
   * @internal Keyboard navigation inside the nav group. Delegates ArrowLeft /
   * ArrowRight / Home / End to CDK `FocusKeyManager`. The manager skips
   * disabled controls automatically via the `disabled` getter on
   * `PaginatorFocusableDirective`.
   */
  onKeydown(event: KeyboardEvent): void {
    if (!this._keyManager) return;
    const items = this.focusableItems();
    if (items.length === 0) return;

    // Sync the manager's active index to whichever focusable currently owns DOM
    // focus, so arrow keys move from the user's perceived position rather than
    // the stale post-render default of -1.
    const focusedIdx = items.findIndex(
      (item) => item.elementRef.nativeElement === event.target,
    );
    if (focusedIdx >= 0 && focusedIdx !== this._keyManager.activeItemIndex) {
      this._keyManager.setActiveItem(focusedIdx);
    }

    this._keyManager.onKeydown(event);
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
