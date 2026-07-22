import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Pulsing placeholder shape standing in for content that has not loaded yet, sized to the real thing so the layout does not jump when data arrives.',
  whenToUse: [
    'First paint of a list, table, or card grid whose row shape is known ahead of the data',
    'Preventing layout shift while a region of the page is fetched',
    'Mirroring a specific composition — avatar circle plus two text lines',
    'Several regions of a page loading independently, each showing its own placeholder',
  ],
  whenNotToUse: [
    { instead: 'spinner', because: 'a single point is pending and there is no content shape to stand in for' },
    { instead: 'progress-bar', because: 'the load reports a measurable percentage worth showing' },
    { instead: 'empty-state', because: 'the fetch finished and there is genuinely nothing to display' },
  ],
  related: ['spinner', 'progress-bar', 'empty-state', 'card', 'table', 'avatar'],
  aliases: ['placeholder', 'shimmer', 'ghost', 'loading placeholder', 'content loader', 'stub', 'pulse', 'wireframe'],
} satisfies ComponentMeta;
