import { Injectable, type Provider } from '@angular/core';

/**
 * Context payload passed to `cellAccessibleName` so consumers can produce a
 * locale-appropriate accessible name for any cell in any view (§15.6, §19.4).
 */
export interface CalendarCellAccessibleNameContext {
  /** The date the cell represents. */
  readonly date: Date;
  /** Which view the cell lives in. */
  readonly mode: 'day' | 'month' | 'year';
  /** True when the cell is part of the committed selection. */
  readonly selected?: boolean;
  /** True when the cell is today. */
  readonly today?: boolean;
  /** True when the cell is non-interactive (constraint or filter). */
  readonly disabled?: boolean;
  /** Optional pre-formatted display string the consumer may incorporate. */
  readonly display?: string;
}

/**
 * Localized strings + ARIA announcements consumed by the calendar (§19.4).
 *
 * Override per-field via Angular DI — provide a custom instance, or pass a
 * `Partial<CalendarIntl>` into the calendar component's `intl` input. Unset
 * fields fall through to the English defaults shipped here.
 *
 * All members take primitives so consumers can write straight string
 * literals or template helpers without depending on internal types.
 */
@Injectable()
export class CalendarIntl {
  /**
   * Plural rules used for the four plural-marked keys in §19.4: range length,
   * "X dates selected", "Skipped {N} periods", and the year-range button label.
   * Resolved lazily so SSR / non-`Intl` environments don't crash at construction.
   */
  private _plural: Intl.PluralRules | null = null;
  private getPlural(): Intl.PluralRules {
    if (this._plural !== null) return this._plural;
    this._plural =
      typeof Intl !== 'undefined' && typeof Intl.PluralRules === 'function'
        ? new Intl.PluralRules('en')
        : ({ select: (n: number) => (n === 1 ? 'one' : 'other') } as unknown as Intl.PluralRules);
    return this._plural;
  }

  // ---------------------------------------------------------------------------
  // Button labels (§19.4)
  // ---------------------------------------------------------------------------

  /** Aria label for the "previous month" navigation button (day view). */
  previousMonthLabel = 'Previous month';

  /** Aria label for the "next month" navigation button (day view). */
  nextMonthLabel = 'Next month';

  /** Aria label for the "previous year" navigation button (month view). */
  previousYearLabel = 'Previous year';

  /** Aria label for the "next year" navigation button (month view). */
  nextYearLabel = 'Next year';

  /** Aria label for the "previous N years" navigation button (year view). */
  previousYearsLabel(yearsPerPage: number): string {
    const cat = this.getPlural().select(yearsPerPage);
    return cat === 'one' ? `Previous ${yearsPerPage} year` : `Previous ${yearsPerPage} years`;
  }

  /** Aria label for the "next N years" navigation button (year view). */
  nextYearsLabel(yearsPerPage: number): string {
    const cat = this.getPlural().select(yearsPerPage);
    return cat === 'one' ? `Next ${yearsPerPage} year` : `Next ${yearsPerPage} years`;
  }

  /** Aria label for the "today" shortcut button (footer). */
  todayLabel = 'Today';

  /** Aria label for the "clear" button (footer). */
  clearLabel = 'Clear';

  /** Aria label for the "apply" button (footer). */
  applyLabel = 'Apply';

  /** Aria label for the trigger/open-calendar button. */
  openCalendarLabel = 'Open calendar';

  /** Aria label for the "choose date" trigger. */
  chooseDateLabel = 'Choose date';

  // ---------------------------------------------------------------------------
  // View labels (§19.4)
  // ---------------------------------------------------------------------------

  /** Aria label applied to the calendar root element. */
  calendarLabel = 'Calendar';

  /** Aria label appended to the period button while in the day view. */
  monthViewLabel = 'month view';

  /** Aria label appended to the period button while in the month view. */
  yearViewLabel = 'year view';

  /** Aria label for the year (decade) view. */
  decadeViewLabel = 'decade view';

  /** Tooltip / aria text for the "switch to month view" affordance. */
  switchToMonthViewLabel(period: string): string {
    return `${period}, click to switch to month view`;
  }

  /** Tooltip / aria text for the "switch to year view" affordance. */
  switchToYearViewLabel(period: string): string {
    return `${period}, click to switch to year view`;
  }

  // ---------------------------------------------------------------------------
  // Cell accessible names (§15.6, §19.4)
  // ---------------------------------------------------------------------------

  /**
   * Returns the accessible name a screen reader announces for any cell.
   * Default implementation appends "today" / "selected" / "disabled" suffixes
   * to the supplied `display` string.
   */
  cellAccessibleName(ctx: CalendarCellAccessibleNameContext): string {
    const base = ctx.display ?? '';
    const tags: string[] = [];
    if (ctx.today) tags.push('today');
    if (ctx.selected) tags.push('selected');
    if (ctx.disabled) tags.push('disabled');
    return tags.length === 0 ? base : `${base}, ${tags.join(', ')}`;
  }

  // ---------------------------------------------------------------------------
  // ARIA announcements (§15.7, §19.4)
  // ---------------------------------------------------------------------------

  /** Live-region message after navigating the displayed period. */
  navigatedTo(direction: 'previous' | 'next', period: string): string {
    return `Navigated to ${direction} ${period}`;
  }

  /** Live-region message after a single-mode selection commits. */
  selectedAnnouncement(value: string): string {
    return `Selected ${value}`;
  }

  /** Live-region message after the start of a range is picked. */
  rangeStartAnnouncement(start: string): string {
    return `Start date selected: ${start}. Now select end date.`;
  }

