import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Row of mutually exclusive toggle buttons where exactly one is always selected, implementing the ARIA radiogroup pattern with roving tabindex.',
  whenToUse: [
    'View switches such as list / grid / table where all choices should stay visible',
    'Short time-range or scope filters like Day / Week / Month',
    'A choice from three or four options where a dropdown would be overkill but a plain button group would not communicate selection',
    'A compact inline form value that still needs to work with any Angular form strategy',
  ],
  whenNotToUse: [
    {
      instead: 'select',
      because: 'the option set is larger than four or five, or needs search',
    },
    {
      instead: 'radio',
      because:
        'the options need their own labels and descriptions, or the list is long enough to stack vertically as a traditional radio group',
    },
    {
      instead: 'switch',
      because: 'the value is a single binary on/off rather than a choice from a set',
    },
    {
      instead: 'tabs',
      because: 'activating an option swaps a panel of content instead of setting a value',
    },
  ],
  related: ['radio', 'switch', 'tabs', 'select', 'button'],
  aliases: [
    'segmented buttons',
    'toggle group',
    'button group',
    'switcher',
    'view toggle',
    'radio group',
    'pill toggle',
  ],
} satisfies ComponentMeta;
