import type { CalendarIntl } from './calendar-intl';

/**
 * Spanish (es) locale pack for the calendar's user-visible strings.
 * Pass into the `intl` input or via {@link provideCalendarIntl}. Per-field
 * merge semantics (§19.4) — unspecified fields fall back to English defaults.
 */
export const es: Partial<CalendarIntl> = {
  previousMonthLabel: 'Mes anterior',
  nextMonthLabel: 'Mes siguiente',
  previousYearLabel: 'Ano anterior',
  nextYearLabel: 'Ano siguiente',
  previousYearsLabel(yearsPerPage: number): string {
    return yearsPerPage === 1 ? 'Ano anterior' : `${yearsPerPage} anos anteriores`;
  },
  nextYearsLabel(yearsPerPage: number): string {
    return yearsPerPage === 1 ? 'Ano siguiente' : `${yearsPerPage} anos siguientes`;
  },
  todayLabel: 'Hoy',
  clearLabel: 'Borrar',
  applyLabel: 'Aplicar',
  openCalendarLabel: 'Abrir calendario',
  chooseDateLabel: 'Elegir fecha',
  calendarLabel: 'Calendario',
  monthViewLabel: 'vista de mes',
  yearViewLabel: 'vista de ano',
  decadeViewLabel: 'vista de decada',
  switchToMonthViewLabel(period: string): string {
    return `${period}, haga clic para cambiar a la vista de mes`;
  },
  switchToYearViewLabel(period: string): string {
    return `${period}, haga clic para cambiar a la vista de ano`;
  },
  navigatedTo(direction: 'previous' | 'next', period: string): string {
    const word = direction === 'previous' ? 'anterior' : 'siguiente';
    return `Navegado al ${period} ${word}`;
  },
  selectedAnnouncement(value: string): string {
    return `Seleccionado: ${value}`;
  },
  rangeStartAnnouncement(start: string): string {
    return `Fecha de inicio seleccionada: ${start}. Ahora seleccione la fecha de fin.`;
  },
  rangeUpdateAnnouncement(start: string, end: string, lengthDays: number): string {
    const noun = lengthDays === 1 ? 'dia' : 'dias';
    return `Rango seleccionado: ${start} al ${end}, ${lengthDays} ${noun}`;
  },
  requiredError: 'Por favor seleccione una fecha',
  minDateError(date: string): string {
    return `La fecha debe ser el ${date} o posterior`;
  },
  maxDateError(date: string): string {
    return `La fecha debe ser el ${date} o anterior`;
  },
  invalidValueError: 'Valor de fecha invalido',
  invalidRangeError: 'Rango de fechas invalido',
  dateFilterError: 'Esta fecha no esta disponible',
  parseErrorLabel: 'Formato de fecha invalido',
};
