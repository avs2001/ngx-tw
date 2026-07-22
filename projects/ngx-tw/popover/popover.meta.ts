import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Floating panel anchored to a trigger element that holds rich, focusable content — a profile preview, a settings form, a confirmation prompt.',
  whenToUse: [
    'The panel contains form controls or buttons the user must interact with',
    'Content should stay open while the user works inside it',
    'A confirmation prompt anchored to the control that triggered it',
    'A contextual preview (user card, help text with a link) on hover or click',
  ],
  whenNotToUse: [
    { instead: 'tooltip', because: 'the content is a short non-interactive hint that never needs focus' },
    { instead: 'menu', because: 'the content is a list of actions driven by a trigger' },
    { instead: 'dialog', because: 'the interaction is modal and should block the rest of the page' },
    { instead: 'toast', because: 'the message is a global, transient status notification with no anchor' },
  ],
  related: ['tooltip', 'menu', 'dialog', 'sheet'],
  aliases: ['overlay', 'flyout', 'floating panel', 'dropdown panel', 'hovercard', 'popup'],
} satisfies ComponentMeta;
