import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Editable typeahead text input paired with a popover listbox, where the typed text filters suggestions and may itself be committed as the value.',
  whenToUse: [
    'A single-value field whose option list is too long to scroll and needs type-ahead filtering',
    'Suggestions fetched from a server as the user types, driven by a debounced queryChange with client-side filtering turned off',
    'Fields that accept a value outside the suggestion list, such as a tag or city that may not exist yet',
    'Locking entry to the known set instead, via strict mode, while keeping the typing affordance',
  ],
  whenNotToUse: [
    {
      instead: 'select',
      because:
        'the value must come from a closed set with no typing, or the user needs to pick several values at once',
    },
    {
      instead: 'input',
      because: 'the field is free text with no suggestion list behind it',
    },
    {
      instead: 'tags-input',
      because: 'the user is building a list of free-text values rather than choosing one',
    },
    {
      instead: 'command-palette',
      because:
        'the typed query runs a global action rather than filling in a form field, and is reached by keyboard from anywhere',
    },
  ],
  related: ['select', 'input', 'form-field', 'command-palette', 'tags-input'],
  aliases: [
    'autocomplete',
    'typeahead',
    'auto-complete',
    'suggest',
    'search input',
    'dropdown',
    'lookup',
    'filterable select',
  ],
} satisfies ComponentMeta;
