# Calendar Component — Refactoring Plan

**Target spec:** `docs/requirements/calendar-component-requirements.md` v2.6
**Current state:** `projects/ngx-tw/calendar/` — basic 3-view grid with pluggable selection strategies; ~15–20 % of v1 spec coverage.
**Plan scope:** bring the component to v1 `[REQ] [MUST]` compliance. `[SHOULD]` / `[COULD]` / v1.1 items are scheduled only where they fall out naturally from a `[MUST]` phase.

---

## 1. Guiding Principles

1. **Correctness before breadth.** Land the state model, event ordering, and form contract first. Every downstream feature depends on them — building presets, text input, or overlay on the current partial foundation means reworking them later.
2. **One breaking cutover, not many.** Rename and retype the public surface in a single landing (end of Phase 1). Consumers of the current component should migrate once.
3. **Spec § → code traceability.** Every phase below lists the requirement sections it discharges. PRs reference the section numbers in their description.
4. **Tests co-land with features.** No phase is "done" until it ships unit + harness tests covering the §35 matrix for the work in that phase.
5. **Headless form contract.** The component does not render validation error UI (§28). Exposed error codes + `aria-invalid` + `errorAriaDescribedBy` are the contract.
6. **Semantic tokens only.** No raw Tailwind palette colors. `data-state-*` attributes are the consumer styling hook (§34.5).
7. **CDK first.** Overlay positioning, focus trap, live announcer, virtual scroll, and coercion go through `@angular/cdk`. No hand-rolled substitutes.

---

## 2. Non-Goals (Explicitly Out of Scope)

Mirroring §42 to prevent scope creep during execution:

- Interactive schedule / event-bar mode (§42.1) — separate v2 sibling.
- Drag-to-select (§42.3) — permanent `WONT`.
- Time-of-day / datetime picker (§42.2).
- Multi-range, recurring, partial-day selection (§42.2).
- Non-Gregorian adapters (§19.5, `[WONT]` v1).
- `DateFnsDateAdapter`, `TemporalDateAdapter` (§20.4, v1.1).
- `persistentStateId` (localStorage-backed) (§8.6, v1.1+).
- `ng add` / `ng generate` schematics (§37.1, v1.1).
- Input masking default-on (§9.3, opt-in only).

These are named here so execution never accidentally picks them up.

---

## 3. Sequencing Overview

```
Phase 0  Decisions & Migration shape
Phase 1  Type system + Internal state model + Event outputs     ← breaking cutover
Phase 2  DateAdapter surface alignment
Phase 3  Form integration (CVA full + Validator + Signal Forms)
Phase 4  Constraints, validation, error codes, data-state-*
Phase 5  CalendarIntl + locale + LOCALE_ID wiring
Phase 6  Range flow completion (rangeClickBehavior, draft model, invalid preview)
Phase 7  Display / navigation completeness (showWeekNumbers, adjacent months,
         today/clear buttons, dead-end prevention, empty state)
Phase 8  View switching completeness (rangeGranularity, drill rules, viewChange shape)
Phase 9  Multi-month (n-panes, layout, responsive, pane-edge arrows)
Phase 10 Overlay lifecycle + interaction mode + mobile responsive
Phase 11 CalendarInputDirective + CalendarCoordinator (text input)
Phase 12 Presets (data contract, a11y, revalidation, selectedPresetId)
Phase 13 Day cell customization (dayData, dayDataFn, dayBadge, DayCellContext, templates)
Phase 14 Cross-field validators + value transformer
Phase 15 Accessibility pass (ARIA completeness, live regions, SR matrix)
Phase 16 SSR / hydration hardening
Phase 17 Performance (memoization keys, predicate caching, budgets, CI gate)
Phase 18 Testing harness expansion + spec coverage pass
Phase 19 Luxon adapter entry point
Phase 20 Documentation + changelog + demo app pages
```

Phases 1–4 are strictly ordered. Phases 5–14 share Phase 1's foundation and can parallelize in pairs after alignment. Phases 15–20 are final-pass hardening.

---

## 4. Phase Breakdown

Each phase lists: **Spec refs · Deliverables · Files · Breaking? · Acceptance.**

### Phase 0 — Decisions & Migration Shape

**Goal:** unblock Phase 1 by resolving naming/shape questions that affect every file.

**Decisions to record in `docs/open_decisions.md`:**
1. **Back-compat inputs.** `withTime`, `timeFormat`, `showSeconds`, `hourStep`, `minuteStep`, `secondStep`, `minTime`, `maxTime`, `color`, `size`, `headerless` — remove in v1 cutover (no legacy consumers yet) vs. keep as `@deprecated` no-ops.
   *Recommendation: remove.* The library is pre-1.0; there are no external consumers to break.
2. **Dual `selected` + `value` model.** Collapse to a single `value: ModelSignal<CalendarValue<M, D>>`. Drop the back-compat `selected` alias and the mutual `effect()` sync.
3. **`selectionMode` → `mode` rename** and `'multi'` → `'multiple'` rename to match spec §5.
4. **Drop `week` mode.** Not in v1 spec; week-as-unit selection is `[WONT] v1`. The existing `WeekSelectionStrategy` + provider stays available to advanced consumers via DI but is not exposed through `mode`.
5. **Adapter method names.** Spec §20.2 uses `addYears`/`addMonths`/`addDays`/`compare`/`create` (1-based month). Impl uses `addCalendarYears`/`addCalendarMonths`/`addCalendarDays`/`compareDate`/`createDate` (0-based month). Commit to spec names + 1-based month; write a migration note for the adapter surface.
6. **View naming.** Spec `'day' | 'month' | 'year'` vs. impl `'month' | 'year' | 'multi-year'`. Adopt spec names. The current `month` view becomes `day`; `multi-year` becomes `year` with a separate decade-grid mode configured by `yearsPerPage`.

