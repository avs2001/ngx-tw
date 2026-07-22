import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Shared primitives entry point — the TwColor / TwSize / TwOrientation / TwBreakpoint variant types, the TW_ERROR_STATE_MATCHER policy token, and cross-component overlay, sort, and time helpers — renders no UI.',
  whenToUse: [
    'Typing a color, size, or orientation input on your own wrapper component so it accepts exactly the same values as the library (import type { TwColor, TwSize } from "@cdevhub/ngx-tw/core")',
    'Iterating over the eight semantic colors or the xs–xl size scale to build a demo, a theme picker, or a Storybook-style matrix',
    'Changing when form controls show their error state — provide TW_ERROR_STATE_MATCHER with a custom ErrorStateMatcher to show errors on submit only, or on dirty rather than touched',
    'Configuring range-picker behavior with Partial<RangeBehaviorConfig> (backward ranges, single-day ranges, partial-range persistence)',
    'Implementing a custom sort handle that the table sort header can discover, via TW_SORT_HANDLE',
    'Building a custom overlay-bearing control that should match library positioning, scroll-strategy, escape handling, and enter/leave timing',
    'Reusing the tab-trigger variant classes so a bespoke tab-like strip matches the built-in tabs',
  ],
  related: ['theme', 'form-field', 'input', 'checkbox', 'select', 'table', 'sort', 'time-picker', 'calendar'],
  aliases: [
    'types',
    'shared types',
    'TwColor',
    'TwSize',
    'TwOrientation',
    'TwBreakpoint',
    'error state matcher',
    'TW_ERROR_STATE_MATCHER',
    'variant types',
    'tokens',
    'primitives',
    'utilities',
    'validation display',
  ],
} satisfies ComponentMeta;
