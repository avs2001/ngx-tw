import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Composable sorting primitive — not a widget: a container directive holds the active column id and direction while child header components turn any element into a clickable sort trigger with a rotating arrow and correct `aria-sort`; the consumer still sorts the data.',
  whenToUse: [
    'Making the header cells of a `tw-table` sortable — the canonical pairing',
    'Adding sortable headers to a hand-rolled list, card grid, or button group that is not a table',
    'Syncing sort state to the URL or to a server query via two-way `[(twSortActive)]` / `[(twSortDirection)]`',
    'Server-side or custom sorting, where you want the interaction and ARIA but own the ordering yourself',
    'A sort cycle that can return to unsorted (`null → asc → desc → null`) or one locked to `asc ⇄ desc`',
  ],
  related: ['table', 'paginator'],
  aliases: [
    'sortable',
    'sort header',
    'order by',
    'ordering',
    'ascending',
    'descending',
    'column sort',
    'aria-sort',
    'MatSort',
  ],
} satisfies ComponentMeta;
