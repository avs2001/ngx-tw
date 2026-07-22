import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Compact status label, count, or tag that turns any element into an annotation on nearby content.',
  whenToUse: [
    'Status on a table row or list item ("Active", "Pending", "Failed")',
    'Unread or item counts on a nav item or tab',
    'Categorical tags that may be dismissible',
    'A dot-only presence or unread indicator with no label, via [twBadgeDot]',
  ],
  whenNotToUse: [
    { instead: 'alert', because: 'the message needs a full-width, dismissible banner with its own body text' },
    { instead: 'stat', because: 'the number is the primary content of the block, not an annotation on something else' },
    { instead: 'tags-input', because: 'the user needs to add and remove the tags themselves as a form value' },
  ],
  related: ['alert', 'stat', 'tags-input', 'avatar', 'icon'],
  aliases: ['chip', 'pill', 'tag', 'label', 'counter', 'status', 'dot', 'indicator'],
} satisfies ComponentMeta;