**Deliverable:** an amendment entry in `docs/calendar-plan_decisions.md` capturing the six decisions above.

**Acceptance:** written decisions reviewed; no ambiguity left for Phase 1.

---

### Phase 1 — Type System, Internal State Model, Event Outputs (Breaking Cutover)

**Spec refs:** §5, §7, §8, §21.1, §21.5, §30, §33.1, §33.2, §33.3.

**Goal:** establish the canonical value contract and state machine. Every later phase reads and writes against it.

**Deliverables:**

- `calendar.types.ts`: add `CalendarMode`, `CalendarSingleValue`, `CalendarMultipleValue`, `CalendarRangeValue`, `CalendarValue<M, D>`, `CalendarSelectionState`, `CalendarViewState` (`'day' | 'month' | 'year'`), `CalendarOverlayState`, `CalendarErrorCode`, `CalendarValidationErrors`, `RangeClickBehavior`, `RangeGranularity`, `MaxSelectionBehavior`, `ResetBehavior`, `MobileMode`.
- `calendar.ts`: new generic signature `CalendarComponent<M extends CalendarMode = 'single', D = Date, TOut = CalendarValue<M, D>>`.
- New internal state signals (private):
  - `externalValue = model<CalendarValue<M, D>>()` (consumer-bound; collapses `selected` + `value`).
  - `internalDraftValue: WritableSignal<{ start: D } | null>` for range SELECTING.
  - `selectionState: WritableSignal<CalendarSelectionState>`.
  - `viewState: WritableSignal<CalendarViewState>`.
  - `activeDate: WritableSignal<D>`.
  - `hoveredDate: WritableSignal<D | null>`.
  - `overlayState: WritableSignal<CalendarOverlayState>` (stays `'closed'` in inline mode; replaced with null-returning readonly in Phase 10 per §14.1).
  - `selectedPresetId: WritableSignal<string | null>` (unused until Phase 12 but declared now).
  - `lastInvalidFormValue: WritableSignal<unknown>` (unused until Phase 14).
- Public readonly exposures (§33.3): `overlayState`, `selectionState`, `activeDate`, `selectedPresetId`, `viewState`, `displayedMonths`, `lastInvalidFormValue` — as `Signal<T>` getters derived from the writables.
- New `output()` emitters (§33.2): `valueChange`, `selectionStart`, `rangePreview`, `selectionComplete`, `selectionRestart`, `selectionCleared`, `selectionLimitReached`, `presetChange`, `viewChange` (`{from, to, reason}`), `activeDateChange`, `monthChange`, `yearChange`, `opened`, `closed`, `cellClick`, `cellHover`, `renderedMonthsCount`, `modeChange`. Phase 1 wires only the ones reachable in inline mode (skip `opened`/`closed` until Phase 10).
- **Remove** the `userSelection` output and the `selected` model alias.
- Emit-path plumbing per §8.4 / §30.2: a central `commit()` helper that performs `activeDateChange → valueChange → selection-lifecycle event` in the spec-mandated order with microtask batching (§8.5, §30.4).
- State-transition table (§8.3) encoded as explicit handlers, not ad-hoc strategy returns.

**Files:** `calendar.ts`, `calendar.types.ts`, `calendar-view-base.ts`, `month-view.ts`, `year-view.ts`, `multi-year-view.ts`, `index.ts`, `selection/*`.

**Breaking?** Yes — the public surface of the component changes shape.

**Acceptance:**
- `selectionState` transitions in §8.3 observable via the readonly signal for every row of the table.
- Event ordering in §30.2 sequences verified by unit tests with spy subscriptions.
- Range mode: first click does NOT propagate `{start, end: null}` to `value` — only `selectionStart` fires; second click fires the full commit sequence.
- Mode-change at runtime clears value, emits `selectionCleared({reason: 'mode-change'}) → modeChange → valueChange` per §11.2.
- Type-level test (`.spec-d.ts` or compile-time sample) proves `CalendarComponent<'range', Date>` infers `CalendarValue<'range', Date>` correctly for `value`.

---

### Phase 2 — DateAdapter Surface Alignment

**Spec refs:** §20.1, §20.2, §4.1–§4.3.

**Goal:** rename and extend `DateAdapter` to the spec surface. Do this BEFORE form integration so validators run against the final adapter methods.

**Deliverables:**

- `date-adapter.ts`:
  - Rename `addCalendarYears`/`addCalendarMonths`/`addCalendarDays` → `addYears`/`addMonths`/`addDays`. Add `addHours`, `addMinutes`.
  - Rename `compareDate` → `compare`.
  - Rename `createDate` → `create` and switch to **1-based month** contract. Internal call sites adjusted.
  - Add `startOfWeek(date, firstDayOfWeek?)`, `endOfWeek(date, firstDayOfWeek?)`, `startOfDay(date)`, `getDaysInWeek()`, `getDateNames(style)`.
  - Add TZ-aware hooks as optional virtuals: `getTimezone()`, `withTimezone(date, tz)`, `isDST(date)`, `resolveAmbiguous(date, prefer)`. Floating adapters implement as pass-through.
  - Add `toIso(date)` + `fromIso(iso)` (rename `toIso8601`; add `fromIso`).
  - Remove `withTime` (time-of-day is out of scope).
- `native-date-adapter.ts`:
  - Implement the renamed surface. Keep behavior equivalent.
  - Move `navigator.language` resolution into a lazy getter guarded against SSR — do not read `navigator` at class construction.
  - Implement `startOfDay` handling for DST-skipped hours per §20.2 last bullet.
  - Implement `create` with **1-based month** while internally constructing `new Date(year, month - 1, day)`.
