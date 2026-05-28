# Date-Range-Picker — Production-Grade Review

**Entry point:** `ngx-tw/date-range-picker`
**Files:** `projects/ngx-tw/date-range-picker/`

## Snapshot
- Selectors: element `tw-date-range-picker`; internal overlay `tw-date-range-picker-overlay` (not exported).
- Public classes/directives: `DateRangePickerComponent` (extends `FormFieldControl<TwDateRange<D>>`); internal `DateRangePickerOverlayComponent` not in `index.ts`.
- Inputs: **31** on `DateRangePickerComponent` (overlay + form-control + presets — exception applies).
- Outputs: **4** (`opened`, `closed`, `rangeChange`, `presetSelected`) plus two-way `model()`s (`value`, `open`).
- Slots: **1** (`select="[slot=trigger-icon]"`).
- CVA: yes (implements `ControlValueAccessor`).
- `tv()` config: yes; slots used: `root`, `trigger`, `startText`, `separator`, `endText`, `placeholderText`, `triggerIconButton`, `triggerIcon`, `clearButton` (date-range-picker.ts:157–173).
- A11y CDK utilities used: `FocusMonitor`, `FocusTrapFactory`, `LiveAnnouncer`, CDK `Overlay` + `ComponentPortal` (date-range-picker.ts:33–40).

## Inputs

Selected high-signal inputs (full list at date-range-picker.ts:364–484):

| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `idInput` (alias `id`) | `input<string \| undefined>` | `undefined` | yes | |
| `minDate` / `maxDate` | `input<D \| null>` | `null` | yes | |
| `dateFilter` | `input<TwDateFilter<D> \| null>` | `null` | yes | uses deprecated alias |
| `startView` | `input<TwCalendarView>` | `'day'` | yes | uses deprecated alias |
| `startAt` | `input<D \| null>` | `null` | yes | |
| `format` | `input<unknown>` | `DEFAULT_DISPLAY_FORMAT` | yes | |
| `rangeSeparator` | `input<string>` | `' – '` | yes | |
| `emptyStartLabel` / `emptyEndLabel` | `input<string>` | `'Start date'`/`'End date'` | yes | placeholder atoms |
| `placeholder` | `input<string \| undefined>` | `undefined` | yes | composite override |
| `disabledInput` (alias `disabled`) | `input<boolean, unknown>` | `false` | yes | `booleanAttribute` |
| `requiredInput` (alias `required`) | `input<boolean, unknown>` | `false` | yes | |
| `size` | `input<TwSize>` | `'md'` | yes | |
| `color` | `input<TwColor>` | `'primary'` | yes | |
| `variant` | `input<DateRangePickerVariant \| undefined>` | `undefined` | yes | naked when wrapped |
| `numberOfMonths` | `input<1 \| 2>` | `2` | yes | passes to calendar's `monthColumns` |
| `presets` | `input<readonly DateRangePreset<D>[]>` | `[]` | yes | quick-select list |
| `showClear` | `input<boolean>` | `true` | yes | **TRUE-default — not codified** |
| `showActions` | `input<boolean>` | `false` | yes | |
| `showTime` | `input<boolean>` | `false` | yes | two embedded time-pickers |
| `timeFormat` / `showSeconds` / `hourStep` / `minuteStep` / `secondStep` | per type | per default | yes | time-mode bag |
| `todayLabel`/`clearLabel`/`cancelLabel`/`applyLabel` | `input<string>` | per default | yes | |
| `panelClass` / `scrollStrategy` / `offset` | per type | per default | yes | overlay config |
| `clearAriaLabel` | `input<string>` | `'Clear date range'` | yes | |
| `errorStateMatcher` | `input<ErrorStateMatcher \| undefined>` | `undefined` | yes | |
| `ariaLabel` / `ariaLabelledby` / `userAriaDescribedByInput` | `input<string \| undefined>` | `undefined` | yes | aliased |
| `value` | `model<TwDateRange<D> \| null>` | `null` | yes | |
| `open` | `model<boolean>` | `false` | yes | |
| **MISSING** | — | — | — | No `allowSingleDayRange`, no `persistPartialRange`, no `minRangeLength`/`maxRangeLength` |

