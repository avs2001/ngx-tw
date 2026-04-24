import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  SortDirective,
  SortHeaderComponent,
  type SortDirection,
  type TwSortArrowPosition,
  type TwSortEvent,
} from 'ngx-tw/sort';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import { ButtonDirective } from 'ngx-tw/button';
import type { TwColor, TwSize } from 'ngx-tw/core';

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: 'pending' | 'paid' | 'refunded';
  created: string;
}

const ORDERS: readonly Order[] = [
  { id: 'ORD-1002', customer: 'Alice Chen', amount: 129.5, status: 'paid', created: '2026-03-18' },
  { id: 'ORD-1003', customer: 'Omar Nasser', amount: 47.0, status: 'pending', created: '2026-03-22' },
  { id: 'ORD-1004', customer: 'Sophie Müller', amount: 612.9, status: 'paid', created: '2026-03-28' },
  { id: 'ORD-1005', customer: 'Takumi Sato', amount: 18.25, status: 'refunded', created: '2026-04-02' },
  { id: 'ORD-1006', customer: 'Priya Desai', amount: 89.75, status: 'paid', created: '2026-04-10' },
  { id: 'ORD-1007', customer: 'Diego Ramírez', amount: 245.0, status: 'pending', created: '2026-04-14' },
];

const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const COLORS: TwColor[] = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'info',
  'success',
  'warning',
  'error',
];
const ARROW_POSITIONS: TwSortArrowPosition[] = ['after', 'before'];
const STARTS: ('asc' | 'desc')[] = ['asc', 'desc'];

function compareOrders(active: string | null, dir: SortDirection): (a: Order, b: Order) => number {
  if (!active || !dir) return () => 0;
  return (a, b) => {
    const av = a[active as keyof Order];
    const bv = b[active as keyof Order];
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  };
}

