# Prompt: Refactor `tw-calendar` — pluggable selection strategies, multi/week modes, cross-grid nav, cell templates, harness

## Context

This is a **refactor** of the existing calendar at `projects/ngx-tw/calendar/`, not a rebuild. Keep every file that is not explicitly listed for change exactly as it is.

**Read first:**
- `.claude/CLAUDE.md` — conventions (Angular v21 signal APIs, `OnPush`, `inject()`, no `@HostBinding`/`@HostListener`, no `@angular/animations`, Tailwind v4 semantic tokens, tailwind-variants with `twMerge`, Vitest, no `fakeAsync`/`tick`, secondary entry-point-per-feature).
- `projects/ngx-tw/calendar/calendar.ts` — orchestrator you will extend.
- `projects/ngx-tw/calendar/date-range.ts` — generalize; keep old exports as deprecated aliases.
- `projects/ngx-tw/calendar/month-view.ts`, `year-view.ts`, `multi-year-view.ts`, `calendar-body.ts` — all three views forward a `cellTemplate` and (for year / multi-year) `previewStart` / `previewEnd`.
- `projects/ngx-tw/calendar/date-adapter.ts` — `DateAdapter<D>` surface. Do **not** extend the adapter.
- `projects/ngx-tw/calendar/index.ts` — entry-point barrel.
- `/Users/ciprianiuga/dev/kubyk.fe.com/projects/com/components/calendar/selection/` — reference for the abstract strategy + four concrete strategies (single/range/multi/week). **Inspiration only** — rename to `Tw*`, inject `DATE_ADAPTER` (the `ngx-tw` one), and use `DateAdapter`'s actual surface (`sameDate`, `compareDate`, `addCalendarDays`, `getFirstDayOfWeek`), not kubyk's `isSameDay` / `isDateInRange` / `addDays`.

**Relevant CDK modules:** `@angular/cdk/a11y` (`LiveAnnouncer`, already used), `@angular/cdk/testing` (new, for the harness entry point).

## What to build

Ten coordinated changes. All are must-haves except where flagged `[CONFIRM]`.

1. Generalize the selection-strategy pattern from range-only to a pluggable `TwCalendarSelectionStrategy<D, S>` with four shipped implementations: `TwSingleSelectionStrategy`, `TwRangeSelectionStrategy`, `TwMultiSelectionStrategy`, `TwWeekSelectionStrategy`. `selectionMode` on the calendar still picks the default strategy; consumers can override by injecting via `TW_CALENDAR_SELECTION_STRATEGY`.
2. Extend `TwCalendarSelectionMode` to `'single' | 'range' | 'multi' | 'week'`. Widen the `selected` model to `D | TwDateRange<D> | readonly D[] | null`.
3. Add `cellTemplate` input to `CalendarComponent`, all three views, and `CalendarBodyComponent`. Context: `{ $implicit: TwCalendarCell<D> }`. Replaces only the content inside the cell button; button, ARIA, `data-*`, and focus behavior are unchanged.
4. Propagate range preview (`previewStart` / `previewEnd`) into `YearViewComponent` and `MultiYearViewComponent`. Collapse endpoints to the appropriate granularity.
5. Fix cross-grid keyboard navigation in multi-month layouts. Arrow keys must hand off focus across month-view boundaries.
6. Carry time-of-day on range endpoints when `withTime` is true. Specify the active-endpoint rule.
7. Widen `writeValue` to accept `D[]` (multi), `TwDateRangeInput<D>` (range/week), and `D | null` (single). Deserialise each array entry in multi mode.
8. Add an optional preset rail via an `ng-content select="[twCalendarPresets]"` slot plus a marker attribute directive.
9. Add a new secondary entry point `ngx-tw/calendar/testing` with `CalendarHarness` and `CalendarCellHarness` (CDK component harnesses).
10. Update / add tests covering every new code path, Vitest only, no `fakeAsync`.

**Back-compat is mandatory.** Existing consumer code using `selectionMode="single" | "range"`, `TwDateRange`, `TW_DATE_RANGE_SELECTION_STRATEGY`, `DefaultDateRangeSelectionStrategy`, or the `TwDateRangeSelectionStrategy` interface must keep working unchanged.

## API design

### New: `TwCalendarSelectionStrategy<D, S>`

Abstract class in a new file `projects/ngx-tw/calendar/selection/selection-strategy.ts`.

