export { CalendarComponent } from './calendar';

export {
  CalendarSingleDirective,
  CalendarMultipleDirective,
  CalendarRangeDirective,
} from './calendar-form-directives';

export {
  calendarValidator,
  calendarRequiredValidator,
  isCalendarValueEmpty,
} from './calendar-validators';
export type { CalendarValidatorContext } from './calendar-validators';

export { TwCalendarPresets } from './calendar-presets';

export { CalendarHeaderComponent } from './calendar-header';

export { CalendarCellComponent } from './calendar-cell';
export type { CalendarCellKeyNavEvent } from './calendar-cell';

export { CalendarViewBase } from './calendar-view-base';
export { MonthViewComponent } from './month-view';
export { YearViewComponent } from './year-view';
export { YearsViewComponent, yearsPerPage } from './multi-year-view';

// Spec-canonical types (§7.1, §7.4, §8, §10.2, §22.5, §33)
export type {
  CalendarMode,
  CalendarSingleValue,
  CalendarMultipleValue,
  CalendarRangeValue,
  CalendarValue,
  CalendarSelectionState,
  CalendarViewState,
  CalendarOverlayState,
  CalendarErrorCode,
  CalendarValidationErrors,
  RangeClickBehavior,
  RangeGranularity,
  MaxSelectionBehavior,
  ResetBehavior,
  MobileMode,
  SelectionCompleteEvent,
  SelectionClearedEvent,
  RangePreviewEvent,
  ViewChangeEvent,
  ModeChangeEvent,
  // Legacy types kept stable until later phases migrate them.
  DateRange,
  CalendarCellState,
  CalendarCell,
  CalendarCellConfig,
  NameStyle,
  DateFilterFn,
  DateClassFn,
} from './calendar.types';

export {
  emptyCalendarValue,
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

export {
  DateAdapter,
  DATE_ADAPTER,
  DATE_FORMATS,
  TZ_OVERRIDE,
  DATE_SERIALIZATION,
} from './date-adapter';
export type { TwDateNameStyle, DateFormats } from './date-adapter';

export { serializeCalendarValue } from './serialize-calendar-value';

export {
  NativeDateAdapter,
  provideNativeDateAdapter,
  provideTwCalendar,
} from './native-date-adapter';
export type { TwNativeDateFormat } from './native-date-adapter';

export { TwDateRange, toTwDateRange } from './date-range';
export type { TwDateRangeInput } from './date-range';

export * from './selection';

// -----------------------------------------------------------------------------
// Deprecated type aliases. Retained through the refactor so downstream
// consumers in the same workspace (date-picker, date-range-picker) keep
// building. Phase 10 replaces the pickers with a `[calendarTrigger]` overlay
// composition and these aliases can be removed.
// -----------------------------------------------------------------------------

/** @deprecated Use `CalendarViewState`. */
export type { CalendarViewState as CalendarView } from './calendar.types';
/** @deprecated Use `CalendarViewState`. */
export type { CalendarViewState as TwCalendarView } from './calendar.types';
/** @deprecated Use `DateFilterFn<D>`. */
export type { DateFilterFn as TwDateFilter } from './calendar.types';
/** @deprecated Use `DateClassFn<D>`. */
export type { DateClassFn as TwCalendarCellClassFn } from './calendar.types';
