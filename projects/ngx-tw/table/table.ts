/*
 * tw-table — wraps Angular CDK's CdkTable with a declarative <tw-column> API,
 * slot-based chrome (caption, toolbar, empty, loading, error, footer, pagination),
 * responsive (scroll / stack / hide) + sticky + layout controls, and typed
 * template contexts per cell/row/footer/expansion.
 *
 * v2 input shape — visual/behavioral concerns are grouped into config objects:
 *   - `appearance`  { variant, density, size, layout, rowAnimations }
 *   - `sticky`      { header, footer, scrollHeight }
 *   - `responsive`  { mode, stackBelow }
 *   - `selection`   { enabled }
 *   - `<tw-column>` `display` { sticky, align, numeric, hideBelow, width }
 *
 * Each config input accepts a partial object; unset keys fall back to the documented
 * defaults (see `APPEARANCE_DEFAULTS`, etc.). Data, state, mechanical mode flags, i18n
 * and a11y attributes stay flat.
 *
 * Out of scope for v1:
 *   - Column resize, drag-reorder
 *   - CDK virtual scroll viewport integration
 *   - Inline cell editing
 *   - Filter UI primitives
 *   - Arrow-key "grid" pattern keyboard navigation (APG)
 */

import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
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
  type TrackByFunction,
  untracked,
  viewChild,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  CdkNoDataRow,
  type CdkTable,
  CdkTableModule,
  type CdkTableDataSourceInput,
} from '@angular/cdk/table';
import { tv } from 'tailwind-variants';
import { CheckboxComponent } from '@cdevhub/ngx-tw/checkbox';
import { TW_SORT_HANDLE, type TwBreakpoint, type TwSize } from '@cdevhub/ngx-tw/core';

/** Possible values for the `aria-sort` attribute on a sortable column header. */
export type TwColumnAriaSort = 'ascending' | 'descending' | 'none' | null;

// ── Public types ─────────────────────────────────────────────────────

/** Re-export of CDK's accepted data-source shapes: plain array, Observable, or `DataSource<T>`. */
export type TwTableDataSourceInput<T> = CdkTableDataSourceInput<T>;

/** Visual variant of the table. `'default'` — clean row dividers. `'striped'` — alternating rows. `'bordered'` — full grid with outer rounded border. */
export type TwTableVariant = 'default' | 'striped' | 'bordered';

/** Row density. `'comfortable'` — larger vertical padding. `'compact'` — tighter padding for dense data. */
export type TwTableDensity = 'comfortable' | 'compact';

/** Responsive behaviour mode. `'scroll'` — horizontal overflow. `'stack'` — cards per row below a breakpoint. `'hide'` — columns with `hideBelow` are hidden. */
export type TwTableResponsiveMode = 'scroll' | 'stack' | 'hide';

/** Table layout algorithm. `'auto'` — content-sized columns. `'fixed'` — respects `<tw-column display.width>`. */
export type TwTableLayout = 'auto' | 'fixed';

/** Horizontal alignment of a column's cells. */
export type TwColumnAlign = 'start' | 'center' | 'end';

/** Column stickiness. `'start'` pins to leading edge; `'end'` pins to trailing edge; `false` disables. */
export type TwColumnSticky = 'start' | 'end' | false;

// ── Config object types ──────────────────────────────────────────────

/** Visual configuration. Pass any subset; unset keys fall back to the defaults. */
export interface TwTableAppearance {
  /** Visual variant. Defaults to `'default'`. */
  variant?: TwTableVariant;
  /** Row density (vertical padding only — independent of font size). Defaults to `'comfortable'`. */
  density?: TwTableDensity;
  /** Base font-size scale for header and data cells. Defaults to `'md'`. */
  size?: TwSize;
  /** Table layout algorithm. Defaults to `'auto'`. */
  layout?: TwTableLayout;
  /** When `true`, rows fade in on enter via `animate.enter="fade-in"`. Off by default to avoid flicker on frequent data updates. Defaults to `false`. */
  rowAnimations?: boolean;
}

/** Sticky configuration — pinned header/footer rows and an internal scroll region. */
export interface TwTableSticky {
  /** When `true`, the `<thead>` row stays visible while the body scrolls. Requires `scrollHeight` or a scrolling ancestor. Defaults to `false`. */
  header?: boolean;
  /** When `true`, the `<tfoot>` row stays pinned while the body scrolls. Defaults to `false`. */
  footer?: boolean;
  /** Max-height of the internal scroll container. A number is treated as pixels; a string is passed through as a CSS length. When `null`, the table flows with its content. Defaults to `null`. */
  scrollHeight?: string | number | null;
}

/** Responsive configuration — how the table adapts to narrow viewports. */
export interface TwTableResponsive {
  /** Narrow-viewport strategy. Defaults to `'scroll'`. */
  mode?: TwTableResponsiveMode;
  /** Breakpoint below which the `'stack'` mode engages. Ignored when `mode !== 'stack'`. Defaults to `'md'`. */
  stackBelow?: TwBreakpoint;
}

/** Selection configuration. */
export interface TwTableSelection {
  /** When `true`, exposes a leading `_selection` column slot for checkbox rendering. Defaults to `false`. */
  enabled?: boolean;
}

/** Per-column display configuration. */
export interface TwColumnDisplay {
  /** Sticky positioning. `'start'` pins to the leading edge; `'end'` pins to the trailing edge; `false` disables stickiness. Defaults to `false`. */
  sticky?: TwColumnSticky;
  /** Horizontal text alignment. `'end'` is idiomatic for numeric columns. Defaults to `'start'`. */
  align?: TwColumnAlign;
  /** Convenience flag equivalent to `align: 'end'` plus tabular numerals. Overridden by an explicit `align`. Defaults to `false`. */
  numeric?: boolean;
  /** Responsive visibility: when set and the viewport is below this breakpoint, the column is hidden (applies when the table's `responsive.mode === 'hide'`). Defaults to `null`. */
  hideBelow?: TwBreakpoint | null;
  /** CSS column width applied to header and data cells. A number is treated as pixels; a string is passed through. Only honoured when the table's `appearance.layout === 'fixed'`. Defaults to `null`. */
  width?: string | number | null;
}

// ── Resolved-default constants ───────────────────────────────────────

const APPEARANCE_DEFAULTS: Required<TwTableAppearance> = {
  variant: 'default',
  density: 'comfortable',
  size: 'md',
  layout: 'auto',
  rowAnimations: false,
};

const STICKY_DEFAULTS: Required<TwTableSticky> = {
  header: false,
  footer: false,
  scrollHeight: null,
};

const RESPONSIVE_DEFAULTS: Required<TwTableResponsive> = {
  mode: 'scroll',
  stackBelow: 'md',
};

const SELECTION_DEFAULTS: Required<TwTableSelection> = {
  enabled: false,
};

const DISPLAY_DEFAULTS: Required<TwColumnDisplay> = {
  sticky: false,
  align: 'start',
  numeric: false,
  hideBelow: null,
  width: null,
};

// ── i18n + event types ───────────────────────────────────────────────

