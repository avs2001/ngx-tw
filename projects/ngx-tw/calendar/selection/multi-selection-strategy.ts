import { inject, Injectable } from '@angular/core';
import type { DateRange } from '../calendar.types';
import { DateAdapter, DATE_ADAPTER } from '../date-adapter';
import { CalendarSelectionStrategy, type SelectionResult } from './selection-strategy';

/**
 * Multi-date selection.
 *
 * - Each click toggles the date in/out of the selection array.
 * - Each click commits immediately (no intermediate preview).
 * - `selected` has shape `D[]`.
 */
@Injectable()
export class MultiSelectionStrategy<D> extends CalendarSelectionStrategy<D, D[]> {
  private readonly dateAdapter: DateAdapter<D> = inject(DATE_ADAPTER) as DateAdapter<D>;

  select(date: D, current: D[]): SelectionResult<D, D[]> {
    const existing = current ?? [];
    const index = existing.findIndex((d) => this.dateAdapter.sameDate(d, date));
    const next =
      index >= 0
        ? [...existing.slice(0, index), ...existing.slice(index + 1)]
        : [...existing, date];
    return { selection: next, isComplete: true };
  }

  createPreview(_active: D | null, _current: D[]): DateRange<D> | null {
    return null;
  }

  isSelected(date: D, current: D[]): boolean {
    return (current ?? []).some((d) => this.dateAdapter.sameDate(d, date));
  }

  isRangeStart(_date: D, _current: D[]): boolean {
    return false;
  }

  isRangeEnd(_date: D, _current: D[]): boolean {
    return false;
  }

  isRangeMiddle(_date: D, _current: D[]): boolean {
    return false;
  }
}
