import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Coordinates a set of stacked disclosure panels under one managed open state, allowing either a single open panel at a time or several at once.',
  whenToUse: [
    'An FAQ or help section where opening one answer should close the previous one (single mode)',
    'A settings or filter sidebar where the user may keep several sections expanded at once (multiple mode)',
    'The open panel must be readable and writable from the parent via two-way [(value)] — a string in single mode, string[] in multiple',
    'A vertically stacked, always-visible set of headings the user expands in place, with arrow/Home/End roving focus across triggers',
    'Single mode where one panel must always stay open, via [collapsible]="false"',
  ],
  whenNotToUse: [
    {
      instead: 'collapsible',
      because:
        'there is only one section to disclose, or the sections are independent and need no shared open state or container styling',
    },
    {
      instead: 'tabs',
      because:
        'the sections are mutually exclusive and the user expects a horizontal trigger strip above a single panel region',
    },
    {
      instead: 'tree',
      because: 'the data nests to arbitrary depth rather than being one flat level of panels',
    },
  ],
  related: ['collapsible', 'tabs', 'tree', 'item', 'icon'],
  aliases: [
    'faq',
    'expandable panels',
    'disclosure group',
    'expander list',
    'collapsible list',
    'expand collapse sections',
    'toggle panels',
  ],
} satisfies ComponentMeta;