```ts
export interface TwSelectionResult<D, S> {
  readonly selection: S;
  readonly isComplete: boolean;
  readonly preview?: TwDateRange<D> | null;
}

export abstract class TwCalendarSelectionStrategy<D, S> {
  abstract select(date: D, current: S, adapter: DateAdapter<D>): TwSelectionResult<D, S>;
  abstract createPreview(active: D | null, current: S, adapter: DateAdapter<D>): TwDateRange<D> | null;
  abstract isSelected(date: D, current: S, adapter: DateAdapter<D>): boolean;
  abstract isRangeStart(date: D, current: S, adapter: DateAdapter<D>): boolean;
  abstract isRangeEnd(date: D, current: S, adapter: DateAdapter<D>): boolean;
  abstract isRangeMiddle(date: D, current: S, adapter: DateAdapter<D>): boolean;
}

export const TW_CALENDAR_SELECTION_STRATEGY =
  new InjectionToken<TwCalendarSelectionStrategy<unknown, unknown>>('tw-calendar/SelectionStrategy');
```

Strategies receive the adapter as an argument (not via `inject()`) so they can be instantiated eagerly as fallback defaults. Provider helpers (see below) register them via `useClass` so DI-based instantiation still works.

### New: concrete strategies

One file each under `projects/ngx-tw/calendar/selection/`:

| File | Class | `S` | Behaviour |
|---|---|---|---|
| `single-selection-strategy.ts` | `TwSingleSelectionStrategy<D>` | `D \| null` | One click commits. No preview. |
| `range-selection-strategy.ts` | `TwRangeSelectionStrategy<D>` | `TwDateRange<D> \| null` | First click sets start (incomplete), second click completes. Swap if reversed. Preview from start to `active`. Must return `TwDateRange` instances (not plain objects) from `select`. |
| `multi-selection-strategy.ts` | `TwMultiSelectionStrategy<D>` | `readonly D[]` | Each click toggles. Always `isComplete: true`. No preview. Uses `adapter.sameDate` for dedup. |
| `week-selection-strategy.ts` | `TwWeekSelectionStrategy<D>` | `TwDateRange<D> \| null` | One click selects the full week containing the date, respecting `adapter.getFirstDayOfWeek()`. Always complete. Preview is the week under `active`. |

Every strategy's `select` returns `TwSelectionResult`. The calendar emits `userSelection` only when `isComplete` is true, but always updates `selected` (so partial ranges render mid-selection).

### New: provider helpers

File `projects/ngx-tw/calendar/selection/providers.ts`:

```ts
/** Provides single-date selection (default — equivalent to `selectionMode="single"`). */
export function provideSingleSelection(): Provider

/** Provides two-click range selection. */
export function provideRangeSelection(): Provider

/** Provides toggle-based multi selection — selection type is `D[]`. */
export function provideMultiSelection(): Provider

/** Provides week-at-a-time selection. */
export function provideWeekSelection(): Provider

/** Provides an arbitrary strategy (custom subclasses). */
export function provideCalendarSelection<D, S>(
  strategy: Type<TwCalendarSelectionStrategy<D, S>>
): Provider
```

All four shipped strategies must be provided via `useClass` so `@Injectable()` DI lifecycle applies.

### Changed: `CalendarComponent`

All existing inputs/outputs/models stay. Changes only:

| Member | Change |
|---|---|
| `selectionMode` | Union widens to `'single' \| 'range' \| 'multi' \| 'week'`. Default `'single'`. |
| `selected` (model) | Type widens to `D \| TwDateRange<D> \| readonly D[] \| null`. |
| `cellTemplate` (new input) | `/** Custom cell content template. Receives `$implicit: TwCalendarCell<D>`. Defaults to `undefined` (renders the cell's `displayValue`). */` `input<TemplateRef<TwCalendarCellTemplateContext<D>> \| undefined>(undefined)` |
| `writeValue` | Accept `D[]` in multi mode, `TwDateRangeInput<D>` in range/week, `D \| null` in single. Deserialise array entries with `adapter.deserialize`. |
| `onMonthActiveDateChange` | Replace with logic that forwards focus to another month-view when the emitted date falls outside the grid it came from. |
| `onPreviewChange` | Delegate to the current strategy's `createPreview` and write `previewStart` / `previewEnd` from the returned `TwDateRange`. |
| `onDateSelected` | Delegate to the strategy; apply `withTime` carry-over per the rule below. |
| `onMonthSelected` / `onYearSelected` | In range/week mode call the strategy with the synthesised first-/last-of-month (year) date; in multi mode delegate unchanged. |

