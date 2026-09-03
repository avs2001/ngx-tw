# Pass 5 — W2 (calendar / time-picker) fix report

Agent owned `projects/ngx-tw/calendar/` and `projects/ngx-tw/time-picker/` only.
Both findings were **confirmed correct** against source. Nothing outside ownership was touched.

Per the brief, no builds/tests were run. Verification was by reading plus a **scoped Angular
compile** (`ngc` over `calendar/**/*.ts` + `time-picker/**/*.ts`, including specs and template
type-checking). It passed clean, and I confirmed the check was non-vacuous by injecting a
deliberate type error into `calendar.spec.ts` and watching it go red. The scoped tsconfig was
temporary and has been deleted; sibling entry points resolve through `dist/`, so no sibling
agent's in-flight edits affected the run.

---

## Finding 1 — F-08 (HIGH) — CONFIRMED and fixed

`Object.assign` copies own enumerable properties **including** ones whose value is `undefined`.
All three sites verified by reading, and the crash paths traced to a literal method call on the
overwritten field.

### Changed

| File | Change |
|---|---|
| `projects/ngx-tw/calendar/calendar-intl.ts` | `provideCalendarIntl` filters `undefined` values before `Object.assign` |
| `projects/ngx-tw/time-picker/time-picker-intl.ts` | `provideTimePickerIntl` — same |
| `projects/ngx-tw/calendar/calendar.ts` (`effectiveIntl`) | filters `override` before `Object.assign(merged, injectedIntl, overrides)` |

The shape is copied verbatim from `provideTheme` (`theme/theme.config.ts:37`) —
`Object.fromEntries(Object.entries(x ?? {}).filter(([, v]) => v !== undefined))`. Signatures are
unchanged: purely additive, **not a semver event**.

`?? {}` is deliberate. `Object.assign(target, undefined)` is a no-op today, but
`Object.entries(undefined)` throws, so a JS consumer calling `provideCalendarIntl()` with no
argument would have started crashing without it.

### Correction to the gap report — its proposed repro is VACUOUS

The report proposes `provideCalendarIntl({ monthViewLabel: undefined })` + "drive the view switch
that crashes today". **That test passes before the fix.** `viewSwitched()` reads `monthViewLabel`
only when the *resulting* view is `'day'` — the drill-**down** path. A single period-button click
from the default day view sets the view to `'month'`, which reads **`yearViewLabel`**.

The specs therefore use `yearViewLabel` + one period click. This is the one place the report was
wrong, and it would have shipped a guard that could not fail.

### `Required<>` is deliberately NOT applied

The other half of P4-8's pattern does not transfer. `TwThemeConfig` is an interface with optional
members, so `provideTheme` tightens its token to `Required<TwThemeConfig>`. `CalendarIntl` and
`TimePickerIntl` are **classes with concrete, already-non-optional fields** — there is no
optionality to tighten. This is not a half-applied pattern; the filter is the whole applicable
half.

Note also that `Object.entries` and `Object.assign` enumerate the *same* key set (own enumerable),
so the filter changes only *which values* are copied, never which keys — no behaviour change for a
consumer passing a normal object literal.

### Specs

`projects/ngx-tw/calendar/calendar.spec.ts` — new top-level describe
`CalendarComponent intl merge (undefined-key fallback)`:

- **provider site:** `provideCalendarIntl({ yearViewLabel: undefined, calendarLabel: 'Datumsauswahl' })`,
  then `TestBed.inject(CalendarIntl).yearViewLabel === 'year view'`.
  *Non-vacuity:* before the fix `Object.assign` copied the `undefined`, so that field read
  `undefined` and the assertion is unambiguously red. The defined sibling key is asserted too, so
  the filter cannot pass by dropping everything.
  Layered behavioural half: a period-button click drives day → month and asserts the
  `LiveAnnouncer` message contains `'year'`. Before the fix `viewSwitched()` throws inside the
  click handler, `announce` is never called, and destructuring the empty `mock.calls` fails the
  test — red by either route. The direct field assertion is the primary guard precisely because it
  does not depend on whether a listener exception propagates out of `dispatchEvent` in jsdom.
- **`[intl]` input site:** an inline host binds `{ yearViewLabel: undefined, ... }` and asserts
  `calendar.effectiveIntl().yearViewLabel === 'year view'`. Red before the fix for the same reason.