### Findings
1. **Codified true-defaults are not forwarded.** Calendar exposes `allowSingleDayRange = true`, `persistPartialRange = true`, `allowBackwardRange`, `disableRangesCrossingDisabledDates`, `rangeClickBehavior`, `minRangeLength`, `maxRangeLength`. None are exposed on the date-range-picker, so a consumer who needs "minimum 3-day stay" or "block backward ranges" cannot configure them from the picker. Forward the range-mode knobs.
2. **Uses deprecated `TwCalendarView`/`TwDateFilter` aliases** (date-range-picker.ts:59–60, 374, 377, 553).
3. **`numberOfMonths` is `1|2` only** — same Phase-9 constraint as `monthColumns` on the calendar. Plan flags a future widening to `1..12+`.
4. **No `firstDayOfWeek` pass-through** — calendar exposes it; picker does not.
5. **No `locale` input** — same gap as date-picker.
6. **`presets` is an array of plain objects, not template-projected.** Each preset has a `range: () => TwDateRange<D>` factory. Pros: typed, predictable; cons: no rich content (icons, badges) per preset. Consider a parallel `<ng-template twRangePreset>` path.
7. **No `cellTemplate` / `dateClass` pass-through** to the embedded calendar.
8. **`showClear: true` default not codified.**

## Outputs

| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `opened` | `DateRangePickerOpenedEvent` (`{ trigger }`) | past tense | |
| `closed` | `DateRangePickerCloseReason` (union) | past tense | |
| `rangeChange` | `DateRangePickerChangeEvent<D>` (`{ value, previousValue, source }`) | past tense | `source` distinguishes calendar/preset/time/apply/clear/today/programmatic |
| `presetSelected` | `DateRangePreset<D>` | past tense | fires alongside `rangeChange` |

### Findings
1. **No `rangePreview` propagation** from the embedded calendar. A consumer wanting to show "stay = N days" while the user is hovering does not get the event.
2. **No `selectionStart` / `selectionRestart` propagation.** Same gap.
3. **No `viewChange` propagation** — the picker tracks `currentView` internally (date-range-picker.ts:553) but does not emit.
4. **Source `'today'` in `DateRangePickerChangeSource` is dead** — `onTodayClicked` only sets `pendingRange`, never commits (date-range-picker.ts:1248–1253). The action bar's Today button stages and waits for Apply, but the source string suggests a commit. Either remove `'today'` or use it on a different path.

## Customization surface
- ng-content slots: `select="[slot=trigger-icon]"` (date-range-picker.ts:335). Single slot.
- Structural directives: none. (No `twDateRangePreset` directive — presets are objects.)
- Fallback content: calendar SVG icon.
- Class merging: `twMerge: true` (date-range-picker.ts:249).
- Findings:
  1. **No projection for a custom trigger** — trigger is hard-rendered with start/separator/end spans (date-range-picker.ts:298–306).
  2. **No projection for presets list** — only an input.
  3. **No `cellTemplate`/`dateClass` forwarding** — see Inputs finding #7.
  4. **No `extra footer slot`** above the action bar — a consumer building a custom footer is stuck.