The internal `rangeStrategy` field is replaced by `selectionStrategy` — a computed derived from either the injected `TW_CALENDAR_SELECTION_STRATEGY` (if present) or a default chosen from `selectionMode()`:

| `selectionMode` | Default strategy |
|---|---|
| `'single'` | `new TwSingleSelectionStrategy<D>()` |
| `'range'` | `new TwRangeSelectionStrategy<D>()` |
| `'multi'` | `new TwMultiSelectionStrategy<D>()` |
| `'week'` | `new TwWeekSelectionStrategy<D>()` |

Consumer-injected strategy wins over the mode default.

### Changed: `MonthViewComponent`, `YearViewComponent`, `MultiYearViewComponent`

Add two inputs to `YearViewComponent` and `MultiYearViewComponent` (they already exist on `MonthViewComponent`):

```ts
/** Preview start endpoint — drawn as an in-progress range fill. */
readonly previewStart = input<D | null>(null);

/** Preview end endpoint — drawn as an in-progress range fill. */
readonly previewEnd = input<D | null>(null);
```

Wire them through to `CalendarBodyComponent` as `previewStart` / `previewEnd` compareValues, collapsed via:

| View | Start collapse | End collapse |
|---|---|---|
| Year | `monthCompare` of `previewStart` | `monthCompare` of `previewEnd` |
| Multi-year | `getYear(previewStart)` | `getYear(previewEnd)` |

Add to all three views:

```ts
/** Template rendered inside each cell's button in place of `displayValue`. */
readonly cellTemplate = input<TemplateRef<TwCalendarCellTemplateContext<D>> | undefined>(undefined);
```

Forward it directly to `CalendarBodyComponent`.

Add a public method on `MonthViewComponent` (and expose the same on `YearViewComponent` / `MultiYearViewComponent` for symmetry):

```ts
/** Focuses the cell rendering the given date, if present in this grid. No-op otherwise. */
focusDate(date: D): void;
```

`MonthViewComponent.focusDate` must: (a) check `sameMonth(date, activeDate())`; (b) if true, delegate to `CalendarBodyComponent.focusActiveCell()` after setting the body's `activeValue` input via an internal write path. The cleanest way is to have the parent update `cursor` before calling `focusDate`, then `focusDate` just calls `focusActiveCell()` on the next microtask.

### Changed: `CalendarBodyComponent`

Add one input:

```ts
/** Optional custom template for cell contents. Receives `{ $implicit: TwCalendarCell<D> }`. */
readonly cellTemplate = input<TemplateRef<TwCalendarCellTemplateContext<D>> | undefined>(undefined);
```

In the template, wrap the `{{ cell.displayValue }}` in a `@if (cellTemplate(); as tpl) { <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: cell }" /> } @else { {{ cell.displayValue }} }`. Import `NgTemplateOutlet` explicitly in the component's `imports`.

Exported public type:

```ts
/** Template context for cell content overrides. */
export interface TwCalendarCellTemplateContext<D> {
  readonly $implicit: TwCalendarCell<D>;
}
```

### Preset rail slot

Add to `CalendarComponent` template, **outside** the main grid but inside the root host:

```html
<ng-content select="[twCalendarPresets]" />
```

Place it immediately after the header and before the grid `<div>`. It must sit at the flex-row level when `numberOfMonths > 1`. Styling: `flex flex-wrap items-center gap-1.5 px-2 pb-2`.

A marker directive `TwCalendarPresets` in `projects/ngx-tw/calendar/calendar-presets.ts`:

```ts
/** Marker for the preset rail slot — put this on a container to project preset buttons into the calendar. */
@Directive({ selector: '[twCalendarPresets]' })
export class TwCalendarPresets {}
```

The directive is purely structural — its only job is to be importable so users get a named token for the selector. No inputs, no outputs.

### Deprecated aliases (back-compat)

In `date-range.ts`, keep the file but add:

