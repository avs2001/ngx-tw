import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Groups related content into one region where only a single panel is visible at a time, implementing the WAI-ARIA Tabs pattern with roving tabindex.',
  whenToUse: [
    'Splitting one page section into parallel views the component itself owns and swaps ("Overview", "Features", "Specs")',
    'The selected panel is local UI state bound with [(value)], not something the URL should reflect',
    'Panel content is expensive and should only render once its tab is first selected, via [lazy]="true"',
    'User-closable tabs (editor-style) that emit a (closed) event',
    'A vertical tab strip beside its panels, or a scrollable strip with overflow navigation buttons',
  ],
  whenNotToUse: [
    {
      instead: 'tab-nav',
      because:
        'each tab is a route and the Angular Router — not the component — owns which content is shown',
    },
    {
      instead: 'accordion',
      because:
        'more than one section may be open at once, or the sections should stack vertically rather than sit behind a horizontal strip',
    },
    {
      instead: 'segmented-control',
      because: 'the control only picks a value from a small set and there is no panel content to switch',
    },
    {
      instead: 'stepper',
      because: 'the views are a sequence the user advances through, not parallel alternatives',
    },
  ],
  related: ['tab-nav', 'segmented-control', 'accordion', 'stepper', 'card'],
  aliases: [
    'tab bar',
    'tabbed panels',
    'tablist',
    'tab group',
    'tabview',
    'panel switcher',
    'tabpanel',
  ],
} satisfies ComponentMeta;
