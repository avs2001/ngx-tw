import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Renders the look of a tab bar on top of real anchor elements, so page-level navigation between routed sections gets tab styling without owning any panel state.',
  whenToUse: [
    'A strip of sibling routes ("Overview", "Examples", "API") where the URL decides which one is active',
    'Driving the active state from routerLinkActive.isActive, a signal, or any custom history wrapper — the directive has no routerLink coupling',
    'Navigation targets that must remain real links: middle-click, open-in-new-tab, and copy-link all have to work',
    'A <nav> landmark strip whose active entry carries aria-current="page"',
    'Upgrading the same strip to the full tabs ARIA pattern by associating a <tw-tab-nav-panel>',
  ],
  whenNotToUse: [
    {
      instead: 'tabs',
      because:
        'the panels are owned by the component and swapped in place, with no route or URL change involved',
    },
    {
      instead: 'breadcrumbs',
      because:
        'the links ascend a hierarchy toward the current page rather than switching between siblings',
    },
    {
      instead: 'menu',
      because: 'there are too many navigation targets to fit in a horizontal strip',
    },
    {
      instead: 'segmented-control',
      because: 'the strip toggles a value in local state instead of navigating',
    },
  ],
  related: ['tabs', 'segmented-control', 'menu', 'breadcrumbs'],
  aliases: [
    'routed tabs',
    'router tabs',
    'nav tabs',
    'navigation tabs',
    'tab links',
    'page tabs',
    'section navigation',
    'link tabs',
  ],
} satisfies ComponentMeta;
