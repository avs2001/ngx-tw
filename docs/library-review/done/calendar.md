# Calendar — Production-Grade Review

**Entry point:** `ngx-tw/calendar`
**Files:** `projects/ngx-tw/calendar/`

## Snapshot
- Selectors: element `tw-calendar`; sub-components `tw-calendar-header`, `tw-calendar-month-view`, `tw-calendar-year-view`, `tw-calendar-years-view`, `tw-calendar-cell`; attribute `[twCalendarPresets]`; mode-attr directives `tw-calendar[mode="single"]`, `tw-calendar[mode="multiple"]`, `tw-calendar[mode="range"]`.
- Public classes/directives: `CalendarComponent`, `CalendarHeaderComponent`, `CalendarCellComponent`, `MonthViewComponent`, `YearViewComponent`, `YearsViewComponent`, `CalendarViewBase`, `CalendarPresetsDirective`, `CalendarSingleDirective`, `CalendarMultipleDirective`, `CalendarRangeDirective`, `CalendarIntl`, plus selection strategies & `NativeDateAdapter`/`LuxonDateAdapter` and harnesses.
- Inputs: **27** on `CalendarComponent` (overlay + form-control combo — exception applies).
- Outputs: **18** on `CalendarComponent` (`valueChange`, `selectionStart`, `rangePreview`, `selectionComplete`, `selectionRestart`, `selectionCleared`, `selectionLimitReached`, `presetChange`, `viewChange`, `activeDateChange`, `monthChange`, `yearChange`, `opened`, `closed`, `cellClick`, `cellHover`, `renderedMonthsCount`, `modeChange`).
- Slots: **1** (`select="[twCalendarPresets]"`).
- CVA: yes (implements `ControlValueAccessor`, `Validator`).
- `tv()` config: yes; slots used on `CalendarComponent` (`root`, `months`), `CalendarHeaderComponent` (`root`, `navButton`, `periodButton`), `CalendarCellComponent` (`wrapper`, `button`).
- A11y CDK utilities used: `LiveAnnouncer` (calendar.ts:273); no `FocusMonitor`/`FocusTrap` (those live in the pickers).

## Inputs

Selected inputs (high-signal subset; full set in `calendar.ts:317–474`):

| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `mode` | `model<CalendarMode>` | `'single'` | yes | Runtime changes emit canonical clear→modeChange→valueChange |
| `value` | `model<CalendarValue<M, D>>` | `null` | yes | Mode-narrowed generic |
| `startAt` / `minDate` / `maxDate` | `input<D \| null>` | `null` | yes | Standard CDK date constraint pattern |
| `dateFilter` | `input<DateFilterFn<D> \| null>` | `null` | yes | `false` ⇒ disabled |
| `disabledDates` | `input<DisabledDates<D> \| null>` | `null` | yes | Array or predicate — OR-combined with `dateFilter` |
| `disabledDaysOfWeek` | `input<readonly number[]>` | `[]` | yes | 0=Sun … 6=Sat |
| `constraints` | `input<CalendarConstraints<D> \| null>` | `null` | yes | Bundle shorthand for the 5 fields above |
| `minRangeLength` / `maxRangeLength` | `input<number \| null>` | `null` | yes | Range mode only |
| `maxSelections` | `input<number \| null>` | `null` | yes | Multiple mode |
| `maxSelectionBehavior` | `input<MaxSelectionBehavior>` | `'emit-limit-reached'` | yes | tri-state |
| `errorAriaDescribedBy` | `input<string \| null>` | `null` | yes | Wired to `aria-describedby` |
| `blockInvalidRangeCommit` | `input<boolean>` | `false` | yes | **v1.1 placeholder no-op** — warns in dev |
| `rangeClickBehavior` | `input<RangeClickBehavior>` | `'restart'` | yes | |
| `allowBackwardRange` | `input<boolean>` | `false` | yes | |
| `allowSingleDayRange` | `input<boolean>` | `true` | yes | **Codified TRUE-default — OK** |
| `persistPartialRange` | `input<boolean>` | `true` | yes | **Codified TRUE-default — OK** |
| `disableRangesCrossingDisabledDates` | `input<boolean>` | `false` | yes | |
| `dateClass` | `input<DateClassFn<D> \| null>` | `null` | yes | |
| `bordered` | `input<boolean>` | `true` | yes | **Codified TRUE-default — OK** |
| `startView` | `input<CalendarViewState>` | `'day'` | yes | |
| `firstDayOfWeek` | `input<number \| null>` | `null` | yes | Override adapter default |
| `monthColumns` | `input<number>` | `1` | yes | 1 or 2 |
| `disabled` / `readonly` | `input<boolean>` | `false` | yes | OR-merged with `cvaDisabled`/`cvaReadonly` |
| `resetBehavior` | `input<ResetBehavior>` | `'full'` | yes | |
| `cellTemplate` | `input<TemplateRef<…>>` | `null` | yes | Slot-style |
| `locale` | `input<string \| null>` | `null` | yes | falls back to `LOCALE_ID` |
| `intl` | `input<Partial<CalendarIntl> \| null>` | `null` | yes | per-field merge |

