import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  PaginatorComponent,
  PaginatorLabelDirective,
  PaginatorEmptyDirective,
  PaginatorPageSizeSelectorDirective,
  type TwPaginatorLayout,
  type TwPaginatorType,
  type TwPaginatorPageChangeEvent,
} from 'ngx-tw/paginator';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';

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
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const TYPES: TwPaginatorType[] = ['numbered', 'basic'];
const LAYOUTS: TwPaginatorLayout[] = ['compact', 'spread'];

interface Product {
  readonly id: number;
  readonly name: string;
  readonly sku: string;
  readonly category: 'Apparel' | 'Accessories' | 'Footwear' | 'Bags';
  readonly price: number;
  readonly stock: number;
}

const PRODUCT_CATEGORIES: Product['category'][] = ['Apparel', 'Accessories', 'Footwear', 'Bags'];
const PRODUCT_NAMES = [
  'Linen overshirt', 'Wool crewneck', 'Pleated trousers', 'Silk scarf', 'Leather belt',
  'Canvas tote', 'Chelsea boots', 'Ribbed beanie', 'Cashmere scarf', 'Cotton tee',
  'Panel cap', 'Oxford shirt', 'Derby shoes', 'Weekender bag', 'Field jacket',
  'Chore coat', 'Boucle cardigan', 'Merino socks', 'Suede loafers', 'Crossbody bag',
  'Heritage knit', 'Leather wallet', 'Terry polo', 'Twill chinos', 'Bucket hat',
  'Oversized hoodie', 'Tailored blazer', 'Selvedge denim', 'Running trainers', 'Backpack',
  'Aviator sunglasses', 'Tipped henley', 'Crew sweatshirt', 'Penny loafers', 'Waffle henley',
  'Down vest', 'Wool overcoat', 'Slip-on sneakers', 'Duffel bag', 'Rugby polo',
  'Raglan crew', 'Bandana set', 'Travel pouch', 'Padded gilet', 'Striped sweater',
  'Rain shell', 'Utility pants',
];

const PRODUCTS: readonly Product[] = PRODUCT_NAMES.map((name, i) => ({
  id: i + 1,
  name,
  sku: `NTW-${String(1000 + i).padStart(4, '0')}`,
  category: PRODUCT_CATEGORIES[i % PRODUCT_CATEGORIES.length],
  price: 24 + ((i * 13) % 180),
  stock: ((i * 37) % 128) + 2,
}));

