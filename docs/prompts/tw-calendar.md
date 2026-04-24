# tw-calendar — Calendar component (base for date & date-range pickers)

## Purpose

A self-contained, accessible calendar that can be used standalone (form-compatible) OR composed inside a date / date-range picker overlay. Mirrors the structural decomposition of Angular Material's calendar (month / year / multi-year views backed by a shared grid primitive and an abstract date adapter) but styled with Tailwind v4 semantic tokens and built around Angular v21 signals.

## Composition & public surface

Each of the following is exported from `ngx-tw/calendar`:

| Export | Kind | Purpose |
|---|---|---|
| `CalendarComponent` | Component (`tw-calendar`) | Top-level orchestration — header + the current view. Form-compatible (CVA). |
| `CalendarHeaderComponent` | Component (`tw-calendar-header`) | Standalone header with previous / next / period buttons. Can be used alone. |
| `CalendarBodyComponent` | Component (`tw-calendar-body`) | Low-level grid primitive shared by all views. Useful when building a custom view. |
| `MonthViewComponent` | Component (`tw-month-view`) | Day grid for one month. |
| `YearViewComponent` | Component (`tw-year-view`) | 12-month grid for one year. |
| `MultiYearViewComponent` | Component (`tw-multi-year-view`) | 24-year grid for year selection. |
| `DateAdapter<D>` | Abstract class + injection token | Pluggable date library — consumers can ship Luxon / date-fns / Temporal. |
| `NativeDateAdapter` | Class | Default `Date`-based adapter (Intl-driven labels). |
| `provideNativeDateAdapter()` | DI provider | Default bootstrap. |
| `provideTwCalendar({ adapter })` | DI provider | Custom-adapter bootstrap. |
| `TwDateRange<D>` | Class | Immutable `{ start, end }` range, used by range selection. |
| `TW_DATE_RANGE_SELECTION_STRATEGY` | DI token | Consumers can override how a click mutates the current range. |
| `DefaultDateRangeSelectionStrategy` | Class | Default: first click → start, second click → end (swap if before start). |
| `TwCalendarView` | Type | `'month' \| 'year' \| 'multi-year'` |
| `TwCalendarCellClassFn<D>` | Type | Per-cell class function for custom highlights. |
| `TwDateFilter<D>` | Type | Predicate disabling individual cells. |
| `TwCalendarUserSelection<D>` | Interface | Event emitted when user commits a selection. |

## Calendar API

### Inputs (Calendar)

| Input | Type | Default | Notes |
|---|---|---|---|
| `selectionMode` | `'single' \| 'range'` | `'single'` | Switches grid semantics + CVA value shape. |
| `startAt` | `D \| null` | `null` | Initial focused date (falls back to today). |
| `startView` | `TwCalendarView` | `'month'` | Which view opens first. |
| `minDate` | `D \| null` | `null` | Dates before are disabled. |
| `maxDate` | `D \| null` | `null` | Dates after are disabled. |
| `dateFilter` | `TwDateFilter<D>` | `() => true` | Per-date predicate. |
| `dateClass` | `TwCalendarCellClassFn<D>` | `() => ''` | Extra classes per cell (per view). |
| `showWeekNumbers` | `boolean` | `false` | Enhancement — renders an ISO week-number column. |
| `firstDayOfWeek` | `number \| null` | `null` | Override the adapter's default (0 = Sunday). |
| `color` | `TwColor` | `'primary'` | Selected / range-highlight semantic color. |
| `size` | `TwSize` | `'md'` | Cell density. |
| `disabled` | `boolean` | `false` | Disables every cell. |
| `headerless` | `boolean` | `false` | Hide header — use when embedding a custom header. |
| `ariaLabel` / `aria-labelledby` | string | — | Accessible name for the grid container. |

### Models (two-way)

| Model | Shape |
|---|---|
| `selected` | `D \| null` in single mode; `TwDateRange<D>` in range mode. |
| `activeDate` | `D` — currently focused cell. |
| `currentView` | `TwCalendarView` — which view is visible. |

### Outputs

| Output | Payload |
|---|---|
| `selectedChange` | `D \| null \| TwDateRange<D>` |
| `userSelection` | `TwCalendarUserSelection<D>` — `{ value, source: 'user' }` |
| `viewChanged` | `TwCalendarView` |
| `monthSelected` | `D` (fires from the year view) |
| `yearSelected` | `D` (fires from the multi-year view) |