/** String labels used by the table. All keys optional on the `labels` input; unset keys fall back to the English defaults. */
export interface TwTableLabels {
  /** Accessible name used when neither `<caption>`, `ariaLabel`, nor `ariaLabelledby` is provided. Triggers a dev-mode warning. */
  ariaLabel: string;
  /** Default empty-state message rendered when no `[slot="empty"]` content is projected. */
  empty: string;
  /** Default loading message announced politely via `LiveAnnouncer`. */
  loading: string;
  /** Prefix prepended to `String(error)` when no `[slot="error"]` content is projected. */
  errorPrefix: string;
  /** `LiveAnnouncer` template announced on row-count changes. Variable: `{count}`. */
  rowsUpdatedAnnouncement: string;
  /** `LiveAnnouncer` template for selection-change announcements. Variable: `{count}`. */
  selectionAnnouncement: string;
  /** Accessible label for the row-expansion toggle button. */
  expandRowLabel: string;
  /** Accessible label for the collapse-row toggle button. */
  collapseRowLabel: string;
  /** Accessible label for the master "select all" checkbox in the leading selection column. */
  selectAllLabel: string;
  /** Accessible label template for each per-row selection checkbox. Variable: `{index}` (1-based). */
  selectRowLabel: string;
}

/** Default English labels for the table. */
export const DEFAULT_TABLE_LABELS: Readonly<TwTableLabels> = {
  ariaLabel: 'Data table',
  empty: 'No data',
  loading: 'Loading…',
  errorPrefix: 'Error: ',
  rowsUpdatedAnnouncement: '{count} rows loaded',
  selectionAnnouncement: '{count} rows selected',
  expandRowLabel: 'Expand row',
  collapseRowLabel: 'Collapse row',
  selectAllLabel: 'Select all rows',
  selectRowLabel: 'Select row {index}',
};

/** Context provided to every data-cell template (`*twCellDef`). Generic over the row type `T`. */
export interface TwCellContext<T> {
  /** The row data (implicit `let-row`). */
  $implicit: T;
  /** The row, aliased for readability. */
  row: T;
  /** The column's declared `name`. */
  column: string;
  /** Zero-based index within the rendered row list. */
  index: number;
  /** Zero-based column index in the visible column set. */
  columnIndex: number;
  /** True when this cell is in the first row. */
  first: boolean;
  /** True when this cell is in the last row. */
  last: boolean;
  /** True when the row index is even. */
  even: boolean;
  /** True when the row index is odd. */
  odd: boolean;
  /** Total number of rendered rows. */
  count: number;
}

/** Context provided to every header-cell template (`*twHeaderCellDef`). */
export interface TwHeaderCellContext {
  /** The column's declared `name` (implicit `let-column`). */
  $implicit: string;
  /** The column's declared `name`, aliased. */
  column: string;
  /** Zero-based column index in the visible column set. */
  columnIndex: number;
}

/** Context provided to every footer-cell template (`*twFooterCellDef`). Generic over the row type `T`. */
export interface TwFooterCellContext<T> {
  /** The column's declared `name` (implicit). */
  $implicit: string;
  /** The column's declared `name`. */
  column: string;
  /** Zero-based column index in the visible column set. */
  columnIndex: number;
  /** Snapshot of all rows (useful for total/summary computation). */
  rows: readonly T[];
}

/** Context surfaced to a `*twRowDef` template. Mirrors `TwCellContext<T>` minus the column-specific fields. */
export interface TwRowContext<T> {
  /** The row data (implicit `let-row`). */
  $implicit: T;
  /** The row, aliased. */
  row: T;
  /** Zero-based index within the rendered row list. */
  index: number;
  /** True when this row is the first rendered row. */
  first: boolean;
  /** True when this row is the last rendered row. */
  last: boolean;
  /** True when the row index is even. */
  even: boolean;
  /** True when the row index is odd. */
  odd: boolean;
  /** Total rendered row count. */
  count: number;
}

/** Context provided to `*twRowExpansion`. */
export interface TwRowExpansionContext<T> {
  /** The row whose expansion panel this template renders. */
  $implicit: T;
  /** The row, aliased. */
  row: T;
  /** The data index. */
  index: number;
  /** Collapses this row (removes it from `expandedRows`). */
  collapse: () => void;
}

/** Payload emitted by `rowClicked`. */
export interface TwRowClickEvent<T> {
  /** The clicked row. */
  row: T;
  /** Zero-based index in the rendered data. */
  index: number;
  /** The original DOM event. */
  event: MouseEvent;
}

/** Payload emitted by `selectionChange`. */
export interface TwSelectionChangeEvent<T> {
  /** The full current selection. */
  selected: readonly T[];
  /** Rows added since the previous selection. */
  added: readonly T[];
  /** Rows removed since the previous selection. */
  removed: readonly T[];
  /** The previous selection. */
  previous: readonly T[];
}

/** Payload emitted by `expansionChange`. */
export interface TwRowExpansionChangeEvent<T> {
  /** The row whose expansion state changed. */
  row: T;
  /** Whether the row is now expanded. */
  expanded: boolean;
  /** The full set of expanded rows after the change. */
  expandedRows: ReadonlySet<T>;
}

// ── tv() config ──────────────────────────────────────────────────────