## CSS / Styling
- tailwind-variants: yes; nine slots (full list above). Variants: `size` (5-step), `variant` (default/naked), `open`, `disabled`, `focused`, `errorState`, `color` (8-way).
- twMerge: yes.
- Semantic tokens vs raw palette: `bg-surface`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `border-border`, `border-border-strong`, `border-{color}-500` for focused borders + `border-error-500` for errorState (date-range-picker.ts:228–237). No raw palette.
- Surface/fg/border tokens: well-applied.
- Radius compliance: `rounded-md` on root, trigger icon button, clear button (date-range-picker.ts:168, 171). Overlay panel: `rounded-lg` (date-range-picker-overlay.ts:245). Canonical.
- Spacing/gap compliance: `gap-1`/`gap-1.5`/`gap-2` per size (date-range-picker.ts:177, 182, 187, 192, 197) + inline `px-3 py-2` (date-range-picker.ts:204) — canonical.
- Typography compliance: `text-xs`/`text-sm`/`text-base` scaled. Preset rail uses `text-xs font-medium` via the ButtonDirective (overlay template).
- Focus rings compliance: `focus-visible:outline-2 outline-offset-2 outline-primary-500` on trigger, trigger icon button, clear button (date-range-picker.ts:162, 168, 172). Compliant.
- Dark mode handling: implicit via surface/fg/border tokens; color-variant borders don't need overrides.
- Transitions: `transition-[color,border-color,box-shadow] duration-200 motion-reduce:transition-none` on root (date-range-picker.ts:160); `transition-colors duration-200 motion-reduce:transition-none` on buttons. Compliant.
- Shadows: none on trigger; overlay panel `shadow-md` (date-range-picker-overlay.ts:245).
- Icon sub-scale:
  - `triggerIcon`: `size-3.5` (xs), `size-4` (sm/md), `size-5` (lg/xl) — **half-step needs inline comment** (date-range-picker.ts:179, 184, 189, 194, 199).
  - `triggerIconButton`: `size-6`/`size-7`/`size-8`/`size-9`/`size-10` — same "xl is one step beyond codified scale" issue as date-picker (date-range-picker.ts:178, 183, 188, 193, 198).
  - `clearButton`: fixed `size-5` (date-range-picker.ts:172) — same WCAG target concern.
  - Overlay preset list `min-w-[10rem]` (date-range-picker-overlay.ts:52) — **arbitrary value** that should be a theme token (e.g. `min-w-40`) or a sized variant.
- Findings:
  1. **Arbitrary value `min-w-[10rem]` on preset rail** (date-range-picker-overlay.ts:52). Replace with `min-w-40` (10rem = 160px = w-40) or expose a `presetsWidth` input.
  2. **Same `size-3.5` half-step needs comment** as in date-picker.
  3. **Same xl `size-10` outside codified scale** as in date-picker.
  4. **Clear button target undersized** (`size-5` = 20×20).
  5. **`bg-surface-muted` on preset rail** is a structural background; the rail also gets `border-r border-border` and `flex flex-col gap-1 p-2`. Compliant.
  6. **Overlay panel uses `max-w-[calc(100vw-16px)]`** (date-range-picker-overlay.ts:245) — arbitrary value but justifiable (viewport-minus-overlay-margin). Consider extracting the 16px into a theme token aligned with `withViewportMargin(8)` (date-range-picker.ts:1063).

## Accessibility
- ARIA roles/attributes:
  - Trigger button: `role="combobox" aria-haspopup="dialog" aria-expanded aria-controls` (date-range-picker.ts:283–286). Same pattern as date-picker. **Note**: the visible trigger is a `<button>`, not an `<input>`, so the combobox pattern is slightly nonstandard (combobox is typically an editable input). Accept as common Material pattern.
  - `aria-label`/`aria-labelledby`/`aria-describedby`/`aria-required`/`aria-invalid`/`aria-disabled` all wired (date-range-picker.ts:287–292).
  - **Accessible name composition**: `triggerAccessibleName` synthesizes `"${label}. Current range: ${start} to ${end}."` when both endpoints are set + ariaLabel exists (date-range-picker.ts:633–644). Good for AT context.
  - Clear button: `tabindex="-1"` + i18n-friendly `clearAriaLabel` input (date-range-picker.ts:311–313).
  - Trigger icon button: `aria-hidden="true"` (date-range-picker.ts:331). **Bug risk** — `aria-hidden="true"` on an interactive `<button>` is a WAI-ARIA violation: AT skips it but keyboard users can still tab to it. Either make it visually decorative + not in tab order (already `tabindex="-1"`), or remove `aria-hidden` since the button serves a real purpose (mouse-click target).
  - Preset list: `role="listbox" aria-label="Preset ranges"` (date-range-picker-overlay.ts:53–54), options use `role="option" aria-selected` (date-range-picker-overlay.ts:62–64). **Listbox/option semantics inside a dialog without focus management for arrow keys** — AT users expect arrow-up/down inside a listbox. Currently the focus trap moves with Tab.
  - Overlay panel: `role="dialog" aria-modal="true" aria-label` (date-range-picker-overlay.ts:43–45).
