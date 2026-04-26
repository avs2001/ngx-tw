import { TestBed } from '@angular/core/testing';
import { DateTime } from 'luxon';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeDateAdapter, TZ_OVERRIDE } from 'ngx-tw/calendar';
import { LuxonDateAdapter } from './luxon-date-adapter';

/**
 * `LuxonDateAdapter` uses `inject()` for `TZ_OVERRIDE`, so an injection context
 * is required at construction time. Each block configures `TestBed` with the
 * adapter and (optionally) a TZ override, then resolves the instance via DI.
 */
function createAdapter(tzOverride?: string): LuxonDateAdapter {
  // Tear down any prior module so this call can reconfigure providers freely
  // — `LuxonDateAdapter` reads `TZ_OVERRIDE` via `inject()` at construction.
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      LuxonDateAdapter,
      ...(tzOverride !== undefined ? [{ provide: TZ_OVERRIDE, useValue: tzOverride }] : []),
    ],
  });
  return TestBed.inject(LuxonDateAdapter);
}

describe('LuxonDateAdapter', () => {
  let adapter: LuxonDateAdapter;

  beforeEach(() => {
    TestBed.resetTestingModule();
    adapter = createAdapter();
    // Pin the locale so Intl-driven assertions are deterministic regardless of
    // host environment.
    adapter.setLocale('en-US');
  });

  // ── create() — 1-based month ──────────────────────────────────────────────

  describe('create()', () => {
    it('treats month as 1-based — create(2026, 1, 1) yields January 1, 2026', () => {
      const date = adapter.create(2026, 1, 1);
      expect(adapter.getYear(date)).toBe(2026);
      expect(adapter.getDate(date)).toBe(1);
      // `create()` is 1-based; `getMonth()` returns 0-based per the abstract
      // contract and the `NativeDateAdapter`.
      expect(adapter.getMonth(date)).toBe(0);
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
      expect(adapter.isValid(date)).toBe(true);
    });

    it('returns a `DateTime` in the adapter\'s configured zone', () => {
      const date = adapter.create(2026, 4, 26);
      expect(date).toBeInstanceOf(DateTime);
      expect(date.isValid).toBe(true);
    });
  });

  // ── clone() ───────────────────────────────────────────────────────────────

  describe('clone()', () => {
    it('returns a `DateTime` equal to the original', () => {
      const date = adapter.create(2026, 4, 26);
      const copy = adapter.clone(date);
      expect(copy).toBeInstanceOf(DateTime);
      expect(copy.toMillis()).toBe(date.toMillis());
    });

    it('preserves zone and locale of the source date', () => {
      const tzAdapter = createAdapter('America/New_York');
      tzAdapter.setLocale('fr');
      const date = tzAdapter.create(2026, 4, 26);
      const copy = tzAdapter.clone(date);
      expect(copy.zoneName).toBe('America/New_York');
      expect(copy.locale).toBe('fr');
    });
  });

  // ── field getters ─────────────────────────────────────────────────────────

  describe('field getters', () => {
    it('getYear returns the calendar year', () => {
      expect(adapter.getYear(adapter.create(2026, 4, 26))).toBe(2026);
    });

    it('getDate returns the day of month (1-based)', () => {
      expect(adapter.getDate(adapter.create(2026, 4, 26))).toBe(26);
    });

    it('getDayOfWeek normalizes Sunday to 0 and Saturday to 6', () => {
      // April 19, 2026 — Sunday. April 25, 2026 — Saturday.
      expect(adapter.getDayOfWeek(adapter.create(2026, 4, 19))).toBe(0);
      expect(adapter.getDayOfWeek(adapter.create(2026, 4, 20))).toBe(1); // Monday
      expect(adapter.getDayOfWeek(adapter.create(2026, 4, 22))).toBe(3); // Wednesday
      expect(adapter.getDayOfWeek(adapter.create(2026, 4, 25))).toBe(6); // Saturday
    });

    it('getNumDaysInMonth returns 28/29/30/31 correctly', () => {
      expect(adapter.getNumDaysInMonth(adapter.create(2026, 1, 1))).toBe(31); // Jan
      expect(adapter.getNumDaysInMonth(adapter.create(2026, 2, 1))).toBe(28); // Feb non-leap
      expect(adapter.getNumDaysInMonth(adapter.create(2024, 2, 1))).toBe(29); // Feb leap
      expect(adapter.getNumDaysInMonth(adapter.create(2026, 4, 1))).toBe(30); // Apr
    });

    it('getHours / getMinutes / getSeconds return time-of-day fields', () => {
      const dt = adapter.withTime(adapter.create(2026, 4, 26), 13, 45, 30);
      expect(adapter.getHours(dt)).toBe(13);
      expect(adapter.getMinutes(dt)).toBe(45);
      expect(adapter.getSeconds(dt)).toBe(30);
    });
  });

  // ── arithmetic ────────────────────────────────────────────────────────────

  describe('addCalendarYears / addCalendarMonths / addCalendarDays', () => {
    it('addYears preserves day-of-month and rolls year', () => {
      const date = adapter.create(2026, 6, 15);
      const next = adapter.addYears(date, 2);
      expect(adapter.getYear(next)).toBe(2028);
      expect(adapter.getMonth(next)).toBe(5); // June (0-based)
      expect(adapter.getDate(next)).toBe(15);
    });

    it('addMonths rolls into the next year when going past December', () => {
      const date = adapter.create(2026, 11, 10);
      const next = adapter.addMonths(date, 3);
      expect(adapter.getYear(next)).toBe(2027);
      expect(adapter.getMonth(next)).toBe(1); // February (0-based)
      expect(adapter.getDate(next)).toBe(10);
    });

    it('addMonths clamps day-of-month when target month is shorter (Jan 31 + 1 = Feb 28)', () => {
      const jan31 = adapter.create(2026, 1, 31);
      const feb = adapter.addMonths(jan31, 1);
      expect(adapter.getMonth(feb)).toBe(1); // February (0-based)
      expect(adapter.getDate(feb)).toBe(28);
    });

    it('addMonths clamps day-of-month into Feb 29 on leap years', () => {
      const jan31 = adapter.create(2024, 1, 31);
      const feb = adapter.addMonths(jan31, 1);
      expect(adapter.getMonth(feb)).toBe(1);
      expect(adapter.getDate(feb)).toBe(29);
    });

    it('addDays rolls over month boundaries', () => {
      const date = adapter.create(2026, 1, 30);
      const next = adapter.addDays(date, 5);
      expect(adapter.getMonth(next)).toBe(1); // February (0-based)
      expect(adapter.getDate(next)).toBe(4);
    });

    it('addDays accepts negative deltas', () => {
      const date = adapter.create(2026, 3, 1);
      const prev = adapter.addDays(date, -1);
      expect(adapter.getMonth(prev)).toBe(1); // February (0-based)
      expect(adapter.getDate(prev)).toBe(28);
    });

    it('addMinutes / addHours adjust time fields', () => {
      const noon = adapter.withTime(adapter.create(2026, 4, 26), 12, 0, 0);
      expect(adapter.getHours(adapter.addHours(noon, 5))).toBe(17);
      expect(adapter.getMinutes(adapter.addMinutes(noon, 90))).toBe(30);
    });
  });

  // ── compare() / sameDate() / sameMonth() / sameYear() ─────────────────────

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

    it('compares by calendar fields — different zones for the same wall-date are equal', () => {
      const a = DateTime.fromObject({ year: 2026, month: 4, day: 26 }, { zone: 'America/New_York' });
      const b = DateTime.fromObject({ year: 2026, month: 4, day: 26 }, { zone: 'Asia/Tokyo' });
      expect(adapter.compare(a, b)).toBe(0);
    });
  });

  describe('sameDate()', () => {
    it('returns true for identical valid dates', () => {
      const a = adapter.create(2026, 4, 26);
      const b = adapter.create(2026, 4, 26);
      expect(adapter.sameDate(a, b)).toBe(true);
    });

    it('returns false for different valid dates', () => {
      const a = adapter.create(2026, 4, 26);
      const b = adapter.create(2026, 4, 27);
      expect(adapter.sameDate(a, b)).toBe(false);
    });

    it('returns true when both are null/undefined', () => {
      expect(adapter.sameDate(null, null)).toBe(true);
      expect(adapter.sameDate(undefined, undefined)).toBe(true);
    });

    it('returns false when one is null and the other is valid', () => {
      expect(adapter.sameDate(adapter.create(2026, 4, 26), null)).toBe(false);
      expect(adapter.sameDate(null, adapter.create(2026, 4, 26))).toBe(false);
    });

    it('treats two invalid `DateTime`s as equal', () => {
      expect(adapter.sameDate(adapter.invalid(), adapter.invalid())).toBe(true);
    });
  });

  describe('sameMonth()', () => {
    it('returns true for dates within the same calendar month', () => {
      expect(adapter.sameMonth(adapter.create(2026, 4, 1), adapter.create(2026, 4, 30))).toBe(true);
    });

    it('returns false for dates in different months', () => {
      expect(adapter.sameMonth(adapter.create(2026, 4, 30), adapter.create(2026, 5, 1))).toBe(false);
    });

    it('returns false for the same month in different years', () => {
      expect(adapter.sameMonth(adapter.create(2026, 4, 15), adapter.create(2027, 4, 15))).toBe(false);
    });
  });

  // ── isValid / isDateInstance ──────────────────────────────────────────────

  describe('isValid()', () => {
    it('returns true for a freshly constructed `DateTime`', () => {
      expect(adapter.isValid(adapter.create(2026, 4, 26))).toBe(true);
    });

    it('returns false for the `invalid()` sentinel', () => {
      expect(adapter.isValid(adapter.invalid())).toBe(false);
    });

    it('returns false for `DateTime.invalid()` constructed externally', () => {
      expect(adapter.isValid(DateTime.invalid('test'))).toBe(false);
    });

    it('returns false for non-`DateTime` values', () => {
      // The contract only accepts `DateTime`, but the runtime check should
      // still defend against accidental misuse.
      expect(adapter.isValid(new Date() as unknown as DateTime)).toBe(false);
      expect(adapter.isValid(null as unknown as DateTime)).toBe(false);
    });
  });

  // ── deserialize() ─────────────────────────────────────────────────────────

  describe('deserialize()', () => {
    it('returns null for null / undefined / empty string', () => {
      expect(adapter.deserialize(null)).toBeNull();
      expect(adapter.deserialize(undefined)).toBeNull();
      expect(adapter.deserialize('')).toBeNull();
    });

    it('parses an ISO 8601 string', () => {
      const parsed = adapter.deserialize('2026-04-26');
      expect(parsed).not.toBeNull();
      expect(adapter.isValid(parsed!)).toBe(true);
      expect(adapter.getYear(parsed!)).toBe(2026);
      expect(adapter.getMonth(parsed!)).toBe(3); // April (0-based)
      expect(adapter.getDate(parsed!)).toBe(26);
    });

    it('coerces a JS `Date` to a `DateTime`', () => {
      const native = new Date(2026, 3, 26); // April 26, 2026 (0-based month)
      const parsed = adapter.deserialize(native);
      expect(parsed).not.toBeNull();
      expect(adapter.isValid(parsed!)).toBe(true);
      expect(adapter.getYear(parsed!)).toBe(2026);
    });

    it('clones an incoming `DateTime`', () => {
      const original = adapter.create(2026, 4, 26);
      const parsed = adapter.deserialize(original);
      expect(parsed).not.toBeNull();
      expect(adapter.isValid(parsed!)).toBe(true);
      expect(adapter.compare(parsed!, original)).toBe(0);
    });

    it('returns the invalid sentinel for malformed strings (not null)', () => {
      const parsed = adapter.deserialize('not-a-date');
      expect(parsed).not.toBeNull();
      expect(adapter.isValid(parsed!)).toBe(false);
    });

    it('returns the invalid sentinel for an invalid incoming `DateTime`', () => {
      const parsed = adapter.deserialize(DateTime.invalid('test'));
      expect(parsed).not.toBeNull();
      expect(adapter.isValid(parsed!)).toBe(false);
    });
  });

  // ── toIso / fromIso round-trip ────────────────────────────────────────────

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

    it('fromIso returns null for empty / non-string input', () => {
      expect(adapter.fromIso('')).toBeNull();
      expect(adapter.fromIso('   ')).toBeNull();
      expect(adapter.fromIso(null as unknown as string)).toBeNull();
    });

    it('fromIso returns null for malformed ISO strings', () => {
      expect(adapter.fromIso('not-iso')).toBeNull();
    });
  });

  // ── startOfDay() — DST handling ───────────────────────────────────────────

  describe('startOfDay()', () => {
    it('returns midnight on a regular day', () => {
      const noon = adapter.withTime(adapter.create(2026, 6, 15), 12, 30, 45);
      const start = adapter.startOfDay(noon);
      expect(adapter.getHours(start)).toBe(0);
      expect(adapter.getMinutes(start)).toBe(0);
      expect(adapter.getSeconds(start)).toBe(0);
      expect(adapter.getDate(start)).toBe(15);
    });

    it('returns the zone\'s start-of-day on DST spring-forward days (America/New_York 2024-03-10)', () => {
      // 2024-03-10 in America/New_York: 02:00 jumps to 03:00. Midnight (00:00)
      // is a valid wall-clock instant, so `startOfDay` should land on 00:00.
      const tzAdapter = createAdapter('America/New_York');
      // Construct an afternoon time on the DST day, then normalize.
      const dstAfternoon = tzAdapter.withTime(tzAdapter.create(2024, 3, 10), 14, 0, 0);
      const start = tzAdapter.startOfDay(dstAfternoon);
      expect(start.zoneName).toBe('America/New_York');
      expect(tzAdapter.getYear(start)).toBe(2024);
      expect(tzAdapter.getMonth(start)).toBe(2); // March (0-based)
      expect(tzAdapter.getDate(start)).toBe(10);
      expect(tzAdapter.getHours(start)).toBe(0);
      expect(tzAdapter.getMinutes(start)).toBe(0);
    });

    it('startOfDay re-anchors a date supplied in another zone to the adapter\'s zone', () => {
      const tzAdapter = createAdapter('America/New_York');
      // Construct in Tokyo, then normalize: the result must be midnight in NY.
      const tokyo = DateTime.fromObject(
        { year: 2026, month: 4, day: 26, hour: 6 },
        { zone: 'Asia/Tokyo' },
      );
      const start = tzAdapter.startOfDay(tokyo);
      expect(start.zoneName).toBe('America/New_York');
      expect(tzAdapter.getHours(start)).toBe(0);
    });
  });

  // ── startOfWeek / endOfWeek ───────────────────────────────────────────────

  describe('startOfWeek / endOfWeek', () => {
    it('startOfWeek defaults to Sunday (firstDayOfWeek = 0)', () => {
      // Wednesday April 22, 2026 → Sunday April 19.
      const wednesday = adapter.create(2026, 4, 22);
      const start = adapter.startOfWeek(wednesday);
      expect(adapter.getDayOfWeek(start)).toBe(0);
      expect(adapter.getDate(start)).toBe(19);
    });

    it('startOfWeek honours explicit firstDayOfWeek = 1 (Monday)', () => {
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

    it('startOfWeek returns the input when it already is the first day of the week', () => {
      const sunday = adapter.create(2026, 4, 19);
      const start = adapter.startOfWeek(sunday);
      expect(adapter.compare(start, sunday)).toBe(0);
    });
  });

  // ── getMonthNames() ───────────────────────────────────────────────────────

  describe('getMonthNames()', () => {
    it('returns 12 month names in the requested style', () => {
      const long = adapter.getMonthNames('long');
      expect(long).toHaveLength(12);
      expect(long[0]).toBe('January');
      expect(long[11]).toBe('December');
    });

    it('returns short and narrow style variants', () => {
      const short = adapter.getMonthNames('short');
      expect(short).toHaveLength(12);
      expect(short[0]).toBe('Jan');

      const narrow = adapter.getMonthNames('narrow');
      expect(narrow).toHaveLength(12);
      expect(narrow[0]).toBe('J');
    });

    it('localizes month names — fr', () => {
      adapter.setLocale('fr');
      const long = adapter.getMonthNames('long');
      expect(long).toHaveLength(12);
      expect(long[0]).toBe('janvier');
      expect(long[3]).toBe('avril');
    });

    it('localizes month names — ja', () => {
      adapter.setLocale('ja');
      const long = adapter.getMonthNames('long');
      expect(long).toHaveLength(12);
      expect(long[0]).toBe('1月');
      expect(long[11]).toBe('12月');
    });
  });

  // ── getDayOfWeekNames() ───────────────────────────────────────────────────

  describe('getDayOfWeekNames()', () => {
    it('returns 7 names in Sunday-first order (rotates Luxon\'s Monday-first default)', () => {
      const long = adapter.getDayOfWeekNames('long');
      expect(long).toHaveLength(7);
      expect(long[0]).toBe('Sunday');
      expect(long[1]).toBe('Monday');
      expect(long[6]).toBe('Saturday');
    });

    it('returns short / narrow variants in Sunday-first order', () => {
      const short = adapter.getDayOfWeekNames('short');
      expect(short).toHaveLength(7);
      expect(short[0]).toBe('Sun');

      const narrow = adapter.getDayOfWeekNames('narrow');
      expect(narrow).toHaveLength(7);
      expect(narrow[0]).toBe('S'); // Sunday
    });

    it('localizes day-of-week names — fr', () => {
      adapter.setLocale('fr');
      const long = adapter.getDayOfWeekNames('long');
      expect(long).toHaveLength(7);
      // First entry must be the locale's word for Sunday, regardless of
      // the locale's own week-start convention.
      expect(long[0].toLowerCase()).toBe('dimanche');
      expect(long[1].toLowerCase()).toBe('lundi');
    });
  });

  // ── format() ──────────────────────────────────────────────────────────────

  describe('format()', () => {
    const date = () => adapter.create(2026, 4, 26);

    it('returns an empty string for invalid dates', () => {
      expect(adapter.format(adapter.invalid(), 'yyyy-LL-dd')).toBe('');
    });

    it('accepts a Luxon token string', () => {
      expect(adapter.format(date(), 'yyyy-LL-dd')).toBe('2026-04-26');
      expect(adapter.format(date(), 'LL/dd/yyyy')).toBe('04/26/2026');
    });

    it('accepts a TwLuxonDateFormat with `format` token', () => {
      expect(adapter.format(date(), { format: 'yyyy-LL-dd' })).toBe('2026-04-26');
    });

    it('accepts a TwLuxonDateFormat with a `preset`', () => {
      const out = adapter.format(date(), { preset: DateTime.DATE_MED });
      // Locale en-US: "Apr 26, 2026". We assert structural pieces to remain
      // resilient across ICU minor versions.
      expect(out).toContain('Apr');
      expect(out).toContain('26');
      expect(out).toContain('2026');
    });

    it('accepts a bare Intl.DateTimeFormatOptions object', () => {
      const out = adapter.format(date(), { year: 'numeric', month: 'long', day: 'numeric' });
      expect(out).toContain('April');
      expect(out).toContain('2026');
    });

    it('falls back to a locale-aware DATE_MED when no format is supplied', () => {
      const out = adapter.format(date(), undefined);
      expect(out).toContain('2026');
    });

    it('uses the adapter\'s configured locale', () => {
      adapter.setLocale('fr');
      const out = adapter.format(date(), { preset: DateTime.DATE_MED });
      // French DATE_MED: "26 avr. 2026".
      expect(out).toContain('avr');
      expect(out).toContain('2026');
    });
  });

  // ── parse() ───────────────────────────────────────────────────────────────

  describe('parse()', () => {
    it('returns null for null / undefined', () => {
      expect(adapter.parse(null)).toBeNull();
      expect(adapter.parse(undefined)).toBeNull();
    });

    it('returns null for empty / whitespace strings', () => {
      expect(adapter.parse('')).toBeNull();
      expect(adapter.parse('   ')).toBeNull();
    });

    it('round-trips a date through a Luxon token format', () => {
      const original = adapter.create(2026, 4, 26);
      const out = adapter.format(original, 'LL/dd/yyyy');
      const parsed = adapter.parse(out, 'LL/dd/yyyy');
      expect(parsed).not.toBeNull();
      expect(adapter.compare(parsed!, original)).toBe(0);
    });

    it('round-trips through a TwLuxonDateFormat descriptor', () => {
      const original = adapter.create(2026, 4, 26);
      const out = adapter.format(original, { format: 'yyyy/LL/dd' });
      const parsed = adapter.parse(out, { format: 'yyyy/LL/dd' });
      expect(parsed).not.toBeNull();
      expect(adapter.compare(parsed!, original)).toBe(0);
    });

    it('falls back to ISO parsing when no format is supplied', () => {
      const parsed = adapter.parse('2026-04-26');
      expect(parsed).not.toBeNull();
      expect(adapter.getYear(parsed!)).toBe(2026);
      expect(adapter.getMonth(parsed!)).toBe(3); // April (0-based)
      expect(adapter.getDate(parsed!)).toBe(26);
    });

    it('parses a JS Date', () => {
      const parsed = adapter.parse(new Date(2026, 3, 26));
      expect(parsed).not.toBeNull();
      expect(adapter.getYear(parsed!)).toBe(2026);
    });

    it('parses an epoch number', () => {
      const epoch = DateTime.fromObject({ year: 2026, month: 4, day: 26 }, { zone: 'utc' }).toMillis();
      const parsed = adapter.parse(epoch);
      expect(parsed).not.toBeNull();
      expect(parsed!.toUTC().year).toBe(2026);
    });

    it('clones a `DateTime` input', () => {
      const original = adapter.create(2026, 4, 26);
      const parsed = adapter.parse(original);
      expect(parsed).not.toBeNull();
      expect(parsed).not.toBe(original); // distinct instance
      expect(adapter.compare(parsed!, original)).toBe(0);
    });

    it('returns null for malformed input strings', () => {
      expect(adapter.parse('not-a-date')).toBeNull();
      expect(adapter.parse('13/45/2026', 'LL/dd/yyyy')).toBeNull();
    });

    it('returns null for unsupported value types', () => {
      expect(adapter.parse({} as unknown)).toBeNull();
      expect(adapter.parse(true as unknown)).toBeNull();
    });
  });

  // ── today() ───────────────────────────────────────────────────────────────

  describe('today()', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns today at midnight in the adapter\'s zone', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-26T18:30:00Z'));
      const today = adapter.today();
      expect(adapter.isValid(today)).toBe(true);
      expect(adapter.getHours(today)).toBe(0);
      expect(adapter.getMinutes(today)).toBe(0);
      expect(adapter.getSeconds(today)).toBe(0);
    });

    it('respects the configured timezone — TZ_OVERRIDE = America/New_York', () => {
      vi.useFakeTimers();
      // Choose an instant where UTC and NY land on different calendar days:
      // 2026-04-26 02:00 UTC == 2026-04-25 22:00 EDT.
      vi.setSystemTime(new Date('2026-04-26T02:00:00Z'));
      const tzAdapter = createAdapter('America/New_York');
      const today = tzAdapter.today();
      expect(today.zoneName).toBe('America/New_York');
      expect(tzAdapter.getYear(today)).toBe(2026);
      expect(tzAdapter.getMonth(today)).toBe(3); // April (0-based)
      expect(tzAdapter.getDate(today)).toBe(25);
    });
  });

  // ── timezone behavior ─────────────────────────────────────────────────────

  describe('timezone behaviour', () => {
    it('getTimezone returns the configured zone', () => {
      const tzAdapter = createAdapter('America/New_York');
      expect(tzAdapter.getTimezone()).toBe('America/New_York');
    });

    it('getTimezone returns Luxon\'s default zone name when no override is set', () => {
      // No TZ override: should fall through to Luxon's default zone, which is
      // either 'local' or whatever `Settings.defaultZone` resolves to.
      const tz = adapter.getTimezone();
      expect(typeof tz).toBe('string');
      expect(tz!.length).toBeGreaterThan(0);
    });

    it('create() honours the configured zone', () => {
      const tzAdapter = createAdapter('America/New_York');
      const date = tzAdapter.create(2026, 4, 26);
      expect(date.zoneName).toBe('America/New_York');
    });

    it('withTimezone returns a copy reinterpreted in the requested zone', () => {
      const date = adapter.create(2026, 4, 26);
      const moved = adapter.withTimezone(date, 'Asia/Tokyo');
      expect(moved.zoneName).toBe('Asia/Tokyo');
      // Same instant, different wall-clock.
      expect(moved.toMillis()).toBe(date.toMillis());
    });

    it('isDST returns true on a DST-active instant in America/New_York', () => {
      // July 1, 2024 — daylight time in NY.
      const tzAdapter = createAdapter('America/New_York');
      const summer = tzAdapter.create(2024, 7, 1);
      expect(tzAdapter.isDST(summer)).toBe(true);
    });

    it('isDST returns false in standard-time months', () => {
      // January 1, 2024 — standard time in NY.
      const tzAdapter = createAdapter('America/New_York');
      const winter = tzAdapter.create(2024, 1, 1);
      expect(tzAdapter.isDST(winter)).toBe(false);
    });

    it('resolveAmbiguous("earlier") is a no-op', () => {
      const date = adapter.create(2026, 4, 26);
      const out = adapter.resolveAmbiguous(date, 'earlier');
      expect(adapter.compare(out, date)).toBe(0);
    });

    it('resolveAmbiguous returns the original on invalid input', () => {
      const out = adapter.resolveAmbiguous(adapter.invalid(), 'later');
      expect(adapter.isValid(out)).toBe(false);
    });
  });

  // ── locale propagation ───────────────────────────────────────────────────

  describe('locale propagation', () => {
    it('setLocale changes the locale used by getMonthNames / format', () => {
      adapter.setLocale('fr');
      expect(adapter.getLocale()).toBe('fr');
      expect(adapter.getMonthNames('long')[0]).toBe('janvier');
    });

    it('locale is propagated to dates produced by create()', () => {
      adapter.setLocale('fr');
      const date = adapter.create(2026, 4, 26);
      expect(date.locale).toBe('fr');
    });

    it('getYearName uses the configured locale', () => {
      adapter.setLocale('fr');
      const out = adapter.getYearName(adapter.create(2026, 4, 26));
      expect(out).toBe('2026');
    });

    it('getDateNames returns 31 entries', () => {
      const names = adapter.getDateNames('short');
      expect(names).toHaveLength(31);
      expect(names[0]).toBe('1');
      expect(names[30]).toBe('31');
    });
  });

  // ── invalid sentinel ──────────────────────────────────────────────────────

  describe('invalid()', () => {
    it('returns a `DateTime` whose `isValid` is false', () => {
      const inv = adapter.invalid();
      expect(inv).toBeInstanceOf(DateTime);
      expect(inv.isValid).toBe(false);
      expect(adapter.isValid(inv)).toBe(false);
    });
  });

  // ── getFirstDayOfWeek() ───────────────────────────────────────────────────

  describe('getFirstDayOfWeek()', () => {
    it('returns 0 (Sunday) for en-US', () => {
      adapter.setLocale('en-US');
      expect(adapter.getFirstDayOfWeek()).toBe(0);
    });

    it('returns 1 (Monday) for fr-FR', () => {
      adapter.setLocale('fr-FR');
      expect(adapter.getFirstDayOfWeek()).toBe(1);
    });

    it('returns 6 (Saturday) for ar-EG', () => {
      // Arabic (Egypt) — CLDR firstDay is Saturday.
      adapter.setLocale('ar-EG');
      expect(adapter.getFirstDayOfWeek()).toBe(6);
    });

    it('matches NativeDateAdapter for the same locales', () => {
      const native = new NativeDateAdapter();
      for (const loc of ['en-US', 'fr-FR', 'ar-EG', 'de-DE', 'ja-JP']) {
        adapter.setLocale(loc);
        native.setLocale(loc);
        expect(adapter.getFirstDayOfWeek()).toBe(native.getFirstDayOfWeek());
      }
    });
  });
});
