import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Short floating label shown on hover, focus, or long-press that supplements an element with a non-interactive hint.',
  whenToUse: [
    'Naming an icon-only button or a truncated/abbreviated label',
    'Surfacing a keyboard shortcut or a one-line explanation of a control',
    'Adding supplemental detail that must never take focus or hold a link',
    'Any element that needs an `aria-describedby` hint wired for assistive tech',
  ],
  whenNotToUse: [
    { instead: 'popover', because: 'the floating content contains links, buttons, or a form the user must interact with' },
    { instead: 'menu', because: 'the floating content is a list of actions triggered from a button' },
    { instead: 'dialog', because: 'the content demands a decision and should block the rest of the page' },
    { instead: 'alert', because: 'the message is page state the user should be able to re-read without hovering' },
  ],
  related: ['popover', 'menu', 'dialog', 'button', 'icon'],
  aliases: ['hint', 'title', 'hover text', 'tip', 'label overlay', 'infotip', 'describedby'],
} satisfies ComponentMeta;