- Keyboard support:
  - Trigger keydown: Alt+ArrowDown opens, Alt+ArrowUp closes (date-range-picker.ts:898–911), Escape closes with restore (date-range-picker.ts:912–915).
  - **No Enter/Space on trigger to open** — trigger is a `<button>` so the browser default handles Enter/Space → click; verify behavior.
  - **No Home/End/PageUp/PageDown override on the trigger** — none needed.
  - Inside overlay: presets list does not implement listbox keyboard model (Up/Down arrows + Home/End + Enter to commit). Today Tab moves through; Enter activates whatever is focused.
- CDK utilities: `FocusMonitor` on the host (date-range-picker.ts:820), `FocusTrapFactory` on the overlay (date-range-picker.ts:1158), `LiveAnnouncer` for commits (date-range-picker.ts:949–963).
- Live announcement: cleared / `"start to end selected"` / `"start selected. Pick end date."` (date-range-picker.ts:949–963) — polite, well-formed.
- AXE risks:
  - `aria-hidden="true"` on the secondary trigger button (date-range-picker.ts:331). Likely to fail AXE.
  - Listbox without arrow-key navigation will fail "Interactive elements support keyboard" if listbox role is the primary path. Currently presets are not the primary path — calendar is — but listbox semantics with no arrow-key support is still a discoverable issue.
- Findings:
  1. **`aria-hidden="true"` on the trigger icon button is a WAI-ARIA violation.** Remove it; the button is part of the interactive trigger pair. If you want AT to consider it duplicate of the main trigger, set `aria-label=""` (empty) and ensure `tabindex="-1"`, or drop the button entirely and let the main trigger absorb the icon click (which is essentially what `(click)="onTriggerClick()"` already does).
  2. **Add arrow-key navigation to the preset listbox.** Hook Up/Down to move focus between `role="option"` buttons; Home/End to jump to first/last; Enter to activate. Use CDK `FocusKeyManager` for this.
  3. **Two trigger buttons consume two tab stops.** The main trigger is `<button>` not `<input>` so tab moves through main → clear → icon-button. The icon-button is `tabindex="-1"` so it's skipped — good. The clear button is also `tabindex="-1"` — good. Verify with a focus-order test.
  4. **No `aria-current` on active preset** — `aria-selected` is correct for listbox; consider also `aria-current="true"` when the preset's range matches the committed value.
  5. **`role="dialog" aria-modal="true"`** but the dialog has no `aria-labelledby` — relies on `aria-label`. Acceptable.

