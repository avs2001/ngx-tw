# Prompt: Build `tw-paginator` for ngx-tw

## Overview

Build an accessible, highly customizable paginator component for list/table/grid navigation. Two rendering **types** — `basic` (compact prev/next + "Page X of Y") and `numbered` (page buttons with sibling/boundary ellipsis range) — share the same API, color/size/variant axes, keyboard support, and `LiveAnnouncer` announcements. The component handles total-items math, page clamping, optional items-per-page selector, first/last jump buttons, fully templatable labels, and responsive collapse (container queries) from `numbered` down to `basic` on narrow containers.

**Research summary**

- **Angular Material `MatPaginator`** — `length` (total items), `pageSize`, `pageIndex` (0-based), `pageSizeOptions`, `hidePageSize`, `showFirstLastButtons`, `disabled`; `PageEvent` payload; `MatPaginatorIntl` injection token for i18n (object of strings). We mirror the shape with signal inputs and make `page` **1-based** (more natural in template literals; matches shadcn/PrimeNG/ARIA convention `aria-current="page"` semantics).
- **PrimeNG `Paginator`** — `totalRecords`, `rows`, `first` (pixel-ish offset, we avoid), `pageLinkSize` (sibling count), `rowsPerPageOptions`, `showFirstLastIcon`, `showPageLinks`, `showJumpToPageInput`, `showCurrentPageReport`, `currentPageReportTemplate` (`"{first} - {last} of {totalRecords}"`). Its templating surface (`<ng-template pTemplate="...">`) inspires our `*twPaginatorLabel` / `*twPaginatorPageSizeSelector` / `*twPaginatorEmpty` slots.
- **shadcn/Radix Pagination** — headless primitives; the canonical `getPaginationRange(currentPage, totalPages, siblingCount, boundaryCount)` returning `(number | 'ellipsis-left' | 'ellipsis-right')[]`. We port this algorithm verbatim (no external dep) because it handles the edge cases (first/last boundary, merged-vs-split ellipses, tiny totals) correctly.
- **Zag.js pagination state machine** — edge cases covered: `onPageChange` debouncing, clamping on prop change, `type: 'button' | 'link'` (we expose `'button' | 'anchor'` for SSR-friendly `<a href="?page=N">`), `siblingCount` semantics, keyboard arrow key behaviour matching ARIA tab pattern. We incorporate the clamp-on-prop-change logic and the `siblingCount` + `boundaryCount` split.

The **winning mix** for ngx-tw:
- Material's `PageEvent`-style emission payload + `labels` object for i18n (our `TwPaginatorLabels`).
- PrimeNG's templating slots (`*twPaginatorLabel`, `*twPaginatorPageSizeSelector`, `*twPaginatorEmpty`) layered on top of the string-based `labels` input so consumers choose the customisation depth they need.
- shadcn's `buildPaginationRange` algorithm for ellipsis collapsing.
- Responsive collapse via **CSS container queries** (zero JS, no CDK `BreakpointObserver` dependency). Falls back gracefully by defaulting to `basic` when the container is narrow enough.

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, Visual Design System tokens, semantic color tokens, `tv()` usage, `animate.enter`/`animate.leave` rules, testing rules (Vitest, no `fakeAsync`).
- `projects/ngx-tw/stepper/stepper.ts` + `stepper.html` — the closest structural analog: multi-slot `tv()` with `color` × `size` × `variant`, static per-color class-name maps for Tailwind v4 static scanning, `LiveAnnouncer` on state change, external template when > 50 lines, re-exports pattern.
- `projects/ngx-tw/tabs/tabs.ts` — canonical per-color `Record<TwColor, string>` static maps (search for `UNDERLINE_ACTIVE_HORIZONTAL`, `PILL_ACTIVE`, etc.); follow this exact pattern for paginator active/hover classes.
- `projects/ngx-tw/button/button.ts` — signal-input + `tv()` + `FocusMonitor` pattern. The paginator's internal page buttons will NOT use `twButton` directly (to keep the entry point independent and allow tight integration with `FocusKeyManager`), but the visual classes mirror button's compact `outline`/`ghost` patterns.
- `projects/ngx-tw/select/select.ts` — used internally as the default page-size selector. Confirm its public API (`options`, `value` model, `compareWith`, `size`, `color`) supports our need. We will `import { SelectComponent } from 'ngx-tw/select'` inside the paginator's template for the default page-size UI.
- `projects/ngx-tw/core/types.ts` + `core/index.ts` — `TwColor`, `TwSize`.
- `projects/ngx-tw/theme/_base.css` — add `.fade-in` / `.fade-out` keyframes here if not already present (paginator uses them for ellipsis swap).
- `node_modules/@angular/cdk/a11y/index.d.ts` — `FocusKeyManager`, `LiveAnnouncer`.
- `node_modules/@angular/cdk/keycodes/index.d.ts` — key constants (`LEFT_ARROW`, `RIGHT_ARROW`, `HOME`, `END`, `ENTER`, `SPACE`).

## What to build

A new secondary entry point `ngx-tw/paginator` exporting:

