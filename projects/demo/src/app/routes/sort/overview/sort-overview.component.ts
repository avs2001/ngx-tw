import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  SortDirective,
  SortHeaderComponent,
  type SortDirection,
  type TwSortEvent,
} from '@cdevhub/ngx-tw/sort';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

interface Row {
  id: number;
  name: string;
  role: string;
  age: number;
}

const ROWS: readonly Row[] = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer', age: 34 },
  { id: 2, name: 'Grace Hopper', role: 'Architect', age: 85 },
  { id: 3, name: 'Linus Torvalds', role: 'Kernel Lead', age: 52 },
  { id: 4, name: 'Margaret Hamilton', role: 'Director', age: 41 },
  { id: 5, name: 'Barbara Liskov', role: 'Researcher', age: 65 },
];

@Component({
  selector: 'app-sort-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SortDirective, SortHeaderComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Sort is a composable primitive, not a table. A parent
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSort]</code>
        directive holds the active column id and direction; child
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[tw-sort-header]</code>
        components make any element (a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;th&gt;</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;div&gt;</code>,
        or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;button&gt;</code>)
        a clickable sort trigger with a rotating arrow and correct
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-sort</code>
        semantics. The consumer owns the data sort — the directive just emits events.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Each header host exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-sort</code>
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'ascending' | 'descending' | 'none'</code>)
        so screen readers announce the current sort state. The inner container — not
        the host — takes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="button"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex="0"</code>,
        which avoids an NVDA bug where a focusable
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;th&gt;</code>
        breaks table keyboard navigation. CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">AriaDescriber</code>
        wires the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sortActionDescription</code>
        so assistive tech announces the sort action alongside the header text.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter</td>
              <td class="px-4 py-2 text-fg-muted">Cycles the active header through its direction sequence.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Space</td>
              <td class="px-4 py-2 text-fg-muted">Cycles the active header through its direction sequence.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the next or previous enabled header. Disabled headers are skipped.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <table class="w-full text-sm">
          <thead>
            <tr
              twSort
              [(twSortActive)]="active"
              [(twSortDirection)]="direction"
              (twSortChange)="onSort($event)"
              class="border-b border-border"
            >
              <th tw-sort-header id="name" class="text-left">Name</th>
              <th tw-sort-header id="role" class="text-left">Role</th>
              <th tw-sort-header id="age" class="text-left">Age</th>
            </tr>
          </thead>
          <tbody>
            @for (row of sortedRows(); track row.id) {
              <tr class="border-b border-border-muted last:border-b-0">
                <td class="px-3 py-2 text-fg">{{ row.name }}</td>
                <td class="px-3 py-2 text-fg-muted">{{ row.role }}</td>
                <td class="px-3 py-2 text-fg-muted tabular-nums">{{ row.age }}</td>
              </tr>
            }
          </tbody>
        </table>
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
        <li>Attribute-based directive and component — use on any element (table, list, grid, button group)</li>
        <li>Two-way bindable <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(twSortActive)]</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(twSortDirection)]</code> for URL sync or external state</li>
        <li>Full direction cycle: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">null → asc → desc → null</code> (clearable) or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">asc ⇄ desc</code> (with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disableClear</code>)</li>
        <li>Configurable start direction (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'asc'</code> or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'desc'</code>), directive-wide or per-header</li>
        <li>5 sizes (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>) and 8 semantic colors</li>
        <li>Arrow position: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'before'</code> or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'after'</code> the label</li>
        <li>Custom arrow icon via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSortHeaderIcon]</code> content projection</li>
        <li>Full ARIA: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-sort</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="button"</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">AriaDescriber</code>-backed sort description</li>
        <li>Keyboard activation via Enter and Space</li>
        <li>Per-header and directive-level <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code></li>
        <li>Dev-mode errors on missing parent directive or duplicate header ids</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/table" class="text-primary-600 hover:underline">Table</a>
          — the typical host for sort headers; compose the two to get a fully sortable data table.
        </li>
        <li>
          <a routerLink="/components/paginator" class="text-primary-600 hover:underline">Paginator</a>
          — pair with sort to let users page through large sorted result sets.
        </li>
      </ul>
    </section>
  `,
})
export class SortOverview {
  protected readonly active = signal<string | null>(null);
  protected readonly direction = signal<SortDirection>(null);
  protected readonly lastEvent = signal<TwSortEvent | null>(null);

  protected readonly sortedRows = computed<readonly Row[]>(() => {
    const key = this.active();
    const dir = this.direction();
    if (!key || !dir) return ROWS;
    const copy = [...ROWS];
    copy.sort((a, b) => {
      const av = a[key as keyof Row];
      const bv = b[key as keyof Row];
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  });

  protected onSort(event: TwSortEvent): void {
    this.lastEvent.set(event);
  }

  protected readonly basicUsageSnippet = `<tr twSort [(twSortActive)]="active" [(twSortDirection)]="direction">
  <th tw-sort-header id="name">Name</th>
  <th tw-sort-header id="role">Role</th>
  <th tw-sort-header id="age">Age</th>
</tr>`;

  protected readonly importSnippet = `import {
  SortDirective,
  SortHeaderComponent,
  type SortDirection,
  type TwSortEvent,
} from '@cdevhub/ngx-tw/sort';`;
}
