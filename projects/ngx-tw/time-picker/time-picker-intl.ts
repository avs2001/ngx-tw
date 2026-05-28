import { Injectable, type Provider } from '@angular/core';

/**
 * Localized strings + ARIA announcements consumed by the time-picker.
 *
 * Override per-field via Angular DI — provide a custom instance, or supply a
 * `Partial<TimePickerIntl>` through `provideTimePickerIntl`. Unset fields
 * fall through to the English defaults shipped here.
 *
 * All members take primitives so consumers can write straight string
 * literals or template helpers without depending on internal types.
 */
@Injectable()
export class TimePickerIntl {
  // ---------------------------------------------------------------------------
  // Group + field labels
  // ---------------------------------------------------------------------------

  /** Accessible name for the fields group (the wrapper around hours/minutes/seconds). */
  groupLabel = 'Time';

  /** Accessible name for the hours field. */
  hoursLabel = 'Hours';

  /** Accessible name for the minutes field. */
  minutesLabel = 'Minutes';

  /** Accessible name for the seconds field. */
  secondsLabel = 'Seconds';

  /** Accessible name for the meridiem (AM/PM) radio group. */
  meridiemGroupLabel = 'AM or PM';

  /** Display + accessible name for the AM option. */
  amLabel = 'AM';

  /** Display + accessible name for the PM option. */
  pmLabel = 'PM';

  // ---------------------------------------------------------------------------
  // Stepper + clear button labels
  // ---------------------------------------------------------------------------

  /** Aria label template for the up stepper. Receives the active field name (`'hours'`, `'minutes'`, `'seconds'`). */
  increaseLabel(field: string): string {
    return `Increase ${field}`;
  }

  /** Aria label template for the down stepper. Receives the active field name (`'hours'`, `'minutes'`, `'seconds'`). */
  decreaseLabel(field: string): string {
    return `Decrease ${field}`;
  }

  /** Aria label for the clear button. */
  clearLabel = 'Clear time';

  // ---------------------------------------------------------------------------
  // Live announcements
  // ---------------------------------------------------------------------------

  /** Live-region message announced after the value is cleared. */
  clearedAnnouncement = 'Time cleared';

  /** Live-region message after a commit. Receives the pre-formatted time string (e.g. `'02:30 PM'`). */
  selectedAnnouncement(formattedTime: string): string {
    return `${formattedTime} selected`;
  }

  /** Spoken text for an empty hour/minute/second field — used as `aria-valuetext` when the field is blank. */
  emptyValueText = 'Empty';
}

/**
 * Provides a custom `TimePickerIntl` instance. Place at any injector level —
 * the time-picker resolves the closest one.
 *
 * @example
 * ```ts
 * providers: [
 *   provideTimePickerIntl({
 *     hoursLabel: 'Heures',
 *     minutesLabel: 'Minutes',
 *     meridiemGroupLabel: 'AM ou PM',
 *   }),
 * ]
 * ```
 */
export function provideTimePickerIntl(custom: Partial<TimePickerIntl>): Provider {
  return {
    provide: TimePickerIntl,
    useFactory: () => Object.assign(new TimePickerIntl(), custom),
  };
}
