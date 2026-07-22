import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Disclosure widget that toggles one section of content open and closed, standing alone or composed into a group of siblings.',
  whenToUse: [
    'A single standalone "show more / show less" section — advanced options, a details region, an inline expander',
    'A trigger you author yourself: apply twCollapsibleTrigger to a native <button> and get aria-expanded, aria-controls, and focus wiring for free',
    'Content that must keep its component state across toggles instead of being destroyed, via keepAlive',
    'Coordinating siblings by hand with tw-collapsible-group — accordion behavior (one open) or independent (any number open)',
    'Replacing the default chevron with a custom indicator via [twCollapsibleIcon]',
  ],
  whenNotToUse: [
    {
      instead: 'accordion',
      because:
        'several panels form one managed set that needs a shared open value, container variants, and heading conventions out of the box',
    },
    {
      instead: 'tabs',
      because:
        'the sections are mutually exclusive and the user expects horizontal navigation rather than vertical disclosure',
    },
    {
      instead: 'dialog',
      because: 'the content should interrupt the page rather than expand inline beneath the trigger',
    },
    {
      instead: 'popover',
      because: 'the extra content belongs in a floating layer anchored to the trigger, not in document flow',
    },
  ],
  related: ['accordion', 'tabs', 'dialog', 'popover', 'card'],
  aliases: [
    'disclosure',
    'expander',
    'show more',
    'details summary',
    'toggle section',
    'expand collapse',
    'reveal',
    'foldable',
  ],
} satisfies ComponentMeta;