### Imperative

- `focusActiveCell(): void`
- `goTo(date: D, view?: TwCalendarView): void`
- `next(): void` / `previous(): void`

## Styling

- `tv()` slots: `root`, `header`, `headerLabel`, `navButton`, `table`, `weekdayLabel`, `weekNumber`, `cell`, `cellContent`, `rangePreview`.
- Semantic tokens only — `bg-primary-500`, `bg-surface-muted`, `text-fg`, `border-border`, `border-border-strong`, `text-fg-muted`, `text-fg-subtle`.
- **Selected cell**: `bg-{color}-600 text-white` (solid) with semantic color.
- **Today indicator**: `ring-1 ring-inset ring-{color}-500` for an unselected today.
- **Range fill**: `bg-{color}-100 dark:bg-{color}-950/40` on cells between start/end.
- **Range preview** (hover mid-selection): same but softer (`/50` opacity).
- **Disabled cells**: `opacity-40 pointer-events-none`.
- **Focus ring**: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on each cell content.
- Radius: `rounded-md` cells, `rounded-lg` container.

## Accessibility

- Outer container: `role="group"` with `aria-label`.
- Grid rendered with native `<table role="grid">`; rows are `role="row"`; cells carry `role="gridcell"` and `aria-selected="true"` when selected, `aria-disabled="true"` when disabled.
- Exactly one cell has `tabindex="0"` (the active cell) — roving tabindex via `FocusMonitor` + imperative focus after view changes.
- Weekday header cells: `<th scope="col">` with short label + `aria-label` full name.
- Previous / next / period buttons: `<button>` with `aria-label` + `aria-live="polite"` announcement via `LiveAnnouncer` on view/period change.
- Keyboard (month view):
  - `←/→` prev/next day, `↑/↓` prev/next week, `Home/End` start/end of week, `PageUp/PageDown` prev/next month, `Alt+PageUp/Down` prev/next year, `Enter/Space` select.
- Keyboard (year view): `←/→` prev/next month, `↑/↓` move by row (3 cols), PageUp/Down prev/next year.
- Keyboard (multi-year): same with row = 4 cols, PageUp/Down shifts by page (24 years).

## Form integration

- `CalendarComponent` implements `ControlValueAccessor`.
  - Single mode: `writeValue(D | null)`.
  - Range mode: `writeValue(TwDateRange<D> | null | { start; end })` — a plain object is normalised into a `TwDateRange`.
- Works with reactive forms, template-driven (`[(ngModel)]`), and signal forms (via `[formField]`).
- Date pickers compose by embedding `<tw-calendar>` in a `tw-popover` overlay and relaying `selected` between the trigger input and the calendar — no extra surface on the calendar needed.

## Enhancements (beyond Material parity)

1. `TwDateSelectionModel` / `TwDateRange` are standalone — pickers can share the model across overlay + trigger without coupling.
2. `dateClass` fn receives `(date, view)` and supports Record/string/array — enables custom overlays like holidays, event dots.
3. Range selection strategy is injectable — consumers can implement "drag-to-select", "business days only", etc.
4. Optional ISO week-number column (enhancement not in Material's stock calendar).
5. Signal-based API with roving tabindex managed entirely via effects — no ViewChild churn.
6. `color` input rethemes selection/today/range on the fly (Material is locked to the theme primary).
7. `headerless` mode lets pickers compose a custom header (e.g., preset shortcuts on the left).

## Tests

Vitest spec covers:
- Render of all three views with correct cells/labels.
- Selection (single + range) updates DOM + emits events.
- Disabled via min/max/dateFilter prevents selection.
- Keyboard navigation in month view (`←/→/↑/↓/Home/End/PageUp/PageDown/Alt+PageUp/Down`).
- ARIA: `role="grid"`, `aria-selected`, `aria-disabled`, `tabindex="0"` on active cell only.
- ControlValueAccessor for both modes (reactive form control).
- `writeValue` in range mode normalises plain objects.
- `dateClass` fn classes appear on the right cells.
- View transitions (month → multi-year via header period click).

---

*Spec authored inline during `/implement-component` run on 2026-04-20.*
