import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Three-state selection control — unchecked, checked, and indeterminate — for an answer that is independent of the other options in view.',
  whenToUse: [
    'An opt-in the user reviews before committing the form — accept terms, remember me, subscribe',
    'A list of independent options where any number may be on at once',
    'A parent "select all" that shows aria-checked="mixed" while only some children are checked',
    'Row selection in a list or table where each row toggles on its own',
    'Reactive validation with Validators.requiredTrue, where aria-invalid follows the ErrorStateMatcher',
    'Native form submission, via the hidden <input type="checkbox"> that carries the name input',
  ],
  whenNotToUse: [
    {
      instead: 'radio',
      because: 'exactly one of a small, fully visible set must be chosen',
    },
    {
      instead: 'switch',
      because: 'the toggle takes effect immediately rather than being submitted with the form',
    },
    {
      instead: 'select',
      because: 'the enumeration is long enough that inline options would overwhelm the layout',
    },
    {
      instead: 'transfer',
      because: 'the user is moving many items between a source and a chosen list',
    },
  ],
  related: ['radio', 'switch', 'select', 'form-field', 'core'],
  aliases: [
    'tickbox',
    'tick box',
    'check box',
    'toggle option',
    'multi-select option',
    'indeterminate',
    'mixed state',
    'select all',
    'opt-in',
    'consent',
  ],
} satisfies ComponentMeta;
