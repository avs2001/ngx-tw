import { Injectable, inject } from '@angular/core';
import { DateTime, Info, Settings } from 'luxon';
import { DateAdapter, TZ_OVERRIDE, type TwDateNameStyle } from '../date-adapter';

/**
 * Display-format descriptor used by `LuxonDateAdapter.format()` and
 * `LuxonDateAdapter.parse()`.
 *
 * Two shapes are supported:
 * - `{ format: 'yyyy-LL-dd' }` — a Luxon `toFormat`/`fromFormat` token string.
 * - `{ preset: DateTime.DATE_FULL }` — a Luxon preset (an `Intl.DateTimeFormatOptions` bag).
 *
 * If both are provided, `format` (the explicit token) wins.
 */
export interface TwLuxonDateFormat {
  /** Luxon token string consumed by `DateTime#toFormat` / `DateTime.fromFormat`. */
  readonly format?: string;
  /** Luxon preset (e.g. `DateTime.DATE_FULL`) consumed by `DateTime#toLocaleString`. */
  readonly preset?: Intl.DateTimeFormatOptions;
}

/**
 * Luxon-backed `DateAdapter`. Honors the calendar's `TZ_OVERRIDE` injection
 * token so `today()` resolves against the consumer-configured timezone, and
 * implements the §20.2 TZ-aware virtuals (`getTimezone`, `withTimezone`,
 * `isDST`, `resolveAmbiguous`).
 *
 * `create()` accepts **1-based** months (matching the abstract contract and
 * Luxon's `DateTime.fromObject({ month })` convention), while `getMonth()`
 * returns **0-based** months (also per the abstract contract — see
 * `NativeDateAdapter`).
 */
@Injectable()
export class LuxonDateAdapter extends DateAdapter<DateTime> {
  /**
   * Optional per-instance timezone override (§4.3, §7.4). Resolved lazily so
   * the constructor stays SSR-safe — Luxon's default zone reads from the host
   * environment which we want to defer until first use.
   */
  private readonly _tzOverride = inject(TZ_OVERRIDE, { optional: true });

  /**
   * Locale is resolved lazily on first read so the constructor stays
   * SSR-safe (no `navigator` access at class-construction time — §31.1).
   */
  private _locale: string | null = null;

  private get locale(): string {
    if (this._locale !== null) return this._locale;
    this._locale =
      typeof navigator !== 'undefined' && typeof navigator.language === 'string'
        ? navigator.language
        : Settings.defaultLocale ?? 'en-US';
    return this._locale;
  }

  /**
   * Returns the configured timezone for new dates. Precedence: per-instance
   * `TZ_OVERRIDE` → Luxon's `Settings.defaultZone` → `'local'`.
   */
  private get zone(): string {
    if (this._tzOverride) return this._tzOverride;
    const def = Settings.defaultZone;
    // `Settings.defaultZone` is a `Zone` instance — fall back to its name.
    return def && typeof def !== 'string' ? def.name : 'local';
  }

  /** Builds a `DateTime` in the adapter's configured zone + locale. */
  private inZone(dt: DateTime): DateTime {
    return dt.setZone(this.zone).setLocale(this.locale);
  }

  today(): DateTime {
    return DateTime.now().setZone(this.zone).setLocale(this.locale).startOf('day');
  }

  /**
   * Constructs a `DateTime`. **`month` is 1-based** — `create(2026, 1, 1)`
   * yields January 1, 2026 at 00:00 in the adapter's configured zone.
   */
  create(year: number, month: number, day: number): DateTime {
    return DateTime.fromObject(
      { year, month, day },
      { zone: this.zone, locale: this.locale },
    );
  }

  clone(date: DateTime): DateTime {
    // `DateTime` is immutable; reconstructing preserves zone/locale and
    // matches the defensive-copy semantics of the abstract contract.
    return DateTime.fromMillis(date.toMillis(), {
      zone: date.zone,
      locale: date.locale ?? this.locale,
    });
  }

  setLocale(locale: string): void {
    this._locale = locale;
  }

  getLocale(): string {
    return this.locale;
  }

  getYear(date: DateTime): number {
    return date.year;
  }

