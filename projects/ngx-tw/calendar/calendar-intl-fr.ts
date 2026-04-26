import type { CalendarIntl } from './calendar-intl';

/**
 * French (fr) locale pack for the calendar's user-visible strings.
 * Pass into the `intl` input or via {@link provideCalendarIntl}. Per-field
 * merge semantics (§19.4) — unspecified fields fall back to English defaults.
 */
export const fr: Partial<CalendarIntl> = {
  previousMonthLabel: 'Mois precedent',
  nextMonthLabel: 'Mois suivant',
  previousYearLabel: 'Annee precedente',
  nextYearLabel: 'Annee suivante',
  previousYearsLabel(yearsPerPage: number): string {
    return yearsPerPage === 1 ? 'Annee precedente' : `${yearsPerPage} annees precedentes`;
  },
  nextYearsLabel(yearsPerPage: number): string {
    return yearsPerPage === 1 ? 'Annee suivante' : `${yearsPerPage} annees suivantes`;
  },
  todayLabel: "Aujourd'hui",
  clearLabel: 'Effacer',
  applyLabel: 'Appliquer',
  openCalendarLabel: 'Ouvrir le calendrier',
  chooseDateLabel: 'Choisir une date',
  calendarLabel: 'Calendrier',
  monthViewLabel: 'vue mensuelle',
  yearViewLabel: 'vue annuelle',
  decadeViewLabel: 'vue par decennie',
  switchToMonthViewLabel(period: string): string {
    return `${period}, cliquer pour passer a la vue mensuelle`;
  },
  switchToYearViewLabel(period: string): string {
    return `${period}, cliquer pour passer a la vue annuelle`;
  },
  navigatedTo(direction: 'previous' | 'next', period: string): string {
    const word = direction === 'previous' ? 'precedent' : 'suivant';
    return `Navigation vers ${period} ${word}`;
  },
  selectedAnnouncement(value: string): string {
    return `Selectionne : ${value}`;
  },
  rangeStartAnnouncement(start: string): string {
    return `Date de debut selectionnee : ${start}. Selectionnez la date de fin.`;
  },
  rangeUpdateAnnouncement(start: string, end: string, lengthDays: number): string {
    const noun = lengthDays === 1 ? 'jour' : 'jours';
    return `Plage selectionnee : ${start} au ${end}, ${lengthDays} ${noun}`;
  },
  requiredError: 'Veuillez selectionner une date',
  minDateError(date: string): string {
    return `La date doit etre le ${date} ou apres`;
  },
  maxDateError(date: string): string {
    return `La date doit etre le ${date} ou avant`;
  },
  invalidValueError: 'Valeur de date invalide',
  invalidRangeError: 'Plage de dates invalide',
  dateFilterError: 'Cette date n\'est pas disponible',
  parseErrorLabel: 'Format de date invalide',
};