@Component({
  selector: 'app-paginator-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PaginatorComponent,
    PaginatorLabelDirective,
    PaginatorEmptyDirective,
    PaginatorPageSizeSelectorDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Types -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">type</code>
        input switches between two rendering models.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numbered</code>
        is the default — it shows a full range of page buttons with ellipsis collapsing, which
        reads well once users need to jump more than one page at a time.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">basic</code>
        hides the page list and shows only prev / next with a page-range readout; prefer it on
        narrow layouts or for cursor-like sequential flows where random access does not matter.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        @for (t of types; track t) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ t }}</p>
            <tw-paginator [type]="t" [totalItems]="100" [(page)]="typePage[t]" />
          </div>
        }
      </div>
      <tw-code-block [code]="typesSnippet" language="html" />
    </section>

    <!-- Layouts -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Layouts</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Layout controls how the paginator distributes its regions across the container width.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">compact</code>
        (default) packs the page-size selector, page info, and nav group left-to-right — ideal
        under a dense list. Switch to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">spread</code>
        when you want the page-size selector pinned to one edge and the nav controls to the
        other, which is the conventional shape for a paginator pinned under a full-width table.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        @for (l of layouts; track l) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ l }}</p>
            <tw-paginator
              [layout]="l"
              [totalItems]="250"
              [(page)]="layoutPage[l]"
              [(pageSize)]="layoutSize[l]"
              [showPageSizeSelector]="true"
            />
          </div>
        }
      </div>
      <tw-code-block [code]="layoutsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size scales button padding, font, and icon dimensions together. Match the paginator to the
        data control above it — an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        paginator suits a condensed table toolbar, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        reads well below a generous card grid where users need larger tap targets on touch
        devices.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        @for (s of sizes; track s) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ s }}</p>
            <tw-paginator [size]="s" [totalItems]="100" [(page)]="sizePage[s]" />
          </div>
        }
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Color tints only the active-page button — the other controls stay neutral so the
        paginator does not compete with surrounding content. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        by default;
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        is useful when the paginator sits inside a chrome bar and the brand color would pull
        focus away from the content.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        @for (c of colors; track c) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ c }}</p>
            <tw-paginator [color]="c" [totalItems]="80" [(page)]="colorPage[c]" />
          </div>
        }
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Ellipsis range -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Ellipsis Range</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">siblingCount</code>
        is the number of pages shown on each side of the current page;
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">boundaryCount</code>
        is the number of pages always visible at the start and end. Increase siblings when users
        scrub through nearby pages often; increase boundaries when jumping to the first or last
        page is a common flow (e.g., admin dashboards where the newest record sits on page 1).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">
            siblingCount = 2, boundaryCount = 1
          </p>
          <tw-paginator
            [totalItems]="500"
            [siblingCount]="2"
            [boundaryCount]="1"
            [(page)]="wideSiblingPage"
          />
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">
            siblingCount = 0, boundaryCount = 2
          </p>
          <tw-paginator
            [totalItems]="500"
            [siblingCount]="0"
            [boundaryCount]="2"
            [(page)]="tightSiblingPage"
          />
        </div>
      </div>
      <tw-code-block [code]="rangeSnippet" language="html" />
    </section>

    <!-- First / Last buttons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">First &amp; Last Buttons</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Jump-to-first and jump-to-last buttons ship on by default — they pay off as soon as the
        total page count gets into the double digits. Hide them with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[showFirstLastButtons]="false"</code>
        on short lists where the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1</code>
        and final-page buttons are already visible in the numbered strip.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-paginator [totalItems]="200" [showFirstLastButtons]="false" [(page)]="noFirstLastPage" />
      </div>
      <tw-code-block [code]="firstLastSnippet" language="html" />
    </section>

    <!-- Page size selector — realistic context -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Page Size Selector</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Turning
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showPageSizeSelector</code>
        on reveals a dropdown tied to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pageSizeOptions</code>.
        Changing page size re-anchors the current page so the same first item stays visible — a
        user on item 73 doesn't lose their place just because you switched from 10 per page to
        50. The preview below is a real product list that updates as you paginate.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <div class="overflow-hidden rounded-lg border border-border">
          <div class="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 bg-surface-muted px-4 py-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
            <span>SKU</span>
            <span>Product</span>
            <span>Category</span>
            <span class="text-right">Stock</span>
            <span class="text-right">Price</span>
          </div>
          @for (p of visibleProducts(); track p.id) {
            <div class="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 border-t border-border-muted px-4 py-2 text-sm">
              <span class="font-mono text-xs text-fg-muted">{{ p.sku }}</span>
              <span class="text-fg truncate">{{ p.name }}</span>
              <span class="text-xs text-fg-muted">{{ p.category }}</span>
              <span class="text-right text-xs text-fg-muted tabular-nums">{{ p.stock }}</span>
              <span class="text-right text-fg tabular-nums">\${{ p.price }}</span>
            </div>
          } @empty {
            <div class="border-t border-border-muted px-4 py-8 text-center text-sm text-fg-muted">No products on this page.</div>
          }
        </div>

        <tw-paginator
          layout="spread"
          [totalItems]="products.length"
          [showPageSizeSelector]="true"
          [pageSizeOptions]="[5, 10, 25]"
          [(page)]="productPage"
          [(pageSize)]="productPageSize"
          (paginated)="onProductPaginated($event)"
        />

        @if (lastEvent(); as evt) {
          <p class="text-xs text-fg-muted font-mono">
            source = {{ evt.source }} · items {{ evt.start }}–{{ evt.end }} of {{ evt.totalItems }}
          </p>
        }
      </div>
      <tw-code-block [code]="pageSizeTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="pageSizeHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Link mode -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Link Mode</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Provide a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">linkFactory</code>
        and the paginator renders each page button as an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;a href&gt;</code>
        instead of a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;button&gt;</code>.
        Use this for SSR-friendly pagination where each page must be crawlable and copyable as a
        URL; the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">paginated</code>
        event still fires so you can update client-side state.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-paginator
          [totalItems]="120"
          [page]="linkPage()"
          [linkFactory]="linkHref"
          (paginated)="onLinkPaginated($event)"
        />
        @if (lastLinkHref(); as href) {
          <p class="text-xs text-fg-muted mt-4 font-mono">
            last href = <span class="text-primary-600">{{ href }}</span>
          </p>
        }
      </div>
      <tw-code-block [code]="linkTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="linkHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Responsive -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Responsive Collapse</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        With
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">responsive="auto"</code>
        (the default), a CSS container query hides the numbered page list below ~30rem and falls
        back to prev / next with a page-range readout. Everything is handled in CSS — no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ResizeObserver</code>
        and no layout-thrash. Drag the resize handle below to watch the numbered strip collapse.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 resize-x overflow-auto min-w-64 max-w-full" style="width: 100%">
        <tw-paginator
          layout="spread"
          [totalItems]="300"
          [showPageSizeSelector]="true"
          [(page)]="responsivePage"
          [(pageSize)]="responsiveSize"
        />
      </div>
      <tw-code-block [code]="responsiveSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The container query keys on the paginator's own container, not the viewport — so the same
        paginator can collapse inside a narrow sidebar while staying expanded in the main column.
      </p>
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        freezes every button while keeping the structure visible — use it while a request is in
        flight so the page doesn't jump.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hideOnEmpty</code>
        (default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">true</code>) removes
        the paginator entirely when there are no items; flip it to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">false</code>
        if you want the empty message to sit where the paginator normally lives.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hideOnSinglePage</code>
        removes the control when there is only one page of results.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled (async fetch)</p>
          <tw-paginator [totalItems]="100" [disabled]="true" [page]="3" />
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Empty (default message)</p>
          <tw-paginator [totalItems]="0" [hideOnEmpty]="false" />
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Empty (custom template)</p>
          <tw-paginator [totalItems]="0" [hideOnEmpty]="false">
            <ng-template twPaginatorEmpty>
              <span class="text-sm text-fg-muted">
                No orders match your filters — try broadening the date range.
              </span>
            </ng-template>
          </tw-paginator>
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Hide on single page</p>
          <p class="text-xs text-fg-muted mb-2 italic">5 items, 10 per page → 1 page → hidden (nothing renders below):</p>
          <tw-paginator [totalItems]="5" [hideOnSinglePage]="true" />
          <p class="text-xs text-fg-muted mt-3 mb-2 italic">50 items → 5 pages → visible:</p>
          <tw-paginator [totalItems]="50" [hideOnSinglePage]="true" [(page)]="hidePage" />
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Custom labels -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Labels (i18n)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labels</code>
        input accepts a partial override — pass only the keys you need, and unset keys fall back
        to the English defaults. Template variables like
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">{{ '{page}' }}</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">{{ '{totalPages}' }}</code>
        are substituted at render time, so you can localize the structure as well as the words.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-paginator
          layout="spread"
          [totalItems]="150"
          [showPageSizeSelector]="true"
          [pageSizeOptions]="[10, 25, 50]"
          [(page)]="frPage"
          [(pageSize)]="frSize"
          [labels]="frenchLabels"
        />
      </div>
      <tw-code-block [code]="labelsTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="labelsHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Custom page info template -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Page-Info Template</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twPaginatorLabel slot="pageInfo"</code>
        when the default string isn't expressive enough — the template receives the full context
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">start</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">end</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">totalItems</code>,
        and so on), so you can embed inline formatting, icons, or links. Every label slot (prev,
        next, first, last, pageInfo, pageSizeLabel) takes the same directive.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-paginator
          layout="spread"
          [totalItems]="250"
          [(page)]="richInfoPage"
          [(pageSize)]="richInfoSize"
        >
          <ng-template twPaginatorLabel slot="pageInfo" let-ctx>
            Showing
            <strong class="text-fg">{{ ctx.start }}–{{ ctx.end }}</strong>
            of
            <strong class="text-fg">{{ ctx.totalItems }}</strong>
            results
          </ng-template>
        </tw-paginator>
      </div>
      <tw-code-block [code]="customInfoSnippet" language="html" />
    </section>

    <!-- Custom page size selector -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Page-Size Selector</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Swap the default native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;select&gt;</code>
        for any UI by projecting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twPaginatorPageSizeSelector</code>.
        The context exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pageSize</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setPageSize(n)</code>
        — call
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setPageSize</code>
        so the re-anchor logic still runs.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-paginator
          [totalItems]="200"
          [showPageSizeSelector]="true"
          [pageSizeOptions]="[10, 25, 50, 100]"
          [(page)]="customSelPage"
          [(pageSize)]="customSelSize"
        >
          <ng-template twPaginatorPageSizeSelector let-ctx>
            <div class="inline-flex items-center gap-1">
              @for (opt of ctx.options; track opt) {
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  [class.bg-primary-600]="opt === ctx.pageSize"
                  [class.text-white]="opt === ctx.pageSize"
                  [class.border-primary-600]="opt === ctx.pageSize"
                  [class.text-fg-muted]="opt !== ctx.pageSize"
                  [class.border-border]="opt !== ctx.pageSize"
                  [class.hover:bg-surface-muted]="opt !== ctx.pageSize"
                  (click)="ctx.setPageSize(opt)"
                >{{ opt }}</button>
              }
            </div>
          </ng-template>
        </tw-paginator>
      </div>
      <tw-code-block [code]="customSelectorSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every meaningful input to see how the paginator behaves. A good starting
        configuration is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numbered</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">spread</code>
        with the page-size selector and first/last buttons enabled — that matches the most common
        shape on a real data table. Try shrinking the preview container and flipping
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">totalItems</code>
        between 0 and a large value to watch the empty, single-page, and responsive paths.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-5 mb-6">
          <div>
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Appearance</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Type</label>
                <div class="flex gap-1">
                  @for (t of types; track t) {
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer text-fg-muted hover:bg-surface-muted"
                      [class.!bg-primary-100]="playType() === t"
                      [class.!text-primary-700]="playType() === t"
                      (click)="playType.set(t)"
                    >{{ t }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Layout</label>
                <div class="flex gap-1">
                  @for (l of layouts; track l) {
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer text-fg-muted hover:bg-surface-muted"
                      [class.!bg-primary-100]="playLayout() === l"
                      [class.!text-primary-700]="playLayout() === l"
                      (click)="playLayout.set(l)"
                    >{{ l }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
                <div class="flex gap-1">
                  @for (s of sizes; track s) {
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer text-fg-muted hover:bg-surface-muted"
                      [class.!bg-primary-100]="playSize() === s"
                      [class.!text-primary-700]="playSize() === s"
                      (click)="playSize.set(s)"
                    >{{ s }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
                <div class="flex flex-wrap gap-1">
                  @for (c of colors; track c) {
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer text-fg-muted hover:bg-surface-muted"
                      [class.!bg-primary-100]="playColor() === c"
                      [class.!text-primary-700]="playColor() === c"
                      (click)="playColor.set(c)"
                    >{{ c }}</button>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Range</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Sibling count: {{ playSiblings() }}</label>
                <input type="range" min="0" max="3" step="1" [value]="playSiblings()" (input)="playSiblings.set($any($event.target).valueAsNumber)" class="accent-primary-600" />
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Boundary count: {{ playBoundaries() }}</label>
                <input type="range" min="0" max="3" step="1" [value]="playBoundaries()" (input)="playBoundaries.set($any($event.target).valueAsNumber)" class="accent-primary-600" />
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Total items: {{ playTotal() }}</label>
                <input type="range" min="0" max="500" step="10" [value]="playTotal()" (input)="playTotal.set($any($event.target).valueAsNumber)" class="accent-primary-600" />
              </div>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Regions</p>
            <div class="flex flex-wrap gap-1">
              <button type="button"
                class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer text-fg-muted hover:bg-surface-muted"
                [class.!bg-primary-100]="playShowFirstLast()"
                [class.!text-primary-700]="playShowFirstLast()"
                (click)="playShowFirstLast.update(v => !v)"
              >first / last</button>
              <button type="button"
                class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer text-fg-muted hover:bg-surface-muted"
                [class.!bg-primary-100]="playShowPageSize()"
                [class.!text-primary-700]="playShowPageSize()"
                (click)="playShowPageSize.update(v => !v)"
              >page-size selector</button>
              <button type="button"
                class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer text-fg-muted hover:bg-surface-muted"
                [class.!bg-primary-100]="playShowInfo()"
                [class.!text-primary-700]="playShowInfo()"
                (click)="playShowInfo.update(v => !v)"
              >page info</button>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">State</p>
            <div class="flex flex-wrap gap-1">
              <button type="button"
                class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer text-fg-muted hover:bg-surface-muted"
                [class.!bg-primary-100]="playDisabled()"
                [class.!text-primary-700]="playDisabled()"
                (click)="playDisabled.update(v => !v)"
              >disabled</button>
              <button type="button"
                class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer text-fg-muted hover:bg-surface-muted"
                [class.!bg-primary-100]="playHideOnEmpty()"
                [class.!text-primary-700]="playHideOnEmpty()"
                (click)="playHideOnEmpty.update(v => !v)"
              >hide on empty</button>
              <button type="button"
                class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer text-fg-muted hover:bg-surface-muted"
                [class.!bg-primary-100]="playHideOnSingle()"
                [class.!text-primary-700]="playHideOnSingle()"
                (click)="playHideOnSingle.update(v => !v)"
              >hide on single page</button>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-paginator
            [type]="playType()"
            [layout]="playLayout()"
            [size]="playSize()"
            [color]="playColor()"
            [siblingCount]="playSiblings()"
            [boundaryCount]="playBoundaries()"
            [totalItems]="playTotal()"
            [showFirstLastButtons]="playShowFirstLast()"
            [showPageSizeSelector]="playShowPageSize()"
            [showPageInfo]="playShowInfo()"
            [disabled]="playDisabled()"
            [hideOnEmpty]="playHideOnEmpty()"
            [hideOnSinglePage]="playHideOnSingle()"
            [(page)]="playPage"
            [(pageSize)]="playPageSize"
          />
          <p class="text-xs text-fg-muted mt-4 font-mono">
            page = {{ playPage() }} · size = {{ playPageSize() }} · total = {{ playTotal() }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class PaginatorExamples {
  protected readonly types = TYPES;
  protected readonly layouts = LAYOUTS;
  protected readonly sizes = SIZES;
  protected readonly colors = COLORS;

  protected readonly typePage: Record<TwPaginatorType, ReturnType<typeof signal<number>>> = {
    numbered: signal(1),
    basic: signal(1),
  };

  protected readonly layoutPage: Record<TwPaginatorLayout, ReturnType<typeof signal<number>>> = {
    compact: signal(1),
    spread: signal(1),
  };
  protected readonly layoutSize: Record<TwPaginatorLayout, ReturnType<typeof signal<number>>> = {
    compact: signal(10),
    spread: signal(25),
  };

  protected readonly sizePage: Record<TwSize, ReturnType<typeof signal<number>>> = {
    xs: signal(1),
    sm: signal(1),
    md: signal(1),
    lg: signal(1),
    xl: signal(1),
  };

  protected readonly colorPage: Record<TwColor, ReturnType<typeof signal<number>>> = {
    primary: signal(2),
    secondary: signal(2),
    accent: signal(2),
    neutral: signal(2),
    info: signal(2),
    success: signal(2),
    warning: signal(2),
    error: signal(2),
  };

  protected readonly wideSiblingPage = signal(25);
  protected readonly tightSiblingPage = signal(25);
  protected readonly noFirstLastPage = signal(5);

  // Page-size selector — realistic product list
  protected readonly products = PRODUCTS;
  protected readonly productPage = signal(1);
  protected readonly productPageSize = signal(5);
  protected readonly lastEvent = signal<TwPaginatorPageChangeEvent | null>(null);
  protected readonly visibleProducts = computed(() => {
    const start = (this.productPage() - 1) * this.productPageSize();
    return this.products.slice(start, start + this.productPageSize());
  });
  protected onProductPaginated(event: TwPaginatorPageChangeEvent): void {
    this.lastEvent.set(event);
  }

  // Link mode
  protected readonly linkPage = signal(1);
  protected readonly lastLinkHref = signal<string | null>(null);
  protected readonly linkHref = (p: number): string => `/products?page=${p}`;
  protected onLinkPaginated(event: TwPaginatorPageChangeEvent): void {
    this.lastLinkHref.set(this.linkHref(event.page));
  }

  // Responsive
  protected readonly responsivePage = signal(1);
  protected readonly responsiveSize = signal(10);

  // Hide on single page
  protected readonly hidePage = signal(1);

  // i18n labels
  protected readonly frPage = signal(1);
  protected readonly frSize = signal(10);
  protected readonly frenchLabels = {
    ariaLabel: 'Pagination',
    previous: 'Précédent',
    next: 'Suivant',
    first: 'Première page',
    last: 'Dernière page',
    pageInfo: 'Page',
    pageInfoSeparator: ' sur ',
    pageSizeLabel: 'Par page :',
    announcement: 'Page {page} sur {totalPages}',
  };

  protected readonly richInfoPage = signal(1);
  protected readonly richInfoSize = signal(25);

  protected readonly customSelPage = signal(1);
  protected readonly customSelSize = signal(25);

  // Playground
  protected readonly playType = signal<TwPaginatorType>('numbered');
  protected readonly playLayout = signal<TwPaginatorLayout>('spread');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSiblings = signal(1);
  protected readonly playBoundaries = signal(1);
  protected readonly playTotal = signal(250);
  protected readonly playShowFirstLast = signal(true);
  protected readonly playShowPageSize = signal(true);
  protected readonly playShowInfo = signal(true);
  protected readonly playDisabled = signal(false);
  protected readonly playHideOnEmpty = signal(true);
  protected readonly playHideOnSingle = signal(false);
  protected readonly playPage = signal(1);
  protected readonly playPageSize = signal(10);

  // ── Snippets ───────────────────────────────────────────────────

  protected readonly typesSnippet = `@for (t of types; track t) {
  <tw-paginator [type]="t" [totalItems]="100" [(page)]="typePage[t]" />
}`;

  protected readonly layoutsSnippet = `@for (l of layouts; track l) {
  <tw-paginator
    [layout]="l"
    [totalItems]="250"
    [(page)]="layoutPage[l]"
    [(pageSize)]="layoutSize[l]"
    [showPageSizeSelector]="true"
  />
}`;

  protected readonly sizesSnippet = `@for (s of sizes; track s) {
  <tw-paginator [size]="s" [totalItems]="100" [(page)]="sizePage[s]" />
}`;

  protected readonly colorsSnippet = `@for (c of colors; track c) {
  <tw-paginator [color]="c" [totalItems]="80" [(page)]="colorPage[c]" />
}`;

  protected readonly rangeSnippet = `<tw-paginator
  [totalItems]="500"
  [siblingCount]="2"
  [boundaryCount]="1"
  [(page)]="page"
/>

<tw-paginator
  [totalItems]="500"
  [siblingCount]="0"
  [boundaryCount]="2"
  [(page)]="page"
/>`;

  protected readonly firstLastSnippet = `<tw-paginator
  [totalItems]="200"
  [showFirstLastButtons]="false"
  [(page)]="page"
/>`;

  protected readonly pageSizeTsSnippet = `protected readonly products = PRODUCTS;
protected readonly productPage = signal(1);
protected readonly productPageSize = signal(5);

protected readonly visibleProducts = computed(() => {
  const start = (this.productPage() - 1) * this.productPageSize();
  return this.products.slice(start, start + this.productPageSize());
});`;

  protected readonly pageSizeHtmlSnippet = `<div class="overflow-hidden rounded-lg border border-border">
  <!-- …table header… -->
  @for (p of visibleProducts(); track p.id) {
    <div class="…row…">
      <span>{{ p.sku }}</span>
      <span>{{ p.name }}</span>
      <!-- … -->
    </div>
  }
</div>

<tw-paginator
  layout="spread"
  [totalItems]="products.length"
  [showPageSizeSelector]="true"
  [pageSizeOptions]="[5, 10, 25]"
  [(page)]="productPage"
  [(pageSize)]="productPageSize"
  (paginated)="onProductPaginated($event)"
/>`;

  protected readonly linkTsSnippet = `protected readonly linkHref = (p: number): string => \`/products?page=\${p}\`;

protected onLinkPaginated(event: TwPaginatorPageChangeEvent): void {
  // client-side state update
}`;

  protected readonly linkHtmlSnippet = `<tw-paginator
  [totalItems]="120"
  [page]="linkPage()"
  [linkFactory]="linkHref"
  (paginated)="onLinkPaginated($event)"
/>`;

  protected readonly responsiveSnippet = `<div class="resize-x overflow-auto min-w-64 max-w-full">
  <tw-paginator
    layout="spread"
    [totalItems]="300"
    [showPageSizeSelector]="true"
    [(page)]="page"
    [(pageSize)]="pageSize"
  />
</div>`;

  protected readonly statesSnippet = `<!-- Disabled while a request is in flight -->
<tw-paginator [totalItems]="100" [disabled]="true" [page]="3" />

<!-- Empty with a default message -->
<tw-paginator [totalItems]="0" [hideOnEmpty]="false" />

<!-- Empty with a custom template -->
<tw-paginator [totalItems]="0" [hideOnEmpty]="false">
  <ng-template twPaginatorEmpty>
    <span>No orders match your filters — try broadening the date range.</span>
  </ng-template>
</tw-paginator>

<!-- Hide when totalPages <= 1 -->
<tw-paginator [totalItems]="5"  [hideOnSinglePage]="true" />
<tw-paginator [totalItems]="50" [hideOnSinglePage]="true" [(page)]="page" />`;

  protected readonly labelsTsSnippet = `protected readonly frenchLabels = {
  ariaLabel: 'Pagination',
  previous: 'Précédent',
  next: 'Suivant',
  first: 'Première page',
  last: 'Dernière page',
  pageInfo: 'Page',
  pageInfoSeparator: ' sur ',
  pageSizeLabel: 'Par page :',
  announcement: 'Page {page} sur {totalPages}',
};`;

  protected readonly labelsHtmlSnippet = `<tw-paginator
  layout="spread"
  [totalItems]="150"
  [showPageSizeSelector]="true"
  [pageSizeOptions]="[10, 25, 50]"
  [(page)]="page"
  [(pageSize)]="pageSize"
  [labels]="frenchLabels"
/>`;

  protected readonly customInfoSnippet = `<tw-paginator
  layout="spread"
  [totalItems]="250"
  [(page)]="page"
  [(pageSize)]="pageSize"
>
  <ng-template twPaginatorLabel slot="pageInfo" let-ctx>
    Showing
    <strong>{{ ctx.start }}–{{ ctx.end }}</strong>
    of
    <strong>{{ ctx.totalItems }}</strong>
    results
  </ng-template>
</tw-paginator>`;

  protected readonly customSelectorSnippet = `<tw-paginator
  [totalItems]="200"
  [showPageSizeSelector]="true"
  [pageSizeOptions]="[10, 25, 50, 100]"
  [(page)]="page"
  [(pageSize)]="pageSize"
>
  <ng-template twPaginatorPageSizeSelector let-ctx>
    <div class="inline-flex items-center gap-1">
      @for (opt of ctx.options; track opt) {
        <button
          type="button"
          [class.bg-primary-600]="opt === ctx.pageSize"
          [class.text-white]="opt === ctx.pageSize"
          (click)="ctx.setPageSize(opt)"
        >{{ opt }}</button>
      }
    </div>
  </ng-template>
</tw-paginator>`;
}
