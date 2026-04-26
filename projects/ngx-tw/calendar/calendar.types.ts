/**
 * Calendar shared types. Aligned with `docs/requirements/calendar-component-requirements.md` v2.6
 * (§7.1, §7.4, §8, §10.2, §22.5, §33).
 */

// -----------------------------------------------------------------------------
// Value shape (§7.1, §7.4)
// -----------------------------------------------------------------------------

/** Selection mode exposed via the `mode` input. `'week'` is `[WONT] v1` — week-as-unit selection remains available via the DI-only `WeekSelectionStrategy`. */
export type CalendarMode = 'single' | 'multiple' | 'range';

/** Value shape for `mode: 'single'`. */
export type CalendarSingleValue<D> = D | null;

/** Value shape for `mode: 'multiple'`. */
export type CalendarMultipleValue<D> = D[];

/** Value shape for `mode: 'range'`. Endpoints are independent — either can be `null`. */
export interface CalendarRangeValue<D> {
  readonly start: D | null;
  readonly end: D | null;
}

/** Mode-parameterized value. `mode: 'single' → D | null`, `'multiple' → D[]`, `'range' → { start; end }`. */
export type CalendarValue<M extends CalendarMode, D> = M extends 'single'
  ? CalendarSingleValue<D>
  : M extends 'multiple'
    ? CalendarMultipleValue<D>
    : M extends 'range'
      ? CalendarRangeValue<D>
      : never;

/** Mode-agnostic empty value — `null` for single, `[]` for multiple, `{ start: null, end: null }` for range. */
export function emptyCalendarValue<M extends CalendarMode, D>(mode: M): CalendarValue<M, D> {
  if (mode === 'single') return null as CalendarValue<M, D>;
  if (mode === 'multiple') return [] as unknown as CalendarValue<M, D>;
  return { start: null, end: null } as unknown as CalendarValue<M, D>;
}

// -----------------------------------------------------------------------------
// UI state (§7.4, §8.1)
// -----------------------------------------------------------------------------

/** Selection lifecycle. */
export type CalendarSelectionState = 'EMPTY' | 'SELECTING' | 'COMPLETE';

/** Which grid the user is looking at. `'day'` = 7×6 day grid, `'month'` = 4×3 months in a year, `'year'` = a page of years. */
export type CalendarViewState = 'day' | 'month' | 'year';

/** Overlay presentation lifecycle (Phase 10 wires the transitions). In inline mode this signal resolves to `null`. */
export type CalendarOverlayState = 'closed' | 'opening' | 'open' | 'closing';

// -----------------------------------------------------------------------------
// Behavior enums (§33.1)
// -----------------------------------------------------------------------------

/** How `mode: 'range'` handles the third click after a complete range. */
export type RangeClickBehavior = 'restart' | 'nearest-edge' | 'require-clear';

/** Granularity at which `mode: 'range'` commits (day-of-month, month-of-year, year). */
export type RangeGranularity = 'day' | 'month' | 'year';

/** What happens when the user tries to select past `maxSelections` in `mode: 'multiple'`. */
export type MaxSelectionBehavior = 'emit-limit-reached' | 'replace-oldest' | 'ignore';

/** How a form reset restores the calendar's internal state. `'full'` also resets view / active-date; `'value-only'` leaves navigation in place. */
export type ResetBehavior = 'full' | 'value-only';

/** Presentation on small viewports. `'auto'` = native overlay on ≥ 600 px, fullscreen otherwise. */
export type MobileMode = 'overlay' | 'fullscreen' | 'bottom-sheet' | 'auto';

// -----------------------------------------------------------------------------
// Validation (§10.2)
// -----------------------------------------------------------------------------

/** Union of validation error keys emitted by the built-in validator. Stable across versions. */
export type CalendarErrorCode =
  | 'calendarRequired'
  | 'calendarMinDate'
  | 'calendarMaxDate'
  | 'calendarDisabledDate'
  | 'calendarRangeTooShort'
  | 'calendarRangeTooLong'
  | 'calendarMaxSelections'
  | 'calendarInvalidRange'
  | 'calendarParseError'
  | 'calendarInvalidValue';

/** Shape returned by the built-in validator. Each code carries the context payload described in §10.2. */
export type CalendarValidationErrors = Partial<{
  calendarRequired: true;
  calendarMinDate: { min: unknown; actual: unknown };
  calendarMaxDate: { max: unknown; actual: unknown };
  calendarDisabledDate: { actual: unknown };
  calendarRangeTooShort: { length: number; min: number };
  calendarRangeTooLong: { length: number; max: number };
  calendarMaxSelections: { limit: number; actual: number };
  calendarInvalidRange: { start: unknown; end: unknown };
  calendarParseError: { raw: string };
  calendarInvalidValue: {
    expected: 'single' | 'multiple' | 'range';
    actual: unknown;
    reason: 'shape' | 'transformer';
  };
}>;

// -----------------------------------------------------------------------------
// Output payloads (§33.2)
// -----------------------------------------------------------------------------

/** Payload of `selectionComplete`. `reason` flags the commit path. */
export interface SelectionCompleteEvent<M extends CalendarMode, D> {
  readonly value: CalendarValue<M, D>;
  readonly reason: 'commit' | 'auto-swap' | 'nearest-edge' | 'preset';
}

