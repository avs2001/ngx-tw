import {
  Injectable,
  isDevMode,
  type EnvironmentProviders,
  type Provider,
  makeEnvironmentProviders,
} from '@angular/core';
import { DateAdapter, TW_DATE_ADAPTER, type TwDateNameStyle } from './date-adapter';

/** Display-format descriptor used by `NativeDateAdapter.format()`. */
export interface TwNativeDateFormat {
  /** Any option bag accepted by `Intl.DateTimeFormat`. */
  readonly dateTimeFormat?: Intl.DateTimeFormatOptions;
}

const MS_PER_MINUTE = 60_000;

const warnedLocales = new Set<string>();
function warnUnresolvableLocaleOnce(locale: string): void {
  if (!isDevMode() || warnedLocales.has(locale)) return;
  warnedLocales.add(locale);
   
  console.warn(
    `[ngx-tw/calendar] Locale "${locale}" is unknown to Intl.Locale.getWeekInfo(); falling back to Monday (1) as the first day of week (§19.2).`,
  );
}

/** `Intl`-driven `Date` adapter. Zero runtime dependencies. */
@Injectable()
export class NativeDateAdapter extends DateAdapter<Date> {
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
        : 'en-US';
    return this._locale;
  }

  today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * Constructs a `Date`. **`month` is 1-based** — `create(2026, 1, 1)` yields
   * January 1, 2026.
   */
  create(year: number, month: number, day: number): Date {
    const d = new Date(year, month - 1, day);
    // `new Date(year, ...)` on two-digit years maps to 19xx by convention;
    // re-anchor explicitly so consumers can construct years < 100.
    if (year >= 0 && year < 100) {
      d.setFullYear(year);
    }
    return d;
  }

  clone(date: Date): Date {
    return new Date(date.getTime());
  }

  setLocale(locale: string): void {
    this._locale = locale;
  }

  getLocale(): string {
    return this.locale;
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  getMonth(date: Date): number {
    return date.getMonth();
  }

  getDate(date: Date): number {
    return date.getDate();
  }

  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  getNumDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  getHours(date: Date): number {
    return date.getHours();
  }

  getMinutes(date: Date): number {
    return date.getMinutes();
  }

  getSeconds(date: Date): number {
    return date.getSeconds();
  }

  withTime(date: Date, hours: number, minutes: number, seconds: number): Date {
    const d = new Date(date.getTime());
    d.setHours(hours, minutes, seconds, 0);
    return d;
  }

  getFirstDayOfWeek(): number {
    // §19.2: derive from `Intl.Locale.getWeekInfo()` when available; fallback to
    // Monday (1) and emit a single dev-mode warning when the locale is unknown
    // to `Intl.Locale`. ICU/CLDR returns 1=Monday … 7=Sunday — we normalize to
    // the project's 0=Sunday … 6=Saturday convention.
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
        warnUnresolvableLocaleOnce(this.locale);
        return 1;
      }
    }
    warnUnresolvableLocaleOnce(this.locale);
    return 1;
  }

  getMonthNames(style: TwDateNameStyle): string[] {
    const fmt = new Intl.DateTimeFormat(this.locale, { month: style, timeZone: 'UTC' });
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2017, i, 1))));
  }

  getDayOfWeekNames(style: TwDateNameStyle): string[] {
    const fmt = new Intl.DateTimeFormat(this.locale, { weekday: style, timeZone: 'UTC' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2017, 0, i + 1))));
  }

  override getDateNames(style: TwDateNameStyle = 'short'): string[] {
    const fmt = new Intl.DateTimeFormat(this.locale, { day: style === 'narrow' ? 'numeric' : 'numeric', timeZone: 'UTC' });
    return Array.from({ length: 31 }, (_, i) => fmt.format(new Date(Date.UTC(2017, 0, i + 1))));
  }

  getYearName(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, { year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(date.getFullYear(), 0, 1)),
    );
  }

  format(date: Date, displayFormat: unknown): string {
    if (!this.isValid(date)) return '';
    const fmt = (displayFormat as TwNativeDateFormat | undefined)?.dateTimeFormat ?? {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat(this.locale, fmt).format(date);
  }

  addYears(date: Date, years: number): Date {
    return this.addMonths(date, years * 12);
  }

  addMonths(date: Date, months: number): Date {
    const d = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const targetDay = Math.min(
      date.getDate(),
      new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
    );
    return new Date(d.getFullYear(), d.getMonth(), targetDay);
  }

  addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  override addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * MS_PER_MINUTE);
  }

  override addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 60 * MS_PER_MINUTE);
  }

  compare(first: Date, second: Date): number {
    return (
      this.getYear(first) - this.getYear(second) ||
      this.getMonth(first) - this.getMonth(second) ||
      this.getDate(first) - this.getDate(second)
    );
  }

  sameDate(first: Date | null | undefined, second: Date | null | undefined): boolean {
    if (first && second) {
      const f = this.isValid(first);
      const s = this.isValid(second);
      if (f && s) return this.compare(first, second) === 0;
      return f === s;
    }
    return first === second;
  }

  /**
   * Start-of-day normalization. Rebuilds the date at `00:00:00.000` local time.
   * On DST spring-forward days where midnight is valid, this is a no-op beyond
   * zeroing h/m/s/ms. On DST fall-back days the repeated-01:00 hour does not
   * affect `00:00`, so this is also safe.
   *
   * The edge case of an entire DST-skipped midnight (rare — exists in some
   * historical zones) is resolved by `new Date(year, month, day)` selecting the
   * next valid instant forward.
   */
  startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  isValid(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  invalid(): Date {
    return new Date(NaN);
  }

  parse(value: unknown): Date | null {
    if (typeof value === 'number') return new Date(value);
    if (value instanceof Date) return this.clone(value);
    if (typeof value === 'string') {
      if (!value.trim()) return null;
      const parsed = new Date(value);
      return this.isValid(parsed) ? parsed : null;
    }
    return null;
  }

  deserialize(value: unknown): Date | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) return this.isValid(value) ? this.clone(value) : this.invalid();
    const parsed = this.parse(value);
    if (parsed && this.isValid(parsed)) return parsed;
    return this.invalid();
  }

  toIso(date: Date): string {
    return [
      String(date.getFullYear()).padStart(4, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}

/** Provides the default `Date`-based adapter. */
export function provideNativeDateAdapter(): EnvironmentProviders {
  return makeEnvironmentProviders([
    NativeDateAdapter,
    { provide: TW_DATE_ADAPTER, useExisting: NativeDateAdapter },
  ]);
}

/** Provides a custom `DateAdapter` implementation. */
export function provideTwCalendar<D>(config: {
  adapter: new (...args: never[]) => DateAdapter<D>;
  extraProviders?: Provider[];
}): EnvironmentProviders {
  return makeEnvironmentProviders([
    config.adapter as unknown as Provider,
    { provide: TW_DATE_ADAPTER, useExisting: config.adapter },
    ...(config.extraProviders ?? []),
  ]);
}
