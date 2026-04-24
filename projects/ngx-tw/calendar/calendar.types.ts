/**
 * Calendar shared types — mirrored from the Kubyk source, renamed where needed
 * to fit ngx-tw conventions.
 */

/** A date range with optional endpoints. */
export interface DateRange<D> {
  readonly start: D | null;
  readonly end: D | null;
}

/** Factory for a plain `DateRange<D>`. */
export function createDateRange<D>(start: D | null, end: D | null): DateRange<D> {
  return { start, end };
}

/** Available calendar views. */
export type CalendarView = 'month' | 'year' | 'multi-year';

/** Visual state of a single cell in any view. */
export type CalendarCellState =
  | 'default'
  | 'today'
  | 'selected'
  | 'range-start'
  | 'range-middle'
  | 'range-end'
  | 'disabled'
  | 'preview-start'
  | 'preview-middle'
  | 'preview-end';

/** Data describing one renderable cell. */
export interface CalendarCell<D> {
  /** The date value this cell represents. */
  value: D;
  /** Display text inside the cell (day number, short month name, year). */
  displayValue: string;
  /** Accessible label announced to screen readers. */
  ariaLabel: string;
  /** Whether the cell is interactive. Disabled cells still render. */
  enabled: boolean;
  /** Consumer-provided CSS classes (via `dateClass`). */
  cssClasses: string;
  /** True when this cell is today's date. */
  isToday: boolean;
  /** True when this cell is the committed selection (or part of a range). */
  isSelected: boolean;
  /** True when this cell starts a committed range. */
  isRangeStart: boolean;
  /** True when this cell is strictly inside a committed range. */
  isRangeMiddle: boolean;
  /** True when this cell ends a committed range. */
  isRangeEnd: boolean;
  /** True when this cell starts the hover-preview range. */
  isPreviewStart: boolean;
  /** True when this cell is inside the hover-preview range. */
  isPreviewMiddle: boolean;
  /** True when this cell ends the hover-preview range. */
  isPreviewEnd: boolean;
  /** Numeric comparison key used for focus tracking. */
  compareValue: number;
}

/** Configuration accepted by `createCalendarCell`. */
export interface CalendarCellConfig<D> {
  value: D;
  displayValue: string;
  ariaLabel: string;
  enabled?: boolean;
  cssClasses?: string;
  compareValue: number;
}

/** Factory for a `CalendarCell` with boolean state fields zeroed out. */
export function createCalendarCell<D>(config: CalendarCellConfig<D>): CalendarCell<D> {
  return {
    value: config.value,
    displayValue: config.displayValue,
    ariaLabel: config.ariaLabel,
    enabled: config.enabled ?? true,
    cssClasses: config.cssClasses ?? '',
    compareValue: config.compareValue,
    isToday: false,
    isSelected: false,
    isRangeStart: false,
    isRangeMiddle: false,
    isRangeEnd: false,
    isPreviewStart: false,
    isPreviewMiddle: false,
    isPreviewEnd: false,
  };
}

/** Style for month and weekday names. */
export type NameStyle = 'long' | 'short' | 'narrow';

/** Days in a week. */
export const DAYS_PER_WEEK = 7;
/** Rows in a month grid. */
export const WEEKS_PER_MONTH = 6;
/** Years shown in the multi-year view. */
export const YEARS_PER_PAGE = 24;
/** Years per row in the multi-year view. */
export const YEARS_PER_ROW = 4;
/** Months per row in the year view. */
export const MONTHS_PER_ROW = 4;

/** Predicate for per-date disabling — return `false` to disable. */
export type DateFilterFn<D> = (date: D) => boolean;

/** Function producing extra per-cell CSS classes. */
export type DateClassFn<D> = (date: D, view: CalendarView) => string;
