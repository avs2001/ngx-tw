import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Compact visual identity for a user or entity, cascading automatically from an image to initials to a projected or default silhouette fallback.',
  whenToUse: [
    'Member lists, comment threads, assignee cells, and profile summaries where a portrait identifies the person',
    'Identity display where the photo URL may be missing or fail to load and initials should take over',
    'Showing presence with an online / busy / away / offline status dot positioned to match the shape',
    'Stacking several participants with overlap and a "+N" overflow indicator via `tw-avatar-group`',
    'The leading slot of a list row or the marker of a timeline event',
  ],
  related: ['badge', 'icon', 'card', 'item', 'timeline'],
  aliases: [
    'profile picture',
    'profile photo',
    'user picture',
    'initials',
    'gravatar',
    'user image',
    'monogram',
    'presence',
    'avatar group',
    'face pile',
  ],
} satisfies ComponentMeta;