1. **`PaginatorComponent`** (`tw-paginator`) — the root element. Owns math (total pages, clamped current page, visible range), renders the header nav based on `type` and `layout`, composes the optional page-size selector, the optional page info text, and the prev/next/first/last navigation buttons. Implements keyboard navigation via `FocusKeyManager<PageButtonItem>`. Announces changes via `LiveAnnouncer`.
2. **`PaginatorLabelDirective`** (`*twPaginatorLabel [slot="..."]`) — structural directive on `<ng-template>` scoping a custom template to a specific label slot (`'pageInfo' | 'previous' | 'next' | 'first' | 'last' | 'pageSizeLabel' | 'jumpToPage'`). Context: `{ $implicit: PaginatorLabelContext }`.
3. **`PaginatorEmptyDirective`** (`*twPaginatorEmpty`) — structural directive on `<ng-template>` rendering custom content when `totalItems === 0` AND `hideOnEmpty === false`. Default fallback text (from `labels.empty`) renders when the directive is absent.
4. **`PaginatorPageSizeSelectorDirective`** (`*twPaginatorPageSizeSelector`) — structural directive on `<ng-template>` replacing the built-in `tw-select` page-size UI entirely. Context: `{ $implicit: { pageSize: number; options: readonly number[]; setPageSize: (n: number) => void } }`.

Plus:
- `TwPaginatorLabels` — interface of string labels (i18n).
- `TwPaginatorType = 'basic' | 'numbered'` type.
- `TwPaginatorLayout = 'compact' | 'spread'` type.
- `TwPaginatorResponsive = 'auto' | 'off'` type.
- `TwPaginatorPageChangeEvent` — output payload type.
- `TwPaginatorLabelContext` — template context type.
- `PaginationRangeItem = number | 'ellipsis-left' | 'ellipsis-right'` type.
- `buildPaginationRange(currentPage, totalPages, siblingCount, boundaryCount): PaginationRangeItem[]` — pure helper exported for testability (not re-exported from public API; internal). Co-locate in `paginator.ts`.

## Component architecture

```
tw-paginator
├── [page-size selector region]             — hidden when showPageSizeSelector=false
│   └── tw-select (default)  OR  *twPaginatorPageSizeSelector template
├── [page info region]                      — "Page X of Y" / "1–10 of 100"; hidden when showPageInfo=false
├── [nav buttons region]
│   ├── First button                        — hidden when showFirstLastButtons=false
│   ├── Previous button
│   ├── Page buttons (numbered type only)   — with ellipsis items where appropriate
│   ├── Next button
│   └── Last button                         — hidden when showFirstLastButtons=false
└── [empty state]                           — only when total === 0 and hideOnEmpty=false
```

The three regions (page-size, info, nav) are laid out with a flex container whose `justify-content` is driven by the `layout` input:
- `compact` — `justify-start gap-3`, all regions in natural flow
- `spread` — `justify-between`; page-size selector anchors left, nav buttons anchor right, page info centres (or slots between nav and page-size when page-size is hidden)

Responsive behaviour:
- When `responsive="auto"`, wrap the root in a `@container (min-width: ...)` host element (`container-type: inline-size`). Below ~30rem (480px), force-switch to `type: 'basic'` visuals (hide numbered buttons, keep prev/next/page-info). This is **purely CSS** — `@container` rules toggle `display: none` on the page-list slot and `display: inline-flex` on the compact info slot. The underlying `type()` signal does not change; only visual classes.

## API design

### Inputs

```typescript
/** Total number of items across all pages. When `0` and `hideOnEmpty` is `true`, the component renders nothing. Defaults to `0`. */
totalItems = input<number>(0);

/** Items per page. Controls how many pages exist. Defaults to `10`. */
pageSize = model<number>(10);

/** 1-based current page. Two-way bindable via `[(page)]`. Clamped internally to `[1, totalPages]`. Defaults to `1`. */
page = model<number>(1);

/** Rendering type. `'basic'` shows prev/next + page info only. `'numbered'` shows page buttons with ellipsis range. Defaults to `'numbered'`. */
type = input<TwPaginatorType>('numbered');

/** Layout density. `'compact'` stacks regions left-to-right. `'spread'` distributes regions across full container width. Defaults to `'compact'`. */
layout = input<TwPaginatorLayout>('compact');

/** Controls padding, font size, icon size. Uses the shared `TwSize` scale. Defaults to `'md'`. */
size = input<TwSize>('md');

/** Semantic color used for the active page indicator and focused/active nav buttons. Defaults to `'primary'`. */
color = input<TwColor>('primary');

/** How many sibling pages to show on each side of the current page (`numbered` type only). Defaults to `1`. */
siblingCount = input<number>(1);

/** How many pages to always show at the start and end boundaries (`numbered` type only). Defaults to `1`. */
boundaryCount = input<number>(1);

/** When true, renders jump-to-first and jump-to-last buttons outside prev/next. Defaults to `true`. */
showFirstLastButtons = input<boolean>(true);

/** When true, renders the page-size selector region. Defaults to `false`. */
showPageSizeSelector = input<boolean>(false);

/** Options for the built-in page-size selector. Ignored when `*twPaginatorPageSizeSelector` is projected. Defaults to `[10, 25, 50, 100]`. */
pageSizeOptions = input<readonly number[]>([10, 25, 50, 100]);

/** When true, renders the page info text region (e.g., "Page 2 of 10"). Defaults to `true`. */
showPageInfo = input<boolean>(true);

/** When true and `totalItems === 0`, renders nothing. When false, renders a disabled shell with the empty-state content. Defaults to `true`. */
hideOnEmpty = input<boolean>(true);

/** When true and `totalPages <= 1`, renders nothing. Defaults to `false`. */
hideOnSinglePage = input<boolean>(false);

/** Responsive behaviour. `'auto'` collapses to `'basic'` visuals on narrow containers (via CSS container queries). `'off'` disables collapsing. Defaults to `'auto'`. */
responsive = input<TwPaginatorResponsive>('auto');

/** When true, all buttons are disabled (use during async data fetches). Defaults to `false`. */
disabled = input<boolean>(false);

/** String labels object for i18n. All keys are optional — unset keys fall back to English defaults. Merged shallowly with defaults. */
labels = input<Partial<TwPaginatorLabels>>({});

/** Render pagination as links (`<a href>`) instead of buttons. Pass a function returning an href string for a given page. When set, `pageChange` still fires, but the browser also navigates. Defaults to `undefined` (buttons). */
linkFactory = input<((page: number) => string) | undefined>(undefined);

/** Accessible name for the navigation region. Overrides `labels.ariaLabel`. */
ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
```

