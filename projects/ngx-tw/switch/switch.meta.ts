import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Two-state toggle for a setting that takes effect the moment it is flipped, implementing the WAI-ARIA switch pattern.',
  whenToUse: [
    'Settings panels and preference rows — dark mode, notifications, auto-save',
    'A binary control whose change applies immediately rather than waiting for a form submit',
    'A toggle that needs on/off indicator icons projected into the track',
    'A labelled row where the label sits before or after the control and may carry a description line',
    'A state assistive tech should announce as a switch rather than a checkbox, via role="switch" and aria-checked',
  ],
  whenNotToUse: [
    {
      instead: 'checkbox',
      because: 'the value is a form-submission truth the user reviews before commit, such as accepting terms',
    },
    {
      instead: 'radio',
      because: 'the user is picking exactly one option from a small enumerated set rather than an on/off state',
    },
    {
      instead: 'segmented-control',
      because: 'there are more than two labelled states but they still belong on one control surface',
    },
  ],
  related: ['checkbox', 'radio', 'segmented-control', 'form-field', 'core'],
  aliases: [
    'toggle',
    'toggle switch',
    'on off',
    'on/off',
    'flip',
    'setting toggle',
    'boolean toggle',
    'ios switch',
  ],
} satisfies ComponentMeta;
