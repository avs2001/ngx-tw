# Prompt: Build `tw-table` for ngx-tw

## Overview

Build a highly customizable, accessible data table component for ngx-tw. The table wraps Angular CDK's `CdkTable` — CDK owns all row diffing, column-def matching, data-source connection (`T[] | Observable<T[]> | DataSource<T>`), sticky positioning (columns + header + footer rows), and the `<caption>` / `scope` / role plumbing that native `<table>` semantics require. We provide a thin, strongly-typed `<tw-table>` wrapper + `<tw-column>` parent/child composition, structural directives for templates (`*twHeaderCellDef`, `*twCellDef`, `*twFooterCellDef`, `*twRowDef`, `*twHeaderRowDef`, `*twFooterRowDef`, `*twNoDataRow`, `*twRowExpansion`), content-projection slots for caption / toolbar / footer / pagination / empty / loading / error states, and a `tv()` styling layer driven by `variant`, `density`, `size`, `responsive`, `stickyHeader`, `stickyFooter`, and `layout` inputs.

The component is **generic over the row type `T`** so projected templates receive typed `let-row`, `let-column`, `let-index`, etc. context. It composes cleanly with existing ngx-tw pieces: `[twSort]` + `[tw-sort-header]` from `ngx-tw/sort` on the header cells, `<tw-paginator>` projected into the pagination slot, `<tw-spinner>` as the default loading fallback, and (future) `<tw-checkbox>` rendered inside the row-select cell when selection lands in v2.

**Research summary**

- **Angular CDK `CdkTable`** (`@angular/cdk/table`) — the behaviour primitive. Provides every piece of runtime logic a table needs: `CdkColumnDef` (`name`, `sticky`, `stickyEnd`), `CdkCellDef` / `CdkHeaderCellDef` / `CdkFooterCellDef` (capture `TemplateRef`), `CdkRowDef` (which columns + optional `when` predicate), `CdkHeaderRowDef` / `CdkFooterRowDef` (with `sticky` inputs), `CdkNoDataRow` (fallback row), `CdkTable.dataSource` accepting `T[] | Observable<T[]> | DataSource<T>`, `trackBy: TrackByFunction<T>`, `multiTemplateDataRows` for row expansion, `fixedLayout` for `table-layout: fixed`, `STICKY_POSITIONING_LISTENER` token to observe sticky state, `addColumnDef()` / `addRowDef()` / `addHeaderRowDef()` / `addFooterRowDef()` / `setNoDataRow()` for programmatic defs, `viewChange: BehaviorSubject<ListRange>` for virtual-scroll integration, `contentChanged` emitter, RTL via `Directionality`. We use **all** of this; we re-implement **none** of it.
- **Angular Material `MatTable`** — the reference implementation of wrapping `CdkTable`. Study how `MatTable` composes `CdkColumnDef` + `CdkCellDef` via nested component + structural directives (`<ng-container matColumnDef>` + `*matCellDef`). We follow the same blueprint, adapted to our `<tw-column>` parent/child pattern so consumers can set column-level inputs (`sticky`, `align`, `hidden`, `width`) declaratively.
- **Radix UI / shadcn data table** — inspired the toolbar / empty-state / pagination composition as projection slots above/below the table, with zero opinion on their internals. We do not ship filter/search inputs; consumers drop their own inside `[slot="toolbar"]`.
- **PrimeNG `<p-table>`** — instructive example of what _not_ to do: kitchen-sink inputs for every feature (filtering, paging, selection, virtual scroll, column resize, reorder) balloon the surface. We keep the component small and compose primitives instead.
- **`tw-select` + `tw-stepper` + `tw-sort`** — the architectural precedents in this library. `tw-select` demonstrates structural directives (`*twSelectOption`, `*twSelectTrigger`) with typed `ngTemplateContextGuard`. `tw-stepper` shows the CDK-composition pattern (extending vs wrapping — we wrap here for the same reason Material does). `tw-sort` demonstrates child-registers-with-parent coordination without a host-directive setup — which is exactly what `<tw-column>` needs to do with `<tw-table>`.

## Context

Read before starting:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — full project conventions: Angular v21 signals, Tailwind v4 semantic + surface/fg/border tokens, `tv()` with `twMerge: true`, no `@angular/animations`, Vitest rules, no `fakeAsync`, Visual Design System (radius, spacing, typography, shadows, transitions, focus rings, icons, opacity, borders, hover, overflow, cursor).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`. **Add `TwBreakpoint` here** (see "New shared type" below).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/index.ts` — re-export `TwBreakpoint` once added.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/tabs/tabs.ts` + `projects/ngx-tw/tabs/tabs.html` — **primary reference** for parent/child coordination via `contentChildren(ChildComponent)`, multi-slot `tv()`, per-color static class lookups for Tailwind v4 static scanning, external template when > 50 lines. The `<tw-table>`/`<tw-column>` relationship mirrors `<tw-tabs>`/`<tw-tab>` almost exactly.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/select/select.ts` — structural directives on `<ng-template>`: `SelectOptionTemplateDirective`, `SelectTriggerTemplateDirective`, `SelectEmptyTemplateDirective`. We create analogous directives for `*twCellDef`, `*twHeaderCellDef`, `*twFooterCellDef`, `*twRowDef`, `*twHeaderRowDef`, `*twFooterRowDef`, `*twNoDataRow`, `*twRowExpansion`. Pay particular attention to the `ngTemplateContextGuard` static method for typed `let-` variables.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/sort/sort.ts` + `sort-header.ts` + `sort-header.html` — the sort integration pattern. `<tw-table twSort>` + `[tw-sort-header]` inside a projected `*twHeaderCellDef` works with zero table-level code because `SortDirective` is a container directive that doesn't know or care what renders its children.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/paginator/paginator.ts` + `projects/ngx-tw/paginator/index.ts` — consumer-facing API of the component that plugs into `[slot="pagination"]`. Confirm the `totalItems`, `pageSize`, `page` inputs so usage examples are accurate.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/stepper/stepper.ts` — demonstrates CDK composition (`extends CdkStepper`) and external templates. **Important contrast:** `tw-table` does **NOT** extend `CdkTable`. See "CDK audit" below for why we wrap rather than extend.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/card/` — simpler content-projection precedent for `[slot=…]` attribute slots.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/spinner/` — the default loading fallback. Optional `import` — may be omitted if keeping the entry point lean; if so, ship an inline SVG spinner.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` — existing keyframes (`fade-in`/`fade-out`/`scale-in`/`scale-out`). **No new keyframes required** for v1.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_semantic.css` — confirm which `surface-*`/`fg-*`/`border-*` tokens exist (`surface`, `surface-raised`, `surface-overlay`, `surface-sunken`, `surface-muted`, `fg`, `fg-muted`, `fg-subtle`, `border`, `border-muted`, `border-strong`).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/node_modules/@angular/cdk/types/table.d.ts` — authoritative CdkTable API (every exported class, token, and type signature).

## CDK audit & decision

`@angular/cdk/table` ships the following consumable surface:

| Export | Role | Usage |
|---|---|---|
| `CdkTable<T>` | The rendering engine | We render `<table cdk-table [dataSource]="data()" [trackBy]="trackBy()">` inside our template. |
| `CdkColumnDef` | One column's identity | Each `<tw-column>` hosts a `CdkColumnDef` (via nested `<ng-container cdkColumnDef="{{name}}">`). |
| `CdkCellDef` / `CdkHeaderCellDef` / `CdkFooterCellDef` | Per-column cell templates | We **re-export** these as `*twCellDef` / `*twHeaderCellDef` / `*twFooterCellDef` via thin directive subclasses that `provide` themselves as the CDK token. This lets consumers write our `tw`-prefixed names while `CdkColumnDef` still matches them via its content queries. |
| `CdkCell` / `CdkHeaderCell` / `CdkFooterCell` | Cell element markers | Applied to the rendered `<td>` / `<th>` via attribute selectors (`cdk-cell`, `cdk-header-cell`, `cdk-footer-cell`). |
| `CdkRowDef<T>` / `CdkHeaderRowDef` / `CdkFooterRowDef` | Row templates | Accept `columns: Iterable<string>` and (for `CdkRowDef`) an optional `when: (index, row) => boolean` predicate. We re-export as `*twRowDef` / `*twHeaderRowDef` / `*twFooterRowDef` with the same subclass-and-provide pattern. |
| `CdkRow` / `CdkHeaderRow` / `CdkFooterRow` | Row element markers | Applied to `<tr>`. |
| `CdkNoDataRow` | Fallback row template | Re-exported as `*twNoDataRow`; used internally as the default for the empty-state slot. |
| `DataSource<T>` | Observable data contract | Accept on the `data` input alongside `T[]` and `Observable<T[]>` via `CdkTableDataSourceInput<T>`. |
| `STICKY_POSITIONING_LISTENER` | Observe sticky recalculation | Optional — we only need this if we want to show/hide column shadows at sticky boundaries. Ship a no-op in v1 (`[CONFIRM]` if visual sticky-edge shadow is desired). |
| `CDK_TABLE` | DI token for the table instance | Used internally so column/row defs can inject the parent `CdkTable` without knowing we wrapped it. We **must** provide our own table's `CdkTable` under this token when we render `<table cdk-table>` — but CDK does this automatically when we include `CdkTableModule`. Nothing to do. |

### Three strategies considered

