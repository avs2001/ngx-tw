import type { DateAdapter } from './date-adapter';
import type {
  CalendarConstraints,
  DateFilterFn,
  DisabledDates,
  NameStyle,
} from './calendar.types';

/** Arranges a flat array of items into a 2D grid with `columns` items per row. */
export function createGrid<T>(items: readonly T[], columns: number): T[][] {
  const grid: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    grid.push(items.slice(i, i + columns));
  }
  return grid;
}

/** Returns the new flat index after an arrow-key navigation step, or `null` on out of bounds. */
export function navigateGrid(
  currentIndex: number,
  direction: 'left' | 'right' | 'up' | 'down',
  totalItems: number,
  columns: number,
): number | null {
  let next: number;
  switch (direction) {
    case 'left':
      next = currentIndex - 1;
      break;
    case 'right':
      next = currentIndex + 1;
      break;
    case 'up':
      next = currentIndex - columns;
      break;
    case 'down':
      next = currentIndex + columns;
      break;
  }
  if (next < 0 || next >= totalItems) return null;
  return next;
}

/** Label pair for a weekday header cell. */
export interface WeekdayHeader {
  readonly label: string;
  readonly narrow: string;
}

/** Builds seven weekday headers rotated to start at `firstDayOfWeek` (or adapter default). */
export function getWeekdayHeaders<D>(
  adapter: DateAdapter<D>,
  style: NameStyle = 'long',
  firstDayOfWeek?: number,
): WeekdayHeader[] {
  const start = firstDayOfWeek ?? adapter.getFirstDayOfWeek();
  const longNames = adapter.getDayOfWeekNames(style);
  const narrowNames = adapter.getDayOfWeekNames('narrow');
  const out: WeekdayHeader[] = [];
  for (let i = 0; i < 7; i++) {
    const idx = (start + i) % 7;
    out.push({ label: longNames[idx] ?? '', narrow: narrowNames[idx] ?? '' });
  }
  return out;
}

/**
 * True when `date` falls outside `[minDate, maxDate]` or fails the filter.
 *
 * Phase 4 superset: also OR-checks `disabledDates` (array OR predicate) and
 * `disabledDaysOfWeek`. Legacy callers passing only the first four arguments
 * keep working — the new sources default to neutral values.
 */
export function isDateDisabled<D>(
  date: D,
  minDate: D | null,
  maxDate: D | null,
  dateFilter: DateFilterFn<D> | null,
  adapter: DateAdapter<D>,
  disabledDates: DisabledDates<D> | null = null,
  disabledDaysOfWeek: readonly number[] = [],
): boolean {
  if (minDate && adapter.compare(date, minDate) < 0) return true;
  if (maxDate && adapter.compare(date, maxDate) > 0) return true;
  if (dateFilter && !dateFilter(date)) return true;
  if (disabledDaysOfWeek.length > 0) {
    if (disabledDaysOfWeek.includes(adapter.getDayOfWeek(date))) return true;
  }
  if (disabledDates) {
    if (typeof disabledDates === 'function') {
      if (disabledDates(date)) return true;
    } else {
      for (const d of disabledDates) {
        if (adapter.sameDate(date, d)) return true;
      }
    }
  }
  return false;
}

/**
 * Phase 4 single-call constraint resolver — `true` when ANY source disables `date`.
 * Equivalent to `isDateDisabled(date, c.minDate, c.maxDate, c.dateFilter, adapter, c.disabledDates, c.disabledDaysOfWeek)`
 * but accepts the spec-shaped `CalendarConstraints<D>` aggregate.
 */
export function resolveDateDisabled<D>(
  date: D,
  constraints: CalendarConstraints<D>,
  adapter: DateAdapter<D>,
): boolean {
  return isDateDisabled(
    date,
    constraints.minDate,
    constraints.maxDate,
    constraints.dateFilter,
    adapter,
    constraints.disabledDates,
    constraints.disabledDaysOfWeek,
  );
}