### Findings
1. **`blockInvalidRangeCommit` is shipped as a v1.1 placeholder no-op** (calendar.ts:393, 689–699). Acceptable as a forward-compatible slot, but it leaks Phase-vocabulary out the public surface. Either gate it behind `experimental_` naming or rename to clarify intent.
2. **`monthColumns: 1|2` is phase-bounded** (calendar.ts:449); the JSDoc itself flags Phase 9 will replace it with a full `numberOfMonths: 1..12+` surface. Track for a breaking-change rename before v1.
3. **`mode` is a `model()` not `input()`** while every other mode-defining input is one-way. The two-way is rarely useful and risks accidental writes from consumers — confirm intent vs. converting to `input()`.
4. **Two-way for `value: model()`** is correct.
5. **`firstDayOfWeek` does not validate range** (0–6) — out-of-range input is dropped silently in the computed (calendar.ts:920–924). Either coerce or warn in dev.

## Outputs

| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `valueChange` | `CalendarValue<M, D>` | propertyChange | from `model()` |
| `selectionStart` | `{ start: D }` | propertyChange-ish | range only |
| `rangePreview` | `RangePreviewEvent<D>` | propertyChange-ish | tentative + invalid flag |
| `selectionComplete` | `SelectionCompleteEvent<M, D>` | past tense | with `reason` discriminator |
| `selectionRestart` | `{ start: D }` | past tense | range only |
| `selectionCleared` | `SelectionClearedEvent` | past tense | reasoned |
| `selectionLimitReached` | `{ limit, attempted }` | past tense | multi only |
| `presetChange` | `string \| null` | propertyChange | preset id |
| `viewChange` | `ViewChangeEvent` | propertyChange | with `reason` |
| `activeDateChange` | `D` | propertyChange | |
| `monthChange` | `{ year, month }` | propertyChange | day-view nav |
| `yearChange` | `{ year }` | propertyChange | year-page nav |
| `opened` / `closed` | `void` | past tense | **Never emit in inline mode** (Phase 10 placeholder) |
| `cellClick` | `{ date, event }` | past tense | analytics |
| `cellHover` | `{ date }` | past tense | analytics |
| `renderedMonthsCount` | `number` | propertyChange-ish | **Not yet wired** |
| `modeChange` | `ModeChangeEvent` | propertyChange | |

### Findings
1. **Phase-placeholder outputs are still public.** `opened`, `closed`, and `renderedMonthsCount` are declared but never emitted (calendar.ts:525–538). Either remove until they fire or document loudly that they are inert in inline mode.
2. **`rangePreview` payload has `invalidPreview` but no commit-side cousin.** Consumers can't tell from `selectionComplete` whether a committed range crosses constraints. Consider an `invalidCommit` flag, or a deterministic validator-error event.
3. **`presetChange` is documented but `_selectedPresetId` is never written** in calendar.ts — preset wiring is Phase 12 and entire flow is no-op. Same documentation discipline issue as #1.
4. **Two-way `mode = model()` and `value = model()` both share an emitter name with explicit `output()`s in some specs** — confirmed safe here (single `valueChange` / `modeChange` per pair). Spec at calendar.spec.ts:101–112 calls out the ambiguity for tests.
5. **No `touchedChange` or `pristineChange` outputs** — but since the form-directives expose `touched` via two-way model, this is fine.

