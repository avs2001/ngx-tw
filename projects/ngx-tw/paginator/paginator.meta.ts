import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Navigates a large dataset one page at a time, as either a compact prev/next control or a full numbered page strip with ellipsis collapsing.',
  whenToUse: [
    'Paging through the rows of a table, list, or card grid — typically mounted directly below it',
    'Server-side paging where the (paginated) event supplies the exact slice: page, pageSize, start, end, and the previous values',
    'Letting the user change how many rows are shown, via the built-in page-size selector',
    'Narrow containers that must degrade from the numbered strip to compact visuals automatically (container queries, no JS)',
    'SSR or crawler-friendly pagination where each page must be a real anchor, via linkFactory',
    'Localized pagination — every label is overridable through the labels input with token substitution',
  ],
  whenNotToUse: [
    {
      instead: 'breadcrumbs',
      because: 'the navigation is a hierarchy of ancestors rather than a flat numbered sequence',
    },
    {
      instead: 'progress-bar',
      because: 'the goal is only to display how far along a process is, with nothing to navigate',
    },
  ],
  related: ['table', 'select', 'button', 'skeleton', 'sort'],
  aliases: [
    'pagination',
    'pager',
    'page navigation',
    'page numbers',
    'next previous',
    'page size',
    'rows per page',
    'per page',
    'load pages',
  ],
} satisfies ComponentMeta;
