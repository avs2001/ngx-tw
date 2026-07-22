import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Horizontal trail of navigation hops ending in the current page, rendered as a <nav> landmark wrapping an ordered list.',
  whenToUse: [
    'Showing where the current page sits in a hierarchy and letting the user jump back to any ancestor',
    'Deep nested structures (file paths, catalog categories, admin sections) where the ancestry is not obvious from the page itself',
    'Long trails that must auto-collapse — set maxItems and the middle hops move into an ellipsis overflow menu',
    'Router-driven trails: project a *twBreadcrumbsItem template and bind your own routerLink on each anchor',
    'RTL layouts, where the default chevron separator flips automatically',
  ],
  whenNotToUse: [
    {
      instead: 'tab-nav',
      because: 'the links switch between sibling sections instead of ascending a hierarchy',
    },
    {
      instead: 'paginator',
      because: 'the navigation surface is a flat numbered sequence rather than a nested path',
    },
    {
      instead: 'stepper',
      because: 'the trail represents progress through a sequence the user is completing',
    },
  ],
  related: ['menu', 'tab-nav', 'paginator', 'icon'],
  aliases: [
    'breadcrumb',
    'crumbs',
    'trail',
    'navigation trail',
    'path',
    'hierarchy navigation',
    'ancestry',
    'you are here',
  ],
} satisfies ComponentMeta;
