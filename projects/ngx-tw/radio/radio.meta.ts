import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Single-selection control and its group container, implementing the ARIA radiogroup pattern with arrow-key navigation and roving tabindex.',
  whenToUse: [
    'Exactly one choice from a small set where every option should stay visible — a plan picker, a shipping method, a payment type',
    'A choice list that needs rich per-option content: a description line, a custom dot, or projected markup beside the label',
    'A group laid out horizontally or vertically whose disabled state cascades to every child',
    'Native radio keyboard semantics: arrows move focus and selection together with wrap, Home / End jump to the ends, Enter still submits the form',
    'A one-shot standalone toggle bound with [(checked)], with no surrounding group',
  ],
  whenNotToUse: [
    {
      instead: 'checkbox',
      because: 'each option is independent and more than one can be on at the same time',
    },
    {
      instead: 'select',
      because: 'the list is long enough that showing every option would overwhelm the layout',
    },
    {
      instead: 'segmented-control',
      because: 'the mutually exclusive options should read as a compact inline button group',
    },
    {
      instead: 'switch',
      because: 'the choice is a binary on/off setting that takes effect immediately',
    },
  ],
  related: ['checkbox', 'switch', 'select', 'segmented-control', 'form-field', 'core'],
  aliases: [
    'radio button',
    'radiogroup',
    'radio group',
    'option button',
    'single choice',
    'exclusive choice',
    'either/or',
    'choice group',
  ],
} satisfies ComponentMeta;
