import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import { TZ_OVERRIDE } from 'ngx-tw/calendar';
import { LuxonDateAdapter } from './luxon-date-adapter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function adapter(tz?: string): LuxonDateAdapter {
  TestBed.configureTestingModule({
    providers: [
      LuxonDateAdapter,
      ...(tz ? [{ provide: TZ_OVERRIDE, useValue: tz }] : []),
    ],
  });
  return TestBed.inject(LuxonDateAdapter);
}

// Jan 15, 2026 — a plain mid-month date
const JAN15 = { year: 2026, month: 1, day: 15 };

// ---------------------------------------------------------------------------
// Construction & cloning
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – construction', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('create returns a valid DateTime for 1-based month 1 (January)', () => {
    const d = a.create(2026, 1, 1);
    expect(d.isValid).toBe(true);
    expect(d.year).toBe(2026);
    expect(d.month).toBe(1); // Luxon month is also 1-based
    expect(d.day).toBe(1);
  });

  it('create returns a valid DateTime for month 12 (December)', () => {
    const d = a.create(2026, 12, 31);
    expect(d.month).toBe(12);
    expect(d.day).toBe(31);
  });

  it('create returns invalid for an out-of-range day (Luxon does not overflow)', () => {
    // Feb 30 is not a valid date; Luxon returns an invalid DateTime rather than overflowing.
    const d = a.create(2024, 2, 30);
    expect(d.isValid).toBe(false);
  });

  it('today() returns a DateTime at midnight', () => {
    const t = a.today();
    expect(t.hour).toBe(0);
    expect(t.minute).toBe(0);
    expect(t.second).toBe(0);
  });

  it('clone returns a distinct object with the same UTC value', () => {
    const orig = a.create(2026, 3, 15);
    const copy = a.clone(orig);
    expect(copy).not.toBe(orig);
    expect(copy.valueOf()).toBe(orig.valueOf());
  });
});

// ---------------------------------------------------------------------------
// Field getters
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – field getters', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('getYear returns the full year', () => {
    expect(a.getYear(a.create(2026, 6, 15))).toBe(2026);
  });

  it('getMonth returns 0-based month index (January = 0)', () => {
    expect(a.getMonth(a.create(2026, 1, 1))).toBe(0);
    expect(a.getMonth(a.create(2026, 12, 1))).toBe(11);
    expect(a.getMonth(a.create(2026, 6, 1))).toBe(5);
  });

  it('getDate returns 1-based day of month', () => {
    expect(a.getDate(a.create(2026, 1, 15))).toBe(15);
  });

  it('getDayOfWeek: Sunday = 0', () => {
    // 2024-03-10 is a Sunday
    expect(a.getDayOfWeek(a.create(2024, 3, 10))).toBe(0);
  });

  it('getDayOfWeek: Monday = 1', () => {
    // 2024-03-11 is a Monday
    expect(a.getDayOfWeek(a.create(2024, 3, 11))).toBe(1);
  });

  it('getDayOfWeek: Saturday = 6', () => {
    // 2024-03-09 is a Saturday
    expect(a.getDayOfWeek(a.create(2024, 3, 9))).toBe(6);
  });

  it('getNumDaysInMonth returns correct values', () => {
    expect(a.getNumDaysInMonth(a.create(2026, 1, 1))).toBe(31); // January
    expect(a.getNumDaysInMonth(a.create(2026, 2, 1))).toBe(28); // Feb (non-leap)
    expect(a.getNumDaysInMonth(a.create(2024, 2, 1))).toBe(29); // Feb (leap year)
    expect(a.getNumDaysInMonth(a.create(2026, 4, 1))).toBe(30); // April
  });
});

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – arithmetic', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('addYears adds years preserving month and day', () => {
    const d = a.addYears(a.create(2024, 3, 15), 2);
    expect(d.year).toBe(2026);
    expect(d.month).toBe(3);
    expect(d.day).toBe(15);
  });

  it('addMonths adds months correctly', () => {
    const d = a.addMonths(a.create(2026, 1, 15), 3);
    expect(d.month).toBe(4);
    expect(d.year).toBe(2026);
  });

  it('addMonths wraps over year boundary', () => {
    const d = a.addMonths(a.create(2025, 11, 15), 3);
    expect(d.year).toBe(2026);
    expect(d.month).toBe(2);
  });

  it('addDays adds days', () => {
    const d = a.addDays(a.create(2026, 1, 28), 5);
    expect(d.month).toBe(2);
    expect(d.day).toBe(2);
  });

  it('addDays with negative value subtracts', () => {
    const d = a.addDays(a.create(2026, 3, 1), -1);
    expect(d.month).toBe(2);
    expect(d.day).toBe(28);
  });

  it('addHours adds hours', () => {
    const d = DateTime.fromObject({ year: 2026, month: 1, day: 15, hour: 10 });
    expect(a.addHours(d, 3).hour).toBe(13);
  });

  it('addMinutes adds minutes', () => {
    const d = DateTime.fromObject({ year: 2026, month: 1, day: 15, hour: 10, minute: 45 });
    const result = a.addMinutes(d, 30);
    expect(result.hour).toBe(11);
    expect(result.minute).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// Year / month / date boundary arithmetic
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – boundary arithmetic', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('Dec 31 + 1 day = Jan 1 next year', () => {
    const d = a.addDays(a.create(2025, 12, 31), 1);
    expect(d.year).toBe(2026);
    expect(d.month).toBe(1);
    expect(d.day).toBe(1);
  });

  it('addYears on Feb 29 (leap) → next non-leap year clamps to Feb 28', () => {
    const leapDay = a.create(2024, 2, 29);
    const next = a.addYears(leapDay, 1);
    // 2025 is not a leap year; Luxon clamps Feb 29 → Feb 28 (preserves month)
    expect(next.isValid).toBe(true);
    expect(next.month).toBe(2);
    expect(next.day).toBe(28);
  });
});

