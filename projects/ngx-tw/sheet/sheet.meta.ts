import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Modal panel opened from a service and docked to one of the four viewport edges, sliding in along the docking axis with focus trapping and the WAI-ARIA dialog contract.',
  whenToUse: [
    'A side panel for filters, details, or settings that should not lose the page behind it',
    'A long form or record editor that reads better in a tall edge-anchored column than a centred box',
    'A mobile-style bottom panel of actions or content pulled up from the bottom edge',
    'A navigation drawer slid in from the left or right on small screens',
    'Stacked panels — drilling from a list panel into a detail panel',
  ],
  whenNotToUse: [
    { instead: 'dialog', because: 'the surface should be centred in the viewport rather than docked to an edge' },
    { instead: 'popover', because: 'the panel belongs anchored to its trigger and should not block the page' },
    { instead: 'collapsible', because: 'the content can expand inline in the page instead of covering it' },
  ],
  related: ['dialog', 'popover', 'button', 'collapsible', 'split'],
  aliases: ['drawer', 'slide-over', 'side panel', 'off-canvas', 'panel', 'bottom sheet', 'flyout'],
} satisfies ComponentMeta;
