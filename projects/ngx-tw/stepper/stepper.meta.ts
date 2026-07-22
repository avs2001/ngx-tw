import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Guides a user through an ordered sequence of steps — a wizard, an onboarding flow, a multi-page checkout — built on Angular CDK CdkStepper.',
  whenToUse: [
    'A long form split across several screens the user completes in order',
    'Linear flows that must block advancing until the current step validates, via a per-step stepControl (reactive, template-driven, or signal forms)',
    'Checkout, onboarding, or setup wizards that need a visible "step n of total" indicator',
    'Flows with optional or non-editable steps, or steps that must surface an error state to screen readers',
    'Vertical step lists with stacked panels on narrow layouts, horizontal strips on wide ones',
  ],
  whenNotToUse: [
    {
      instead: 'tabs',
      because: 'the views are parallel alternatives the user browses freely, not a sequence with order',
    },
    {
      instead: 'progress-bar',
      because: 'progress is continuous and there are no discrete, navigable steps to select',
    },
    {
      instead: 'timeline',
      because: 'the steps are a read-only record of past events rather than a flow being completed',
    },
  ],
  related: ['tabs', 'progress-bar', 'form-field', 'input', 'button', 'timeline'],
  aliases: [
    'wizard',
    'multi-step form',
    'step indicator',
    'progress steps',
    'onboarding flow',
    'checkout flow',
    'guided flow',
    'step by step',
  ],
} satisfies ComponentMeta;
