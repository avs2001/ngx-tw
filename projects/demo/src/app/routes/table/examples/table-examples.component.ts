import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  ColumnComponent,
  TableComponent,
  TwCellDefDirective,
  TwFooterCellDefDirective,
  TwHeaderCellDefDirective,
  TwNoDataRowDirective,
  TwRowExpansionDirective,
  type TwTableDensity,
  type TwTableResponsive,
  type TwTableVariant,
} from 'ngx-tw/table';
import { PaginatorComponent } from 'ngx-tw/paginator';
import {
  SortDirective,
  SortHeaderComponent,
  type SortDirection,
} from 'ngx-tw/sort';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwSize } from 'ngx-tw/core';

interface Order {
  readonly id: number;
  readonly customer: string;
  readonly total: number;
  readonly status: 'Pending' | 'Paid' | 'Shipped' | 'Cancelled';
  readonly updatedAt: string;
  readonly notes?: string;
}

const ORDERS: readonly Order[] = [
  { id: 1042, customer: 'Ada Lovelace',     total: 129.90,  status: 'Paid',      updatedAt: '2026-04-14', notes: '2 items; signature required on delivery.' },
  { id: 1043, customer: 'Grace Hopper',     total: 58.00,   status: 'Shipped',   updatedAt: '2026-04-15', notes: 'Expedited shipping.' },
  { id: 1044, customer: 'Alan Turing',      total: 842.25,  status: 'Pending',   updatedAt: '2026-04-15', notes: 'Awaiting payment confirmation.' },
  { id: 1045, customer: 'Linus Torvalds',   total: 14.99,   status: 'Paid',      updatedAt: '2026-04-16', notes: 'Digital delivery.' },
  { id: 1046, customer: 'Margaret Hamilton', total: 312.50,  status: 'Cancelled', updatedAt: '2026-04-16', notes: 'Customer cancelled.' },
  { id: 1047, customer: 'Dennis Ritchie',   total: 89.99,   status: 'Paid',      updatedAt: '2026-04-17', notes: 'Warranty: 1 year.' },
  { id: 1048, customer: 'Katherine Johnson', total: 1250.00, status: 'Shipped',   updatedAt: '2026-04-17', notes: 'Fragile; handle with care.' },
  { id: 1049, customer: 'Barbara Liskov',   total: 47.00,   status: 'Paid',      updatedAt: '2026-04-18' },
  { id: 1050, customer: 'Donald Knuth',     total: 520.00,  status: 'Pending',   updatedAt: '2026-04-19', notes: 'Pre-order item.' },
  { id: 1051, customer: 'Edsger Dijkstra',  total: 76.50,   status: 'Paid',      updatedAt: '2026-04-20' },
];

const STATUS_CLASSES: Record<Order['status'], string> = {
  Pending: 'bg-warning-50 text-warning-700 border border-warning-300',
  Paid: 'bg-success-50 text-success-700 border border-success-300',
  Shipped: 'bg-info-50 text-info-700 border border-info-300',
  Cancelled: 'bg-error-50 text-error-700 border border-error-300',
};