- `DateFormats` DI token (§20.3) + `dateFormats` component input (§33.1). Minimal set: `input`, `display`, `monthLabel`, `yearLabel`, `decadeLabel`, `a11yLabel`, `monthA11yLabel`, `dayA11yLabel`, `yearViewMonthA11yLabel`.
- `TZ_OVERRIDE` and `DATE_SERIALIZATION` injection tokens (§7.4, §4.3) — token shells; `DATE_SERIALIZATION` stays unused until Phase 14.
- `serializeCalendarValue<M, D>(value, adapter)` helper (§7.5, §33.4) exported from the calendar entry point.

**Files:** `date-adapter.ts`, `native-date-adapter.ts`, `index.ts`, new `date-formats.ts`.

**Breaking?** Yes — adapter method names change. Internal migration happens in the same commit; no external adapter consumers exist yet.

**Acceptance:**
- All internal call sites use the new names.
- Month-view grid computes the same DOM for a given anchor date before/after the rename.
- DST tests (§35.3): spring-forward + fall-back both hemispheres pass via `startOfDay`.
- `create(2026, 1, 1)` (1-based January) yields the same date as the old `createDate(2026, 0, 1)`.

---

### Phase 3 — Form Integration

**Spec refs:** §6, §7.2, §7.6 (partial), §33.1 (`resetBehavior`, `disabled`, `readonly`).

**Deliverables:**

- `ControlValueAccessor` completion:
  - `setDisabledState(isDisabled)` implemented; drives the existing `disabled` input via a `linkedSignal` merge or a writable `cvaDisabled` signal combined with the public `disabled` input through `computed()`.
  - Defensive `writeValue`: coerce shape per mode, reject wrong shape with `calendarInvalidValue` (§11.6), never throw.
  - `onTouched` timing per §13.6 (inline: on component blur; overlay: wired in Phase 10).
  - `dirty` on first user-initiated commit only, not on `writeValue` (§6.4).
- `NG_VALIDATORS` registration + synchronous validator returning typed `CalendarValidationErrors` objects (§10.2). Mode-aware `required` (§6.4).
- `FormValueControl<T>` implementation for Signal Forms (§6.3):
  - Signal inputs: `disabled`, `readonly`, `touched`, `errors`, `required`, `invalid`, `hidden`, `disabledReasons`.
  - Three mode-specific directives per §7.3: `CalendarSingleDirective`, `CalendarMultipleDirective`, `CalendarRangeDirective`.
- **Form reset (§6.5):** inject `NgControl` via `@Self() @Optional()`. Subscribe to `statusChanges` + pristine transitions to detect resets. Apply full-reset state per §6.5: restore `viewState`, displayed month/year, `activeDate` via §13.3 priority chain, clear `internalDraftValue` / `hoveredDate` / `selectedPresetId`. Emit `selectionCleared({reason: 'reset'})` if prior value existed. Never emit `valueChange` on reset (form owns the write).
- `resetBehavior: ResetBehavior = 'full'` input.
- `readonly` input (accept user input for ARIA announcement but block commits).

**Files:** `calendar.ts` (CVA + Validator), new `calendar-form-directives.ts`, new `calendar-validators.ts`.

**Breaking?** Additive on top of Phase 1.

**Acceptance:**
- Reactive Forms, Template-driven, Signal Forms integration tests all pass the same assertion matrix (§6.4, §30.3).
- Form reset restores UI state — displayed month reverts to `startAt` or today, active focus re-resolved.
- `setDisabledState(true)` prevents interaction AND reflects in ARIA.

---

### Phase 4 — Constraints, Validation, `data-state-*` Attributes

**Spec refs:** §10, §11.4, §28, §34.5.

**Deliverables:**

- New inputs: `disabledDates: D[] | DateFilterFn<D> | null`, `disabledDaysOfWeek: number[]`, `minRangeLength`, `maxRangeLength`, `maxSelections`, `maxSelectionBehavior`, `allowDeselect`, `sorted`, `blockInvalidRangeCommit` (deferred `[REC] [COULD]` v1.1 per §43 — ship as no-op input with dev warning for now).
- Constraint resolver (`is-date-disabled` helper rewrite): OR-combined check across `minDate`, `maxDate`, `disabledDates` (array and/or predicate), `disabledDaysOfWeek`, `dateFilter`.
- Interaction-time validation per §10.4: invalid-preview flag propagated through `rangePreview` payload; `data-state-invalid-preview` on cells; `data-state-invalid-flash` on rejected click cells.
- Form-level error codes (§10.2) emitted by Phase 3's validator using new constraint data.
- **`data-state-*` attribute emission (§34.5):** extend `CalendarCellComponent` to emit `data-state-today`, `-selected`, `-range-start/-end`, `-in-range`, `-range-preview-start/-end`, `-in-range-preview`, `-invalid-preview`, `-invalid-flash`, `-disabled`, `-focused`, `-out-of-month`, `-weekend`. Weekend detection via `adapter.getDayOfWeek` + locale-aware weekend mapping (defaults to Sat/Sun).
- Programmatic invalid-value path (§7.2, §11.6): dev warning + value preserved + `calendarInvalidValue` code.
- Constraint change revalidation (§11.4): watching input changes through a `computed` re-runs validator and re-evaluates `activeDate` disability — focus moves to nearest enabled date in month per §17.2.
- `errorAriaDescribedBy: string | null` input (§28.3) wired to the component root `aria-describedby`.

**Files:** `calendar.ts`, `calendar-cell.ts`, `calendar.utils.ts`, `calendar-validators.ts`.

**Breaking?** Consumer CSS keyed on internal variant classes breaks; the `data-state-*` surface is the spec contract.

**Acceptance:**
- axe-core zero violations with arbitrary constraint combinations.
- Programmatic `writeValue` outside `[minDate, maxDate]` → value preserved + `calendarMinDate`/`calendarMaxDate` error + dev warning.
- Hovering past `maxRangeLength` in range mode: cells from the violating index onward carry `data-state-invalid-preview`; commit still succeeds (spec default) and marks `calendarRangeTooLong`.

---

