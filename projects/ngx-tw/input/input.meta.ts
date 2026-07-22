import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Attribute directive that adapts a native single-line text field into a themed, form-field-compatible control without taking over value I/O.',
  whenToUse: [
    'Any single-line text, email, password, search, url, or tel field in a form',
    'A field that should render its own border and focus ring standalone, then strip that chrome automatically inside a <tw-form-field> wrapper',
    'Keeping Angular native value accessors in charge so the same element works with ngModel, a reactive FormControl, or a signal-forms formField binding',
    'A field whose error styling must follow an ErrorStateMatcher, per-instance or via the global TW_ERROR_STATE_MATCHER token',
    'Masked or transformed text values, supplied through a custom TW_INPUT_VALUE_ACCESSOR provider',
  ],
  whenNotToUse: [
    {
      instead: 'textarea',
      because: 'the value is multi-line and needs autosize, a resize handle, or a character counter',
    },
    {
      instead: 'number-input',
      because: 'the value is numeric and must round-trip as a real number with locale-aware formatting and arrow-key stepping',
    },
    {
      instead: 'checkbox',
      because: 'the value is a boolean — the directive throws in dev mode on type="checkbox"',
    },
    {
      instead: 'radio',
      because: 'the value is one choice from a small enumerated set — the directive throws in dev mode on type="radio"',
    },
    {
      instead: 'combobox',
      because: 'typing should filter a list of suggestions rather than capture free text alone',
    },
  ],
  related: ['form-field', 'textarea', 'number-input', 'select', 'date-picker', 'core'],
  aliases: [
    'text field',
    'textbox',
    'text box',
    'text input',
    'field',
    'entry',
    'search box',
    'password field',
    'email field',
  ],
} satisfies ComponentMeta;