/** Payload of `selectionCleared`. `reason` disambiguates user action from programmatic / mode-change / reset / disabled. */
export interface SelectionClearedEvent {
  readonly reason: 'user' | 'programmatic' | 'mode-change' | 'reset' | 'disabled';
}

/** Payload of `rangePreview`. `invalidPreview` is set when the hover crosses a disabled date and `disableRangesCrossingDisabledDates` is true, or the range length violates `min`/`maxRangeLength` (Phase 4 / 6 set this). */
export interface RangePreviewEvent<D> {
  readonly tentativeRange: { readonly start: D; readonly end: D };
  readonly invalidPreview: boolean;
}

/** Payload of `viewChange`. Distinguishes drill-down (day→month→year) from drill-up and from programmatic changes. */
export interface ViewChangeEvent {
  readonly from: CalendarViewState;
  readonly to: CalendarViewState;
  readonly reason: 'user' | 'programmatic' | 'drill-down' | 'drill-up';
}

/** Payload of `modeChange`. */
export interface ModeChangeEvent {
  readonly from: CalendarMode;
  readonly to: CalendarMode;
}

// -----------------------------------------------------------------------------
// Legacy types kept stable for Phase 1 (migrated in later phases)
// -----------------------------------------------------------------------------

/**
 * A date range with optional endpoints.
 * Kept as a structural type for backward-compat with the existing view implementation;
 * `CalendarRangeValue<D>` is the spec-canonical alias.
 */
export interface DateRange<D> {
  readonly start: D | null;
  readonly end: D | null;
}

/** Factory for a plain `DateRange<D>`. */
export function createDateRange<D>(start: D | null, end: D | null): DateRange<D> {
  return { start, end };
}

/**
 * Visual state of a single cell in any view.
 * Phase 4 replaces this with the `data-state-*` attribute surface (§34.5).
 */
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

/**
 * Data describing one renderable cell.
 * Phase 13 replaces this with `DayCellContext<D, T>` (§24.1) — kept in place through
 * Phases 1–12 so the existing month/year/years views compile without a wholesale view rewrite.
 */
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
  /** True when this cell falls outside the currently displayed month (day view only). */
  isOutOfMonth: boolean;
  /** True when this cell is a weekend day (Sat/Sun by default; locale-aware override planned). */
  isWeekend: boolean;
  /** True when this cell is part of a tentative range that violates a constraint (e.g., crosses a disabled date or exceeds `maxRangeLength`). */
  isInvalidPreview: boolean;
  /** True when the cell briefly flashes to indicate a rejected click (e.g., disabled commit, `rangeClickBehavior: 'require-clear'`). Auto-cleared by the orchestrator. */
  isInvalidFlash: boolean;
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
    isOutOfMonth: false,
    isWeekend: false,
    isInvalidPreview: false,
    isInvalidFlash: false,
  };
}

/** Style for month and weekday names. */
export type NameStyle = 'long' | 'short' | 'narrow';

/** Days in a week. */
export const DAYS_PER_WEEK = 7;
/** Rows in a month grid. */
export const WEEKS_PER_MONTH = 6;
/** Default years shown per page in the year view. Phase 7 replaces this constant with the `yearsPerPage` input (default 20 per §33.1). */
export const YEARS_PER_PAGE = 24;
/** Years per row in the year view. */
export const YEARS_PER_ROW = 4;
/** Months per row in the month (of year) view. */
export const MONTHS_PER_ROW = 4;

/** Predicate for per-date disabling — return `false` to disable. */
export type DateFilterFn<D> = (date: D) => boolean;

/**
 * Source for `disabledDates` (§10.1) — accepts either an explicit array of disabled dates
 * (compared via `adapter.sameDate`) or a predicate returning `true` for disabled dates.
 *
 * Note: this is the inverse of `dateFilter` (which returns `true` for ENABLED dates).
 * Both inputs are honored — a date is disabled if either source flags it.
 */
export type DisabledDates<D> = readonly D[] | ((date: D) => boolean);

/**
 * Aggregated constraint inputs (§10.1). Doubles as the shorthand object accepted by
 * `CalendarComponent`'s `constraints` input — every field is optional so consumers can
 * supply only what they need (e.g. `{ minDate, maxDate }` or `{ dateFilter }`). The
 * orchestrator's resolver normalizes missing fields to neutral values (`null` /
 * empty array) before evaluating cell state.
 *
 * Resolution rule on the `constraints` input: the individual `minDate` / `maxDate` /
 * `disabledDates` / `disabledDaysOfWeek` / `dateFilter` inputs win when both are set
 * non-null. This lets a consumer pass `[constraints]="defaults"` for a base set and
 * still override one field via the dedicated input.
 */
export interface CalendarConstraints<D> {
  readonly minDate?: D | null;
  readonly maxDate?: D | null;
  readonly disabledDates?: DisabledDates<D> | null;
  readonly disabledDaysOfWeek?: readonly number[] | null;
  readonly dateFilter?: DateFilterFn<D> | null;
}

/** Function producing extra per-cell CSS classes. */
export type DateClassFn<D> = (date: D, view: CalendarViewState) => string;