## Customization surface
- ng-content slots: `select="[twCalendarPresets]"` at calendar.ts:175 — single slot above the grid.
- Structural directives: `CalendarPresetsDirective` (calendar-presets.ts:8) — marker directive that styles the projected rail with `flex flex-wrap items-center gap-1.5 px-2 pb-2`.
- Fallback content: not used. Presets rail simply renders nothing when not projected.
- Class merging: `twMerge: true` on every `tv()` config (calendar.ts:112, calendar-cell.ts:90, calendar-header.ts:25). Consumer overrides resolve correctly.
- Findings:
  1. **No `cellTemplate` slot is exposed via projection** — it is an input. Consider also accepting `<ng-template twCalendarCell let-cell>` for ergonomic parity with `*twTabPanel` style.
  2. **No footer slot.** Consumers building action bars (Today/Clear/Apply) under the calendar must wrap or use the pickers' embedded action bar. A `select="[twCalendarFooter]"` slot would be obvious.
  3. **No `intl` projection path** — DI + `intl` input only. Adequate but adding a `<ng-template>` for cell aria-labels would help complex i18n.

## CSS / Styling
- tailwind-variants: yes. Slots: root/months at calendar.ts:94–113; wrapper/button at calendar-cell.ts:24–91; root/navButton/periodButton at calendar-header.ts:13–26.
- twMerge: yes (all three configs).
- Semantic tokens: primary scale for selected/today/preview (calendar-cell.ts:38–82), `text-on-primary` for solid-fill foregrounds (calendar-cell.ts:44, 48, 56) — correct usage; uses surface/fg/border tokens for chrome (calendar.ts:97, calendar-header.ts:16–20, calendar-cell.ts:38, 70). No raw palette colors in components.
- Surface/fg/border tokens: well-applied throughout.
- Radius compliance: `rounded-lg` on shell (calendar.ts:102), `rounded-full` for day cells (calendar-cell.ts:33), `rounded-md` for month/year cells (calendar-cell.ts:34–35), `rounded-md` for period button (calendar-header.ts:20), `rounded-full` for nav buttons (calendar-header.ts:18), `rounded-l-full`/`rounded-r-full` for range endpoints (calendar-cell.ts:48, 56, 78, 80). All canonical.
- Spacing/gap compliance: `p-2` on root (calendar.ts:97), `px-2 py-1 mb-2` on header (calendar-header.ts:16), `px-3 py-1.5` on period button (calendar-header.ts:20) — canonical. **Year/multi-year views use `gap-1` on the month-cell grid** (year-view.ts:32, multi-year-view.ts:35) — within policy; day view uses `gap-0` for contiguous range backgrounds (month-view.ts:42, 55). Presets directive uses `gap-1.5 px-2 pb-2` (calendar-presets.ts:11) — canonical.
- Typography compliance: cell text `text-sm` (calendar-cell.ts:33–35) — canonical; **weekday header uses `text-xs` (month-view.ts:46)** — the review rules call for `text-2xs` on weekday labels because they are xs-density secondary text. Re-evaluate against rule "Weekday labels `text-2xs`".
- Focus rings compliance: every interactive element uses `focus-visible:outline-2 outline-offset-2 outline-primary-500` — calendar-cell.ts:29 (cells), calendar-header.ts:18, 20 (header buttons). No menu-item carve-out misuse. **Today indicator uses `ring-1 ring-primary-500`** which is a selected/persistent state ring, not focus — that's a different convention from "selected uses `ring-2 ring-offset-2`". Today is NOT a selected state but ranks above hover; the 1-px ring reads as a soft indicator. Acceptable, but inconsistent with the codified `ring-2` for persistent selection.
- Dark mode handling: explicit `dark:` overrides on color variants — `dark:text-primary-400`, `dark:bg-primary-900/30`, `dark:bg-primary-900/40`, `dark:text-primary-200` (calendar-cell.ts:41, 52, 64, 68, 78–80). Convention-compliant.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on every interactive surface — correct property-specific transition + reduced motion handling.
- Shadows: `shadow-sm` on bordered root (calendar.ts:102) — canonical. Nothing else.
- Icon sub-scale: header chevrons are inline SVGs sized `h-5 w-5` (calendar-header.ts:46, 79). **Violation** — should use the glyph sub-scale `size-5`. The nav button container is `h-9 w-9` (calendar-header.ts:18); per the "square interactive targets" scale the `md` step is `size-8`. Either move to `size-8 size-7…size-9` per `size` input, or document why fixed.
- Findings:
  1. **Nav-button sizing is not sized to the `size` input.** Header is fixed at `h-9 w-9` regardless of consumer `size` (no `size` input even exists on the header — calendar-header.ts has no size variant). The pickers' calendars therefore look identical across xs/sm/md/lg/xl. Codify a `size` variant and map nav/period/cell dimensions to the size scale.
  2. **Day cells are fixed `h-9 w-9` (calendar-cell.ts:33).** Same root cause — no `size` driving cell density. Plain calendar at `size="xs"` does not exist.
  3. **Weekday labels use `text-xs` (month-view.ts:46)** instead of `text-2xs`. Smallest permitted step for "xs-density secondary text" per the rules — see CLAUDE.md typography table.
  4. **Calendar widths not pinned via `w-calendar-{size}`** despite the theme tokens existing (`projects/ngx-tw/theme/_semantic.css:19–27`). Month/year/multi-year views currently rely on `inline-block` + cell-width math (h-9 w-9). The view-transition aesthetic breaks when month/year cells are wider (`h-10 w-16`, calendar-cell.ts:34). Apply `w-calendar-{size}` to the root and switch views to a constrained grid — that's exactly what the theme width tokens are for.
  5. **Header SVGs use `h-5 w-5`** — switch to `size-5` glyph utility for sub-scale compliance.
  6. **`shadow-sm` is bordered-only.** Inline calendar without border has no elevation cue. Currently fine; document if intentional.