> `pageSize` and `page` use `model()` for two-way binding (`[(page)]`, `[(pageSize)]`). Everything else is read-only `input()`.

### Outputs

```typescript
/** Fires after `page` or `pageSize` changes with the new snapshot. Payload includes derived helpers. */
pageChange = output<TwPaginatorPageChangeEvent>();
```

(No separate `pageSizeChange` — consumers bind `[(pageSize)]` for two-way, or read `event.pageSize` from `pageChange`. Keeps the surface minimal while still supporting both reactive and imperative flows.)

### Public types

```typescript
export type TwPaginatorType = 'basic' | 'numbered';
export type TwPaginatorLayout = 'compact' | 'spread';
export type TwPaginatorResponsive = 'auto' | 'off';

export interface TwPaginatorLabels {
  /** Accessible name for the `<nav>` landmark. Default: `'Pagination'`. */
  ariaLabel: string;
  /** Text on the Previous button (or its `aria-label` when iconOnly). Default: `'Previous'`. */
  previous: string;
  /** Text on the Next button. Default: `'Next'`. */
  next: string;
  /** Text on the First button. Default: `'First page'`. */
  first: string;
  /** Text on the Last button. Default: `'Last page'`. */
  last: string;
  /** Visible label prefix for the page info region. Used as `"${pageInfo} {page} of {totalPages}"`. Default: `'Page'`. */
  pageInfo: string;
  /** Joins the current page and total, e.g. `' of '` → "Page 2 of 10". Default: `' of '`. */
  pageInfoSeparator: string;
  /** Range-style page info, e.g. `'{start}–{end} of {total}'`. Used when `type: 'basic'` to show item range rather than page count. Default: `'{start}\u2013{end} of {total}'`. */
  pageRange: string;
  /** Visible label next to the page-size selector. Default: `'Items per page:'`. */
  pageSizeLabel: string;
  /** Announcement template used by `LiveAnnouncer` on every page change. Variables: `{page}`, `{totalPages}`, `{start}`, `{end}`, `{total}`. Default: `'Page {page} of {totalPages}'`. */
  announcement: string;
  /** Accessible label per page button. Variable: `{page}`. Default: `'Go to page {page}'`. */
  pageButtonAriaLabel: string;
  /** Accessible label for the current page button. Variable: `{page}`. Default: `'Page {page}, current page'`. */
  currentPageAriaLabel: string;
  /** Accessible label for ellipsis items. Default: `'More pages'`. */
  ellipsis: string;
  /** Rendered when `hideOnEmpty` is false and `totalItems === 0`. Default: `'No results'`. */
  empty: string;
}

export interface TwPaginatorPageChangeEvent {
  /** The new 1-based page. */
  page: number;
  /** The new items-per-page. */
  pageSize: number;
  /** The previous 1-based page. */
  previousPage: number;
  /** The previous items-per-page. */
  previousPageSize: number;
  /** Total number of items. Echoed back for convenience. */
  totalItems: number;
  /** Total number of pages given current `totalItems` and `pageSize`. */
  totalPages: number;
  /** 1-based index of the first item on the new page (inclusive). */
  start: number;
  /** 1-based index of the last item on the new page (inclusive). */
  end: number;
  /** What triggered the change. */
  source: 'click' | 'keyboard' | 'pageSizeChange' | 'programmatic';
}

export interface TwPaginatorLabelContext {
  /** 1-based current page. */
  page: number;
  /** Total pages. */
  totalPages: number;
  /** First item index (1-based, inclusive). */
  start: number;
  /** Last item index (1-based, inclusive). */
  end: number;
  /** Total items. */
  totalItems: number;
  /** Current items per page. */
  pageSize: number;
  /** Whether any nav action is currently disabled. */
  disabled: boolean;
}

type PaginationRangeItem = number | 'ellipsis-left' | 'ellipsis-right';
```

### Content projection

- **`*twPaginatorLabel [slot="..."]`** — 0..N instances. Each scoped to one of: `'pageInfo' | 'previous' | 'next' | 'first' | 'last' | 'pageSizeLabel'`. Overrides the matching `labels[slot]` string. Template context is `TwPaginatorLabelContext`.
- **`*twPaginatorEmpty`** — 0..1 instance. Renders when `totalItems === 0 && !hideOnEmpty()`. If absent, the `labels.empty` string renders in a default container.
- **`*twPaginatorPageSizeSelector`** — 0..1 instance. Replaces the default `tw-select` page-size UI entirely. Context `$implicit`: `{ pageSize, options, setPageSize }`.

All three are optional. If none are projected, sensible defaults render.

## Usage examples

```html
<!-- Simplest: numbered pagination over 100 items, 10 per page -->
<tw-paginator [totalItems]="100" [(page)]="page" />
```