// ---------------------------------------------------------------------------
// Compare & equality
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – compare', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('compare returns negative when first < second', () => {
    expect(a.compare(a.create(2026, 1, 1), a.create(2026, 1, 2))).toBeLessThan(0);
  });

  it('compare returns 0 when equal', () => {
    expect(a.compare(a.create(2026, 6, 15), a.create(2026, 6, 15))).toBe(0);
  });

  it('compare returns positive when first > second', () => {
    expect(a.compare(a.create(2026, 12, 31), a.create(2026, 1, 1))).toBeGreaterThan(0);
  });

  it('compare compares date only, ignoring time', () => {
    const d1 = DateTime.fromObject({ year: 2026, month: 6, day: 15, hour: 8 });
    const d2 = DateTime.fromObject({ year: 2026, month: 6, day: 15, hour: 20 });
    expect(a.compare(d1, d2)).toBe(0);
  });

  it('sameDate returns true for same date', () => {
    expect(a.sameDate(a.create(2026, 6, 15), a.create(2026, 6, 15))).toBe(true);
  });

  it('sameDate returns false for different dates', () => {
    expect(a.sameDate(a.create(2026, 6, 15), a.create(2026, 6, 16))).toBe(false);
  });

  it('sameDate handles null/undefined', () => {
    expect(a.sameDate(null, null)).toBe(true);
    expect(a.sameDate(null, undefined)).toBe(false);
    expect(a.sameDate(a.create(2026, 1, 1), null)).toBe(false);
  });

  it('sameMonth returns true when year + month match', () => {
    expect(a.sameMonth(a.create(2026, 3, 1), a.create(2026, 3, 31))).toBe(true);
    expect(a.sameMonth(a.create(2026, 3, 1), a.create(2026, 4, 1))).toBe(false);
  });

  it('sameYear returns true when years match', () => {
    expect(a.sameYear(a.create(2026, 1, 1), a.create(2026, 12, 31))).toBe(true);
    expect(a.sameYear(a.create(2025, 12, 31), a.create(2026, 1, 1))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Validity
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – validity', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('isValid returns true for a valid DateTime', () => {
    expect(a.isValid(a.create(2026, 1, 15))).toBe(true);
  });

  it('isValid returns false for an invalid DateTime', () => {
    expect(a.isValid(a.invalid())).toBe(false);
  });

  it('invalid() returns an invalid DateTime', () => {
    expect(a.invalid().isValid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Parse & serialization
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – parse & serialization', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('parse ISO string', () => {
    const d = a.parse('2026-06-15');
    expect(d).not.toBeNull();
    expect(d!.year).toBe(2026);
    expect(d!.month).toBe(6);
    expect(d!.day).toBe(15);
  });

  it('parse empty string returns null', () => {
    expect(a.parse('')).toBeNull();
    expect(a.parse('  ')).toBeNull();
  });

  it('parse null returns null', () => {
    expect(a.parse(null)).toBeNull();
  });

  it('parse number (millis)', () => {
    const millis = DateTime.fromObject({ year: 2026, month: 6, day: 15 }).valueOf();
    const d = a.parse(millis);
    expect(d).not.toBeNull();
    expect(d!.year).toBe(2026);
  });

  it('parse DateTime passthrough', () => {
    const orig = a.create(2026, 6, 15);
    expect(a.parse(orig)).toBe(orig);
  });

  it('parse with format string', () => {
    const d = a.parse('15/06/2026', 'dd/MM/yyyy');
    expect(d).not.toBeNull();
    expect(d!.year).toBe(2026);
    expect(d!.month).toBe(6);
    expect(d!.day).toBe(15);
  });

  it('toIso returns YYYY-MM-DD', () => {
    expect(a.toIso(a.create(2026, 6, 5))).toBe('2026-06-05');
    expect(a.toIso(a.create(2026, 1, 1))).toBe('2026-01-01');
  });

  it('fromIso round-trips with toIso', () => {
    const orig = a.create(2026, 8, 20);
    const roundtripped = a.fromIso(a.toIso(orig))!;
    expect(a.sameDate(orig, roundtripped)).toBe(true);
  });

  it('deserialize returns invalid for garbage input', () => {
    const d = a.deserialize('not-a-date');
    expect(d).not.toBeNull();
    expect(a.isValid(d!)).toBe(false);
  });

  it('deserialize returns null for null / empty', () => {
    expect(a.deserialize(null)).toBeNull();
    expect(a.deserialize('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – startOfDay', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('startOfDay zeroes the time', () => {
    const d = DateTime.fromObject({ year: 2026, month: 6, day: 15, hour: 14, minute: 30 });
    const sod = a.startOfDay(d);
    expect(sod.hour).toBe(0);
    expect(sod.minute).toBe(0);
    expect(sod.second).toBe(0);
    expect(sod.millisecond).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Week helpers
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – week helpers', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('startOfWeek with Sunday start (0) — week containing Wed 2026-01-07', () => {
    const wed = a.create(2026, 1, 7);
    const sow = a.startOfWeek(wed, 0);
    expect(a.getDayOfWeek(sow)).toBe(0); // Sunday
    expect(sow.day).toBe(4); // Jan 4 is the Sunday before
  });

  it('startOfWeek with Monday start (1)', () => {
    const wed = a.create(2026, 1, 7);
    const sow = a.startOfWeek(wed, 1);
    expect(a.getDayOfWeek(sow)).toBe(1); // Monday
    expect(sow.day).toBe(5); // Jan 5 is the Monday of that week
  });

  it('endOfWeek is 6 days after startOfWeek', () => {
    const date = a.create(2026, 1, 7);
    const eow = a.endOfWeek(date, 0);
    const sow = a.startOfWeek(date, 0);
    expect(a.compare(eow, a.addDays(sow, 6))).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Month / year names
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – names', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => {
    a = adapter();
    a.setLocale('en-US');
  });

  it('getMonthNames long returns 12 entries starting with January', () => {
    const names = a.getMonthNames('long');
    expect(names).toHaveLength(12);
    expect(names[0]).toBe('January');
    expect(names[11]).toBe('December');
  });

  it('getMonthNames short', () => {
    const names = a.getMonthNames('short');
    expect(names[0]).toMatch(/Jan/i);
  });

  it('getDayOfWeekNames long has 7 entries, index 0 = Sunday', () => {
    const names = a.getDayOfWeekNames('long');
    expect(names).toHaveLength(7);
    expect(names[0]).toBe('Sunday');
    expect(names[1]).toBe('Monday');
    expect(names[6]).toBe('Saturday');
  });

  it('getYearName returns the year as string', () => {
    expect(a.getYearName(a.create(2026, 6, 15))).toContain('2026');
  });

  it('getDaysInWeek returns 7', () => {
    expect(a.getDaysInWeek()).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Leap year edge cases (§35.3)
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – leap year (§35.3)', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('Feb 29 is valid in a leap year', () => {
    const leapDay = a.create(2024, 2, 29);
    expect(a.isValid(leapDay)).toBe(true);
    expect(leapDay.day).toBe(29);
    expect(leapDay.month).toBe(2);
  });

  it('getNumDaysInMonth returns 29 for Feb in a leap year', () => {
    expect(a.getNumDaysInMonth(a.create(2024, 2, 1))).toBe(29);
    expect(a.getNumDaysInMonth(a.create(2025, 2, 1))).toBe(28);
  });
});

// ---------------------------------------------------------------------------
// TZ-aware methods (§4.2, §20.2, §35.3)
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – getTimezone', () => {
  it('returns null when no TZ_OVERRIDE is provided', () => {
    const a = adapter();
    expect(a.getTimezone()).toBeNull();
  });

  it('returns the configured IANA timezone', () => {
    const a = adapter('America/New_York');
    expect(a.getTimezone()).toBe('America/New_York');
  });
});

describe('LuxonDateAdapter – withTimezone', () => {
  it('changes the zone while preserving the UTC instant', () => {
    const a = adapter();
    const utcMidnight = DateTime.fromISO('2026-06-15T00:00:00Z', { zone: 'UTC' });
    const nyCopy = a.withTimezone(utcMidnight, 'America/New_York');
    expect(nyCopy.zoneName).toBe('America/New_York');
    // Same UTC epoch
    expect(nyCopy.valueOf()).toBe(utcMidnight.valueOf());
    // Different local hour
    expect(nyCopy.hour).not.toBe(0);
  });
});

describe('LuxonDateAdapter – today() with TZ_OVERRIDE', () => {
  it('today() in UTC timezone is at midnight UTC', () => {
    const a = adapter('UTC');
    const t = a.today();
    expect(t.zoneName).toBe('UTC');
    expect(t.hour).toBe(0);
    expect(t.minute).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// DST — spring forward (§35.3)
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – DST spring forward (§35.3)', () => {
  it('startOfDay on spring-forward night returns a valid midnight (or earliest valid instant)', () => {
    // In NY, 2024-03-10 at 2:00 AM clocks jump to 3:00 AM.
    // Midnight (00:00) is not affected — it exists before the transition.
    const a = adapter('America/New_York');
    const d = DateTime.fromObject({ year: 2024, month: 3, day: 10 }, { zone: 'America/New_York' });
    const sod = a.startOfDay(d);
    expect(sod.isValid).toBe(true);
    expect(sod.hour).toBe(0);
    expect(sod.month).toBe(3);
    expect(sod.day).toBe(10);
  });

  it('isDST returns false just before spring-forward', () => {
    const a = adapter('America/New_York');
    // March 9 is still EST (no DST)
    const beforeDST = DateTime.fromObject({ year: 2024, month: 3, day: 9 }, { zone: 'America/New_York' });
    expect(a.isDST(beforeDST)).toBe(false);
  });

  it('isDST returns true after spring-forward', () => {
    const a = adapter('America/New_York');
    // March 11 is EDT (DST active)
    const afterDST = DateTime.fromObject({ year: 2024, month: 3, day: 11 }, { zone: 'America/New_York' });
    expect(a.isDST(afterDST)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DST — fall back & resolveAmbiguous (§35.3)
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – DST fall back & resolveAmbiguous (§35.3)', () => {
  it('isDST is true during the EDT occurrence of 1:30 AM on fall-back day', () => {
    const a = adapter('America/New_York');
    // Luxon defaults to the earlier occurrence (EDT, -240)
    const ambiguous = DateTime.fromObject(
      { year: 2024, month: 11, day: 3, hour: 1, minute: 30 },
      { zone: 'America/New_York' },
    );
    expect(a.isDST(ambiguous)).toBe(true);
  });

  it('resolveAmbiguous prefer=earlier returns the DST offset (-240)', () => {
    const a = adapter('America/New_York');
    const ambiguous = DateTime.fromObject(
      { year: 2024, month: 11, day: 3, hour: 1, minute: 30 },
      { zone: 'America/New_York' },
    );
    const resolved = a.resolveAmbiguous(ambiguous, 'earlier');
    expect(resolved.offset).toBe(-240); // EDT
    expect(a.isDST(resolved)).toBe(true);
  });

  it('resolveAmbiguous prefer=later returns the standard offset (-300)', () => {
    const a = adapter('America/New_York');
    const ambiguous = DateTime.fromObject(
      { year: 2024, month: 11, day: 3, hour: 1, minute: 30 },
      { zone: 'America/New_York' },
    );
    const resolved = a.resolveAmbiguous(ambiguous, 'later');
    expect(resolved.offset).toBe(-300); // EST
    expect(a.isDST(resolved)).toBe(false);
  });

  it('resolveAmbiguous on a non-ambiguous time returns the original DateTime unchanged', () => {
    const a = adapter('America/New_York');
    const nonAmbiguous = DateTime.fromObject(
      { year: 2024, month: 11, day: 3, hour: 9, minute: 0 },
      { zone: 'America/New_York' },
    );
    const result = a.resolveAmbiguous(nonAmbiguous, 'later');
    expect(result.valueOf()).toBe(nonAmbiguous.valueOf());
  });

  it('resolveAmbiguous both candidates share the same local clock time', () => {
    const a = adapter('America/New_York');
    const dt = DateTime.fromObject(
      { year: 2024, month: 11, day: 3, hour: 1, minute: 30 },
      { zone: 'America/New_York' },
    );
    const earlier = a.resolveAmbiguous(dt, 'earlier');
    const later = a.resolveAmbiguous(dt, 'later');
    expect(earlier.hour).toBe(1);
    expect(earlier.minute).toBe(30);
    expect(later.hour).toBe(1);
    expect(later.minute).toBe(30);
  });

  it('resolveAmbiguous earlier is a strictly earlier UTC instant than later', () => {
    const a = adapter('America/New_York');
    const dt = DateTime.fromObject(
      { year: 2024, month: 11, day: 3, hour: 1, minute: 30 },
      { zone: 'America/New_York' },
    );
    const earlier = a.resolveAmbiguous(dt, 'earlier');
    const later = a.resolveAmbiguous(dt, 'later');
    expect(earlier.valueOf()).toBeLessThan(later.valueOf());
  });
});

// ---------------------------------------------------------------------------
// DST — southern-hemisphere fall back (§35.3)
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – DST southern hemisphere (§35.3)', () => {
  it('isDST is true during southern summer (Australian DST)', () => {
    const a = adapter('Australia/Sydney');
    // January in Sydney is summer — DST (AEDT, UTC+11)
    const summerDate = DateTime.fromObject(
      { year: 2024, month: 1, day: 15 },
      { zone: 'Australia/Sydney' },
    );
    expect(a.isDST(summerDate)).toBe(true);
  });

  it('isDST is false during southern winter (Australian standard time)', () => {
    const a = adapter('Australia/Sydney');
    // July in Sydney is winter — no DST (AEST, UTC+10)
    const winterDate = DateTime.fromObject(
      { year: 2024, month: 7, day: 15 },
      { zone: 'Australia/Sydney' },
    );
    expect(a.isDST(winterDate)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// First-day-of-week variants (§35.3)
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – first-day-of-week variants (§35.3)', () => {
  it('getFirstDayOfWeek returns 0 for en-US (Sunday)', () => {
    const a = adapter();
    a.setLocale('en-US');
    expect(a.getFirstDayOfWeek()).toBe(0);
  });

  it('getFirstDayOfWeek returns 1 for fr-FR (Monday)', () => {
    const a = adapter();
    a.setLocale('fr-FR');
    expect(a.getFirstDayOfWeek()).toBe(1);
  });

  it('startOfWeek with Saturday start (6)', () => {
    // 2026-01-07 is a Wednesday
    const a = adapter();
    const wed = a.create(2026, 1, 7);
    const sow = a.startOfWeek(wed, 6);
    expect(a.getDayOfWeek(sow)).toBe(6); // Saturday
  });
});

// ---------------------------------------------------------------------------
// clampDate
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – clampDate', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('returns min when date is before min', () => {
    const min = a.create(2026, 3, 1);
    const result = a.clampDate(a.create(2026, 1, 1), min, null);
    expect(a.sameDate(result, min)).toBe(true);
  });

  it('returns max when date is after max', () => {
    const max = a.create(2026, 6, 30);
    const result = a.clampDate(a.create(2026, 12, 31), null, max);
    expect(a.sameDate(result, max)).toBe(true);
  });

  it('returns original when within bounds', () => {
    const date = a.create(2026, 4, 15);
    const result = a.clampDate(date, a.create(2026, 1, 1), a.create(2026, 12, 31));
    expect(a.sameDate(result, date)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 53-week year (§35.3)
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – 53-week year (§35.3)', () => {
  it('Dec 28 of a 53-ISO-week year is in the last ISO week of that year', () => {
    // 2020 has 53 ISO weeks; Dec 28 is in week 53
    const a = adapter();
    const dec28 = a.create(2020, 12, 28);
    expect(a.isValid(dec28)).toBe(true);
    const dt = dec28 as DateTime;
    expect(dt.weekNumber).toBe(53);
  });
});

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – format', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => {
    a = adapter();
    a.setLocale('en-US');
  });

  it('format returns empty string for invalid date', () => {
    expect(a.format(a.invalid(), { luxonFormat: 'yyyy-MM-dd' })).toBe('');
  });

  it('format with luxonFormat token string', () => {
    const d = a.create(2026, 6, 5);
    expect(a.format(d, { luxonFormat: 'yyyy-MM-dd' })).toBe('2026-06-05');
  });

  it('format with Intl dateTimeFormat options', () => {
    const d = a.create(2026, 6, 5);
    const result = a.format(d, { dateTimeFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } });
    expect(result).toContain('2026');
  });

  it('format with raw Luxon token string (no wrapper)', () => {
    const d = a.create(2026, 6, 5);
    expect(a.format(d, 'yyyy')).toBe('2026');
  });

  it('format with no format falls back to DATE_MED', () => {
    const d = a.create(2026, 6, 5);
    const result = a.format(d, undefined);
    expect(result).toContain('2026');
  });
});

// ---------------------------------------------------------------------------
// withTime
// ---------------------------------------------------------------------------

describe('LuxonDateAdapter – withTime', () => {
  let a: LuxonDateAdapter;
  beforeEach(() => (a = adapter()));

  it('returns a new DateTime with the given time, same date', () => {
    const d = a.create(2026, 6, 15);
    const result = a.withTime(d, 14, 30, 45);
    expect(result.year).toBe(2026);
    expect(result.month).toBe(6);
    expect(result.day).toBe(15);
    expect(result.hour).toBe(14);
    expect(result.minute).toBe(30);
    expect(result.second).toBe(45);
    expect(result.millisecond).toBe(0);
  });
});
