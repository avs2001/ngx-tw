import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Dual-listbox shuttle — a source panel and a target panel with move controls between them — whose form value is the set of keys currently on the target side.',
  whenToUse: [
    'Assigning a subset out of a long fixed catalogue: permissions and scopes, feature flags, group members, mailing-list recipients',
    'Selections where the user benefits from seeing what is chosen and what remains side by side',
    'Bulk moves accelerated by a per-panel search field and a tri-state select-all header',
    'A multi-value form control bound with template-driven, reactive, or signal forms',
    'One-way assignment (items can leave the source but never come back) via the behavior config',
  ],
  whenNotToUse: [
    {
      instead: 'select',
      because: 'the option list is short and an overlay listbox with chips is enough — a full dual list is overkill',
    },
    {
      instead: 'tags-input',
      because: 'the user types free-form values rather than picking from a fixed catalogue',
    },
    {
      instead: 'checkbox',
      because: 'there are only a handful of options and a simple checkbox group reads clearer',
    },
  ],
  related: ['select', 'tags-input', 'checkbox', 'form-field', 'combobox'],
  aliases: [
    'dual listbox',
    'dual list',
    'shuttle',
    'pick list',
    'picklist',
    'multi select',
    'move items',
    'assign',
    'two panel selector',
    'side by side list',
  ],
} satisfies ComponentMeta;
