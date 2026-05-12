import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside
 * `calendar-examples.component.ts`.
 */
export type CalendarSectionName =
  | 'Single selection'
  | 'Range selection'
  | 'Multiple selection'
  | 'Constraints (min / max / disabled dates / disabled weekdays)'
  | 'Range length + max selections'
  | 'Range click behavior (§21.2)'
  | 'Presets slot'
  | 'Reactive forms'
  | 'Signal Forms';

export type FormStrategy = 'reactive' | 'signal';

const STRATEGY_TO_SECTION: Record<FormStrategy, CalendarSectionName> = {
  reactive: 'Reactive forms',
  signal: 'Signal Forms',
};

/**
 * Page Object Model for the standalone calendar examples route.
 *
 * The calendar renders day cells as `<button>` elements inside containers
 * with `role="grid"`. Cells carry `data-state-selected`,
 * `data-state-range-start`, `data-state-in-range`, `data-state-today`,
 * `data-state-disabled`, and `data-state-out-of-month` attributes.
 *
 * Note: there is no template-driven section in the calendar demo — calendar
 * supports reactive forms and signal forms only.
 */
export class CalendarPage {
  readonly main: Locator;

  readonly singleSection: Locator;
  readonly rangeSection: Locator;
  readonly multipleSection: Locator;
  readonly constraintsSection: Locator;
  readonly rangeLengthSection: Locator;
  readonly rangeClickSection: Locator;
  readonly presetsSection: Locator;
  readonly reactiveSection: Locator;
  readonly signalSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.singleSection = this.section('Single selection');
    this.rangeSection = this.section('Range selection');
    this.multipleSection = this.section('Multiple selection');
    this.constraintsSection = this.section(
      'Constraints (min / max / disabled dates / disabled weekdays)',
    );
    this.rangeLengthSection = this.section('Range length + max selections');
    this.rangeClickSection = this.section('Range click behavior (§21.2)');
    this.presetsSection = this.section('Presets slot');
    this.reactiveSection = this.section('Reactive forms');
    this.signalSection = this.section('Signal Forms');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/calendar/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** The n-th `<tw-calendar>` inside a section. */
  calendarIn(section: Locator, nth = 0): Locator {
    return section.locator('tw-calendar').nth(nth);
  }

  calendarForStrategy(strategy: FormStrategy): Locator {
    return this.calendarIn(this.section(STRATEGY_TO_SECTION[strategy]));
  }

  /** Day cell by aria-label inside a specific calendar. */
  dayCell(calendar: Locator, name: string | RegExp): Locator {
    return calendar.getByRole('button', { name });
  }

  /** All enabled day cells in the calendar's first grid. */
  enabledDays(calendar: Locator): Locator {
    return calendar.locator('[role="grid"] button:not([disabled])');
  }

  /** The cell carrying `tabindex=0` — the active descendant. */
  activeCell(calendar: Locator): Locator {
    return calendar.locator('[role="grid"] button[tabindex="0"]');
  }

  private section(name: CalendarSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