  /**
   * Returns the **0-based** month (0 = January, 11 = December) to match the
   * abstract `DateAdapter` contract and the `NativeDateAdapter`. Luxon's
   * `DateTime.month` is 1-based, so we subtract one.
   */
  getMonth(date: DateTime): number {
    return date.month - 1;
  }

  getDate(date: DateTime): number {
    return date.day;
  }

  /**
   * Day of week mapped to the Sunday-based scheme used by the abstract
   * contract: `0 = Sunday`, `6 = Saturday`. Luxon's `weekday` is
   * `1 = Monday … 7 = Sunday`, so Sunday gets re-anchored to `0`.
   */
  getDayOfWeek(date: DateTime): number {
    return date.weekday % 7;
  }

  getNumDaysInMonth(date: DateTime): number {
    return date.daysInMonth ?? 0;
  }

  getHours(date: DateTime): number {
    return date.hour;
  }

  getMinutes(date: DateTime): number {
    return date.minute;
  }

  getSeconds(date: DateTime): number {
    return date.second;
  }

  withTime(date: DateTime, hours: number, minutes: number, seconds: number): DateTime {
    return date.set({ hour: hours, minute: minutes, second: seconds, millisecond: 0 });
  }

  /**
   * Locale-aware first day of week (§19.2). Mirrors `NativeDateAdapter` —
   * derives from `Intl.Locale.getWeekInfo()` when available, falling back to
   * Monday (`1`) when the locale is unknown to ICU. ICU/CLDR returns
   * `1=Monday … 7=Sunday`; we normalize to the project's `0=Sunday … 6=Saturday`
   * convention so both adapters report identical values for identical locales.
   */
  getFirstDayOfWeek(): number {
    if (typeof Intl !== 'undefined' && typeof Intl.Locale === 'function') {
      try {
        const l = new Intl.Locale(this.locale) as Intl.Locale & {
          getWeekInfo?: () => { firstDay: number };
          weekInfo?: { firstDay: number };
        };
        const info = (l.getWeekInfo?.() ?? l.weekInfo) as { firstDay: number } | undefined;
        if (info && typeof info.firstDay === 'number') {
          return info.firstDay === 7 ? 0 : info.firstDay;
        }
      } catch {
        return 1;
      }
    }
    return 1;
  }

  getMonthNames(style: TwDateNameStyle): string[] {
    return Info.months(style, { locale: this.locale });
  }

  /**
   * Day-of-week names starting at Sunday. Luxon's `Info.weekdays` starts at
   * Monday, so the array is rotated to put Sunday first to match the abstract
   * contract (and the native adapter).
   */
  getDayOfWeekNames(style: TwDateNameStyle): string[] {
    const monStart = Info.weekdays(style, { locale: this.locale });
    // `[Mon, Tue, Wed, Thu, Fri, Sat, Sun]` → `[Sun, Mon, Tue, Wed, Thu, Fri, Sat]`.
    return [monStart[6], ...monStart.slice(0, 6)];
  }

  override getDateNames(_style: TwDateNameStyle = 'short'): string[] {
    // Use a 31-day reference month to localize numerals where needed.
    const ref = DateTime.fromObject(
      { year: 2017, month: 1, day: 1 },
      { zone: 'utc', locale: this.locale },
    );
    return Array.from({ length: 31 }, (_, i) => ref.plus({ days: i }).toFormat('d'));
  }

  getYearName(date: DateTime): string {
    return date.toFormat('yyyy', { locale: this.locale });
  }

  /**
   * Formats a date for display.
   *
   * Accepts either a Luxon token string (e.g. `'yyyy-LL-dd'`), a
   * {@link TwLuxonDateFormat} descriptor, or a Luxon preset bag
   * (`Intl.DateTimeFormatOptions`). When no format is supplied the
   * adapter falls back to a locale-aware medium date.
   */
  format(date: DateTime, displayFormat: unknown): string {
    if (!this.isValid(date)) return '';
    const localized = date.setLocale(this.locale);
    if (typeof displayFormat === 'string') {
      return localized.toFormat(displayFormat);
    }
    if (displayFormat && typeof displayFormat === 'object') {
      const desc = displayFormat as TwLuxonDateFormat;
      if (typeof desc.format === 'string') {
        return localized.toFormat(desc.format);
      }
      if (desc.preset) {
        return localized.toLocaleString(desc.preset);
      }
      // Treat a bare option-bag as a preset.
      return localized.toLocaleString(displayFormat as Intl.DateTimeFormatOptions);
    }
    return localized.toLocaleString(DateTime.DATE_MED);
  }

