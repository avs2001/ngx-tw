import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Zero-data layout that fills the space where records normally live — a centered icon, heading, description, and optional action buttons for an empty inbox, a search with no matches, or a list before its first record exists.',
  whenToUse: [
    'A request succeeded but returned zero rows, and the region would otherwise render blank',
    'Onboarding a brand-new list with a call to action ("Create your first project") projected as buttons',
    'A search or filter that matched nothing, offering a "Clear filters" action',
    'Inside a table\'s no-results row, using the compact `inline` variant in a colspan\'d cell',
    'A heading that must participate in the document outline, via the `titleLevel` input',
  ],
  whenNotToUse: [
    {
      instead: 'skeleton',
      because: 'data is still loading and the response has not yet confirmed there is nothing to show',
    },
    {
      instead: 'alert',
      because: 'the message is an error or a transient notice that needs color emphasis and a live region',
    },
  ],
  related: ['skeleton', 'alert', 'card', 'table', 'button', 'icon'],
  aliases: [
    'no results',
    'no data',
    'zero state',
    'blank slate',
    'blank state',
    'nothing here',
    'placeholder',
    'empty list',
    'first run',
    'no records',
  ],
} satisfies ComponentMeta;
