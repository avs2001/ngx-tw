import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Attribute directive applied to a native <button> or <a> element — there is no wrapper component — giving it variant, color, size, loading, and icon styling while the native element keeps its role and keyboard behavior.',
  whenToUse: [
    'Any clickable action in a form, dialog, toolbar, or card footer: write <button twButton>Save</button>',
    'A link that should look like a button: put twButton on the <a>, so routing and middle-click still work',
    'A submit control that must show progress and block re-entry, via the loading state and aria-busy',
    'Ranking actions on a surface by weight — solid for the primary action, outline or ghost for secondary, link for tertiary',
    'A destructive confirm button, using the error color',
    'Leading or trailing icons alongside the label, via twButtonIcon, or an icon-only button with an aria-label',
  ],
  whenNotToUse: [
    {
      instead: 'menu',
      because: 'the control opens a list of actions rather than performing one',
    },
    {
      instead: 'segmented-control',
      because: 'the buttons represent mutually exclusive states the user selects between, not one-shot actions',
    },
    {
      instead: 'switch',
      because: 'the control toggles a persistent setting on or off rather than firing an action',
    },
  ],
  related: ['icon', 'spinner', 'menu', 'segmented-control', 'tooltip', 'dialog'],
  aliases: [
    'cta',
    'action',
    'submit',
    'link button',
    'icon button',
    'primary button',
    'danger button',
    'loading button',
    'twButton',
  ],
} satisfies ComponentMeta;