@Component({
  selector: 'app-sort-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SortDirective, SortHeaderComponent, CodeBlockComponent, ButtonDirective],
  template: `
    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the arrow when the header is active. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for standard data tables, semantic colors
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>)
        when the sorted column reflects a themed dimension, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for secondary views where the arrow should not draw attention.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (c of colors; track c) {
            <div twSort [twSortActive]="c" twSortDirection="asc">
              <span tw-sort-header [id]="c" [color]="c">{{ c }}</span>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls the header's padding, font size, and arrow icon size. Match the
        sort headers to neighbouring controls — use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        inside dense admin tables,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        for the standard data table density, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        for prominent list views on marketing or dashboard pages.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <div class="flex items-center gap-3">
              <span class="w-10 text-xs text-fg-muted font-mono">{{ s }}</span>
              <div twSort twSortActive="name" twSortDirection="asc" class="inline-flex gap-1">
                <span tw-sort-header id="name" [size]="s">Name</span>
                <span tw-sort-header id="age" [size]="s">Age</span>
                <span tw-sort-header id="role" [size]="s">Role</span>
              </div>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Arrow position -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Arrow Position</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">arrowPosition</code>
        input places the arrow after (default) or before the label. Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'before'</code>
        when the arrow should align with a leading icon column or when the label is
        numeric and the arrow is easier to scan on the left.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">after (default)</p>
            <div twSort twSortActive="label" twSortDirection="asc">
              <span tw-sort-header id="label" arrowPosition="after">Column label</span>
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">before</p>
            <div twSort twSortActive="label" twSortDirection="desc">
              <span tw-sort-header id="label" arrowPosition="before">Column label</span>
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="arrowPositionSnippet" language="html" />
    </section>

    <!-- Starting direction -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Starting Direction</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The first click on an inactive header uses the starting direction. Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twSortStart</code>
        on the container for the default direction across all headers, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">start</code>
        on a single header to override it. Numeric and date columns typically start
        at
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'desc'</code>
        so the largest or most recent value surfaces first.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div twSort twSortStart="asc" class="inline-flex gap-1">
          <span tw-sort-header id="name">Name (asc)</span>
          <span tw-sort-header id="amount" start="desc">Amount (desc)</span>
          <span tw-sort-header id="created" start="desc">Created (desc)</span>
        </div>
      </div>
      <tw-code-block [code]="startSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Click each header to see the starting direction take effect.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Amount</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Created</code>
        begin at
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'desc'</code>,
        while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Name</code>
        inherits the container default.
      </p>
    </section>

    <!-- Disable clear -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disable Clear (asc ⇄ desc)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        With
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSortDisableClear]="true"</code>,
        clicking an active header toggles between ascending and descending — it never
        returns to the unsorted state. Use this when the dataset must always be sorted
        on some column, for example a ranked leaderboard or a queue where "no sort"
        wouldn't make sense.
      </p>
      <div class="rounded-lg border border-border overflow-hidden bg-surface-raised mb-4">
        <table class="w-full text-sm">
          <thead>
            <tr
              twSort
              twSortActive="customer"
              twSortDirection="asc"
              [twSortDisableClear]="true"
              class="border-b border-border bg-surface-muted"
            >
              <th tw-sort-header id="customer" class="text-left">Customer</th>
              <th tw-sort-header id="amount" start="desc" class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            @for (row of firstFourOrders; track row.id) {
              <tr class="border-b border-border-muted last:border-b-0">
                <td class="px-3 py-2">{{ row.customer }}</td>
                <td class="px-3 py-2 text-right tabular-nums">\${{ row.amount.toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <tw-code-block [code]="disableClearSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Disabled headers ignore clicks and keyboard activation, drop
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="button"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex</code>,
        and expose
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled="true"</code>.
        Disable the entire directive with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSortDisabled]="true"</code>
        when the sort state is temporarily read-only (e.g. during a data refresh), or
        disable a single header with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]="true"</code>
        to lock a column that shouldn't be sorted.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Entire directive disabled</p>
            <div twSort [twSortDisabled]="true" class="inline-flex gap-1">
              <span tw-sort-header id="a">Name</span>
              <span tw-sort-header id="b">Age</span>
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Single header disabled</p>
            <div twSort class="inline-flex gap-1">
              <span tw-sort-header id="a">Name</span>
              <span tw-sort-header id="b" [disabled]="true">Age (locked)</span>
              <span tw-sort-header id="c">Role</span>
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Custom arrow icon -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Arrow Icon</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project content into the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSortHeaderIcon]</code>
        slot to replace the default chevron. The library still handles the rotation
        transition and opacity states — provide any SVG or glyph and keep the same
        direction semantics.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div twSort twSortActive="name" twSortDirection="asc" class="inline-flex gap-1">
          <span tw-sort-header id="name">
            Name
            <svg twSortHeaderIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-4">
              <path fill-rule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.66L7.3 7.7a.75.75 0 1 1-1.1-1.02l3.25-3.5a.75.75 0 0 1 1.1 0l3.25 3.5a.75.75 0 1 1-1.1 1.02l-1.95-2.04v10.59c0 .41-.34.75-.75.75Z" clip-rule="evenodd" />
            </svg>
          </span>
          <span tw-sort-header id="rating">
            Rating
            <svg twSortHeaderIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-4">
              <path d="M10 2.5l2.39 4.84 5.34.77-3.87 3.77.91 5.32L10 14.77l-4.77 2.51.91-5.32L2.27 8.11l5.34-.77L10 2.5z" />
            </svg>
          </span>
        </div>
      </div>
      <tw-code-block [code]="customIconSnippet" language="html" />
    </section>

    <!-- Composing with a table -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Composing with a Table</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The typical integration: place
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twSort</code>
        on the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tr&gt;</code>
        inside
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;thead&gt;</code>,
        then
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-sort-header</code>
        on each
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;th&gt;</code>.
        The directive emits the new active id and direction; the consumer owns the
        sort — derive a sorted view (a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">computed()</code>
        here) and render it as usual.
      </p>
      <div class="rounded-lg border border-border overflow-hidden bg-surface-raised mb-4">
        <table class="w-full text-sm">
          <thead>
            <tr
              twSort
              [(twSortActive)]="tableActive"
              [(twSortDirection)]="tableDirection"
              class="border-b border-border bg-surface-muted"
            >
              <th tw-sort-header id="id" class="text-left">Order</th>
              <th tw-sort-header id="customer" class="text-left">Customer</th>
              <th tw-sort-header id="amount" start="desc" class="text-right">Amount</th>
              <th tw-sort-header id="status" class="text-left">Status</th>
              <th tw-sort-header id="created" start="desc" class="text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            @for (row of tableRows(); track row.id) {
              <tr class="border-b border-border-muted last:border-b-0">
                <td class="px-3 py-2 font-mono text-xs">{{ row.id }}</td>
                <td class="px-3 py-2 text-fg">{{ row.customer }}</td>
                <td class="px-3 py-2 text-right tabular-nums">\${{ row.amount.toFixed(2) }}</td>
                <td class="px-3 py-2">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                    [class.bg-success-50]="row.status === 'paid'"
                    [class.text-success-800]="row.status === 'paid'"
                    [class.bg-warning-50]="row.status === 'pending'"
                    [class.text-warning-800]="row.status === 'pending'"
                    [class.bg-error-50]="row.status === 'refunded'"
                    [class.text-error-800]="row.status === 'refunded'"
                  >{{ row.status }}</span>
                </td>
                <td class="px-3 py-2 text-fg-muted">{{ row.created }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="tableTsSnippet" language="ts" />
        <tw-code-block [code]="tableHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Composing with a list -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Composing with a List</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The directive works on any container — not just
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tr&gt;</code>.
        Place
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twSort</code>
        on a flex row or toolbar and use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;button&gt;</code>
        headers for list views, kanban boards, or any grid that doesn't render as a
        table.
      </p>
      <div class="rounded-lg border border-border p-4 bg-surface-raised mb-4">
        <div
          twSort
          [(twSortActive)]="listActive"
          [(twSortDirection)]="listDirection"
          class="flex gap-2 mb-4"
        >
          <button tw-sort-header id="customer" type="button">Customer</button>
          <button tw-sort-header id="amount" start="desc" type="button">Amount</button>
          <button tw-sort-header id="created" start="desc" type="button">Created</button>
        </div>
        <ul class="divide-y divide-border-muted">
          @for (row of listRows(); track row.id) {
            <li class="flex items-center justify-between py-2 text-sm">
              <div class="flex flex-col min-w-0">
                <span class="font-medium text-fg">{{ row.customer }}</span>
                <span class="text-xs text-fg-muted font-mono">{{ row.id }}</span>
              </div>
              <div class="flex items-center gap-4 shrink-0">
                <span class="tabular-nums">\${{ row.amount.toFixed(2) }}</span>
                <span class="text-xs text-fg-muted">{{ row.created }}</span>
              </div>
            </li>
          }
        </ul>
      </div>
      <tw-code-block [code]="listSnippet" language="html" />
    </section>

    <!-- Sort change event -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sort Change Event</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Every user interaction emits a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwSortEvent</code>
        carrying the new
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">active</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">direction</code>,
        plus a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">previous</code>
        snapshot. Programmatic writes to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(twSortActive)]</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(twSortDirection)]</code>
        do not emit — this keeps URL-sync and external-state flows loop-free.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div
          twSort
          (twSortChange)="logEvent($event)"
          class="inline-flex gap-1 mb-4"
        >
          <span tw-sort-header id="name">Name</span>
          <span tw-sort-header id="created" start="desc">Created</span>
          <span tw-sort-header id="amount" start="desc">Amount</span>
        </div>
        @if (lastEvent(); as e) {
          <pre class="text-xs font-mono whitespace-pre text-fg-muted">{{ formatEvent(e) }}</pre>
        } @else {
          <p class="text-xs text-fg-subtle italic">Click a header to see the event payload.</p>
        }
      </div>
      <tw-code-block [code]="eventSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. A useful starting configuration:
        pair
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">start = 'desc'</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disableClear</code>
        to see the numeric-column behaviour, or flip
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">arrowPosition</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'before'</code>
        and shrink the size to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        to preview a compact toolbar sort control.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
            <div class="flex flex-wrap gap-1">
              @for (c of colors; track c) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playColor() === c"
                        [class.!text-primary-700]="playColor() === c"
                        (click)="playColor.set(c)">{{ c }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playSize() === s"
                        [class.!text-primary-700]="playSize() === s"
                        (click)="playSize.set(s)">{{ s }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Arrow position</label>
            <div class="flex gap-1">
              @for (p of arrowPositions; track p) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playArrowPosition() === p"
                        [class.!text-primary-700]="playArrowPosition() === p"
                        (click)="playArrowPosition.set(p)">{{ p }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Start</label>
            <div class="flex gap-1">
              @for (st of starts; track st) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playStart() === st"
                        [class.!text-primary-700]="playStart() === st"
                        (click)="playStart.set(st)">{{ st }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Features</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDisableClear()"
                      [class.!text-primary-700]="playDisableClear()"
                      (click)="playDisableClear.update(v => !v)">disableClear</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDisabled()"
                      [class.!text-primary-700]="playDisabled()"
                      (click)="playDisabled.update(v => !v)">disabled</button>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <div
            twSort
            [twSortStart]="playStart()"
            [twSortDisableClear]="playDisableClear()"
            [twSortDisabled]="playDisabled()"
            [(twSortActive)]="playActive"
            [(twSortDirection)]="playDirection"
            class="inline-flex gap-1"
          >
            <span tw-sort-header id="name" [color]="playColor()" [size]="playSize()" [arrowPosition]="playArrowPosition()">Name</span>
            <span tw-sort-header id="amount" [color]="playColor()" [size]="playSize()" [arrowPosition]="playArrowPosition()">Amount</span>
            <span tw-sort-header id="created" [color]="playColor()" [size]="playSize()" [arrowPosition]="playArrowPosition()">Created</span>
          </div>
          <p class="text-xs text-fg-muted mt-4 font-mono">
            active = {{ playActive() ?? 'null' }} · direction = {{ playDirection() ?? 'null' }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class SortExamples {
  protected readonly orders = ORDERS;
  protected readonly firstFourOrders = ORDERS.slice(0, 4);
  protected readonly sizes = SIZES;
  protected readonly colors = COLORS;
  protected readonly arrowPositions = ARROW_POSITIONS;
  protected readonly starts = STARTS;

  // ── Table example ──
  protected readonly tableActive = signal<string | null>(null);
  protected readonly tableDirection = signal<SortDirection>(null);
  protected readonly tableRows = computed<readonly Order[]>(() =>
    [...ORDERS].sort(compareOrders(this.tableActive(), this.tableDirection())),
  );

  // ── List example ──
  protected readonly listActive = signal<string | null>('created');
  protected readonly listDirection = signal<SortDirection>('desc');
  protected readonly listRows = computed<readonly Order[]>(() =>
    [...ORDERS].sort(compareOrders(this.listActive(), this.listDirection())),
  );

  // ── Event log ──
  protected readonly lastEvent = signal<TwSortEvent | null>(null);
  protected logEvent(event: TwSortEvent): void {
    this.lastEvent.set(event);
  }
  protected formatEvent(e: TwSortEvent): string {
    return JSON.stringify(e, null, 2);
  }

  // ── Playground ──
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playArrowPosition = signal<TwSortArrowPosition>('after');
  protected readonly playStart = signal<'asc' | 'desc'>('asc');
  protected readonly playDisableClear = signal(false);
  protected readonly playDisabled = signal(false);
  protected readonly playActive = signal<string | null>('name');
  protected readonly playDirection = signal<SortDirection>('asc');

  // ── Code snippets ──

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <div twSort [twSortActive]="c" twSortDirection="asc">
    <span tw-sort-header [id]="c" [color]="c">{{ c }}</span>
  </div>
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <div twSort twSortActive="name" twSortDirection="asc" class="inline-flex gap-1">
    <span tw-sort-header id="name" [size]="s">Name</span>
    <span tw-sort-header id="age" [size]="s">Age</span>
    <span tw-sort-header id="role" [size]="s">Role</span>
  </div>
}`.trim();

  protected readonly arrowPositionSnippet = `<!-- after (default) -->
<div twSort twSortActive="label" twSortDirection="asc">
  <span tw-sort-header id="label" arrowPosition="after">Column label</span>
</div>

<!-- before -->
<div twSort twSortActive="label" twSortDirection="desc">
  <span tw-sort-header id="label" arrowPosition="before">Column label</span>
</div>`;

  protected readonly startSnippet = `<div twSort twSortStart="asc">
  <span tw-sort-header id="name">Name (asc)</span>
  <span tw-sort-header id="amount" start="desc">Amount (desc)</span>
  <span tw-sort-header id="created" start="desc">Created (desc)</span>
</div>`;

  protected readonly disableClearSnippet = `<tr
  twSort
  twSortActive="customer"
  twSortDirection="asc"
  [twSortDisableClear]="true"
>
  <th tw-sort-header id="customer">Customer</th>
  <th tw-sort-header id="amount" start="desc">Amount</th>
</tr>`;

  protected readonly statesSnippet = `<!-- Entire directive disabled -->
<div twSort [twSortDisabled]="true">
  <span tw-sort-header id="a">Name</span>
  <span tw-sort-header id="b">Age</span>
</div>

<!-- Single header disabled -->
<div twSort>
  <span tw-sort-header id="a">Name</span>
  <span tw-sort-header id="b" [disabled]="true">Age (locked)</span>
  <span tw-sort-header id="c">Role</span>
</div>`;

  protected readonly customIconSnippet = `<div twSort twSortActive="name" twSortDirection="asc">
  <span tw-sort-header id="name">
    Name
    <svg twSortHeaderIcon viewBox="0 0 20 20" fill="currentColor" class="size-4">
      <path d="M10 17a.75.75 0 0 1-.75-.75V5.66L7.3 7.7a.75.75 0 …" />
    </svg>
  </span>
  <span tw-sort-header id="rating">
    Rating
    <svg twSortHeaderIcon viewBox="0 0 20 20" fill="currentColor" class="size-4">
      <path d="M10 2.5l2.39 4.84 5.34.77-3.87 3.77 .91 5.32L10 14.77 …" />
    </svg>
  </span>
</div>`;

  protected readonly tableTsSnippet = `interface Order { id: string; customer: string; amount: number; status: string; created: string; }

protected readonly active = signal<string | null>(null);
protected readonly direction = signal<SortDirection>(null);
protected readonly rows = computed<readonly Order[]>(() =>
  [...ORDERS].sort(compareOrders(this.active(), this.direction())),
);`;

  protected readonly tableHtmlSnippet = `<table>
  <thead>
    <tr twSort [(twSortActive)]="active" [(twSortDirection)]="direction">
      <th tw-sort-header id="id">Order</th>
      <th tw-sort-header id="customer">Customer</th>
      <th tw-sort-header id="amount" start="desc">Amount</th>
      <th tw-sort-header id="status">Status</th>
      <th tw-sort-header id="created" start="desc">Created</th>
    </tr>
  </thead>
  <tbody>
    @for (row of rows(); track row.id) {
      <tr>
        <td>{{ row.id }}</td>
        <td>{{ row.customer }}</td>
        <td>{{ row.amount }}</td>
        <td>{{ row.status }}</td>
        <td>{{ row.created }}</td>
      </tr>
    }
  </tbody>
</table>`;

  protected readonly listSnippet = `<div twSort [(twSortActive)]="active" [(twSortDirection)]="direction">
  <button tw-sort-header id="customer" type="button">Customer</button>
  <button tw-sort-header id="amount" start="desc" type="button">Amount</button>
  <button tw-sort-header id="created" start="desc" type="button">Created</button>
</div>
<ul>
  @for (row of rows(); track row.id) {
    <li>…</li>
  }
</ul>`;

  protected readonly eventSnippet = `<div twSort (twSortChange)="logEvent($event)">
  <span tw-sort-header id="name">Name</span>
  <span tw-sort-header id="created" start="desc">Created</span>
  <span tw-sort-header id="amount" start="desc">Amount</span>
</div>`;
}
