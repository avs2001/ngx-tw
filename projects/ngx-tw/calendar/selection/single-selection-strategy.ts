import { inject, Injectable } from '@angular/core';
import type { DateRange } from '../calendar.types';
import { type DateAdapter, TW_DATE_ADAPTER } from '../date-adapter';
import { CalendarSelectionStrategy, type SelectionResult } from './selection-strategy';

/**
 * Single-date selection. Every click commits a new selection immediately.
 * No preview range. `selected` has shape `D | null`.
 */
@Injectable()
export class SingleSelectionStrategy<D> extends CalendarSelectionStrategy<D, D | null> {
  private readonly dateAdapter: DateAdapter<D> = inject(TW_DATE_ADAPTER) as DateAdapter<D>;

  select(date: D, _current: D | null): SelectionResult<D, D | null> {
    return { selection: date, isComplete: true };
  }

  createPreview(_active: D | null, _current: D | null): DateRange<D> | null {
    return null;
  }

  isSelected(date: D, current: D | null): boolean {
    if (!current) return false;
    return this.dateAdapter.sameDate(date, current);
  }

  isRangeStart(_date: D, _current: D | null): boolean {
    return false;
  }

  isRangeEnd(_date: D, _current: D | null): boolean {
    return false;
  }

  isRangeMiddle(_date: D, _current: D | null): boolean {
    return false;
  }
}
