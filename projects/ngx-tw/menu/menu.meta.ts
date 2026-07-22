import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'List of actions surfaced from a trigger, built on CDK Menu so the full WAI-ARIA menu keyboard and focus contract comes for free.',
  whenToUse: [
    'An overflow or "more actions" button on a row, card, or toolbar',
    'A grouped set of commands with separators, checkbox items, or radio items',
    'A context menu for a selected object',
    'Nested submenus of related commands',
  ],
  whenNotToUse: [
    { instead: 'select', because: 'the user is choosing a value for a form field rather than running an action' },
    { instead: 'combobox', because: 'the option list is long enough to need type-ahead filtering' },
    { instead: 'command-palette', because: 'the actions are global and reached by keyboard search rather than from an anchor' },
    { instead: 'popover', because: 'the panel holds arbitrary interactive content instead of a list of commands' },
  ],
  related: ['popover', 'select', 'command-palette', 'button', 'separator'],
  aliases: ['dropdown', 'context menu', 'actions', 'overflow menu', 'kebab menu', 'more menu'],
} satisfies ComponentMeta;
