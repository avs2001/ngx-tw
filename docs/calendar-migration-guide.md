# Calendar migration guide — pre-cutover → v1

## Why this guide

The ngx-tw calendar is undergoing a pre-1.0 cutover (see
`docs/calendar-refactoring-plan.md`). Phases 0, 1, 2, 3, 5, 18-baseline, and 19
are now on `develop`, and they include several breaking changes against the
older "Kubyk port" calendar that previously lived in this repo. The library has
not yet been published to npm, so there are no v0 consumers in the wild, but
this guide exists for two audiences:

1. In-repo callers — the demo app, `date-picker`, and `date-range-picker` —
   that bind directly to `<tw-calendar>`.
2. External preview users who pulled the pre-cutover code via a Git ref and
   need a concrete diff before upgrading.

If you used the pre-cutover calendar in a real app, this guide tells you the
minimum set of edits to land. v1 is still under construction — Phases 4 and
6–17 may add more refinements before the v1.0 tag, but they will not roll back
the changes documented here.

---

## Quick before/after

| Old API (pre-cutover) | New API (current `develop`) |
|---|---|
| `[selectionMode]="'single' \| 'multi' \| 'range' \| 'week'"` | `[mode]="'single' \| 'multiple' \| 'range'"` (week → DI strategy) |
| `[(selected)]="value"` and `[(value)]="value"` (both worked) | `[(value)]="value"` only |
| `(userSelection)="…"` | `(selectionComplete)="…"`, `(selectionStart)="…"` |
| `(viewChanged)="view = $event"` (`view: 'month' \| 'year' \| 'multi-year'`) | `(viewChange)="onViewChange($event)"` (`{ from, to, reason }`, `'day' \| 'month' \| 'year'`) |
| `[startView]="'month'"` | `[startView]="'day'"` |
| `[withTime]`, `[timeFormat]`, `[showSeconds]`, `[hourStep]`, `[minuteStep]`, `[secondStep]`, `[minTime]`, `[maxTime]` | removed — use the `time-picker` component |
| `[color]`, `[size]`, `[headerless]` | removed — style via `bordered` + semantic tokens |
| `adapter.createDate(2026, 0, 15)` (0-based month) | `adapter.create(2026, 1, 15)` (1-based month) |
| `adapter.addCalendarMonths`, `addCalendarYears`, `addCalendarDays` | `adapter.addMonths`, `addYears`, `addDays` |
| `adapter.compareDate(a, b)` | `adapter.compare(a, b)` |
| `adapter.toIso8601(d)` | `adapter.toIso(d)` |
| Adapter wired by hand in `providers` array | `provideTwCalendar({ adapter })` or `provideNativeDateAdapter()` |

---

## Per-change details

### `selectionMode` → `mode`

**What changed.** The selection-mode input was renamed to align with the spec
naming.

**Before**

```html
<tw-calendar [selectionMode]="'single'" [(value)]="picked"></tw-calendar>
```

**After**

```html
<tw-calendar [mode]="'single'" [(value)]="picked"></tw-calendar>
```

**Why.** Spec §5 — `mode` is the canonical name across `CalendarMode`,
`CalendarValue<M, D>`, and the Signal Forms mode directives.

**Codemod hint.** `s/\[selectionMode\]/[mode]/g` and the unbound
attribute form `s/selectionMode="/mode="/g`.

---

### `'multi'` → `'multiple'`

**What changed.** The mode value `'multi'` was renamed to `'multiple'`.
`CalendarMode` is now exactly `'single' | 'multiple' | 'range'`.

**Before**

```html
<tw-calendar [mode]="'multi'" [(value)]="dates"></tw-calendar>
```

**After**

```html
<tw-calendar [mode]="'multiple'" [(value)]="dates"></tw-calendar>
```

**Why.** Spec §5. `'multi'` is no longer a member of `CalendarMode`; the
component will throw a type error at the `mode` input.

**Codemod hint.** `s/(\bmode\b[^=]*=\s*['"])multi(['"])/\1multiple\2/g`.
Mechanical for string literals; review TS code that references the literal type.

---

### `'week'` mode is no longer on the surface

**What changed.** `'week'` was removed from `CalendarMode`. Week-as-unit
selection is still implementable through the DI-only `WeekSelectionStrategy`.

**Before**

```html
<tw-calendar [selectionMode]="'week'" [(value)]="weekRange"></tw-calendar>
```

