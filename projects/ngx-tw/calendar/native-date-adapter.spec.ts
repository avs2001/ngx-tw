import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeDateAdapter } from './native-date-adapter';

describe('NativeDateAdapter', () => {
  let adapter: NativeDateAdapter;

  beforeEach(() => {
    adapter = new NativeDateAdapter();
  });

  // ── create() — 1-based month ──

  describe('create()', () => {
    it('treats month as 1-based — create(2026, 1, 1) yields January 1, 2026', () => {
      const date = adapter.create(2026, 1, 1);
      expect(adapter.getYear(date)).toBe(2026);
      // getMonth on the adapter returns 0-based (calendar field getter contract).
      expect(adapter.getMonth(date)).toBe(0);
      expect(adapter.getDate(date)).toBe(1);
    });

    it('treats month=12 as December', () => {
      const date = adapter.create(2026, 12, 31);
      expect(adapter.getYear(date)).toBe(2026);
      expect(adapter.getMonth(date)).toBe(11);
      expect(adapter.getDate(date)).toBe(31);
    });

    it('preserves years < 100', () => {
      const date = adapter.create(99, 1, 1);
      expect(adapter.getYear(date)).toBe(99);
    });
  });

  // ── arithmetic ──

  describe('addYears / addMonths / addDays', () => {
    it('addYears preserves day-of-month and rolls year', () => {
      const date = adapter.create(2026, 6, 15);
      const next = adapter.addYears(date, 2);
      expect(adapter.getYear(next)).toBe(2028);
      expect(adapter.getMonth(next)).toBe(5);
      expect(adapter.getDate(next)).toBe(15);
    });

    it('addMonths rolls into the next year when going past December', () => {
      const date = adapter.create(2026, 11, 10);
      const next = adapter.addMonths(date, 3);
      expect(adapter.getYear(next)).toBe(2027);
      expect(adapter.getMonth(next)).toBe(1); // February
      expect(adapter.getDate(next)).toBe(10);
    });

    it('addMonths clamps day-of-month when target month is shorter', () => {
      // Jan 31 + 1 month = Feb 28 (or 29 leap), not Mar 3.
      const jan31 = adapter.create(2026, 1, 31);
      const feb = adapter.addMonths(jan31, 1);
      expect(adapter.getMonth(feb)).toBe(1); // February
      expect(adapter.getDate(feb)).toBe(28);
    });

    it('addDays rolls over month boundaries', () => {
      const date = adapter.create(2026, 1, 30);
      const next = adapter.addDays(date, 5);
      expect(adapter.getMonth(next)).toBe(1); // February
      expect(adapter.getDate(next)).toBe(4);
    });

    it('addDays accepts negative deltas', () => {
      const date = adapter.create(2026, 3, 1);
      const prev = adapter.addDays(date, -1);
      expect(adapter.getMonth(prev)).toBe(1); // February
      expect(adapter.getDate(prev)).toBe(28);
    });
  });

  // ── compare() ──

  describe('compare()', () => {
    it('returns negative when first is earlier', () => {
      const a = adapter.create(2026, 1, 1);
      const b = adapter.create(2026, 1, 2);
      expect(adapter.compare(a, b)).toBeLessThan(0);
    });

    it('returns zero when dates are the same day', () => {
      const a = adapter.create(2026, 6, 15);
      const b = adapter.create(2026, 6, 15);
      expect(adapter.compare(a, b)).toBe(0);
    });

    it('returns positive when first is later', () => {
      const a = adapter.create(2027, 1, 1);
      const b = adapter.create(2026, 12, 31);
      expect(adapter.compare(a, b)).toBeGreaterThan(0);
    });
  });

  // ── startOfDay() — DST handling ──

  describe('startOfDay()', () => {
    it('returns local midnight (hours = 0) on a regular day', () => {
      const noon = new Date(2026, 5, 15, 12, 30, 45);
      const start = adapter.startOfDay(noon);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
    });

    it('returns midnight on a DST spring-forward day without skipping into 1am', () => {
      // March 8, 2026 — DST start in America/New_York. Use local-time
      // construction so the test does not depend on the host TZ; the assertion
      // only requires that hours land on 0, which must hold in any tz.
      const dstDay = new Date(2026, 2, 8, 14, 0, 0);
      const start = adapter.startOfDay(dstDay);
      expect(start.getHours()).toBe(0);
      expect(start.getDate()).toBe(8);
      expect(start.getMonth()).toBe(2);
      expect(start.getFullYear()).toBe(2026);
    });
  });

  // ── toIso / fromIso round-trip ──

  describe('toIso / fromIso', () => {
    it('round-trips a date through ISO 8601', () => {
      const original = adapter.create(2026, 4, 26);
      const iso = adapter.toIso(original);
      expect(iso).toBe('2026-04-26');
      const parsed = adapter.fromIso(iso);
      expect(parsed).not.toBeNull();
      expect(adapter.compare(parsed!, original)).toBe(0);
    });

    it('pads month and day to two digits', () => {
      expect(adapter.toIso(adapter.create(2026, 1, 5))).toBe('2026-01-05');
    });

    it('pads year to four digits', () => {
      expect(adapter.toIso(adapter.create(99, 1, 1))).toBe('0099-01-01');
    });
  });

  // ── startOfWeek / endOfWeek ──

  describe('startOfWeek / endOfWeek', () => {
    it('startOfWeek defaults to Sunday (firstDayOfWeek = 0)', () => {
      // Wednesday April 22, 2026
      const wednesday = adapter.create(2026, 4, 22);
      const start = adapter.startOfWeek(wednesday);
      expect(adapter.getDayOfWeek(start)).toBe(0);
      expect(adapter.getDate(start)).toBe(19); // Sunday April 19
    });

    it('startOfWeek honors explicit firstDayOfWeek = 1 (Monday)', () => {
      // Wednesday April 22, 2026 -> Monday April 20
      const wednesday = adapter.create(2026, 4, 22);
      const start = adapter.startOfWeek(wednesday, 1);
      expect(adapter.getDayOfWeek(start)).toBe(1);
      expect(adapter.getDate(start)).toBe(20);
    });

    it('endOfWeek with default Sunday-start returns Saturday', () => {
      const wednesday = adapter.create(2026, 4, 22);
      const end = adapter.endOfWeek(wednesday);
      expect(adapter.getDayOfWeek(end)).toBe(6);
      expect(adapter.getDate(end)).toBe(25);
    });

    it('endOfWeek with Monday-start returns Sunday', () => {
      const wednesday = adapter.create(2026, 4, 22);
      const end = adapter.endOfWeek(wednesday, 1);
      expect(adapter.getDayOfWeek(end)).toBe(0); // Sunday
      expect(adapter.getDate(end)).toBe(26);
    });
  });

  // ── getMonth() ──

  describe('getMonth()', () => {
    it('returns a 0-based month for compatibility with the field-getter contract', () => {
      // The DateAdapter abstract class documents `getMonth` as zero-based
      // (date-adapter.ts line 88-89). `create` is 1-based; `getMonth` is 0-based.
      expect(adapter.getMonth(adapter.create(2026, 1, 1))).toBe(0);
      expect(adapter.getMonth(adapter.create(2026, 12, 31))).toBe(11);
    });
  });

  // ── today() ──

  describe('today()', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns today at local midnight', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 26, 14, 30, 0)); // April 26, 2026
      const today = adapter.today();
      expect(adapter.getYear(today)).toBe(2026);
      expect(adapter.getMonth(today)).toBe(3); // April
      expect(adapter.getDate(today)).toBe(26);
      expect(adapter.getHours(today)).toBe(0);
      expect(adapter.getMinutes(today)).toBe(0);
      expect(adapter.getSeconds(today)).toBe(0);
    });
  });
});