const VARIANTS: TwTableVariant[] = ['default', 'striped', 'bordered'];
const DENSITIES: TwTableDensity[] = ['comfortable', 'compact'];
const RESPONSIVE: TwTableResponsive[] = ['scroll', 'stack', 'hide'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

type StateMode = 'data' | 'loading' | 'empty' | 'error';
const STATE_MODES: readonly StateMode[] = ['data', 'loading', 'empty', 'error'];

@Component({
  selector: 'app-table-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableComponent,
    ColumnComponent,
    TwCellDefDirective,
    TwHeaderCellDefDirective,
    TwFooterCellDefDirective,
    TwNoDataRowDirective,
    TwRowExpansionDirective,
    PaginatorComponent,
    SortDirective,
    SortHeaderComponent,
    ButtonDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">default</code>
        gives plain row dividers for tables that sit inside their own card.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">striped</code>
        alternates row backgrounds — helpful for wide tables where tracking a row across many
        columns matters.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bordered</code>
        adds a full grid with a rounded outer border — the right choice for standalone tables
        that need their own visual container.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        @for (v of variants; track v) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
            <tw-table [data]="orders().slice(0, 4)" [variant]="v" [attr.aria-label]="'Orders — ' + v">
              <tw-column name="id" headerLabel="Order" [numeric]="true" width="90px">
                <ng-template twCellDef let-row>#{{ asOrder(row).id }}</ng-template>
              </tw-column>
              <tw-column name="customer" headerLabel="Customer">
                <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
              </tw-column>
              <tw-column name="status" headerLabel="Status">
                <ng-template twCellDef let-row>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                        [class]="statusClass(asOrder(row).status)">
                    {{ asOrder(row).status }}
                  </span>
                </ng-template>
              </tw-column>
              <tw-column name="total" headerLabel="Total" [numeric]="true">
                <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
              </tw-column>
            </tw-table>
          </div>
        }
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
    </section>

    <!-- Density -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Density</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Density controls vertical padding only — font size is independent. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">comfortable</code>
        (default) for browseable lists where rows deserve breathing room, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">compact</code>
        for data-dense admin panels where users need to scan many rows without scrolling. If you
        want a smaller typeface too, combine density with the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 grid gap-4 md:grid-cols-2">
        @for (d of densities; track d) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ d }}</p>
            <tw-table [data]="orders().slice(0, 3)" [density]="d" variant="bordered" [attr.aria-label]="'Density — ' + d">
              <tw-column name="id" headerLabel="ID" [numeric]="true">
                <ng-template twCellDef let-row>{{ asOrder(row).id }}</ng-template>
              </tw-column>
              <tw-column name="customer" headerLabel="Customer">
                <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
              </tw-column>
              <tw-column name="total" headerLabel="Total" [numeric]="true">
                <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
              </tw-column>
            </tw-table>
          </div>
        }
      </div>
      <tw-code-block [code]="densitySnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The table handles the three non-data states you always have to draw anyway.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loading</code>
        renders a spinner overlay and dims the body — keep the current rows visible so layout
        doesn't jump. Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        to anything non-null to swap the body for an error state (the value is coerced to a
        string for the fallback message). Empty rows trigger the empty overlay automatically.
        Override any of them with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="loading"]</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="error"]</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="empty"]</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-1 mb-4">
          @for (mode of stateModes; track mode) {
            <button
              twButton variant="ghost" color="neutral" size="xs"
              [class.!bg-primary-100]="stateMode() === mode"
              [class.!text-primary-700]="stateMode() === mode"
              (click)="stateMode.set(mode)"
            >{{ mode }}</button>
          }
        </div>
        <tw-table
          [data]="statesData()"
          [loading]="stateMode() === 'loading'"
          [error]="stateMode() === 'error' ? 'Failed to load orders' : null"
          variant="default"
          aria-label="State demo"
        >
          <tw-column name="id" headerLabel="ID" [numeric]="true" width="80px">
            <ng-template twCellDef let-row>#{{ asOrder(row).id }}</ng-template>
          </tw-column>
          <tw-column name="customer" headerLabel="Customer">
            <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
          </tw-column>
          <tw-column name="total" headerLabel="Total" [numeric]="true">
            <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
          </tw-column>
        </tw-table>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Sticky header & columns -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sticky Header &amp; Columns</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[stickyHeader]="true"</code>
        pins the header while the body scrolls — it only works if the table has an internal
        scroll region, so pair it with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">scrollHeight</code>.
        Columns pin to the leading or trailing edge via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sticky="start"</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sticky="end"</code>
        — the canonical pair is a sticky ID column on the left and a sticky actions column on the
        right. Scroll the preview below horizontally and vertically to test both axes.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-table
          [data]="orders()"
          [stickyHeader]="true"
          scrollHeight="280px"
          variant="bordered"
          aria-label="Orders — sticky demo"
        >
          <tw-column name="id" headerLabel="ID" [numeric]="true" sticky="start" width="80px">
            <ng-template twCellDef let-row>#{{ asOrder(row).id }}</ng-template>
          </tw-column>
          <tw-column name="customer" headerLabel="Customer">
            <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
          </tw-column>
          <tw-column name="status" headerLabel="Status">
            <ng-template twCellDef let-row>
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                    [class]="statusClass(asOrder(row).status)">
                {{ asOrder(row).status }}
              </span>
            </ng-template>
          </tw-column>
          <tw-column name="total" headerLabel="Total" [numeric]="true">
            <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
          </tw-column>
          <tw-column name="updatedAt" headerLabel="Updated">
            <ng-template twCellDef let-row>{{ asOrder(row).updatedAt }}</ng-template>
          </tw-column>
          <tw-column name="actions" headerLabel="" sticky="end" width="100px">
            <ng-template twCellDef>
              <button twButton variant="ghost" color="primary" size="xs">View</button>
            </ng-template>
          </tw-column>
        </tw-table>
      </div>
      <tw-code-block [code]="stickySnippet" language="html" />
    </section>

    <!-- Row expansion -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Row Expansion</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Row expansion reveals secondary detail without pushing the user to a separate page — useful
        for notes, timelines, or nested data that isn't worth a column of its own. Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[multiTemplateRows]="true"</code>
        on the table and project
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twRowExpansion</code>
        once. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(expandedRows)]</code>
        two-way model is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ReadonlySet&lt;T&gt;</code>
        — always set a new Set; never mutate it in place.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-table
          [data]="orders().slice(0, 5)"
          [multiTemplateRows]="true"
          [(expandedRows)]="expandedOrders"
          aria-label="Expandable orders"
        >
          <tw-column name="toggle" headerLabel="" width="44px">
            <ng-template twCellDef let-row>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [attr.aria-label]="isExpanded(asOrder(row)) ? 'Collapse row' : 'Expand row'"
                [attr.aria-expanded]="isExpanded(asOrder(row))"
                (click)="toggleExpanded(asOrder(row), $event)"
              >
                <svg class="size-4 transition-transform duration-200"
                     [class.rotate-90]="isExpanded(asOrder(row))"
                     viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
                </svg>
              </button>
            </ng-template>
          </tw-column>
          <tw-column name="id" headerLabel="Order" [numeric]="true" width="90px">
            <ng-template twCellDef let-row>#{{ asOrder(row).id }}</ng-template>
          </tw-column>
          <tw-column name="customer" headerLabel="Customer">
            <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
          </tw-column>
          <tw-column name="total" headerLabel="Total" [numeric]="true">
            <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
          </tw-column>
          <ng-template twRowExpansion let-row let-collapse="collapse">
            <div class="p-4 bg-surface-sunken">
              <p class="text-sm text-fg-muted">
                <span class="font-semibold text-fg">Notes:</span>
                {{ asOrder(row).notes || 'No notes for this order.' }}
              </p>
              <button twButton variant="outline" color="neutral" size="xs" class="mt-3" (click)="collapse()">
                Hide
              </button>
            </div>
          </ng-template>
        </tw-table>
      </div>
      <tw-code-block [code]="expansionSnippet" language="html" />
    </section>

    <!-- Footer row totals -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Footer Row Totals</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twFooterCellDef</code>
        on any column to opt into a footer row; once any column has a footer, the table renders
        one. The context exposes the current
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rows</code>
        snapshot — use it to compute totals, averages, or counts without maintaining that state
        elsewhere.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-table [data]="orders().slice(0, 5)" variant="bordered" aria-label="Totals demo">
          <tw-column name="id" headerLabel="ID" [numeric]="true" width="80px">
            <ng-template twCellDef let-row>{{ asOrder(row).id }}</ng-template>
            <ng-template twFooterCellDef>
              <span class="font-semibold text-fg-muted">Totals</span>
            </ng-template>
          </tw-column>
          <tw-column name="customer" headerLabel="Customer">
            <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
            <ng-template twFooterCellDef let-rows="rows">
              <span class="text-xs text-fg-muted">{{ rows.length }} orders</span>
            </ng-template>
          </tw-column>
          <tw-column name="total" headerLabel="Total" [numeric]="true">
            <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
            <ng-template twFooterCellDef let-rows="rows">
              <span class="font-semibold">\${{ sumTotal(rows).toFixed(2) }}</span>
            </ng-template>
          </tw-column>
        </tw-table>
      </div>
      <tw-code-block [code]="footerSnippet" language="html" />
    </section>

    <!-- Custom no-data row -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom No-Data Row</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The default empty state is a generic "No data" overlay. For any empty state worth
        designing — an inbox that says "You're all caught up", a search that says "No orders match
        your filters" — project
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twNoDataRow</code>
        as a full-width
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tr&gt;</code>
        inside the table. It takes precedence over the overlay.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-table [data]="emptyData" variant="bordered" aria-label="Empty orders">
          <tw-column name="id" headerLabel="ID" [numeric]="true">
            <ng-template twCellDef let-row>{{ asOrder(row).id }}</ng-template>
          </tw-column>
          <tw-column name="customer" headerLabel="Customer">
            <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
          </tw-column>
          <tw-column name="total" headerLabel="Total" [numeric]="true">
            <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
          </tw-column>
          <ng-template twNoDataRow>
            <tr>
              <td colspan="3" class="px-4 py-10 text-center">
                <div class="flex flex-col items-center gap-2">
                  <svg class="size-8 text-fg-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm text-fg-muted">All caught up — no orders to review.</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </tw-table>
      </div>
      <tw-code-block [code]="noDataSnippet" language="html" />
    </section>

    <!-- Custom header template -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Header Template</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For anything richer than a plain text header — icons, inline help, a sort caret — project
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twHeaderCellDef</code>
        instead of (or alongside)
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">headerLabel</code>.
        The context gives you the column name and index if you need them.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-table [data]="orders().slice(0, 3)" aria-label="Custom headers" variant="bordered">
          <tw-column name="id">
            <ng-template twHeaderCellDef>
              <span class="inline-flex items-center gap-1.5 text-fg">
                <svg class="size-3.5 text-fg-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd"/>
                </svg>
                Order ID
              </span>
            </ng-template>
            <ng-template twCellDef let-row>#{{ asOrder(row).id }}</ng-template>
          </tw-column>
          <tw-column name="customer" headerLabel="Customer">
            <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
          </tw-column>
          <tw-column name="total" headerLabel="Total" [numeric]="true">
            <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
          </tw-column>
        </tw-table>
      </div>
      <tw-code-block [code]="headerTemplateSnippet" language="html" />
    </section>

    <!-- Sortable columns -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sortable Columns</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Sorting composes with the
        <a routerLink="/components/sort" class="text-primary-600 hover:underline">Sort</a>
        primitives rather than living inside the table. Apply
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSort]</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-table&gt;</code>,
        wrap header labels in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[tw-sort-header]</code>,
        and drive
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(twSortActive)]</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(twSortDirection)]</code>
        from a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">computed()</code>
        that sorts the data. The table stays data-agnostic.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-table
          twSort
          [(twSortActive)]="sortActive"
          [(twSortDirection)]="sortDirection"
          [data]="sortedOrders().slice(0, 6)"
          variant="bordered"
          aria-label="Sortable orders"
        >
          <tw-column name="id" [numeric]="true" width="100px">
            <ng-template twHeaderCellDef>
              <span tw-sort-header id="id">Order</span>
            </ng-template>
            <ng-template twCellDef let-row>#{{ asOrder(row).id }}</ng-template>
          </tw-column>
          <tw-column name="customer">
            <ng-template twHeaderCellDef>
              <span tw-sort-header id="customer">Customer</span>
            </ng-template>
            <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
          </tw-column>
          <tw-column name="total" [numeric]="true">
            <ng-template twHeaderCellDef>
              <span tw-sort-header id="total" start="desc">Total</span>
            </ng-template>
            <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
          </tw-column>
          <tw-column name="updatedAt">
            <ng-template twHeaderCellDef>
              <span tw-sort-header id="updatedAt">Updated</span>
            </ng-template>
            <ng-template twCellDef let-row>{{ asOrder(row).updatedAt }}</ng-template>
          </tw-column>
        </tw-table>
        <p class="mt-3 text-xs text-fg-muted font-mono">
          active: {{ sortActive() ?? '—' }} · direction: {{ sortDirection() ?? '—' }}
        </p>
      </div>
      <tw-code-block [code]="sortTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="sortHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Responsive stack -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Responsive — Stack Below Breakpoint</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        On narrow viewports a horizontally-scrolling table often frustrates users. With
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">responsive="stack"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">stackBelow="md"</code>,
        each row becomes a card below the breakpoint and every cell gets a prefix label from the
        column's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">stackLabel</code>
        (or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">headerLabel</code>
        as a fallback). Resize the browser to see the transition.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-table
          [data]="orders().slice(0, 4)"
          responsive="stack"
          stackBelow="md"
          aria-label="Responsive orders"
        >
          <tw-column name="id" headerLabel="ID" stackLabel="Order" [numeric]="true">
            <ng-template twCellDef let-row>#{{ asOrder(row).id }}</ng-template>
          </tw-column>
          <tw-column name="customer" headerLabel="Customer" stackLabel="Customer">
            <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
          </tw-column>
          <tw-column name="status" headerLabel="Status" stackLabel="Status">
            <ng-template twCellDef let-row>
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                    [class]="statusClass(asOrder(row).status)">
                {{ asOrder(row).status }}
              </span>
            </ng-template>
          </tw-column>
          <tw-column name="total" headerLabel="Total" stackLabel="Total" [numeric]="true">
            <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
          </tw-column>
        </tw-table>
      </div>
      <tw-code-block [code]="responsiveSnippet" language="html" />
    </section>

    <!-- Admin pattern -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Admin Pattern — Toolbar, Sort &amp; Pagination</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The recipe most data-heavy pages end up using. A bordered table with sticky header, a
        search input in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="toolbar"]</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSort]</code>
        driving sort, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-paginator slot="pagination"&gt;</code>
        anchored below the body. The toolbar, sort, and pagination are all just slot projections —
        the table doesn't own any of their state.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-table
          twSort
          [(twSortActive)]="adminSortActive"
          [(twSortDirection)]="adminSortDirection"
          [data]="pagedOrders()"
          variant="bordered"
          [stickyHeader]="true"
          scrollHeight="320px"
          aria-label="Orders admin"
        >
          <div slot="toolbar" class="flex items-center justify-between w-full">
            <div class="flex items-center gap-3">
              <input
                type="search"
                [value]="search()"
                (input)="onSearch($event)"
                placeholder="Search customers…"
                class="px-3 py-1.5 text-sm rounded-md border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-200"
                aria-label="Search orders"
              />
              <span class="text-xs text-fg-muted">
                {{ filteredOrders().length }} result{{ filteredOrders().length === 1 ? '' : 's' }}
              </span>
            </div>
            <button twButton variant="outline" color="neutral" size="sm">Export CSV</button>
          </div>

          <tw-column name="id" [numeric]="true" sticky="start" width="90px">
            <ng-template twHeaderCellDef>
              <span tw-sort-header id="id">Order</span>
            </ng-template>
            <ng-template twCellDef let-row>#{{ asOrder(row).id }}</ng-template>
          </tw-column>
          <tw-column name="customer">
            <ng-template twHeaderCellDef>
              <span tw-sort-header id="customer">Customer</span>
            </ng-template>
            <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
          </tw-column>
          <tw-column name="status" headerLabel="Status">
            <ng-template twCellDef let-row>
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                    [class]="statusClass(asOrder(row).status)">
                {{ asOrder(row).status }}
              </span>
            </ng-template>
          </tw-column>
          <tw-column name="total" [numeric]="true">
            <ng-template twHeaderCellDef>
              <span tw-sort-header id="total" start="desc">Total</span>
            </ng-template>
            <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
          </tw-column>
          <tw-column name="updatedAt">
            <ng-template twHeaderCellDef>
              <span tw-sort-header id="updatedAt">Updated</span>
            </ng-template>
            <ng-template twCellDef let-row>{{ asOrder(row).updatedAt }}</ng-template>
          </tw-column>

          <tw-paginator
            slot="pagination"
            [totalItems]="filteredOrders().length"
            [(page)]="page"
            [pageSize]="pageSize"
            type="basic"
            layout="spread"
          />
        </tw-table>
      </div>
      <tw-code-block [code]="adminSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every table-level input at once. A good starting point is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bordered</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">comfortable</code>
        with sticky header on — that's the shape most admin tables end up in. Toggle
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loading</code>
        to see the overlay, or flip responsive to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">stack</code>
        and resize the browser below the configured breakpoint.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-5 mb-6">
          <div>
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Appearance</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
                <div class="flex gap-1">
                  @for (v of variants; track v) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playVariant() === v"
                      [class.!text-primary-700]="playVariant() === v"
                      (click)="playVariant.set(v)"
                    >{{ v }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Density</label>
                <div class="flex gap-1">
                  @for (d of densities; track d) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDensity() === d"
                      [class.!text-primary-700]="playDensity() === d"
                      (click)="playDensity.set(d)"
                    >{{ d }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
                <div class="flex gap-1">
                  @for (s of sizes; track s) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playSize() === s"
                      [class.!text-primary-700]="playSize() === s"
                      (click)="playSize.set(s)"
                    >{{ s }}</button>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Layout</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Responsive</label>
                <div class="flex gap-1">
                  @for (r of responsive; track r) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playResponsive() === r"
                      [class.!text-primary-700]="playResponsive() === r"
                      (click)="playResponsive.set(r)"
                    >{{ r }}</button>
                  }
                </div>
              </div>
              <div class="flex items-end gap-1">
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playStickyHeader()"
                  [class.!text-primary-700]="playStickyHeader()"
                  (click)="playStickyHeader.update(v => !v)"
                >sticky header</button>
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playScrollHeight()"
                  [class.!text-primary-700]="playScrollHeight()"
                  (click)="playScrollHeight.update(v => !v)"
                >scroll height</button>
              </div>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">State</p>
            <div class="flex gap-1">
              @for (mode of stateModes; track mode) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playState() === mode"
                  [class.!text-primary-700]="playState() === mode"
                  (click)="playState.set(mode)"
                >{{ mode }}</button>
              }
            </div>
          </div>
        </div>

        <tw-table
          [data]="playData()"
          [variant]="playVariant()"
          [density]="playDensity()"
          [size]="playSize()"
          [responsive]="playResponsive()"
          stackBelow="md"
          [stickyHeader]="playStickyHeader()"
          [scrollHeight]="playScrollHeight() ? '240px' : null"
          [loading]="playState() === 'loading'"
          [error]="playState() === 'error' ? 'Failed to load orders' : null"
          aria-label="Playground table"
        >
          <tw-column name="id" headerLabel="Order" stackLabel="Order" [numeric]="true" width="90px">
            <ng-template twCellDef let-row>#{{ asOrder(row).id }}</ng-template>
          </tw-column>
          <tw-column name="customer" headerLabel="Customer" stackLabel="Customer">
            <ng-template twCellDef let-row>{{ asOrder(row).customer }}</ng-template>
          </tw-column>
          <tw-column name="status" headerLabel="Status" stackLabel="Status">
            <ng-template twCellDef let-row>
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                    [class]="statusClass(asOrder(row).status)">
                {{ asOrder(row).status }}
              </span>
            </ng-template>
          </tw-column>
          <tw-column name="total" headerLabel="Total" stackLabel="Total" [numeric]="true">
            <ng-template twCellDef let-row>\${{ asOrder(row).total.toFixed(2) }}</ng-template>
          </tw-column>
          <tw-column name="updatedAt" headerLabel="Updated" stackLabel="Updated">
            <ng-template twCellDef let-row>{{ asOrder(row).updatedAt }}</ng-template>
          </tw-column>
        </tw-table>
      </div>
    </section>
  `,
})
export class TableExamples {
  protected readonly orders = signal<readonly Order[]>(ORDERS);
  protected readonly emptyData: readonly Order[] = [];
  protected readonly variants = VARIANTS;
  protected readonly densities = DENSITIES;
  protected readonly responsive = RESPONSIVE;
  protected readonly sizes = SIZES;
  protected readonly stateModes = STATE_MODES;

  protected readonly stateMode = signal<StateMode>('data');
  protected readonly statesData = computed<readonly Order[]>(() =>
    this.stateMode() === 'empty' ? [] : this.orders().slice(0, 3),
  );

  protected readonly expandedOrders = signal<ReadonlySet<Order>>(new Set());

  // Sort demo
  protected readonly sortActive = signal<string | null>(null);
  protected readonly sortDirection = signal<SortDirection>(null);
  protected readonly sortedOrders = computed<readonly Order[]>(() => {
    const rows = this.orders();
    const active = this.sortActive();
    const direction = this.sortDirection();
    if (!active || direction === null) return rows;
    const sign = direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[active as keyof Order];
      const bv = b[active as keyof Order];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign;
      return String(av ?? '').localeCompare(String(bv ?? '')) * sign;
    });
  });

  // Admin pattern
  protected readonly search = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = 5;
  protected readonly adminSortActive = signal<string | null>(null);
  protected readonly adminSortDirection = signal<SortDirection>(null);

  protected readonly filteredOrders = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.orders();
    return this.orders().filter((o) => o.customer.toLowerCase().includes(q));
  });

  protected readonly adminSortedOrders = computed<readonly Order[]>(() => {
    const rows = this.filteredOrders();
    const active = this.adminSortActive();
    const direction = this.adminSortDirection();
    if (!active || direction === null) return rows;
    const sign = direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[active as keyof Order];
      const bv = b[active as keyof Order];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign;
      return String(av ?? '').localeCompare(String(bv ?? '')) * sign;
    });
  });

  protected readonly pagedOrders = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.adminSortedOrders().slice(start, start + this.pageSize);
  });

  // Playground
  protected readonly playVariant = signal<TwTableVariant>('bordered');
  protected readonly playDensity = signal<TwTableDensity>('comfortable');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playResponsive = signal<TwTableResponsive>('scroll');
  protected readonly playStickyHeader = signal(false);
  protected readonly playScrollHeight = signal(false);
  protected readonly playState = signal<StateMode>('data');
  protected readonly playData = computed<readonly Order[]>(() =>
    this.playState() === 'empty' ? [] : this.orders().slice(0, 6),
  );

  protected asOrder(row: unknown): Order {
    return row as Order;
  }

  protected statusClass(status: Order['status']): string {
    return STATUS_CLASSES[status];
  }

  protected isExpanded(row: Order): boolean {
    return this.expandedOrders().has(row);
  }

  protected toggleExpanded(row: Order, event: Event): void {
    event.stopPropagation();
    const next = new Set(this.expandedOrders());
    if (next.has(row)) next.delete(row);
    else next.add(row);
    this.expandedOrders.set(next);
  }

  protected onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target.value);
    this.page.set(1);
  }

  protected sumTotal(rows: readonly unknown[]): number {
    return (rows as Order[]).reduce((sum, r) => sum + r.total, 0);
  }

  // ── Snippets ───────────────────────────────────────────────────

  protected readonly variantsSnippet = `@for (v of variants; track v) {
  <tw-table [data]="orders" [variant]="v" [attr.aria-label]="'Orders — ' + v">
    <tw-column name="id" headerLabel="Order" [numeric]="true" width="90px">
      <ng-template twCellDef let-row>#{{ row.id }}</ng-template>
    </tw-column>
    <tw-column name="customer" headerLabel="Customer">
      <ng-template twCellDef let-row>{{ row.customer }}</ng-template>
    </tw-column>
    <!-- … -->
  </tw-table>
}`;

  protected readonly densitySnippet = `@for (d of densities; track d) {
  <tw-table [data]="orders" [density]="d" variant="bordered" [attr.aria-label]="'Density — ' + d">
    <tw-column name="id" headerLabel="ID" [numeric]="true">
      <ng-template twCellDef let-row>{{ row.id }}</ng-template>
    </tw-column>
    <!-- … -->
  </tw-table>
}`;

  protected readonly statesSnippet = `<tw-table
  [data]="statesData()"
  [loading]="stateMode() === 'loading'"
  [error]="stateMode() === 'error' ? 'Failed to load orders' : null"
  variant="default"
  aria-label="State demo"
