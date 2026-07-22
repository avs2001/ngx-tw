import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Resizable pane layout where the user drags or keyboard-adjusts the gutter between adjacent regions, following the WAI-ARIA window-splitter pattern.',
  whenToUse: [
    'An IDE-style shell where a file tree, an editor, and a terminal each need a user-controlled share of the viewport',
    'A list-and-detail layout where the reader wants a wider list or a wider detail pane',
    'A side-by-side editor and live preview whose ratio the user tunes',
    'Pane sizes must survive a reload, via the storageKey persistence input',
    'A sidebar that collapses to a narrow rail when dragged past a snap threshold, and reopens with Enter or Space on the gutter',
    'Sizes must be expressed in fixed pixels rather than percentages, or constrained by per-pane minSize/maxSize',
  ],
  whenNotToUse: [
    {
      instead: 'tabs',
      because: 'each region is a whole screen of distinct content that should be shown one at a time, not simultaneously',
    },
    {
      instead: 'collapsible',
      because: 'there is a single region to show or hide and no ratio for the user to control',
    },
    {
      instead: 'separator',
      because: 'the divider is purely visual and there is nothing to resize',
    },
    {
      instead: 'sheet',
      because: 'the secondary region is a temporary panel that slides in over the page rather than a permanent pane',
    },
  ],
  related: ['separator', 'tabs', 'collapsible', 'sheet', 'tree'],
  aliases: [
    'splitter',
    'resizable panes',
    'split pane',
    'split view',
    'resizable panels',
    'gutter',
    'drag to resize',
    'sidebar resize',
    'window splitter',
  ],
} satisfies ComponentMeta;
