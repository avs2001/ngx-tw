import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Single-date form control combining a typable text input with a modal popover calendar, following the ARIA date-picker dialog pattern.',
  whenToUse: [
    'A form field that captures one date, such as a birth date, due date, or appointment day',
    'Layouts where a permanently visible month grid would take too much room, so the calendar lives behind a trigger',
    'Users who prefer to type the date but still want a grid to fall back on',
    'A full timestamp in one control, by enabling the built-in time fields alongside the date',
    'Constraining entry with min/max bounds or a date filter and surfacing violations through the standard error state',
  ],
  whenNotToUse: [
    {
      instead: 'date-range-picker',
      because: 'the value has a start and an end rather than a single day',
    },
    {
      instead: 'calendar',
      because:
        'the month grid should be permanently visible inline, or you are composing a custom date UI on the primitive',
    },
    {
      instead: 'time-picker',
      because: 'only the time of day matters and there is no date to capture',
    },
    {
      instead: 'input',
      because: 'a free-form typed string is enough and no calendar affordance is wanted',
    },
  ],
  related: ['calendar', 'date-range-picker', 'time-picker', 'form-field', 'input'],
  aliases: [
    'datepicker',
    'date input',
    'date field',
    'day picker',
    'calendar input',
    'date selector',
    'due date',
  ],
} satisfies ComponentMeta;