>
  <tw-column name="id" headerLabel="ID" [numeric]="true" width="80px">
    <ng-template twCellDef let-row>#{{ row.id }}</ng-template>
  </tw-column>
  <!-- … -->
</tw-table>`;

  protected readonly stickySnippet = `<tw-table
  [data]="orders"
  [stickyHeader]="true"
  scrollHeight="280px"
  variant="bordered"
  aria-label="Sticky demo"
>
  <tw-column name="id" headerLabel="ID" sticky="start" [numeric]="true" width="80px">
    <ng-template twCellDef let-row>#{{ row.id }}</ng-template>
  </tw-column>
  <!-- middle columns scroll horizontally -->
  <tw-column name="actions" headerLabel="" sticky="end" width="100px">
    <ng-template twCellDef>
      <button twButton variant="ghost" color="primary" size="xs">View</button>
    </ng-template>
  </tw-column>
</tw-table>`;

  protected readonly expansionSnippet = `<tw-table
  [data]="orders"
  [multiTemplateRows]="true"
  [(expandedRows)]="expandedOrders"
  aria-label="Expandable orders"
>
  <tw-column name="toggle" headerLabel="" width="44px">
    <ng-template twCellDef let-row>
      <button
        twButton variant="ghost" color="neutral" size="xs"
        [attr.aria-expanded]="isExpanded(row)"
        (click)="toggleExpanded(row, $event)"
      >▸</button>
    </ng-template>
  </tw-column>
  <!-- data columns -->

  <ng-template twRowExpansion let-row let-collapse="collapse">
    <div class="p-4 bg-surface-sunken">
      <p><strong>Notes:</strong> {{ row.notes || 'No notes for this order.' }}</p>
      <button twButton variant="outline" size="xs" (click)="collapse()">Hide</button>
    </div>
  </ng-template>