**After**

```typescript
import { provideWeekSelectionStrategy } from 'ngx-tw/calendar';

bootstrapApplication(App, {
  providers: [
    provideNativeDateAdapter(),
    provideWeekSelectionStrategy(),
  ],
});
```

```html
<!-- The component is in `range` mode; the strategy snaps to the week the user clicks. -->
<tw-calendar [mode]="'range'" [(value)]="weekRange"></tw-calendar>
```

**Why.** Spec §5 marks `'week'` as `[WONT] v1` for the public surface. The
strategy is exported from `ngx-tw/calendar` (`./selection`) for advanced use
cases — see `WeekSelectionStrategy`.

**Codemod hint.** n/a — wire the provider once at the app root and switch the
template to `mode="range"`.

---

### Single `value` model, `selected` removed

**What changed.** The pre-cutover calendar exposed both `[(selected)]` and
`[(value)]`. Only `[(value)]` remains, and its shape narrows by `mode`:
`D | null` for single, `D[]` for multiple, `{ start; end }` for range.

**Before**

```html
<tw-calendar [(selected)]="picked"></tw-calendar>
```

**After**

```html
<tw-calendar [(value)]="picked"></tw-calendar>
```

**Why.** Spec §7.3 — one model, one truth, mode-narrowed.

**Codemod hint.** `s/\[\(selected\)\]/[(value)]/g` and the
unidirectional `s/\[selected\]/[value]/g`, `s/\(selectedChange\)/(valueChange)/g`.

---

### `userSelection` output removed

**What changed.** The pre-cutover `userSelection` output was split into
`selectionStart` (first click of a range) and `selectionComplete` (commit).

**Before**

```html
<tw-calendar (userSelection)="onPicked($event)"></tw-calendar>
```

**After**

```html
<tw-calendar
  (selectionStart)="onStart($event)"
  (selectionComplete)="onComplete($event)"
></tw-calendar>
```

The `selectionComplete` payload is `SelectionCompleteEvent<M, D>`:

```typescript
{
  value: CalendarValue<M, D>;
  reason: 'commit' | 'auto-swap' | 'nearest-edge' | 'preset';
}
```

**Why.** Spec §33.2 — the lifecycle is explicit so consumers can distinguish
"started selecting" from "committed", and so the commit reason is observable.

**Codemod hint.** n/a — the payload changed; review each call site.

---

### View tokens: `'day' | 'month' | 'year'` (drop `'multi-year'`)

**What changed.** `CalendarViewState` is now `'day' | 'month' | 'year'`. The
old `'multi-year'` token is gone; the same years grid is now spelled `'year'`,
and the in-year month grid is `'month'`.

**Before**

```typescript
view: 'month' | 'year' | 'multi-year' = 'month';
```

```html
<tw-calendar [startView]="'month'"></tw-calendar>
```

**After**

```typescript
import type { CalendarViewState } from 'ngx-tw/calendar';

view: CalendarViewState = 'day';
```

```html
<tw-calendar [startView]="'day'"></tw-calendar>
```

**Why.** Spec §7.4. The pre-cutover `'month'` was the day grid (a month of
days), which was confusing.

**Codemod hint.** Cannot do safely with sed because the token names overlap;
audit `[startView]`, harness calls, and any handler reading `view` from
`viewChanged`.

---

### `viewChanged: CalendarView` → `viewChange: { from, to, reason }`

**What changed.** The output was renamed to `viewChange` and now emits a
`ViewChangeEvent` payload that distinguishes user button taps from drill-down,
drill-up, and programmatic changes.

**Before**

```html
<tw-calendar (viewChanged)="view = $event"></tw-calendar>
```

**After**

```typescript
import type { ViewChangeEvent } from 'ngx-tw/calendar';

onViewChange(event: ViewChangeEvent) {
  this.view.set(event.to);
}
```

```html
<tw-calendar (viewChange)="onViewChange($event)"></tw-calendar>
```

**Why.** Spec §22.6 — `reason` lets analytics and a11y announcements
differentiate the navigation paths.

**Codemod hint.** Rename `(viewChanged)` to `(viewChange)` mechanically; then
fix the handler signature by hand.

---

### Adapter method renames + 1-based month

**What changed.** Custom `DateAdapter` subclasses must rename their methods
and switch `create(year, month, day)` to a 1-based month.