### Phase 5 — `CalendarIntl` + Locale Integration

**Spec refs:** §19.1, §19.2, §19.4.

**Deliverables:**

- New `calendar-intl.ts` defining `CalendarIntl` injectable + `CalendarIntlKeys` union. Full field set per §19.4: button labels, view labels, weekday/month overrides, `cellAccessibleName(ctx)`, ARIA announcements, error messages, parse-error messages, keyboard help text, in-progress template, `skipAnnouncement`.
- Default English strings shipped in `CalendarIntl`.
- Optional locale packs for `de`, `fr`, `es`, `pt`, `ja` as secondary entry points (`ngx-tw/calendar/intl-de`, etc.) — Phase 20 can also fold this into the docs pass.
- `locale` component input (§33.1) overriding `LOCALE_ID` for that instance.
- Inject `LOCALE_ID` at component level; pass through to `DateAdapter.setLocale` on initialization and on `locale` input change.
- `intl: Partial<CalendarIntl>` input with per-field merge semantics (§19.4 "override semantics").
- Replace every hardcoded English string in `calendar.ts` (`"Calendar"`, `"Previous month"`, `"Navigated to..."`, `"click to switch..."`, etc.) with `intl` lookups.
- Pluralization via `Intl.PluralRules` for the four plural-marked keys (§19.4).
- First-day-of-week fallback when `LOCALE_ID` is unknown: default to Monday, dev warning (§19.2).

**Files:** new `calendar-intl.ts`, `calendar.ts`, `calendar-header.ts`, views; new adapters for locale packs (optional).

**Breaking?** ARIA labels change — screen reader snapshots need updating.

**Acceptance:**
- Switching `locale` input at runtime re-renders labels without destroying focus.
- No string literal in `calendar.ts` / views outside the `CalendarIntl` surface (excluding internal dev warnings).

---

### Phase 6 — Range Flow Completion

**Spec refs:** §21 (full), §11.1.

**Deliverables:**

- Rewrite `RangeSelectionStrategy` — or migrate its logic inside the component now that `internalDraftValue` is a first-class signal. Keep the strategy interface as an extension point but let the orchestrator own state.
- Inputs: `allowBackwardRange`, `allowSingleDayRange`, `rangeClickBehavior: 'restart' | 'nearest-edge' | 'require-clear'`, `persistPartialRange`, `disableRangesCrossingDisabledDates`.
- `rangeClickBehavior`:
  - `'restart'` (default): 3rd click → SELECTING with new draft.start, emit `selectionRestart`.
  - `'nearest-edge'`: 1-click endpoint move per §21.3, COMPLETE → COMPLETE with `selectionComplete({reason: 'nearest-edge'})`.
  - `'require-clear'`: no-op + invalid-flash.
- Auto-swap without emitting `selectionRestart` (§21.5, §30.2 backward-click sequence).
- `rangePreview` normalization (`start ≤ end` regardless of hover direction) and `invalidPreview` flag (§21.5).
- Keyboard-driven preview during SELECTING (§21.1): arrow-key moves produce `rangePreview` identical to hover.
- Programmatic `writeValue` during SELECTING (§11.1): discard draft + `selectionCleared({reason: 'programmatic'})`; SELECTING-shaped writes rejected as `calendarInvalidValue`.

**Files:** `calendar.ts`, `selection/range-selection-strategy.ts`, `calendar.utils.ts`.

**Acceptance:** every row of §8.3 that involves a range mode passes a unit test with spied outputs. §41.1–§41.4 scenarios all green.

---

### Phase 7 — Display / Navigation Completeness

**Spec refs:** §12, §17.2 (constraint change), §22.3 (drill disabled fallback).

**Deliverables:**

- New inputs: `showWeekNumbers`, `showAdjacentMonths`, `showTodayButton`, `showClearButton`, `navigationStep`, `navigationBoundaryLookahead` (default 24), `autoSkipEmptyPeriods` (default false), `emptyStateTemplate`, `yearsPerPage` (default 20 — reconcile current hardcoded 24 in `calendar.types.ts`).
- Dead-end prevention (§12.6):
  - `prevDisabled` / `nextDisabled` scan up to `navigationBoundaryLookahead` periods respecting all constraint sources (not just `minDate`/`maxDate`).
  - Disabled nav buttons get `aria-disabled="true"` and `tabindex="-1"`.
- `emptyStateTemplate` rendered in place of the grid when every cell is disabled. Default template from `CalendarIntl`. Empty-state element is `tabindex="0"` and becomes the initial focus target when the grid is fully disabled.
- "Today" button: shown when `showTodayButton`; disabled per §12.6 if `adapter.today()` is outside constraints.
- "Clear" button: shown when `showClearButton` + mode ∈ `{multiple, range}`; calls `clear()` which re-runs §13.3 focus resolution.
- `Ctrl+Home` keyboard handler on all three views (§16.1, §16.2, §16.3) focuses today.

**Files:** `calendar.ts`, `calendar-header.ts`, views, `calendar.utils.ts`.

**Acceptance:** navigating into an all-disabled month no longer strands the user; dead-end scanning unit tests cover `dateFilter`, `disabledDates`, `disabledDaysOfWeek` interplay.

---

### Phase 8 — View Switching Completeness

**Spec refs:** §22.

**Deliverables:**

- `viewChange` output emits `{from, to, reason: 'user' | 'programmatic' | 'drill-down' | 'drill-up'}` (§22.6).
- `rangeGranularity: 'day' | 'month' | 'year'` input (§22.5). `startView` default derived from granularity.
- Month-view click routing per §22.4 (granularity × view × state) matrix:
  - `'day'` granularity + month view → drill-down.
  - `'month'`/`'year'` granularity: cell click commits per state.
- Drill-down focus resolution per §22.3 including the disabled-date fallback pass.
- `Enter` vs `Space` disambiguation in month/year views per §16.2/§16.3:
  - Enter → always drill down.
  - Space → commit when `rangeGranularity` matches that view; else drill down.