</tw-table>`;

  protected readonly footerSnippet = `<tw-table [data]="orders" variant="bordered" aria-label="Totals demo">
  <tw-column name="id" headerLabel="ID" [numeric]="true" width="80px">
    <ng-template twCellDef let-row>{{ row.id }}</ng-template>
    <ng-template twFooterCellDef>
      <span class="font-semibold text-fg-muted">Totals</span>
    </ng-template>
  </tw-column>
  <tw-column name="customer" headerLabel="Customer">
    <ng-template twCellDef let-row>{{ row.customer }}</ng-template>
    <ng-template twFooterCellDef let-rows="rows">
      <span class="text-xs text-fg-muted">{{ rows.length }} orders</span>
    </ng-template>
  </tw-column>
  <tw-column name="total" headerLabel="Total" [numeric]="true">
    <ng-template twCellDef let-row>\${{ row.total.toFixed(2) }}</ng-template>
    <ng-template twFooterCellDef let-rows="rows">
      <span class="font-semibold">\${{ sumTotal(rows).toFixed(2) }}</span>
    </ng-template>
  </tw-column>
</tw-table>`;

  protected readonly noDataSnippet = `<tw-table [data]="[]" variant="bordered" aria-label="Empty orders">
  <tw-column name="id" headerLabel="ID" [numeric]="true">
    <ng-template twCellDef let-row>{{ row.id }}</ng-template>
  </tw-column>
  <!-- … -->

  <ng-template twNoDataRow>
    <tr>
      <td colspan="3" class="px-4 py-10 text-center">
        <div class="flex flex-col items-center gap-2">
          <svg class="size-8 text-fg-subtle" viewBox="0 0 24 24" aria-hidden="true">…</svg>
          <p class="text-sm text-fg-muted">All caught up — no orders to review.</p>
        </div>
      </td>
    </tr>
  </ng-template>
