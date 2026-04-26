import type { CalendarIntl } from './calendar-intl';

/**
 * Japanese (ja) locale pack for the calendar's user-visible strings.
 * Pass into the `intl` input or via {@link provideCalendarIntl}. Per-field
 * merge semantics (§19.4) — unspecified fields fall back to English defaults.
 *
 * Note: Japanese has no grammatical plural form, so plural-marked methods
 * collapse to a single form.
 */
export const ja: Partial<CalendarIntl> = {
  previousMonthLabel: '前月',
  nextMonthLabel: '翌月',
  previousYearLabel: '前年',
  nextYearLabel: '翌年',
  previousYearsLabel(yearsPerPage: number): string {
    return `前の${yearsPerPage}年`;
  },
  nextYearsLabel(yearsPerPage: number): string {
    return `次の${yearsPerPage}年`;
  },
  todayLabel: '今日',
  clearLabel: 'クリア',
  applyLabel: '適用',
  openCalendarLabel: 'カレンダーを開く',
  chooseDateLabel: '日付を選択',
  calendarLabel: 'カレンダー',
  monthViewLabel: '月表示',
  yearViewLabel: '年表示',
  decadeViewLabel: '10年表示',
  switchToMonthViewLabel(period: string): string {
    return `${period}、クリックして月表示に切り替え`;
  },
  switchToYearViewLabel(period: string): string {
    return `${period}、クリックして年表示に切り替え`;
  },
  navigatedTo(direction: 'previous' | 'next', period: string): string {
    const word = direction === 'previous' ? '前の' : '次の';
    return `${word}${period}に移動しました`;
  },
  selectedAnnouncement(value: string): string {
    return `選択済み: ${value}`;
  },
  rangeStartAnnouncement(start: string): string {
    return `開始日が選択されました: ${start}。終了日を選択してください。`;
  },
  rangeUpdateAnnouncement(start: string, end: string, lengthDays: number): string {
    return `期間が選択されました: ${start} から ${end}、${lengthDays}日間`;
  },
  requiredError: '日付を選択してください',
  minDateError(date: string): string {
    return `日付は${date}以降である必要があります`;
  },
  maxDateError(date: string): string {
    return `日付は${date}以前である必要があります`;
  },
  invalidValueError: '無効な日付値',
  invalidRangeError: '無効な日付範囲',
  dateFilterError: 'この日付は利用できません',
  parseErrorLabel: '無効な日付形式',
};
