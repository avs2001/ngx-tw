import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Purely presentational surface that groups related content behind a visual boundary, with directive-driven header, body, footer, and full-bleed media slots.',
  whenToUse: [
    'A block of related information needs its own surface, consistent padding, and a clear edge against the page',
    'Content splits into a title row, a body, and a metadata footer that should be divided automatically',
    'A cover image or media strip sits above or below the text, ordered wherever the consumer places it',
    'A dashboard or list of summary panels rendered as a grid of equally framed blocks',
    'Wrapping the whole surface in a native anchor or button to make one big clickable tile — the card itself stays non-interactive and adds no ARIA',
  ],
  whenNotToUse: [
    {
      instead: 'alert',
      because: 'the block is an informational or status message rather than a general content container',
    },
    {
      instead: 'dialog',
      because: 'the content must interrupt the user and float above the page as a modal surface',
    },
    {
      instead: 'collapsible',
      because: 'the grouped content needs to expand and collapse rather than always stay visible',
    },
    {
      instead: 'accordion',
      because: 'several such groups sit in a stack where only one should be open at a time',
    },
    {
      instead: 'item',
      because: 'each row needs its own focus ring, tab stop, and selection output rather than a framed surface',
    },
  ],
  related: ['alert', 'dialog', 'accordion', 'collapsible', 'item', 'flip-card', 'aspect-ratio', 'skeleton'],
  aliases: ['panel', 'tile', 'surface', 'container', 'box', 'content card', 'media card'],
} satisfies ComponentMeta;