```ts
/** @deprecated Use `TwCalendarSelectionStrategy<D, TwDateRange<D> | null>` instead. */
export type TwDateRangeSelectionStrategy<D> = /* interface identical to today */;

/** @deprecated Use `TwRangeSelectionStrategy` instead. */
export class DefaultDateRangeSelectionStrategy<D> implements TwDateRangeSelectionStrategy<D> { /* delegates */ }

/** @deprecated Use `TW_CALENDAR_SELECTION_STRATEGY` with `TwRangeSelectionStrategy`. */
export const TW_DATE_RANGE_SELECTION_STRATEGY: InjectionToken<TwDateRangeSelectionStrategy<unknown>>;
```

The deprecated `DefaultDateRangeSelectionStrategy.selectionFinished` must delegate to a fresh `TwRangeSelectionStrategy<D>().select(date, current, adapter).selection`.

If `CalendarComponent` finds a value bound to `TW_DATE_RANGE_SELECTION_STRATEGY` but not `TW_CALENDAR_SELECTION_STRATEGY`, it must adapt the legacy interface into a runtime `TwRangeSelectionStrategy`-compatible shape so old apps continue to work. This adaptation logic belongs in the calendar's constructor, not in the strategy files.

### New type aliases in `index.ts`

```ts
/** Shape of `selected` across all modes. */
export type TwCalendarSelection<D> = D | TwDateRange<D> | readonly D[] | null;
```

## Usage examples

```html
<!-- Single mode (default — unchanged from today) -->
<tw-calendar aria-label="Pick a date" [(ngModel)]="date" />

<!-- Range mode — unchanged from today -->
<tw-calendar selectionMode="range" aria-label="Pick a range" [(ngModel)]="range" />

<!-- Multi mode — new -->
<tw-calendar selectionMode="multi" aria-label="Pick days" [(ngModel)]="dates" />

<!-- Week mode — new -->
<tw-calendar selectionMode="week" aria-label="Pick a week" [(ngModel)]="week" />

<!-- Custom cell template (event dots) -->
<tw-calendar aria-label="Events" [cellTemplate]="cell">
  <ng-template #cell let-c>
    <span class="relative">{{ c.displayValue }}
      @if (hasEvent(c.rawDate)) { <span class="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary-500"></span> }
    </span>
  </ng-template>
</tw-calendar>

<!-- Preset rail -->
<tw-calendar selectionMode="range" aria-label="Range with presets" [(ngModel)]="range">
  <div twCalendarPresets>
    <button tw-button variant="ghost" size="xs" (click)="applyToday()">Today</button>
    <button tw-button variant="ghost" size="xs" (click)="applyLast7()">Last 7 days</button>
  </div>
</tw-calendar>

<!-- Multi-month with cross-grid keyboard nav -->
<tw-calendar selectionMode="range" [numberOfMonths]="2" aria-label="Two-month range" />

<!-- Custom strategy -->
<tw-calendar aria-label="Business days only" />
<!-- in providers: provideCalendarSelection(BusinessDayRangeStrategy) -->
```

## Styling

No new `tv()` configs. Preset rail uses raw Tailwind utilities (see above). Preview fills on year / multi-year views reuse the existing `RANGE_PREVIEW_FILL` table in `calendar-body.ts` — nothing to add. Semantic-token styling is untouched.

Do **not** introduce raw palette classes. Do **not** add component CSS files. Do **not** adjust any existing radius / shadow / focus-ring token — the Visual Design System already covers every element.

## Accessibility

- **Multi mode:** `role="grid"` + `aria-multiselectable="true"` on the body's `<table>` when the active strategy is `TwMultiSelectionStrategy`. Individual cells use `aria-selected` per their `isSelected` result. Add one input to `CalendarBodyComponent`: `/** When true, marks the grid as multi-selectable. Defaults to `false`. */ readonly multiSelectable = input(false);` wired to `aria-multiselectable` on the `<table>`. `CalendarComponent` sets it from `selectionMode() === 'multi'`.
- **Week mode:** announce `"Week of <start ariaLabel>"` via `LiveAnnouncer` when the user commits a selection.
- **Cross-grid focus transfer:** the focus handoff must not fire a focus ring on a hidden cell. Transfer focus only after the target cell's `tabindex` has been updated to `0` (queueMicrotask after the cursor input propagates).
- **Preset rail:** lives outside the grid, has its own natural tab order, and must not interfere with the grid's roving tabindex. Do not add `tabindex` to projected content.
- **Cell template:** the implementer must forbid interactive children (no nested `<button>`) via dev-mode assertion — the cell button owns click handling.
- AXE + WCAG AA must pass. Keyboard contract is unchanged except for the new cross-grid arrow-key behaviour.

