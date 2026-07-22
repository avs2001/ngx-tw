import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Presentational wrapper that pairs any form control with its label, required marker, prefix and suffix adornments, hint text, and validation errors.',
  whenToUse: [
    'Giving a text field, textarea, select, or custom control a consistent labelled row with hint and error regions',
    'A floating label in auto, always, or never mode, over an outline or filled appearance',
    'Prefix and suffix adornments — a currency symbol, a unit, a search icon, or a stepper button group',
    'Automatic accessibility wiring: label-for association plus aria-describedby merging for hints and errors that preserves consumer ids',
    'A subscript that swaps hint text for an error announced via role="alert" once the control enters its error state',
    'Plugging a consumer-authored control into the same chrome by implementing FormFieldControl and providing TW_FORM_FIELD_CONTROL',
  ],
  related: ['input', 'textarea', 'select', 'number-input', 'combobox', 'date-picker', 'core'],
  aliases: [
    'field wrapper',
    'form group',
    'form row',
    'label wrapper',
    'floating label',
    'hint',
    'helper text',
    'error message',
    'validation message',
    'prefix suffix',
    'adornment',
  ],
} satisfies ComponentMeta;