```html
<!-- Basic (compact) prev/next + "1–10 of 100" with large size -->
<tw-paginator
  type="basic"
  size="lg"
  [totalItems]="total()"
  [(page)]="page"
  [(pageSize)]="pageSize"
/>
```

```html
<!-- Spread layout with page-size selector, custom siblings/boundaries, success color -->
<tw-paginator
  type="numbered"
  layout="spread"
  color="success"
  [totalItems]="total()"
  [(page)]="page"
  [(pageSize)]="pageSize"
  [siblingCount]="2"
  [boundaryCount]="1"
  [showPageSizeSelector]="true"
  [pageSizeOptions]="[25, 50, 100, 250]"
/>
```

```html
<!-- Hide first/last, custom labels (i18n), disable while fetching -->
<tw-paginator
  [totalItems]="data().total"
  [(page)]="page"
  [disabled]="loading()"
  [showFirstLastButtons]="false"
  [labels]="{
    previous: 'Précédent',
    next: 'Suivant',
    pageInfo: 'Page',
    pageInfoSeparator: ' sur ',
    announcement: 'Page {page} sur {totalPages}',
  }"
/>
```

```html
<!-- Fully custom page-info template with rich content -->
<tw-paginator [totalItems]="500" [(page)]="page" [(pageSize)]="pageSize">
  <ng-template twPaginatorLabel slot="pageInfo" let-ctx>
    Showing <strong>{{ ctx.start }}–{{ ctx.end }}</strong>
    of <strong>{{ ctx.totalItems }}</strong> results
  </ng-template>
</tw-paginator>
```

```html
<!-- SSR-friendly link-based pagination -->
<tw-paginator
  [totalItems]="total"
  [page]="currentPage"
  [linkFactory]="pageHref"
/>
<!-- where pageHref = (page: number) => `/products?page=${page}` -->
```

```html
<!-- Projected empty state -->
<tw-paginator [totalItems]="0" [hideOnEmpty]="false">
  <ng-template twPaginatorEmpty>
    <span class="text-sm text-fg-muted">No matching orders. Try adjusting your filters.</span>
  </ng-template>
</tw-paginator>
```

## Styling

### `tv()` config — multi-slot

Enable `twMerge: true`. Variants keyed by `size`, `color`, `layout`, `type`, `disabled`.

Slots:

- `root` — outer `<nav>` wrapper (also the container-query container when `responsive="auto"`)
- `inner` — flex row inside root that lays out the three regions
- `pageSizeGroup` — wrapper around the page-size label + selector
- `pageSizeLabel` — the visible label next to the selector
- `pageInfo` — page-info text region
- `navGroup` — wrapper for all nav buttons (first/prev/pages/next/last)
- `pageList` — wrapper for the numbered page buttons + ellipses (only rendered when `type === 'numbered'`)
- `navButton` — shared class for first/prev/next/last buttons
- `pageButton` — individual numbered page button
- `pageButtonActive` — compound-variant extension for the current page
- `ellipsis` — `'…'` indicator between number groups
- `emptyState` — wrapper around the projected/default empty content
- `icon` — inline SVG sizing/shrink class

**Base classes:**

```
root:            'flex w-full'
inner:           'flex items-center gap-3 flex-wrap'
pageSizeGroup:   'flex items-center gap-2 shrink-0'
pageSizeLabel:   'text-sm text-fg-muted whitespace-nowrap'
pageInfo:        'text-sm text-fg-muted whitespace-nowrap'
navGroup:        'flex items-center gap-1'
pageList:        'flex items-center gap-1'
navButton:       'inline-flex items-center justify-center rounded-md border border-border bg-surface text-fg transition-colors duration-200 motion-reduce:transition-none cursor-pointer hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed'
pageButton:      'inline-flex items-center justify-center rounded-md text-fg transition-colors duration-200 motion-reduce:transition-none cursor-pointer hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed'
ellipsis:        'inline-flex items-center justify-center text-fg-subtle select-none pointer-events-none'
emptyState:      'text-sm text-fg-muted'
icon:            'size-4 shrink-0'
```

**Variants — `size`** (drives padding + min-width on page buttons + icon size):

| Size | navButton / pageButton padding | Button min-size | Font | Icon |
|---|---|---|---|---|
| `xs` | `px-2 py-1` | `min-w-7 h-7` | `text-xs` | `size-3.5` |
| `sm` | `px-2.5 py-1.5` | `min-w-8 h-8` | `text-sm` | `size-4` |
| `md` | `px-3 py-2` | `min-w-9 h-9` | `text-sm` | `size-4` |
| `lg` | `px-4 py-2.5` | `min-w-10 h-10` | `text-base` | `size-5` |
| `xl` | `px-5 py-3` | `min-w-11 h-11` | `text-base` | `size-5` |

Apply the `min-w-*` + `h-*` classes to `pageButton` (ensures square-ish buttons) AND `navButton`. Icon sizes apply to the `icon` slot.

**Variants — `layout`:**

- `compact` — `inner: 'justify-start'`
- `spread` — `inner: 'justify-between'`. When only one region is visible (e.g., nav only), still applies — flex handles the collapse.

**Variants — `type`:**

- `basic` — `pageList: 'hidden'` (never rendered; template gate handles this too, but belt-and-braces).
- `numbered` — `pageList: 'flex'`.

**Variants — `disabled`:**

- `true` — `root: 'opacity-50 pointer-events-none'`