</tw-table>`;

  protected readonly headerTemplateSnippet = `<tw-table [data]="orders" variant="bordered" aria-label="Custom headers">
  <tw-column name="id">
    <ng-template twHeaderCellDef>
      <span class="inline-flex items-center gap-1.5 text-fg">
        <svg class="size-3.5 text-fg-muted" aria-hidden="true">…</svg>
        Order ID
      </span>
    </ng-template>
    <ng-template twCellDef let-row>#{{ row.id }}</ng-template>
  </tw-column>
  <!-- … -->
</tw-table>`;

  protected readonly sortTsSnippet = `protected readonly sortActive = signal<string | null>(null);
protected readonly sortDirection = signal<SortDirection>(null);

protected readonly sortedOrders = computed<readonly Order[]>(() => {
  const rows = this.orders();
  const active = this.sortActive();
  const direction = this.sortDirection();
  if (!active || direction === null) return rows;
  const sign = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[active as keyof Order];
    const bv = b[active as keyof Order];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign;
    return String(av ?? '').localeCompare(String(bv ?? '')) * sign;
  });
});`;

  protected readonly sortHtmlSnippet = `<tw-table
  twSort
  [(twSortActive)]="sortActive"
  [(twSortDirection)]="sortDirection"
  [data]="sortedOrders()"
  variant="bordered"
  aria-label="Sortable orders"
