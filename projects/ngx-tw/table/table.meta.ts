import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Data table over Angular CDK `CdkTable` that renders a native `<table>` with typed cell templates, sticky regions, selection, row expansion, and semantic empty / loading / error states.',
  whenToUse: [
    'Displaying rows of structured records where each field belongs in its own labelled column',
    'A result set that needs sticky headers, sticky start/end columns, or an internal scroll container',
    'Rows the user can select (tri-state master checkbox) or expand into a detail panel',
    'A grid that must degrade on narrow screens — scroll, stack one card per row, or hide low-priority columns',
    'A data view whose loading, error, and no-results states should be handled by the component rather than hand-rolled',
    'Feeding rows from a plain array, an `Observable<T[]>`, or a CDK `DataSource<T>`',
  ],
  whenNotToUse: [
    {
      instead: 'item',
      because: 'each row is a title/description/avatar composition rather than a set of aligned columns',
    },
    {
      instead: 'tree',
      because: 'the records are hierarchical and the user expands parents to reveal nested children',
    },
    {
      instead: 'transfer',
      because: 'the point of the list is moving entries between an available set and a chosen set',
    },
  ],
  related: ['sort', 'paginator', 'skeleton', 'empty-state', 'checkbox', 'select', 'input'],
  aliases: [
    'grid',
    'datagrid',
    'data grid',
    'data table',
    'datatable',
    'rows',
    'columns',
    'spreadsheet',
    'list view',
    'tabular',
  ],
} satisfies ComponentMeta;
