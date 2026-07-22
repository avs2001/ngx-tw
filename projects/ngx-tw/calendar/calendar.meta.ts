import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Inline month, year, and multi-year grid primitive that the date pickers are built on, with pluggable date adapter and swappable selection strategy.',
  whenToUse: [
    'A date grid that stays permanently visible on the page rather than behind a trigger',
    'Selection shapes beyond a single date — multiple loose dates, whole weeks, or a range',
    'Decorating cells with dots, badges, or prices through a cell template, or highlighting holidays and events with per-cell classes',
    'Custom selection behaviour such as business-days-only or anchored ranges, via the selection-strategy token',
    'Composing your own picker shell, using headerless mode and the projected preset rail',
  ],
  whenNotToUse: [
    {
      instead: 'date-picker',
      because:
        'the page only needs a compact field, with the grid appearing in a popover on demand',
    },
    {
      instead: 'date-range-picker',
      because:
        'a start and end date are captured from a trigger, with presets and an action bar already assembled',
    },
    {
      instead: 'time-picker',
      because: 'only the time of day is being edited and no date grid is involved',
    },
  ],
  related: ['date-picker', 'date-range-picker', 'time-picker', 'form-field'],
  aliases: [
    'date grid',
    'month view',
    'day grid',
    'inline datepicker',
    'year picker',
    'month picker',
    'week picker',
    'date adapter',
  ],
} satisfies ComponentMeta;