**Keyboard (per-grid; unchanged except where noted):**

| Key | Action |
|---|---|
| Arrow keys | Move active cell; **new:** if the computed next date leaves the current grid and another grid renders it, transfer focus there |
| Home/End | Start/end of week (month view) / year (year view) / page (multi-year view) |
| PageUp/PageDown | Previous/next month (alt: year) / year (alt: decade) / page (alt: 10 pages) |
| Enter / Space | Commit selection via the strategy |

## Form integration

`CalendarComponent` remains a `ControlValueAccessor`. `writeValue` dispatches on `selectionMode()`:

| Mode | Accepted shapes | Stored as |
|---|---|---|
| `single` | `D \| null \| undefined` (plus adapter-deserializable values) | `D \| null` |
| `range` | `TwDateRange<D> \| { start, end } \| null` | `TwDateRange<D>` (new instance) |
| `week` | same as range | `TwDateRange<D>` |
| `multi` | `readonly D[] \| null` (each entry deserialized; invalid entries dropped) | `readonly D[]` |

`registerOnChange` / `registerOnTouched` / `setDisabledState` unchanged. `onChange` fires only when the strategy reports `isComplete: true`.

Must work with template-driven (`[(ngModel)]`), reactive (`[formControl]`), and signal-based (`[(ngModel)]` with `model()`) forms — existing tests cover this.

## Implementation notes

