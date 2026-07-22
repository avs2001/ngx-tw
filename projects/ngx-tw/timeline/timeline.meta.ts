import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Presentational chronological sequence — events laid out along a single vertical or horizontal axis, each pairing a dot or circle marker with content and connected by a line running through the markers.',
  whenToUse: [
    'A history the user reads rather than navigates: audit logs, activity feeds, comment threads, changelogs',
    'Process progress that is reported, not driven — order tracking, build pipelines, deployment stages',
    'Marking where a sequence currently stands with `aria-current="step"` and per-item reached / pending / current / error states',
    'Alternating or split layouts where dates sit opposite the event body',
    'Feeds whose markers carry an avatar or an icon rather than a plain dot',
  ],
  whenNotToUse: [
    {
      instead: 'stepper',
      because: 'the user actually navigates through the steps and each step owns a panel or form section',
    },
    {
      instead: 'item',
      because: 'the rows need no chronological axis or connector line and are just a list of compositions',
    },
  ],
  related: ['stepper', 'item', 'avatar', 'icon', 'badge'],
  aliases: [
    'activity feed',
    'history',
    'changelog',
    'audit log',
    'event log',
    'chronology',
    'feed',
    'milestones',
    'progress trail',
    'vertical steps',
  ],
} satisfies ComponentMeta;
