import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Renders nested data as an accessible, keyboard-navigable hierarchy implementing the WAI-ARIA Tree pattern, built on Angular CDK CdkTree.',
  whenToUse: [
    'Arbitrarily deep nested data — file explorers, folder structures, category or org hierarchies, nested navigation',
    'Supplying nesting through a single childrenAccessor function instead of maintaining a flattened list yourself',
    'Fully custom row appearance via the *twTreeNode template, with a typed context exposing node, level, expanded, hasChildren, selectionState, and actions',
    'Checkbox-style multi-select over a hierarchy where selecting a branch cascades to its leaves and partially-selected branches report indeterminate',
    'Controlled expansion driven from the parent via two-way expandedKeys',
  ],
  whenNotToUse: [
    {
      instead: 'accordion',
      because: 'the content is one flat level of expand/collapse panels rather than a nested hierarchy',
    },
    {
      instead: 'table',
      because: 'the data is tabular with columns, and expansion only ever goes one row deep',
    },
    {
      instead: 'select',
      because: 'the user is picking from a flat option list in an overlay as a form value',
    },
    {
      instead: 'transfer',
      because: 'the task is moving items between two lists rather than exploring a hierarchy in place',
    },
  ],
  related: ['accordion', 'table', 'select', 'checkbox', 'transfer', 'icon'],
  aliases: [
    'tree view',
    'treeview',
    'hierarchy',
    'nested list',
    'file explorer',
    'folder tree',
    'node tree',
    'expandable hierarchy',
    'directory tree',
  ],
} satisfies ComponentMeta;