**Variants — `color`** (applies to `pageButtonActive` via compound variants): use shared `TwColor`. Each color maps to a static class string for the active page button background + text. Write as static `Record<TwColor, string>` maps (same pattern as `tabs.ts`). Do NOT interpolate Tailwind class names.

```typescript
const PAGE_BUTTON_ACTIVE: Record<TwColor, string> = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 border border-primary-600',
  secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 border border-secondary-600',
  accent:    'bg-accent-600 text-white hover:bg-accent-700 border border-accent-600',
  neutral:   'bg-fg text-surface hover:bg-fg border border-fg',
  info:      'bg-info-600 text-white hover:bg-info-700 border border-info-600',
  success:   'bg-success-600 text-white hover:bg-success-700 border border-success-600',
  warning:   'bg-warning-500 text-black hover:bg-warning-600 border border-warning-500',
  error:     'bg-error-600 text-white hover:bg-error-700 border border-error-600',
};
```

Applied via a helper `getActivePageClass(color: TwColor): string` called in the template for the active page only.

**`defaultVariants`**: `{ type: 'numbered', layout: 'compact', size: 'md', color: 'primary', disabled: false }`.

### Responsive collapse (container queries)

On the `root` slot, when `responsive() === 'auto'`, add:

```
@container paginator (max-width: 30rem) {
  & .tw-paginator-page-list { display: none; }
  & .tw-paginator-range-info { display: inline-flex; }
}
@container paginator (min-width: 30.0001rem) {
  & .tw-paginator-range-info { display: none; }
}
```

Container setup:
- Host class string conditionally includes `[container-type:inline-size] @container` (Tailwind v4 has first-class container-query utilities: `@container` and `@[30rem]:*`).
- Use Tailwind v4 container-query variants directly in the template classes rather than hand-rolling `@container` CSS blocks where possible. Example slot-level classes:
  - `pageList: '@[30rem]:flex hidden'` when `responsive === 'auto'` — becomes `flex` only above 30rem.
  - `pageInfo` swaps to range-style text on narrow widths via `@max-[30rem]:inline-flex @[30rem]:hidden` for a secondary "compact info" span.

When `responsive === 'off'`, omit the container-type utility and the container-query variants — `pageList` always renders.

**Keyframe animations** — none required (no enter/leave on pagination page change; only the style transitions on hover/focus, which Tailwind `transition-colors duration-200` handles). If the designer wants a cross-fade when the page range changes (e.g., ellipsis appearing), gate it behind `animate.enter="fade-in"` on the page-list wrapper — keyframes go in `theme/_base.css` alongside existing `.fade-in` if present, else add them there.

### Icons (inline SVGs)

Use Heroicons-style mini (16/20px) inline SVGs for: first (double-chevron-left), previous (chevron-left), next (chevron-right), last (double-chevron-right). The `icon` slot class handles size and `shrink-0`. Inline `<svg>` elements in the template — do NOT depend on `ngx-tw/icon` (stepper precedent: keep entry point lean).

## Accessibility