// CDK renders `<thead>` / `<tbody>` / `<tfoot>` inside its native-table template;
// we can't set classes on those elements directly. Instead, we style them via
// arbitrary descendant selectors on the `<table>` element itself (`[&>thead]:…`,
// `[&>tbody>tr]:…`, etc.) — the full class strings stay statically present in
// source so Tailwind v4's JIT scanner picks them up.
const tableVariants = tv(
  {
    slots: {
      root: 'relative block w-full',
      toolbar:
        'empty:hidden flex items-center justify-between gap-3 px-4 py-3 border-b border-border',
      scrollWrapper: 'relative',
      scrollContainer: 'overflow-x-auto w-full',
      // `border-separate` + `border-spacing-0` is required for `position: sticky` on
      // `<th>` / `<td>` (CDK's sticky mechanism) to work reliably across browsers.
      // In border-collapse mode, Firefox (and historically Chrome) fails to stick
      // individual cells. Consequence: borders on row groups (`<thead>`, `<tfoot>`,
      // `<tr>`) don't render — all separators must be applied to cells directly.
      table:
        'w-full border-separate border-spacing-0 text-start align-middle [&>thead>tr>th]:font-semibold [&>thead>tr>th]:text-fg [&>thead>tr>th]:tracking-tight [&>tbody>tr]:transition-colors [&>tbody>tr]:duration-normal [&>tbody>tr]:motion-reduce:transition-none [&>tfoot>tr>td]:border-t [&>tfoot>tr>td]:border-border',
      th: 'text-start font-semibold text-fg tracking-tight align-middle',
      td: 'text-fg align-middle',
      footerTd: 'text-fg font-medium align-middle',
      emptyState:
        'flex flex-col items-center justify-center gap-2 px-4 py-12 text-center',
      emptyIcon: 'size-10 shrink-0 text-fg-subtle',
      emptyMessage: 'text-sm text-fg-muted',
      loadingOverlay:
        'absolute inset-0 flex items-center justify-center gap-3 bg-surface/70 backdrop-blur-sm z-20 pointer-events-auto',
      loadingMessage: 'text-sm text-fg-muted',
      errorState:
        'flex flex-col items-center justify-center gap-2 px-4 py-12 text-center',
      errorIcon: 'size-10 shrink-0 text-error-500',
      errorMessage: 'text-sm text-error-700',
      footerSlot: 'empty:hidden px-4 py-2 border-t border-border text-sm text-fg-muted',
      paginationSlot: 'empty:hidden border-t border-border px-2 py-2',
      expansionRow: 'bg-surface-sunken',
      expansionCell: 'p-0',
      // The leading `_selection` column hosts checkboxes only — override the standard
      // text alignment + padding so the control stays centered in a narrow column.
      selectionHeader: 'w-12 text-center align-middle',
      selectionCell: 'w-12 text-center align-middle',
    },
    variants: {
      variant: {
        default: {
          table:
            '[&>thead>tr>th]:bg-surface-muted [&>tbody>tr:not(:last-child)>td]:border-b [&>tbody>tr:not(:last-child)>td]:border-border [&>tbody>tr:hover]:bg-surface-sunken',
        },
        striped: {
          table:
            '[&>thead>tr>th]:bg-surface-muted [&>tbody>tr:nth-child(even)]:bg-surface-sunken [&>tbody>tr:hover]:bg-surface-muted',
        },
        bordered: {
          root: 'rounded-lg border border-border-strong overflow-hidden',
          table:
            '[&>thead>tr>th]:bg-surface-muted [&>thead>tr>th]:border-b [&>thead>tr>th]:border-border [&>tbody>tr:hover]:bg-surface-sunken',
          th: 'border-r border-border last:border-r-0',
          td: 'border-r border-border last:border-r-0',
          footerTd: 'border-r border-border last:border-r-0',
        },
      },
      density: {
        comfortable: {
          th: 'px-4 py-3',
          td: 'px-4 py-3',
          footerTd: 'px-4 py-3',
        },
        compact: {
          th: 'px-3 py-1.5',
          td: 'px-3 py-1.5',
          footerTd: 'px-3 py-1.5',
        },
      },
      size: {
        xs: { table: 'text-xs' },
        sm: { table: 'text-sm' },
        md: { table: 'text-sm' },
        lg: { table: 'text-base' },
        xl: { table: 'text-base' },
      },
      layout: {
        auto: { table: 'table-auto' },
        fixed: { table: 'table-fixed' },
      },
      stickyHeader: {
        // Apply `position: sticky` to `<thead>` directly in addition to CDK's
        // per-cell sticky. Group-level sticky on row groups is well supported
        // across Chrome/Firefox/Safari and keeps the header visible reliably
        // regardless of table layout (`border-separate` vs `border-collapse`)
        // or consumer-supplied scroll ancestors. Cells still get their own bg
        // so they stay opaque over scrolled rows.
        true: {
          table:
            '[&>thead]:sticky [&>thead]:top-0 [&>thead]:z-20 [&>thead>tr>th]:bg-surface-raised [&>thead>tr>th]:z-10',
        },
        false: {},
      },
      stickyFooter: {
        true: {
          table:
            '[&>tfoot]:sticky [&>tfoot]:bottom-0 [&>tfoot]:z-20 [&>tfoot>tr>td]:bg-surface-raised [&>tfoot>tr>td]:z-10',
        },
        false: {},
      },
      loading: {
        true: { table: '[&>tbody]:opacity-60 [&>tbody]:pointer-events-none' },
        false: {},
      },
    },
    compoundVariants: [
      {
        variant: 'bordered',
        density: 'compact',
        class: { th: 'text-xs', td: 'text-xs', footerTd: 'text-xs' },
      },
      {
        stickyHeader: true,
        variant: 'striped',
        class: {
          table: '[&>thead>tr>th]:shadow-table-sticky',
        },
      },
    ],
    defaultVariants: {
      variant: 'default',
      density: 'comfortable',
      size: 'md',
      layout: 'auto',
      stickyHeader: false,
      stickyFooter: false,
      loading: false,
    },
  },
  { twMerge: true },
);

// ── Static class maps (Tailwind v4 JIT requires literal class strings) ──

const ALIGN_CLASSES: Record<TwColumnAlign, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
};

const HIDE_BELOW_UTILITIES: Record<TwBreakpoint, string> = {
  sm: 'max-sm:hidden',
  md: 'max-md:hidden',
  lg: 'max-lg:hidden',
  xl: 'max-xl:hidden',
};

/**
 * Stack mode: CSS-only transform that makes each data row read like a labelled card
 * below the chosen breakpoint. Applied to `<table>` via arbitrary descendant selectors
 * because CDK owns the `<thead>` / `<tbody>` / `<tr>` elements.
 *
 * Every class is written in full so Tailwind v4's JIT scanner picks it up.
 */
const STACK_TABLE_UTILITIES: Record<TwBreakpoint, string> = {
  sm: '[&>thead]:max-sm:hidden [&>tbody>tr]:max-sm:block [&>tbody>tr]:max-sm:border [&>tbody>tr]:max-sm:border-border [&>tbody>tr]:max-sm:rounded-lg [&>tbody>tr]:max-sm:p-3 [&>tbody>tr]:max-sm:mb-2 [&>tbody>tr]:max-sm:bg-surface-raised',
  md: '[&>thead]:max-md:hidden [&>tbody>tr]:max-md:block [&>tbody>tr]:max-md:border [&>tbody>tr]:max-md:border-border [&>tbody>tr]:max-md:rounded-lg [&>tbody>tr]:max-md:p-3 [&>tbody>tr]:max-md:mb-2 [&>tbody>tr]:max-md:bg-surface-raised',
  lg: '[&>thead]:max-lg:hidden [&>tbody>tr]:max-lg:block [&>tbody>tr]:max-lg:border [&>tbody>tr]:max-lg:border-border [&>tbody>tr]:max-lg:rounded-lg [&>tbody>tr]:max-lg:p-3 [&>tbody>tr]:max-lg:mb-2 [&>tbody>tr]:max-lg:bg-surface-raised',
  xl: '[&>thead]:max-xl:hidden [&>tbody>tr]:max-xl:block [&>tbody>tr]:max-xl:border [&>tbody>tr]:max-xl:border-border [&>tbody>tr]:max-xl:rounded-lg [&>tbody>tr]:max-xl:p-3 [&>tbody>tr]:max-xl:mb-2 [&>tbody>tr]:max-xl:bg-surface-raised',
};

/** Stack mode per-cell decoration (applied to `<td>` directly via column classes). */
const STACK_CELL_UTILITIES: Record<TwBreakpoint, string> = {
  sm: 'max-sm:flex max-sm:justify-between max-sm:gap-3 max-sm:py-1 max-sm:border-0 max-sm:before:content-[attr(data-label)] max-sm:before:font-semibold max-sm:before:text-fg-muted max-sm:before:mr-4',
  md: 'max-md:flex max-md:justify-between max-md:gap-3 max-md:py-1 max-md:border-0 max-md:before:content-[attr(data-label)] max-md:before:font-semibold max-md:before:text-fg-muted max-md:before:mr-4',
  lg: 'max-lg:flex max-lg:justify-between max-lg:gap-3 max-lg:py-1 max-lg:border-0 max-lg:before:content-[attr(data-label)] max-lg:before:font-semibold max-lg:before:text-fg-muted max-lg:before:mr-4',
  xl: 'max-xl:flex max-xl:justify-between max-xl:gap-3 max-xl:py-1 max-xl:border-0 max-xl:before:content-[attr(data-label)] max-xl:before:font-semibold max-xl:before:text-fg-muted max-xl:before:mr-4',
};

