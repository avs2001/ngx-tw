import { Directive } from '@angular/core';

/**
 * Marker directive for a slot positioned above the calendar grid. Used to
 * style an external preset rail; the calendar renders projected content
 * with `<ng-content select="[twCalendarPresets]">`.
 */
@Directive({
  selector: '[twCalendarPresets]',
  host: {
    class: 'flex flex-wrap items-center gap-1.5 px-2 pb-2',
  },
})
export class TwCalendarPresets {}