- **Root element** — `<nav>` with `role="navigation"` and `[attr.aria-label]="ariaLabel() || labels().ariaLabel"` (default `'Pagination'`).
- **Nav buttons** (first, prev, next, last):
  - `<button type="button">` when `linkFactory()` is undefined; `<a [attr.href]="linkFactory()!(targetPage)">` otherwise.
  - `[attr.aria-label]` = the corresponding `labels.first | previous | next | last`.
  - `[disabled]` when `disabled() || !canNavigateTo(targetPage)`.
  - `[attr.aria-disabled]="... || null"` (for `<a>` links that can't use `[disabled]`).
- **Numbered page buttons**:
  - `<button type="button">` / `<a>` same as above.
  - `[attr.aria-label]="formatLabel(labels.pageButtonAriaLabel, { page: n })"` unless active.
  - **Current page**: `[attr.aria-current]="'page'"` AND `[attr.aria-label]="formatLabel(labels.currentPageAriaLabel, { page: n })"`.
- **Ellipsis items** — `<span aria-hidden="true">…</span>` rendered inside an `<li>` that contains an `aria-label="{{ labels.ellipsis }}"` wrapper span visible to AT but visually unchanged. Do NOT make ellipsis interactive.
- **Page-size selector** — uses `tw-select` internally, which already handles ARIA combobox semantics. Associate it with a visible `<label>` element (`labels.pageSizeLabel`) via `[attr.for]="pageSizeSelectId"` + `[id]` on the select wrapper.
- **Keyboard nav** — use `FocusKeyManager<PageButtonItem>` from `@angular/cdk/a11y` with horizontal orientation, `withWrap(false)`, `withHomeAndEnd()`. Register ALL nav/page buttons (first, prev, page1..pageN, next, last). Bind in the template `[attr.tabindex]="keyManager.activeItemIndex() === i ? 0 : -1"` (roving tabindex). On `(keydown)` at the `navGroup` slot, call `keyManager.onKeydown(event)`.
  - **Arrow Left / Right** — previous/next focusable button (CDK handles wrap=false).
  - **Home / End** — first / last focusable button.
  - **Enter / Space** — activate the focused button (native `<button>` already does this; for `<a>` links Enter is native too).
  - **Tab** — moves out of the paginator after the first focusable item (roving tabindex ensures a single tab stop).
- **LiveAnnouncer** — inject `LiveAnnouncer`. On every `pageChange` emission, announce `formatLabel(labels.announcement, { page, totalPages, start, end, total })` with `'polite'`.
- **Focus preservation** — when a page button is clicked, focus remains on that button (native behaviour; do NOT manually refocus anything). When the clicked button disappears from the DOM because of ellipsis re-collapsing, move focus to the nearest remaining page button via `queueMicrotask` + `keyManager.setActiveItem(newIndex)`.
- **AXE + WCAG AA** — must pass AXE axe-core tests in the spec file. Focus ring uses the standard `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` pattern. Disabled buttons use `opacity-50 pointer-events-none` (sufficient for 3:1 non-text contrast at all sizes).

## Form integration

The paginator is NOT a form control. It does NOT implement `ControlValueAccessor`.

The internal page-size selector, however, uses `tw-select` which already implements CVA — it continues to work with template-driven / reactive / signal forms inside the paginator, but that surface is not exposed to the consumer. Consumers bind `[(pageSize)]` directly on `tw-paginator`.

## Edge cases — exhaustive

All of these must be explicitly handled and tested:

- **`totalItems === 0`**:
  - `hideOnEmpty === true` (default) → render nothing (the component returns `null` via `@if` at the root).
  - `hideOnEmpty === false` → render disabled shell with `emptyState` slot content (projected `*twPaginatorEmpty` template OR `labels.empty` string). Nav buttons all disabled. Page info reads `labels.empty`.
- **`totalItems < pageSize`** → `totalPages = 1`. If `hideOnSinglePage === true`, render nothing. Otherwise show a single disabled page button + disabled prev/next/first/last.
- **`totalPages === 1`** and `hideOnSinglePage === false` → all nav buttons disabled (no target to go to); page button `1` is active and has `aria-current="page"`.
- **`page()` out of bounds** (negative, zero, or > `totalPages`) → clamp to `[1, totalPages]` via `computed()`. When clamping changes the displayed value, push the clamp result back through `page.set(clamped)` (use an `effect()` with `untracked` to avoid infinite loops).
- **`pageSize()` changes while on a high page** → compute the 1-based first-item index of the current page BEFORE pageSize changes (`firstItem = (oldPage - 1) * oldPageSize + 1`), then set `page = Math.ceil(firstItem / newPageSize)` so the user sees the same item band. Use an `effect()` subscribed to `pageSize()` with a `linkedSignal()` tracking the anchor index.
- **`pageSize()` is 0 or negative** → coerce to `1` (guard in a `computed()` called `effectivePageSize()`).
- **`totalItems` very large, e.g. 100_000 with pageSize 10** (10_000 pages) → `buildPaginationRange` produces `[1, 'ellipsis-left', N-1, N, N+1, 'ellipsis-right', 10000]` correctly. Test with `totalPages = 10_000` and `page = 5000`.
- **`page === 1`** → first/prev disabled. Pagination range renders `[1, 2, 3, 'ellipsis-right', 10000]` (no left ellipsis).
- **`page === totalPages`** → next/last disabled. Pagination range renders `[1, 'ellipsis-left', N-2, N-1, N]` (no right ellipsis).
- **`siblingCount === 0`, `boundaryCount === 1`** → range renders `[1, 'ellipsis-left', currentPage, 'ellipsis-right', totalPages]` (minimal).
- **`siblingCount === Infinity`** (edge case) → clamp to `totalPages` effectively; the algorithm returns `[1..totalPages]` with no ellipses.
- **Small totals where siblings overlap boundaries** — e.g., `totalPages = 5, siblingCount = 2` → algorithm must NOT emit ellipses (returns `[1, 2, 3, 4, 5]`). Test case required.
- **`disabled === true`** → every button has `[disabled]` and cannot be activated by click or keyboard. `pageChange` does not fire.
- **`totalItems` changes while on a valid page that is now out-of-range** — e.g., page=5, pageSize=10, totalItems drops from 100 to 30 → clamp page to 3, emit `pageChange` with `source: 'programmatic'`.
- **Rapid repeated clicks on next** — debounce not required; every click emits once. Do NOT coalesce.
- **Keyboard pressed with no active item** — on first focus entry, `keyManager.setFirstItemActive()`.
- **Empty `pageSizeOptions` array** → hide the selector even if `showPageSizeSelector === true` (dev-mode warning: `'[tw-paginator] showPageSizeSelector is true but pageSizeOptions is empty.'`).

## Pagination range algorithm

```typescript
function buildPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationRangeItem[]
```

Semantics (port shadcn's approach):

1. If `totalPages <= boundaryCount * 2 + siblingCount * 2 + 3` → return `[1..totalPages]` (no ellipses — all pages fit).
2. Otherwise compute:
   - `leftBoundary = [1..boundaryCount]`
   - `rightBoundary = [totalPages - boundaryCount + 1..totalPages]`
   - `leftSibling = Math.max(currentPage - siblingCount, boundaryCount + 2)`
   - `rightSibling = Math.min(currentPage + siblingCount, totalPages - boundaryCount - 1)`
   - Insert `'ellipsis-left'` if `leftSibling > boundaryCount + 2`.
   - Insert `'ellipsis-right'` if `rightSibling < totalPages - boundaryCount - 1`.
3. Return `[...leftBoundary, ...ellipsisLeft?, ...siblings, ...ellipsisRight?, ...rightBoundary]`.

Write this as a pure, exported-for-test helper function at the top of `paginator.ts`. Test it directly with unit tests covering: `totalPages = 1, 5, 10, 100, 10000`; `currentPage = 1, 2, 5, 50, totalPages`; `siblingCount = 0, 1, 2`; `boundaryCount = 0, 1, 2`.

## Implementation notes

- **Derived state**:
  - `totalPages = computed(() => Math.max(1, Math.ceil(totalItems() / effectivePageSize())))` — always ≥ 1 to avoid zero-page math.
  - `effectivePageSize = computed(() => Math.max(1, pageSize()))`.
  - `clampedPage = computed(() => Math.min(Math.max(1, page()), totalPages()))`.
  - `range = computed(() => buildPaginationRange(clampedPage(), totalPages(), siblingCount(), boundaryCount()))`.
  - `start = computed(() => totalItems() === 0 ? 0 : (clampedPage() - 1) * effectivePageSize() + 1)`.
  - `end = computed(() => Math.min(clampedPage() * effectivePageSize(), totalItems()))`.
- **Clamp feedback loop** — `effect(() => { const target = clampedPage(); if (target !== page()) untracked(() => { page.set(target); emit('programmatic'); }); })`.
- **Page-size re-anchor** — `linkedSignal()` on `{ pageSize, totalItems }` that computes a new `page` preserving the first visible item. Guard against the initial render emitting a bogus change.
- **Keyboard** — `FocusKeyManager` over a `signal<PageButtonItem[]>([])` registered in `afterNextRender` via `viewChildren('pageButton')`. Items implement CDK's `FocusableOption` (`focus()` + `disabled` getter).
- **`LiveAnnouncer`** — inject via `inject(LiveAnnouncer)`. Call from an `effect(() => { ... announce(...); })` on `clampedPage`, guarded by a "first render" flag so the initial page doesn't announce.
- **Labels merge** — `resolvedLabels = computed(() => ({ ...DEFAULT_LABELS, ...labels() }))`. `DEFAULT_LABELS` is an `as const` object literal declared at the top of `paginator.ts`.
- **Label formatting** — implement `formatLabel(template: string, vars: Record<string, string | number>): string` — simple `{key}` replacement. Co-locate in `paginator.ts`.
- **Template context** — `buildLabelContext()` returns `TwPaginatorLabelContext`. Passed to every projected label template.
- **Projected label lookup** — `contentChildren(PaginatorLabelDirective)`; `labelTemplateFor(slot)` returns the first matching directive's `templateRef` or `undefined`.
- **Static color maps** — `PAGE_BUTTON_ACTIVE: Record<TwColor, string>` (see Styling). No Tailwind class interpolation.
- **No `@angular/animations`** — none used. Only CSS transitions.
- **`ChangeDetection.OnPush`** on the component.
- **`host` object** — `{ '[class]': 'rootClasses()', '[attr.aria-label]': 'resolvedAriaLabel()', '[style.container-type]': 'containerType()' }` where `containerType()` returns `'inline-size'` when `responsive() === 'auto'` else `null`. Give the host a named container: `'[style.container-name]': '"paginator"'`.
- **`inject()` only** — no constructor injection.
- **Template length** — the paginator template will exceed 50 lines (multiple regions, type/layout branches, projected templates). Put it in `paginator.html`. `paginator.ts` remains for class declarations and helpers.
- **Dev warnings** — `afterNextRender` + `isDevMode()` checks for: `showPageSizeSelector && !pageSizeOptions().length`, `totalItems() < 0`, `pageSize() < 1`.
- **Re-export `SelectComponent`** is NOT needed; import it locally for the default page-size UI only.

## File structure

All files in `projects/ngx-tw/paginator/`:

- `paginator.ts` — `PaginatorComponent`, `PaginatorLabelDirective`, `PaginatorEmptyDirective`, `PaginatorPageSizeSelectorDirective`, `buildPaginationRange()` helper (exported for tests only, not from `index.ts`), `formatLabel()` helper, `DEFAULT_LABELS` constant, `PAGE_BUTTON_ACTIVE` static color map, `TwPaginatorLabels` interface, `TwPaginatorType` / `TwPaginatorLayout` / `TwPaginatorResponsive` / `TwPaginatorPageChangeEvent` / `TwPaginatorLabelContext` types, `PaginationRangeItem` internal type.
- `paginator.html` — external template (> 50 lines expected).
- `paginator.spec.ts` — Vitest tests. Must cover:
  - **Rendering**: default render with no inputs (renders nothing when `totalItems=0` + `hideOnEmpty=true`); each `type` (`basic`, `numbered`); each `layout` (`compact`, `spread`); each `size`; each `color` on the active page button; `hideOnEmpty=false` renders empty state; `hideOnSinglePage=true` with `totalPages=1` renders nothing; `showFirstLastButtons=false` hides first/last; `showPageInfo=false` hides info; `showPageSizeSelector=true` renders the select with `pageSizeOptions`.
  - **Math**: `totalPages` derived correctly for various `totalItems`/`pageSize` combinations including `totalItems=0`, `totalItems=1`, `totalItems=99` with `pageSize=10`; `start`/`end` computed correctly on every page.
  - **Ellipsis algorithm**: direct unit tests for `buildPaginationRange` covering the edge-case table in this prompt — `totalPages = 1, 5, 10, 100, 10000`; `page = 1, 2, 5, 50, last`; `siblingCount = 0, 1, 2`; `boundaryCount = 0, 1, 2`.
  - **Two-way binding**: `[(page)]` updates after click, emits `pageChange`; `[(pageSize)]` updates after select change, emits `pageChange` with `source: 'pageSizeChange'`; clamping out-of-bounds `page` pushes corrected value back into the model.
  - **Page-size re-anchor**: setting `page=5, pageSize=10`, then changing `pageSize=20` → new page is `3` (preserving first visible item).
  - **Interactions**: click first/prev/next/last → page updates + `pageChange` emits with correct `source: 'click'`; click a page button → same; clicking disabled buttons is a no-op; `disabled=true` blocks all clicks.
  - **Keyboard**: ArrowRight moves focus to next focusable button (roving tabindex); ArrowLeft moves back; Home / End jump to first / last focusable button; Enter on focused page button activates it and emits `pageChange` with `source: 'keyboard'`.
  - **ARIA**: `<nav role="navigation">` present; `aria-label` reads from input or `labels.ariaLabel`; current page has `aria-current="page"` AND `aria-label` from `currentPageAriaLabel`; other page buttons have `aria-label` from `pageButtonAriaLabel`; disabled buttons expose `disabled` attr (native buttons) or `aria-disabled="true"` (anchor links); ellipsis items have `aria-label` from `labels.ellipsis` and the decorative `…` is `aria-hidden`.
  - **LiveAnnouncer**: `vi.spyOn` on `LiveAnnouncer.announce` — verify it is called with the formatted `labels.announcement` string on page change but NOT on initial render.
  - **Content projection**: projected `*twPaginatorLabel [slot="pageInfo"]` template renders instead of the default string; projected `*twPaginatorEmpty` replaces default empty string; projected `*twPaginatorPageSizeSelector` replaces the built-in `tw-select` (and the context `setPageSize` callback mutates the paginator state).
  - **Labels**: partial `labels` input merges with defaults (unset keys keep English); `{page}`/`{totalPages}` token substitution works across `pageButtonAriaLabel`, `currentPageAriaLabel`, `announcement`, `pageRange`.
  - **Link mode**: with `linkFactory` provided, buttons render as `<a>` with correct `href`; clicking still emits `pageChange`.
  - **Responsive**: with `responsive='auto'`, the root element has the expected container-type style; with `responsive='off'`, it does not. (DOM-level test — CSS container-query triggering is not easily testable in jsdom; assertion is at the style/class level.)
  - **AXE**: one axe-core test per major configuration (`basic` + `numbered` + `spread` + `showPageSizeSelector`) asserting zero violations.
  - **No `fakeAsync` / `tick`** — use `async`/`await` with `fixture.whenStable()` everywhere. For `LiveAnnouncer` flushing or debounced effects, `await fixture.whenStable()` after `fixture.detectChanges()`. If any timer-based behaviour is introduced, use `vi.useFakeTimers()` + `vi.runAllTimers()`.
- `index.ts` — public API exports (see below).
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

Also update:
- `projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/paginator';`.
- `projects/ngx-tw/theme/_base.css` — verify `.fade-in` keyframe exists (used only if an optional range-change cross-fade is enabled; otherwise no additions needed).

## Public API exports

From `projects/ngx-tw/paginator/index.ts`:

```typescript
export {
  PaginatorComponent,
  PaginatorLabelDirective,
  PaginatorEmptyDirective,
  PaginatorPageSizeSelectorDirective,
} from './paginator';
export type {
  TwPaginatorType,
  TwPaginatorLayout,
  TwPaginatorResponsive,
  TwPaginatorLabels,
  TwPaginatorPageChangeEvent,
  TwPaginatorLabelContext,
} from './paginator';
```

Do NOT export `buildPaginationRange`, `formatLabel`, `DEFAULT_LABELS`, or `PAGE_BUTTON_ACTIVE` from the public API — they are internal.

## Constraints

- Extend nothing from CDK — compose `FocusKeyManager` and `LiveAnnouncer` from `@angular/cdk/a11y` via `inject()`.
- All styling via Tailwind v4 utilities + `tv()` with `twMerge: true` — no component CSS files.
- Semantic color tokens only (`primary-*`, `info-*`, `error-*`, etc.) — never raw palette colors (`blue-*`, `red-*`).
- Neutral structural styling uses `surface-*` / `fg-*` / `border-*` tokens — never raw `neutral-*` shades.
- Active page button uses the `color()` input's `*-600` shade on solid variants (see `PAGE_BUTTON_ACTIVE` static map) — written out per-color in a static `Record<TwColor, string>` map. No class-name interpolation.
- All visual tokens (radius `rounded-md`, spacing `px-2 py-1` through `px-5 py-3`, focus rings, icon sizes `size-3.5`/`size-4`/`size-5`, transitions `duration-200`) follow the CLAUDE.md Visual Design System — no invented values.
- Responsive collapse uses **CSS container queries** via Tailwind v4 `@container` utilities — no CDK `BreakpointObserver`, no `matchMedia` in JS.
- Signal-based API: `input()` for read-only, `model()` for `page` and `pageSize` two-way binding, `output()` for `pageChange`. `computed()` for derived state, `linkedSignal()` only for the page-size re-anchor logic.
- `ChangeDetection.OnPush` on every component.
- `host` object for host bindings; `inject()` for DI; native control flow (`@if` / `@for`) in templates; no arrow functions in templates.
- No `@angular/animations` — use Tailwind `transition-colors duration-200` only (no enter/leave animations required).
- Every `input()`, `output()`, `model()`, and public method has a one-line JSDoc comment (per CLAUDE.md).
- Tests use Vitest (`vi.spyOn()`, `async/await` + `fixture.whenStable()`, no `fakeAsync` / `tick`).
- Internal page-size selector uses `SelectComponent` from `ngx-tw/select` — do NOT depend on it transitively in types exposed by `ngx-tw/paginator/index.ts` (keep the public surface independent).