**Files:** `calendar.ts`, `month-view.ts`, `year-view.ts`, `multi-year-view.ts`, `calendar-cell.ts`.

**Acceptance:** every (granularity × view × state) cell covered by unit tests.

---

### Phase 9 — Multi-Month

**Spec refs:** §23, §17.4.

**Deliverables:**

- New inputs: `numberOfMonths` (1 to 12+; replaces current 1/2-only `monthColumns`), `monthLayout`, `monthsPerRow`, `monthPaneDensity`, `responsiveMonths` (default true), `minPaneWidth` (default 280), `independentMonthNavigation`.
- `renderedMonthsCount` output (§33.2) reflecting responsive resolution.
- Container-query or `ResizeObserver`-driven responsive pane count; reflow preserves focus per §17.2 "Responsive reflow" row.
- Pane-edge arrow key behavior (§17.4):
  - Middle pane edges: focus crosses to sibling pane.
  - First-pane left edge / last-pane right edge: trigger nav + focus onto the newly-revealed pane edge.
  - No wrap between first and last.
- Continuous range preview across panes (§23.6).
- `monthPaneDensity: 'full' | 'compact' | 'name-only'` variants.
- Hidden scrollbar utility class for tab strip + scrolling layouts (CLAUDE.md pattern).

**Files:** `calendar.ts`, views, new `calendar-panes.ts` helper.

**Acceptance:** §41.8 multi-month keyboard edge scenarios pass.

---

### Phase 10 — Overlay Lifecycle + Interaction Mode + Mobile

**Spec refs:** §13, §14, §18, §15.4.

**Deliverables:**

- `interaction: 'inline' | 'overlay'` input (§14, default `'overlay'`).
- `CalendarTriggerDirective` (`[calendarTrigger]`) binding a trigger button to an overlay-mode calendar.
- CDK Overlay integration:
  - `flexibleConnectedPositionStrategy` with fallback positions (§15.2 SC 2.4.11).
  - `scrollStrategy: 'close'` for scroll dismissal.
  - `appendTo: 'host' | 'body' | ElementRef` input.
- Overlay lifecycle per §13.2 / §13.4 with the full state machine: `closed → opening → open → closing → closed`.
- Public methods: `open()`, `close()`, `toggle()`.
- Outputs: `opened`, `closed` (wired now; declared in Phase 1).
- Initial focus resolution (§13.3) via the priority chain.
- Close-reason matrix (§13.5) — every row wired: outside click, Escape, commit, programmatic close, `disabled=true`, scroll dismissal, focus loss, form reset, adapter change guard, constraint tightening that invalidates draft, mobile back-button, trigger unmount.
- `role="dialog"` + `aria-modal="true"` + focus trap (CDK `FocusTrap`) + focus return to trigger.
- `closeOnSelect` mode-derived default (§14.2): `true` single, `false` multiple + range.
- `closeOnModeChange` (§11.2), `openOnFocus` (§14.2), with debounce vs close per §13.7.
- `Alt+↓` on trigger opens overlay; idempotent when already open (§14.2).
- **Mobile (§14.3, §18):**
  - `mobileMode: 'auto' | 'overlay' | 'fullscreen' | 'bottom-sheet'` input (default `'auto'`).
  - Breakpoint 600 px via `matchMedia` at open time; SSR resolves to `'overlay'`.
  - Fullscreen + bottom-sheet respect `env(safe-area-inset-*)`.
  - `touch-action: pan-y` on grid.
  - "Select end date" hint during range SELECTING on mobile.

**Files:** `calendar.ts` (interaction mode wiring), new `calendar-trigger.ts`, new `calendar-overlay.ts` (or integrate into `calendar.ts`), new `calendar-mobile-host.ts` for fullscreen/bottom-sheet chrome.

**Acceptance:**
- Every row of §13.5 has a passing test.
- §41.5 (disabled during open overlay) and §41.10 (mobile auto-mode) scenarios pass.
- Inline mode still passes all earlier phases; overlay mode does not regress inline behavior.

---

### Phase 11 — Text Input Directive + Coordinator

**Spec refs:** §9, §26.

**Deliverables:**

- New `CalendarCoordinator` service (no `providedIn: 'root'`; provided at the composite parent).
- New `CalendarInputDirective` (`[calendarInput]`):
  - Parse on blur + Enter (§9.2).
  - Optional parse on input with debounce.
  - Locale-aware parse via `adapter.parse(value, formats)`.
  - `calendarParseError` emission + raw-string preservation on native `value`.
  - Per-mode parse strategy (§9.2.1): single, multiple with `multipleSeparator`, single-input range with `rangeSeparator` default `' – '`, two-input range.
  - IME composition handling (§9.3) — mask suspended between `compositionstart` and `compositionend`.
  - `virtualKeyboard: 'show' | 'hide' | 'auto'` input (§9.5, §33.1).
  - `inputmode` set for numeric entry.
- Two-input range (§9.4): focus moves start→end on start commit; either input opens the overlay.
- Cross-field validator helpers (`calendarCrossFieldRange`, `calendarCrossFieldRangeLength`) per §26.1.

**Files:** new `calendar-input.ts`, new `calendar-coordinator.ts`, new `calendar-cross-field-validators.ts`.

**Acceptance:**
- Documented recipe for `<input [calendarInput]="picker">` composition.
- Two-input range commits `selectionComplete` + `valueChange` once both inputs have valid parse and `end ≥ start` (or auto-swap when `allowBackwardRange`).

---

### Phase 12 — Presets

**Spec refs:** §25, §8.3 preset rows.

**Deliverables:**

