import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Numeric field that replaces the browser-inconsistent native number input with a spinbutton-patterned text field, locale-aware formatting, and optional up/down stepper buttons.',
  whenToUse: [
    'Any numeric form value that must round-trip as a real number | null and never a string or NaN',
    'Quantities, prices, percentages, and currency amounts needing Intl.NumberFormat grouping, decimals, or a currency symbol',
    'A bounded value where min / max clamp on commit and step drives arrow keys, Home / End, and the spinner',
    'Mobile entry that needs the right keypad — inputmode numeric for integers, decimal otherwise',
    'Visible increment / decrement buttons, via the companion <tw-number-stepper> mounted in a form-field suffix slot',
  ],
  whenNotToUse: [
    {
      instead: 'slider',
      because: 'the user should pick a number by dragging along a range rather than typing an exact value',
    },
    {
      instead: 'time-picker',
      because: 'the number is an hour, minute, or second component of a time value',
    },
    {
      instead: 'input',
      because: 'the value is text that merely looks numeric, such as a phone number, postcode, or account reference',
    },
  ],
  related: ['input', 'form-field', 'slider', 'time-picker', 'core'],
  aliases: [
    'numeric input',
    'number field',
    'spinbutton',
    'spinner',
    'stepper',
    'quantity',
    'currency input',
    'price input',
    'increment decrement',
    'numeric stepper',
  ],
} satisfies ComponentMeta;