## Accessibility
- ARIA roles/attributes:
  - Root `role="application"` (calendar.ts:159) with `aria-label` and `aria-disabled`/`aria-readonly`/`aria-describedby` on the host (calendar.ts:151–153).
  - Each view exposes `role="grid"` + `aria-label` + `aria-multiselectable` (month-view.ts:36–38, year-view.ts:26–28, multi-year-view.ts:28–30) — `multiSelectable` correctly tracks `mode !== 'single'` (calendar.ts:934).
  - Rows use `role="row"`; weekday headers `role="columnheader"`; cells `role="gridcell"` (calendar-cell.ts:105); cell button carries `aria-label` (full-date format), `aria-selected`, `aria-disabled`, `aria-current="date"` for today (calendar-cell.ts:130–135).
  - Roving tab index handled correctly via `[attr.tabindex]` driven by `isActiveCell()` (month-view.ts:61, year-view.ts:37, multi-year-view.ts:40).
- Keyboard support: complete — Arrow Left/Right/Up/Down, Home, End, PageUp, PageDown handled per view (month-view.ts:174–222 day arithmetic, year-view.ts:101–147 month grid, multi-year-view.ts:105–153 year grid). **Shift+PageUp/Down is NOT implemented** for year jumps. The Material baseline uses Shift+PageDown to skip a whole year — current implementation only uses PageDown for next month (day view). Consider adding Shift+PageUp/Down → ±12 months in day view, ±10 years in month view.
- CDK utilities: `LiveAnnouncer` injected (calendar.ts:273) and used for nav direction + view switches (calendar.ts:1724–1734). **No `FocusTrap`** — correct for inline; trap lives in pickers. **`FocusMonitor` not used in calendar** — focus tracking is `(focusout)` host listener (calendar.ts:154, 869–877).
- Live announcement: nav direction (`navigatedTo`) + view switch (`viewSwitched`) are announced. **`selectionComplete` / `rangeUpdateAnnouncement` / `multipleSelectionAnnouncement` are NOT wired** — `CalendarIntl` defines all three (calendar-intl.ts:146–168) but `commitValue` (calendar.ts:1614–1625) does not call `liveAnnouncer.announce` after a selection. Selection feedback is therefore silent for AT users.
- AXE risks:
  - `role="application"` is a strict landmark — AT users lose default arrow-key passthrough. Material chose `role="grid"` on the inner view and no application role at the root. The current double-stack (`application` outside + `grid` inside) may trigger AXE/Lighthouse warnings about nested landmarks.
  - `[attr.aria-multiselectable]="true"` on a `role="grid"` is correct; the spec also expects `aria-readonly` on the grid when applicable — currently only on the host (calendar.ts:153). The grid still claims selection while the orchestrator rejects clicks in readonly mode.