- Types: `CalendarPreset<D>` (range-only in v1 per §25.2), `PresetGroup`.
- Inputs: `presets`, `presetGroups`, `presetViolationBehavior: 'disable' | 'hide' | 'warn'` (default `'disable'`), `closeOnPresetSelect` (default `true`), `presetTemplate`, `presetGroupTemplate`.
- `selectedPresetId` public signal (already declared in Phase 1); lifecycle per §8.3 ("`selectedPresetId` lifecycle across transitions").
- `presetChange: OutputEmitterRef<string | null>` (declared Phase 1; wired now).
- Preset list rendered with `role="listbox"` + roving-tabindex + Arrow/Enter keyboard model (§25.3).
- Default vertical list (desktop) / horizontal chip list (mobile) layouts (§25.5).
- Preset selection path:
  - Bypass click flow; write COMPLETE directly.
  - Scroll/navigate calendar to show the preset range.
  - Emit order per §8.3 preset rows: `monthChange` (if nav needed) → `activeDateChange` → `valueChange` → `selectionComplete` → `closed` (if overlay + `closeOnPresetSelect`).
- Revalidation on constraint change (§25.6): re-evaluate all presets; mark violators with `data-state-preset-invalid`; never auto-mutate the committed value.
- The current `twCalendarPresets` marker directive is kept as the manual / consumer-driven preset slot for advanced use cases.

**Files:** new `calendar-presets.ts` (expand), new `calendar-preset-list.ts`, `calendar.ts`.

**Acceptance:** §41.9 preset revalidation scenario passes.

---

### Phase 13 — Day Cell Customization

**Spec refs:** §24, §33.1 customization block.

**Deliverables:**

- `DayCellContext<D, T>` type replacing the current template context shape (Phase 1 left `CalendarCell<D>` in place for backward compat; this phase migrates to `DayCellContext`).
- Inputs: `dayData: Map<string, T>`, `dayDataFn: (date: D) => T | undefined`, `dayBadge: (date, data?) => BadgeConfig | null`, `cellHeaderTemplate`, `monthHeaderTemplate`, `headerTemplate`, `footerTemplate`.
- `BadgeConfig` type with `count?`, `dot?`, `color: TwColor`, `label?` (text only).
- Precedence: `dayData` map wins for keys it contains; `dayDataFn` fallback (§24.2).
- ISO-date-keyed single-pass indexing of `dayData` per data change (§32.5).
- Try/catch wrappers around consumer predicates (§27.2): throwing predicate → cell disabled + dev log.
- Sub-element `stopPropagation` pattern documented + test recipe (§24.4).

**Files:** `calendar-cell.ts`, `calendar.ts`, `calendar.utils.ts`, views.

**Acceptance:**
- Consumer cellTemplate receives full `DayCellContext`.
- Badge rendered with correct semantic color; ARIA label includes `CalendarIntl.cellAccessibleName(ctx)`.

---

### Phase 14 — Cross-Field Validators + Value Transformer

**Spec refs:** §7.6, §26.

**Deliverables:**

- `CalendarValueTransformer<M, D, TOut>` interface.
- Built-ins: `isoStringTransformer`, `timestampTransformer`.
- `valueTransformer` input with bidirectional application at the CVA boundary (`toForm` before `valueChange` to form control, `fromForm` on `writeValue`). Public `valueChange` output remains untransformed `CalendarValue<M, D>` per §7.6 contract.
- Transformer error handling: `toForm` throws → raw `D` fallback + dev warning; `fromForm` throws → empty-state + `calendarInvalidValue` + raw value exposed on `lastInvalidFormValue` signal.
- `DATE_SERIALIZATION` token honored as global default (§7.4, §7.6).
- Mode-specific directives (§7.3) reparameterized with `TOut` generic.

**Files:** new `calendar-value-transformer.ts`, `calendar.ts`, `calendar-form-directives.ts`.

**Acceptance:** `isoStringTransformer` used with a reactive FormControl<string> round-trips correctly; `timestampTransformer` same with `FormControl<number>`.

---

### Phase 15 — Accessibility Pass

**Spec refs:** §15, §17.

**Deliverables:**

- Grid: `aria-rowcount` + `aria-colcount`; rows `role="row"`; cells `role="gridcell"`.
- Day column headers: `abbr` attribute + `role="columnheader"`.
- Live regions:
  - Month/year header wrapped in `aria-live="polite"` (not a separate `sr-only` mirror) per §15.5.
  - `role="status"` announcements for range commits.
  - SELECTING focus movement announces tentative range length (debounced 150 ms).
  - Single-day arrow moves within the same month do NOT announce (§15.5).
- Nav button labels sourced from `CalendarIntl` (Phase 5 prerequisite).
- Focus visibility: `activeDate` ⇔ `tabindex="0"` invariant (§17.6).
- Full §17 focus-resolution algorithm covered (per-event table row).
- Forced-colors support: state indicators use `outline`/`border` not backgrounds only (§15.7, §34.3).
- Screen reader test matrix wiring (§15.8) — harness for CI-time NVDA/JAWS/VO/TalkBack snapshots is `[SHOULD]` — ship what's CI-reachable, document the rest for manual QA.

**Files:** all view components, `calendar.ts`, `calendar-header.ts`, `calendar-cell.ts`.

**Acceptance:** axe-core zero violations across all modes + overlay + mobile presentations.

---

### Phase 16 — SSR / Hydration Hardening

**Spec refs:** §31, §4.3.

**Deliverables:**

- Every cell renders its date label (`1`, `2`, …) unconditionally — never "today" — for server/client identical DOM (§31.2).
- "Today" indicator re-evaluated in `afterNextRender`: swap CSS class + `aria-current="date"` silently if client date differs. No event, no full re-render (§4.3, §31.2).
- Overlay DOM not rendered on server regardless of consumer `open=true` binding (§31.2).
- No `window`/`document`/`navigator` outside lifecycle guards (§3, §31.1). Audit `NativeDateAdapter` and remove the constructor-time `navigator.language` read.
- `adapter.today()` SSR contract honored via `TZ_OVERRIDE` precedence chain (§4.3).
- `Intl.DateTimeFormat` verified against Node ≥ 18 full-ICU (§31.4).

