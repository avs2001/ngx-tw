import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Modal surface opened from a service and anchored to the viewport centre, with focus trapping, scroll blocking, and the WAI-ARIA dialog contract inherited from CDK Dialog.',
  whenToUse: [
    'A decision the user must resolve before continuing — confirm, discard, destructive delete',
    'A focused form that would derail the page if rendered inline',
    'Content that should trap focus and mark the rest of the page inert',
    'A flow opened imperatively from a service call rather than from markup',
  ],
  whenNotToUse: [
    { instead: 'sheet', because: 'the surface should slide in from an edge and is closer to a side panel' },
    { instead: 'popover', because: 'the panel belongs anchored to its trigger and should not block the page' },
    { instead: 'toast', because: 'the message is a transient notification that needs no acknowledgement' },
    { instead: 'alert', because: 'the message can sit inline in the page rather than interrupting the user' },
  ],
  related: ['sheet', 'popover', 'toast', 'alert', 'button'],
  aliases: ['modal', 'confirm', 'prompt', 'lightbox', 'overlay window'],
} satisfies ComponentMeta;
