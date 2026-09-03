export {
  CalendarSelectionStrategy,
  TW_CALENDAR_SELECTION_STRATEGY,
  /** @deprecated Use `TW_CALENDAR_SELECTION_STRATEGY` — same token instance. */
  CALENDAR_SELECTION_STRATEGY,
  type SelectionResult,
} from './selection-strategy';

export { SingleSelectionStrategy } from './single-selection-strategy';
export { RangeSelectionStrategy } from './range-selection-strategy';
export { MultiSelectionStrategy } from './multi-selection-strategy';
export { WeekSelectionStrategy } from './week-selection-strategy';

export {
  provideSingleSelectionStrategy,
  provideRangeSelectionStrategy,
  provideMultiSelectionStrategy,
  provideWeekSelectionStrategy,
  provideCalendarSelectionStrategy,
} from './providers';
