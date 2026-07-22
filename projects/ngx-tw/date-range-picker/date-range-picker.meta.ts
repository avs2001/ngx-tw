import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Two-endpoint range form control that opens a modal overlay with one or two linked month grids, hover preview, and optional quick-select presets.',
  whenToUse: [
    'Booking windows, reporting periods, or filters defined by a start and an end date',
    'Range selection that reads better across two side-by-side months with lockstep pagination',
    'Offering shortcuts such as Today, Last 7 days, or This month next to the grid',
    'Capturing a time of day on each endpoint as well as the dates',
  ],
  whenNotToUse: [
    {
      instead: 'date-picker',
      because: 'only one date is being captured, not a span',
    },
    {
      instead: 'calendar',
      because:
        'the range grid should stay visible inline, or the selection behaviour needs a custom strategy on the primitive',
    },
    {
      instead: 'slider',
      because: 'the range is over a plain numeric axis rather than over dates',
    },
  ],
  related: ['date-picker', 'calendar', 'time-picker', 'form-field'],
  aliases: [
    'date range',
    'daterangepicker',
    'range picker',
    'period picker',
    'from to dates',
    'start end date',
    'booking dates',
    'reporting period',
  ],
} satisfies ComponentMeta;