## Form integration
- CVA implementation: full — `writeValue` coerces via `coerceRange` → `coerceEndpoint` → `adapter.deserialize` (date-range-picker.ts:1309–1355). Wires accessor without `NG_VALUE_ACCESSOR` provider (date-range-picker.ts:753–756).
- ErrorStateMatcher integration: full — per-instance `errorStateMatcher` input or DI default (date-range-picker.ts:732, 523).
- form-field interop: extends `FormFieldControl<TwDateRange<D>>` and provides `TW_FORM_FIELD_CONTROL`. Implements full interface (date-range-picker.ts:709–744).
- Locale handling: same gap as date-picker — no `locale` input.
- Findings:
  1. **`coerceRange` accepts `TwDateRange` or plain `{ start, end }`** — good interop.
  2. **`writeValue` emits `rangeChange({ source: 'programmatic' })`** (date-range-picker.ts:1316–1320, 1329–1333). Matches date-picker.
  3. **`isRangeValid` allows partial ranges** (one endpoint null) silently (date-range-picker.ts:983). Document: a partial range is "valid" for writeValue but not for commit-via-calendar.
  4. **No validator integration** — the picker does not register `NG_VALIDATORS`. The calendar's validator does not flow up. A consumer who needs `calendarMinDate` errors on a range-picker control gets nothing from the framework; they must wire their own. Consider promoting `calendarValidator` to operate against `TwDateRange<D>` or expose a `provideDateRangePickerValidator()`.

## Tests
- Spec file: yes — `date-range-picker.spec.ts` (25K, **46 it blocks**, 14 describe blocks).
- Coverage breakdown:
  - Rendering: default mount, each size, each color, `role="combobox"`, composed/custom placeholder, formatted endpoints, partial-range placeholder.
  - Disabled: `aria-disabled`, prevents opening.
  - Required: `aria-required`.
  - Clear button: hidden/shown, commits null with `source='clear'`, hidden when `showClear=false`.
  - Overlay: open on click, escape + restore, `role="dialog" aria-modal="true"`.
  - Layout: two-month default, single-month with `numberOfMonths=1`.
  - Calendar interaction.
  - Presets: rendered when non-empty, click commits + emits `presetSelected`.
  - Time mode: not rendered when `showTime=false`.
  - CVA: reactive, template-driven, `setDisabledState`, plain-object `writeValue`.
  - Form-field integration: control registration + auto-naked variant.
  - Keyboard: Alt+ArrowDown opens.
  - `writeValue` edge cases: empty range normalised to null, partial range round-trip.
