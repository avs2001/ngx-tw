export { CalendarComponent } from './calendar';
export type { TwCalendarSelectionMode } from './calendar';

export { TwCalendarPresets } from './calendar-presets';

export { CalendarHeaderComponent } from './calendar-header';

export { CalendarCellComponent } from './calendar-cell';
export type { CalendarCellKeyNavEvent } from './calendar-cell';

export { CalendarViewBase } from './calendar-view-base';
export { MonthViewComponent } from './month-view';
export { YearViewComponent } from './year-view';
export { MultiYearViewComponent, yearsPerPage } from './multi-year-view';

export type {
  DateRange,
  CalendarView,
  CalendarCellState,
  CalendarCell,
  CalendarCellConfig,
  NameStyle,
  DateFilterFn,
  DateClassFn,
} from './calendar.types';
export {
  createDateRange,
  createCalendarCell,
  DAYS_PER_WEEK,
  WEEKS_PER_MONTH,
  YEARS_PER_PAGE,
  YEARS_PER_ROW,
  MONTHS_PER_ROW,
} from './calendar.types';

export {
  createGrid,
  navigateGrid,
  getWeekdayHeaders,
  isDateDisabled,
  isMonthDisabled,
  isYearDisabled,
  getMultiYearStartingYear,
  isDateInRange,
  getFirstDayOfMonth,
} from './calendar.utils';
export type { WeekdayHeader } from './calendar.utils';

export { DateAdapter, DATE_ADAPTER } from './date-adapter';
export type { TwDateNameStyle } from './date-adapter';

export {
  NativeDateAdapter,
  provideNativeDateAdapter,
  provideTwCalendar,
} from './native-date-adapter';
export type { TwNativeDateFormat } from './native-date-adapter';

export { TwDateRange, toTwDateRange } from './date-range';
export type { TwDateRangeInput } from './date-range';

export * from './selection';

/** @deprecated Alias for `CalendarView`. */
export type { CalendarView as TwCalendarView } from './calendar.types';

/** @deprecated Alias for `DateFilterFn<D>`. */
export type { DateFilterFn as TwDateFilter } from './calendar.types';

/** @deprecated Alias for `DateClassFn<D>`. */
export type { DateClassFn as TwCalendarCellClassFn } from './calendar.types';