`projects/ngx-tw/time-picker/time-picker.spec.ts` — added to the existing `intl` describe:
`provideTimePickerIntl({ hoursLabel: undefined, minutesLabel: 'Min' })`, asserting the injected
instance still reports `'Hours'`. *Non-vacuity:* before the fix it read `undefined`; additionally
`focusedFieldLabel()` calls `.toLowerCase()` on that field to build the stepper aria-labels, so the
**first render** threw and `setup()` itself failed.

---

## Finding 2 — F-09 (HIGH) — CONFIRMED and fixed

Verified: `effectiveDisabled` had exactly two consumers (host `aria-disabled`, and the
`onDateSelected` early return) and was never plumbed into the views, while `readonly` reaches all
four view call sites via `readonlyGrid`. `CalendarViewBase` declared no `disabled` input.

### Changed

1. `calendar-view-base.ts` — new `disabledGrid = input<boolean>(false)` beside `readonlyGrid`,
   with JSDoc stating how it differs from `readonly`.
2. `calendar.ts` — `[disabledGrid]="effectiveDisabled()"` at all four view call sites, copying the
   `readonlyGrid` wiring.
3. `month-view.ts`, `year-view.ts`, `multi-year-view.ts` — `enabled: !gridDisabled && !isXDisabled(…)`.
4. `calendar.ts` header — `[prevDisabled]="prevDisabled() || effectiveDisabled()"`,
   `[nextDisabled]` likewise, `[canSwitchView]="viewState() !== 'year' && !effectiveDisabled()"`.
   Gated **inline**; the existing `prevDisabled` / `nextDisabled` computeds keep their current
   meaning (min/max-derived) rather than being redefined.
5. `calendar.ts` — new `disabled` variant on `calendarVariants`, `root: 'opacity-50'`.

### APG justification for the `disabled` vs `readonly` split

`readonly` keeps cells selectable-looking and blocks only the commit in the orchestrator.
`disabled` removes the affordance itself: every cell reports `aria-disabled="true"`, renders the
`disabled` cell state, refuses activation, and stops emitting hover.

Both leave the grid **focusable and arrow-navigable**. Per WAI-ARIA APG, a focusable disabled
element remains "operable to the extent of allowing the user to read its state" — making the grid
unnavigable would leave a screen-reader user parked on one cell of 42 with no way to read the
month. Header buttons are a different case: they are ordinary buttons whose only purpose is to
operate the widget, so they take native `disabled`.

### Prior art preserved — neither regression reintroduced

- **No native `[disabled]` on cell buttons.** The fix flips the existing `enabled` data flag, which
  drives `[attr.aria-disabled]`. `calendar-cell.ts` is untouched. A spec asserts the tabbable cell's
  `.disabled` is `false`.
- **No zero-tabbable-cell strand.** `rovingCellValue` falls through focused → `activeDate` →
  first-enabled → first-cell, and the `activeDate` cell is always rendered, so the count stays at
  exactly **1** even with every cell disabled. Asserted directly.
- **No `pointer-events-none`**, despite CLAUDE.md's disabled table naming it as the preferred
  pairing. `calendar-cell.ts` dropped the native `disabled` attribute *because* browsers do not
  dispatch mouse events on natively-disabled buttons; suppressing pointer events on the container
  reintroduces that exact class of bug one level up. The reason is left as a comment on the variant,
  as the report asked, so a reviewer does not add it back.

### Checked for a hang before landing

`CalendarIntl.skippedPeriods` implies an auto-skip scan that could spin forever if every cell is
disabled. **It does not exist** — `skippedPeriods` is defined in the intl class and called from
nowhere in the library. The only `while` loops (`calendar.utils.ts:145`, `:166`) are bounded by date
comparison and never read `enabled`. A fully-disabled grid cannot hang.

### Correction to the gap report's proposed spec