- Findings:
  1. **Wire selection-complete announcements.** Use `CalendarIntl.selectedAnnouncement` / `rangeUpdateAnnouncement` / `multipleSelectionAnnouncement` in `commitValue` (calendar.ts:1614) and on range start (`enterSelecting`, calendar.ts:1541) using `rangeStartAnnouncement`. The strings are already localized.
  2. **Add Shift+PageUp/PageDown** for year jumps. Hook the `event.shiftKey` from `KeyboardEvent` into `onKeyNav` (currently `CalendarCellKeyNavEvent` drops the shift flag — calendar-cell.ts:230–252).
  3. **Reconsider `role="application"` on the root** in favor of a plain semantic wrapper + `role="group"` aria-label, with `role="grid"` retained on the views. Application-role hijacks AT keyboard handlers and is generally discouraged outside of canvas/widget editors.
  4. **Forward readonly to the grid host.** Add `[attr.aria-readonly]` on each view's grid `<div role="grid">` for `effectiveReadonly()`.
  5. **`invalid-flash` cell carries `data-state-invalid-flash` but no aria announcement.** When `'require-clear'` rejects a click or a disable-crossing range is rejected, the user gets a visual flash only. Add an `aria-live` polite announcement (e.g., "Selection rejected — disabled date in range").

## Form integration
- CVA implementation: `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState` all present (calendar.ts:769–847). Lazy `NgControl` lookup avoids construction-time cycle (calendar.ts:742–767).
- Validator integration: `NG_VALIDATORS` provider + `validate()` runs `calendarValidator` with full constraint context (calendar.ts:849–866). Validator codes are typed (`CalendarErrorCode`, calendar.types.ts:78–88).
- ErrorStateMatcher integration: **not integrated** — the calendar exposes `errorAriaDescribedBy` but does not consume `TW_ERROR_STATE_MATCHER`. Error styling is left to the consumer (or to the wrapping picker, which DOES use it).
- form-field interop: **not directly** — `FormFieldControl` is not implemented; only the pickers integrate with `<tw-form-field>`. The calendar's host carries `aria-describedby` for any consumer-rendered error region.
- Locale handling: `Intl.DateTimeFormat` via `NativeDateAdapter.format` (which the calendar pushes the resolved locale into — calendar.ts:705–708). Luxon adapter also shipped. The `CalendarIntl` service holds all UI strings with shipped packs for `de`/`fr`/`es`/`pt`/`ja` (calendar-intl-*.ts) and per-field merge via `intl` input.
- Findings:
  1. **The calendar is a form control without `FormFieldControl`.** That's intentional (pickers wrap it) but means a consumer who needs the calendar in a form-field (e.g. an inline calendar with hint/error rows) cannot use `<tw-form-field>`. Consider an opt-in `FormFieldControl` adapter for the inline case.
  2. **Consider wiring `TW_ERROR_STATE_MATCHER` directly into `CalendarComponent`** so the bordered shell can flip to `border-error-500` on `errorState()`. Today only the wrapping picker reflects errors.
  3. **Adapter abstraction is good** but `withTime` (date-adapter.ts:109) is flagged "not part of v1 calendar spec" yet the time-picker depends on it. Make this contract explicit (e.g. require it for the date-picker entry point).
  4. **No `WeekSelectionStrategy` exposure on the public mode union.** The strategy ships (selection/week-selection-strategy.ts) but `CalendarMode = 'single' | 'multiple' | 'range'` excludes `'week'`. Documented as `[WONT] v1` — confirm intent and either add it or remove the strategy from public exports.

