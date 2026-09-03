import { type Provider, type Type } from '@angular/core';
import {
  type CalendarSelectionStrategy,
  TW_CALENDAR_SELECTION_STRATEGY,
} from './selection-strategy';
import { SingleSelectionStrategy } from './single-selection-strategy';
import { RangeSelectionStrategy } from './range-selection-strategy';
import { MultiSelectionStrategy } from './multi-selection-strategy';
import { WeekSelectionStrategy } from './week-selection-strategy';

/** Provides single-date selection (default behaviour). */
export function provideSingleSelectionStrategy(): Provider {
  return { provide: TW_CALENDAR_SELECTION_STRATEGY, useClass: SingleSelectionStrategy };
}

/** Provides two-click date-range selection. */
export function provideRangeSelectionStrategy(): Provider {
  return { provide: TW_CALENDAR_SELECTION_STRATEGY, useClass: RangeSelectionStrategy };
}

/** Provides toggle-based multi-date selection. */
export function provideMultiSelectionStrategy(): Provider {
  return { provide: TW_CALENDAR_SELECTION_STRATEGY, useClass: MultiSelectionStrategy };
}

/** Provides week-at-a-time selection. */
export function provideWeekSelectionStrategy(): Provider {
  return { provide: TW_CALENDAR_SELECTION_STRATEGY, useClass: WeekSelectionStrategy };
}

/** Provides an arbitrary custom selection strategy. */
export function provideCalendarSelectionStrategy<D, S>(
  strategy: Type<CalendarSelectionStrategy<D, S>>,
): Provider {
  return { provide: TW_CALENDAR_SELECTION_STRATEGY, useClass: strategy };
}