**Files:** `native-date-adapter.ts`, `calendar.ts`, views, `calendar-cell.ts`.

**Acceptance:** SSR render + client hydration across a TZ mismatch produces no Angular hydration warnings; "today" swap is silent.

---

### Phase 17 — Performance

**Spec refs:** §32.

**Deliverables:**

- Month matrix memoization keyed by `(year, month, firstDayOfWeek, locale)` — hover-preview updates do NOT rebuild the matrix; cell-level selection/preview state is applied via cheap derived signals or `data-state-*` attributes updated out of the matrix compute path.
- Predicate memoization (§32.5) by `(date, predicate-reference)`; stable predicate references yield cache hits across renders.
- `dayData` ISO-key index built once per data change (§24.2, §32.5).
- No per-frame `setInterval` for "today" refresh (§32.3).
- Dev-mode warning when a predicate exceeds 200 µs P95 (§32.5).
- Dev-mode warning when a render pass exceeds §32.2 budget by 50 %.
- Bundle size budgets (§32.1) measured in CI via `@angular/build --stats-json` + `source-map-explorer`. Gzip + brotli figures recorded, regression blocks merge.
- Runtime budget benchmarks (§32.2) in CI — Chrome DevTools 4× CPU throttle, Fast 3G, P95 over 20 renders.
- Year-view 12-pane at `full` density uses OnPush CD islands (no CDK virtual scroll) per §32.3.

**Files:** `calendar.ts`, views, new `performance/` helpers if needed, CI config (`.github/workflows/*` or `angular.json` custom builders).

**Acceptance:** all §32.2 budgets green on CI benchmark; regressions block merge.

---

### Phase 18 — Testing Harness Expansion + Spec Coverage Pass

**Spec refs:** §35, §36.

**Deliverables:**

- `CalendarHarness` expansion to the full §36.1 API: `open()`, `close()`, `isOpen()`, `getOverlayState()` / `getOverlayPhase()`, `selectDate`, `selectRange`, `hover`, `getSelectedValue`, `getFocusedDate`, `getBadge`, `getCell`, `getCells(predicate)`, `nextMonth`, `prevMonth`, `setView`, `goToToday`, `focusDate`, `clearSelection`, `setDisabled`, `getPresets`, `selectPreset`, `isInvalid`, `getErrors`, `eventsFor(name)`.
- `MockDateAdapter` with pinnable "today" (§36.3).
- Unit/integration spec files next to sources (`calendar.spec.ts`, `month-view.spec.ts`, etc.) using Vitest per CLAUDE.md rules.
- Coverage matrix:
  - Per mode × per adapter × per validator (§35.1).
  - Every §8.3 state transition with every relevant configuration.
  - Every §30.2 event sequence.
  - Every §17.2 focus-resolution row.
  - Every §13.5 overlay close row.
  - Every (granularity × view × state) cell from §22.4.
  - Multi-month linked nav, responsive collapse, hover-across-panes, keyboard edges.
  - Forms paradigm parity (§6.4, §30.3) — Reactive, Template-driven, Signal Forms observationally identical.
  - Signal Forms typing test for `FieldTree<Date, string>` case (§35.1).
  - Transformer coverage (§35.1).
  - Stress/concurrency (§35.7): rapid double-click, rapid nav burst, held arrow, overlay reopen during closing, constraint flip during SELECTING, mode flip during open overlay. 100× runs with jitter injection.
- A11y tests: axe-core + keyboard nav over every §16 key.
- Visual regression: Playwright or Chromatic snapshots (§35.5) — selection states, multi-pane preview, dark mode, RTL, forced-colors.

**Files:** `projects/ngx-tw/calendar/testing/*`, `*.spec.ts` next to every source.

**Acceptance:** new spec files cover the §35.1 checklist. CI green on every platform.

---

### Phase 19 — Luxon Adapter Entry Point

**Spec refs:** §20.4.

**Deliverables:**

- New secondary entry point `ngx-tw/calendar/luxon` with `ng-package.json` + `index.ts`.
- `LuxonDateAdapter extends DateAdapter<DateTime>` implementing the full §20.2 surface including TZ-aware methods.
- Opt-in peer dep `luxon ^3` (declared in root `package.json` as `peerDependencyMeta.optional`).
- Adapter unit tests against the same matrix as native (§35.1, §35.3).
- Per-adapter setup recipe in the docs (§39.1).

**Files:** new `projects/ngx-tw/calendar/luxon/` directory.

**Acceptance:** `provideTwCalendar({ adapter: LuxonDateAdapter })` works; TZ-aware tests green.

---

### Phase 20 — Documentation + Changelog + Demo Pages

**Spec refs:** §39.

**Deliverables:**

- Demo app pages per `demo-page-guide.md` (and `demo-doc-page` skill):
  - Overview, examples, API pages per selection mode.
  - Recipes per forms paradigm.
  - Multi-month layout guide.
  - Customization cookbook (badges, templates, presets, text input composition).
  - Accessibility statement.
  - Theming reference (semantic tokens + `data-state-*` table).
  - Signal Forms typing troubleshooting.
  - Cross-field composition recipes.
  - Event-ordering reference.
  - Error display recipes (Reactive + Signal Forms).
  - Performance benchmark methodology.
  - Migration guide from the current calendar to v1.
- Keep-a-Changelog-format `CHANGELOG.md` entry for the refactor.
- LICENSE (MIT) file at repo root (§40).
- API reference per public symbol — Compodoc-driven (JSDoc on every input/output/model/public method already required by CLAUDE.md).
- Stackblitz examples per selection mode + per forms paradigm.

**Files:** `docs/*`, `projects/demo/src/app/routes/calendar/*`, `CHANGELOG.md`, `LICENSE`, root `README.md` calendar section.

