import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Inline feedback banner anchored in the page flow, with an icon, title, body, and optional actions, announced through a politeness-driven live region.',
  whenToUse: [
    'A status banner at the top of a form summarising what went wrong',
    'A success confirmation that stays visible after a save',
    'A warning the user must be able to re-read at any time — expiring trial, quota nearly full',
    'A message with a call to action attached — upgrade, retry, update payment method',
    'An informational note explaining a section of the page',
  ],
  whenNotToUse: [
    { instead: 'toast', because: 'the feedback is transient, global, and several messages should stack and auto-dismiss' },
    { instead: 'dialog', because: 'the message must block the rest of the page until the user responds' },
    { instead: 'form-field', because: 'the feedback is validation for one specific field and belongs in its error region' },
    { instead: 'badge', because: 'the status is a tiny inline chip on another element, not a message with a body' },
    { instead: 'empty-state', because: 'the region has no data to show and needs a full placeholder rather than a message strip' },
  ],
  related: ['toast', 'dialog', 'form-field', 'badge', 'button', 'empty-state'],
  aliases: ['banner', 'callout', 'notice', 'message', 'inline message', 'flash', 'admonition', 'warning box', 'error message'],
} satisfies ComponentMeta;
