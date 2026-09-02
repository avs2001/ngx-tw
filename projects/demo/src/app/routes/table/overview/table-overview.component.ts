import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnComponent, TableComponent, CellDefDirective } from '@cdevhub/ngx-tw/table';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

interface TeamMember {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly role: 'Admin' | 'Editor' | 'Viewer';
}

const TEAM: readonly TeamMember[] = [
  { id: 1, name: 'Ada Lovelace',     email: 'ada@acme.com',     role: 'Admin' },
  { id: 2, name: 'Grace Hopper',     email: 'grace@acme.com',   role: 'Editor' },
  { id: 3, name: 'Alan Turing',      email: 'alan@acme.com',    role: 'Viewer' },
  { id: 4, name: 'Margaret Hamilton', email: 'margaret@acme.com', role: 'Admin' },
];

@Component({
  selector: 'app-table-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableComponent, ColumnComponent, CellDefDirective, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Table is the primary surface for displaying rows of structured data. It wraps Angular
        CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkTable</code>
        — inheriting its data-source pipeline, sticky positioning, and row diffing — while adding
        a Tailwind-native variant system, semantic empty / loading / error states, row expansion,
        responsive stacking, and slot-based chrome for toolbar, footer, and pagination. Columns
        are declared as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-column&gt;</code>
        siblings; cell content is projected through typed
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twCellDef</code>
        templates that carry the row type through to your markup.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The component renders a native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;table&gt;</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;thead&gt;</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tbody&gt;</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tfoot&gt;</code>
        — assistive tech reads it as a table without extra ARIA plumbing. Provide either a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="caption"]</code>
        element (rendered as a native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;caption&gt;</code>)
        or an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        on the table; dev mode warns when neither is set. Row-count changes, loading transitions,
        and user selection are announced through CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Behavior</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Native table</td>
              <td class="px-4 py-2 text-fg-muted">Renders <code class="font-mono">&lt;table&gt;</code> / <code class="font-mono">&lt;thead&gt;</code> / <code class="font-mono">&lt;tbody&gt;</code> / <code class="font-mono">&lt;tfoot&gt;</code>; every header cell gets <code class="font-mono">scope="col"</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Accessible name</td>
              <td class="px-4 py-2 text-fg-muted">Provide <code class="font-mono">[slot="caption"]</code>, <code class="font-mono">aria-label</code>, or <code class="font-mono">aria-labelledby</code>; dev mode warns when absent.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">LiveAnnouncer</td>
              <td class="px-4 py-2 text-fg-muted">Announces row-count updates, loading transitions, and user-driven selection changes with configurable strings.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Row click</td>
              <td class="px-4 py-2 text-fg-muted"><code class="font-mono">(rowClicked)</code> is suppressed when the click originated inside an interactive descendant (button, link, input). Set <code class="font-mono">[clickableRows]="true"</code> alongside it so rows are reachable by keyboard: each row enters the tab order, Enter / Space activate it, and it gets a focus ring. Without the flag, row activation is pointer-only — which is what keeps a static table out of the tab order.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Row expansion</td>
              <td class="px-4 py-2 text-fg-muted">Expand toggles carry <code class="font-mono">aria-expanded</code> and localized labels via the <code class="font-mono">labels</code> input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Selection</td>
              <td class="px-4 py-2 text-fg-muted">When <code class="font-mono">selection.enabled</code> is true, rows carry <code class="font-mono">aria-selected</code> and a master tri-state checkbox announces <code class="font-mono">aria-checked="mixed"</code> on partial selection.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Sortable headers</td>
              <td class="px-4 py-2 text-fg-muted">Wrapping the table in <code class="font-mono">[twSort]</code> automatically projects <code class="font-mono">aria-sort</code> onto the active column's <code class="font-mono">&lt;th&gt;</code>; explicit <code class="font-mono">sortState</code> input overrides per column.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Reduced motion</td>
              <td class="px-4 py-2 text-fg-muted">Row hover, loading, and expansion transitions respect <code class="font-mono">prefers-reduced-motion</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-table [data]="team()" aria-label="Team members">
          <tw-column name="id" headerLabel="ID" [display]="{ numeric: true, width: '80px' }">
            <ng-template twCellDef let-row>{{ asMember(row).id }}</ng-template>
          </tw-column>
          <tw-column name="name" headerLabel="Name">
            <ng-template twCellDef let-row>{{ asMember(row).name }}</ng-template>
          </tw-column>
          <tw-column name="email" headerLabel="Email">
            <ng-template twCellDef let-row>{{ asMember(row).email }}</ng-template>
          </tw-column>
          <tw-column name="role" headerLabel="Role">
            <ng-template twCellDef let-row>{{ asMember(row).role }}</ng-template>
          </tw-column>
        </tw-table>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>3 visual variants: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">default</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">striped</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bordered</code></li>
        <li>2 densities (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">comfortable</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">compact</code>) × 5 font sizes</li>
        <li>Generic over <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">T</code> — fully typed cell / header / footer / expansion contexts</li>
        <li>CDK data sources: plain array, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Observable&lt;T[]&gt;</code>, or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DataSource&lt;T&gt;</code></li>
        <li>Sticky header, sticky footer, sticky start / end columns</li>
        <li>Internal scroll container via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sticky.scrollHeight</code></li>
        <li>3 responsive modes: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">scroll</code> (default), <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">stack</code> (card-per-row below a breakpoint), <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hide</code> (per-column <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display.hideBelow</code>)</li>
        <li>Loading / error / empty state overlays with projectable fallbacks</li>
        <li>Row expansion via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twRowExpansion</code> + <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(expandedRows)]</code></li>
        <li>Built-in selection column (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selection.enabled</code>) with a tri-state master checkbox and row-level <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-selected</code></li>
        <li>Automatic <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-sort</code> on column headers when wrapped with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSort]</code></li>
        <li>Slot-based chrome: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">caption</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">toolbar</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">footer</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pagination</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">empty</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loading</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code></li>
        <li>Row-click suppression inside interactive descendants (buttons, links, inputs)</li>
        <li>Composes with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSort]</code> for sortable headers and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-paginator&gt;</code> for pagination — no table-level glue code</li>
        <li>i18n-friendly <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labels</code> input for every user-facing string</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/paginator" class="text-primary-600 hover:underline">Paginator</a>
          — drop into <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="pagination"]</code> below the table.
        </li>
        <li>
          <a routerLink="/components/sort" class="text-primary-600 hover:underline">Sort</a>
          — apply <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSort]</code> on the table and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[tw-sort-header]</code> inside header cells.
        </li>
        <li>
          <a routerLink="/components/skeleton" class="text-primary-600 hover:underline">Skeleton</a>
          — project skeleton rows into <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="loading"]</code> for a non-overlay loading state.
        </li>
        <li>
          <a routerLink="/components/input" class="text-primary-600 hover:underline">Input</a>
          /
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — compose inside <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="toolbar"]</code> for filters and bulk actions.
        </li>
      </ul>
    </section>
  `,
})
export class TableOverview {
  protected readonly team = signal<readonly TeamMember[]>(TEAM);

  protected asMember(row: unknown): TeamMember {
    return row as TeamMember;
  }

  protected readonly basicUsageSnippet = `<tw-table [data]="team" aria-label="Team members">
  <tw-column name="id" headerLabel="ID" [display]="{ numeric: true, width: '80px' }">
    <ng-template twCellDef let-row>{{ row.id }}</ng-template>
  </tw-column>
  <tw-column name="name" headerLabel="Name">
    <ng-template twCellDef let-row>{{ row.name }}</ng-template>
  </tw-column>
  <tw-column name="email" headerLabel="Email">
    <ng-template twCellDef let-row>{{ row.email }}</ng-template>
  </tw-column>
  <tw-column name="role" headerLabel="Role">
    <ng-template twCellDef let-row>{{ row.role }}</ng-template>
  </tw-column>
</tw-table>`;

  protected readonly importSnippet = `import {
  TableComponent,
  ColumnComponent,
  CellDefDirective,
  HeaderCellDefDirective,
  FooterCellDefDirective,
  NoDataRowDirective,
  RowExpansionDirective,
} from '@cdevhub/ngx-tw/table';`;
}