  addYears(date: DateTime, years: number): DateTime {
    return date.plus({ years });
  }

  addMonths(date: DateTime, months: number): DateTime {
    return date.plus({ months });
  }

  addDays(date: DateTime, days: number): DateTime {
    return date.plus({ days });
  }

  override addHours(date: DateTime, hours: number): DateTime {
    return date.plus({ hours });
  }

  addMinutes(date: DateTime, minutes: number): DateTime {
    return date.plus({ minutes });
  }

  compare(first: DateTime, second: DateTime): number {
    // Compare by calendar fields (year/month/day) so two `DateTime` instances
    // representing the same wall-clock date in different zones still compare
    // equal — matches the native adapter's behaviour.
    return (
      first.year - second.year ||
      first.month - second.month ||
      first.day - second.day
    );
  }

  sameDate(
    first: DateTime | null | undefined,
    second: DateTime | null | undefined,
  ): boolean {
    if (first && second) {
      const f = this.isValid(first);
      const s = this.isValid(second);
      if (f && s) return this.compare(first, second) === 0;
      return f === s;
    }
    return first === second;
  }

  /**
   * Start-of-day normalization in the adapter's zone. Luxon's `startOf('day')`
   * is DST-aware — on spring-forward days it returns the wall-clock instant the
   * zone considers the first valid moment of the day.
   */
  startOfDay(date: DateTime): DateTime {
    return date.setZone(this.zone).startOf('day');
  }

  isValid(date: DateTime): boolean {
    return date instanceof DateTime && date.isValid;
  }

  /** Returns Luxon's invalid sentinel (an invalid `DateTime`). */
  invalid(): DateTime {
    return DateTime.invalid('invalid');
  }