## Tests
- Spec file: yes — `calendar.spec.ts` (1,631 lines, **97 it blocks**, 19 describe blocks).
- Coverage breakdown:
  - Rendering: default, application landmark, aria-label, default day-grid view.
  - Selection: single, multiple (with toggle/deselect), range with `selectionStart`, `valueChange`/`selectionComplete` ordering, auto-swap, restart on 3rd click, selection-state transitions.
  - Mode change at runtime (canonical emit order).
  - View changes: period click drill-up, programmatic `setView`.
  - CVA: `writeValue` displays, user click invokes `onChange`, `writeValue(null)` clears, `setDisabledState` blocks interactions.
  - Constraints: full coverage of `minDate`/`maxDate`/`disabledDates` (array + predicate)/`disabledDaysOfWeek`/`dateFilter` + the bundled `constraints` shorthand.
  - Range constraints: `minRangeLength`/`maxRangeLength` with `rangePreview.invalidPreview`.
  - Keyboard navigation: ArrowLeft/Right/Up/Down, Home/End, PageUp/Down, Enter, Space (in day view only).
  - `firstDayOfWeek` shift.
  - Public methods: `focusDate`, `goToDate`, `goToToday`, `clear`, `reset`, `setView`.
- Vitest issues: **zero** `fakeAsync`/`tick` calls. Uses `vi.fn`, `setInput`, `whenStable()` correctly. No `mutate` usages.
- Findings:
  1. **Year-view + multi-year-view keyboard nav is not tested** — only the day grid is covered. Add tests for ArrowLeft/Right/Up/Down in month-of-year and decade-page views (the implementations have bounds clamping per view; risk of regressions is real).
  2. **No locale tests.** Switching `locale` input should change the rendered month name, weekday header, and ARIA labels. Add a test using `'de-DE'` against a known month.
  3. **No leap-year/DST tests.** Adding Feb 29 navigation in 2024/2026 and a DST-transition day (e.g., March 10, 2024 in `America/New_York`) would protect adapter edge cases.
  4. **`Shift+PageUp/PageDown` is untested** because it isn't implemented (see A11y finding #2).
  5. **No `selectionLimitReached` / `maxSelectionBehavior` test.** Multi-mode limit handling has three branches (`emit-limit-reached`, `replace-oldest`, `ignore`) and is currently uncovered.
  6. **No persist-partial / clear-partial range test.** `persistPartialRange = true` is a codified true-default; behavior on view change while SELECTING is not exercised.
  7. **`writeValue` shape-mismatch dev-warn path is not asserted** to call `validatorOnChange` exactly once or to set `_lastInvalidFormValue`. (The validator emits `calendarInvalidValue` from this state — directly testable via the public `validate` API.)

## Gaps & lacks
1. **Phase-placeholder API surface** (`opened`, `closed`, `renderedMonthsCount`, `blockInvalidRangeCommit`, `monthColumns` 1|2 cap) leaks unfinished surfaces into v1.
2. **No `size` axis on the calendar** — pickers can request a smaller calendar inside a small form, but the calendar always renders at fixed `h-9 w-9` cells.
3. **Selection-complete is silently committed** for AT users (no `LiveAnnouncer.announce` after commit; the intl strings exist).
4. **Weekday header typography off-policy** (`text-xs` not `text-2xs`).
5. **Calendar width tokens unused** — view transitions are jumpy because grids resize between day/month/year.
6. **`role="application"` may over-claim** for screen readers; the inner grids already carry semantics.
7. **Year/multi-year keyboard nav untested.**
8. **No locale or DST/leap-year tests.**
9. **`TwCalendarPresets` class — the README mentions this name, but the actual public class is `CalendarPresetsDirective`.** No `Tw`-prefixed class exists. (Historical debt note: the project plan tracks `TwSplit`/`TwCalendarPresets` renames in PR4/PR6; `CalendarPresetsDirective` was already renamed.)
10. **Shape-mismatch dev warning fires only once per instance** (`_warnedShapeMismatch`, calendar.ts:654) — subsequent invalid writes are silent. Consider rotating the gate or always firing in dev.
11. **`flashInvalid` schedules `setTimeout` outside `runOutsideAngular`** (calendar.ts:1602–1611) — fine because the timer only writes a signal, but zone bookkeeping is impacted in zoned applications.

## Concrete recommendations (deep-dive prompt body)

### Goal
Bring `tw-calendar` to Angular Material parity on accessibility, polish, and surface stability: announce selection commits to AT, add Shift+Page-jump keyboard moves, give the calendar a `size` axis with pinned widths from the `w-calendar-{size}` tokens, retire phase-placeholder outputs, drop the deprecated type aliases that pickers still import, and round out the test matrix with locale + DST + leap-year + year-view keyboard cases.

### Tasks

