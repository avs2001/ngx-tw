import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Multi-value text field where each typed token is committed with Enter, a separator key, or paste and renders as a dismissible chip.',
  whenToUse: [
    'Email recipient fields where addresses are typed rather than picked',
    'Free-form labels, keywords, or filter terms with no predefined option list',
    'Pasting a comma- or newline-separated list and having it split into individual values',
    'A form value that must round-trip as a real array through any Angular form strategy',
  ],
  whenNotToUse: [
    {
      instead: 'select',
      because: 'the values come from a fixed list of known options rather than being typed',
    },
    {
      instead: 'input',
      because: 'the field holds a single free-form string, not a collection',
    },
    {
      instead: 'badge',
      because: 'the chips are read-only annotations the user cannot add to or remove',
    },
  ],
  related: ['select', 'input', 'form-field', 'badge', 'combobox'],
  aliases: [
    'chips input',
    'chip grid',
    'token input',
    'tag editor',
    'keywords',
    'multi value input',
    'recipients',
    'pills',
  ],
} satisfies ComponentMeta;