  /** Live-region message after a range commits. Plural-marked on `lengthDays`. */
  rangeUpdateAnnouncement(start: string, end: string, lengthDays: number): string {
    const cat = this.getPlural().select(lengthDays);
    const noun = cat === 'one' ? 'day' : 'days';
    return `Range selected: ${start} to ${end}, ${lengthDays} ${noun}`;
  }

  /** Live-region message after a `mode: 'multiple'` selection commits. Plural-marked. */
  multipleSelectionAnnouncement(count: number): string {
    const cat = this.getPlural().select(count);
    const noun = cat === 'one' ? 'date' : 'dates';
    return `${count} ${noun} selected`;
  }

  /** Live-region message after the active view changes. */
  viewSwitched(view: 'day' | 'month' | 'year', period: string): string {
    const label =
      view === 'day' ? this.monthViewLabel.replace(/ view$/, '') : view === 'month' ? this.yearViewLabel.replace(/ view$/, '') : this.decadeViewLabel.replace(/ view$/, '');
    return `${label} view, ${period}`;
  }

  /** Live-region template used while a range pick is in progress. */
  inProgressTemplate(state: string): string {
    return `Selecting: ${state}, now select end date`;
  }

  /** Live-region message announcing how many empty periods auto-skip jumped over. Plural-marked. */
  skippedPeriods(count: number, destination: string): string {
    const cat = this.getPlural().select(count);
    const noun = cat === 'one' ? 'period' : 'periods';
    return `Skipped ${count} ${noun} to ${destination}`;
  }

  /** Live-region message announced when a click is rejected and the cell flashes (e.g. `'require-clear'` rejection, disabled-cross range commit). */
  selectionRejectedAnnouncement = 'Selection rejected';

  /**
   * When `true`, the calendar suppresses live-region announcements for the
   * affected user actions. Override in tests or low-noise environments.
   */
  skipAnnouncement = false;

  // ---------------------------------------------------------------------------
  // Error messages (§10.2, §19.4)
  // ---------------------------------------------------------------------------

  /** Message for the `calendarRequired` validation error. */
  requiredError = 'Please select a date';

  /** Message for the `calendarMinDate` validation error. */
  minDateError(date: string): string {
    return `Date must be on or after ${date}`;
  }

  /** Message for the `calendarMaxDate` validation error. */
  maxDateError(date: string): string {
    return `Date must be on or before ${date}`;
  }

  /** Message for the `calendarInvalidValue` validation error. */
  invalidValueError = 'Invalid date value';

  /** Message for the `calendarRangeTooShort` validation error. Plural-marked on `min`. */
  rangeTooShortError(min: number): string {
    const cat = this.getPlural().select(min);
    const noun = cat === 'one' ? 'day' : 'days';
    return `Range must be at least ${min} ${noun}`;
  }

  /** Message for the `calendarRangeTooLong` validation error. Plural-marked on `max`. */
  rangeTooLongError(max: number): string {
    const cat = this.getPlural().select(max);
    const noun = cat === 'one' ? 'day' : 'days';
    return `Range must be at most ${max} ${noun}`;
  }

  /** Message for the `calendarInvalidRange` validation error. */
  invalidRangeError = 'Invalid date range';

  /** Message for the `calendarDisabledDate` validation error. */
  dateFilterError = 'This date is not available';

  /** Message for the `calendarMaxSelections` validation error. */
  maxSelectionsError(limit: number): string {
    const cat = this.getPlural().select(limit);
    const noun = cat === 'one' ? 'date' : 'dates';
    return `You may select at most ${limit} ${noun}`;
  }

  // ---------------------------------------------------------------------------
  // Parse-error label (§10.2, §19.4)
  // ---------------------------------------------------------------------------

  /** Label announced when a typed date fails to parse. */
  parseErrorLabel = 'Invalid date format';

  // ---------------------------------------------------------------------------
  // Keyboard help (§16.4, §19.4)
  // ---------------------------------------------------------------------------

  /** Multi-line description of the keyboard contract for screen readers / help dialogs. */
  keyboardHelpText = [
    'Use arrow keys to move between dates.',
    'Press Enter or Space to select the focused date.',
    'Use Page Up and Page Down to move between months.',
    'Use Shift + Page Up and Shift + Page Down to move between years.',
    'Use Home and End to jump to the start or end of the week.',
    'Press Escape to close the calendar.',
  ].join(' ');
}

/**
 * Provides a custom `CalendarIntl` instance. Place at any injector level —
 * the calendar resolves the closest one and merges any per-instance `intl`
 * input on top of it (§19.4 per-field merge semantics).
 *
 * Keys explicitly set to `undefined` are dropped before merging. Root
 * `tsconfig.json` does not set `exactOptionalPropertyTypes`, so
 * `provideCalendarIntl({ monthViewLabel: bundle['calendar.monthView'] })`
 * type-checks even when the lookup misses — and a plain `Object.assign` would
 * then copy that `undefined` over a field `CalendarIntl` types as `string`.
 * Because this is a bootstrap-level provider, one missing key in an i18n
 * bundle broke *every* calendar in the app, and the failure surfaced far from
 * the call site: `viewSwitched()` calls `.replace()` on the label directly, so
 * the first drill-up threw `Cannot read properties of undefined (reading
 * 'replace')`. Filtering here makes a missing key fall back to the English
 * default instead.
 */
export function provideCalendarIntl(custom: Partial<CalendarIntl>): Provider {
  return {
    provide: CalendarIntl,
    useFactory: () => {
      const overrides = Object.fromEntries(
        Object.entries(custom ?? {}).filter(([, value]) => value !== undefined),
      );
      return Object.assign(new CalendarIntl(), overrides);
    },
  };
}
