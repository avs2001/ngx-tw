import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Form control for choosing one or many values from a list, implementing the WAI-ARIA combobox-with-listbox-popup pattern.',
  whenToUse: [
    'Choosing a value for a form field from a known set of options',
    'Multi-select where the chosen values display as chips in the trigger',
    'Option lists that benefit from grouping or an in-panel search box',
    'Any of the three Angular form strategies — template-driven, reactive, or signal forms',
  ],
  whenNotToUse: [
    { instead: 'menu', because: 'the entries run actions rather than setting a form value' },
    { instead: 'radio', because: 'there are only a few options and all of them should stay visible' },
    { instead: 'combobox', because: 'the user must be able to type a free-form value that is not in the list' },
    { instead: 'segmented-control', because: 'there are two or three mutually exclusive options that belong inline' },
  ],
  related: ['combobox', 'form-field', 'menu', 'radio', 'segmented-control'],
  aliases: ['dropdown', 'picker', 'listbox', 'multiselect', 'choice', 'option list'],
} satisfies ComponentMeta;
