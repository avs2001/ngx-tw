import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Horizontal bar visualising measurable task completion — continuous or segmented — implementing the WAI-ARIA progressbar pattern.',
  whenToUse: [
    'A file upload or download reporting bytes transferred',
    'A multi-step wizard showing how far through the flow the user is',
    'A quota, score, or skill level rendered as a proportion of a maximum',
    'A discrete step count better shown as segments than a continuous fill',
    'Long-running work with no percentage yet, using the indeterminate sweep',
  ],
  whenNotToUse: [
    { instead: 'spinner', because: 'the wait is open-ended and there is no bar worth filling' },
    { instead: 'skeleton', because: 'the point is to placeholder content that is being fetched, not to report completion' },
    { instead: 'stepper', because: 'the multi-step flow needs per-step labels, status, and navigation rather than a single fill' },
    { instead: 'slider', because: 'the user needs to set the value rather than read it' },
  ],
  related: ['spinner', 'skeleton', 'stepper', 'slider', 'file-upload'],
  aliases: ['progress', 'loading bar', 'meter', 'completion', 'percentage', 'determinate', 'linear progress', 'upload progress'],
} satisfies ComponentMeta;