| Old | New |
|---|---|
| `createDate(2026, 0, 15)` (Jan = 0) | `create(2026, 1, 15)` (Jan = 1) |
| `addCalendarYears(d, n)` | `addYears(d, n)` |
| `addCalendarMonths(d, n)` | `addMonths(d, n)` |
| `addCalendarDays(d, n)` | `addDays(d, n)` |
| `compareDate(a, b)` | `compare(a, b)` |
| `toIso8601(d)` | `toIso(d)` |

The base class also adds new required methods — `startOfDay(date)` is now
abstract, and `addMinutes(date, minutes)` is required for time arithmetic.
Defaults are provided for `startOfWeek`, `endOfWeek`, `sameMonth`, `sameYear`,
`clampDate`, `addHours`, `getDateNames`, `fromIso`, and the optional TZ
virtuals (`getTimezone`, `withTimezone`, `isDST`, `resolveAmbiguous`).

**Before**

```typescript
class MyAdapter extends DateAdapter<Date> {
  override createDate(y: number, monthZeroBased: number, d: number) {
    return new Date(y, monthZeroBased, d);
  }
  override addCalendarMonths(date: Date, n: number) { /* … */ }
  override compareDate(a: Date, b: Date) { /* … */ }
  override toIso8601(date: Date) { /* … */ }
}
```

**After**

```typescript
class MyAdapter extends DateAdapter<Date> {
  override create(y: number, monthOneBased: number, d: number) {
    return new Date(y, monthOneBased - 1, d);
  }
  override addMonths(date: Date, n: number) { /* … */ }
  override compare(a: Date, b: Date) { /* … */ }
  override toIso(date: Date) { /* … */ }
  override startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  override addMinutes(date: Date, n: number) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + n);
    return d;
  }
}
```

**Why.** Spec §20.2. 1-based month matches ISO-8601 expectations and removes
the foot-gun where every consumer reaches for `month - 1`.

**Codemod hint.** The renames are mechanical. The 1-based-month change is
**not**: every `createDate(y, m, d)` call site must bump `m` by one. Search for
`createDate\(` and review each result.

---

### Visual back-compat inputs removed (`color`, `size`, `headerless`)

**What changed.** The pre-cutover calendar mirrored the date-picker's `color`
and `size` inputs and exposed a `headerless` boolean. None of those are part
of the v1 surface — the calendar uses semantic tokens (`bg-surface`, `text-fg`,
`border-border`) and a single `bordered` flag.

**Before**

```html
<tw-calendar
  [color]="'primary'"
  [size]="'sm'"
  [headerless]="true"
></tw-calendar>
```

**After**

```html
<!-- bordered / borderless: -->
<tw-calendar [bordered]="false"></tw-calendar>

<!-- color + size: re-skin via semantic tokens in your theme. -->
```

**Why.** Library policy (CLAUDE.md): components consume semantic tokens; the
consumer's theme controls the palette. Spacing comes from the standard size
scale that other components share.

**Codemod hint.** Drop the attributes. There is no equivalent for
`headerless` — the header is part of the keyboard / a11y contract and cannot
be hidden in v1. If you need a chrome-less month grid, render
`<tw-calendar-month-view>` directly.

---

### Time-of-day inputs removed

**What changed.** The pre-cutover calendar mixed time-picker behaviour into
the date surface. v1 splits the two: `<tw-calendar>` selects dates, and the
companion `<tw-time-picker>` selects time-of-day.

Removed inputs: `withTime`, `timeFormat`, `showSeconds`, `hourStep`,
`minuteStep`, `secondStep`, `minTime`, `maxTime`.

**Before**

```html
<tw-calendar
  [withTime]="true"
  [timeFormat]="'24h'"
  [hourStep]="15"
></tw-calendar>
```

**After**

```html
<tw-calendar [(value)]="dateOnly"></tw-calendar>
<tw-time-picker [(value)]="timeOnly" [hourFormat]="'24h'"></tw-time-picker>
```

**Why.** Out of v1 scope per spec / `docs/calendar-plan_decisions.md`.

**Codemod hint.** n/a — splitting the surface requires a new component in
the template.

---

### `startAt` is now a one-time anchor

**What changed.** `startAt` initialises the calendar's anchor date on mount
and on any explicit re-bind, but runtime navigation is no longer reflected
back through `startAt`. Use `activeDate` (read-only signal) and the
`activeDateChange` output to observe the user's current focus.

