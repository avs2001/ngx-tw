import type { CalendarIntl } from './calendar-intl';

/**
 * Portuguese (pt) locale pack for the calendar's user-visible strings.
 * Pass into the `intl` input or via {@link provideCalendarIntl}. Per-field
 * merge semantics (§19.4) — unspecified fields fall back to English defaults.
 */
export const pt: Partial<CalendarIntl> = {
  previousMonthLabel: 'Mes anterior',
  nextMonthLabel: 'Proximo mes',
  previousYearLabel: 'Ano anterior',
  nextYearLabel: 'Proximo ano',
  previousYearsLabel(yearsPerPage: number): string {
    return yearsPerPage === 1 ? 'Ano anterior' : `${yearsPerPage} anos anteriores`;
  },
  nextYearsLabel(yearsPerPage: number): string {
    return yearsPerPage === 1 ? 'Proximo ano' : `Proximos ${yearsPerPage} anos`;
  },
  todayLabel: 'Hoje',
  clearLabel: 'Limpar',
  applyLabel: 'Aplicar',
  openCalendarLabel: 'Abrir calendario',
  chooseDateLabel: 'Escolher data',
  calendarLabel: 'Calendario',
  monthViewLabel: 'visao de mes',
  yearViewLabel: 'visao de ano',
  decadeViewLabel: 'visao de decada',
  switchToMonthViewLabel(period: string): string {
    return `${period}, clique para alternar para a visao de mes`;
  },
  switchToYearViewLabel(period: string): string {
    return `${period}, clique para alternar para a visao de ano`;
  },
  navigatedTo(direction: 'previous' | 'next', period: string): string {
    const word = direction === 'previous' ? 'anterior' : 'proximo';
    return `Navegou para ${period} ${word}`;
  },
  selectedAnnouncement(value: string): string {
    return `Selecionado: ${value}`;
  },
  rangeStartAnnouncement(start: string): string {
    return `Data inicial selecionada: ${start}. Selecione a data final.`;
  },
  rangeUpdateAnnouncement(start: string, end: string, lengthDays: number): string {
    const noun = lengthDays === 1 ? 'dia' : 'dias';
    return `Intervalo selecionado: ${start} a ${end}, ${lengthDays} ${noun}`;
  },
  requiredError: 'Por favor selecione uma data',
  minDateError(date: string): string {
    return `A data deve ser ${date} ou posterior`;
  },
  maxDateError(date: string): string {
    return `A data deve ser ${date} ou anterior`;
  },
  invalidValueError: 'Valor de data invalido',
  invalidRangeError: 'Intervalo de datas invalido',
  dateFilterError: 'Esta data nao esta disponivel',
  parseErrorLabel: 'Formato de data invalido',
};