- **Selection strategy resolution.** Use a `computed()` in the calendar: if the injected `TW_CALENDAR_SELECTION_STRATEGY` is non-null, return it; else if the legacy `TW_DATE_RANGE_SELECTION_STRATEGY` is non-null **and** `selectionMode() === 'range'`, wrap it; else return a mode-keyed default (cache defaults per component instance to avoid re-allocating on every read).
- **`withTime` active-endpoint rule** (`[CONFIRM]`): edits from the time-controls apply to whichever endpoint matches `activeDate()`; if neither matches (e.g., activeDate drifted from both), they apply to `end` when `end` is set, else `start`. On a fresh range pick the new endpoint carries the prior endpoint's time-of-day via `adapter.withTime` (midnight if no prior time exists). Single mode's existing `carryTimeOfDay` stays.
- **Cross-grid nav.** `onMonthActiveDateChange(index, date)` should: compute the month index of `date` relative to `visibleMonths()`; if it matches `index`, behave as before (write the parent's `activeDate`); if it matches a different visible month, forward focus to that `MonthViewComponent` via the `viewChildren<MonthViewComponent<D>>('monthView')` list and call `view.focusDate(date)` after updating the cursor input. If the computed index is outside the visible row, page the whole row (`activeDate.set(addCalendarMonths(first, delta))`) and focus the new grid's target cell on the next microtask.
- **Preview plumbing for year/multi-year views.** `CalendarComponent.onPreviewChange` is currently range-only — update it to call `selectionStrategy().createPreview(date, selected(), adapter)` and split the returned `TwDateRange` into `previewStart` / `previewEnd` signals. Views read those regardless of current view.
- **Strategy preview in year / multi-year.** When in those views, the calendar's `previewStart` / `previewEnd` represent the original day-granularity dates; views collapse them to their own granularity on the way into `CalendarBodyComponent`.
- **Cell template.** Use `NgTemplateOutlet` from `@angular/common`. Template context type is exported so consumers can type `let-cell` correctly.
- **Multi mode and views.** `YearViewComponent` and `MultiYearViewComponent` receive `selected` which may now be `readonly D[]`; their `selectedCompare` computeds return `null` for array selections (arrays don't collapse to a single compare value). They must not crash on array input.
- **`singleSelected` helper.** Update its logic: if `selected()` is an array, return `null`; if a `TwDateRange`, return `start`; if a scalar `D`, return it.
- **Deprecation warnings.** No runtime warnings — `@deprecated` JSDoc is enough.
- **No `@HostBinding` / `@HostListener`.** Use the `host` object. No new `computed()` without a non-trivial derivation.

## File structure

Create new files (under `projects/ngx-tw/calendar/`):

```
selection/
  index.ts                            — barrel re-exports (selection strategies + providers + types)
  selection-strategy.ts               — abstract class + token + SelectionResult
  single-selection-strategy.ts        — TwSingleSelectionStrategy
  range-selection-strategy.ts         — TwRangeSelectionStrategy
  multi-selection-strategy.ts         — TwMultiSelectionStrategy
  week-selection-strategy.ts          — TwWeekSelectionStrategy
  providers.ts                        — provide* helpers
  single-selection-strategy.spec.ts
  range-selection-strategy.spec.ts
  multi-selection-strategy.spec.ts
  week-selection-strategy.spec.ts

calendar-presets.ts                   — TwCalendarPresets marker directive
```

Create the testing harness entry point (new directory, new secondary entry point):

```
testing/
  ng-package.json                     — { "lib": { "entryFile": "index.ts" } }
  index.ts                            — re-exports the two harnesses
  calendar-harness.ts                 — CalendarHarness (extends ComponentHarness)
  calendar-cell-harness.ts            — CalendarCellHarness (extends ComponentHarness)
```

Modify (refactor only, do not rewrite):

- `calendar.ts` — selection strategy resolution, widened types, `cellTemplate` input, cross-grid nav, preset slot, updated `writeValue` / preview / single-selected logic, multi-mode aria wiring.
- `calendar-body.ts` — add `cellTemplate` and `multiSelectable` inputs, template change.
- `month-view.ts` — add `cellTemplate` input (pass through), `focusDate()` public method.
- `year-view.ts` — add `previewStart`, `previewEnd`, `cellTemplate` inputs + preview compareValues.
- `multi-year-view.ts` — same as `year-view.ts`.
- `date-range.ts` — add `@deprecated` JSDoc on all three old exports; `DefaultDateRangeSelectionStrategy` delegates to `TwRangeSelectionStrategy`.
- `calendar.spec.ts` — add coverage for every new code path.
- `index.ts` — export every new public symbol.

### `CalendarHarness` (CDK component harness)

Extends `ComponentHarness`. Host selector: `'tw-calendar'`. Uses standard CDK selectors / ARIA.

| Method | Signature | Notes |
|---|---|---|
| `getPeriodLabel` | `() => Promise<string>` | Read the header period button's text. |
| `goToPreviousPage` | `() => Promise<void>` | Click the previous nav button. |
| `goToNextPage` | `() => Promise<void>` | Click the next nav button. |
| `switchView` | `(target: 'month' \| 'year' \| 'multi-year') => Promise<void>` | Clicks the period button until the caption matches target (max 2 clicks). |
| `getCurrentView` | `() => Promise<TwCalendarView>` | Inspect which view child is rendered. |
| `getCells` | `() => Promise<CalendarCellHarness[]>` | All enabled + disabled cells in the currently rendered view. |
| `selectCell` | `(label: string) => Promise<void>` | Find a `CalendarCellHarness` by `getText()` and click it. |
| `getSelectedCells` | `() => Promise<CalendarCellHarness[]>` | Cells where `aria-selected="true"`. |
| `getTodayCell` | `() => Promise<CalendarCellHarness \| null>` | Cell with today's ring (identified by class pattern). |
| `getDisabledCells` | `() => Promise<CalendarCellHarness[]>` | Cells where `aria-disabled="true"`. |

### `CalendarCellHarness`

Extends `ComponentHarness`. Host selector: `'[role="gridcell"]:has(button)'` (or equivalent CDK predicate — let the implementer pick what works with CDK's harness query DSL).

| Method | Signature |
|---|---|
| `getText` | `() => Promise<string>` |
| `getAriaLabel` | `() => Promise<string \| null>` |
| `isSelected` | `() => Promise<boolean>` |
| `isDisabled` | `() => Promise<boolean>` |
| `isToday` | `() => Promise<boolean>` |
| `select` | `() => Promise<void>` |
| `focus` | `() => Promise<void>` |
| `isFocused` | `() => Promise<boolean>` |

Harnesses must not reach into internal classes / private selectors. Everything queryable via ARIA + `data-value` / `data-compare` attributes already present in `calendar-body.ts`.

### Tests

**Update `calendar.spec.ts`** to add `describe` blocks covering:
- Default render in each `selectionMode` (`'single' | 'range' | 'multi' | 'week'`).
- Multi mode toggles individual cells; repeat click de-selects; `userSelection` fires on every click.
- Week mode: click any day selects a full 7-day range starting at `adapter.getFirstDayOfWeek()`.
- Range preview renders in year view when user starts a range, switches to year view mid-selection, and hovers a month cell.
- Range preview renders in multi-year view similarly.
- Cross-grid keyboard nav: 2-month layout, ArrowRight on last day of month 1 focuses first day of month 2 (assert via `document.activeElement` textContent).
- `cellTemplate` projection — a host supplies a template with a `data-testid` wrapper; assert the wrapper is inside every cell button.
- `writeValue([date1, date2])` in multi mode renders both as `aria-selected`.
- `withTime` range mode: second endpoint carries the active endpoint's prior time-of-day; editing time updates the active endpoint only.
- Deprecated `TW_DATE_RANGE_SELECTION_STRATEGY` binding still works unchanged.

**Add `{strategy}.spec.ts`** — one per strategy. Each covers: `select()` from each state (empty / partial / complete), `createPreview()` in each state, the five `is*` predicates on a handful of dates, and immutability (result objects are new, inputs unmodified).

**No `fakeAsync` / `tick`.** Use `async / await` with `fixture.whenStable()` and `queueMicrotask` flushing via `await Promise.resolve()`.

## Public API exports

Root `projects/ngx-tw/src/public-api.ts` — no change; already `export * from 'ngx-tw/calendar'`. Add a new line: `export * from 'ngx-tw/calendar/testing';` for convenience (consumers typically import the harness directly from the subpath).

`projects/ngx-tw/calendar/index.ts` add:

```ts
export type { TwCalendarCellTemplateContext } from './calendar-body';
export type { TwCalendarSelection } from './types-local';  // or inline in index.ts
export { TwCalendarPresets } from './calendar-presets';
export * from './selection';
```

`projects/ngx-tw/calendar/selection/index.ts` exports:

```ts
export { TwCalendarSelectionStrategy, TW_CALENDAR_SELECTION_STRATEGY } from './selection-strategy';
export type { TwSelectionResult } from './selection-strategy';
export { TwSingleSelectionStrategy } from './single-selection-strategy';
export { TwRangeSelectionStrategy } from './range-selection-strategy';
export { TwMultiSelectionStrategy } from './multi-selection-strategy';
export { TwWeekSelectionStrategy } from './week-selection-strategy';
export {
  provideSingleSelection, provideRangeSelection,
  provideMultiSelection, provideWeekSelection,
  provideCalendarSelection,
} from './providers';
```

`projects/ngx-tw/calendar/testing/index.ts` exports:

```ts
export { CalendarHarness } from './calendar-harness';
export { CalendarCellHarness } from './calendar-cell-harness';
```

Keep the old `date-range.ts` exports in `index.ts` exactly as they are today — they must remain `@deprecated` but importable.

## Constraints

- Angular v21. Standalone is default. No `standalone: true`. `OnPush`. `inject()` only. No constructor injection. No `@HostBinding` / `@HostListener` — use `host`.
- Signal APIs everywhere: `input()`, `output()`, `model()`, `linkedSignal()`, `computed()`. Never `mutate`.
- Native control flow: `@if` / `@for` / `@switch`. No `ngClass` / `ngStyle`. No arrow functions in templates.
- Tailwind CSS v4 utilities only. Semantic tokens (`bg-primary-500`, `text-error-800`) for variants; surface / fg / border tokens (`bg-surface-muted`, `text-fg`, `border-border`) for structural neutral styling. No raw palette shades.
- tailwind-variants `tv()` with `twMerge: true` where a new config is genuinely needed (none required here).
- Every new `input()` / `output()` / `model()` gets a one-line JSDoc comment describing purpose + default.
- `@angular/animations` is forbidden. No entry/leave animations are needed for this refactor.
- Vitest. No `fakeAsync` / `tick`. Use `vi.spyOn`, `async/await`, `fixture.whenStable()`.
- A11y: AXE pass, WCAG AA, `LiveAnnouncer` for page changes / week-commit announcements, `FocusMonitor` only if genuinely needed (existing body manages focus directly, keep it).
- Every entry point keeps its own `ng-package.json` + `index.ts`. New `testing/` is a secondary entry point; `selection/` is **not** (sub-folder only).
- Existing semantic-token styling, `TwColor` / `TwSize` usage, and the `calendarVariants` / `calendarBodyVariants` / `headerVariants` tv configs are untouched.