**Before**

```html
<tw-calendar [(startAt)]="anchor"></tw-calendar>
```

**After**

```html
<tw-calendar
  [startAt]="anchor"
  (activeDateChange)="anchor = $event"
></tw-calendar>
```

**Why.** Two-way binding `startAt` blurred "where to start" with "where the
user is now". Spec §33 separates them.

**Codemod hint.** Replace `[(startAt)]="x"` with the `[startAt]` /
`(activeDateChange)` split above. If you only need the initial anchor, drop
the output binding entirely.

---

### `numberOfMonths` legacy alias replaced by `monthColumns` (interim)

**What changed.** The pre-cutover `numberOfMonths` input is gone. Phase 1
ships a temporary `monthColumns: 1 | 2` input. Phase 9 will reintroduce
`numberOfMonths: 1..12+` as the canonical multi-month input — keep that
horizon in mind when you migrate.

**Before**

```html
<tw-calendar [numberOfMonths]="2"></tw-calendar>
```

**After (current `develop`)**

```html
<tw-calendar [monthColumns]="2"></tw-calendar>
```

**After (Phase 9, pending)**

```html
<tw-calendar [numberOfMonths]="2"></tw-calendar>
```

**Why.** The pre-cutover surface and the spec's surface use the same name for
two different things; Phase 1 renamed the interim shape so Phase 9 can
re-introduce the canonical name without conflict.

**Codemod hint.** `s/\[numberOfMonths\]/[monthColumns]/g` for now; expect
to undo it once Phase 9 lands.

---

## New required setup — provide a `DateAdapter`

The calendar no longer ships a default adapter at the component level; you
must register one at the app root. Two helpers cover the common cases:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideNativeDateAdapter } from 'ngx-tw/calendar';

bootstrapApplication(App, {
  providers: [
    provideNativeDateAdapter(),
  ],
});
```

For Luxon (TZ-aware, DST-correct):

```typescript
import { provideLuxonDateAdapter } from 'ngx-tw/calendar/luxon';

bootstrapApplication(App, {
  providers: [
    provideLuxonDateAdapter(),
  ],
});
```

For a custom adapter:

```typescript
import { provideTwCalendar, DateAdapter } from 'ngx-tw/calendar';

class MyAdapter extends DateAdapter<MyDateType> { /* … */ }

bootstrapApplication(App, {
  providers: [
    provideTwCalendar({ adapter: MyAdapter }),
  ],
});
```

Optional companions:

- `provideCalendarIntl({ … })` — override `CalendarIntl` strings/functions
  app-wide (per-field merge — only specify the keys you want to replace).
- Locale packs — `import { de } from 'ngx-tw/calendar'` (also `fr`, `es`,
  `pt`, `ja`) and pass via the per-instance `[intl]` input.
- `{ provide: TZ_OVERRIDE, useValue: 'Europe/Bucharest' }` — pin a calendar
  to an IANA timezone independent of the user's environment (TZ-aware
  adapters honour it; floating adapters ignore it).

If you forget to register an adapter, the component will throw at
construction with the standard Angular DI error pointing at the
`DATE_ADAPTER` token.

---

## Deprecated type aliases still exported

The calendar entry point keeps a small set of `@deprecated` re-exports so
in-workspace callers (`date-picker`, `date-range-picker`) keep building during
the cutover. They will be removed in a later phase (Phase 10 per the plan):

| Deprecated alias | New name | Source |
|---|---|---|
| `CalendarView` | `CalendarViewState` | `ngx-tw/calendar` |
| `TwCalendarView` | `CalendarViewState` | `ngx-tw/calendar` |
| `TwDateFilter` | `DateFilterFn<D>` | `ngx-tw/calendar` |
| `TwCalendarCellClassFn` | `DateClassFn<D>` | `ngx-tw/calendar` |

Update import sites at your convenience. Today they are exact aliases so the
swap is a pure rename.

---

## Where to file issues

- Background and phase plan: `docs/calendar-refactoring-plan.md`
- Resolved decisions: `docs/calendar-plan_decisions.md`
- Spec of record: `docs/requirements/calendar-component-requirements.md`
- Issues: open one against the [ngx-tw repository](https://github.com/ciprianiuga/ngx-tw/issues) and tag with `calendar`.

If you hit a migration case this guide does not cover, please file the issue
with a minimal reproduction — the guide is updated as later phases land.