1. **Wire `LiveAnnouncer` announcements for selection commits.** — one-line summary
   - File(s): `projects/ngx-tw/calendar/calendar.ts:1614-1625` (`commitValue`), `calendar.ts:1540-1549` (`enterSelecting`).
   - Why: `CalendarIntl.selectedAnnouncement`, `rangeStartAnnouncement`, `rangeUpdateAnnouncement`, and `multipleSelectionAnnouncement` are already localized but never spoken (calendar-intl.ts:146–168). Today AT users hear navigation events but nothing on commit.
   - Change: After `valueChange.emit` in `commitValue`, branch on `mode()` and call `liveAnnouncer.announce(intl.selectedAnnouncement(formatted))` (single), `intl.rangeUpdateAnnouncement(start, end, lengthDays)` (range), or `intl.multipleSelectionAnnouncement(count)` (multiple) gated on `intl.skipAnnouncement`. In `enterSelecting`, announce `intl.rangeStartAnnouncement(formatted)`. Format with `this.dateAdapter.format(d, DEFAULT_DISPLAY_FORMAT)`.
   - Acceptance: New spec in `calendar.spec.ts` mocks `LiveAnnouncer.announce`, clicks a day cell, and asserts polite announcement matches `intl.selectedAnnouncement(...)`. Repeat for range complete + multi commit.

2. **Add Shift+PageUp/PageDown for year jumps in the day view.** — keyboard parity with Material
   - File(s): `projects/ngx-tw/calendar/calendar-cell.ts:230-246` (drop the shift flag), `calendar-cell.ts:19-22` (extend `CalendarCellKeyNavEvent` with `shiftKey: boolean`), `projects/ngx-tw/calendar/month-view.ts:174-222` (consume the flag), `year-view.ts:101-147`, `multi-year-view.ts:105-153`.
   - Why: WAI-ARIA grid pattern expects Shift+PageUp/PageDown to step a year (day view), a decade (month view), and a century-page (year view). Today these keys produce the same result as PageUp/PageDown.
   - Change: Add `shiftKey: boolean` to `CalendarCellKeyNavEvent`. In month-view, when `pageUp`/`pageDown` AND `event.shiftKey` is set, call `dateAdapter.addYears(currentDate, ±1)`. In year-view, ±10 years. In multi-year-view, ±`YEARS_PER_PAGE`.
   - Acceptance: Add `it('Shift+PageDown advances a year', ...)` in `calendar.spec.ts` under the keyboard describe. Cover all three views.

3. **Replace fixed `h-9 w-9` cell size with a `size` input mapped to `w-calendar-{size}`.** — visual axis parity with the picker
   - File(s): `projects/ngx-tw/calendar/calendar.ts:438` (add `size`), `calendar.ts:94-113` (extend `tv()` config with a size variant on root + size-propagating effect into `tw-calendar-cell` view), `calendar-cell.ts:24-91` (size variant on `button` slot mapping to day cells), `calendar-header.ts:13-26` (size variant on nav/period buttons), `month-view.ts:46` (weekday header height).
   - Why: A `size="xs"` calendar embedded in a compact date-picker today renders at full `h-9 w-9`. Theme exposes pinned widths (`--width-calendar-{xs|sm|md|lg|xl}`) precisely so views share footprint across transitions, but the calendar never uses them.
   - Change: Add `size: input<TwSize>('md')`. On the calendar root, apply `w-calendar-{size}`. In `cellVariants`, drive day-cell `size-{n}`, month-cell `h-{n}` plus year-cell width based on the size scale. Header nav button: map to the `square interactive targets` sub-scale (`size-6` xs … `size-9` lg). Replace `class="h-5 w-5"` SVG with `size-{n}` glyph scale.
   - Acceptance: Each `TwSize` renders without errors; computed snapshot of root class contains `w-calendar-{size}` literal; visually month → year transition does not jiggle (assert root width unchanged across `viewState` writes).

4. **Move weekday labels to `text-2xs`.** — typography compliance
   - File(s): `projects/ngx-tw/calendar/month-view.ts:46`.
   - Why: Per typography rules in CLAUDE.md, weekday labels are "xs-density secondary text" and use `text-2xs` (theme token defined at `_semantic.css:30–32`). Currently `text-xs`.
   - Change: Replace `text-xs` with `text-2xs` on the columnheader div.
   - Acceptance: snapshot/computed class on a weekday cell contains `text-2xs`.

