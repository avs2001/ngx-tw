import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Thin horizontal or vertical rule that marks content as distinct but related, optionally carrying a centered label between two lines.',
  whenToUse: [
    'Splitting stacked sections of a settings page or form so the groups read as separate',
    'A vertical rule between inline items such as a toolbar, a byline, or a row of actions',
    'A labelled divider such as "OR" between a credentials form and social sign-in buttons',
    'Marking a semantic boundary that assistive technology should hear, via role="separator" with aria-orientation',
    'A purely visual rule that should be skipped by screen readers, via the decorative input',
  ],
  whenNotToUse: [
    {
      instead: 'card',
      because: 'the sections are header/body/footer of a card, which already draws its own dividers',
    },
    {
      instead: 'menu',
      because: 'the rule sits between groups of menu entries, where the menu emits its own separator items',
    },
    {
      instead: 'tabs',
      because: 'each side of the divide is a whole screen of content that should be shown one at a time',
    },
    {
      instead: 'split',
      because: 'the divider must be draggable so the user controls the size of the regions on either side',
    },
  ],
  related: ['card', 'menu', 'tabs', 'split', 'item'],
  aliases: ['divider', 'hr', 'rule', 'horizontal rule', 'line', 'spacer', 'divider with label'],
} satisfies ComponentMeta;
