import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Indeterminate activity indicator for work whose duration cannot be predicted, rendered as a circular arc, dots, or bars that inherit the surrounding text color.',
  whenToUse: [
    'A single point in the UI is pending — a button submitting, a field validating async',
    'The request has no measurable percentage to report',
    'An inline indicator must scale with the text around it and adopt its color',
    'A small region is refreshing and the surrounding layout already exists',
  ],
  whenNotToUse: [
    { instead: 'progress-bar', because: 'the completion percentage is known and should be shown as a filling bar' },
    { instead: 'skeleton', because: 'a whole region of content is loading and its final layout is known in advance' },
  ],
  related: ['progress-bar', 'skeleton', 'button', 'form-field', 'empty-state'],
  aliases: ['loader', 'loading', 'busy', 'throbber', 'activity indicator', 'progress circle', 'circular progress', 'pending'],
} satisfies ComponentMeta;
