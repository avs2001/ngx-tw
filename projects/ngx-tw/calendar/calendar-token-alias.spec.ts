import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  DATE_ADAPTER,
  DATE_FORMATS,
  DATE_SERIALIZATION,
  TW_DATE_ADAPTER,
  TW_DATE_FORMATS,
  TW_DATE_SERIALIZATION,
  TW_TZ_OVERRIDE,
  TZ_OVERRIDE,
  type DateFormats,
} from './date-adapter';
import { NativeDateAdapter } from './native-date-adapter';
import {
  CALENDAR_SELECTION_STRATEGY,
  TW_CALENDAR_SELECTION_STRATEGY,
} from './selection/selection-strategy';
import { SingleSelectionStrategy } from './selection/single-selection-strategy';

/**
 * The calendar's five injection tokens gained `TW_` prefixes. Every deprecated
 * name must be a *reference to the same `InjectionToken` instance*, never a
 * second `new InjectionToken(...)` — two instances are two distinct DI keys, so
 * an app providing `DATE_ADAPTER` against a library that injects
 * `TW_DATE_ADAPTER` would break at runtime with nothing failing at build time.
 *
 * `DATE_ADAPTER` is the sharpest case: it is provided by consumers (directly or
 * via `provideNativeDateAdapter()` / `provideTwCalendar()`) and injected in ~14
 * library files, three of which — `date-picker`, `date-range-picker`,
 * `time-picker` — still import the deprecated name today.
 *
 * `week-selection-strategy.spec.ts` and `luxon/luxon-date-adapter.spec.ts`
 * deliberately keep providing the deprecated `DATE_ADAPTER` / `TZ_OVERRIDE`,
 * which makes those suites end-to-end proofs of the same property through real
 * library classes; the tests here pin it directly and in both directions.
 */

const ALIASES = [
  ['DATE_ADAPTER', DATE_ADAPTER, TW_DATE_ADAPTER],
  ['DATE_FORMATS', DATE_FORMATS, TW_DATE_FORMATS],
  ['TZ_OVERRIDE', TZ_OVERRIDE, TW_TZ_OVERRIDE],
  ['DATE_SERIALIZATION', DATE_SERIALIZATION, TW_DATE_SERIALIZATION],
  ['CALENDAR_SELECTION_STRATEGY', CALENDAR_SELECTION_STRATEGY, TW_CALENDAR_SELECTION_STRATEGY],
] as const;

describe('calendar token aliases', () => {
  for (const [name, deprecated, renamed] of ALIASES) {
    it(`${name} is the same token instance as its TW_ replacement`, () => {
      expect(deprecated).toBe(renamed);
    });
  }

  it('lets a strategy injecting TW_DATE_ADAPTER use an adapter provided as DATE_ADAPTER', () => {
    const adapter = new NativeDateAdapter();
    TestBed.configureTestingModule({
      providers: [{ provide: DATE_ADAPTER, useValue: adapter }, SingleSelectionStrategy],
    });

    // `SingleSelectionStrategy` injects `TW_DATE_ADAPTER` in a field
    // initialiser, so a split DI graph raises NullInjectorError on construction
    // rather than resolving.
    const strategy = TestBed.inject(
      SingleSelectionStrategy,
    ) as unknown as SingleSelectionStrategy<Date>;

    // Exercise the adapter through the strategy, not just its presence.
    expect(strategy.isSelected(new Date(2026, 0, 5), new Date(2026, 0, 5))).toBe(true);
    expect(strategy.isSelected(new Date(2026, 0, 5), new Date(2026, 0, 6))).toBe(false);
  });

  it('resolves an adapter provided as TW_DATE_ADAPTER when injected as DATE_ADAPTER', () => {
    const adapter = new NativeDateAdapter();
    TestBed.configureTestingModule({
      providers: [{ provide: TW_DATE_ADAPTER, useValue: adapter }],
    });
    expect(TestBed.inject(DATE_ADAPTER)).toBe(adapter);
  });

  it('round-trips DATE_FORMATS, TZ_OVERRIDE and DATE_SERIALIZATION in both directions', () => {
    const formats: DateFormats = { monthLabel: 'MMMM yyyy' };
    const serialization = { toJSON: () => 'iso' };

    TestBed.configureTestingModule({
      providers: [
        { provide: DATE_FORMATS, useValue: formats },
        { provide: TW_TZ_OVERRIDE, useValue: 'America/New_York' },
        { provide: DATE_SERIALIZATION, useValue: serialization },
      ],
    });

    expect(TestBed.inject(TW_DATE_FORMATS)).toBe(formats);
    expect(TestBed.inject(TZ_OVERRIDE)).toBe('America/New_York');
    expect(TestBed.inject(TW_DATE_SERIALIZATION)).toBe(serialization);
  });

  it('lets a strategy provided under either selection-strategy name resolve under the other', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DATE_ADAPTER, useClass: NativeDateAdapter },
        { provide: CALENDAR_SELECTION_STRATEGY, useClass: SingleSelectionStrategy },
      ],
    });
    expect(TestBed.inject(TW_CALENDAR_SELECTION_STRATEGY)).toBeInstanceOf(SingleSelectionStrategy);
  });
});
