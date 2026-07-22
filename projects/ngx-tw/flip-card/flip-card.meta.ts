import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Two faces stacked in 3D that rotate between each other on click, hover, or programmatic control, keeping the hidden face out of the tab order.',
  whenToUse: [
    'A pricing tier or plan shows its name on the front and the included features on the back',
    'A team member photo on the front reveals a bio on the back',
    'A KPI summary flips to its breakdown without changing the size of the block',
    'Marketing copy on the front, product detail on the back, in a grid of equally sized tiles',
    'The reveal must not move surrounding layout — the second face occupies exactly the same footprint',
    'Driving the visible face from parent state with two-way [(flipped)] in manual mode',
  ],
  whenNotToUse: [
    {
      instead: 'collapsible',
      because: 'the hidden content should push the surrounding layout open rather than replace the surface',
    },
    {
      instead: 'popover',
      because: 'the extra content should float above the page instead of replacing what the user was looking at',
    },
    {
      instead: 'card',
      because: 'there is only one face and the surface never needs to reveal anything',
    },
    {
      instead: 'tooltip',
      because: 'the revealed content is a short hint on hover rather than a second panel of content',
    },
  ],
  related: ['card', 'collapsible', 'popover', 'tooltip', 'aspect-ratio'],
  aliases: ['flip', 'flipper', 'front and back', 'two-sided card', 'reveal card', '3d card', 'rotate card'],
} satisfies ComponentMeta;