// CDK handles `position: sticky` + left/right offsets via its sticky styler.
// We only add the decorative background + z-index so overlapping cells stay opaque,
// plus a hairline shadow on the inner edge so the pinned column reads as floating
// over scrolled content. Direction follows the pinned edge:
//   sticky-start (pinned left)  → 1px shadow on the right side
//   sticky-end   (pinned right) → 1px shadow on the left side
const STICKY_CELL_ZINDEX = 'z-[5]';
const STICKY_START_SHADOW = 'shadow-table-sticky-cell-start';
const STICKY_END_SHADOW = 'shadow-table-sticky-cell-end';

const INTERACTIVE_TAGS = new Set([
  'BUTTON',
  'A',
  'INPUT',
  'SELECT',
  'OPTION',
  'TEXTAREA',
  'LABEL',
  'SUMMARY',
]);

// ── Helpers ──────────────────────────────────────────────────────────

function formatLabel(
  template: string,
  vars: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

function coerceCssSize(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  return typeof value === 'number' ? `${value}px` : value;
}

// ── Cell/Header/Footer template directives ────────────────────────────
//
// These DO NOT extend the CDK counterparts. The ColumnComponent renders its
// own <td cdk-cell *cdkCellDef>…</td> internally and forwards the consumer's
// TemplateRef via ngTemplateOutlet with a typed context. Decoupling from CDK
// here keeps our cell contexts strongly typed with extra fields (`columnIndex`,
// `column`, `row`) that CDK's `CdkCellOutletRowContext` lacks.

/** Structural directive on an `<ng-template>` (or a star-directive host) defining a column's data-cell template. Typed as `TwCellContext<T>`. */
@Directive({ selector: '[twCellDef]' })
export class CellDefDirective<T = unknown> {
  /** @internal */
  readonly template = inject(TemplateRef<TwCellContext<T>>);

  /** @internal */
  static ngTemplateContextGuard<T>(
    _dir: CellDefDirective<T>,
    _ctx: unknown,
  ): _ctx is TwCellContext<T> {
    return true;
  }
}

/** Structural directive defining a column's header-cell template. Typed as `TwHeaderCellContext`. */
@Directive({ selector: '[twHeaderCellDef]' })
export class HeaderCellDefDirective {
  /** @internal */
  readonly template = inject(TemplateRef<TwHeaderCellContext>);

  /** @internal */
  static ngTemplateContextGuard(
    _dir: HeaderCellDefDirective,
    _ctx: unknown,
  ): _ctx is TwHeaderCellContext {
    return true;
  }
}

/** Structural directive defining a column's footer-cell template. Typed as `TwFooterCellContext<T>`. */
@Directive({ selector: '[twFooterCellDef]' })
export class FooterCellDefDirective<T = unknown> {
  /** @internal */
  readonly template = inject(TemplateRef<TwFooterCellContext<T>>);

  /** @internal */
  static ngTemplateContextGuard<T>(
    _dir: FooterCellDefDirective<T>,
    _ctx: unknown,
  ): _ctx is TwFooterCellContext<T> {
    return true;
  }
}

// ── No-data row + expansion directives ───────────────────────────────
//
// Row / header-row / footer-row defs are auto-generated inline in the
// `<tw-table>` template based on `<tw-column>` declarations. `*twNoDataRow`
// and `*twRowExpansion` remain as consumer-facing directives because they
// carry custom templates the consumer projects.

/** Structural directive on an `<ng-template>` declaring the no-data row fallback. Takes precedence over `[slot="empty"]` when both are present. */
@Directive({
  selector: 'ng-template[twNoDataRow]',
  providers: [{ provide: CdkNoDataRow, useExisting: NoDataRowDirective }],
})
export class NoDataRowDirective extends CdkNoDataRow {}

/** Structural directive on an `<ng-template>` declaring the row-expansion template. Requires `[multiTemplateRows]="true"` on the parent `<tw-table>`. */
@Directive({ selector: 'ng-template[twRowExpansion]' })
export class RowExpansionDirective<T = unknown> {
  /** Optional predicate that decides whether this expansion renders for a given row. Defaults to `undefined` (render for every expanded row). Alias: `twRowExpansionWhen`. */
  readonly predicate = input<((row: T, index: number) => boolean) | undefined>(
    undefined,
    { alias: 'twRowExpansionWhen' },
  );

  /** @internal */
  readonly template = inject(TemplateRef<TwRowExpansionContext<T>>);

  /** @internal */
  static ngTemplateContextGuard<T>(
    _dir: RowExpansionDirective<T>,
    _ctx: unknown,
  ): _ctx is TwRowExpansionContext<T> {
    return true;
  }
}

// ── ColumnComponent ───────────────────────────────────────────────────
//
// `<tw-column>` is a pure metadata component — it holds the column's inputs
// and collects the consumer's header/data/footer cell templates via
// `contentChild`. The actual `<ng-container cdkColumnDef>` + cell renderers
// are emitted inline in `<tw-table>`'s template via a `@for` loop. This keeps
// every CDK defn (column, row, header-row, footer-row) inside CdkTable's
// DIRECT content, so its `@ContentChildren` queries resolve them on first
// render without our having to wire programmatic `addColumnDef` + deal with
// its timing quirks.

let nextColumnId = 0;

/**
 * Declares a single column of a `<tw-table>`. Pure-metadata component — its
 * host element is `display: none`; the column's `<th>` / `<td>` / `<tfoot>`
 * renderers are emitted by the parent `<tw-table>` using the projected cell
 * templates (`*twHeaderCellDef`, `*twCellDef`, `*twFooterCellDef`).
 */
@Component({
  selector: 'tw-column',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: {
    'style': 'display: none',
  },
})
export class ColumnComponent<T = unknown> {
  /** Unique identifier for this column. Required — referenced by `*twRowDef` / `*twHeaderRowDef` and used as the CDK `cdkColumnDef` name. */
  readonly name = input.required<string>();

  /** Visual configuration: sticky, align, numeric, hideBelow, width. Accepts any subset; unset keys fall back to the defaults. */
  readonly display = input<TwColumnDisplay>({});

  /** When true, removes this column from the visible column set. Defaults to `false`. */
  readonly hidden = input<boolean>(false);

  /** Ordering hint for the default visible-columns list when no `*twRowDef` is declared. Lower renders first. Defaults to `0`. */
  readonly priority = input<number>(0);

  /** Plain text header label. Used when no `*twHeaderCellDef` template is projected. Defaults to `undefined`. */
  readonly headerLabel = input<string | undefined>(undefined);

  /** Label used as `data-label` on cells in responsive `'stack'` mode. Falls back to `headerLabel`, then `name`. Defaults to `undefined`. */
  readonly stackLabel = input<string | undefined>(undefined);

  /**
   * Explicit override for the column header's `aria-sort` attribute. When unset (the default),
   * the column derives its `aria-sort` from a parent `[twSort]` directive via the `TW_SORT_HANDLE`
   * token — the column is treated as active when the directive's `active` id matches this column's
   * `name`. Set explicitly to `'ascending'` / `'descending'` / `'none'` to override; `null` disables
   * the attribute entirely. Defaults to `null`.
   */
  readonly sortState = input<TwColumnAriaSort>(null);

  /** @internal Stable identifier used for DOM `data-*` hooks. */
  readonly columnId = `tw-column-${nextColumnId++}`;

  private readonly sortHandle = inject(TW_SORT_HANDLE, { optional: true });

  /** @internal Consumer-projected header-cell template (optional). */
  readonly headerCellDef = contentChild(HeaderCellDefDirective);

  /** @internal Consumer-projected data-cell template. */
  readonly cellDef = contentChild(CellDefDirective<T>);

  /** @internal Consumer-projected footer-cell template (optional). */
  readonly footerCellDef = contentChild(FooterCellDefDirective<T>);

  /** @internal Index in the visible column set — pushed by the parent table. */
  readonly columnIndex = signal(0);

  /** @internal Row snapshot pushed by the parent for footer-cell contexts. */
  readonly rowsSnapshot = signal<readonly T[]>([]);

  /** @internal Table-pushed extra classes (sticky / hide-below / responsive decorations). */
  readonly extraCellClass = signal('');
  readonly extraHeaderClass = signal('');
  readonly extraFooterClass = signal('');

  /** Resolved display config — partial input merged with `DISPLAY_DEFAULTS`. */
  readonly resolvedDisplay = computed<Required<TwColumnDisplay>>(() => ({
    ...DISPLAY_DEFAULTS,
    ...this.display(),
  }));

  /** @internal Convenience accessor for the cdkColumnDef `[sticky]` binding. */
  readonly stickyStart = computed(() => this.resolvedDisplay().sticky === 'start');

  /** @internal Convenience accessor for the cdkColumnDef `[stickyEnd]` binding. */
  readonly stickyEnd = computed(() => this.resolvedDisplay().sticky === 'end');

  /** @internal Effective align — `numeric` forces `'end'` unless `align` is explicitly set to a non-default value. */
  readonly effectiveAlign = computed<TwColumnAlign>(() => {
    const display = this.resolvedDisplay();
    if (display.align === 'start' && display.numeric) return 'end';
    return display.align;
  });

  /** @internal CSS width string applied to cells. */
  readonly resolvedWidth = computed<string | null>(() =>
    coerceCssSize(this.resolvedDisplay().width),
  );

  /** @internal `data-label` emitted on cells in stack mode. */
  readonly stackDataLabel = computed<string>(
    () => this.stackLabel() ?? this.headerLabel() ?? this.name(),
  );

  /** @internal Align class plus tabular-numerals when `numeric` is true — shared by data and footer cells. */
  private readonly dataCellPrefix = computed(() => {
    const align = ALIGN_CLASSES[this.effectiveAlign()];
    const numeric = this.resolvedDisplay().numeric ? '[font-variant-numeric:tabular-nums]' : '';
    return numeric ? `${align} ${numeric}` : align;
  });

  readonly cellClasses = computed(() =>
    [this.dataCellPrefix(), this.extraCellClass()].filter(Boolean).join(' '),
  );

  readonly headerCellClasses = computed(() =>
    [ALIGN_CLASSES[this.effectiveAlign()], this.extraHeaderClass()].filter(Boolean).join(' '),
  );

  readonly footerCellClasses = computed(() =>
    [this.dataCellPrefix(), this.extraFooterClass()].filter(Boolean).join(' '),
  );

  /**
   * @internal `aria-sort` value for the column's `<th>`. Explicit `sortState` wins; otherwise the
   * column auto-resolves against a parent `[twSort]` directive (`TW_SORT_HANDLE`). Returns `null`
   * when no sort is wired or the column is not the active sort, so the attribute is omitted.
   */
  readonly ariaSort = computed<TwColumnAriaSort>(() => {
    const explicit = this.sortState();
    if (explicit !== null) return explicit;
    const handle = this.sortHandle;
    if (!handle) return null;
    if (handle.active() !== this.name()) return null;
    const direction = handle.direction();
    if (direction === 'asc') return 'ascending';
    if (direction === 'desc') return 'descending';
    return null;
  });

  readonly headerContext = computed<TwHeaderCellContext>(() => ({
    $implicit: this.name(),
    column: this.name(),
    columnIndex: this.columnIndex(),
  }));

  readonly footerContext = computed<TwFooterCellContext<T>>(() => ({
    $implicit: this.name(),
    column: this.name(),
    columnIndex: this.columnIndex(),
    rows: this.rowsSnapshot(),
  }));

  /** @internal Builds the per-cell template context from CDK-provided row variables. */
  buildCellContext(
    row: T,
    index: number,
    count: number,
    first: boolean,
    last: boolean,
    even: boolean,
    odd: boolean,
  ): TwCellContext<T> {
    return {
      $implicit: row,
      row,
      column: this.name(),
      index,
      columnIndex: this.columnIndex(),
      first,
      last,
      even,
      odd,
      count,
    };
  }
}

// ── TableComponent ────────────────────────────────────────────────────

let nextTableId = 0;

/**
 * A highly customizable data-table component wrapping `@angular/cdk/table`.
 *
 * Composes with other ngx-tw primitives:
 * - Sortable headers: place `[twSort]` on `<tw-table>` and `[tw-sort-header]` inside `*twHeaderCellDef`.
 * - Pagination: project `<tw-paginator slot="pagination">` as a child.
 * - Loading spinner: project `<tw-spinner slot="loading">` or rely on the built-in fallback.
 */
@Component({
  selector: 'tw-table',
  exportAs: 'twTable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkTableModule, NgTemplateOutlet, CheckboxComponent],
  templateUrl: './table.html',
  host: {
    '[class]': 'hostClasses()',
  },
})
export class TableComponent<T = unknown> {
  // ── Inputs ──

  /** The table's rows. Accepts a plain array, an `Observable<readonly T[]>`, or a CDK `DataSource<T>`. Wired directly to `CdkTable.dataSource`. Defaults to an empty array. */
  readonly data = input<TwTableDataSourceInput<T>>([] as readonly T[]);

  /**
   * Tracking function used to identify rows across data changes. When unset, rows are identified by
   * object reference.
   *
   * This drives **selection and expansion membership** as well as CDK's DOM diffing. Supply it when
   * the data source re-emits equal-but-new objects — an HTTP refetch, an immutable store — or the
   * user's selection empties on every refresh with no event and no error. It is called with `-1` as
   * the index for membership lookups, so return a value derived from the row alone (`row.id`), not
   * from the index.
   */
  readonly trackBy = input<TrackByFunction<T> | undefined>(undefined);

  /** When true, renders the loading slot as an overlay and applies `opacity-60 pointer-events-none` to the body. Defaults to `false`. */
  readonly loading = input<boolean>(false);

  /** When non-null, renders the error slot in place of the body. Defaults to `null`. */
  readonly error = input<unknown | null>(null);

  /** Visual configuration — `variant`, `density`, `size`, `layout`, `rowAnimations`. Accepts a partial; unset keys fall back to the defaults. */
  readonly appearance = input<TwTableAppearance>({});

  /** Sticky configuration — `header`, `footer`, `scrollHeight`. Accepts a partial; unset keys fall back to the defaults. */
  readonly sticky = input<TwTableSticky>({});

  /** Responsive configuration — `mode`, `stackBelow`. Accepts a partial; unset keys fall back to the defaults. */
  readonly responsive = input<TwTableResponsive>({});

  /** Selection configuration — `enabled`. Accepts a partial; unset keys fall back to the defaults. */
  readonly selection = input<TwTableSelection>({});

  /** Whether multiple row templates may render per data object. Required for `*twRowExpansion` and advanced `*twRowDef [when]` usage. Defaults to `false`. */
  readonly multiTemplateRows = input<boolean>(false);

  /** Overrides for user-facing strings. Unset keys fall back to the English defaults. Defaults to `{}`. */
  readonly labels = input<Partial<TwTableLabels>>({});

  /** Accessible name for the `<table>`. Required when no visible `<caption slot="caption">` is provided. Defaults to `undefined`. Alias: `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** Id of an external element labelling the table. Mirrored to `aria-labelledby` on the `<table>`. Defaults to `undefined`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  // ── Models (two-way) ──

  /** Two-way bound set of rows currently expanded. Immutable — set a new `Set` on every change; do not mutate in place. Defaults to an empty set. */
  readonly expandedRows = model<ReadonlySet<T>>(new Set<T>());

  /** Two-way bound list of selected rows. Set a new array on every change; do not mutate. Only used when `selection.enabled` is `true`. Defaults to an empty array. */
  readonly selected = model<readonly T[]>([]);

  // ── Outputs ──

  /** Fires when a row is clicked. Suppressed when the click originated inside an interactive descendant (button, link, input, etc.). */
  readonly rowClicked = output<TwRowClickEvent<T>>();

  /** Fires after `selected` changes via user interaction (not on programmatic writes). */
  readonly selectionChange = output<TwSelectionChangeEvent<T>>();

  /** Fires after a row is expanded or collapsed by user interaction. */
  readonly expansionChange = output<TwRowExpansionChangeEvent<T>>();

  // ── Content queries ──

  /** @internal Projected columns. */
  readonly columns = contentChildren(ColumnComponent<T>, { descendants: true });

  /** @internal Projected custom no-data row (takes precedence over the fallback empty state). */
  readonly noDataRow = contentChild(NoDataRowDirective, { descendants: true });

  /** @internal Projected expansion row template. */
  readonly expansionTemplate = contentChild(RowExpansionDirective<T>, { descendants: true });

  // ── View children ──

  /** @internal The CDK table inside our view. */
  readonly cdkTable = viewChild.required<CdkTable<T>>('cdkTable');

  // ── Injected services ──

  private readonly _liveAnnouncer = inject(LiveAnnouncer);
  private readonly _elementRef = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);

  // ── Identifiers ──

  /** Unique per-instance id used to scope row/expansion DOM ids. */
  readonly hostId = `tw-table-${nextTableId++}`;

  /** Returns the DOM id used for the expansion row of the given data row at the given index. Useful for wiring `aria-controls` from a trigger cell. */
  readonly expansionId = (_row: T, index: number): string =>
    `${this.hostId}-expansion-${index}`;

  // ── Resolved config (partial input merged with defaults) ──

  /** @internal Resolved visual configuration. */
  readonly resolvedAppearance = computed<Required<TwTableAppearance>>(() => ({
    ...APPEARANCE_DEFAULTS,
    ...this.appearance(),
  }));

  /** @internal Resolved sticky configuration. */
  readonly resolvedSticky = computed<Required<TwTableSticky>>(() => ({
    ...STICKY_DEFAULTS,
    ...this.sticky(),
  }));

  /** @internal Resolved responsive configuration. */
  readonly resolvedResponsive = computed<Required<TwTableResponsive>>(() => ({
    ...RESPONSIVE_DEFAULTS,
    ...this.responsive(),
  }));

  /** @internal Resolved selection configuration. */
  readonly resolvedSelection = computed<Required<TwTableSelection>>(() => ({
    ...SELECTION_DEFAULTS,
    ...this.selection(),
  }));

  // ── Derived state ──

  /** @internal Snapshot of the data array (for footer-cell context). Empty array for async data sources. */
  readonly resolvedRows = computed<readonly T[]>(() => {
    const d = this.data();
    return Array.isArray(d) ? (d as readonly T[]) : [];
  });

  /** @internal Whether the data input is a plain array. */
  readonly dataIsArray = computed(() => Array.isArray(this.data()));

  /** @internal Snapshot-based empty check; `false` for async sources (we can't know without subscribing). */
  readonly isEmptySnapshot = computed(
    () => this.dataIsArray() && this.resolvedRows().length === 0,
  );

  /** @internal Whether the empty overlay fallback should render (no no-data-row projected). */
  readonly shouldRenderEmptyOverlay = computed(
    () =>
      this.isEmptySnapshot() &&
      !this.loading() &&
      this.error() === null &&
      !this.noDataRow(),
  );

  /** @internal Whether the error overlay should render. */
  readonly shouldRenderErrorOverlay = computed(() => this.error() !== null);

  /** @internal Resolved table labels (defaults merged with input overrides). */
  readonly resolvedLabels = computed<TwTableLabels>(() => ({
    ...DEFAULT_TABLE_LABELS,
    ...this.labels(),
  }));

  /** @internal Computed error message for the default error overlay. Empty when no error is set. */
  readonly errorMessage = computed(() => {
    const err = this.error();
    if (err == null) return '';
    return `${this.resolvedLabels().errorPrefix}${String(err)}`;
  });

  /** @internal CSS max-height string for the scroll container. */
  readonly maxHeightStyle = computed(() => coerceCssSize(this.resolvedSticky().scrollHeight));

  /** @internal The visible (non-hidden) columns in render order (by ascending `priority`). */
  readonly visibleColumns = computed<readonly ColumnComponent<T>[]>(() =>
    this.columns()
      .filter((c) => !c.hidden())
      .sort((a, b) => a.priority() - b.priority()),
  );

  /** @internal Column names of the visible set, prefixed with `_selection` when `selection.enabled === true`. */
  readonly visibleColumnNames = computed<readonly string[]>(() => {
    const names = this.visibleColumns().map((c) => c.name());
    return this.resolvedSelection().enabled ? ['_selection', ...names] : names;
  });

  /** @internal Whether any column has a projected footer-cell template. */
  readonly hasFooterRow = computed<boolean>(() =>
    this.visibleColumns().some((c) => !!c.footerCellDef()),
  );

  /** @internal Whether an expansion template has been declared and multi-template rows are enabled. */
  readonly hasExpansion = computed(
    () => this.multiTemplateRows() && !!this.expansionTemplate(),
  );

  /** @internal Colspan to use for the expansion `<td>`. */
  readonly expansionColspan = computed(() => {
    const cols = this.visibleColumns().length;
    return Math.max(1, cols + (this.resolvedSelection().enabled ? 1 : 0));
  });

  /** @internal Pulled by the template for the `*cdkHeaderRowDef`/`*cdkFooterRowDef` `sticky:` field. */
  readonly stickyHeader = computed(() => this.resolvedSticky().header);
  readonly stickyFooter = computed(() => this.resolvedSticky().footer);

  // ── Variant class computation ──

  private readonly _variantResult = computed(() => {
    const appearance = this.resolvedAppearance();
    const stickyCfg = this.resolvedSticky();
    return tableVariants({
      variant: appearance.variant,
      density: appearance.density,
      size: appearance.size,
      layout: appearance.layout,
      stickyHeader: stickyCfg.header,
      stickyFooter: stickyCfg.footer,
      loading: this.loading(),
    });
  });

  readonly hostClasses = computed(() => this._variantResult().root());
  readonly toolbarClasses = computed(() => this._variantResult().toolbar());
  readonly scrollWrapperClasses = computed(() => this._variantResult().scrollWrapper());
  readonly scrollContainerClasses = computed(() => {
    const base = this._variantResult().scrollContainer();
    return this.maxHeightStyle() ? `${base} overflow-y-auto` : base;
  });

  readonly tableClasses = computed(() => {
    const base = this._variantResult().table();
    const responsive = this.resolvedResponsive();
    if (responsive.mode !== 'stack') return base;
    return `${base} ${STACK_TABLE_UTILITIES[responsive.stackBelow]}`;
  });

  readonly thClasses = computed(() => this._variantResult().th());
  readonly tdClasses = computed(() => {
    const base = this._variantResult().td();
    const responsive = this.resolvedResponsive();
    if (responsive.mode === 'stack') {
      return `${base} ${STACK_CELL_UTILITIES[responsive.stackBelow]}`;
    }
    return base;
  });
  readonly footerTdClasses = computed(() => this._variantResult().footerTd());
  readonly emptyStateClasses = computed(() => this._variantResult().emptyState());
  readonly emptyIconClasses = computed(() => this._variantResult().emptyIcon());
  readonly emptyMessageClasses = computed(() => this._variantResult().emptyMessage());
  readonly loadingOverlayClasses = computed(() => this._variantResult().loadingOverlay());
  readonly loadingMessageClasses = computed(() => this._variantResult().loadingMessage());
  readonly errorStateClasses = computed(() => this._variantResult().errorState());
  readonly errorIconClasses = computed(() => this._variantResult().errorIcon());
  readonly errorMessageClasses = computed(() => this._variantResult().errorMessage());
  readonly footerSlotClasses = computed(() => this._variantResult().footerSlot());
  readonly paginationSlotClasses = computed(() => this._variantResult().paginationSlot());
  readonly expansionRowClasses = computed(() => this._variantResult().expansionRow());
  readonly expansionCellClasses = computed(() => this._variantResult().expansionCell());
  readonly selectionHeaderClasses = computed(() => {
    const base = this._variantResult().selectionHeader();
    return [base, this.thClasses()].filter(Boolean).join(' ');
  });
  readonly selectionCellClasses = computed(() => {
    const base = this._variantResult().selectionCell();
    return [base, this.tdClasses()].filter(Boolean).join(' ');
  });

  // ── CdkTable wiring ──
  //
  // All CdkColumnDefs + row defs are rendered INLINE in our template (see
  // `table.html`), so CdkTable's own @ContentChildren queries resolve them on
  // first render without our having to programmatically register anything.
  //
  // The noDataRow and expansion template are projected by consumers — we bridge
  // those to CdkTable via `setNoDataRow` (expansion uses an inline fallback
  // column + row def in the template).

  constructor() {
    // Forward dataSource / trackBy / multiTemplateRows / fixedLayout to the CDK
    // table whenever the inputs change.
    effect(() => {
      const table = this.cdkTable();
      if (!table) return;
      table.dataSource = this.data();
      const tb = this.trackBy();
      if (tb) table.trackBy = tb;
      table.multiTemplateDataRows = this.multiTemplateRows();
      table.fixedLayout = this.resolvedAppearance().layout === 'fixed';
    });

    // Bridge the projected no-data row to CdkTable.
    let registeredNoDataRow: NoDataRowDirective | null = null;
    effect(() => {
      const table = this.cdkTable();
      const noDataRow = this.noDataRow() ?? null;
      if (!table) return;
      if (registeredNoDataRow !== noDataRow) {
        table.setNoDataRow(noDataRow);
        registeredNoDataRow = noDataRow;
      }
    });

    // Expansion-set changes don't mutate `data`, so CdkTable's internal differ
    // doesn't know to re-evaluate row `when` predicates. Trigger a manual render
    // whenever the expansion set changes.
    effect(() => {
      this.expandedRows();
      const table = untracked(() => this.cdkTable());
      if (table) queueMicrotask(() => table.renderRows());
    });

    // Update each column's extra-class signals + columnIndex on relevant input changes.
    // Pushes the table-level `th` / `td` / `footerTd` classes plus per-column decorations
    // (sticky, hideBelow). ColumnComponent combines these with its own align/numeric bits.
    effect(() => {
      const visible = this.visibleColumns();
      const responsiveMode = this.resolvedResponsive().mode;
      const thCls = this.thClasses();
      const tdCls = this.tdClasses();
      const footerCls = this.footerTdClasses();

      untracked(() => {
        const allCols = this.columns();
        allCols.forEach((col) => {
          const visibleIndex = visible.indexOf(col);
          col.columnIndex.set(Math.max(0, visibleIndex));

          const display = col.resolvedDisplay();
          const decor: string[] = [];
          if (display.sticky === 'start') {
            decor.push(STICKY_CELL_ZINDEX, 'bg-surface-raised', STICKY_START_SHADOW);
          } else if (display.sticky === 'end') {
            decor.push(STICKY_CELL_ZINDEX, 'bg-surface-raised', STICKY_END_SHADOW);
          }
          if (display.hideBelow && responsiveMode === 'hide') {
            decor.push(HIDE_BELOW_UTILITIES[display.hideBelow]);
          }

          const decorCls = decor.join(' ');
          col.extraHeaderClass.set(`${thCls} ${decorCls}`.trim());
          col.extraCellClass.set(`${tdCls} ${decorCls}`.trim());
          col.extraFooterClass.set(`${footerCls} ${decorCls}`.trim());
        });
      });
    });

    // Push row snapshot into each column for footer-cell contexts.
    effect(() => {
      const rows = this.resolvedRows();
      const cols = this.columns();
      untracked(() => cols.forEach((c) => c.rowsSnapshot.set(rows)));
    });

    // Dev-mode: duplicate column name guard.
    effect(() => {
      if (!isDevMode()) return;
      const names = this.columns().map((c) => c.name());
      const seen = new Set<string>();
      for (const n of names) {
        if (seen.has(n)) {
          throw new Error(
            `[tw-table] duplicate column name '${n}'. Every <tw-column> must have a unique \`name\`.`,
          );
        }
        seen.add(n);
      }
    });

    // Dev-mode: require multiTemplateRows when row-expansion is declared.
    effect(() => {
      if (!isDevMode()) return;
      const tpl = this.expansionTemplate();
      if (tpl && !this.multiTemplateRows()) {
        throw new Error(
          '[tw-table] *twRowExpansion requires [multiTemplateRows]="true" on <tw-table>.',
        );
      }
    });

    // Dev-mode: accessible-name warning, once mounted.
    afterNextRender(() => {
      if (!isDevMode()) return;
      const hasCaption = !!this._elementRef.nativeElement.querySelector('caption');
      if (!hasCaption && !this.ariaLabel() && !this.ariaLabelledby()) {

        console.warn(
          '[tw-table] no accessible name provided. Add a `<caption slot="caption">`, `[aria-label]`, or `[aria-labelledby]`.',
        );
      }
    });

    // Loading announcement.
    //
    // The effect tracks `this.loading()` only; reads of labels / rows are wrapped
    // in `untracked()` so unrelated upstream signals (label updates, row mutations
    // that don't toggle loading) don't re-announce. The announcement should fire
    // once per loading-state transition, never on incidental data changes.
    effect(() => {
      const loading = this.loading();
      const labels = untracked(() => this.resolvedLabels());
      if (loading) {
        this._liveAnnouncer.announce(labels.loading, 'polite');
      } else {
        const count = untracked(() =>
          this.dataIsArray() ? this.resolvedRows().length : 0,
        );
        if (count > 0) {
          this._liveAnnouncer.announce(
            formatLabel(labels.rowsUpdatedAnnouncement, { count }),
            'polite',
          );
        }
      }
    });
  }

  // ── Row-click + expansion + selection helpers ──

  /** @internal Called by the template when a data row is clicked. */
  handleRowClick(row: T, index: number, event: MouseEvent): void {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    for (const node of path) {
      if (!(node instanceof HTMLElement)) continue;
      if (node === event.currentTarget) break;
      if (INTERACTIVE_TAGS.has(node.tagName)) return;
      if (node.hasAttribute('tabindex') && node.tabIndex >= 0 && node.tagName !== 'TR') return;
      const role = node.getAttribute('role');
      if (role === 'button' || role === 'link' || role === 'checkbox') return;
    }
    this.rowClicked.emit({ row, index, event });
  }

  /** @internal Whether a row is currently expanded. */
  isRowExpanded(row: T): boolean {
    const expanded = this.expandedRows();
    if (expanded.has(row)) return true;
    // `expandedRows` is a public `model<ReadonlySet<T>>`, and a JS Set cannot
    // take custom equality — so unlike selection this cannot be a keyed Set
    // without a breaking API change. A scan is acceptable here: expansion
    // holds a handful of rows, not the whole page. Skipped entirely when no
    // `trackBy` is supplied, since the reference check above is then complete.
    const track = this.trackBy();
    if (!track) return false;
    const key = this.rowKey(row);
    for (const candidate of expanded) {
      if (this.rowKey(candidate) === key) return true;
    }
    return false;
  }

  /** @internal CDK `when` predicate used for the auto-generated expansion row. */
  readonly expansionWhen = (index: number, row: T): boolean => {
    if (!this.hasExpansion()) return false;
    if (!this.expandedRows().has(row)) return false;
    const pred = this.expansionTemplate()?.predicate();
    if (typeof pred === 'function' && !pred(row, index)) return false;
    return true;
  };

  /** @internal Context object for the expansion template. */
  expansionContext(row: T, index: number): TwRowExpansionContext<T> {
    return {
      $implicit: row,
      row,
      index,
      collapse: () => this.collapse(row),
    };
  }

  /** Expands the given row if not already expanded and emits `expansionChange`. */
  expand(row: T): void {
    if (this.isRowExpanded(row)) return;
    const next = new Set(this.expandedRows());
    next.add(row);
    this.expandedRows.set(next);
    this.expansionChange.emit({ row, expanded: true, expandedRows: next });
  }

  /** Collapses the given row if currently expanded and emits `expansionChange`. */
  collapse(row: T): void {
    if (!this.isRowExpanded(row)) return;
    const next = new Set(this.expandedRows());
    if (!next.delete(row)) {
      // Row was matched by key rather than by reference — find and drop the
      // instance actually held in the set.
      const key = this.rowKey(row);
      for (const candidate of next) {
        if (this.rowKey(candidate) === key) {
          next.delete(candidate);
          break;
        }
      }
    }
    this.expandedRows.set(next);
    this.expansionChange.emit({ row, expanded: false, expandedRows: next });
  }

  /** Toggles the expansion state of the given row. */
  toggleExpansion(row: T): void {
    if (this.isRowExpanded(row)) this.collapse(row);
    else this.expand(row);
  }

  /**
   * @internal Identity key for a row.
   *
   * Selection and expansion are membership questions, and answering them by
   * object reference breaks the moment a data source re-emits equal-but-new
   * objects — an HTTP refetch, an immutable store, `signal.set([...mapped])`.
   * The user's selection empties with no event and no error.
   *
   * `trackBy` is already the consumer's declaration of row identity, so it is
   * reused here rather than adding a second, redundant input. With no `trackBy`
   * the key IS the row, i.e. reference identity — the same default CDK uses.
   *
   * Note this must be a *key* function, not a comparator: a comparator would fix
   * identity but leave membership as an O(rows x selected) scan, and a
   * reference-keyed Set would fix the scan but ignore custom identity. Only a
   * key fixes both.
   */
  private rowKey(row: T): unknown {
    const track = this.trackBy();
    return track ? track(-1, row) : row;
  }

  /** @internal O(1) membership lookup for the current selection, keyed by `rowKey`. */
  private readonly selectedKeys = computed<ReadonlySet<unknown>>(
    () => new Set(this.selected().map((row) => this.rowKey(row))),
  );

  /** Whether a given row is currently in the `selected` list. */
  isSelected(row: T): boolean {
    return this.selectedKeys().has(this.rowKey(row));
  }

  /** Selects or deselects a row and emits `selectionChange`. */
  setSelected(row: T, nextSelected: boolean): void {
    const previous = this.selected();
    const key = this.rowKey(row);
    const isAlreadySelected = this.selectedKeys().has(key);
    if (isAlreadySelected === nextSelected) return;
    const next = nextSelected
      ? [...previous, row]
      : previous.filter((r) => this.rowKey(r) !== key);
    this.selected.set(next);
    this.selectionChange.emit({
      selected: next,
      added: nextSelected ? [row] : [],
      removed: nextSelected ? [] : [row],
      previous,
    });
  }

  /**
   * Adds every row in the current data snapshot to `selected` that isn't already selected.
   * Emits `selectionChange` if anything changed. Only the array data-source path can compute a
   * full snapshot — for `Observable<T[]>` or `DataSource<T>` data inputs this is a no-op.
   */
  selectAll(): void {
    const rows = this.resolvedRows();
    if (rows.length === 0) return;
    const previous = this.selected();
    const previousKeys = this.selectedKeys();
    const added: T[] = [];
    for (const row of rows) {
      if (!previousKeys.has(this.rowKey(row))) added.push(row);
    }
    if (added.length === 0) return;
    const next: T[] = [...previous, ...added];
    this.selected.set(next);
    this.selectionChange.emit({ selected: next, added, removed: [], previous });
  }

  /** Clears every currently-selected row. Emits `selectionChange` if anything was selected. */
  clearSelection(): void {
    const previous = this.selected();
    if (previous.length === 0) return;
    this.selected.set([]);
    this.selectionChange.emit({ selected: [], added: [], removed: previous, previous });
  }

  /** @internal Returns `aria-selected` for a data row, or `null` to omit the attribute when selection is disabled. */
  rowAriaSelected(row: T): 'true' | 'false' | null {
    if (!this.resolvedSelection().enabled) return null;
    return this.isSelected(row) ? 'true' : 'false';
  }

  /**
   * @internal Tri-state summary of the current selection vs. the visible data snapshot.
   * `'none'` — nothing selected; `'some'` — partial; `'all'` — every snapshot row is selected.
   */
  readonly masterSelectionState = computed<'none' | 'some' | 'all'>(() => {
    const rows = this.resolvedRows();
    if (rows.length === 0) return 'none';
    const selected = this.selected();
    if (selected.length === 0) return 'none';
    const selectedKeys = this.selectedKeys();
    for (const row of rows) {
      if (!selectedKeys.has(this.rowKey(row))) return 'some';
    }
    return 'all';
  });

  /** @internal Whether the master "select all" checkbox should render checked. */
  readonly masterChecked = computed(() => this.masterSelectionState() === 'all');

  /** @internal Whether the master "select all" checkbox should render indeterminate. */
  readonly masterIndeterminate = computed(() => this.masterSelectionState() === 'some');

  /** @internal Wires the master checkbox change event to `selectAll` / `clearSelection`. */
  toggleMasterSelection(checked: boolean): void {
    if (checked) this.selectAll();
    else this.clearSelection();
  }

  /** @internal Formatted accessible label for a per-row selection checkbox. */
  selectRowLabel(rowIndex: number): string {
    return formatLabel(this.resolvedLabels().selectRowLabel, { index: rowIndex + 1 });
  }
}