5. **Retire phase-placeholder outputs from the public surface.** — surface stability for v1
   - File(s): `projects/ngx-tw/calendar/calendar.ts:524-538` (`opened`, `closed`, `renderedMonthsCount`).
   - Why: Three outputs are declared but never emitted in inline mode (`opened`, `closed`) or in any current mode (`renderedMonthsCount`). They leak Phase 9/10 vocabulary into v1 and harden public surface against later wiring.
   - Change: Two options — (a) move them to `@deprecated` JSDoc with an explicit "no-op until phase X" warning; (b) remove until they emit. Option (b) is cleaner if the consumer-side hooks aren't shipped; the picker doesn't subscribe to them either.
   - Acceptance: `index.ts` exports unchanged; outputs either removed or annotated; tests for non-emission removed if absent.

6. **Drop deprecated `TwCalendarView` / `TwDateFilter` / `TwCalendarCellClassFn` aliases — and migrate consumers.**
   - File(s): `projects/ngx-tw/calendar/index.ts:125-132` (aliases), `projects/ngx-tw/date-picker/date-picker.ts:58, 111, 357, 360` (imports), `projects/ngx-tw/date-range-picker/date-range-picker.ts:59-60, 374, 377, 553, 1244`.
   - Why: The aliases are explicitly documented as "Phase 10 replaces the pickers… and these aliases can be removed". Phase 10 work has landed (overlay wired in the pickers).
   - Change: Replace `TwCalendarView` with `CalendarViewState` and `TwDateFilter` with `DateFilterFn` at every import site. Remove the alias block.
   - Acceptance: `npm run build:lib` passes; `git grep TwCalendarView` returns no library hits.

7. **Reconsider `role="application"` on the calendar root.**
   - File(s): `projects/ngx-tw/calendar/calendar.ts:160`.
   - Why: AT screen readers entering an `application` widget surrender their default browse-mode keyboard. The inner grid already carries `role="grid"` with full ARIA. Material removed `application` years ago.
   - Change: Drop `role="application"` from the root `<div>` (keep `aria-label`). Move `aria-readonly` from the host to each view's `<div role="grid">` so it reaches the grid landmark.
   - Acceptance: AXE check passes (no nested landmark warning); existing tests still find the calendar via `tw-calendar` selector.

8. **Round out tests: locale, DST, leap year, year-view keyboard, `selectionLimitReached`, persist-partial.**
   - File(s): `projects/ngx-tw/calendar/calendar.spec.ts`.
   - Why: Listed gaps in the Tests findings above.
   - Change: Add at least one `it` per gap. Use real `NativeDateAdapter` for DST (`new Date(2024, 2, 10)` in TZ-aware Luxon would be cleaner — both adapters ship). Use `disabled()` adapter to switch locale; assert that the rendered month name + first weekday change.
   - Acceptance: `npm test` green; coverage report shows the previously dark branches exercised.

### Out of scope
- Phase 9 `numberOfMonths: 1..12+` rewrite (still a tracked breaking change).
- Phase 14 `valueTransformer` input wiring.
- Migrating away from the legacy `CalendarCell<D>` to `DayCellContext<D, T>` (Phase 13).
- Animations for view transitions (`animate.enter`/`animate.leave`) — calendar currently swaps grids via `@switch`. Adding animations is a separate, scope-contained task.
- `WeekSelectionStrategy` exposure (`[WONT] v1`).

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Visual check: `http://localhost:4600/calendar`
- A11y: `npm run e2e:a11y` or AXE on the calendar route, with attention to landmark structure and reduced-motion behavior.

## Priority
**P1** — The calendar already implements every core capability (mode union, constraints, locale, intl, CVA, validator, full keyboard nav, harnesses, multiple adapter implementations). It is functionally Material-grade. The gaps are polish-tier: silent selection commits for AT, undersized weekday text, no `size` axis, phase-placeholder outputs, deprecated aliases still imported by sibling components, and untested locale/DST/year-view-keyboard branches. Each is one or two file edits. P0 only if the team wants the calendar locked for a v1 surface release this cycle; otherwise P1 with the announcement and Shift+Page work near the top.
