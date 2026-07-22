import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Layout-only row primitive composing four regions — leading, title, description, and trailing — into a horizontal row with a vertical text stack in the middle, at three densities and with an optional keyboard-activatable mode.',
  whenToUse: [
    'List rows built from an avatar or icon, a title, a supporting line, and a trailing action or badge',
    'Section and page headers, so heading rhythm matches the list rows below them',
    'Rows that must be clickable — `interactive` adds `role="button"`, tabindex, hover background, focus ring, and Enter/Space activation',
    'Marking the active settings tab, routed nav entry, or selected row with the `current` highlight and `aria-current`',
    'Keeping density and spacing consistent across page headers, list items, and table-cell compositions',
    'Row content projected inside another container — a timeline item, a card body, a menu-like list',
  ],
  whenNotToUse: [
    {
      instead: 'card',
      because: 'the composition needs its own enclosing surface with padding, border, or elevation',
    },
    {
      instead: 'table',
      because: 'the fields must align into labelled columns across every row',
    },
    {
      instead: 'menu',
      because: 'the rows are an overlay command list needing roving focus and menu ARIA roles',
    },
  ],
  related: ['card', 'avatar', 'badge', 'button', 'icon', 'separator'],
  aliases: [
    'list item',
    'list row',
    'row',
    'ListTile',
    'media object',
    'section header',
    'page header',
    'leading trailing',
    'title description',
    'list tile',
  ],
} satisfies ComponentMeta;
