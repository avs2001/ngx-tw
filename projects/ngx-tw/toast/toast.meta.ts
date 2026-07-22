import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Transient, non-modal notification opened from a service and stacked in a screen corner, with auto-dismiss, swipe-to-dismiss, and live-region announcements.',
  whenToUse: [
    'Confirming the result of an async action — saved, copied, deleted, upload finished',
    'Global feedback that belongs to the app rather than to one region of the page',
    'Several messages that need to stack and expire on their own over time',
    'Loading → success / error state for a promise, via the `promise()` helper',
    'A short undo or retry affordance attached to the notification as an action button',
  ],
  whenNotToUse: [
    { instead: 'alert', because: 'the message is anchored to a page region, must persist, and the user should be able to re-read it' },
    { instead: 'dialog', because: 'the feedback must block the page until the user acknowledges or decides' },
    { instead: 'form-field', because: 'the feedback is validation tied to one specific form field' },
  ],
  related: ['alert', 'dialog', 'form-field', 'button', 'progress-bar'],
  aliases: ['snackbar', 'notification', 'flash message', 'growl', 'popup message', 'notify', 'banner notification'],
} satisfies ComponentMeta;