>
  <tw-column name="id" [numeric]="true" width="100px">
    <ng-template twHeaderCellDef>
      <span tw-sort-header id="id">Order</span>
    </ng-template>
    <ng-template twCellDef let-row>#{{ row.id }}</ng-template>
  </tw-column>
  <tw-column name="total" [numeric]="true">
    <ng-template twHeaderCellDef>
      <span tw-sort-header id="total" start="desc">Total</span>
    </ng-template>
    <ng-template twCellDef let-row>\${{ row.total.toFixed(2) }}</ng-template>
  </tw-column>
</tw-table>`;

  protected readonly responsiveSnippet = `<tw-table
  [data]="orders"
  responsive="stack"
  stackBelow="md"
  aria-label="Responsive orders"
>
  <tw-column name="id" headerLabel="ID" stackLabel="Order" [numeric]="true">
    <ng-template twCellDef let-row>#{{ row.id }}</ng-template>
  </tw-column>
  <tw-column name="customer" headerLabel="Customer" stackLabel="Customer">
    <ng-template twCellDef let-row>{{ row.customer }}</ng-template>
  </tw-column>
  <tw-column name="total" headerLabel="Total" stackLabel="Total" [numeric]="true">
    <ng-template twCellDef let-row>\${{ row.total.toFixed(2) }}</ng-template>
  </tw-column>
</tw-table>`;

  protected readonly adminSnippet = `<tw-table
  twSort
  [(twSortActive)]="sortActive"
  [(twSortDirection)]="sortDirection"
  [data]="pagedOrders()"
  variant="bordered"
  [stickyHeader]="true"
  scrollHeight="320px"
  aria-label="Orders admin"
>
  <div slot="toolbar" class="flex items-center justify-between w-full">
    <div class="flex items-center gap-3">
      <input type="search" [value]="search()" (input)="onSearch($event)" placeholder="Search customers…" />
      <span class="text-xs text-fg-muted">{{ filteredOrders().length }} results</span>
    </div>
    <button twButton variant="outline" color="neutral" size="sm">Export CSV</button>
  </div>

  <tw-column name="id" [numeric]="true" sticky="start" width="90px">
    <ng-template twHeaderCellDef><span tw-sort-header id="id">Order</span></ng-template>
    <ng-template twCellDef let-row>#{{ row.id }}</ng-template>
  </tw-column>
  <!-- …other sortable columns -->

  <tw-paginator
    slot="pagination"
    [totalItems]="filteredOrders().length"
    [(page)]="page"
    [pageSize]="pageSize"
    type="basic"
    layout="spread"
  />
</tw-table>`;
}
