import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Segmented time-of-day editor where hours, minutes, optional seconds, and an optional AM/PM toggle are each an individually keyboard-editable spinbutton.',
  whenToUse: [
    'Capturing a time with no date attached, such as an opening hour or a daily reminder',
    'Keyboard-first time entry where digits auto-advance between fields and arrows step each unit',
    'Restricting entry to a window with minTime and maxTime and surfacing violations through the standard error state',
    'Constraining granularity through per-unit hour, minute, or second steps, or switching between 12h and 24h display',
    'Editing the time half of a timestamp beside a separate date control',
  ],
  whenNotToUse: [
    {
      instead: 'date-picker',
      because: 'a date is being captured too, and its built-in time fields cover the time half',
    },
    {
      instead: 'select',
      because: 'the user should pick from a short fixed list of slots rather than type any time',
    },
    {
      instead: 'number-input',
      because: 'the value is a plain duration or count of minutes, not a clock time',
    },
  ],
  related: ['date-picker', 'calendar', 'date-range-picker', 'form-field', 'number-input'],
  aliases: [
    'timepicker',
    'time input',
    'clock',
    'hour minute',
    'time of day',
    'am pm',
    '24h',
    'time field',
  ],
} satisfies ComponentMeta;