**A. Extend `CdkTable` directly** (Material's `MatTable` approach).
Pros: maximally terse — our component _is_ a CDK table. Pros: content queries on `CdkTable` (`_contentColumnDefs`, `_contentRowDefs`) resolve our projected `<tw-column>` children automatically if we make them extend `CdkColumnDef`.
Cons: forces our selector onto `<tr>` / `<th>` / `<td>` elements (or onto `<cdk-table>`-class wrappers). Forces us to expose CDK's full input surface (`dataSource`, `trackBy`, `multiTemplateDataRows`, `fixedLayout`, `recycleRows`) under CDK's exact names, which locks our API to CDK's. Makes column-level inputs (`align`, `width`, `hideBelow`) awkward because a `CdkColumnDef` has no slot for them.

**B. Use only CDK data-source abstractions, reimplement the rest** (don't import `CdkTable`).
Pros: total control.
Cons: contradicts our core principle ("Compose Angular CDK, don't reinvent it"). Sticky positioning alone is ~500 LOC of CDK code we'd have to port. **Rejected.**

**C. Wrap `CdkTable` in a template** ← **RECOMMENDED**.
Our `<tw-table>` component template renders a native `<table cdk-table [dataSource]="…" [trackBy]="…" [multiTemplateDataRows]="…" [fixedLayout]="…">` as its child, plus chrome (caption, toolbar, scroll container, empty/loading/error overlays, pagination) around it. Each `<tw-column>` projected into `<tw-table>` is a component whose template is an `<ng-container cdkColumnDef="{{name}}" [sticky]="sticky() === 'start'" [stickyEnd]="sticky() === 'end'">` carrying the consumer's `*twHeaderCellDef` / `*twCellDef` / `*twFooterCellDef` templates (applied to `<th cdk-header-cell>` / `<td cdk-cell>` / `<td cdk-footer-cell>` renderers). The nested `<ng-container cdkColumnDef>` is **lifted into the CDK table's content children** automatically because it appears inside the outer `<tw-table>` component's rendered DOM and `CdkTable` uses `@ContentChildren(CdkColumnDef, { descendants: true })`.

**Why C wins:**
- `<tw-column>` can expose our own inputs (`align`, `hideBelow`, `width`, plus re-aliased `sticky`) without polluting CDK's API.
- Our table can render toolbar/caption/footer/pagination chrome outside the `<table>` element with no CDK involvement.
- CDK still owns data-source, trackBy, sticky, row diffing, `multiTemplateDataRows`.
- We inherit CDK's bug fixes and virtual-scroll readiness for free.
- The `<table cdk-table>` element naturally carries the `role="table"` semantics; we don't fight it.

**Composition diagram (C):**

```
<tw-table [data]="rows" [trackBy]="trackFn" variant="bordered" density="comfortable">
│
├── [slot="caption"]           → rendered as <caption> above <thead>
├── [slot="toolbar"]            → rendered above the scroll container
│
├── <div class="scroll-container" [style.maxHeight]="scrollHeight">
│   └── <table cdk-table                          ← CDK renders everything inside
│              [dataSource]="resolvedData"
│              [trackBy]="trackBy"
│              [multiTemplateDataRows]="hasExpansion"
│              [fixedLayout]="layout === 'fixed'">
│       │
│       ├── <tw-column name="price" sticky="end">                       (×N)
│       │   └── (template)  <ng-container cdkColumnDef="price"
│       │                                 [stickyEnd]="true">
│       │                     <th cdk-header-cell …>
│       │                       <ng-container *ngTemplateOutlet="hdrTpl"/>
│       │                     </th>
│       │                     <td cdk-cell …>
│       │                       <ng-container *ngTemplateOutlet="cellTpl"/>
│       │                     </td>
│       │                   </ng-container>
│       │
│       ├── <ng-container *twHeaderRowDef="['price','qty']; sticky: stickyHeader">
│       ├── <ng-container *twRowDef="['price','qty']">
│       ├── <ng-container *twFooterRowDef="['price','qty']">
│       └── <ng-template *twNoDataRow>…</ng-template>
│   </table>
│
├── [slot="empty"]              → fallback rendered when rows.length === 0
├── [slot="loading"]            → overlay rendered when loading === true
├── [slot="error"]              → rendered when error != null
├── [slot="footer"]             → summary footer area (not the <tfoot>)
└── [slot="pagination"]         → consumer drops <tw-paginator> here
```

`<tw-column>`, `*twCellDef`, `*twHeaderCellDef`, `*twRowDef`, `*twHeaderRowDef`, `*twFooterRowDef`, and `*twNoDataRow` are **thin subclasses** of their CDK counterparts that `provide` themselves as the CDK token. This means `CdkTable`'s `@ContentChildren(CdkColumnDef)` still picks them up — they ARE `CdkColumnDef`s to CDK — while consumers write `tw`-prefixed names. Pattern:

```ts
@Directive({
  selector: '[twCellDef]',
  providers: [{ provide: CdkCellDef, useExisting: TwCellDefDirective }],
})
export class TwCellDefDirective<T> extends CdkCellDef {
  static ngTemplateContextGuard<T>(_dir: TwCellDefDirective<T>, _ctx: unknown): _ctx is TwCellContext<T> {
    return true;
  }
}
```

## What to build

Seven exported artifacts in a new secondary entry point `ngx-tw/table`:

1. **`TableComponent<T>`** (`tw-table`, element selector, generic over `T`) — root wrapper.
2. **`ColumnComponent<T>`** (`tw-column`, element selector, generic over `T`) — one column's metadata + templates. Renders its CDK `<ng-container cdkColumnDef>` when the parent `TableComponent` asks for it.
3. **`TwCellDefDirective<T>`** (`*twCellDef`) — re-exports `CdkCellDef`, typed context.
4. **`TwHeaderCellDefDirective`** (`*twHeaderCellDef`) — re-exports `CdkHeaderCellDef`, typed context.
5. **`TwFooterCellDefDirective<T>`** (`*twFooterCellDef`) — re-exports `CdkFooterCellDef`, typed context.
6. **`TwRowDefDirective<T>`** (`*twRowDef`) — re-exports `CdkRowDef<T>` so consumers can declare custom data row templates with `when` predicates.
7. **`TwHeaderRowDefDirective`** / **`TwFooterRowDefDirective`** (`*twHeaderRowDef` / `*twFooterRowDef`) — re-export `CdkHeaderRowDef` / `CdkFooterRowDef`.
8. **`TwNoDataRowDirective`** (`*twNoDataRow`) — re-exports `CdkNoDataRow`.
9. **`TwRowExpansionDirective<T>`** (`*twRowExpansion`) — ngx-tw-specific structural directive marking a `<tr>` template that renders beneath each expanded row. Internally, the table produces a second `CdkRowDef` with `when: (i, row) => expandedRows().has(row)`.

Plus, in `ngx-tw/core/types.ts`:

```ts
/** Tailwind-aligned breakpoint for responsive inputs. */
export type TwBreakpoint = 'sm' | 'md' | 'lg' | 'xl';
```

Re-export from `ngx-tw/core/index.ts`.

Plus, exported from `ngx-tw/table`:

- `TwTableVariant` (`'default' | 'striped' | 'bordered'`)
- `TwTableDensity` (`'comfortable' | 'compact'`)
- `TwTableResponsive` (`'scroll' | 'stack' | 'hide'`)
- `TwTableLayout` (`'auto' | 'fixed'`)
- `TwColumnAlign` (`'start' | 'center' | 'end'`)
- `TwColumnSticky` (`'start' | 'end' | false`)
- `TwTableLabels` — dictionary (same pattern as `TwPaginatorLabels`) for i18n strings.
- Context interfaces (`TwCellContext<T>`, `TwHeaderCellContext`, `TwFooterCellContext<T>`, `TwRowContext<T>`, `TwHeaderRowContext`, `TwRowExpansionContext<T>`).
- Event types (`TwRowClickEvent<T>`, `TwSelectionChangeEvent<T>`, `TwRowExpansionChangeEvent<T>`).
- Re-export `CdkTableDataSourceInput` (as `TwTableDataSourceInput<T>`) and `TrackByFunction` types so consumers don't need to import from CDK directly.

## API design

### `TableComponent<T>` — selector `tw-table`

Generic: `TableComponent<T = unknown>` — default matches `SelectComponent<T>`. Change detection: `OnPush`. Standalone (do NOT set `standalone: true`). Imports: `CdkTableModule`, `NgTemplateOutlet`, internal directives. The host element is a `<div>` wrapper; the actual `<table cdk-table>` lives in the template.

#### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `data` | `TwTableDataSourceInput<T>` | `[]` | `/** The table's rows. Accepts a plain array, an Observable of arrays, or a CDK \`DataSource<T>\`. Wired directly to \`CdkTable.dataSource\`. Defaults to an empty array. */` |
| `trackBy` | `TrackByFunction<T> \| undefined` | `undefined` | `/** Tracking function used by CDK to identify rows across changes. When unset, CDK falls back to identity tracking. Mirrors CDK's \`trackBy\`. */` |
| `loading` | `boolean` | `false` | `/** When true, renders the loading slot as an overlay above the table body and freezes column widths so the layout doesn't jump when data returns. Defaults to \`false\`. */` |
| `error` | `unknown \| null` | `null` | `/** When non-null, renders the error slot in place of the body. The default fallback shows an error icon and \`String(error)\`. Custom content via \`[slot="error"]\`. Defaults to \`null\`. */` |
| `variant` | `TwTableVariant` | `'default'` | `/** Visual variant. \`'default'\` — clean, subtle row dividers. \`'striped'\` — alternating row backgrounds. \`'bordered'\` — full 1px grid with an outer rounded border. Defaults to \`'default'\`. */` |
| `density` | `TwTableDensity` | `'comfortable'` | `/** Row density. \`'comfortable'\` — larger vertical padding for readability. \`'compact'\` — tighter padding for dense data. Defaults to \`'comfortable'\`. */` |
| `size` | `TwSize` | `'md'` | `/** Controls the table's font size and padding scale. Uses the shared \`TwSize\` scale. Defaults to \`'md'\`. */` |
| `responsive` | `TwTableResponsive` | `'scroll'` | `/** How the table behaves on narrow viewports. \`'scroll'\` — horizontal overflow inside a scroll container. \`'stack'\` — collapses to a card-per-row layout below \`stackBelow\`. \`'hide'\` — columns with a matching \`hideBelow\` are hidden. Defaults to \`'scroll'\`. */` |
| `stackBelow` | `TwBreakpoint` | `'md'` | `/** Breakpoint below which the \`'stack'\` responsive mode engages. Ignored when \`responsive !== 'stack'\`. Defaults to \`'md'\`. */` |
| `stickyHeader` | `boolean` | `false` | `/** When true, the \`<thead>\` row stays visible while the body scrolls. Requires \`scrollHeight\` for internal scrolling or a scrolling ancestor. Defaults to \`false\`. */` |
| `stickyFooter` | `boolean` | `false` | `/** When true, the \`<tfoot>\` row stays pinned to the bottom while the body scrolls. Defaults to \`false\`. */` |
| `scrollHeight` | `string \| number \| null` | `null` | `/** Max-height of the internal scroll container. A number is treated as pixels; a string is passed through as a CSS length. When \`null\`, the table flows with its content and relies on an external scroll ancestor. Defaults to \`null\`. */` |
| `layout` | `TwTableLayout` | `'auto'` | `/** Table layout algorithm. \`'auto'\` lets content determine column widths. \`'fixed'\` respects \`<tw-column [width]>\` values and enables CDK's sticky-width optimizations. Defaults to \`'auto'\`. */` |
| `multiTemplateRows` | `boolean` | `false` | `/** Whether multiple row templates may render per data object (required for \`*twRowExpansion\` and advanced \`*twRowDef [when]\` usage). Forwarded to \`CdkTable.multiTemplateDataRows\`. Defaults to \`false\`. */` |
| `selectable` | `boolean` | `false` | `/** When true, exposes a leading selection column (renders checkboxes via the projected \`*twRowSelectCell\` template or a v2 default). Pairs with \`selected\` + \`selectionChange\`. Defaults to \`false\`. */` |
| `expandedRows` | `model<ReadonlySet<T>>` | `new Set()` | see Models |
| `selected` | `model<readonly T[]>` | `[]` | see Models |
| `rowAnimations` | `boolean` | `false` | `/** When true, new rows fade in via \`animate.enter="fade-in"\`. Off by default because animations on every data change can be distracting. Defaults to \`false\`. */` |
| `labels` | `Partial<TwTableLabels>` | `{}` | `/** Overrides for user-facing strings (loading message, empty message, error prefix, sort announcements, selection announcements). Unset keys fall back to the English defaults. */` |
| `ariaLabel` (alias `'aria-label'`) | `string \| undefined` | `undefined` | `/** Accessible name for the \`<table>\`. Required when no visible \`<caption>\` is provided. Mirrored to \`aria-label\` on the table element. */` |
| `ariaLabelledby` (alias `'aria-labelledby'`) | `string \| undefined` | `undefined` | `/** Id of an external element labelling the table. Mirrored to \`aria-labelledby\`. */` |

**Input count:** 19. This exceeds the 5–6 guideline and is explicitly permitted under MEMORY.md's "Overlay input count exception" — the same reasoning applies to composite data-display components (precedent: `tw-paginator` with a comparable surface). Consumers who only need the simple case touch `data`, `trackBy`, and project their columns.

#### Models (two-way)

| Model | Type | Default | JSDoc |
|---|---|---|---|
| `expandedRows` | `ReadonlySet<T>` | `new Set()` | `/** Two-way bound set of rows currently expanded. Used in conjunction with \`*twRowExpansion\`. Immutable — on every change, set a new \`Set\` instance (do not mutate in place). */` |
| `selected` | `readonly T[]` | `[]` | `/** Two-way bound list of selected rows. Set a new array on every change (do not mutate). Only used when \`selectable\` is \`true\`. */` |

Note: `expandedRowsChange` and `selectedChange` are auto-generated by `model()` — do NOT redeclare.

#### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `rowClick` | `TwRowClickEvent<T>` | `/** Fires when a row is clicked (not fired when the click originated inside an interactive child element like a button, link, or input — consumers can intercept via \`stopPropagation\`). Payload: \`{ row, index, event }\`. */` |
| `selectionChange` | `TwSelectionChangeEvent<T>` | `/** Fires after \`selected\` changes via user interaction (not via programmatic \`selected.set\`). Payload: \`{ selected, added, removed, previous }\`. */` |
| `expansionChange` | `TwRowExpansionChangeEvent<T>` | `/** Fires after a row is expanded or collapsed by user interaction. Payload: \`{ row, expanded, expandedRows }\`. */` |

### `ColumnComponent<T>` — selector `tw-column`

Generic: `ColumnComponent<T = unknown>`. Change detection: `OnPush`. Host: `display: none` (the column is pure metadata; its DOM is emitted into the CDK table's row outlets via `cdkColumnDef`).

#### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `name` | `string` (required) | — | `/** Unique identifier for this column. Used by \`*twRowDef\` / \`*twHeaderRowDef\` to reference the column, and as the CDK \`cdkColumnDef\` name. Required. */` |
| `sticky` | `TwColumnSticky` | `false` | `/** Sticky positioning. \`'start'\` pins the column to the leading edge; \`'end'\` pins to the trailing edge; \`false\` disables stickiness. Forwarded to \`CdkColumnDef.sticky\` / \`.stickyEnd\`. Defaults to \`false\`. */` |
| `align` | `TwColumnAlign` | `'start'` | `/** Horizontal text alignment for the column's cells. \`'end'\` is idiomatic for numeric columns. Defaults to \`'start'\`. */` |
| `hidden` | `boolean` | `false` | `/** When true, removes this column from the visible column set. Useful for toggle-column UIs. Defaults to \`false\`. */` |
| `hideBelow` | `TwBreakpoint \| null` | `null` | `/** Responsive visibility. When set and the viewport is below this breakpoint, the column is omitted from the visible column set (only applies when the parent's \`responsive === 'hide'\`). Defaults to \`null\`. */` |
| `width` | `string \| number \| null` | `null` | `/** CSS column width. Applied via inline \`style.width\` on the header and data cells. Only honoured when \`layout === 'fixed'\`. A number is treated as pixels; a string is passed through. Defaults to \`null\`. */` |
| `priority` | `number` | `0` | `/** Ordering hint for the default visible-columns list when no \`*twRowDef\` is declared. Lower numbers render first. Ties are broken by DOM order. Defaults to \`0\`. */` |
| `headerLabel` | `string \| undefined` | `undefined` | `/** Plain text header label. Used when no \`*twHeaderCellDef\` template is projected. Defaults to \`undefined\` (the column has no header). */` |
| `numeric` | `boolean` | `false` | `/** Convenience flag equivalent to \`align="end"\` + \`font-variant-numeric: tabular-nums\`. Overridden by an explicit \`align\`. Defaults to \`false\`. */` |
| `stackLabel` | `string \| undefined` | `undefined` | `/** Label emitted as \`data-label\` on cells when the parent's \`responsive === 'stack'\` engages. Fallbacks: \`headerLabel\`, then \`name\`. */` |

#### Public / internal API

- `templateRef` — injected from `TemplateRef` of the `<ng-container cdkColumnDef>` that the column renders; exposed to the parent table so it can lift the template into CDK's view container via `addColumnDef()`.
- `cellDef = contentChild(TwCellDefDirective)` — the cell template.
- `headerCellDef = contentChild(TwHeaderCellDefDirective)` — the header-cell template (optional; falls back to `headerLabel`).
- `footerCellDef = contentChild(TwFooterCellDefDirective)` — the footer-cell template (optional).

### Structural directives

All directives extend their CDK counterparts and `provide` themselves as the CDK token, so `CdkTable`'s content queries still match them:

```ts
@Directive({
  selector: '[twCellDef]',
  providers: [{ provide: CdkCellDef, useExisting: TwCellDefDirective }],
})
export class TwCellDefDirective<T> extends CdkCellDef {
  static ngTemplateContextGuard<T>(_: TwCellDefDirective<T>, ctx: unknown): ctx is TwCellContext<T> {
    return true;
  }
}
```

Same pattern for:

- `TwHeaderCellDefDirective` (`selector: '[twHeaderCellDef]'`, extends `CdkHeaderCellDef`)
- `TwFooterCellDefDirective<T>` (`selector: '[twFooterCellDef]'`, extends `CdkFooterCellDef`)
- `TwRowDefDirective<T>` (`selector: '[twRowDef]'`, extends `CdkRowDef<T>`) — aliases CDK's `cdkRowDefColumns` to `twRowDef` and `cdkRowDefWhen` to `twRowDefWhen`.
- `TwHeaderRowDefDirective` (`selector: '[twHeaderRowDef]'`, extends `CdkHeaderRowDef`) — aliases `cdkHeaderRowDef` to `twHeaderRowDef` and `cdkHeaderRowDefSticky` to `twHeaderRowDefSticky`.
- `TwFooterRowDefDirective` (`selector: '[twFooterRowDef]'`, extends `CdkFooterRowDef`)
- `TwNoDataRowDirective` (`selector: 'ng-template[twNoDataRow]'`, extends `CdkNoDataRow`)

**`TwRowExpansionDirective<T>`** is ngx-tw-specific — it captures a `TemplateRef<TwRowExpansionContext<T>>` plus an optional `[twRowExpansionWhen]` predicate (`(row: T, index: number) => boolean`, default: always true). Internally, the `TableComponent` creates a second `CdkRowDef` whose `when` predicate combines the user predicate AND `expandedRows().has(row)`.

### Supporting types

```ts
/** Context passed to every data-cell template. Generic over the row type \`T\`. */
export interface TwCellContext<T> {
  /** The row data (implicit \`let-row\`). */
  $implicit: T;
  /** The row, aliased for readability when the implicit is bound to something else. */
  row: T;
  /** The column's declared \`name\`. */
  column: string;
  /** Zero-based index within the rendered row list. */
  index: number;
  /** Zero-based column index in the visible column set. */
  columnIndex: number;
  /** True when this cell is in the first row. */
  first: boolean;
  /** True when this cell is in the last row. */
  last: boolean;
  /** True when the row index is even. */
  even: boolean;
  /** True when the row index is odd. */
  odd: boolean;
  /** Total number of rendered rows. */
  count: number;
}

/** Context passed to every header-cell template. */
export interface TwHeaderCellContext {
  /** The column's declared \`name\` (implicit \`let-column\`). */
  $implicit: string;
  /** The column's declared \`name\`, aliased. */
  column: string;
  /** Zero-based column index in the visible column set. */
  columnIndex: number;
}

/** Context passed to every footer-cell template. Generic over the row type \`T\`. */
export interface TwFooterCellContext<T> {
  /** The column's declared \`name\` (implicit). */
  $implicit: string;
  /** The column's declared \`name\`. */
  column: string;
  /** Zero-based column index in the visible column set. */
  columnIndex: number;
  /** Snapshot of all rows (for total/summary computations). */
  rows: readonly T[];
}

/** Context passed to \`*twRowExpansion\`. */
export interface TwRowExpansionContext<T> {
  /** The row whose expansion panel this template renders. */
  $implicit: T;
  /** The row, aliased. */
  row: T;
  /** The data index. */
  index: number;
  /** Method that collapses this row. */
  collapse: () => void;
}

/** Payload of \`rowClick\`. */
export interface TwRowClickEvent<T> {
  /** The clicked row. */
  row: T;
  /** Zero-based index in the rendered data. */
  index: number;
  /** The original DOM event. */
  event: MouseEvent;
}

/** Payload of \`selectionChange\`. */
export interface TwSelectionChangeEvent<T> {
  /** The full current selection. */
  selected: readonly T[];
  /** Rows added since the previous selection. */
  added: readonly T[];
  /** Rows removed since the previous selection. */
  removed: readonly T[];
  /** The previous selection. */
  previous: readonly T[];
}

/** Payload of \`expansionChange\`. */
export interface TwRowExpansionChangeEvent<T> {
  /** The row whose state changed. */
  row: T;
  /** Whether the row is now expanded. */
  expanded: boolean;
  /** The full set of expanded rows after the change. */
  expandedRows: ReadonlySet<T>;
}

/** i18n strings. */
export interface TwTableLabels {
  /** Accessible name when neither \`<caption>\`, \`ariaLabel\`, nor \`ariaLabelledby\` are provided. Dev-mode warning if used. */
  ariaLabel: string;
  /** Default empty-state message. */
  empty: string;
  /** Default loading message (for SR announcement). */
  loading: string;
  /** Default error prefix applied in front of \`String(error)\`. */
  errorPrefix: string;
  /** LiveAnnouncer template when rows are added/removed by data-source updates. Variables: \`{count}\`. */
  rowsUpdatedAnnouncement: string;
  /** LiveAnnouncer template for selection changes. Variables: \`{count}\`. */
  selectionAnnouncement: string;
  /** Accessible label for the row-expansion toggle button. */
  expandRowLabel: string;
  /** Accessible label for the collapse-row button. */
  collapseRowLabel: string;
}
```

Default labels live in a `DEFAULT_TABLE_LABELS: Readonly<TwTableLabels>` constant — same pattern as `DEFAULT_LABELS` in `paginator.ts`.

### Content projection (slot based)

| Slot | Mechanism | Fallback behaviour |
|---|---|---|
| Caption | element with `[slot="caption"]` | No fallback — renders `<caption>` only when projected. When present, the table's ARIA labelling prefers it over `ariaLabel`/`ariaLabelledby`. |
| Toolbar | element with `[slot="toolbar"]` | No fallback. Region above the scroll container. |
| Empty | element with `[slot="empty"]` | Fallback: icon + `labels.empty` message centered inside the body region. Rendered when the resolved data array is empty **and** `loading === false` **and** `error === null`. |
| Loading | element with `[slot="loading"]` | Fallback: `<tw-spinner>` or inline SVG spinner + `labels.loading` message (announced via `LiveAnnouncer`). Rendered as an overlay when `loading === true`. Preserves table column widths. |
| Error | element with `[slot="error"]` | Fallback: error icon + `labels.errorPrefix` + `String(error)`. Rendered when `error != null`. |
| Footer | element with `[slot="footer"]` | No fallback. Region below the table, above pagination. Used for totals/summaries that don't belong in `<tfoot>`. |
| Pagination | element with `[slot="pagination"]` | No fallback. Consumer projects `<tw-paginator>`. |

Detection via `contentChild` signal queries that look up by `[slot]` attribute. Follow the same pattern as `tw-card`.

## Composition diagram

```
<tw-table [data]="rows" [(selected)]="selectedRows" [(expandedRows)]="expanded">
│
├─ <caption slot="caption">Orders — last 30 days</caption>
│
├─ <div slot="toolbar" class="flex items-center justify-between">
│    <input twInput placeholder="Search…" />
│    <button twButton>Export</button>
│  </div>
│
├─ <tw-column name="id" sticky="start">
│    <ng-template *twHeaderCellDef>ID</ng-template>
│    <ng-template *twCellDef let-row>{{ row.id }}</ng-template>
│  </tw-column>
│
├─ <tw-column name="customer" headerLabel="Customer" stackLabel="Customer">
│    <ng-template *twCellDef let-row>{{ row.customer }}</ng-template>
│  </tw-column>
│
├─ <tw-column name="total" numeric headerLabel="Total" stickyEnd>
│    <ng-template *twCellDef let-row>{{ row.total | currency }}</ng-template>
│    <ng-template *twFooterCellDef let-rows>{{ sumTotal(rows) | currency }}</ng-template>
│  </tw-column>
│
├─ <ng-container *twHeaderRowDef="['id','customer','total']; sticky: stickyHeader()"/>
├─ <ng-container *twRowDef="let row; columns: ['id','customer','total']"/>
├─ <ng-container *twFooterRowDef="['id','customer','total']; sticky: stickyFooter()"/>
│
├─ <ng-template *twNoDataRow>
│    <td [attr.colspan]="visibleColumns().length">No matching orders</td>
│  </ng-template>
│
├─ <ng-template *twRowExpansion="let row">
│    <div class="p-4 bg-surface-sunken">{{ row.notes }}</div>
│  </ng-template>
│
├─ <div slot="empty">No orders yet — create one to get started.</div>
├─ <div slot="footer" class="px-4 py-2 text-sm text-fg-muted">Showing {{ visibleRowCount() }} of {{ total() }}</div>
└─ <tw-paginator slot="pagination" [(page)]="page" [totalItems]="total()" />
</tw-table>
```

## Usage examples

```html
<!-- Simplest: data array, three columns with inline header labels, no chrome. -->
<tw-table [data]="users" aria-label="Team members">
  <tw-column name="name" headerLabel="Name">
    <ng-template *twCellDef let-user>{{ user.name }}</ng-template>
  </tw-column>
  <tw-column name="email" headerLabel="Email">
    <ng-template *twCellDef let-user>{{ user.email }}</ng-template>
  </tw-column>
  <tw-column name="role" headerLabel="Role">
    <ng-template *twCellDef let-user>{{ user.role }}</ng-template>
  </tw-column>
  <ng-container *twHeaderRowDef="['name','email','role']" />
  <ng-container *twRowDef="let user; columns: ['name','email','role']" />
</tw-table>
```

```html
<!-- Sortable headers via tw-sort composition. No table-level sort code. -->
<tw-table [data]="sorted()" [twSort] [twSortActive]="active()" [twSortDirection]="direction()"
          (twSortChange)="onSort($event)">
  <tw-column name="name">
    <ng-template *twHeaderCellDef>
      <span tw-sort-header id="name">Name</span>
    </ng-template>
    <ng-template *twCellDef let-row>{{ row.name }}</ng-template>
  </tw-column>

  <tw-column name="age" numeric>
    <ng-template *twHeaderCellDef>
      <span tw-sort-header id="age">Age</span>
    </ng-template>
    <ng-template *twCellDef let-row>{{ row.age }}</ng-template>
  </tw-column>

  <ng-container *twHeaderRowDef="['name','age']" />
  <ng-container *twRowDef="let row; columns: ['name','age']" />
</tw-table>
```

```html
<!-- Sticky header + sticky first column + internal scroll. -->
<tw-table [data]="rows" stickyHeader scrollHeight="400px" variant="bordered">
  <tw-column name="id" sticky="start" width="80px">…</tw-column>
  <tw-column name="name">…</tw-column>
  <tw-column name="email">…</tw-column>
  <tw-column name="role">…</tw-column>
  <tw-column name="updatedAt">…</tw-column>
  <tw-column name="actions" sticky="end" width="100px">…</tw-column>
  <ng-container *twHeaderRowDef="['id','name','email','role','updatedAt','actions']; sticky: true" />
  <ng-container *twRowDef="let row; columns: ['id','name','email','role','updatedAt','actions']" />
</tw-table>
```

```html
<!-- Loading, empty, and error states. -->
<tw-table [data]="orders()" [loading]="loading()" [error]="error()">
  <tw-column name="id" headerLabel="ID">
    <ng-template *twCellDef let-order>{{ order.id }}</ng-template>
  </tw-column>
  <ng-container *twHeaderRowDef="['id']" />
  <ng-container *twRowDef="let order; columns: ['id']" />

  <div slot="empty" class="p-8 text-center">
    <tw-icon name="inbox" class="size-10 text-fg-subtle" />
    <p class="mt-2 text-fg-muted">No orders found.</p>
    <button twButton class="mt-4" (click)="create()">New order</button>
  </div>

  <div slot="error" class="p-8 text-center text-error-700">
    <tw-icon name="alert" class="size-10" />
    <p class="mt-2">Couldn't load orders. <button twButton variant="ghost" (click)="retry()">Retry</button></p>
  </div>
</tw-table>
```

```html
<!-- Row expansion. -->
<tw-table [data]="orders" multiTemplateRows [(expandedRows)]="expanded">
  <tw-column name="id">…</tw-column>
  <tw-column name="customer">…</tw-column>
  <tw-column name="total" numeric>…</tw-column>

  <ng-container *twHeaderRowDef="['id','customer','total']" />
  <ng-container *twRowDef="let order; columns: ['id','customer','total']" />

  <ng-template *twRowExpansion="let order; collapse as collapse">
    <div class="p-4 bg-surface-sunken">
      <p>Line items: {{ order.items.length }}</p>
      <button twButton variant="ghost" (click)="collapse()">Hide</button>
    </div>
  </ng-template>
</tw-table>
```

```html
<!-- Pagination composition. The table does NOT own pagination. -->
<tw-table [data]="page()" [trackBy]="trackById">
  <!-- columns… -->
  <tw-paginator
    slot="pagination"
    [(page)]="currentPage"
    [totalItems]="totalCount()"
    [pageSize]="pageSize"
    (pageChange)="loadPage($event)" />
</tw-table>
```

```html
<!-- Responsive 'stack' mode — below `md`, rows collapse to cards. -->
<tw-table [data]="users" responsive="stack" stackBelow="md">
  <tw-column name="name" stackLabel="Name">…</tw-column>
  <tw-column name="email" stackLabel="Email">…</tw-column>
  <tw-column name="role" stackLabel="Role">…</tw-column>
  <ng-container *twHeaderRowDef="['name','email','role']" />
  <ng-container *twRowDef="let user; columns: ['name','email','role']" />
</tw-table>
```

## Styling

### `tv()` config — multi-slot

Single `tv()` config in `table.ts`, `twMerge: true`. Slots:

```
slots:
  root            — outer <div> wrapper; owns rounded corner + bordered frame for 'bordered' variant
  toolbar         — wraps [slot="toolbar"]; flex container with padding + bottom border
  caption         — the <caption> element; text-left, text-sm, font-semibold, px-4 py-2
  scrollContainer — wraps the <table>; overflow-x-auto always; overflow-y-auto when scrollHeight set; 'min-w-full' so fixed layout fills width
  table           — the <table cdk-table> itself; w-full, border-collapse, text-sm
  thead           — the <thead>; bg-surface-muted (default variant) or nothing (striped)
  tbody           — the <tbody>; divide-y divide-border (default variant) or no dividers (bordered relies on cell borders)
  tfoot           — the <tfoot>; border-t border-border, bg-surface-muted
  tr              — base row; transition-colors duration-200 motion-reduce:transition-none
  th              — header cell; text-left font-semibold text-fg tracking-tight
  td              — data cell; text-fg align-middle
  footerTd        — footer cell; text-fg font-medium
  emptyState      — wrapper over [slot="empty"] fallback
  loadingState    — absolute-positioned overlay inside the scroll container
  errorState      — wrapper over [slot="error"] fallback
  footerSlot      — wraps [slot="footer"]; px + py + border-t border-border
  paginationSlot  — wraps [slot="pagination"]; border-t border-border
  stackCellLabel  — visible label in 'stack' responsive mode (rendered via ::before or a separate span)
```

Variants:

```
variant:
  default   — thead bg-surface-muted; tbody divide-y divide-border; tr hover:bg-surface-sunken
  striped   — thead bg-surface-muted; tbody no dividers; tr:nth-child(even) bg-surface-sunken; tr hover:bg-surface-muted
  bordered  — root border border-border-strong rounded-lg overflow-hidden;
              thead bg-surface-muted border-b border-border;
              td/th border-r border-border; tr:last-child td border-b-0; thead th border-r last:border-r-0
              tr hover:bg-surface-sunken

density:
  comfortable — td px-4 py-3; th px-4 py-3; footerTd px-4 py-3
  compact     — td px-3 py-1.5; th px-3 py-1.5; footerTd px-3 py-1.5

size:
  xs → table text-xs
  sm → table text-sm
  md → table text-sm
  lg → table text-base
  xl → table text-base

responsive:
  scroll → scrollContainer overflow-x-auto
  stack  → (handled via a responsive @container query or utility class — see "Stack mode" below)
  hide   → (handled via per-column computed class — see "Hide mode" below)

stickyHeader:
  true  → thead position applied by CDK via [sticky]; add class z-10 bg-surface-raised (so the header remains visible above scrolling body) on the thead
  false → no change

stickyFooter:
  true  → tfoot z-10 bg-surface-raised
  false → no change

layout:
  fixed → table table-fixed
  auto  → table table-auto

loading:
  true  → loadingState visible; tbody opacity-60 pointer-events-none
  false → loadingState hidden
```

Compound variants:

- `{ variant: 'bordered', density: 'compact' }` → `th: 'text-xs'` (denser bordered tables read better at xs font).
- `{ stickyHeader: true, variant: 'striped' }` → `thead: 'shadow-[0_1px_0_0_var(--color-border)]'` so the striped row underneath the sticky header doesn't bleed its background.

`defaultVariants`:

```
{ variant: 'default', density: 'comfortable', size: 'md', responsive: 'scroll',
  stickyHeader: false, stickyFooter: false, layout: 'auto', loading: false }
```

### Column alignment

`<tw-column>` has an `align` input (`'start' | 'center' | 'end'`) and a `numeric` convenience flag. The parent table maintains a computed `columnClasses(name)` helper that returns, per column, `text-start` / `text-center` / `text-end` and — for numeric — the additional `[font-variant-numeric:tabular-nums]` utility. The computed class is applied to both header and data cells of that column so header numbers align with body numbers.

### Row hover / focus / active

- Hover: `hover:bg-surface-sunken` (default + bordered variants) or `hover:bg-surface-muted` (striped).
- Focus within a row (via Tab to an interactive descendant): no explicit row styling — the focused element shows its own focus ring.
- Selected rows (v2): `bg-primary-50 dark:bg-primary-950` on the row. Documented for v2; inert in v1.

### Sticky positioning

CDK handles the positioning entirely. We only supply the **visual chrome** that sticky cells need:

- Sticky header: `bg-surface-raised` + `z-10` on `<thead>` so stacked headers stay opaque.
- Sticky footer: same treatment on `<tfoot>`.
- Sticky start column: `bg-surface-raised` on the column's `<th>` and `<td>` (so content underneath doesn't show through) + `after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border` for a subtle trailing edge.
- Sticky end column: mirror image (`after:left-0`).

Provide these via compound variants or per-column inline utility classes through the column-class computation.

### Stack responsive mode

When `responsive === 'stack'` and the viewport falls below `stackBelow`, the table restructures visually (no DOM rewrite — semantics preserved for screen readers):

- `<thead>` → `display: none` at narrow widths (still in the DOM for AT).
- `<tr>` → `display: block; border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 0.5rem; background-color: var(--color-surface-raised);`
- `<td>` → `display: flex; justify-content: space-between; padding: 0.25rem 0; border: 0;`
- `<td::before` → `content: attr(data-label); font-weight: 600; color: var(--color-fg-muted); margin-right: 1rem;`

The `data-label` attribute on each `<td>` is set from the column's `stackLabel` input (falling back to `headerLabel`, then `name`). Apply breakpoint-scoped Tailwind utilities — e.g., `max-md:block` on `<tr>`, `max-md:hidden` on `<thead>`, `max-md:flex max-md:justify-between` on `<td>`, `max-md:before:content-[attr(data-label)]` on `<td>`. Use the responsive prefix derived from the `stackBelow` input.

**Static class lookup** (Tailwind v4 static scanner requires fully-written classes):

```ts
const STACK_CELL_UTILITIES: Record<TwBreakpoint, string> = {
  sm: 'max-sm:flex max-sm:justify-between max-sm:gap-3 max-sm:py-1 max-sm:border-0 …',
  md: 'max-md:flex …',
  lg: 'max-lg:flex …',
  xl: 'max-xl:flex …',
};
// same shape for STACK_ROW_UTILITIES, STACK_THEAD_UTILITIES, STACK_LABEL_UTILITIES.
```

Applied per row/cell via `[class]` binding.

### Hide responsive mode

`<tw-column [hideBelow]="'md'">` + `<tw-table responsive="hide">` removes the column from the rendered `displayedColumns` set below the `md` breakpoint. Implement two ways:

1. **CSS approach (v1, preferred):** compute a `max-md:hidden` utility per column from a `HIDE_BELOW_UTILITIES: Record<TwBreakpoint, string>` static map. Apply to the column's `<th>` and `<td>` classes via `[class]`. No re-rendering of the table. Sticky positioning still works because CDK treats the cells as present.
2. **JS approach (v2):** listen for viewport resize, recompute `visibleColumns()`, and rebuild the displayed column set. More flexible (for `sticky` recalculation) but triggers a layout rebuild. **Do not ship in v1.**

### Animations

Row entry/exit: **only when `rowAnimations === true`**, apply `animate.enter="fade-in"` to rows. Use the existing `fade-in` class in `theme/_base.css` — no new keyframes required. Off by default because every data change would re-animate.

Loading-state overlay: the overlay slot uses `animate.enter="fade-in" animate.leave="fade-out"` when it appears/disappears. Existing classes.

### Visual-design-system compliance

- Radius: `rounded-lg` on the root wrapper for `bordered` variant; `rounded-none` otherwise (table rows stay flat against the flow). Matches CLAUDE.md's "standard containers" rule.
- Spacing: `px-4 py-3` (comfortable) / `px-3 py-1.5` (compact) on cells — aligned with the "container padding" scale (`md` = 1 rem → `p-4`; we split into horizontal/vertical to emphasise row density).
- Typography: `text-sm` at `md` size, `text-xs` at `xs`, `text-base` at `lg`/`xl`. Headers: `font-semibold`. Footers: `font-medium`.
- Shadow: none on the table. `shadow-sm` on the sticky header in the compound variant noted above.
- Focus ring: inherited from whichever interactive child has focus — the table itself does not display a ring.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on rows for hover.
- Borders: `border-border` for structural dividers, `border-border-strong` for the bordered variant's outer frame, `border-border` for internal grid lines in bordered mode.
- Overflow: `overflow-x-auto` on the scroll container; `overflow-y-auto` when `scrollHeight` is set; `overflow-hidden` on the root wrapper only for the `bordered` variant (so the rounded corners clip).
- Icons: `size-5` for the empty-state icon, `size-10` for the large empty-state illustration slot, `size-4` for inline icons in header cells (e.g., sort arrow). `shrink-0` on every flex-child icon.
- Hover: `hover:bg-surface-sunken` (default/bordered) and `hover:bg-surface-muted` (striped) on rows.

No raw Tailwind palette colors anywhere. No `neutral-*` for structural styling.

## Accessibility

- **Native `<table>` semantics.** The table element carries `role="table"` by default (provided by the browser and reinforced by CDK). We do NOT override the role.
- **`<caption>`.** When `[slot="caption"]` is projected, render it as a `<caption>` inside `<table>` (caption must be the first child of `<table>`). Prefer `<caption>` as the accessible name over `aria-label`/`aria-labelledby`.
- **`<thead>` / `<tbody>` / `<tfoot>`.** Native sectioning. CDK emits them automatically.
- **`scope="col"`** on every `<th>` in the header row. CDK's `CdkHeaderCell` does this automatically when the table is native; verify in tests.
- **`scope="row"`** is NOT applied automatically — consumers who have a leading identifier column (e.g., "name") should project their header cell as a `<th scope="row">` inside `*twCellDef`. Document this in usage examples.
- **`aria-rowcount` / `aria-colcount`.** Optional. Apply only when virtualization is enabled (v2). Not needed in v1.
- **`aria-label` / `aria-labelledby`.** The table's host element (the outer `<div>`) carries no role; the `<table>` inside carries `[attr.aria-label]="ariaLabel()"` and `[attr.aria-labelledby]="ariaLabelledby()"` when `<caption>` is absent. Dev-mode warning via `afterNextRender` + `isDevMode()` when neither `<caption>`, `ariaLabel`, nor `ariaLabelledby` is provided. Mirror the `tw-select` warning pattern.
- **`aria-sort`.** Handled by `SortHeaderComponent` when composed — not the table's responsibility.
- **Sticky column announcement.** Not needed. Sticky columns are purely visual.
- **Row-selection ARIA (v2 prep).** When `selectable === true` (v1): each row's first cell contains a projected checkbox whose `aria-label` is derived from the row data via a consumer-supplied template (v2 implementation). For v1, the API is declared but the default rendering is inert.
- **Row expansion ARIA.** When `*twRowExpansion` is declared, every expandable row must have a leading interactive element (typically a button) that the consumer declares inside a column's `*twCellDef`. That button gets `[attr.aria-expanded]="expandedRows().has(row)"` and `[attr.aria-controls]="expansionId(row, index)"`. The expansion `<tr>` gets `[id]="expansionId(row, index)"` + `role="row"` (native). Consumers are responsible for adding the button — the table does not inject it automatically (too opinionated).
- **Loading announcement.** When `loading` transitions from `false` → `true`, announce `labels.loading` politely via `LiveAnnouncer`. On `true` → `false`, announce the new row count using `labels.rowsUpdatedAnnouncement`.
- **Selection announcement (v2).** After each user-driven selection change, announce `labels.selectionAnnouncement` (e.g., "3 rows selected"). Hold for v2.
- **Keyboard.** No arrow-key cell navigation in v1. `Tab` moves through interactive descendants in DOM order — sufficient for common use. Document that APG-compliant "grid" pattern (arrow keys, `F2` to enter edit mode) is out of scope for v1 and tracked as a v2 addition.
- **RTL.** CDK `CdkTable` reads `Directionality` and flips sticky-start / sticky-end positioning automatically. Confirm in tests with `<div dir="rtl">`.
- **AXE / WCAG AA.** Every state (default, loading, empty, error, striped, bordered, compact, sticky, stack) must pass AXE. Verify contrast of `text-fg-muted` on `bg-surface-muted` for the `<thead>` in `default` variant (approx 4.5:1 in the default theme).
- **Reduced motion.** All hover transitions use `motion-reduce:transition-none`. The `fade-in` animation has a reduced-motion override in `theme/_base.css`.

## Edge cases

| Edge case | Behaviour |
|---|---|
| Empty data (`data === []` and not loading and no error) | Render the empty slot (fallback: icon + `labels.empty`). CDK's `*twNoDataRow` template, if declared, replaces the entire `<tbody>` row; the projected `[slot="empty"]` renders outside the `<tbody>` as an overlay-style region when no `*twNoDataRow` is provided. **Rule:** `*twNoDataRow` takes precedence; if absent, `[slot="empty"]` is used; if that's absent, the fallback icon+message is used. |
| Loading with preserved widths | When `loading === true`, keep the current `<tbody>` rows visible at `opacity-60 pointer-events-none` and overlay the loading slot on top. Do not swap rows for skeletons — consumers who want skeletons project them into `[slot="loading"]` and the table covers the body entirely. If `data` is empty and `loading === true`, render ONLY the loading slot (there are no rows to preserve). |
| Error | When `error != null`, replace the `<tbody>` with the error slot. `data` is ignored while `error` is set. Consumers reset by setting `error = null`. |
| Very long cell content | Default `<td>`: `align-middle`. No truncation by default — content wraps. Consumers who want single-line truncation set `class="truncate"` on a span inside `*twCellDef` and pair it with a tooltip (`twTooltip`). Document in usage examples. Do NOT truncate automatically. |
| Very many columns | Horizontal scroll via `overflow-x-auto`. Combine with `sticky="start"` on the ID column and `sticky="end"` on the actions column for the canonical admin-table pattern. |
| Row click with interactive descendants | Suppress `rowClick` when `event.target` is an interactive element (`button`, `a`, `input`, `select`, `textarea`, or anything with `[tabindex]` or `role="button"`). Use `event.composedPath()` + a predicate in the click handler. |
| Duplicate `name` on two `<tw-column>` children | Throw in dev mode: `"tw-table: duplicate column name 'xyz'"`. Use the same registration-set pattern as `SortDirective`. |
| Column's `*twRowDef` references a name that doesn't match any `<tw-column>` | CDK already throws; the table should catch and surface a clearer error: `"tw-table: row template references column 'xyz' which does not exist"`. Dev-mode only. |
| `stickyHeader === true` without `scrollHeight` | Sticky still works if an ancestor is scrollable. If neither is scrollable, the sticky class is inert — harmless, document only. |
| `responsive === 'stack'` with sticky columns | Sticky positioning is disabled in stack mode (the layout becomes `display: block`). CDK detaches sticky classes; our compound variant enforces `sticky: false` visually below `stackBelow`. Document in an inline comment. |
| `multiTemplateRows === false` but `*twRowExpansion` is declared | Throw in dev mode: `"tw-table: *twRowExpansion requires [multiTemplateRows]=\"true\""`. |
| `trackBy` changes mid-stream | CDK handles it — it re-runs the differ. No extra work. |
| Data source switched (`T[]` → `Observable<T[]>`) | CDK handles it. |
| `data` is an `Observable` that errors | CDK propagates the error to the console. Not the table's responsibility to render — consumers use their own `catchError` before piping into `data`, or set `error` explicitly. Document. |
| Row with `null` / `undefined` data | CDK renders whatever is in the array; templates should null-guard. Not the table's problem. |
| RTL | CDK flips sticky-start/end automatically. Test with `<tw-table dir="rtl">` wrapped in a `dir="rtl"` container. |
| Very wide table inside a narrow flex parent | `scrollContainer` uses `overflow-x-auto`; `min-w-0` on the parent is the consumer's responsibility. Document. |
| Reduced motion | Inherited from CLAUDE.md — all Tailwind transitions include `motion-reduce:transition-none`; the `fade-in` keyframe has a `prefers-reduced-motion` override in `theme/_base.css`. |
| Deferred loading + caption announcement | When `<caption>` is absent and `loading` is true on first render, `LiveAnnouncer` announces `labels.loading` politely. When loading resolves, it announces `labels.rowsUpdatedAnnouncement`. |
| Selection API declared but v2 rendering | `selectable === true` reserves space for the selection column (adds `_selection` to `displayedColumns` when `*twRowDef` doesn't explicitly list it). The column renders an empty `<th>`/`<td>` in v1 — clearly visible so consumers know the slot exists. Final checkbox rendering ships in v2. |

## Open questions / `[CONFIRM]` items

- **Row selection completeness.** v1 ships the API (`selectable`, `selected`, `selectionChange`, `*twRowSelectCell` slot for the checkbox cell template) but not the default checkbox rendering. Should v1 ship the default rendering too (requires a `tw-checkbox` dependency in the table's entry point), or is the API-only surface sufficient? **Recommendation:** API only. [CONFIRM]
- **Sticky-edge shadows.** When a sticky column hides content behind it, some tables draw a subtle shadow on the sticky edge so users know content is clipped. Material does this via `STICKY_POSITIONING_LISTENER`. **Recommendation:** skip in v1 (shadow-less sticky). [CONFIRM]
- **Selection column position.** When `selectable` is true but the consumer's `*twRowDef` doesn't include `_selection` in its columns list, should the table auto-prepend it? **Recommendation:** yes, auto-prepend. Behavior must be documented. [CONFIRM]
- **Default ARIA label when neither caption nor `ariaLabel` is set.** Dev-mode warning only, or throw? **Recommendation:** warn, never throw — mirrors `tw-select`'s pattern. [ASSUMED SAFE]
- **Row animations on first render.** When `rowAnimations === true`, should the initial render animate every row, or skip the first render and animate only subsequent changes? **Recommendation:** skip first render — matches tabs' lazy-panel pattern and avoids a "flash of animation" on navigation. [CONFIRM]
- **`TwBreakpoint` added to `ngx-tw/core`.** This is a new shared type. Confirm it belongs in `core` (used by table + potentially future responsive components) rather than being table-local. **Recommendation:** add to `core`. [CONFIRM]
- **Stack mode DOM.** Does stacking via CSS (keeping `<table>`/`<tr>`/`<td>` in the DOM) vs swapping to a `<div>` card layout matter for AT users? CSS-only preserves semantics but can confuse some older screen readers. **Recommendation:** CSS-only approach in v1; revisit if user-testing surfaces issues. [CONFIRM]

## File structure

Under `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/table/`:

- **`table.ts`** — `TableComponent<T>`, `ColumnComponent<T>`, all structural directives (`TwCellDefDirective`, `TwHeaderCellDefDirective`, `TwFooterCellDefDirective`, `TwRowDefDirective`, `TwHeaderRowDefDirective`, `TwFooterRowDefDirective`, `TwNoDataRowDirective`, `TwRowExpansionDirective`). All public types (`TwTableVariant`, `TwTableDensity`, `TwTableResponsive`, `TwTableLayout`, `TwColumnAlign`, `TwColumnSticky`, `TwTableLabels`, `TwCellContext<T>`, `TwHeaderCellContext`, `TwFooterCellContext<T>`, `TwRowContext<T>`, `TwRowExpansionContext<T>`, `TwRowClickEvent<T>`, `TwSelectionChangeEvent<T>`, `TwRowExpansionChangeEvent<T>`, `TwTableDataSourceInput<T>`). The `tv()` config. Static `Record<TwColor, string>` / `Record<TwBreakpoint, string>` lookup maps (`STACK_CELL_UTILITIES`, `STACK_ROW_UTILITIES`, `STACK_THEAD_UTILITIES`, `STACK_LABEL_UTILITIES`, `HIDE_BELOW_UTILITIES`, `ALIGN_CLASSES`). Module-scoped `nextTableId` counter. `DEFAULT_TABLE_LABELS` constant.
- **`table.html`** — external template for `TableComponent` (will exceed 50 lines — it contains caption, toolbar, scroll container, `<table cdk-table>` with header/data/footer row defs, no-data row template projection, empty/loading/error overlays, footer slot, pagination slot).
- **`column.html`** — external template for `ColumnComponent` if it grows past 50 lines; otherwise keep inline. The template is one `<ng-container cdkColumnDef="{{name()}}">` with nested `<th cdk-header-cell>` / `<td cdk-cell>` / `<td cdk-footer-cell>` elements, each conditionally projecting the corresponding `*twHeaderCellDef` / `*twCellDef` / `*twFooterCellDef` template (or the `headerLabel` string fallback) via `*ngTemplateOutlet`.
- **`table.spec.ts`** — Vitest tests (see "Testing plan" below).
- **`index.ts`** — public API exports.
- **`ng-package.json`** — `{ "lib": { "entryFile": "index.ts" } }`.

Also update:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — add `TwBreakpoint`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/index.ts` — re-export `TwBreakpoint`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/table';`.
- **No theme file edits.** `fade-in`/`fade-out` already exist in `projects/ngx-tw/theme/_base.css`.

## Public API exports

```ts
// projects/ngx-tw/table/index.ts
export {
  TableComponent,
  ColumnComponent,
  TwCellDefDirective,
  TwHeaderCellDefDirective,
  TwFooterCellDefDirective,
  TwRowDefDirective,
  TwHeaderRowDefDirective,
  TwFooterRowDefDirective,
  TwNoDataRowDirective,
  TwRowExpansionDirective,
  DEFAULT_TABLE_LABELS,
} from './table';

export type {
  TwTableVariant,
  TwTableDensity,
  TwTableResponsive,
  TwTableLayout,
  TwColumnAlign,
  TwColumnSticky,
  TwTableLabels,
  TwTableDataSourceInput,
  TwCellContext,
  TwHeaderCellContext,
  TwFooterCellContext,
  TwRowContext,
  TwRowExpansionContext,
  TwRowClickEvent,
  TwSelectionChangeEvent,
  TwRowExpansionChangeEvent,
} from './table';

// Re-exports from CDK so consumers don't depend on @angular/cdk/table directly.
export { DataSource } from '@angular/cdk/collections';
```

`CdkTable`, `CdkColumnDef`, `CdkCellDef`, etc. are NOT re-exported — consumers use our `tw`-prefixed names.

## Implementation notes

### Parent/child coordination (`tw-table` ↔ `tw-column`)

- `TableComponent` queries its columns with `contentChildren(ColumnComponent)`.
- Each `ColumnComponent` in its `ngOnInit` calls `tableComponent.registerColumn(this)` so the table can detect duplicates and build its internal `columnMap: Map<string, ColumnComponent<T>>` reactively. Use `inject(TableComponent, { optional: true })` in the column; throw in dev mode if no parent.
- The column's inline template is:

```html
<ng-container [cdkColumnDef]="name()" [sticky]="sticky() === 'start'" [stickyEnd]="sticky() === 'end'">
  <th cdk-header-cell *cdkHeaderCellDef [class]="headerClasses()"
      [style.width]="resolvedWidth()" [attr.data-column]="name()">
    @if (headerCellDef(); as def) {
      <ng-container *ngTemplateOutlet="def.templateRef; context: headerContext()" />
    } @else if (headerLabel()) {
      {{ headerLabel() }}
    }
  </th>
  <td cdk-cell *cdkCellDef="let row; let i = index; let c = count; let f = first; let l = last; let e = even; let o = odd"
      [class]="cellClasses()"
      [style.width]="resolvedWidth()"
      [attr.data-label]="stackDataLabel()"
      [attr.data-column]="name()">
    @if (cellDef(); as def) {
      <ng-container *ngTemplateOutlet="def.templateRef;
        context: { $implicit: row, row: row, column: name(), index: i, columnIndex: columnIndex(),
                    first: f, last: l, even: e, odd: o, count: c }" />
    }
  </td>
  @if (footerCellDef(); as def) {
    <td cdk-footer-cell *cdkFooterCellDef [class]="footerClasses()" [style.width]="resolvedWidth()">
      <ng-container *ngTemplateOutlet="def.templateRef; context: footerContext()" />
    </td>
  }
</ng-container>
```

- When the column is **hidden** (`hidden()` is true OR `hideBelow` is matched by the current viewport), the column still registers with CDK but the table omits it from `displayedColumns`.

### Dynamic `displayedColumns`

- The table maintains `visibleColumns = computed<string[]>(() => ...)` that filters out hidden columns.
- When no `*twRowDef` / `*twHeaderRowDef` is declared, the table synthesises default row defs from `visibleColumns()` ordered by `priority`, then DOM order. Use `CdkTable.addHeaderRowDef()` / `.addRowDef()` programmatically.
- When `*twRowDef` IS declared, the user controls the columns list. The table does not override.

### Expansion rows

- When `multiTemplateRows() === true` AND a `TwRowExpansionDirective<T>` is projected, the table programmatically adds a second `CdkRowDef` whose template wraps a single `<tr class="expansion-row">` containing `<td [attr.colspan]="visibleColumns().length">` with the projected expansion template's outlet. Its `when` predicate is `(index, row) => expandedRows().has(row) && userWhen(row, index)` (where `userWhen` defaults to `true`).
- The expansion `<tr>` inherits ARIA from its parent row implicitly (native table semantics). No extra role.

### Data-source wiring

- `data()` is piped directly into CDK: `this._cdkTable.dataSource = this.data();`. `CdkTable` accepts all three input shapes natively.
- `trackBy()` is forwarded to `CdkTable.trackBy`.
- `loading()`, `error()`, `data === []` drive the empty/loading/error slot visibility via `computed()`.

### Selection (v1 API, v2 implementation)

- Expose `selected = model<readonly T[]>([])` and an internal `selectionSet = computed(() => new Set(selected()))` for O(1) lookups.
- When `selectable() === true`, prepend `'_selection'` to `displayedColumns` unless a `*twRowDef` explicitly includes or omits it.
- Ship a placeholder `<tw-column name="_selection">` synthesised internally. In v1, its cells are empty `<td>` elements sized to `w-10`. In v2, render a `<tw-checkbox>` whose state mirrors `selectionSet.has(row)`.

### Sort composition

The table never touches sort state. Consumers apply `[twSort]` on the `<tw-table>` host (it flows through to the table's root `<div>`, which is an acceptable scope — `SortDirective` is a container-only directive with no element requirements) and use `[tw-sort-header]` inside `*twHeaderCellDef`. **Nothing to implement in the table.** Document the recipe in usage examples.

### Dev-mode validation

In the constructor, after `afterNextRender`:

1. Warn when the table has no accessible name (no `<caption>`, no `ariaLabel`, no `ariaLabelledby`).
2. Throw when two columns have the same `name`.
3. Throw when `*twRowExpansion` is declared without `multiTemplateRows === true`.
4. Throw when a row def references a column name that no `<tw-column>` declares.

All checks guarded by `isDevMode()`.

### Internal IDs

```ts
let nextTableId = 0;
// …
readonly hostId = `tw-table-${nextTableId++}`;
readonly expansionId = (row: T, index: number) => `${this.hostId}-expansion-${index}`;
```

### Constraints during implementation

- No arrow functions in templates — use methods or computeds (`headerClasses()`, `cellClasses()`, `isRowExpanded(row)`).
- No `ngClass` / `ngStyle` — `[class]` / `[style.*]`.
- No `@HostBinding` / `@HostListener` — `host:` object only.
- Signal APIs only: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`, `signal()`, `contentChild()`, `contentChildren()`, `viewChild()`, `effect()`. No `mutate` on signals.
- No RxJS in component logic except bridging CDK's `Subject`/`BehaviorSubject` streams (`contentChanged`, `viewChange`). Use `takeUntilDestroyed`.
- No `@angular/animations`. Row/slot animations use `animate.enter`/`animate.leave` with existing theme classes.
- All class strings statically present in source — static `Record<…, string>` lookup tables, not template-literal concatenation.
- `OnPush` on every component.
- `inject()` for DI — no constructor injection.
- Strict typing — no `any`. Generic `T` propagates through `TableComponent`, `ColumnComponent`, every directive, every context, every event.
- `tv()` includes `defaultVariants` and `{ twMerge: true }`.

## Testing plan

File: `table.spec.ts`. Explicit Vitest imports (`import { describe, it, expect, vi, beforeEach } from 'vitest'`) and `ComponentFixture` / `TestBed` from Angular. Import `CdkTableModule` when declaring test hosts directly (the table's own imports bring it in). No `fakeAsync`/`tick` — use `async/await` + `fixture.whenStable()` or `vi.useFakeTimers()` / `vi.runAllTimers()`.

Define small test hosts parameterised over row type:

- `BasicTableHost` — 3 rows, 3 columns, inline `headerLabel`, no slots.
- `TemplatedTableHost` — all cells use `*twCellDef` / `*twHeaderCellDef`.
- `StickyTableHost` — sticky header + sticky start column + `scrollHeight`.
- `DataSourceTableHost` — Observable data source.
- `ExpansionTableHost` — `multiTemplateRows` + `*twRowExpansion`.
- `SortedTableHost` — wraps the table in `[twSort]` + `[tw-sort-header]` composition.
- `StackResponsiveTableHost` — `responsive="stack"` + `stackBelow="md"`.
- `LoadingErrorTableHost` — signals to toggle `loading` / `error` / empty.
- `NoDataRowTableHost` — projects `*twNoDataRow`.

### What to cover

**Rendering (default)**
- Mounts without error with an empty `data` and no columns (renders the empty slot).
- Mounts with 3 columns and 3 rows → renders 1 `<thead>` row + 3 `<tbody>` rows + 0 `<tfoot>` rows.
- `<table>` element is present and has the expected classes.
- Each `<th>` has `scope="col"` (verified via `queryAll(By.css('th[scope="col"]')).length`).
- `aria-label` appears on the `<table>` when set.
- Dev-mode warning is logged (spy on `console.warn`) when no accessible name is provided.

**Rendering (every variant)**
- Each `variant` (`default`, `striped`, `bordered`) renders without errors and the expected `<table>`/`<thead>`/`<tr>` classes are applied.
- Each `density` (`comfortable`, `compact`) renders expected cell padding classes.
- Each `size` renders expected font-size classes.
- Each `layout` renders with/without `table-fixed`.
- `stickyHeader={true}` applies the CDK sticky positioning (CDK adds `cdk-table-sticky` — test for its presence).
- `stickyFooter={true}` same.

**Columns**
- Declaring `<tw-column name="x">` registers the column; the table's internal column map includes `x`.
- Duplicate names throw in dev mode.
- `hidden={true}` removes the column from the rendered DOM (count of cells decreases).
- `align="end"` applies `text-end` to the column's cells.
- `numeric={true}` applies `text-end` and `tabular-nums`.
- `width="200px"` applies `style="width: 200px"` to header and data cells when `layout="fixed"`.
- `sticky="start"` sets `[sticky]=true` on the CDK column def; `sticky="end"` sets `[stickyEnd]=true` (verify via CDK's applied `cdk-table-sticky` class).

**Row definition / row rendering**
- Default rendering synthesises a row def from the visible columns in DOM order.
- Explicit `*twRowDef="let row; columns: [...]"` overrides the default.
- `*twRowDef [when]="predicate"` combined with `multiTemplateRows=true` renders the matching row template per row.

**Templates**
- `*twCellDef let-row="$implicit"` receives the row value.
- `*twCellDef` context exposes `index`, `first`, `last`, `even`, `odd`, `count`, `column`, `columnIndex` — verify each.
- `*twHeaderCellDef` context exposes `column`, `columnIndex`.
- `*twFooterCellDef` context exposes `rows`.
- `headerLabel` is rendered when no `*twHeaderCellDef` is provided; the template replaces it when provided.

**Data source**
- `data: T[]` renders each row.
- `data: Observable<T[]>` renders each emission; emitting a new array updates the DOM.
- `data: DataSource<T>` connects on init and disconnects on destroy (spy on `connect` / `disconnect`).
- `trackBy` is forwarded to CDK (spy on the fn — verify called with `(index, row)`).

**States**
- `loading=true` renders the loading slot; default fallback shows a spinner.
- `loading=true` applies `opacity-60 pointer-events-none` to `<tbody>`.
- `error="fail"` renders the error slot; default fallback shows `labels.errorPrefix + "fail"`.
- `data=[]` with no `*twNoDataRow` renders the `[slot="empty"]` fallback.
- `*twNoDataRow` takes precedence over the empty slot when data is empty.

**Slots**
- `[slot="caption"]` renders as a `<caption>` element inside `<table>`.
- `[slot="toolbar"]` renders above the scroll container.
- `[slot="footer"]` renders below the table.
- `[slot="pagination"]` renders in the pagination region.
- All slots absent → no corresponding region in the DOM.

**Expansion**
- With `*twRowExpansion` + `multiTemplateRows=true`, adding a row to `expandedRows` renders the expansion `<tr>` directly after the main row.
- Removing the row from `expandedRows` removes the expansion `<tr>`.
- `(expansionChange)` emits with the correct `{ row, expanded, expandedRows }` payload.
- `*twRowExpansion` without `multiTemplateRows=true` throws in dev mode.
- The `collapse()` helper in the expansion context removes the row from `expandedRows`.

**Selection API (v1: declared, not rendered)**
- `selectable=true` prepends `_selection` to the rendered column set.
- `selected` and `selectedChange` round-trip with two-way binding.
- Setting `selected` programmatically does NOT emit `selectionChange` (only user interaction does).

**Sort composition**
- Wrapping `<tw-table twSort>` and placing `<span tw-sort-header id="x">` inside `*twHeaderCellDef` toggles `aria-sort` on the header.
- `(twSortChange)` fires from the sort directive — the table has no role in this.

**Responsive**
- `responsive="scroll"` applies `overflow-x-auto` on the scroll container.
- `responsive="stack"` + `stackBelow="md"` applies the stack utilities at narrow widths (verify classes, not the actual viewport — use the static class map lookup).
- `responsive="hide"` + `<tw-column hideBelow="md">` applies `max-md:hidden` on the column's cells.
- `stackLabel` appears as `data-label` attribute on each cell in stack mode.

**Row click**
- Clicking a `<tr>` emits `rowClick` with `{ row, index, event }`.
- Clicking a `<button>` inside a cell does NOT emit `rowClick`.
- Clicking an `<a>` inside a cell does NOT emit `rowClick`.
- `rowClick` is suppressed on elements with `role="button"` or `[tabindex]`.

**Accessibility**
- Table has `role="table"` (native).
- Each `<th>` has `scope="col"`.
- `<caption>` is the first child of `<table>` when projected.
- `aria-label` mirrors the input.
- Dev-mode warning fires (spy on `console.warn`) when no accessible name is set.
- `<tr>` with expansion has the correct `aria-expanded` on the consumer-supplied toggle button (from the composition example).
- `LiveAnnouncer.announce` is called when `loading` toggles (spy on `LiveAnnouncer`).
- `LiveAnnouncer.announce` is called on data updates with the row count template applied.

**RTL**
- Wrapping the table in `<div dir="rtl">` flips sticky-start/end (verify by reading `transform` or CDK's emitted classes on sticky cells).

**Cleanup**
- Destroying the component disposes the data-source subscription.
- Detached columns (e.g., `@if` around `<tw-column>`) deregister from the table.

## Out of scope for v1

Document explicitly in the prompt and in a code comment at the top of `table.ts`:

- **Column resize.** Not implemented. Consumers can implement via `<tw-column [width]>` with manual JS on a separator drag handle.
- **Virtualization.** CDK supports `CdkVirtualScrollViewport` around `<table cdk-table>`. Not wired in v1. Plan for v2: add a `virtualize: boolean` input that wraps the scroll container in `<cdk-virtual-scroll-viewport>` with `itemSize`. The existing API survives unchanged.
- **Inline editing.** No cell-edit mode. Consumers render their own inputs inside `*twCellDef` and bind to their forms.
- **Complex filtering UI.** The table has no filter inputs, filter state, or filter panel. Consumers filter `data` upstream and drop their filter UI in `[slot="toolbar"]`.
- **Arrow-key cell navigation (APG "grid" pattern).** `Tab` through interactive descendants only in v1. v2 may add a `keyboardMode: 'none' | 'grid'` input.
- **Column reordering (drag to reorder).** Not implemented. Consumers reorder `displayedColumns` manually via `*twRowDef`.
- **Row drag-and-drop.** Not implemented. Composable with `@angular/cdk/drag-drop` at the consumer layer.
- **Full row-selection rendering (v1 ships only the API).** See "Open questions".
- **Sticky-edge shadows.** See "Open questions".
- **Server-side paging/sort integration presets.** Consumers wire their own — the table is source-agnostic.

## Constraints

- Wrap `CdkTable` — do NOT extend. Use the `<table cdk-table>` in-template composition pattern documented above.
- All column/row definitions are thin subclasses of their CDK counterparts with `provide: { provide: CdkXDef, useExisting: TwXDef }` so CDK's content queries still match.
- Standalone components and directives. Do NOT set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush` on every component.
- Signal APIs only: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`, `signal()`, `contentChild()`, `contentChildren()`, `viewChild()`, `effect()`. No `mutate`. No RxJS in component logic except bridging CDK-returned Observables (use `takeUntilDestroyed`).
- `inject()` for DI — no constructor injection.
- `host:` object only — never `@HostBinding`/`@HostListener`.
- Native control flow (`@if`, `@for`, `@switch`); no `ngClass`/`ngStyle`; no arrow functions in templates.
- Tailwind utilities only, no CSS files. Semantic color tokens (`primary-*`, `info-*`, etc.). Surface/fg/border tokens for neutral structural styling. **Never** raw palette colors (`blue-*`, `red-*`, `gray-*`). **Never** raw `neutral-*` for structural styling.
- `tv()` includes `defaultVariants` and `{ twMerge: true }`.
- All class strings statically present in source — static `Record<TwColor, string>` / `Record<TwBreakpoint, string>` lookup tables, not template-literal concatenation.
- Visual tokens (radius `rounded-lg` on bordered variant, spacing from the inline-padding scale, shadows only where documented, transitions `duration-200 motion-reduce:transition-none`, focus rings where interactive descendants live, icon sizes `size-4`/`size-5`/`size-10`) match CLAUDE.md's Visual Design System exactly. No invented values.
- No `@angular/animations`. Row / slot enter-leave uses `animate.enter="fade-in"` / `animate.leave="fade-out"` with existing keyframes in `projects/ngx-tw/theme/_base.css`.
- Every `input()`, `output()`, `model()`, exported type member, and public method has a one-line JSDoc.
- Strict typing — no `any`. Generic `T` propagates through `TableComponent<T>`, `ColumnComponent<T>`, every template context, every event payload.
- Add `TwBreakpoint` to `ngx-tw/core/types.ts` and re-export from `core/index.ts`.
- Vitest tests: `vi.spyOn()`, `async/await`, `fixture.whenStable()`. No `fakeAsync`/`tick`.
- Dev-mode warnings / throws guarded by `isDevMode()`.
- `animate.enter="fade-in"` on rows is opt-in via `rowAnimations` — **off** by default.
- RTL: verify CDK's sticky flip behaviour in tests. The table itself does not read `Directionality`; CDK handles it.
- Accessible name: dev-mode `console.warn` when neither `<caption>`, `ariaLabel`, nor `ariaLabelledby` is provided — mirror the `tw-select` pattern.