  /**
   * Parses a value into a `DateTime`. Accepts:
   * - `DateTime` (cloned),
   * - JS `Date` (re-anchored to the adapter's zone + locale),
   * - number (epoch milliseconds),
   * - string — when `parseFormat` is a Luxon token, uses `fromFormat`;
   *   otherwise parses strict ISO 8601 only.
   *
   * The free-form-string path is intentionally narrow: SQL and RFC 2822
   * fallbacks were dropped so the Luxon adapter's acceptance surface matches
   * `NativeDateAdapter.parse()` (which only accepts strings parseable by
   * `new Date(value)`). Callers that need bespoke string formats should pass
   * an explicit `parseFormat` token.
   *
   * Returns `null` on empty input or unrecognised value types, mirroring the
   * native adapter's contract.
   */
  parse(value: unknown, parseFormat?: unknown): DateTime | null {
    if (value == null) return null;
    if (value instanceof DateTime) {
      return value.isValid ? this.clone(value) : null;
    }
    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value, { zone: this.zone }).setLocale(this.locale);
      return dt.isValid ? dt : null;
    }
    if (typeof value === 'number') {
      const dt = DateTime.fromMillis(value, { zone: this.zone, locale: this.locale });
      return dt.isValid ? dt : null;
    }
    if (typeof value === 'string') {
      if (!value.trim()) return null;
      const opts = { zone: this.zone, locale: this.locale };
      if (typeof parseFormat === 'string') {
        const dt = DateTime.fromFormat(value, parseFormat, opts);
        return dt.isValid ? dt : null;
      }
      if (parseFormat && typeof parseFormat === 'object') {
        const desc = parseFormat as TwLuxonDateFormat;
        if (typeof desc.format === 'string') {
          const dt = DateTime.fromFormat(value, desc.format, opts);
          return dt.isValid ? dt : null;
        }
      }
      const iso = DateTime.fromISO(value, opts);
      return iso.isValid ? iso : null;
    }
    return null;
  }

  /**
   * Coerce an incoming form value. Returns `null` for empty input, an invalid
   * `DateTime` sentinel for malformed input (so validators can flag it), and a
   * cloned valid `DateTime` otherwise.
   */
  deserialize(value: unknown): DateTime | null {
    if (value == null || value === '') return null;
    if (value instanceof DateTime) {
      return value.isValid ? this.clone(value) : this.invalid();
    }
    const parsed = this.parse(value);
    if (parsed && parsed.isValid) return parsed;
    return this.invalid();
  }

  /**
   * ISO 8601 date serialization (`YYYY-MM-DD`). Calendar dates have no
   * time component — `toIso` returns just the date portion.
   */
  toIso(date: DateTime): string {
    return date.toFormat('yyyy-LL-dd');
  }

  /**
   * Parses an ISO-8601 string to a `DateTime`. Overrides the base
   * implementation to use Luxon's optimised `fromISO` parser.
   */
  override fromIso(iso: string): DateTime | null {
    if (typeof iso !== 'string' || !iso.trim()) return null;
    const dt = DateTime.fromISO(iso, { zone: this.zone, locale: this.locale });
    return dt.isValid ? dt : null;
  }

  // ---------------------------------------------------------------------------
  // TZ-aware virtuals (§20.2). Luxon's `DateTime` carries zone information, so
  // these are real implementations rather than the floating no-ops in the base
  // class.
  // ---------------------------------------------------------------------------

  /** Returns the adapter's configured IANA zone name (e.g. `'America/New_York'`). */
  override getTimezone(): string {
    return this.zone;
  }

  /** Returns a copy of `date` reinterpreted in `tz`. */
  override withTimezone(date: DateTime, tz: string): DateTime {
    return date.setZone(tz);
  }

  /** Whether `date` is currently observing daylight-saving time in its zone. */
  override isDST(date: DateTime): boolean {
    return date.isInDST;
  }

  /**
   * Resolves an ambiguous wall-clock time during DST fall-back. On fall-back
   * days a single wall-clock hour repeats — e.g. 2024-11-03 01:30 in
   * `America/New_York` happens once at offset -04:00 (EDT) and again at
   * offset -05:00 (EST). Luxon's `DateTime.fromObject({...}, { zone })` always
   * returns the **earlier** of the two candidates, so we reconstruct the
   * "later" occurrence explicitly: rebuild the candidate at the date's
   * wall-clock fields (anchoring it on the earlier occurrence) and add one
   * hour to land on the same wall-clock's second occurrence in the
   * post-fall-back offset.
   *
   * Non-ambiguous wall-clocks return unchanged for both `prefer` values:
   * after `plus({ hour: 1 })` the wall-clock hour increments (no DST
   * repetition), so the candidate is rejected and we return `date` as-is.
   */
  override resolveAmbiguous(date: DateTime, prefer: 'earlier' | 'later'): DateTime {
    if (!date.isValid) return date;
    // Re-anchor on the earlier of the two candidates by reconstructing the
    // wall-clock from `date`'s fields in its current zone. Luxon's
    // `fromObject` deterministically picks the earlier instant when the
    // input wall-clock is ambiguous, regardless of which occurrence `date`
    // happens to represent.
    const zone = date.zoneName ?? this.zone;
    const earlier = DateTime.fromObject(
      {
        year: date.year,
        month: date.month,
        day: date.day,
        hour: date.hour,
        minute: date.minute,
        second: date.second,
        millisecond: date.millisecond,
      },
      { zone, locale: date.locale ?? this.locale },
    );
    if (!earlier.isValid) return date;
    if (prefer === 'earlier') return earlier;
    // Advancing one hour from the earlier-occurrence instant lands on the
    // same wall-clock at the post-fall-back offset on ambiguous hours, and
    // increments the wall-clock by one on non-ambiguous hours. Compare
    // wall-clock fields to distinguish the two cases.
    const later = earlier.plus({ hours: 1 });
    if (
      later.hour === earlier.hour &&
      later.day === earlier.day &&
      later.month === earlier.month &&
      later.year === earlier.year
    ) {
      return later;
    }
    return earlier;
  }
}
