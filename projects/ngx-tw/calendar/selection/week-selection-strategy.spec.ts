import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
// Deliberately the *deprecated* spelling. `WeekSelectionStrategy` now injects
// `TW_DATE_ADAPTER`, so this suite doubles as an end-to-end proof that the
// alias is the same token instance. See `calendar-token-alias.spec.ts`.
import { DATE_ADAPTER, type DateAdapter } from '../date-adapter';
import { NativeDateAdapter } from '../native-date-adapter';
import { WeekSelectionStrategy } from './week-selection-strategy';

/**
 * Test adapter that lets us choose the first day of the week explicitly so
 * the strategy's rotation behaviour can be exercised without depending on the
 * runtime locale's `Intl.Locale.getWeekInfo()` answer.
 */
class FixedFirstDayAdapter extends NativeDateAdapter {
  private firstDay = 0;
  constructor(firstDay: number) {
    super();
    this.firstDay = firstDay;
  }
  override getFirstDayOfWeek(): number {
    return this.firstDay;
  }
}

function setup(firstDay: number) {
  TestBed.configureTestingModule({
    providers: [
      { provide: DATE_ADAPTER, useValue: new FixedFirstDayAdapter(firstDay) },
      WeekSelectionStrategy,
    ],
  });
  const strategy = TestBed.inject(
    WeekSelectionStrategy<Date>,
  ) as WeekSelectionStrategy<Date>;
  const adapter = TestBed.inject(DATE_ADAPTER) as DateAdapter<Date>;
  return { strategy, adapter };
}

describe('WeekSelectionStrategy', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  describe('weekRange (via select)', () => {
    it('returns Sunday–Saturday when firstDayOfWeek is 0 (Sunday)', () => {
      const { strategy } = setup(0);
      // 2026-05-13 is a Wednesday.
      const wednesday = new Date(2026, 4, 13);
      const { selection, isComplete } = strategy.select(wednesday, null);
      expect(isComplete).toBe(true);
      expect(selection?.start?.getDate()).toBe(10); // Sunday
      expect(selection?.end?.getDate()).toBe(16); // Saturday
    });

    it('rotates to Monday–Sunday when firstDayOfWeek is 1 (Monday)', () => {
      const { strategy } = setup(1);
      const wednesday = new Date(2026, 4, 13);
      const { selection } = strategy.select(wednesday, null);
      expect(selection?.start?.getDate()).toBe(11); // Monday
      expect(selection?.end?.getDate()).toBe(17); // Sunday
    });

    it('rotates to Saturday–Friday when firstDayOfWeek is 6 (Saturday)', () => {
      const { strategy } = setup(6);
      const wednesday = new Date(2026, 4, 13);
      const { selection } = strategy.select(wednesday, null);
      expect(selection?.start?.getDate()).toBe(9); // Saturday prior
      expect(selection?.end?.getDate()).toBe(15); // Friday
    });

    it('handles the DST spring-forward boundary without skipping a day', () => {
      const { strategy } = setup(0);
      // 2026-03-08 is the DST start in the US (Sunday).
      const dstSunday = new Date(2026, 2, 8);
      const { selection } = strategy.select(dstSunday, null);
      expect(selection?.start?.getDate()).toBe(8); // Sunday is week start
      expect(selection?.end?.getDate()).toBe(14); // Saturday
      // Confirm the week spans exactly 7 calendar days.
      const startMs = selection!.start!.getTime();
      const endMs = selection!.end!.getTime();
      const days = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
      expect(days).toBe(6);
    });

    it('handles the DST fall-back boundary without losing a day', () => {
      const { strategy } = setup(0);
      // 2026-11-01 is the DST end in the US (Sunday).
      const dstSunday = new Date(2026, 10, 1);
      const { selection } = strategy.select(dstSunday, null);
      expect(selection?.start?.getDate()).toBe(1);
      expect(selection?.end?.getDate()).toBe(7);
    });
  });

  describe('createPreview', () => {
    it('returns null when active is null', () => {
      const { strategy } = setup(0);
      expect(strategy.createPreview(null, null)).toBeNull();
    });

    it('returns the week range for the active date', () => {
      const { strategy } = setup(1);
      const wednesday = new Date(2026, 4, 13);
      const preview = strategy.createPreview(wednesday, null);
      expect(preview?.start?.getDate()).toBe(11);
      expect(preview?.end?.getDate()).toBe(17);
    });
  });

  describe('range membership predicates', () => {
    it('isSelected returns false when the current range is incomplete', () => {
      const { strategy } = setup(0);
      expect(strategy.isSelected(new Date(2026, 4, 13), null)).toBe(false);
      expect(
        strategy.isSelected(new Date(2026, 4, 13), { start: new Date(2026, 4, 10), end: null }),
      ).toBe(false);
    });

    it('isRangeStart / isRangeEnd / isRangeMiddle classify cells correctly', () => {
      const { strategy } = setup(0);
      const range = strategy.select(new Date(2026, 4, 13), null).selection!;
      expect(strategy.isRangeStart(range.start!, range)).toBe(true);
      expect(strategy.isRangeEnd(range.end!, range)).toBe(true);
      expect(strategy.isRangeMiddle(new Date(2026, 4, 13), range)).toBe(true);
      expect(strategy.isRangeMiddle(range.start!, range)).toBe(false);
      expect(strategy.isRangeMiddle(range.end!, range)).toBe(false);
    });
  });
});