/**
 * True when `date` is a weekend day (Saturday or Sunday by default — `adapter.getDayOfWeek`
 * returns `0` for Sunday and `6` for Saturday in the Gregorian contract). The optional
 * `weekendDays` parameter lets a consumer override per locale (e.g. `[5, 6]` for ar-SA).
 */
export function isWeekend<D>(
  date: D,
  adapter: DateAdapter<D>,
  weekendDays: readonly number[] = [0, 6],
): boolean {
  return weekendDays.includes(adapter.getDayOfWeek(date));
}

/**
 * Inclusive day-count between `start` and `end` — used for `minRangeLength` /
 * `maxRangeLength` validation and the `rangeUpdateAnnouncement` length argument.
 * Assumes `start <= end` (call-sites normalize first).
 */
export function rangeLengthDays<D>(start: D, end: D, adapter: DateAdapter<D>): number {
  let n = 1;
  let cursor = start;
  // Walk day-by-day to keep the math adapter-agnostic and DST-safe.
  // For ranges over a few months this is still microseconds.
  while (adapter.compare(cursor, end) < 0) {
    cursor = adapter.addDays(cursor, 1);
    n++;
  }
  return n;
}

/**
 * `true` when ANY date strictly between `start` and `end` (exclusive of the
 * endpoints when `includeEndpoints` is `false`) is disabled by `constraints`.
 * Used by `disableRangesCrossingDisabledDates` and the `invalidPreview` flag.
 */
export function rangeCrossesDisabled<D>(
  start: D,
  end: D,
  constraints: CalendarConstraints<D>,
  adapter: DateAdapter<D>,
  includeEndpoints = true,
): boolean {
  let cursor = includeEndpoints ? start : adapter.addDays(start, 1);
  const limit = includeEndpoints ? end : adapter.addDays(end, -1);
  while (adapter.compare(cursor, limit) <= 0) {
    if (resolveDateDisabled(cursor, constraints, adapter)) return true;
    cursor = adapter.addDays(cursor, 1);
  }
  return false;
}

/** True when the whole month falls outside `[minDate, maxDate]`. `month` is 0-based (matches `adapter.getMonth`). */
export function isMonthDisabled<D>(
  year: number,
  month: number,
  minDate: D | null,
  maxDate: D | null,
  adapter: DateAdapter<D>,
): boolean {
  const firstOfMonth = adapter.create(year, month + 1, 1);
  const lastOfMonth = adapter.create(year, month + 1, adapter.getNumDaysInMonth(firstOfMonth));
  if (minDate && adapter.compare(lastOfMonth, minDate) < 0) return true;
  if (maxDate && adapter.compare(firstOfMonth, maxDate) > 0) return true;
  return false;
}

/** True when the whole year falls outside `[minDate, maxDate]`. */
export function isYearDisabled<D>(
  year: number,
  minDate: D | null,
  maxDate: D | null,
  adapter: DateAdapter<D>,
): boolean {
  const firstOfYear = adapter.create(year, 1, 1);
  const lastOfYear = adapter.create(year, 12, 31);
  if (minDate && adapter.compare(lastOfYear, minDate) < 0) return true;
  if (maxDate && adapter.compare(firstOfYear, maxDate) > 0) return true;
  return false;
}

/** Aligns `activeYear` to the start of its `yearsPerPage`-block. */
export function getMultiYearStartingYear(activeYear: number, yearsPerPage = 24): number {
  return Math.floor(activeYear / yearsPerPage) * yearsPerPage;
}

/** True when `date` sits inside `[start, end]` (inclusive). */
export function isDateInRange<D>(
  date: D,
  start: D | null,
  end: D | null,
  adapter: DateAdapter<D>,
): boolean {
  if (!start || !end) return false;
  return adapter.compare(date, start) >= 0 && adapter.compare(date, end) <= 0;
}

/** Returns the first day of the month for `date`. */
export function getFirstDayOfMonth<D>(date: D, adapter: DateAdapter<D>): D {
  return adapter.create(adapter.getYear(date), adapter.getMonth(date) + 1, 1);
}