The report asks to "assert cells are not activatable". **That assertion is vacuous** — and the
report itself says why two paragraphs earlier ("the click *is* inert (`:1371`) … which is exactly
why no test caught it"). `onDateSelected` already early-returned on `effectiveDisabled`, so
"disabled calendar emits no `valueChange`" passed before the fix. The pre-existing test at
`calendar.spec.ts` `disabled state` is exactly that shape and is likewise vacuous — I left it
alone rather than delete a passing test, but it should not be counted as coverage for F-09.

The genuinely non-vacuous behavioural delta is **hover**: `onPreviewChange` / `cellHover` carry no
disabled guard, and `CalendarCellComponent.onMouseEnter` suppresses the emit only when the cell's
own `enabled` flag is false. Before the wiring, a disabled calendar emitted `cellHover` on every
pointer move across the grid.

### Specs (all in `projects/ngx-tw/calendar/calendar.spec.ts`, `disabled state` describe)

| Spec | Why it is red before the fix |
|---|---|
| every day cell is `aria-disabled` when disabled | cells were built `enabled: true`, so the attribute was absent on all of them |
| cells stay enabled when *not* disabled | non-vacuity guard on the selector itself — proves it is not trivially true |
| exactly one tabbable cell when disabled, and it is not natively disabled | the tab-order invariant the brief asked for; also guards the two register regressions |
| `cellHover` stops firing from a disabled grid | asserts the enabled baseline emits first, then that the disabled grid does not — before the fix the second emit still happened |
| month view and multi-year view cells disabled (`it.each`) | same as the day grid; covers the other two cell builders. Asserts the enabled baseline first (with no min/max every cell was enabled, which is precisely why the disabled assertion is red before the fix), and flushes the `setView` switch in its own change-detection pass so the view flip and the `disabled` flip are independent |
| form-bound `setDisabledState(true)` reaches the cells, and reverses | this is the exact path the e2e fixme records; asserts the enabled baseline first and the un-disable after, so it cannot latch |

---

## Deliberately NOT done

- **`e2e/specs/01-components/calendar.spec.ts:153` `test.fixme` left in place.** It is outside my
  ownership. It is inert (skipped, not failing), so leaving it costs nothing. **Orchestrator
  follow-up:** the fix now makes it pass and it should be un-skipped. I confirmed the demo control
  it needs already exists — `projects/demo/src/app/routes/calendar/examples/calendar-examples.component.ts:266`
  ("Toggle disabled"). Its assertion
  (`[role="grid"] button:not([aria-disabled="true"])` → count 0) matches the new behaviour exactly.
- **`Required<>` on the intl types** — inapplicable, reasoned above.
- **Arrow-key navigation inside a disabled grid** — left working, on the APG grounds above. It
  commits nothing (`onDateSelected` early-returns) and only moves the roving cursor.
- **Redundant `effectiveDisabled` guards in `onPrevClicked` / `onNextClicked` / `onPeriodClicked`** —
  the header buttons now carry native `disabled`, which does not fire click. Kept the change surface
  tight.
- **`onMonthSelected` / `onYearSelected` disabled guards** — unreachable, since those views' cells
  are now disabled and refuse to emit.

## Risk / uncertainty surfaced

- Specs were **not executed** (per the brief). Type-correctness and template correctness are
  verified by a clean scoped `ngc`; runtime behaviour is reasoned, not measured. This is the main
  residual risk: if the orchestrator's central run turns up a red spec here, suspect the assertion
  wiring rather than the fixes, which are independently confirmed by reading.
- One self-inflicted defect was caught and fixed during review: a `perl` one-liner silently
  inserted four stray `="effectiveDisabled()"` lines into the `calendar.ts` template, because Perl
  parsed `$2[disabledGrid]` in the replacement as an array subscript. **Angular's `ngc` compiled the
  malformed template without error**, so the type-check did not catch it — only reading the diff
  did. Removed; the final template diff is four clean `[disabledGrid]` bindings.

## Files touched

```
projects/ngx-tw/calendar/calendar-intl.ts
projects/ngx-tw/calendar/calendar-view-base.ts
projects/ngx-tw/calendar/calendar.ts
projects/ngx-tw/calendar/month-view.ts
projects/ngx-tw/calendar/year-view.ts
projects/ngx-tw/calendar/multi-year-view.ts
projects/ngx-tw/calendar/calendar.spec.ts
projects/ngx-tw/time-picker/time-picker-intl.ts
projects/ngx-tw/time-picker/time-picker.spec.ts
```

No public signature changed. No exported symbol renamed or removed. No semver event.
