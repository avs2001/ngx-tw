import type { CalendarIntl } from './calendar-intl';

/**
 * German (de) locale pack for the calendar's user-visible strings.
 * Pass into the `intl` input or via {@link provideCalendarIntl}. Per-field
 * merge semantics (§19.4) — unspecified fields fall back to English defaults.
 */
export const de: Partial<CalendarIntl> = {
  previousMonthLabel: 'Vorheriger Monat',
  nextMonthLabel: 'Naechster Monat',
  previousYearLabel: 'Vorheriges Jahr',
  nextYearLabel: 'Naechstes Jahr',
  previousYearsLabel(yearsPerPage: number): string {
    return yearsPerPage === 1 ? 'Vorheriges Jahr' : `Vorherige ${yearsPerPage} Jahre`;
  },
  nextYearsLabel(yearsPerPage: number): string {
    return yearsPerPage === 1 ? 'Naechstes Jahr' : `Naechste ${yearsPerPage} Jahre`;
  },
  todayLabel: 'Heute',
  clearLabel: 'Loeschen',
  applyLabel: 'Uebernehmen',
  openCalendarLabel: 'Kalender oeffnen',
  chooseDateLabel: 'Datum auswaehlen',
  calendarLabel: 'Kalender',
  monthViewLabel: 'Monatsansicht',
  yearViewLabel: 'Jahresansicht',
  decadeViewLabel: 'Jahrzehntansicht',
  switchToMonthViewLabel(period: string): string {
    return `${period}, klicken um zur Monatsansicht zu wechseln`;
  },
  switchToYearViewLabel(period: string): string {
    return `${period}, klicken um zur Jahresansicht zu wechseln`;
  },
  navigatedTo(direction: 'previous' | 'next', period: string): string {
    const word = direction === 'previous' ? 'vorigen' : 'naechsten';
    return `Zu ${word} ${period} navigiert`;
  },
  selectedAnnouncement(value: string): string {
    return `Ausgewaehlt: ${value}`;
  },
  rangeStartAnnouncement(start: string): string {
    return `Startdatum ausgewaehlt: ${start}. Bitte Enddatum auswaehlen.`;
  },
  rangeUpdateAnnouncement(start: string, end: string, lengthDays: number): string {
    const noun = lengthDays === 1 ? 'Tag' : 'Tage';
    return `Zeitraum ausgewaehlt: ${start} bis ${end}, ${lengthDays} ${noun}`;
  },
  requiredError: 'Bitte ein Datum auswaehlen',
  minDateError(date: string): string {
    return `Datum muss am oder nach dem ${date} liegen`;
  },
  maxDateError(date: string): string {
    return `Datum muss am oder vor dem ${date} liegen`;
  },
  invalidValueError: 'Ungueltiger Datumswert',
  invalidRangeError: 'Ungueltiger Zeitraum',
  dateFilterError: 'Dieses Datum ist nicht verfuegbar',
  parseErrorLabel: 'Ungueltiges Datumsformat',
};
