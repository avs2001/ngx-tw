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
 * `month` is **1-based** throughout (matches the abstract contract and Luxon's
 * own `DateTime.fromObject({ month })` convention).
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

  /** Returns the **1-based** month (1 = January, 12 = December). */
  getMonth(date: DateTime): number {
    return date.month;
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
   * Default first day of week — Sunday (`0`), matching the native adapter.
   * Consumers can override at the calendar component level via the spec's
   * `firstDayOfWeek` input.
   */
  getFirstDayOfWeek(): number {
    return 0;
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
   *   otherwise falls back to `fromISO`.
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
      if (iso.isValid) return iso;
      const sql = DateTime.fromSQL(value, opts);
      if (sql.isValid) return sql;
      const rfc = DateTime.fromRFC2822(value, opts);
      return rfc.isValid ? rfc : null;
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
   * Resolves an ambiguous wall-clock time during DST fall-back. Luxon's
   * default behaviour selects the first occurrence; `prefer: 'later'` shifts
   * to the second occurrence by adding one hour and re-anchoring.
   */
  override resolveAmbiguous(date: DateTime, prefer: 'earlier' | 'later'): DateTime {
    if (!date.isValid) return date;
    if (prefer === 'earlier') return date;
    // Try advancing one hour: on a fall-back day this lands on the repeated
    // wall-clock hour's second occurrence. Outside DST transitions this is a
    // benign no-op that we revert below.
    const candidate = date.plus({ hours: 1 });
    if (
      candidate.hour === date.hour &&
      candidate.day === date.day &&
      candidate.month === date.month &&
      candidate.year === date.year
    ) {
      return candidate;
    }
    return date;
  }
}