**Acceptance:** demo app documents every public input/output/signal/method with working examples.

---

## 5. Breaking Changes (Cumulative)

Landed across Phases 1, 2, 4, 8, 9:

| Change | Phase | Reason |
|---|---|---|
| `selectionMode` → `mode`; `'multi'` → `'multiple'`; drop `'week'` from surface | 1 | §5 |
| Single `value` model; drop `selected` alias | 1 | §7.3 |
| Adapter method renames + 1-based `create(year, month, day)` | 2 | §20.2 |
| View names `'day' | 'month' | 'year'` (drop `'multi-year'`) | 1 | §7.4 |
| Remove back-compat time / color / size / headerless inputs | 0/1 | cleanup |
| Remove `userSelection` output | 1 | §33.2 |
| `viewChanged: CalendarView` → `viewChange: {from, to, reason}` | 8 | §22.6 |
| `monthColumns: 1 | 2` → `numberOfMonths: 1..12+` | 9 | §23.1 |
| `CalendarCell<D>` template context → `DayCellContext<D, T>` | 13 | §24.1 |
| Internal variant classes → `data-state-*` attribute styling hook | 4 | §34.5 |
| `DateAdapter` method surface extends — breaking for custom adapter implementers | 2 | §20.2 |

A single migration guide lands at the end of Phase 1's cutover, updated in each subsequent breaking phase.

---

## 6. Open Decisions (Need User Input Before / During Execution)

These are genuinely ambiguous. The plan assumes the **recommended** option unless the user overrides.

1. **Back-compat inputs removal vs. deprecation** (Phase 0). *Recommend: remove.* Library is pre-1.0.
2. **Keep the `CalendarSelectionStrategy` DI extension point after Phase 6?** Impl owns range state directly now; strategies make sense for custom non-range patterns (multi-interval, week-of-month, business-day). *Recommend: keep as advanced extension, document as non-`MUST` API.*
3. **`yearsPerPage` default: 20 (spec §12.4, §33.1) vs. 24 (current impl).** *Recommend: 20 to match spec.*
4. **Mobile breakpoint 600 px — fixed vs. configurable.** Spec §18.5 pins 600; CLAUDE.md visual system would prefer a semantic `sm` breakpoint. *Recommend: fixed 600 px to match spec; revisit if real apps push back.*
5. **Default `mobileMode: 'fullscreen'` vs. `'bottom-sheet'` on mobile.** Spec §18.5 says "`fullscreen` by default on mobile OS / `bottom-sheet` where a sheet is conventional" — needs a concrete rule. *Recommend: fullscreen on iOS/Android via UA sniff is fragile; use `fullscreen` universally on mobile viewports.*
6. **Locale packs bundled vs. separate entry points.** Spec §19.4 says ship 5 locale defaults. *Recommend: ship one secondary entry point per locale (`ngx-tw/calendar/intl-de`) so consumers opt in and the default bundle stays English-only.*
7. **Visual regression tool: Chromatic vs. Playwright.** Spec §35.5 lists either. *Recommend: Playwright — no SaaS dependency, integrates with existing Vitest/Angular build.*

Record resolutions in `docs/calendar-plan_decisions.md` as they land.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Phase 1 breaking cutover touches every file; merge conflicts if other work is in flight | Freeze unrelated calendar work during Phase 1. Land Phases 0 + 1 in a dedicated branch, reviewed as one PR. |
| Overlay lifecycle in Phase 10 is large (§13 + §14 + §18). | Split Phase 10 into 10a (desktop overlay + lifecycle) and 10b (mobile presentations) during execution if it helps reviewability. |
| Performance budgets (§32.2) measured on Moto G4-class devices require infra. | Add the benchmark harness as part of Phase 17; until then, gate on hand-run numbers documented in PRs. |
| Signal Forms `FormValueControl<T>` + transformer generics is a typing minefield. | Build the typing scaffolding and a `.spec-d.ts` fixture in Phase 3 BEFORE wiring transformer (Phase 14). |
| Adapter renames (Phase 2) break any downstream repo using the pre-refactor adapter. | Publish the migration note in the same commit that lands Phase 2. |
| Lack of existing test coverage makes regressions invisible. | Phase 18 is non-optional — no tag without it. Interim phases co-land targeted tests for their own deliverables. |

---

## 8. Reference — Discarded Findings

A handful of findings from the initial review were dropped from this plan because they are not actual gaps:

- **`CalendarSelectionStrategy` as a custom extension point** — an intentional addition beyond the spec; keep as a library affordance (pending Phase 6 decision on scope, see §6.2 above).
- **Hardcoded `yearsPerPage = 24`** — real issue, but folded into Phase 7 rather than a separate line item.
- **Dual `selected` + `value` model** — legitimate concern, collapsed into the Phase 1 single-value-model deliverable.
- **Non-Gregorian adapters, `persistentStateId`, schematics, DateFns/Temporal adapters** — explicitly `[WONT] v1`. Listed in §2 "Non-Goals" above and not scheduled.
- **Input masking default-on** — spec §9.3 + §43 resolved off-by-default. No work needed.

---

## 9. What "Done" Looks Like

A v1 tag is cut when:

1. Every `[REQ] [MUST]` in the spec has a corresponding merged PR + passing tests.
2. §35 test coverage matrix is green in CI.
3. §32 bundle + runtime budgets enforced in CI with regression gates.
4. Demo app documents every public input / output / signal / method.
5. Migration guide published for consumers of the pre-refactor calendar.
6. LICENSE (MIT), CHANGELOG, README calendar section in place.
7. Keep-a-Changelog entry accurately reflects breaking changes across the phased landing.

`[REQ] [SHOULD]` items that slipped to v1.1 are tracked in `docs/open_decisions.md` under a v1.1 backlog heading with spec-section pointers.