- Vitest issues: zero `fakeAsync`/`tick`.
- Findings:
  1. **No locale tests.**
  2. **`showTime=true` is not tested.** Tests only assert the negative ("not rendered when false"). The two-time-picker layout, time-of-day commits, partial-range behavior with time, validation when end-time < start-time on same day — all uncovered.
  3. **Presets that throw / fall outside constraints not tested.** `onPresetClick` has a try/catch + a `liveAnnouncer.announce` path (date-range-picker.ts:1181–1196).
  4. **No `rangeClickBehavior` test** — calendar default `'restart'` is the only path exercised.
  5. **No keyboard test for the preset list** (because there's no keyboard support — see A11y finding #2).
  6. **No DST / leap-year / cross-year range test.**
  7. **No `aria-hidden` violation guard** — should fail if a future change re-adds the hidden interactive button.
  8. **No signal-forms test.**
  9. **No `activePresetId` test** — when `value` matches a preset's range exactly, `aria-selected="true"` should flow to that preset's button.

## Gaps & lacks
1. **Range-mode knobs hidden from picker consumers.** `minRangeLength`, `maxRangeLength`, `allowSingleDayRange`, `persistPartialRange`, `allowBackwardRange`, `rangeClickBehavior`, `disableRangesCrossingDisabledDates` — none forwarded.
2. **No `firstDayOfWeek` input.**
3. **No `locale` input.**
4. **No `cellTemplate`/`dateClass` forwarding.**
5. **No `rangePreview`/`viewChange`/`selectionStart` propagation.**
6. **`aria-hidden="true"` on the trigger icon button (interactive)** — WAI-ARIA violation.
7. **Listbox semantics without arrow-key support** in the preset rail.
8. **`min-w-[10rem]` arbitrary value** on the preset rail.
9. **Same xl size-10 / size-3.5 / size-5 clear-target issues** as date-picker.
10. **`showClear: true` default uncodified.**
11. **`source: 'today'` is dead** — no commit path uses it.
12. **No validator integration** — `calendarValidator` does not flow up.
13. **No tests for `showTime=true`, presets edge cases, range-mode knobs, locale, signal-forms.**
14. **Deprecated `TwCalendarView`/`TwDateFilter` aliases still imported.**

## Concrete recommendations (deep-dive prompt body)

### Goal
Bring `tw-date-range-picker` to feature parity with `tw-calendar`'s range-mode surface, fix the WAI-ARIA violation on the icon button, add arrow-key navigation to the preset listbox, restore the historic locale / cell-template / range-knob pass-throughs, and cover the time-mode + range-mode knob branches with tests.

### Tasks

1. **Forward calendar range-mode knobs to the picker surface.**
   - File(s): `projects/ngx-tw/date-range-picker/date-range-picker.ts:484+` (add inputs), `date-range-picker-overlay.ts:74–89` (forward to calendar), `date-range-picker-overlay.ts:160+` (add signals to receive them).
   - Why: A consumer cannot, today, configure "minimum 3-night stay", "block backward range", or "drop partial on close" via the picker. Calendar already exposes the knobs; the picker is the public surface for most consumers.
   - Change: Add inputs (`minRangeLength`, `maxRangeLength`, `allowSingleDayRange` true-default-justified, `persistPartialRange` true-default-justified, `allowBackwardRange`, `rangeClickBehavior`, `disableRangesCrossingDisabledDates`, `firstDayOfWeek`). Forward through the overlay-signals bag and bind on the embedded calendar.
   - Acceptance: New spec — set `minRangeLength="3"`, attempt to commit a 2-day range, assert `rangeChange` not emitted + `rangeError` flag set + AXE-friendly `aria-invalid="true"`.

2. **Replace deprecated `TwCalendarView` / `TwDateFilter` imports.**
   - File(s): `projects/ngx-tw/date-range-picker/date-range-picker.ts:59-60, 374, 377, 553, 1244`.
   - Why: Same as date-picker — Phase 10 has landed; aliases are slated for removal.
   - Change: Switch to `CalendarViewState` + `DateFilterFn`.
   - Acceptance: `git grep` clean.

3. **Add `locale` input and forward to the embedded calendar.**
   - File(s): `projects/ngx-tw/date-range-picker/date-range-picker.ts:484+`, overlay signal/binding.
   - Why: Same gap as date-picker.
   - Change: `readonly locale = input<string | null>(null)`. Forward via overlay signal; bind on `<tw-calendar>`. Call `this.adapter.setLocale(locale)` when non-null to keep the trigger display in sync.
   - Acceptance: spec sets `locale="fr-FR"`, asserts the start text uses French month abbreviation.

4. **Forward `cellTemplate` and `dateClass` to the embedded calendar.**
   - File(s): `projects/ngx-tw/date-range-picker/date-range-picker.ts:484+`, `date-range-picker-overlay.ts:74–89`.
   - Why: Same gap as date-picker.
   - Change: Add inputs; forward through overlay.
   - Acceptance: new spec mounts the picker with a `cellTemplate` and asserts custom content renders inside cells.

5. **Fix WAI-ARIA violation: remove `aria-hidden` from the interactive icon button.**
   - File(s): `projects/ngx-tw/date-range-picker/date-range-picker.ts:331`.
   - Why: `aria-hidden="true"` on an interactive `<button>` is invalid; AXE flags it. The button is also redundant with the main trigger (which already covers click).
   - Change: Two options — (a) drop `aria-hidden`, keep the button (with `tabindex="-1"` and `aria-label="Open calendar"` — same as the main trigger but AT can describe it), or preferably (b) remove the secondary `<button>` entirely. Move the icon SVG inside the main trigger's `<button>` (no need for two interactive elements; mouse users click on the visible text or the icon — both should hit the same target).
   - Acceptance: AXE clean; main trigger now contains the SVG; only one button in the trigger row.

6. **Add arrow-key navigation to the preset listbox.**
   - File(s): `projects/ngx-tw/date-range-picker/date-range-picker-overlay.ts:50–71`.
   - Why: `role="listbox"` with `role="option"` items implies arrow-key keyboard model.
   - Change: Wrap the preset buttons with CDK `FocusKeyManager`. Handle Up/Down/Home/End keydown on the listbox container. Enter activates the focused option.
   - Acceptance: spec — focus the first preset, press ArrowDown, assert the second preset is focused. Press Enter, assert `rangeChange` fires.

7. **Replace `min-w-[10rem]` with a theme-aligned class.**
   - File(s): `projects/ngx-tw/date-range-picker/date-range-picker-overlay.ts:52`.
   - Why: Arbitrary values bypass the design system.
   - Change: `min-w-40` (10rem = `w-40`).
   - Acceptance: classes match exactly; no visual change.

8. **Collapse the time-mode bag** (same as date-picker task #4) into `timeConfig`.

9. **Add inline comments + step-back for the xl size + size-3.5 half-step + clear target** (parallel to date-picker tasks #5, #6, #7).

10. **Codify `showClear: true` default** with inline JSDoc justification.

11. **Remove dead `'today'` source** or wire it.
   - File(s): `projects/ngx-tw/date-range-picker/date-range-picker.ts:81` (type), `date-range-picker.ts:1248–1253` (handler).
   - Why: `DateRangePickerChangeSource` includes `'today'` but no commit path uses it (action bar's Today stages; calendar's commit uses `'calendar'`).
   - Change: Remove from the union, or have Today auto-apply when `showActions=false` (which the parallel `date-picker.ts:1150-1155` does).
   - Acceptance: type-check; tests don't break.

12. **Wire validator integration.**
   - File(s): new `projects/ngx-tw/date-range-picker/date-range-picker-validator.ts`; `date-range-picker.ts:253–258` (providers).
   - Why: Consumers using reactive forms with a `FormControl<TwDateRange | null>` and `Validators.required` get the standard `required` validator, but `calendarMinDate`, `calendarMaxDate`, `calendarDisabledDate`, `calendarInvalidRange`, `calendarRangeTooShort`, `calendarRangeTooLong` (which the calendar already emits) do not flow up.
   - Change: Add `NG_VALIDATORS` provider that runs a `dateRangeValidator` returning the same `CalendarErrorCode` map. Reuse `calendarValidator` internals where possible.
   - Acceptance: new spec mounts a reactive form with `Validators.required`, sets `minRangeLength="3"`, commits a 2-day range, asserts `control.errors.calendarRangeTooShort` is present.

13. **Round out tests: `showTime=true`, preset edge cases, locale, signal-forms, range-mode knobs.**
   - File(s): `projects/ngx-tw/date-range-picker/date-range-picker.spec.ts`.
   - Why: Coverage gaps.
   - Change: New describe blocks. For preset edge cases — test that a `range()` factory that throws renders a polite announcement and does not commit. Test that a preset whose `range()` falls outside constraints is rejected.
   - Acceptance: `npm test` green; new branches exercised.

### Out of scope
- Phase 9 `numberOfMonths: 1..12+` rewrite.
- A `<ng-template twRangePreset>` projection path (could be a follow-up after #6 lands).
- Mobile fullscreen variant of the overlay.

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Visual check: `http://localhost:4600/date-range-picker`
- A11y: AXE on the date-range-picker route, focus on the icon-button `aria-hidden` fix and the listbox keyboard model.

## Priority
**P0** — The `aria-hidden="true"` on an interactive `<button>` is a WAI-ARIA violation and will fail AXE; that alone bumps this above date-picker. Beyond that, the missing range-mode knob forwarding is a serious functional gap (consumers will reach into the internal calendar imperatively or fork it). After the icon-button fix and the range-mode forwarding, the rest is P1-tier (locale, cell-template forwarding, time-mode tests).
