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

export { CalendarPresetsDirective } from './calendar-presets';

export { CalendarHeaderComponent } from './calendar-header';

// §19.4 — i18n surface
export { CalendarIntl, provideCalendarIntl } from './calendar-intl';
export type { CalendarCellAccessibleNameContext } from './calendar-intl';
export { de } from './calendar-intl-de';
export { fr } from './calendar-intl-fr';
export { es } from './calendar-intl-es';
export { pt } from './calendar-intl-pt';
export { ja } from './calendar-intl-ja';

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
  DisabledDates,
  CalendarConstraints,
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
  TW_DATE_ADAPTER,
  TW_DATE_FORMATS,
  TW_TZ_OVERRIDE,
  TW_DATE_SERIALIZATION,
  /** @deprecated Use `TW_DATE_ADAPTER` — same token instance. */
  DATE_ADAPTER,
  /** @deprecated Use `TW_DATE_FORMATS` — same token instance. */
  DATE_FORMATS,
  /** @deprecated Use `TW_TZ_OVERRIDE` — same token instance. */
  TZ_OVERRIDE,
  /** @deprecated Use `TW_DATE_SERIALIZATION` — same token instance. */
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
